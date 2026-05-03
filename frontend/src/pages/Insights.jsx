import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

export default function Insights() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/insights?limit=20`)
      .then(r => r.json())
      .then(data => {
        setInsights(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 mb-6">💡 洞察中心</h1>

      <div className="mb-6 p-4 bg-craft-50 rounded-xl">
        <p className="text-craft-600 text-sm">
          💬 每日洞察：追踪AI替代进程，记录每个行业的变迁。我们相信：了解替代，是为了更好地传承人类独有的价值。
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 text-craft-400">
          暂无洞察内容
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="bg-white rounded-xl p-6 shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-craft-400 mb-1">{insight.date}</div>
                  <h2 className="text-lg font-semibold text-craft-800">{insight.title}</h2>
                </div>
                {insight.score_change !== null && insight.score_change !== undefined && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    insight.score_change > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {insight.score_change > 0 ? '↑' : '↓'} {Math.abs(insight.score_change)}%
                  </div>
                )}
              </div>
              <p className="text-craft-600 leading-relaxed">{insight.content}</p>
              {insight.occupation_name && (
                <Link
                  to={`/occupations?category=${insight.occupation_name}`}
                  className="inline-block mt-3 text-sm text-craft-400 hover:text-craft-600"
                >
                  相关工种：{insight.occupation_name} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}