#!/usr/bin/env python3
"""
每日洞察生成脚本
Cron: 0 8 * * * python /path/to/generate_insights.py
需要环境变量: AI_API_KEY (AI接口密钥)
"""
import sys, os, sqlite3, json, re
from datetime import date, timedelta

sys.stdout.reconfigure(encoding='utf-8')

API_KEY = os.environ.get('AI_API_KEY', '')
DB_PATH = os.path.join(os.path.dirname(__file__), 'crafttrace.db')

def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db

def get_recent_changes():
    """从数据库聚合近期的替代度变化"""
    db = get_db()
    # 今日变化：对比昨天和今天的平均替代度
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    rows = db.execute("""
        SELECT o.id, o.name, o.replacement_score as today_score, o.trend,
               s.score as yesterday_score
        FROM occupations o
        LEFT JOIN score_history s ON o.id = s.occupation_id
            AND s.recorded_at = ?
        WHERE o.replacement_score IS NOT NULL
        ORDER BY o.replacement_score DESC
        LIMIT 10
    """, (yesterday,)).fetchall()

    changes = []
    for r in rows:
        diff = 0
        if r['today_score'] and r['yesterday_score']:
            diff = round(r['today_score'] - r['yesterday_score'], 1)
        changes.append({
            'name': r['name'],
            'score': r['today_score'],
            'change': diff,
            'trend': r['trend']
        })

    db.close()
    return changes

def call_ai(prompt, api_key=None):
    """调用AI生成洞察文字"""
    key = api_key or API_KEY
    if not key:
        return None

    try:
        import urllib.request
        payload = json.dumps({
            'model': 'gpt-4o-mini',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 400,
            'temperature': 0.7
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {key}'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f'AI调用失败: {e}')
        return None

def generate_insights():
    """生成每日洞察并写入数据库"""
    changes = get_recent_changes()
    if not changes:
        print('无数据变化，跳过生成')
        return []

    # 按变化分组
    rising = [c for c in changes if c['change'] > 0]
    falling = [c for c in changes if c['change'] < 0]
    hot_jobs = [c for c in changes if c['score'] >= 70]

    # 构造提示词
    changes_text = '\n'.join([
        f"- {c['name']}: {c['score']}% ({'+' if c['change'] > 0 else ''}{c['change']}%)"
        for c in changes[:8]
    ])

    prompt = f"""你是「匠迹」的AI洞察分析师。请根据以下今日职业替代度数据，生成一篇300字以内的中文洞察文章。

要求：
- 语言生动，有数据支撑
- 突出1-2个最重要的趋势
- 给出简短建议
- 格式：标题（18字内）+ 正文
- 不要使用markdown格式

今日数据：
{changes_text}
"""

    content = call_ai(prompt)
    if not content:
        # Fallback: 使用模板生成
        title = f"今日洞察：{len(rising)}个职业替代度上升"
        content = generate_fallback_insight(changes)

    # 解析标题（取第一行作为标题）
    lines = content.split('\n')
    title = lines[0].strip() if lines else "今日职业洞察"
    body = '\n'.join(lines[1:]).strip() if len(lines) > 1 else content

    # 写入数据库
    db = get_db()
    today = date.today().isoformat()
    db.execute("""
        INSERT INTO insights (date, title, content, occupation_id, score_change)
        VALUES (?, ?, ?, NULL, ?)
    """, (today, title[:50], body[:500], sum(c['change'] for c in changes if c['change'] > 0)))
    db.commit()
    db.close()

    print(f'洞察已生成并写入: {title}')
    return [{'title': title, 'content': body}]

def generate_fallback_insight(changes):
    """模板生成（无AI密钥时使用）"""
    rising = [c for c in changes if c['change'] > 0]
    falling = [c for c in changes if c['change'] < 0]

    title = f"今日洞察：{len(rising)}个职业替代度上升"

    parts = []
    if rising:
        names = '、'.join([c['name'] for c in rising[:3]])
        parts.append(f"今日{rising[0]['name']}等{rising[0]['score']}%替代度职业继续保持上升趋势，{names}替代度均有所提升。")
    if falling:
        names = '、'.join([c['name'] for c in falling[:2]])
        parts.append(f"{names}等职业因人类需求稳定，替代度略有下降。")

    body = ' '.join(parts) if parts else "今日各职业替代度整体平稳。"
    return title + '\n' + body

if __name__ == '__main__':
    print(f'[{date.today()}] 开始生成每日洞察...')
    results = generate_insights()
    for r in results:
        print(f"  标题: {r['title']}")
