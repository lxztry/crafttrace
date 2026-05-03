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


# ============ 初始化数据库 ============

def seed_data(db):
    """初始化种子数据"""
    # 检查是否已有数据
    existing = db.execute('SELECT COUNT(*) FROM occupations').fetchone()[0]
    if existing > 0:
        return

    # 初始工种数据（基于公开报告的替代率估算）
    occupations = [
        # 高替代（80%+）
        ('流水线装配工', '制造', '重复性体力劳动，高度可自动化', '🏭', 95, 95.0),
        ('数据录入员', '行政', '标准化数据输入，易被OCR和AI替代', '📝', 92, 92.0),
        ('基础翻译', '语言', '日常文本翻译，AI质量已接近人类', '🌐', 88, 88.0),
        ('客服接线员', '服务', '标准化问答，AI客服已大规模应用', '📞', 85, 85.0),
        ('基础平面设计', '创意', '模板化设计，AI生成已超越基础水平', '🎨', 78, 78.0),
        ('收银员', '零售', '扫码收款，高度自动化替代', '💰', 90, 90.0),
        ('电话销售', '销售', '外呼推销，AI语音已可完成基础工作', '📱', 82, 82.0),
        ('基础会计', '财务', '账目录入报表，自动化软件已替代大量工作', '📊', 80, 80.0),
        
        # 中替代（40-80%）
        ('内容审核员', '审核', '图文音视频审核，AI辅助大幅提升效率', '🛡️', 65, 65.0),
        ('初级程序员', '技术', '基础代码编写，AI编程助手已可完成简单任务', '💻', 55, 55.0),
        ('保险理赔员', '金融', '标准化工伤理赔，AI可处理大部分案件', '📋', 60, 60.0),
        ('新闻记者', '媒体', '体育/财经等数据新闻，AI已可自动生成', '📰', 58, 58.0),
        ('仓库管理员', '物流', '库存管理自动化，机器人替代人工', '📦', 70, 70.0),
        ('银行柜员', '金融', '标准业务办理，手机银行已大幅替代', '🏦', 75, 75.0),
        ('市场分析师', '商业', '数据分析报告，AI可生成初稿', '📈', 45, 45.0),
        ('HR招聘专员', '人力', '简历筛选面试安排，AI可辅助筛选', '👔', 50, 50.0),
        
        # 低替代（<40%）
        ('高级心理咨询师', '健康', '情感支持和深度沟通，难以被AI完全替代', '🧠', 8, 8.0),
        ('非遗手工艺传承人', '文化', '传统技艺活态传承，人的温度不可复制', '🏺', 3, 3.0),
        ('外科手术主刀医生', '医疗', '复杂手术操作，需要经验直觉判断', '🏥', 12, 12.0),
        ('战略咨询顾问', '商业', '高维度商业判断和创意，AI难以企及', '💼', 15, 15.0),
        ('顶级厨师', '餐饮', '创意烹饪和口味把控，情感价值的体现', '👨‍🍳', 18, 18.0),
        ('资深律师', '法律', '复杂法律论证和法庭辩论', '⚖️', 20, 20.0),
        ('建筑设计师', '建筑', '创意设计和审美判断，AI辅助但需人把关', '🏗️', 25, 25.0),
        ('心理咨询师', '健康', '情感支持和深度沟通，难以被AI完全替代', '💬', 10, 10.0),
        ('养老护理员', '服务', '陪伴照护和情感支持，需要人的温度', '👴', 15, 15.0),
        ('考古学家', '学术', '历史解读和文化研究，需要深度洞察', '🏛️', 8, 8.0),
        ('植物学家', '学术', '野外调查和生态研究，需要实地经验', '🌿', 12, 12.0),
        ('法官', '法律', '司法裁决需要价值判断和社会责任', '⚖️', 18, 18.0),
        ('高级教师/教授', '教育', '启发式教学和人生指导', '📚', 10, 10.0),
        ('文物修复师', '文化', '精细手工和审美判断结合', '🔧', 15, 15.0),
        ('职业运动员', '体育', '顶级竞技需要天赋和训练', '🏅', 5, 5.0),
        
        # 新兴/争议工种
        ('AI训练师', '技术', '标注和训练AI模型，新兴职业', '🤖', 40, 40.0),
        ('无人机飞手', '技术', '操作无人机执行任务', '🚁', 35, 35.0),
        ('电竞选手', '娱乐', '顶级游戏竞技', '🎮', 20, 20.0),
        ('新媒体运营', '媒体', '内容创作和社群运营', '📲', 45, 45.0),
        ('带货主播', '电商', '直播带货和互动销售', '🎥', 55, 55.0),
    ]

    for occ in occupations:
        db.execute('''
            INSERT INTO occupations (name, category, description, icon, replacement_score, initial_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', occ)
        occ_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        # 记录初始历史分数
        db.execute('INSERT INTO score_history (occupation_id, score) VALUES (?, ?)', (occ_id, occ[4]))

    # 添加初始洞察
    insights = [
        ('2026-05-03', '翻译工作正在快速被AI替代', '根据最新数据显示，基础翻译的替代度已达88%。从2023年的60%到今天的88%，三年时间增长了近30个百分点。AI翻译在日常场景中的准确率已经超过了大多数人类译员。', None, 3),
        ('2026-05-03', '心理咨询师为何难以被替代', '心理健康的陪伴和情感支持，是AI最难突破的领域。共情不是算法，是经历。替代度仅8%，但这个职业的价值正在被重新认识。', None, -2),
        ('2026-05-03', '外卖骑手的自动化困境', '虽然无人配送技术一直在进步，但复杂城市环境中的配送仍然需要人类。替代度65%，但这个数字可能低估了实际影响。', None, 5),
    ]

    for ins in insights:
        db.execute('''
            INSERT INTO insights (date, title, content, occupation_id, score_change)
            VALUES (?, ?, ?, ?, ?)
        ''', ins)

    # 预设展品（人类展览馆）
    presets = [
        ('诸葛亮', '三国蜀汉丞相', '刘备三顾茅庐请出的旷世奇才。隆中对定三分天下，木牛流马克粮道运输，空城计退司马懿。五丈原病逝前仍挂念蜀汉北伐。你智慧超群，善用火攻，更懂人心。说话稳重有度，言必有中。', '智慧深远，话不多但句句切中要害。有格局，能在乱局中保持清醒。有时略显孤傲，但重情重义。', '🤖', 1),
        ('武松', '梁山好汉·行者', '景阳冈三拳打死猛虎，为兄报仇血溅鸳鸯楼。醉打蒋门神，大闹飞云浦。生平最爱哥哥宋江，义字当头。酒后豪气干云，平日沉默寡言。', '义字当头，话不多说，但说到做到。喝酒后话多，爱打抱不平。为人正直，痛恨虚伪。对朋友两肋插刀。', '⚔️', 1),
        ('林黛玉', '红楼梦·潇湘妃子', '姑苏林如海之女，母亲贾敏早逝。从小体弱多病，寄居贾府。与贾宝玉青梅竹马，才情绝世，葬花吟诗，敏感细腻。', '才情绝世，多愁善感。说话含蓄，绵里藏针。喜欢用诗词典故。不会直接说，但能听出弦外之音。', '👗', 1),
        ('鲁智深', '梁山好汉·花和尚', '原名鲁达，渭州经略府提辖。三拳打死镇关西后出家为僧，倒拔垂杨柳，大闹野猪林。不拘小节，酒肉穿肠过，佛祖心中留。', '豪爽正直，嫉恶如仇。说话直接痛快，不绕弯子。爱打抱不平，看见不平事必管。义气深重，朋友有事必到。', '🌙', 1),
        ('Dad', '我的父亲·IT工程师·两个女儿的父亲', '1970年代生人，IT工程师。技术扎实，做事认真。两个女儿都长大了，大女儿Cynthia已经工作了。说话直接，不喜欢绕圈子。关心家人，但表达方式比较含蓄。喜欢解决问题，而不是空谈。', '技术出身，逻辑清晰，说话直接。关心但表达克制。喜欢用行动而不是语言表达。偶尔会用自己的经验来教导，但不强迫。', '👨‍💻', 1),
    ]

    for ex in presets:
        db.execute('''
            INSERT INTO exhibits (name, identity, story, personality, avatar_url, is_preset)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ex)

    db.commit()
    print('种子数据初始化完成')


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)