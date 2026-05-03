import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function WorkDetail() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [work, setWork] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetch(`${API}/works/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/gallery'); return }
        setWork(data)
        setComments(data.comments || [])
      })
      .catch(() => navigate('/gallery'))

    if (user) {
      // Check if liked - simple approach: just show heart
      setLiked(false)
    }
  }, [id, user, navigate])

  const handleLike = async () => {
    if (!user) { alert('请先登录'); return }
    const res = await fetch(`${API}/works/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    })
    const data = await res.json()
    setWork(w => ({ ...w, likes_count: data.likes_count }))
    setLiked(data.liked)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) { alert('请先登录'); return }
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/works/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: newComment.trim() })
      })
      const comment = await res.json()
      setComments([comment, ...comments])
      setNewComment('')
    } catch (err) { alert('评论失败') }
    finally { setSubmitting(false) }
  }

  if (!work) return <div className="text-center py-12 text-craft-400">加载中...</div>

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-craft-400 text-sm mb-4 hover:text-craft-600">
        ← 返回
      </button>

      {/* Image */}
      {work.image_url && (
        <div className="rounded-xl overflow-hidden mb-4 bg-craft-100">
          <img
            src={`http://localhost:5001${work.image_url}`}
            alt={work.title}
            className="w-full max-h-96 object-contain"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
        <h1 className="text-xl font-bold text-craft-800 mb-2">{work.title}</h1>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-craft-200 rounded-full flex items-center justify-center text-sm">
            {work.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-sm font-medium text-craft-700">@{work.username}</div>
            <div className="text-xs text-craft-400">{work.created_at?.slice(0, 10)}</div>
          </div>
          <Link to={`/occupations/${work.occupation_id}`}
            className="ml-auto px-3 py-1 bg-craft-100 text-craft-600 rounded-full text-xs">
            {work.occupation_name}
          </Link>
        </div>

        {work.description && (
          <p className="text-craft-600 leading-relaxed mb-4">{work.description}</p>
        )}

        {work.tags && (
          <div className="flex flex-wrap gap-1 mb-4">
            {work.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">#{tag}</span>
            ))}
          </div>
        )}

        {/* Like */}
        <div className="flex items-center gap-4 pt-3 border-t border-craft-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition-colors ${
              liked ? 'text-red-500' : 'text-craft-400 hover:text-red-500'
            }`}
          >
            {liked ? '❤️' : '🤍'} {work.likes_count}
          </button>
          <span className="text-sm text-craft-400">{comments.length} 评论</span>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-craft-700 mb-4">💬 评论</h2>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleComment} className="mb-5">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              className="w-full px-3 py-2 border border-craft-200 rounded-xl text-sm focus:outline-none focus:border-craft-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-craft-600 text-white text-sm rounded-lg disabled:opacity-50"
              >
                {submitting ? '发送中...' : '发送评论'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-craft-400 mb-4">登录后可评论</p>
        )}

        {/* Comment list */}
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 bg-craft-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-craft-600">
                {c.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-craft-700">{c.username}</span>
                  <span className="text-xs text-craft-400">{c.created_at?.slice(0, 10)}</span>
                </div>
                <p className="text-sm text-craft-600">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-craft-400 py-4">还没有评论，来抢沙发</p>
          )}
        </div>
      </div>
    </div>
  )
}