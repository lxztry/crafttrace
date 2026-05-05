import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API } from '../App'

export default function Followers() {
  const { userId } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/users/${userId}/followers`)
      .then(r => r.json())
      .then(data => { setUsers(data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="text-center py-20 text-craft-400">加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 dark:text-craft-100 mb-6">👥 粉丝</h1>
      {users.length === 0 ? (
        <div className="text-center py-12 text-craft-400">暂无粉丝</div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <Link key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-4 bg-white dark:bg-craft-700 rounded-xl p-4 shadow-sm card-hover">
              <div className="w-12 h-12 rounded-full bg-craft-200 dark:bg-craft-600 flex items-center justify-center text-xl overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-craft-800 dark:text-craft-100">{u.username}</div>
                {u.bio && <div className="text-sm text-craft-400 truncate">{u.bio}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}