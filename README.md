# 匠迹 (CraftTrace)

> 记录人类的痕迹，追踪AI的脚步

## 项目概述

人类工作数字档案馆 + AI替代进程追踪器 + 人类创作者展示平台

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Python Flask
- **数据库**: SQLite

## 目录结构

```
crafttrace/
├── backend/          # Flask 后端
│   ├── app.py        # 主应用
│   ├── models.py     # 数据模型
│   ├── schema.sql    # 数据库结构
│   ├── seed_data.py  # 初始数据
│   └── uploads/      # 用户上传文件
├── frontend/         # React 前端
│   ├── src/
│   └── package.json
└── README.md
```

## 快速启动

### 后端
```bash
cd backend
pip install flask flask-cors
python app.py
# 服务运行在 http://localhost:5001
```

### 前端
```bash
cd frontend
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

## API 文档

见 backend/app.py