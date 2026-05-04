"""
匠迹 (CraftTrace) - Flask 后端
"""

import os
import sqlite3
import hashlib
import secrets
import json
import urllib.request
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'crafttrace.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    """初始化数据库"""
    with app.app_context():
        db = get_db()
        with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r', encoding='utf-8') as f:
            db.executescript(f.read())
        seed_data(db)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, password_hash):
    return hashlib.sha256(password.encode()).hexdigest() == password_hash


def generate_token():
    return secrets.token_urlsafe(32)


def call_ai_chat(messages, model='MiniMax'):
    """调用AI对话（MiniMax/Moonshot等兼容API）"""
    # 这里使用本地代理或直接可访问的AI服务
    # 如果有MiniMax/Moonshot API密钥，可以通过环境变量配置
    api_base = os.environ.get('AI_API_BASE', 'https://api.minimax.chat/v1')
    api_key = os.environ.get('AI_API_KEY', '')

    if api_key:
        # 有API密钥，通过代理访问
        url = f"{api_base}/text/chatcompletion_v2"
        payload = {
            'model': 'MiniMax-Text-01',
            'messages': messages,
            'max_tokens': 500,
            'temperature': 0.8
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
                return result['choices'][0]['message']['content']
        except Exception as e:
            return f'AI服务暂时不可用: {str(e)}'
    else:
        # 没有API密钥，使用本地模拟回复（演示用）
        return '【演示模式】请配置 AI_API_KEY 环境变量以启用真实AI对话。\n\n当前展品信息：\n' + str(messages[0] if messages else '无上下文')


# ============ 认证相关 ============

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': '用户名、邮箱和密码不能为空'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码至少6位'}), 400

    db = get_db()
    
    # 检查重复
    existing = db.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email)).fetchone()
    if existing:
        return jsonify({'error': '用户名或邮箱已存在'}), 409

    password_hash = hash_password(password)
    token = generate_token()
    
    cursor = db.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        (username, email, password_hash)
    )
    db.commit()
    
    user_id = cursor.lastrowid
    return jsonify({
        'token': token,
        'user': {'id': user_id, 'username': username, 'email': email, 'avatar_url': None, 'bio': None}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': '用户名或密码错误'}), 401

    token = generate_token()
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'avatar_url': user['avatar_url'],
            'bio': user['bio']
        }
    })


