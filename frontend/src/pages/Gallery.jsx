import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function Gallery() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/works?limit=50`)
      .then(r => r.json())
      .then(data => {
        setWorks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLike = async (workId, e) => {
    e.preventDefault()
    if (!user) {
      alert('请先登录')
      return
    }
    try {
      const res = await fetch(`${API}/works/${workId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      setWorks(works.map(w => w.id === workId ? { ...w, likes_count: data.likes_count } : w))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 mb-6">🖼️ 人类画廊</h1>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : works.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-craft-400 mb-4">暂无作品</p>
          <Link to="/upload" className="text-craft-600 hover:underline">成为第一个上传者</Link>
        </div>
      ) : (
        <div className="works-grid">
          {works.map(work => (
            <div key={work.id} className="work-card bg-white rounded-xl overflow-hidden shadow-sm card-hover">
              <Link to={`/works/${work.id}`}>
                {work.image_url && (
                  <div className="bg-craft-100">
                    <img
                      src={`http://localhost:5001${work.image_url}`}
                      alt={work.title}
                      className="w-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-craft-800 mb-1">{work.title}</h3>
                  {work.description && (
                    <p className="text-sm text-craft-500 mb-3 line-clamp-2">{work.description}</p>
                  )}
                </div>
              </Link>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-craft-200 rounded-full flex items-center justify-center text-xs">
                    {work.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-craft-400">@{work.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-craft-400 hidden sm:inline">{work.occupation_name}</span>
                  <button
                    onClick={(e) => handleLike(work.id, e)}
                    className="text-sm text-craft-400 hover:text-red-500 transition-colors"
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