import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function Gallery() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [likedMap, setLikedMap] = useState({})

  useEffect(() => {
    fetch(`${API}/works?limit=100`)
      .then(r => r.json())
      .then(data => {
        setWorks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = searchQuery.trim()
    ? works.filter(w =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.occupation_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : works

  const handleLike = async (workId, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { alert('请先登录'); return }
    try {
      const res = await fetch(`${API}/works/${workId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      setWorks(works.map(w => w.id === workId ? { ...w, likes_count: data.likes_count } : w))
      setLikedMap(prev => ({ ...prev, [workId]: data.liked }))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 dark:text-craft-100 mb-6">🖼️ 人类画廊</h1>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-craft-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索作品、作者、工种..."
            className="search-input pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-craft-400 hover:text-craft-600 text-sm"
            >✕</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-craft-400 mb-4">{searchQuery ? '未找到匹配的作品' : '暂无作品'}</p>
          {!searchQuery && <Link to="/upload" className="text-craft-600 dark:text-craft-400 hover:underline">成为第一个上传者</Link>}
        </div>
      ) : (
        <div className="works-grid">
          {filtered.map(work => (
            <div key={work.id} className="work-card bg-white dark:bg-craft-700 rounded-xl overflow-hidden shadow-sm card-hover">
              <Link to={`/works/${work.id}`}>
                {work.image_url && (
                  <div className="bg-craft-100 dark:bg-craft-600">
                    <img
                      src={`http://localhost:5001${work.image_url}`}
                      alt={work.title}
                      className="w-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-craft-800 dark:text-craft-100 mb-1">{work.title}</h3>
                  {work.description && (
                    <p className="text-sm text-craft-500 dark:text-craft-400 mb-3 line-clamp-2">{work.description}</p>
                  )}
                </div>
              </Link>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-craft-200 dark:bg-craft-600 rounded-full flex items-center justify-center text-xs text-craft-600 dark:text-craft-200">
                    {work.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-craft-400 dark:text-craft-400">@{work.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  {work.occupation_name && (
                    <span className="text-xs text-craft-400 dark:text-craft-400 hidden sm:inline">{work.occupation_name}</span>
                  )}
                  <button
                    onClick={(e) => handleLike(work.id, e)}
                    className={`text-sm transition-colors ${likedMap[work.id] ? 'text-red-500' : 'text-craft-400 hover:text-red-500'}`}
                  >
                    ❤️ {work.likes_count}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}