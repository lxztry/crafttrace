import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function ExhibitDetail() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [exhibit, setExhibit] = useState(null)
  const [editing, setEditing] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    fetch(`${API}/exhibits/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/exhibition'); return }
        setExhibit(data)
        setIsPublic(!!data.is_public)
      })
      .catch(() => navigate('/exhibition'))
  }, [id, navigate])

  const handleTogglePublic = async () => {
    if (!user || exhibit.creator_id !== user.id) return
    try {
      const res = await fetch(`${API}/exhibits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: user.id, is_public: isPublic ? 0 : 1 })
      })
      const data = await res.json()
      if (!data.error) {
        setExhibit(e => ({ ...e, is_public: isPublic ? 0 : 1 }))
        setIsPublic(!isPublic)
      }
    } catch (err) { console.error(err) }
  }

  if (!exhibit) return <div className="text-center py-12 text-craft-400">加载中...</div>

  const isOwner = user && exhibit.creator_id === user.id

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-craft-400 text-sm mb-4 hover:text-craft-600">
        ← 返回展览馆
      </button>

      {/* Avatar & Name */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-4 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-craft-100 flex items-center justify-center text-3xl mb-4 overflow-hidden">
          {exhibit.avatar_url ? (
            <img src={exhibit.avatar_url.startsWith('http') ? exhibit.avatar_url : `http://localhost:5001${exhibit.avatar_url}`}
              alt={exhibit.name} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = exhibit.name[0]; }} />
          ) : (
            <span>{exhibit.name[0]}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-craft-800 mb-1">{exhibit.name}</h1>
        {exhibit.identity && <p className="text-craft-400 mb-3">{exhibit.identity}</p>}
        {exhibit.is_preset ? (
          <span className="inline-block px-3 py-1 bg-craft-100 text-craft-600 rounded-full text-xs">系统预设展品</span>
        ) : isOwner ? (
          <span className="inline-block px-3 py-1 bg-craft-50 text-craft-400 rounded-full text-xs">我的展品</span>
        ) : null}
      </div>

      {/* Story */}
      {exhibit.story && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="font-semibold text-craft-700 mb-3">📖 人物故事</h2>
          <p className="text-craft-600 leading-relaxed whitespace-pre-wrap">{exhibit.story}</p>
        </div>
      )}

      {/* Personality */}
      {exhibit.personality && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="font-semibold text-craft-700 mb-3">🎭 性格特点</h2>
          <p className="text-craft-600 leading-relaxed">{exhibit.personality}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-craft-600">{exhibit.chat_count || 0}</div>
          <div className="text-sm text-craft-400">对话次数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className={`text-2xl font-bold ${exhibit.is_public ? 'text-green-600' : 'text-craft-400'}`}>
            {exhibit.is_public ? '已公开' : '私密'}
          </div>
          <div className="text-sm text-craft-400">可见性</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link to={`/exhibits/${id}/chat`}
          className="block w-full py-3 bg-craft-600 text-white text-center rounded-xl font-medium hover:bg-craft-700 transition-colors">
          💬 与 {exhibit.name} 对话
        </Link>

        {isOwner && (
          <button
            onClick={handleTogglePublic}
            className="w-full py-3 bg-white border border-craft-300 text-craft-600 text-center rounded-xl font-medium hover:bg-craft-50 transition-colors">
            {isPublic ? '🔒 设为私密' : '🌍 公开展览'}
          </button>
        )}
      </div>
    </div>
  )
}