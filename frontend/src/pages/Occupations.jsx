import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API } from '../App'

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <span className="text-red-500">↑↑</span>
  if (trend === 'down') return <span className="text-green-500">↓↓</span>
  return <span className="text-gray-400">—</span>
}

const ScoreTag = ({ score }) => {
  if (score >= 70) return <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">高替代</span>
  if (score <= 40) return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">低替代</span>
  return <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">中替代</span>
}

export default function Occupations() {
  const [occupations, setOccupations] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const filter = searchParams.get('filter') || ''
  const categoryParam = searchParams.get('category') || ''

  useEffect(() => {
    fetch(`${API}/occupations`)
      .then(r => r.json())
      .then(data => setOccupations(data))
      .catch(() => {})
  }, [])

  const categories = [...new Set(occupations.map(o => o.category))]
  
  // Apply search + filter
  let filtered = occupations
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.category.toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q)
    )
  }
  if (filter === 'high') filtered = filtered.filter(o => o.replacement_score >= 70)
  else if (filter === 'low') filtered = filtered.filter(o => o.replacement_score <= 40)
  if (categoryParam) filtered = filtered.filter(o => o.category === categoryParam)

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 dark:text-craft-100 mb-6">🏭 工种馆</h1>

      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-craft-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索工种名称、分类、描述..."
            className="search-input pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-craft-400 hover:text-craft-600 text-sm"
            >✕</button>
          )}
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setSearchParams({}); setSearchQuery('') }}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${!filter && !categoryParam ? 'bg-craft-600 text-white' : 'bg-white dark:bg-craft-700 text-craft-600 dark:text-craft-300 border border-craft-200 dark:border-craft-600'}`}
        >
          全部
        </button>
        <button
          onClick={() => { setSearchParams({ filter: 'high' }); setSearchQuery('') }}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === 'high' ? 'bg-red-500 text-white' : 'bg-white dark:bg-craft-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}
        >
          ⚠️ 高替代
        </button>
        <button
          onClick={() => { setSearchParams({ filter: 'low' }); setSearchQuery('') }}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === 'low' ? 'bg-green-500 text-white' : 'bg-white dark:bg-craft-700 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'}`}
        >
          🛡️ 低替代
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setSearchParams({ category: cat }); setSearchQuery('') }}
            className={`px-4 py-2 rounded-full text-sm bg-white dark:bg-craft-700 text-craft-600 dark:text-craft-300 border border-craft-200 dark:border-craft-600 ${
              categoryParam === cat ? 'ring-2 ring-craft-500' : ''
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 结果统计 */}
      {(searchQuery || filter || categoryParam) && (
        <div className="text-sm text-craft-400 mb-4">
          找到 <span className="font-medium text-craft-600 dark:text-craft-300">{filtered.length}</span> 个工种
        </div>
      )}

      {/* 工种列表 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(occ => (
          <Link key={occ.id} to={`/occupations/${occ.id}`} className="block">
            <div className="bg-white dark:bg-craft-700 rounded-xl p-5 shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{occ.icon || '⚙️'}</span>
                <ScoreTag score={occ.replacement_score} />
              </div>
              <h3 className="font-semibold text-craft-800 dark:text-craft-100 mb-1">{occ.name}</h3>
              <p className="text-xs text-craft-400 dark:text-craft-400 mb-3">{occ.category}</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-craft-400">替代度</span>
                    <span className={`font-medium ${
                      occ.replacement_score >= 70 ? 'text-red-600 dark:text-red-400' : 
                      occ.replacement_score <= 40 ? 'text-green-600 dark:text-green-400' : 
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {occ.replacement_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-craft-600 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        occ.replacement_score >= 70 ? 'bg-red-500' : 
                        occ.replacement_score <= 40 ? 'bg-green-500' : 
                        'bg-yellow-500'
                      }`}
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
          {searchQuery ? '未找到匹配的工种，试试其他关键词' : '暂无工种数据'}
        </div>
      )}
    </div>
  )
}