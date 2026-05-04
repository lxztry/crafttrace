# 匠迹 (CraftTrace) - 人类工作数字档案馆 + AI替代进程追踪器

> 记录人类的痕迹，追踪AI的脚步

## 🎯 项目简介

匠迹是一个关注AI时代人类职业命运的开放平台。我们追踪各行各业被AI替代的进程，同时记录人类工作者不可替代的价值与温度。

**核心问题**：你的职业还能干多少年？

## ✨ v0.6 新功能 (2026-05-04)

### 多主题视觉系统
4套可切换主题风格，一键切换，全站联动：
- 🌿 **古典人文** - 暖棕宣纸色，朱砂点缀，书卷气
- ⚪ **现代匠人** - 纯白极简，muji风格
- 🌑 **赛博数据** - 深空蓝黑，霓虹辉光，科技感
- 🏛️ **当代东方** - 故宫靛蓝，琉璃黄，传统文化

### AI职业分析报告
点击任意工种 → 第4个Tab「AI分析报告」，包含：
- 🔥 职业类型标签（AI原新生 / AI共舞型 / 人类坚守型 / 高危替代型）
- 💰 薪资范围 / 🎓 学历要求 / 📊 入门难度 / ⏱️ 经验要求
- 🎯 核心技能雷达图
- 🤖 AI擅长 vs 🧑 人类优势 对比分析
- 📈 成长路径时间线（入门→中级→专家）
- 🚀 相邻转型岗位推荐（匹配度+薪资）

### 全局搜索
- `⌘K` / `Ctrl+K` 呼出全局搜索
- 支持工种和展品搜索

### 全新职业数据
- 25个工种含完整AI分析字段
- 新增AI原新生职业：提示词工程师、AI产品经理、机器学习工程师、数据科学家、AI伦理师、生成式AI艺术家、RPA开发者

## 📂 项目结构

```
crafttrace/
├── frontend/          # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/        # 页面组件
│       ├── components/   # 公共组件（Layout, TrendChart）
│       └── index.css    # CSS变量主题系统
├── backend/           # Flask + SQLite
│   └── app.py         # API服务
└── docs/              # GitHub Pages 静态文件
```

## 🚀 快速启动

### 本地开发

**后端**：
```bash
cd backend
pip install flask flask-cors
python app.py
# API: http://localhost:5001
```

**前端**：
```bash
cd frontend
npm install
npm run dev
# 前端: http://localhost:5173/crafttrace/
```

### GitHub Pages 访问

**线上地址**：https://lxztry.github.io/crafttrace/

> 前端静态部署在 `frontend/dist/`，后端需本地运行

## 📡 API 文档

| 接口 | 说明 |
|------|------|
| `GET /api/stats` | 全局统计数据 |
| `GET /api/occupations` | 工种列表 |
| `GET /api/occupations/<id>` | 工种详情 |
| `GET /api/occupations/<id>/analysis` | AI分析报告（含技能/成长路径/转型建议） |
| `GET /api/works` | 作品列表 |
| `GET /api/exhibits` | 展品列表 |
| `POST /api/exhibits/<id>/chat` | AI对话 |

## 🛠️ 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + Vite + TailwindCSS + React Router |
| 后端 | Flask + SQLite |
| 样式 | CSS变量主题系统（多主题切换） |
| 部署 | GitHub Pages (前端) |

## 📊 数据说明

- **替代度评分**：社区投票平均分，反映该职业被AI替代的当前可能性
- **趋势**：up（替代加速）/ down（更需人类）/ stable（相对稳定）
- **AI分析报告**：基于公开数据和趋势的AI对该职业影响的分析（仅供参考）

## 🔒 隐私声明

所有数据均为公开信息聚合，不涉及个人隐私。用户作品和账号信息仅保存在本地数据库中。

## 📄 License

MIT