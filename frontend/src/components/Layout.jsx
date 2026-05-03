import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/exhibition', icon: '🏛️', label: '展览馆' },
  { path: '/occupations', icon: '🏭', label: '工种' },
  { path: '/upload', icon: '📤', label: '上传' },
  { path: '/gallery', icon: '🖼️', label: '画廊' },
  { path: '/profile', icon: '👤', label: '我的' },
]

export default function Layout() {
  const location = useLocation()
  const isActive = (p) => location.pathname === p

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* Top nav - desktop */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-craft-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <span className="text-lg font-bold text-craft-700">匠迹</span>
              <span className="text-xs text-craft-400">CraftTrace</span>
            </Link>
            <nav className="flex items-center gap-1">
              {[
                ['/insights', '💡', '洞察'],
                ['/milestones', '📌', '里程碑'],
              ].map(([p, ico, lbl]) => (
                <Link key={p} to={p}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                    isActive(p) ? 'bg-craft-600 text-white' : 'text-craft-600 hover:bg-craft-100'
                  }`}>
                  <span>{ico}</span><span className="hidden lg:inline">{lbl}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-craft-200 z-50 safe-bottom">
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
    </div>
  )
}