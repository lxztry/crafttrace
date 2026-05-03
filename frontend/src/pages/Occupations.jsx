import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API } from '../App'

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <span className="text-red-500">↑↑</span>
  if (trend === 'down') return <span className="text-green-500">↓↓</span>
  return <span className="text-gray-400">—</span>
}

const ScoreTag = ({ score }) => {
  if (score >= 70) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">高替代</span>
  if (score <= 40) return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">低替代</span>
  return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">中替代</span>
}

export default function Occupations() {
  const [occupations, setOccupations] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter') || ''

  useEffect(() => {
    fetch(`${API}/occupations`)
      .then(r => r.json())
      .then(data => setOccupations(data))
      .catch(() => {})
  }, [])

  const categories = [...new Set(occupations.map(o => o.category))]
  
  const filtered = filter === 'high' 
    ? occupations.filter(o => o.replacement_score >= 70)
    : filter === 'low'
    ? occupations.filter(o => o.replacement_score <= 40)
    : occupations

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 mb-6">🏭 工种馆</h1>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${!filter ? 'bg-craft-600 text-white' : 'bg-white text-craft-600 border border-craft-200'}`}
        >
          全部
        </button>
        <button
          onClick={() => setSearchParams({ filter: 'high' })}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === 'high' ? 'bg-red-500 text-white' : 'bg-white text-red-600 border border-red-200'}`}
        >
          ⚠️ 高替代
        </button>
        <button
          onClick={() => setSearchParams({ filter: 'low' })}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === 'low' ? 'bg-green-500 text-white' : 'bg-white text-green-600 border border-green-200'}`}
        >
          🛡️ 低替代
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSearchParams({ category: cat })}
            className={`px-4 py-2 rounded-full text-sm bg-white text-craft-600 border border-craft-200`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 工种列表 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(occ => (
          <Link key={occ.id} to={`/occupations/${occ.id}`} className="block">
            <div className="bg-white rounded-xl p-5 shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{occ.icon || '⚙️'}</span>
                <ScoreTag score={occ.replacement_score} />
              </div>
              <h3 className="font-semibold text-craft-800 mb-1">{occ.name}</h3>
              <p className="text-xs text-craft-400 mb-3">{occ.category}</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-craft-400">替代度</span>
                    <span className={`font-medium ${occ.replacement_score >= 70 ? 'text-red-600' : occ.replacement_score <= 40 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {occ.replacement_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${occ.replacement_score >= 70 ? 'bg-red-500' : occ.replacement_score <= 40 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${occ.replacement_score}%` }}
                    />
                  </div>
                </div>
                <div className="text-lg">
                  <TrendIcon trend={occ.trend} />
                </div>
              </div>
              
              {occ.score_count > 0 && (
                <div className="mt-2 text-xs text-craft-400">
                  {occ.score_count} 人投票
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-craft-400">
          暂无工种数据
        </div>
      )}
    </div>
  )
}