import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/exhibition', icon: '🏛️', label: '展览馆' },
  { path: '/occupations', icon: '🏭', label: '工种' },
  { path: '/upload', icon: '📤', label: '上传' },
  { path: '/gallery', icon: '🖼️', label: '画廊' },
  { path: '/leaderboard', icon: '🏆', label: '排行' },
  { path: '/profile', icon: '👤', label: '我的' },
]

const THEMES = [
  {
    id: 'classical',
    name: '古典人文',
    icon: '🌿',
    colors: {
      '--bg-start': '#f8f6f3',
      '--bg-end': '#e8dfd0',
      '--surface': '#ffffff',
      '--surface-2': '#f5f0e8',
      '--primary': '#a67f50',
      '--primary-dark': '#8a6640',
      '--primary-light': '#cdb99a',
      '--text': '#3d3027',
      '--text-2': '#6e5135',
      '--text-3': '#b8996e',
      '--border': '#e2d6c6',
      '--accent': '#c0392b',
      '--accent-2': '#27ae60',
      '--accent-3': '#f39c12',
      '--shadow': 'rgba(166,127,80,0.12)',
      '--card-hover': 'rgba(166,127,80,0.15)',
    }
  },
  {
    id: 'modern',
    name: '现代匠人',
    icon: '⚪',
    colors: {
      '--bg-start': '#fafafa',
      '--bg-end': '#f0f0f0',
      '--surface': '#ffffff',
      '--surface-2': '#f8f8f8',
      '--primary': '#2c2c2c',
      '--primary-dark': '#1a1a1a',
      '--primary-light': '#8c8c8c',
      '--text': '#1a1a1a',
      '--text-2': '#555555',
      '--text-3': '#999999',
      '--border': '#e0e0e0',
      '--accent': '#c8a96e',
      '--accent-2': '#6b8e23',
      '--accent-3': '#7a7a7a',
      '--shadow': 'rgba(0,0,0,0.06)',
      '--card-hover': 'rgba(0,0,0,0.06)',
    }
  },
  {
    id: 'cyber',
    name: '赛博数据',
    icon: '🌑',
    colors: {
      '--bg-start': '#0a0e17',
      '--bg-end': '#0f1522',
      '--surface': '#111827',
      '--surface-2': '#1a2235',
      '--primary': '#00d4ff',
      '--primary-dark': '#00a8cc',
      '--primary-light': '#4dd8e8',
      '--text': '#e2e8f0',
      '--text-2': '#94a3b8',
      '--text-3': '#475569',
      '--border': '#1e2d45',
      '--accent': '#ff3366',
      '--accent-2': '#00ff88',
      '--accent-3': '#9b59b6',
      '--shadow': 'rgba(0,212,255,0.1)',
      '--card-hover': 'rgba(0,212,255,0.12)',
    }
  },
  {
    id: 'oriental',
    name: '当代东方',
    icon: '🏛️',
    colors: {
      '--bg-start': '#f5f0e8',
      '--bg-end': '#e8dfc8',
      '--surface': '#ffffff',
      '--surface-2': '#f0ebe0',
      '--primary': '#2c4a7c',
      '--primary-dark': '#1e3660',
      '--primary-light': '#6b8fc4',
      '--text': '#2d3a4f',
      '--text-2': '#5a6b80',
      '--text-3': '#8c9db5',
      '--border': '#cdb99a',
      '--accent': '#d4a017',
      '--accent-2': '#2e7d4a',
      '--accent-3': '#8b4513',
      '--shadow': 'rgba(44,74,124,0.1)',
      '--card-hover': 'rgba(44,74,124,0.12)',
    }
  },
]

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', themeId)
}

