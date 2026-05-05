import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/leaderboard?period=${period}&limit=20`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 dark:text-craft-100 mb-6">🏆 积分排行榜</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriod('all')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${period === 'all' ? 'bg-craft-600 text-white' : 'bg-white dark:bg-craft-700 text-craft-600 dark:text-craft-300 border border-craft-200 dark:border-craft-600'}`}
        >
          总榜
        </button>
        <button
          onClick={() => setPeriod('weekly')}
          className={`px-5 py-2 rounded-full font-medium transition-colors ${period === 'weekly' ? 'bg-craft-600 text-white' : 'bg-white dark:bg-craft-700 text-craft-600 dark:text-craft-300 border border-craft-200 dark:border-craft-600'}`}
        >
          周榜
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-craft-400">加载中...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-craft-400">暂无数据</div>
      ) : (
        <div className="space-y-3">
          {data.map((user, i) => (
            <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center gap-4 bg-white dark:bg-craft-700 rounded-xl p-4 shadow-sm card-hover">
              <div className={`w-10 h-10 flex items-center justify-center text-xl ${i < 3 ? '' : 'text-craft-400'}`}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <div className="w-12 h-12 rounded-full bg-craft-200 dark:bg-craft-600 flex items-center justify-center text-xl overflow-hidden">
                {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-craft-800 dark:text-craft-100">{user.username}</div>
                <div className="text-xs text-craft-400">{user.work_count || 0} 作品</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-craft-600 dark:text-craft-200">{user.total_points}</div>
                <div className="text-xs text-craft-400">积分</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}