import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../App'

export default function Home() {
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState([])
  const [recentWorks, setRecentWorks] = useState([])

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {})
    fetch(`${API}/insights?limit=3`).then(r => r.json()).then(setInsights).catch(() => {})
    fetch(`${API}/works?limit=6`).then(r => r.json()).then(setRecentWorks).catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-craft-700 mb-2">🏛️ 匠迹</h1>
        <p className="text-craft-500 text-lg">记录人类的痕迹，追踪AI的脚步</p>
        {stats && (
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-craft-600">{stats.total_occupations}</div>
              <div className="text-craft-400">收录工种</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-craft-600">{stats.total_works}</div>
              <div className="text-craft-400">人类作品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold accent-red">{stats.high_replacement_count}</div>
              <div className="text-craft-400">高替代工种</div>
            </div>
          </div>
        )}
      </div>

      {/* 今日洞察 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-craft-700">💡 今日洞察</h2>
          <Link to="/insights" className="text-sm text-craft-500 hover:text-craft-700">查看更多 →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {insights.map(insight => (
            <div key={insight.id} className="bg-white rounded-xl p-5 shadow-sm card-hover insight-card">
              <div className="text-xs text-craft-400 mb-2">{insight.date}</div>
              <h3 className="font-medium text-craft-800 mb-2">{insight.title}</h3>
              <p className="text-sm text-craft-500 line-clamp-3">{insight.content}</p>
              {insight.score_change !== null && (
                <div className={`mt-3 text-sm font-medium ${insight.score_change > 0 ? 'trend-up' : 'trend-down'}`}>
                  {insight.score_change > 0 ? '↑' : '↓'} {Math.abs(insight.score_change)}%
                </div>
              )}
            </div>
          ))}
          {insights.length === 0 && (
            <div className="col-span-3 text-center py-8 text-craft-400">
              暂无洞察内容
            </div>
          )}
        </div>
      </section>

      {/* 精选作品 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-craft-700">🖼️ 人类画廊精选</h2>
          <Link to="/gallery" className="text-sm text-craft-500 hover:text-craft-700">查看更多 →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentWorks.map(work => (
            <div key={work.id} className="bg-white rounded-xl overflow-hidden shadow-sm card-hover">
              {work.image_url && (
                <div className="aspect-square bg-craft-100 flex items-center justify-center">
                  <img
                    src={`http://localhost:5001${work.image_url}`}
                    alt={work.title}
                    className="object-cover w-full h-full"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-craft-800 text-sm truncate">{work.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-craft-400">@{work.username}</span>
                  <span className="text-xs text-craft-400">❤️ {work.likes_count}</span>
                </div>
              </div>
            </div>
          ))}
          {recentWorks.length === 0 && (
            <div className="col-span-3 text-center py-8 text-craft-400">
              暂无作品，成为第一个上传者吧！
            </div>
          )}
        </div>
      </section>

      {/* 快速入口 - 主题感卡片 */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link to="/exhibition" className="quick-card quick-card--exhibition rounded-xl p-5 card-hover group">
            <div className="quick-card__icon mb-2">🏛️</div>
            <div className="quick-card__title">人类展览馆</div>
            <div className="quick-card__desc">与历史人物对话</div>
            <div className="quick-card__arrow">→</div>
          </Link>
          <Link to="/occupations?filter=high" className="quick-card quick-card--danger rounded-xl p-5 card-hover group">
            <div className="quick-card__icon mb-2">⚠️</div>
            <div className="quick-card__title">高替代工种</div>
            <div className="quick-card__desc">替代度 80%+</div>
            <div className="quick-card__arrow">→</div>
          </Link>
          <Link to="/occupations?filter=low" className="quick-card quick-card--safe rounded-xl p-5 card-hover group">
            <div className="quick-card__icon mb-2">🛡️</div>
            <div className="quick-card__title">低替代工种</div>
            <div className="quick-card__desc">替代度 40% 以下</div>
            <div className="quick-card__arrow">→</div>
          </Link>
        </div>
      </section>
    </div>
  )
}