-- 匠迹 数据库结构
-- v2: 新增职业分析报告字段

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS occupations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    replacement_score REAL DEFAULT 50.0,
    score_count INTEGER DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initial_score REAL DEFAULT 50.0,
    -- 新增：AI分析报告字段
    ai_status TEXT DEFAULT 'unknown',        -- 'hot' 热门新生 / 'augmented' AI增强 / 'stable' 人类坚守 / 'danger' 高危
    salary_range TEXT,                        -- e.g. "8K-25K"
    education_level TEXT,                     -- '初中' '高中' '大专' '本科' '硕士' '博士'
    entry_difficulty TEXT,                    -- '简单' '中等' '困难' '极难'
    experience_years TEXT,                    -- e.g. "0-3年" "3-5年" "5-10年" "10年+"
    skills_json TEXT,                         -- JSON数组: [{"name":"沟通能力","level":80},...]
    growth_stages_json TEXT,                  -- JSON数组: [{"stage":"入门","time":"0-1年","desc":"...","salary":"6-10K"},...]
    adjacent_jobs_json TEXT,                  -- JSON数组: [{"name":"产品经理","match":75,"salary":"15-30K"},...]
    ai_advantage_json TEXT,                   -- JSON数组: AI擅长的点
    human_advantage_json TEXT,               -- JSON数组: 人类优势的点
    ai_impact_detail TEXT,                   -- AI对这个职业的具体影响描述
    keywords_json TEXT                        -- JSON数组: 搜索关键词
);

CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    occupation_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    tags TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (occupation_id) REFERENCES occupations(id)
);

CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    occupation_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, occupation_id)
);

CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    occupation_id INTEGER,
    score_change REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    UNIQUE(user_id, work_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    occupation_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, occupation_id)
);

CREATE TABLE IF NOT EXISTS score_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occupation_id INTEGER NOT NULL,
    score REAL NOT NULL,
    recorded_at DATE DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    occupation_id INTEGER,
    score_before REAL,
    score_after REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exhibits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    identity TEXT,
    story TEXT,
    personality TEXT,
    avatar_url TEXT,
    creator_id INTEGER,
    is_public INTEGER DEFAULT 1,
    is_preset INTEGER DEFAULT 0,
    chat_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);