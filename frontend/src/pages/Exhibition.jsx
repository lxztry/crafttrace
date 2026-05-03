import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

export default function Exhibition() {
  const [exhibits, setExhibits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/exhibits?is_public=1`)
      .then(r => r.json())
      .then(data => {
        setExhibits(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-8 mb-6">
        <h1 className="text-3xl font-bold text-craft-700 mb-2">🏛️ 人类展览馆</h1>
        <p className="text-craft-500">每个人都是时代的展品。走进这里，与历史对话。</p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-craft-400">
          <span>📦 {exhibits.length} 件展品</span>
          <span>💬 {exhibits.reduce((a, e) => a + (e.chat_count || 0), 0)} 次对话</span>
        </div>
      </div>

      {/* Quick entry */}
      <div className="flex justify-center gap-3 mb-8">
        <Link to="/exhibits/create" className="px-5 py-2.5 bg-craft-600 text-white rounded-xl font-medium hover:bg-craft-700 transition-colors text-sm">
          + 创建展品
        </Link>
        <Link to="/profile" className="px-5 py-2.5 bg-white border border-craft-300 text-craft-600 rounded-xl font-medium hover:bg-craft-50 transition-colors text-sm">
          我的展品
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {exhibits.map(ex => (
            <Link key={ex.id} to={`/exhibits/${ex.id}`}
              className="bg-white rounded-xl p-4 shadow-sm card-hover text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-craft-100 flex items-center justify-center text-2xl mb-3">
                {ex.avatar_url ? (
                  <img src={ex.avatar_url.startsWith('http') ? ex.avatar_url : `http://localhost:5001${ex.avatar_url}`}
                    alt={ex.name} className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = ex.name[0]; }} />
                ) : (
                  <span>{ex.name[0]}</span>
                )}
              </div>
              <h3 className="font-semibold text-craft-800 text-sm mb-1">{ex.name}</h3>
              {ex.identity && <p className="text-xs text-craft-400 line-clamp-1 mb-2">{ex.identity}</p>}
              <div className="flex justify-center items-center gap-2 text-xs text-craft-400">
                <span>💬 {ex.chat_count || 0}</span>
                {ex.is_preset && <span className="px-1.5 py-0.5 bg-craft-100 rounded text-xs">预设</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {exhibits.length === 0 && !loading && (
        <div className="text-center py-12 text-craft-400">
          <div className="text-4xl mb-4">🏛️</div>
          <p>还没有展品</p>
          <p className="text-sm mt-2">成为第一个创建展品的人</p>
          <Link to="/exhibits/create" className="mt-4 inline-block text-craft-600 hover:underline">创建展品 →</Link>
        </div>
      )}
    </div>
  )
}