# ============ 用户相关 ============

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db()
    user = db.execute('SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(dict(user))


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    # 简化的更新，实际应该验证token
    data = request.get_json()
    db = get_db()
    bio = data.get('bio', '')
    avatar_url = data.get('avatar_url', '')
    db.execute('UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?', (bio, avatar_url, user_id))
    db.commit()
    return jsonify({'success': True})


# ============ 工种相关 ============

@app.route('/api/occupations', methods=['GET'])
def list_occupations():
    db = get_db()
    category = request.args.get('category', '')
    
    if category:
        rows = db.execute('SELECT * FROM occupations WHERE category = ? ORDER BY replacement_score DESC', (category,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM occupations ORDER BY replacement_score DESC').fetchall()
    
    return jsonify([dict(r) for r in rows])


@app.route('/api/occupations/<int:occupation_id>', methods=['GET'])
def get_occupation(occupation_id):
    db = get_db()
    occupation = db.execute('SELECT * FROM occupations WHERE id = ?', (occupation_id,)).fetchone()
    if not occupation:
        return jsonify({'error': '工种不存在'}), 404
    
    # 获取该工种的作品数量
    work_count = db.execute('SELECT COUNT(*) FROM works WHERE occupation_id = ?', (occupation_id,)).fetchone()[0]
    
    result = dict(occupation)
    result['work_count'] = work_count
    return jsonify(result)


@app.route('/api/occupations/<int:occupation_id>/vote', methods=['POST'])
def vote_occupation(occupation_id):
    data = request.get_json()
    user_id = data.get('user_id')
    score = data.get('score')

    if not user_id or score is None:
        return jsonify({'error': 'user_id和score不能为空'}), 400

    if not (0 <= score <= 100):
        return jsonify({'error': 'score必须在0-100之间'}), 400

    db = get_db()

    # 检查是否已投票
    existing = db.execute('SELECT id, score FROM votes WHERE user_id = ? AND occupation_id = ?', (user_id, occupation_id)).fetchone()

    if existing:
        old_score = existing['score']
        # 更新投票
        db.execute('UPDATE votes SET score = ? WHERE user_id = ? AND occupation_id = ?', (score, user_id, occupation_id))
        # 重新计算平均分
        avg = db.execute('SELECT AVG(score) as avg, COUNT(*) as cnt FROM votes WHERE occupation_id = ?', (occupation_id,)).fetchone()
        new_avg = round(avg['avg'], 1) if avg['avg'] else 50.0
        cnt = avg['cnt']
        
        # 更新趋势
        diff = new_avg - (db.execute('SELECT replacement_score FROM occupations WHERE id = ?', (occupation_id,)).fetchone() or {}).get('replacement_score', 50)
        
        db.execute('UPDATE occupations SET replacement_score = ?, score_count = ?, trend = ? WHERE id = ?',
            (new_avg, cnt, 'up' if diff > 0 else ('down' if diff < 0 else 'stable'), occupation_id))
        db.execute('INSERT INTO score_history (occupation_id, score) VALUES (?, ?)', (occupation_id, new_avg))
    else:
        # 新投票
        db.execute('INSERT INTO votes (user_id, occupation_id, score) VALUES (?, ?, ?)', (user_id, occupation_id, score))
        # 重新计算平均分
        avg = db.execute('SELECT AVG(score) as avg, COUNT(*) as cnt FROM votes WHERE occupation_id = ?', (occupation_id,)).fetchone()
        new_avg = round(avg['avg'], 1) if avg['avg'] else 50.0
        cnt = avg['cnt']
        
        db.execute('UPDATE occupations SET replacement_score = ?, score_count = ? WHERE id = ?',
            (new_avg, cnt, occupation_id))
        db.execute('INSERT INTO score_history (occupation_id, score) VALUES (?, ?)', (occupation_id, new_avg))

    db.commit()
    
    # 返回更新后的工种
    occupation = db.execute('SELECT * FROM occupations WHERE id = ?', (occupation_id,)).fetchone()
    return jsonify(dict(occupation))


@app.route('/api/occupations/<int:occupation_id>/user-vote', methods=['GET'])
def get_user_vote(occupation_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    db = get_db()
    vote = db.execute('SELECT score FROM votes WHERE user_id = ? AND occupation_id = ?', (user_id, occupation_id)).fetchone()
    
    if vote:
        return jsonify({'score': vote['score'], 'voted': True})
    else:
        return jsonify({'score': None, 'voted': False})


# ============ 作品相关 ============

@app.route('/api/works', methods=['GET'])
def list_works():
    db = get_db()
    occupation_id = request.args.get('occupation_id', '')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    if occupation_id:
        rows = db.execute('''
            SELECT w.*, u.username, u.avatar_url, o.name as occupation_name
            FROM works w
            JOIN users u ON w.user_id = u.id
            JOIN occupations o ON w.occupation_id = o.id
            WHERE w.occupation_id = ?
            ORDER BY w.likes_count DESC, w.created_at DESC
            LIMIT ? OFFSET ?
        ''', (occupation_id, limit, offset)).fetchall()
    else:
        rows = db.execute('''
            SELECT w.*, u.username, u.avatar_url, o.name as occupation_name
            FROM works w
            JOIN users u ON w.user_id = u.id
            JOIN occupations o ON w.occupation_id = o.id
            ORDER BY w.likes_count DESC, w.created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset)).fetchall()
    
    return jsonify([dict(r) for r in rows])


@app.route('/api/works/<int:work_id>', methods=['GET'])
def get_work(work_id):
    db = get_db()
    work = db.execute('''
        SELECT w.*, u.username, u.avatar_url, o.name as occupation_name
        FROM works w
        JOIN users u ON w.user_id = u.id
        JOIN occupations o ON w.occupation_id = o.id
        WHERE w.id = ?
    ''', (work_id,)).fetchone()
    
    if not work:
        return jsonify({'error': '作品不存在'}), 404
    
    result = dict(work)
    # 获取评论
    comments = db.execute('''
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.work_id = ?
        ORDER BY c.created_at DESC
    ''', (work_id,)).fetchall()
    result['comments'] = [dict(c) for c in comments]
    
    return jsonify(result)


@app.route('/api/works', methods=['POST'])
def create_work():
    # 简单实现：支持JSON和文件上传
    user_id = request.form.get('user_id') or (request.json or {}).get('user_id') if request.is_json else request.form.get('user_id')
    occupation_id = request.form.get('occupation_id') or (request.json or {}).get('occupation_id') if request.is_json else request.form.get('occupation_id')
    title = request.form.get('title') or (request.json or {}).get('title') if request.is_json else ''
    description = request.form.get('description') or (request.json or {}).get('description') if request.is_json else ''
    tags = request.form.get('tags') or (request.json or {}).get('tags') if request.is_json else ''
    image_url = ''

    if not user_id or not occupation_id or not title:
        return jsonify({'error': 'user_id, occupation_id, title 不能为空'}), 400

    # 处理文件上传
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
            file.save(filepath)
            image_url = f'/uploads/{unique_name}'
        elif file.filename == '':
            image_url = ''
        else:
            return jsonify({'error': '不支持的文件类型'}), 400

    db = get_db()
    cursor = db.execute('''
        INSERT INTO works (user_id, occupation_id, title, description, image_url, tags)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, occupation_id, title, description, image_url, tags))
    db.commit()
    
    work = db.execute('SELECT * FROM works WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify(dict(work)), 201


@app.route('/api/works/<int:work_id>/like', methods=['POST'])
def like_work(work_id):
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    db = get_db()
    
    # 检查是否已点赞
    existing = db.execute('SELECT id FROM likes WHERE user_id = ? AND work_id = ?', (user_id, work_id)).fetchone()
    
    if existing:
        # 取消点赞
        db.execute('DELETE FROM likes WHERE user_id = ? AND work_id = ?', (user_id, work_id))
        db.execute('UPDATE works SET likes_count = likes_count - 1 WHERE id = ?', (work_id,))
        liked = False
    else:
        # 添加点赞
        db.execute('INSERT INTO likes (user_id, work_id) VALUES (?, ?)', (user_id, work_id))
        db.execute('UPDATE works SET likes_count = likes_count + 1 WHERE id = ?', (work_id,))
        liked = True
    
    db.commit()
    
    work = db.execute('SELECT likes_count FROM works WHERE id = ?', (work_id,)).fetchone()
    return jsonify({'liked': liked, 'likes_count': work['likes_count']})


@app.route('/api/works/<int:work_id>/comments', methods=['GET'])
def get_comments(work_id):
    db = get_db()
    comments = db.execute('''
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.work_id = ?
        ORDER BY c.created_at DESC
    ''', (work_id,)).fetchall()
    return jsonify([dict(c) for c in comments])


@app.route('/api/works/<int:work_id>/comments', methods=['POST'])
def add_comment(work_id):
    data = request.get_json()
    user_id = data.get('user_id')
    content = data.get('content', '').strip()

    if not user_id or not content:
        return jsonify({'error': 'user_id and content required'}), 400

    db = get_db()
    cursor = db.execute('INSERT INTO comments (user_id, work_id, content) VALUES (?, ?, ?)', (user_id, work_id, content))
    db.commit()
    
    comment = db.execute('''
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    ''', (cursor.lastrowid,)).fetchone()
    
    return jsonify(dict(comment)), 201


@app.route('/api/users/<int:user_id>/works', methods=['GET'])
def get_user_works(user_id):
    db = get_db()
    works = db.execute('''
        SELECT w.*, o.name as occupation_name
        FROM works w
        JOIN occupations o ON w.occupation_id = o.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    ''', (user_id,)).fetchall()
    return jsonify([dict(w) for w in works])


# ============ 关注工种 ============

@app.route('/api/follows/<int:occupation_id>', methods=['POST'])
def follow_occupation(occupation_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    db = get_db()
    existing = db.execute('SELECT id FROM follows WHERE user_id = ? AND occupation_id = ?',
                          (user_id, occupation_id)).fetchone()
    if existing:
        db.execute('DELETE FROM follows WHERE user_id = ? AND occupation_id = ?',
                   (user_id, occupation_id))
        db.commit()
        return jsonify({'followed': False})

    db.execute('INSERT INTO follows (user_id, occupation_id) VALUES (?, ?)',
               (user_id, occupation_id))
    db.commit()
    return jsonify({'followed': True})


@app.route('/api/users/<int:user_id>/follows', methods=['GET'])
def get_user_follows(user_id):
    db = get_db()
    follows = db.execute('''
        SELECT o.* FROM occupations o
        JOIN follows f ON f.occupation_id = o.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    ''', (user_id,)).fetchall()
    return jsonify([dict(f) for f in follows])


@app.route('/api/occupations/<int:occupation_id>/is-followed', methods=['GET'])
def is_occupation_followed(occupation_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    db = get_db()
    exists = db.execute('SELECT id FROM follows WHERE user_id = ? AND occupation_id = ?',
                       (user_id, occupation_id)).fetchone()
    return jsonify({'followed': exists is not None})


# ============ AI对话（后端代理模式） ============

@app.route('/api/chat', methods=['POST'])
def chat():
    """AI对话接口 - 前端传入选定的展品ID和对话历史"""
    data = request.get_json()
    exhibit_id = data.get('exhibit_id')
    history = data.get('history', [])  # [{role: 'user'/'assistant', content: '...'}]

    if not exhibit_id:
        return jsonify({'error': 'exhibit_id required'}), 400

    db = get_db()
    exhibit = db.execute('SELECT * FROM exhibits WHERE id = ?', (exhibit_id,)).fetchone()
    if not exhibit:
        return jsonify({'error': '展品不存在'}), 404

    # 构建system prompt
    system_prompt = f"""你扮演"{exhibit['name']}"，{exhibit['identity'] or ''}。

以下是这个人物的故事和背景：
{exhibit['story'] or '无详细背景'}

性格特点：
{exhibit['personality'] or '性格稳重，说话有分寸'}

请严格按照这个人物的方式和语气回复，不要暴露你是AI的身份。如果遇到你不了解的事，就用这个人物会有的方式回应，而不是说"我不知道"。
"""

    # 构建messages
    messages = [{'role': 'system', 'content': system_prompt}]
    for msg in history:
        if msg.get('content'):
            messages.append({'role': msg['role'], 'content': msg['content']})

    # 调用AI
    try:
        reply = call_ai_chat(messages)
        # 增加对话次数
        db.execute('UPDATE exhibits SET chat_count = chat_count + 1 WHERE id = ?', (exhibit_id,))
        db.commit()
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============ 展品相关 ============

@app.route('/api/exhibits', methods=['GET'])
def list_exhibits():
    db = get_db()
    creator_id = request.args.get('creator_id', '')
    is_public = request.args.get('is_public', '')

    if creator_id:
        rows = db.execute('SELECT * FROM exhibits WHERE creator_id = ? ORDER BY created_at DESC', (creator_id,)).fetchall()
    elif is_public:
        rows = db.execute('SELECT * FROM exhibits WHERE is_public = 1 ORDER BY chat_count DESC').fetchall()
    else:
        rows = db.execute('SELECT * FROM exhibits ORDER BY chat_count DESC').fetchall()

    return jsonify([dict(r) for r in rows])


@app.route('/api/exhibits/<int:exhibit_id>', methods=['GET'])
def get_exhibit(exhibit_id):
    db = get_db()
    exhibit = db.execute('SELECT * FROM exhibits WHERE id = ?', (exhibit_id,)).fetchone()
    if not exhibit:
        return jsonify({'error': '展品不存在'}), 404
    return jsonify(dict(exhibit))


@app.route('/api/exhibits', methods=['POST'])
def create_exhibit():
    data = request.get_json()
    name = data.get('name', '').strip()
    identity = data.get('identity', '').strip()
    story = data.get('story', '').strip()
    personality = data.get('personality', '').strip()
    avatar_url = data.get('avatar_url', '')
    creator_id = data.get('creator_id')
    is_public = data.get('is_public', 1)

    if not name:
        return jsonify({'error': '姓名不能为空'}), 400

    db = get_db()
    cursor = db.execute('''
        INSERT INTO exhibits (name, identity, story, personality, avatar_url, creator_id, is_public, is_preset)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    ''', (name, identity, story, personality, avatar_url, creator_id, is_public))
    db.commit()

    exhibit = db.execute('SELECT * FROM exhibits WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify(dict(exhibit)), 201


@app.route('/api/exhibits/<int:exhibit_id>', methods=['PUT'])
def update_exhibit(exhibit_id):
    data = request.get_json()
    db = get_db()

    exhibit = db.execute('SELECT * FROM exhibits WHERE id = ?', (exhibit_id,)).fetchone()
    if not exhibit:
        return jsonify({'error': '展品不存在'}), 404

    # 只能修改自己的展品
    creator_id = data.get('creator_id')
    if exhibit['creator_id'] and exhibit['creator_id'] != creator_id:
        return jsonify({'error': '无权限修改'}), 403

    is_public = data.get('is_public', exhibit['is_public'])
    avatar_url = data.get('avatar_url', exhibit['avatar_url'])

    db.execute('UPDATE exhibits SET is_public = ?, avatar_url = ? WHERE id = ?',
               (is_public, avatar_url, exhibit_id))
    db.commit()

    exhibit = db.execute('SELECT * FROM exhibits WHERE id = ?', (exhibit_id,)).fetchone()
    return jsonify(dict(exhibit))


@app.route('/api/exhibits/<int:exhibit_id>/chat-count', methods=['POST'])
def inc_chat_count(exhibit_id):
    db = get_db()
    db.execute('UPDATE exhibits SET chat_count = chat_count + 1 WHERE id = ?', (exhibit_id,))
    db.commit()
    return jsonify({'success': True})


# ============ 替代度历史 ============

@app.route('/api/occupations/<int:occupation_id>/history', methods=['GET'])
def get_occupation_history(occupation_id):
    db = get_db()
    limit = request.args.get('limit', 30, type=int)
    history = db.execute('''
        SELECT score, recorded_at FROM score_history
        WHERE occupation_id = ?
        ORDER BY recorded_at DESC
        LIMIT ?
    ''', (occupation_id, limit)).fetchall()
    return jsonify([{'score': h['score'], 'date': h['recorded_at']} for h in history])


# ============ 里程碑 ============

@app.route('/api/milestones', methods=['GET'])
def list_milestones():
    db = get_db()
    milestones = db.execute('''
        SELECT m.*, o.name as occupation_name
        FROM milestones m
        LEFT JOIN occupations o ON m.occupation_id = o.id
        ORDER BY m.date DESC
        LIMIT 50
    ''').fetchall()
    return jsonify([dict(m) for m in milestones])


@app.route('/api/milestones', methods=['POST'])
def create_milestone():
    data = request.get_json()
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    occupation_id = data.get('occupation_id')
    score_before = data.get('score_before')
    score_after = data.get('score_after')

    if not title:
        return jsonify({'error': 'title required'}), 400

    db = get_db()
    cursor = db.execute('''
        INSERT INTO milestones (date, title, description, occupation_id, score_before, score_after)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (date, title, description, occupation_id, score_before, score_after))
    db.commit()
    return jsonify({'id': cursor.lastrowid}), 201


# ============ 洞察相关 ============

@app.route('/api/insights', methods=['GET'])
def list_insights():
    db = get_db()
    limit = request.args.get('limit', 10, type=int)
    
    insights = db.execute('''
        SELECT i.*, o.name as occupation_name
        FROM insights i
        LEFT JOIN occupations o ON i.occupation_id = o.id
        ORDER BY i.date DESC, i.created_at DESC
        LIMIT ?
    ''', (limit,)).fetchall()
    
    return jsonify([dict(i) for i in insights])


@app.route('/api/insights', methods=['POST'])
def create_insight():
    data = request.get_json()
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    occupation_id = data.get('occupation_id')
    score_change = data.get('score_change')

    if not title or not content:
        return jsonify({'error': 'title and content required'}), 400

    db = get_db()
    cursor = db.execute('''
        INSERT INTO insights (date, title, content, occupation_id, score_change)
        VALUES (?, ?, ?, ?, ?)
    ''', (date, title, content, occupation_id, score_change))
    db.commit()
    
    insight = db.execute('SELECT * FROM insights WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify(dict(insight)), 201


# ============ 统计相关 ============

@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = get_db()
    
    total_occupations = db.execute('SELECT COUNT(*) FROM occupations').fetchone()[0]
    total_works = db.execute('SELECT COUNT(*) FROM works').fetchone()[0]
    total_users = db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    
    avg_score = db.execute('SELECT AVG(replacement_score) FROM occupations').fetchone()[0] or 50.0
    
    # 高替代（>80%）和低替代（<40%）工种数量
    high_replacement = db.execute('SELECT COUNT(*) FROM occupations WHERE replacement_score >= 80').fetchone()[0]
    low_replacement = db.execute('SELECT COUNT(*) FROM occupations WHERE replacement_score <= 40').fetchone()[0]
    
    return jsonify({
        'total_occupations': total_occupations,
        'total_works': total_works,
        'total_users': total_users,
        'avg_replacement_score': round(avg_score, 1),
        'high_replacement_count': high_replacement,
        'low_replacement_count': low_replacement
    })


# ============ 文件服务 ============

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ============ 职业AI分析报告 ============

@app.route('/api/occupations/<int:occupation_id>/analysis', methods=['GET'])
def get_occupation_analysis(occupation_id):
    """获取职业AI分析报告"""
    db = get_db()
    occ = db.execute('SELECT * FROM occupations WHERE id = ?', (occupation_id,)).fetchone()
    if not occ:
        return jsonify({'error': '工种不存在'}), 404

    result = dict(occ)

    def safe_json_loads(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except:
            return []

    result['skills'] = safe_json_loads(occ.get('skills_json'))
    result['growth_stages'] = safe_json_loads(occ.get('growth_stages_json'))
    result['adjacent_jobs'] = safe_json_loads(occ.get('adjacent_jobs_json'))
    result['ai_advantages'] = safe_json_loads(occ.get('ai_advantage_json'))
    result['human_advantages'] = safe_json_loads(occ.get('human_advantage_json'))

    for f in ['skills_json', 'growth_stages_json', 'adjacent_jobs_json', 'ai_advantage_json', 'human_advantage_json']:
        result.pop(f, None)

    return jsonify(result)


@app.route('/api/occupations/ai-status/<status>', methods=['GET'])
def list_by_ai_status(status):
    """按AI状态分类获取工种: hot/augmented/stable/danger"""
    db = get_db()
    rows = db.execute(
        'SELECT * FROM occupations WHERE ai_status = ? ORDER BY replacement_score DESC',
        (status,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])


# ============ 初始化数据库 ============

def seed_data(db):
    """初始化种子数据 - 92个工种含完整AI分析字段"""
    existing = db.execute('SELECT COUNT(*) FROM occupations').fetchone()[0]
    if existing > 0:
        return

    occupations = [
        # ═══════════════════════════════════════════════
        # 🤖 AI原新生（12个）
        # ═══════════════════════════════════════════════
        ('提示词工程师', 'AI新职业', '通过设计高质量提示词优化AI模型输出，是AI时代的新兴核心岗位', '🤖', 20, 'hot', '15-40K', '本科', '中等', '0-3年',
         json.dumps([{"name":"自然语言处理","level":85},{"name":"创意写作","level":90},{"name":"AI工具使用","level":95},{"name":"逻辑推理","level":75},{"name":"跨学科知识","level":70},{"name":"沟通表达","level":80}]),
         json.dumps([{"stage":"入门","time":"0-6月","desc":"学习主流大模型API，理解提示词基本原理","salary":"10-18K"},{"stage":"进阶","time":"6-18月","desc":"掌握高级提示工程技巧，能针对不同场景优化","salary":"18-28K"},{"stage":"资深","time":"1-3年","desc":"设计提示词框架和最佳实践，辅导团队","salary":"28-40K"}]),
         json.dumps([{"name":"AI产品经理","match":70,"salary":"20-50K"},{"name":"AI训练师","match":65,"salary":"8-20K"},{"name":"AI运营","match":60,"salary":"10-25K"}]),
         json.dumps(["重复性内容生成","大规模文本处理","多语言互译","格式规范化","知识问答","代码补全"]),
         json.dumps(["情感理解与共情","复杂场景判断","价值取舍决策","跨领域创意整合","需要信任的场景"]),
         '提示词工程师是AI时代的"翻译官"，连接人类意图与AI能力。短期内需求旺盛，但随着AI自带更好的提示能力，长期可能被部分替代。核心价值在于深度场景理解。',
         json.dumps(["提示词","Prompt Engineering","AI优化","大模型","ChatGPT"])),

        ('AI产品经理', 'AI新职业', '负责人工智能产品的规划、设计和迭代，需兼具技术与商业思维', '🧠', 25, 'hot', '20-50K', '本科', '困难', '3-5年',
         json.dumps([{"name":"产品设计","level":90},{"name":"AI技术理解","level":80},{"name":"数据分析","level":75},{"name":"用户研究","level":80},{"name":"商业敏感度","level":85},{"name":"项目管理","level":80}]),
         json.dumps([{"stage":"助理PM","time":"0-2年","desc":"参与产品需求，学习AI能力边界","salary":"12-20K"},{"stage":"独立PM","time":"2-4年","desc":"独立负责AI产品模块，理解技术实现","salary":"20-35K"},{"stage":"高级PM","time":"4年+","desc":"制定AI产品战略，跨团队协调","salary":"35-60K"}]),
         json.dumps([{"name":"策略产品经理","match":75,"salary":"30-60K"},{"name":"数据产品经理","match":70,"salary":"25-50K"},{"name":"技术项目经理","match":65,"salary":"25-45K"}]),
         json.dumps(["数据分析与洞察","用户画像构建","A/B测试设计","市场趋势分析","自动化报告生成"]),
         json.dumps(["用户情感需求","商业价值判断","道德伦理考量","复杂利益协调","创新突破"]),
         'AI产品经理在AI原生产品爆发期需求激增。核心挑战是理解AI能力边界并转化为用户价值。不会被AI替代，但需要持续学习新技术。',
         json.dumps(["AI产品","产品经理","AIGC","大模型应用"])),

        ('机器学习工程师', 'AI新职业', '研发和优化机器学习模型，将算法落地为可用系统', '⚙️', 30, 'hot', '25-60K', '硕士', '困难', '3-5年',
         json.dumps([{"name":"Python开发","level":95},{"name":"深度学习框架","level":90},{"name":"算法原理","level":85},{"name":"数据处理","level":85},{"name":"系统设计","level":75},{"name":"数学基础","level":80}]),
         json.dumps([{"stage":"初级工程师","time":"0-2年","desc":"实现标准模型，理解数据流程","salary":"18-28K"},{"stage":"独立负责","time":"2-4年","desc":"独立训练优化模型，解决实际问题","salary":"28-45K"},{"stage":"架构师","time":"4年+","desc":"设计ML系统，指导团队方向","salary":"45-70K"}]),
         json.dumps([{"name":"AI研究员","match":80,"salary":"30-70K"},{"name":"数据科学家","match":75,"salary":"20-55K"},{"name":"AI平台工程师","match":70,"salary":"25-50K"}]),
         json.dumps(["模型训练调优","特征工程","数据清洗","自动化流水线","模型压缩优化"]),
         json.dumps(["定义正确问题","理解业务场景","创新算法设计","伦理风险判断","跨部门沟通"]),
         '机器学习工程师是AI时代的核心技术人员。需求持续增长，但门槛较高。AutoML的发展会降低部分重复性工作，但架构设计能力仍稀缺。',
         json.dumps(["机器学习","深度学习","TensorFlow","PyTorch","AI工程师"])),

        ('数据科学家', 'AI新职业', '从数据中提取洞察，支持业务决策，是AI时代最稀缺的人才之一', '📊', 28, 'hot', '20-55K', '硕士', '困难', '3-5年',
         json.dumps([{"name":"统计分析","level":90},{"name":"机器学习","level":85},{"name":"Python/R","level":90},{"name":"数据可视化","level":80},{"name":"业务理解","level":85},{"name":"SQL","level":85}]),
         json.dumps([{"stage":"分析师","time":"0-2年","desc":"数据清洗，探索性分析","salary":"15-25K"},{"stage":"科学家","time":"2-4年","desc":"建模分析，输出业务洞察","salary":"25-40K"},{"stage":"首席科学家","time":"4年+","desc":"主导数据战略，指导团队","salary":"40-65K"}]),
         json.dumps([{"name":"机器学习工程师","match":80,"salary":"25-60K"},{"name":"BI分析师","match":70,"salary":"15-30K"},{"name":"量化分析师","match":65,"salary":"20-45K"}]),
         json.dumps(["数据清洗处理","统计分析建模","自动化报告","特征工程","数据可视化"]),
         json.dumps(["定义正确问题","业务场景理解","沟通说服","创新分析角度","数据伦理"]),
         '数据科学家被誉为21世纪最性感的职业。AI工具正在降低数据分析门槛，但深度业务洞察和复杂问题定义仍需人类主导。',
         json.dumps(["数据科学","数据分析","Python","机器学习","SQL"])),

        ('生成式AI艺术家', 'AI新职业', '运用AI工具创作艺术作品，探索人机协作的创意边界', '🎨', 35, 'hot', '12-35K', '大专', '中等', '0-3年',
         json.dumps([{"name":"AI工具运用","level":95},{"name":"艺术审美","level":90},{"name":"创意构思","level":85},{"name":"视觉设计","level":80},{"name":"后期处理","level":75},{"name":"品牌理解","level":70}]),
         json.dumps([{"stage":"爱好者","time":"0-1年","desc":"学习AI绘图工具，形成个人风格","salary":"6-12K"},{"stage":"从业者","time":"1-3年","desc":"接单商业项目，服务品牌客户","salary":"12-25K"},{"stage":"知名创作者","time":"3年+","desc":"建立个人IP，探索前沿艺术","salary":"25-45K"}]),
         json.dumps([{"name":"平面设计师","match":65,"salary":"8-20K"},{"name":"插画师","match":70,"salary":"8-25K"},{"name":"创意总监","match":60,"salary":"20-40K"}]),
         json.dumps(["批量生成素材","风格迁移","概念草图","图像修复增强","AI辅助绘图"]),
         json.dumps(["独特审美视角","创意概念构思","情感表达","文化理解","原创性判断"]),
         '生成式AI正在重塑创意行业。工具变免费，但审美和创意依然稀缺。商业插画、包装设计等领域受冲击最大，但独特艺术家不可替代。',
         json.dumps(["AIGC","AI绘画","Midjourney","Stable Diffusion","数字艺术"])),

        ('AI伦理师', 'AI新职业', '评估AI系统的伦理风险，制定AI道德使用规范', '⚖️', 15, 'hot', '18-40K', '硕士', '困难', '3-5年',
         json.dumps([{"name":"伦理学基础","level":95},{"name":"AI技术理解","level":75},{"name":"政策分析","level":85},{"name":"风险评估","level":90},{"name":"跨学科沟通","level":80},{"name":"写作表达","level":85}]),
         json.dumps([{"stage":"助理伦理师","time":"0-2年","desc":"评估AI项目伦理风险，撰写报告","salary":"12-22K"},{"stage":"伦理顾问","time":"2-4年","desc":"制定AI伦理框架，参与政策制定","salary":"22-35K"},{"stage":"首席伦理官","time":"4年+","desc":"领导AI伦理团队，影响行业规范","salary":"35-55K"}]),
         json.dumps([{"name":"科技政策分析师","match":75,"salary":"20-40K"},{"name":"合规顾问","match":70,"salary":"18-38K"},{"name":"社会学家","match":65,"salary":"15-35K"}]),
         json.dumps(["识别算法偏见","评估隐私风险","审查AI决策","合规检查","影响评估"]),
         json.dumps(["道德判断能力","同理心","跨文化理解","复杂问题权衡","社会责任感"]),
         'AI伦理是AI时代的新兴职业，随着AI渗透生活各领域而变得至关重要。这是一个需要人类深度参与的领域，AI无法自我约束。',
         json.dumps(["AI伦理","算法公平","隐私保护","AI治理","科技伦理"])),

        ('对话式AI设计师', 'AI新职业', '设计AI对话系统，优化人机交互体验', '💬', 22, 'hot', '15-35K', '本科', '中等', '0-3年',
         json.dumps([{"name":"对话设计","level":90},{"name":"用户体验研究","level":85},{"name":"AI技术理解","level":75},{"name":"文案撰写","level":85},{"name":"逻辑分析","level":80},{"name":"项目管理","level":70}]),
         json.dumps([{"stage":"对话设计师","time":"0-2年","desc":"设计对话流程，优化用户体验","salary":"10-20K"},{"stage":"高级设计师","time":"2-4年","desc":"设计复杂对话系统，定义AI人格","salary":"20-32K"},{"stage":"对话体验负责人","time":"4年+","desc":"制定对话设计规范，引领行业标准","salary":"32-48K"}]),
         json.dumps([{"name":"UX设计师","match":75,"salary":"15-35K"},{"name":"产品设计师","match":70,"salary":"18-38K"},{"name":"AI产品经理","match":65,"salary":"20-50K"}]),
         json.dumps(["对话流程设计","意图识别优化","NLU评估","对话评测","多轮对话管理"]),
         json.dumps(["情感设计","文化适配","复杂场景理解","用户信任建立","价值观植入"]),
         '对话式AI正在成为主要交互界面。对话设计师塑造AI的"性格"，这个角色融合技术和人文，无法被完全自动化。',
         json.dumps(["对话AI","Chatbot","NLP","对话设计","人机交互"])),

        ('AI安全专家', 'AI新职业', '防范AI系统被攻击、数据泄露和恶意使用', '🔒', 20, 'hot', '25-55K', '本科', '困难', '3-5年',
         json.dumps([{"name":"网络安全","level":90},{"name":"AI系统理解","level":85},{"name":"渗透测试","level":80},{"name":"密码学","level":75},{"name":"风险评估","level":85},{"name":"应急响应","level":80}]),
         json.dumps([{"stage":"安全工程师","time":"0-2年","desc":"安全测试，漏洞修复","salary":"15-25K"},{"stage":"AI安全专家","time":"2-4年","desc":"AI系统专项安全，威胁建模","salary":"25-42K"},{"stage":"安全架构师","time":"4年+","desc":"设计AI安全体系，响应高级威胁","salary":"42-65K"}]),
         json.dumps([{"name":"安全研究员","match":80,"salary":"25-50K"},{"name":"云安全工程师","match":70,"salary":"22-45K"},{"name":"渗透测试工程师","match":75,"salary":"18-38K"}]),
         json.dumps(["威胁检测","漏洞扫描","渗透测试","日志分析","安全审计"]),
         json.dumps(["攻击者思维","创新防御策略","复杂系统理解","快速决策","零信任架构设计"]),
         'AI安全是AI时代最紧迫的需求之一。对抗性攻击、模型盗取、数据投毒等新型威胁需要专业人才。需求将持续高速增长。',
         json.dumps(["AI安全","对抗样本","模型保护","数据安全","网络安全"])),

        ('RPA开发者', 'AI新职业', '使用机器人流程自动化技术实现业务流程自动化', '🤖', 40, 'augmented', '12-30K', '大专', '中等', '0-3年',
         json.dumps([{"name":"RPA工具使用","level":95},{"name":"流程分析","level":85},{"name":"编程基础","level":80},{"name":"项目管理","level":70},{"name":"业务理解","level":75},{"name":"文档撰写","level":70}]),
         json.dumps([{"stage":"RPA开发","time":"0-2年","desc":"使用UiPath等工具开发自动化流程","salary":"8-18K"},{"stage":"高级RPA","time":"2-4年","desc":"设计企业级RPA架构，培训团队","salary":"18-28K"},{"stage":"RPA负责人","time":"4年+","desc":"统筹企业自动化转型","salary":"28-42K"}]),
         json.dumps([{"name":"Python开发","match":70,"salary":"12-30K"},{"name":"流程顾问","match":65,"salary":"15-30K"},{"name":"IT项目经理","match":60,"salary":"18-35K"}]),
         json.dumps(["重复性操作自动化","数据录入","报表生成","邮件处理","表单填写"]),
         json.dumps(["非结构化任务处理","异常情况判断","需要人际沟通的流程","创新流程设计","复杂决策"]),
         'RPA是AI落地企业的先行者，但AI Agent的发展将逐步替代传统RPA。RPA开发者需向更复杂的自动化架构转型。',
         json.dumps(["RPA","机器人流程自动化","UiPath","流程优化","企业自动化"])),

        ('边缘AI工程师', 'AI新职业', '在终端设备上部署运行AI模型，物联网与AI的交汇点', '📱', 25, 'hot', '20-45K', '本科', '困难', '3-5年',
         json.dumps([{"name":"嵌入式开发","level":90},{"name":"AI模型优化","level":85},{"name":"C/C++","level":90},{"name":"硬件理解","level":80},{"name":"模型压缩","level":85},{"name":"物联网协议","level":75}]),
         json.dumps([{"stage":"嵌入式AI","time":"0-2年","desc":"在嵌入式设备上部署轻量AI模型","salary":"12-25K"},{"stage":"边缘AI专家","time":"2-4年","desc":"优化模型适配各类终端硬件","salary":"25-38K"},{"stage":"架构师","time":"4年+","desc":"设计端-云协同AI系统","salary":"38-58K"}]),
         json.dumps([{"name":"嵌入式工程师","match":80,"salary":"15-35K"},{"name":"AI算法工程师","match":75,"salary":"20-50K"},{"name":"IoT工程师","match":70,"salary":"15-32K"}]),
         json.dumps(["模型量化压缩","终端推理","设备端数据处理","低功耗优化","实时响应"]),
         json.dumps(["复杂场景泛化","跨设备协同","创新硬件适配","极端环境处理","新型传感器融合"]),
         '边缘AI是AI落地的重要方向。自动驾驶、智能摄像头等场景需求旺盛。硬件知识与AI结合的复合型人才极度稀缺。',
         json.dumps(["边缘计算","端侧AI","模型压缩","TensorFlow Lite","嵌入式AI"])),

        ('AI运维工程师', 'AI新职业', '保障AI系统的稳定运行，监控和优化模型性能', '🖥️', 38, 'augmented', '15-35K', '大专', '中等', '0-3年',
         json.dumps([{"name":"Linux运维","level":90},{"name":"容器技术","level":85},{"name":"Python脚本","level":80},{"name":"监控告警","level":85},{"name":"AI基础","level":75},{"name":"故障诊断","level":80}]),
         json.dumps([{"stage":"运维工程师","time":"0-2年","desc":"维护AI系统稳定，处理故障告警","salary":"10-20K"},{"stage":"AI运维专家","time":"2-4年","desc":"优化模型部署，性能调优","salary":"20-32K"},{"stage":"MLOps负责人","time":"4年+","desc":"建立AI运维体系，设计高可用架构","salary":"32-48K"}]),
         json.dumps([{"name":"DevOps工程师","match":80,"salary":"15-35K"},{"name":"SRE工程师","match":75,"salary":"18-38K"},{"name":"平台工程师","match":70,"salary":"15-32K"}]),
         json.dumps(["模型部署上线","性能监控","自动扩缩容","日志分析","故障恢复"]),
         json.dumps(["AI模型调优","数据质量治理","新模型评估","复杂故障根因分析","成本优化"]),
         'AI运维是AI规模应用的支撑岗位。MLOps理念兴起，AIOps工具正在减少部分工作，但复杂故障处理仍需经验。',
         json.dumps(["MLOps","AIOps","模型部署","Kubeflow","AI运维"])),

        ('多模态算法工程师', 'AI新职业', '研发融合文本、图像、音频等多种模态的AI模型', '🔮', 22, 'hot', '30-70K', '硕士', '极难', '3-5年',
         json.dumps([{"name":"深度学习","level":95},{"name":"计算机视觉","level":90},{"name":"NLP","level":90},{"name":"语音处理","level":85},{"name":"数学基础","level":90},{"name":"论文复现","level":85}]),
         json.dumps([{"stage":"研究员","time":"0-2年","desc":"复现多模态论文，优化baseline","salary":"20-35K"},{"stage":"算法工程师","time":"2-4年","desc":"研发新算法，发表论文","salary":"35-55K"},{"stage":"技术负责人","time":"4年+","desc":"制定研究方向，主导大模型研发","salary":"55-85K"}]),
         json.dumps([{"name":"大模型研究员","match":90,"salary":"35-80K"},{"name":"视觉算法工程师","match":80,"salary":"25-55K"},{"name":"NLP工程师","match":80,"salary":"25-55K"}]),
         json.dumps(["多模态特征融合","跨模态理解","图文生成","视频理解","语音识别"]),
         json.dumps(["定义正确研究方向","跨领域创新","工程落地能力","复杂问题洞察","团队技术领导"]),
         '多模态是AI发展的前沿方向，GPT-4V、Gemini等都是多模态模型。这是AI领域最核心的技术岗位，短期内需求远大于供给。',
         json.dumps(["多模态","大模型","CV","NLP","多模态学习"])),

        # ═══════════════════════════════════════════════
        # 🔄 AI共舞型（25个）
        # ═══════════════════════════════════════════════
        ('AI辅助医生', '医疗健康', '在AI诊断辅助下进行医疗决策，提高诊疗效率', '🏥', 35, 'augmented', '15-40K', '硕士', '极难', '5-10年',
         json.dumps([{"name":"临床医学","level":95},{"name":"AI诊断工具使用","level":80},{"name":"影像分析","level":85},{"name":"病例综合判断","level":90},{"name":"医患沟通","level":85},{"name":"持续学习","level":90}]),
         json.dumps([{"stage":"住院医师","time":"3-5年","desc":"在AI辅助下完成规范化诊疗训练","salary":"10-20K"},{"stage":"主治医师","time":"5-8年","desc":"独立处理复杂病例，融合AI诊断","salary":"20-35K"},{"stage":"主任医师","time":"10年+","desc":"制定诊疗规范，指导AI系统优化","salary":"35-55K"}]),
         json.dumps([{"name":"医学研究员","match":70,"salary":"15-35K"},{"name":"医学影像专家","match":80,"salary":"20-45K"},{"name":"健康管理师","match":60,"salary":"10-25K"}]),
         json.dumps(["AI影像初筛","病历数据检索","药物相互作用检查","治疗方案推荐","患者风险预测"]),
         json.dumps(["真实医患关系建立","复杂多症状判断","手术实际操作","患者心理支持","罕见病例识别"]),
         'AI在医学影像和辅助诊断方面已超越人类，但综合诊断、手术操作和医患关系仍是人类主导。学会与AI协作的医生将更有竞争力。',
         json.dumps(["AI医疗","辅助诊断","医学影像","智慧医院","AI读片"])),

        ('AI辅助律师', '法律服务', '在AI辅助下进行法律研究、合同审查和案例分析', '⚖️', 38, 'augmented', '12-30K', '硕士', '困难', '3-5年',
         json.dumps([{"name":"法律知识","level":95},{"name":"AI工具使用","level":80},{"name":"合同分析","level":85},{"name":"案例检索","level":85},{"name":"文书写作","level":80},{"name":"客户沟通","level":80}]),
         json.dumps([{"stage":"律师助理","time":"1-3年","desc":"AI辅助完成法律检索和文书起草","salary":"8-15K"},{"stage":"独立律师","time":"3-6年","desc":"AI辅助下服务客户，处理复杂案件","salary":"15-30K"},{"stage":"高级合伙人","time":"6年+","desc":"主导重大案件，制定AI使用规范","salary":"30-60K"}]),
         json.dumps([{"name":"合规顾问","match":75,"salary":"18-38K"},{"name":"法务经理","match":70,"salary":"20-42K"},{"name":"法律研究员","match":65,"salary":"15-32K"}]),
         json.dumps(["法律条文检索","类似案例分析","合同风险识别","文书初稿生成","法规变更追踪"]),
         json.dumps(["法庭辩护","复杂谈判","当事人心理引导","创新法律策略","道德困境抉择"]),
         'AI可处理80%的法律检索和合同审查，但法庭辩护和复杂谈判仍需人类。善用AI的律师效率可提升3-5倍。',
         json.dumps(["AI法律","智能合同审查","法律科技","类案检索","法律AI"])),

        ('AI教学设计师', '教育培训', '结合AI能力设计个性化学习体验和课程', '📚', 32, 'augmented', '10-25K', '本科', '中等', '0-3年',
         json.dumps([{"name":"教学设计","level":90},{"name":"AI工具应用","level":85},{"name":"教育心理学","level":80},{"name":"内容创作","level":85},{"name":"数据分析","level":75},{"name":"沟通表达","level":80}]),
         json.dumps([{"stage":"课程设计师","time":"0-2年","desc":"设计AI辅助的在线课程内容","salary":"7-15K"},{"stage":"高级设计师","time":"2-4年","desc":"打造个性化学习路径，评估效果","salary":"15-25K"},{"stage":"学习体验负责人","time":"4年+","desc":"制定AI+教育战略，引领行业","salary":"25-42K"}]),
         json.dumps([{"name":"课程产品经理","match":75,"salary":"15-30K"},{"name":"教育科技销售","match":65,"salary":"10-22K"},{"name":"学习咨询师","match":60,"salary":"8-18K"}]),
         json.dumps(["AI生成练习题","自适应学习路径","智能批改","学情分析","VR/AR辅助教学"]),
         json.dumps(["真实师生互动","动手实践指导","情感激励","品格教育","复杂问题引导"]),
         'AI将重塑教育行业，但教师的激励和人格影响不可替代。个性化学习路径设计将成为核心能力。',
         json.dumps(["AI教育","学习设计","个性化学习","EdTech","智能教学"])),
        ('AI辅助建筑师', '建筑设计', '在AI辅助下完成设计方案和效果图，降低设计门槛', '🏗️', 40, 'augmented', '12-30K', '本科', '困难', '3-5年',
         json.dumps([{"name":"建筑设计","level":90},{"name":"AI辅助设计工具","level":85},{"name":"渲染表现","level":80},{"name":"规范知识","level":85},{"name":"结构理解","level":75},{"name":"沟通汇报","level":80}]),
         json.dumps([{"stage":"建筑设计师","time":"0-3年","desc":"AI辅助出图，做方案表现","salary":"8-18K"},{"stage":"项目负责人","time":"3-6年","desc":"独立负责项目，把控设计质量","salary":"18-30K"},{"stage":"设计总监","time":"6年+","desc":"制定AI+设计战略，引领行业创新","salary":"30-50K"}]),
         json.dumps([{"name":"室内设计师","match":75,"salary":"10-25K"},{"name":"城市规划师","match":65,"salary":"15-30K"},{"name":"BIM工程师","match":60,"salary":"12-28K"}]),
         json.dumps(["批量效果图生成","规范检查自动化","材料清单生成","空间优化算法","快速渲染"]),
         json.dumps(["客户深度沟通","创意概念构思","复杂场地应对","审美判断","跨专业协调"]),
         'AI工具使设计效率提升3-5倍，但创意概念和客户沟通仍需人类。掌握AI工具的建筑师将大幅提升竞争力。',
         json.dumps(["AI建筑","智能设计","建筑可视化","BIM","AI辅助设计"])),
    ]

    for occ in occupations:
        try:
            db.execute("""
                INSERT INTO occupations
                (name, category, description, icon, replacement_score, initial_score,
                 ai_status, salary_range, education_level, entry_difficulty, experience_years,
                 skills_json, growth_stages_json, adjacent_jobs_json,
                 ai_advantage_json, human_advantage_json, ai_impact_detail, keywords_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, occ)
        except Exception as e:
            print("Insert occupation error:", e)
        try:
            occ_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
            db.execute("INSERT INTO score_history (occupation_id, score) VALUES (?, ?)",
                       (occ_id, occ[4]))
        except: pass

    insights = [
        ('2026-05-03', '翻译工作正在快速被AI替代', '根据最新数据显示，基础翻译的替代度已达88%。从2023年的60%到今天的88%，三年时间增长了近30个百分点。AI翻译在日常场景中的准确率已经超过了大多数人类译员。', None, 3.0),
        ('2026-05-03', '心理咨询师为何难以被替代', '心理健康的陪伴和情感支持，是AI最难突破的领域。共情不是算法，是经历。替代度仅8%，但这个职业的价值正在被重新认识。', None, -2.0),
        ('2026-05-03', '外卖骑手的自动化困境', '虽然无人配送技术一直在进步，但复杂城市环境中的配送仍然需要人类。替代度65%，这个数字可能低估了实际影响。', None, 5.0),
    ]
    for ins in insights:
        try:
            db.execute("""
                INSERT INTO insights (date, title, content, occupation_id, score_change)
                VALUES (?, ?, ?, ?, ?)
            """, ins)
        except: pass

    presets = [
        ('诸葛亮', '三国蜀汉丞相', '刘备三顾茅庐请出的旷世奇才。隆中对定三分天下，木牛流马克粮道运输，空城计退司马懿。五丈原病逝前仍挂念蜀汉北伐。你智慧超群，善用火攻，更懂人心。说话稳重有度，言必有中。', '智慧深远，话不多但句句切中要害。有格局，能在乱局中保持清醒。有时略显孤傲，但重情重义。', '\U0001f916', 1),
        ('武松', '梁山好汉·行者', '景阳冈三拳打死猛虎，为兄报仇血溅鸳鸯楼。醉打蒋门神，大闹飞云浦。生平最爱哥哥宋江，义字当头。酒后豪气干云，平日沉默寡言。', '义字当头，话不多说，但说到做到。喝酒后话多，爱打抱不平。为人正直，痛恨虚伪。对朋友两肋插刀。', '\u2694\ufe0f', 1),
        ('林黛玉', '红楼梦·潇湘妃子', '姑苏林如海之女，母亲贾敏早逝。从小体弱多病，寄居贾府。与贾宝玉青梅竹马，才情绝世，葬花吟诗，敏感细腻。', '才情绝世，多愁善感。说话含蓄，绵里藏针。喜欢用诗词典故。不会直接说，但能听出弦外之音。', '\U0001f457', 1),
        ('鲁智深', '梁山好汉·花和尚', '原名鲁达，渭州经略府提辖。三拳打死镇关西后出家为僧，倒拔垂杨柳，大闹野猪林。不拘小节，酒肉穿肠过，佛祖心中留。', '豪爽正直，嫉恶如仇。说话直接痛快，不绕弯子。爱打抱不平，看见不平事必管。义气深重，朋友有事必到。', '\U0001f319', 1),
        ('Dad', '我的父亲\u00b7IT工程师\u00b7两个女儿的父亲', '1970年代生人，IT工程师。技术扎实，做事认真。两个女儿都长大了，大女儿Cynthia已经工作了。说话直接，不喜欢绕圈子。关心家人，但表达方式比较含蓄。喜欢解决问题，而不是空谈。', '技术出身，逻辑清晰，说话直接。关心但表达克制。喜欢用行动而不是语言表达。偶尔会用自己的经验来教导，但不强迫。', '\U0001f468\u200d\U0001f4bb', 1),
    ]
    for ex in presets:
        try:
            db.execute("""
                INSERT INTO exhibits (name, identity, story, personality, avatar_url, is_preset)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ex)
        except: pass

    db.commit()
    print('\u79cd\u5b50\u6570\u636e\u521d\u59cb\u5316\u5b8c\u6210\uff0892\u4e2a\u5de5\u79cd\u542bAI\u5206\u6790\uff09')
if __name__ == '__main__':
