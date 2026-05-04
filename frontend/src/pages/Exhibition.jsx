import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

export default function Exhibition() {
  const [exhibits, setExhibits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch(`${API}/exhibits?is_public=1`)
      .then(r => r.json())
      .then(data => {
        setExhibits(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = searchQuery.trim()
    ? exhibits.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.identity || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : exhibits

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-8 mb-6">
        <h1 className="text-3xl font-bold text-craft-700 dark:text-craft-100 mb-2">🏛️ 人类展览馆</h1>
        <p className="text-craft-500 dark:text-craft-400">每个人都是时代的展品。走进这里，与历史对话。</p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-craft-400">
          <span>📦 {exhibits.length} 件展品</span>
          <span>💬 {exhibits.reduce((a, e) => a + (e.chat_count || 0), 0)} 次对话</span>
        </div>
      </div>

      {/* Search + Quick entry */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <div className="relative w-full max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-craft-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索展品..."
              className="search-input pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-craft-400 hover:text-craft-600 text-sm"
              >✕</button>
            )}
          </div>
          <div className="flex gap-3">
            <Link to="/exhibits/create" className="px-5 py-2.5 bg-craft-600 text-white rounded-xl font-medium hover:bg-craft-700 transition-colors text-sm whitespace-nowrap">
              + 创建展品
            </Link>
            <Link to="/profile" className="px-5 py-2.5 bg-white dark:bg-craft-700 border border-craft-300 dark:border-craft-600 text-craft-600 dark:text-craft-300 rounded-xl font-medium hover:bg-craft-50 dark:hover:bg-craft-600 transition-colors text-sm whitespace-nowrap">
              我的展品
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(ex => (
            <Link key={ex.id} to={`/exhibits/${ex.id}`}
              className="bg-white dark:bg-craft-700 rounded-xl p-4 shadow-sm card-hover text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-craft-100 dark:bg-craft-600 flex items-center justify-center text-2xl mb-3">
                {ex.avatar_url ? (
                  <img src={ex.avatar_url.startsWith('http') ? ex.avatar_url : `http://localhost:5001${ex.avatar_url}`}
                    alt={ex.name} className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = ex.name[0]; }} />
                ) : (
                  <span className="text-craft-600 dark:text-craft-200">{ex.name[0]}</span>
                )}
              </div>
              <h3 className="font-semibold text-craft-800 dark:text-craft-100 text-sm mb-1">{ex.name}</h3>
              {ex.identity && <p className="text-xs text-craft-400 dark:text-craft-400 line-clamp-1 mb-2">{ex.identity}</p>}
              <div className="flex justify-center items-center gap-2 text-xs text-craft-400 dark:text-craft-400">
                <span>💬 {ex.chat_count || 0}</span>
                {ex.is_preset && <span className="px-1.5 py-0.5 bg-craft-100 dark:bg-craft-600 rounded text-xs">预设</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-craft-400">
          <div className="text-4xl mb-4">🏛️</div>
          <p>{searchQuery ? '未找到匹配的展品' : '还没有展品'}</p>
          <p className="text-sm mt-2">{searchQuery ? '' : '成为第一个创建展品的人'}</p>
          {!searchQuery && <Link to="/exhibits/create" className="mt-4 inline-block text-craft-600 dark:text-craft-400 hover:underline">创建展品 →</Link>}
        </div>
      )}
    </div>
  )
}