const ThemeModal = ({ open, onClose }) => {
  const [current, setCurrent] = useState(() => localStorage.getItem('crafttrace_theme') || 'classical')

  useEffect(() => {
    if (!open) return
    const stored = localStorage.getItem('crafttrace_theme') || 'classical'
    setCurrent(stored)
  }, [open])

  const select = (id) => {
    setCurrent(id)
    localStorage.setItem('crafttrace_theme', id)
    applyTheme(id)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-craft-200">
          <h3 className="text-lg font-semibold text-craft-800">选择风格主题</h3>
          <p className="text-xs text-craft-400 mt-1">不同主题，不同氛围</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                current === t.id
                  ? 'border-craft-600 bg-craft-50'
                  : 'border-craft-200 hover:border-craft-400'
              }`}
            >
              {/* 颜色预览圆 */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: `linear-gradient(135deg, ${t.colors['--bg-start']} 50%, ${t.colors['--primary']} 50%)` }}>
                {t.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-craft-700">{t.icon} {t.name}</div>
              </div>
              {/* 色彩条 */}
              <div className="flex gap-0.5 w-full rounded-full overflow-hidden">
                <div className="h-1 flex-1" style={{ background: t.colors['--bg-start'] }} />
                <div className="h-1 flex-1" style={{ background: t.colors['--primary'] }} />
                <div className="h-1 flex-1" style={{ background: t.colors['--accent'] }} />
                <div className="h-1 flex-1" style={{ background: t.colors['--text'] }} />
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2 bg-craft-600 text-white rounded-xl text-sm">关闭</button>
        </div>
      </div>
    </div>
  )
}

const SearchModal = ({ open, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ occupations: [], exhibits: [] })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) { setResults({ occupations: [], exhibits: [] }); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [occ, exh] = await Promise.all([
          fetch(`http://localhost:5001/api/occupations`).then(r => r.json()),
          fetch(`http://localhost:5001/api/exhibits?is_public=1`).then(r => r.json()),
        ])
        const q = query.toLowerCase()
        setResults({
          occupations: Array.isArray(occ) ? occ.filter(o => o.name.toLowerCase().includes(q)).slice(0, 5) : [],
          exhibits: Array.isArray(exh) ? exh.filter(e => e.name.toLowerCase().includes(q) || (e.identity || '').toLowerCase().includes(q)).slice(0, 5) : [],
        })
      } catch {}
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!open) return null

  const go = (path) => { onClose(); navigate(path) }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-craft-200">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索工种、展品..."
            className="search-input"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-craft-400 text-sm">搜索中...</div>}
          {!loading && query && results.occupations.length === 0 && results.exhibits.length === 0 && (
            <div className="p-6 text-center text-craft-400 text-sm">未找到相关结果</div>
          )}
          {!loading && results.occupations.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-craft-400 font-medium">工种</div>
              {results.occupations.map(o => (
                <button key={o.id} onClick={() => go(`/occupations/${o.id}`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-craft-50 text-left transition-colors">
                  <span className="text-xl">{o.icon || '⚙️'}</span>
                  <div>
                    <div className="text-sm font-medium text-craft-800">{o.name}</div>
                    <div className="text-xs text-craft-400">{o.category} · 替代度{o.replacement_score}%</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loading && results.exhibits.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs text-craft-400 font-medium">展品</div>
              {results.exhibits.map(e => (
                <button key={e.id} onClick={() => go(`/exhibits/${e.id}`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-craft-50 text-left transition-colors">
                  <span className="text-xl">{e.name[0]}</span>
                  <div>
                    <div className="text-sm font-medium text-craft-800">{e.name}</div>
                    <div className="text-xs text-craft-400">{e.identity}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!query && (
            <div className="p-6 text-center text-craft-400 text-sm">输入关键词搜索工种和展品</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const isActive = (p) => location.pathname === p
  const [showSearch, setShowSearch] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('crafttrace_theme') || 'classical')

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('crafttrace_theme') || 'classical'
    setCurrentTheme(saved)
    applyTheme(saved)
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') { setShowSearch(false); setShowTheme(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentThemeData = THEMES.find(t => t.id === currentTheme) || THEMES[0]

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* Top nav - desktop */}
      <header className="hidden md:block sticky top-0 z-50 header-bg backdrop-blur border-b header-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <span className="text-lg font-bold text-craft-700">匠迹</span>
              <span className="text-xs text-craft-400 hidden lg:inline">CraftTrace</span>
            </Link>

            {/* Search bar */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-craft-50 border border-craft-200 rounded-full text-sm text-craft-400 hover:border-craft-400 transition-colors max-w-xs"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">搜索工种、展品...</span>
              <kbd className="hidden sm:inline text-xs bg-craft-200 px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
            </button>

            <nav className="flex items-center gap-1">
              {[
                ['/insights', '💡', '洞察'],
                ['/milestones', '📌', '里程碑'],
                ['/leaderboard', '🏆', '排行'],
              ].map(([p, ico, lbl]) => (
                <Link key={p} to={p}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    isActive(p) ? 'bg-craft-600 text-white' : 'text-craft-600 hover:bg-craft-100'
                  }`}>
                  <span>{ico}</span><span className="hidden lg:inline">{lbl}</span>
                </Link>
              ))}
              {/* Theme picker button */}
              <button
                onClick={() => setShowTheme(true)}
                className="ml-2 w-9 h-9 flex items-center justify-center rounded-lg text-craft-500 hover:bg-craft-100 transition-colors text-lg"
                title="切换主题"
              >
                {currentThemeData.icon}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 header-bg backdrop-blur border-b header-border">
        <div className="flex items-center justify-between h-13 px-3 py-2">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-lg">🏛️</span>
            <span className="font-bold text-craft-700">匠迹</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-craft-50 text-craft-400 text-sm"
            >
              🔍
            </button>
            <button
              onClick={() => setShowTheme(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-craft-50 text-craft-500 text-sm"
            >
              {currentThemeData.icon}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 header-bg border-t header-border z-50 safe-bottom">
        <div className="flex">
          {NAV.map(({ path, icon, label }) => (
            <Link key={path} to={path}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive(path) ? 'text-craft-600' : 'text-craft-400'
              }`}>
              <span className="text-lg">{icon}</span>
              <span className="mt-0.5">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop footer */}
      <footer className="hidden md:block border-t border-craft-200 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-craft-400 text-sm">
          <p>匠迹 (CraftTrace) — 记录人类的痕迹，追踪AI的脚步</p>
          <p className="mt-1 text-xs">技术进步无法替代的，是人的温度</p>
        </div>
      </footer>

      {/* Modals */}
      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
      <ThemeModal open={showTheme} onClose={() => setShowTheme(false)} />
    </div>
  )
}

export { THEMES }