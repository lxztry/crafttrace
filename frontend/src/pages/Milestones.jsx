import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

export default function Milestones() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/milestones`)
      .then(r => r.json())
      .then(data => {
        setMilestones(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 mb-6">📌 里程碑</h1>

      <div className="bg-craft-50 rounded-xl p-4 mb-6">
        <p className="text-craft-600 text-sm">
          📅 记录 AI 替代进程中的重大事件：当某个工种的替代度突破关键节点，我们会记录在这里。
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-craft-400">加载中...</div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-12 text-craft-400">
          暂无里程碑记录<br/>
          <span className="text-sm">里程碑会随着用户投票数据的变化自动生成</span>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-craft-200" />
          
          <div className="space-y-6">
            {milestones.map(m => (
              <div key={m.id} className="relative pl-14">
                <div className="absolute left-4 w-4 h-4 rounded-full bg-craft-500 border-2 border-white" />
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="text-xs text-craft-400 mb-2">{m.date}</div>
                  <h2 className="font-semibold text-craft-800 mb-2">{m.title}</h2>
                  {m.description && (
                    <p className="text-sm text-craft-600 mb-2">{m.description}</p>
                  )}
                  {(m.score_before !== null || m.score_after !== null) && (
                    <div className="flex items-center gap-2 text-sm">
                      {m.score_before !== null && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          替代度 {m.score_before}%
                        </span>
                      )}
                      {m.score_before !== null && m.score_after !== null && (
                        <span className="text-craft-400">→</span>
                      )}
                      {m.score_after !== null && (
                        <span className="px-2 py-0.5 bg-craft-100 text-craft-700 rounded font-medium">
                          {m.score_after}%
                        </span>
                      )}
                    </div>
                  )}
                  {m.occupation_name && (
                    <Link
                      to={`/occupations?category=${encodeURIComponent(m.occupation_name)}`}
                      className="inline-block mt-2 text-xs text-craft-400 hover:text-craft-600"
                    >
                      相关工种：{m.occupation_name} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}