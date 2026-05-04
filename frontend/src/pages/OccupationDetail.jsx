import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API, AuthContext } from '../App'
import TrendChart from '../components/TrendChart'

function SkillBar({ name, level }) {
  const color = level >= 80 ? '#ef4444' : level >= 60 ? '#eab308' : '#22c55e'
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-craft-700 dark:text-craft-200 w-24 truncate">{name}</span>
      <div className="flex-1 bg-gray-200 dark:bg-craft-600 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${level}%`, background: color }} />
      </div>
      <span className="text-xs text-craft-400 w-8 text-right">{level}%</span>
    </div>
  )
}

function AnalysisTab({ occupation, analysis }) {
  if (!analysis || !occupation) return (
    <div className="text-center py-12 text-craft-400">加载中...</div>
  )

  const statusMap = {
    hot: { label: '🔥 AI原新生', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
    augmented: { label: '🔄 AI共舞型', color: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    stable: { label: '🛡️ 人类坚守型', color: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/20' },
    danger: { label: '⚠️ 高危替代型', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
  }
  const status = statusMap[analysis.ai_status] || statusMap.augmented

  return (
    <div className="space-y-6">
      {/* 职业画像 */}
      <div className={`rounded-xl p-5 ${status.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{occupation.icon}</span>
          <div>
            <h3 className="font-bold text-craft-800 dark:text-craft-100">{occupation.name}</h3>
            <span className="text-sm font-medium" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        {analysis.ai_impact_detail && (
          <p className="text-sm text-craft-600 dark:text-craft-300 leading-relaxed">{analysis.ai_impact_detail}</p>
        )}
      </div>

      {/* 基本信息网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '薪资范围', value: occupation.salary_range || '未知', icon: '💰' },
          { label: '学历要求', value: occupation.education_level || '未知', icon: '🎓' },
          { label: '入门难度', value: occupation.entry_difficulty || '未知', icon: '📊' },
          { label: '经验要求', value: occupation.experience_years || '未知', icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-craft-700 rounded-xl p-4 text-center shadow-sm">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-xs text-craft-400 mb-1">{label}</div>
            <div className="font-semibold text-craft-700 dark:text-craft-100 text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* 核心技能 */}
      {analysis.skills && analysis.skills.length > 0 && (
        <div className="bg-white dark:bg-craft-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-craft-700 dark:text-craft-200 mb-4">🎯 核心技能</h3>
          <div className="space-y-3">
            {analysis.skills.map((s, i) => (
              <SkillBar key={i} name={s.name} level={s.level} />
            ))}
          </div>
        </div>
      )}

      {/* AI vs 人类优势 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5">
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">🤖 AI擅长</h3>
          <div className="space-y-2">
            {(analysis.ai_advantages || []).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-craft-700 dark:text-craft-300">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3">🧑 人类优势</h3>
          <div className="space-y-2">
            {(analysis.human_advantages || []).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-craft-700 dark:text-craft-300">
                <span className="text-green-400 flex-shrink-0">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 成长路径 */}
      {analysis.growth_stages && analysis.growth_stages.length > 0 && (
        <div className="bg-white dark:bg-craft-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-craft-700 dark:text-craft-200 mb-4">📈 成长路径</h3>
          <div className="space-y-4">
            {analysis.growth_stages.map((stage, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-craft-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < analysis.growth_stages.length - 1 && (
                    <div className="w-0.5 flex-1 bg-craft-200 dark:bg-craft-600 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-craft-800 dark:text-craft-100">{stage.stage}</span>
                    {stage.salary && <span className="text-sm text-craft-500">{stage.salary}</span>}
                  </div>
                  <div className="text-xs text-craft-400 mb-1">{stage.time}</div>
                  {stage.desc && <p className="text-sm text-craft-500 dark:text-craft-400">{stage.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 转型建议 */}
      {analysis.adjacent_jobs && analysis.adjacent_jobs.length > 0 && (
        <div className="bg-white dark:bg-craft-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-craft-700 dark:text-craft-200 mb-4">🚀 转型建议（相邻岗位）</h3>
          <div className="space-y-3">
            {analysis.adjacent_jobs.map((job, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-craft-50 dark:bg-craft-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-craft-700 dark:text-craft-200">{job.name}</span>
                  {job.match && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      匹配度 {job.match}%
                    </span>
                  )}
                </div>
                {job.salary && <span className="text-sm text-craft-500">{job.salary}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OccupationDetail() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [occupation, setOccupation] = useState(null)
  const [works, setWorks] = useState([])
  const [history, setHistory] = useState([])
  const [milestones, setMilestones] = useState([])
  const [insights, setInsights] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [voted, setVoted] = useState(false)
  const [voteValue, setVoteValue] = useState(50)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [activeTab, setActiveTab] = useState('works')

  useEffect(() => {
    fetch(`${API}/occupations/${id}`)
      .then(r => r.json()).then(setOccupation).catch(() => {})

    fetch(`${API}/occupations/${id}/analysis`)
      .then(r => r.json())
      .then(data => { if (!data.error) setAnalysis(data) })
      .catch(() => {})

    fetch(`${API}/works?occupation_id=${id}&limit=20`)
      .then(r => r.json()).then(setWorks).catch(() => {})

    fetch(`${API}/occupations/${id}/history`)
      .then(r => r.json()).then(setHistory).catch(() => {})

    fetch(`${API}/milestones`)
      .then(r => r.json())
      .then(data => setMilestones(Array.isArray(data) ? data.filter(m => String(m.occupation_id) === String(id)) : []))
      .catch(() => setMilestones([]))

    fetch(`${API}/insights`)
      .then(r => r.json())
      .then(data => setInsights(Array.isArray(data) ? data.filter(i => String(i.occupation_id) === String(id)) : []))
      .catch(() => setInsights([]))

    if (user) {
      fetch(`${API}/occupations/${id}/user-vote?user_id=${user.id}`)
        .then(r => r.json())
        .then(data => { if (data.voted) { setVoted(true); setVoteValue(data.score) } })
        .catch(() => {})
      fetch(`${API}/occupations/${id}/is-followed?user_id=${user.id}`)
        .then(r => r.json()).then(data => setFollowed(data.followed)).catch(() => {})
    }
  }, [id, user])

  const handleVote = async () => {
    if (!user) { alert('请先登录'); return }
    try {
      const res = await fetch(`${API}/occupations/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, score: voteValue })
      })
      const data = await res.json()
      setOccupation(data)
      setVoted(true)
      setShowVoteModal(false)
      fetch(`${API}/occupations/${id}/history`).then(r => r.json()).then(setHistory).catch(() => {})
    } catch (err) { console.error(err) }
  }

  const handleFollow = async () => {
    if (!user) { alert('请先登录'); return }
    try {
      const res = await fetch(`${API}/follows/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      setFollowed(data.followed)
    } catch (err) { console.error(err) }
  }

  if (!occupation) return <div className="text-center py-12 text-craft-400">加载中...</div>

  const scoreColor = occupation.replacement_score >= 70 ? 'text-red-600 dark:text-red-400'
    : occupation.replacement_score <= 40 ? 'text-green-600 dark:text-green-400'
    : 'text-yellow-600 dark:text-yellow-400'

  const scoreBarColor = occupation.replacement_score >= 70 ? 'bg-red-500'
    : occupation.replacement_score <= 40 ? 'bg-green-500'
    : 'bg-yellow-500'

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-craft-400 mb-4">
        <Link to="/occupations" className="hover:text-craft-600">工种馆</Link>
        <span>/</span><span className="text-craft-600">{occupation.name}</span>
      </div>

      {/* 工种信息 */}
      <div className="bg-white dark:bg-craft-700 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{occupation.icon || '⚙️'}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-craft-800 dark:text-craft-100 mb-1">{occupation.name}</h1>
            <p className="text-craft-400 dark:text-craft-400 mb-3">{occupation.category}</p>
            <p className="text-craft-600 dark:text-craft-300">{occupation.description}</p>
          </div>
          <button onClick={handleFollow}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
              followed ? 'bg-craft-100 dark:bg-craft-600 text-craft-700 dark:text-craft-200' : 'bg-craft-600 text-white hover:bg-craft-700'
            }`}>
            {followed ? '✓ 已关注' : '+ 关注'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-craft-50 dark:bg-craft-800 rounded-xl">
            <div className={`text-3xl font-bold ${scoreColor}`}>{occupation.replacement_score}%</div>
            <div className="text-sm text-craft-400 mt-1">替代度</div>
          </div>
          <div className="text-center p-4 bg-craft-50 dark:bg-craft-800 rounded-xl">
            <div className="text-3xl font-bold text-craft-600 dark:text-craft-300">{occupation.score_count}</div>
            <div className="text-sm text-craft-400 mt-1">投票人数</div>
          </div>
          <div className="text-center p-4 bg-craft-50 dark:bg-craft-800 rounded-xl">
            <div className={`text-3xl font-bold ${
              occupation.trend === 'up' ? 'text-red-500' : occupation.trend === 'down' ? 'text-green-500' : 'text-gray-400'
            }`}>
              {occupation.trend === 'up' ? '↑↑' : occupation.trend === 'down' ? '↓↓' : '—'}
            </div>
            <div className="text-sm text-craft-400 mt-1">趋势</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-craft-400 mb-1.5">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-craft-600 rounded-full h-3">
            <div className={`h-3 rounded-full ${scoreBarColor}`} style={{ width: `${occupation.replacement_score}%` }} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {voted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              ✅ 你已投票：{voteValue}%
            </div>
          ) : (
            <button onClick={() => setShowVoteModal(true)}
              className="px-6 py-3 bg-craft-600 text-white rounded-xl font-medium hover:bg-craft-700 transition-colors">
              参与投票
            </button>
          )}
          <Link to={`/upload?occupation=${id}`}
            className="px-6 py-3 bg-white dark:bg-craft-800 border border-craft-300 dark:border-craft-600 text-craft-600 dark:text-craft-300 rounded-xl font-medium hover:bg-craft-50 dark:hover:bg-craft-700 transition-colors">
            📤 上传作品
          </Link>
        </div>
      </div>

      {/* 投票弹窗 */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-craft-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-craft-800 dark:text-craft-100 mb-4">
              你觉得「{occupation.name}」被AI替代的可能性？
            </h3>
            <div className="mb-4">
              <input type="range" min="0" max="100" value={voteValue}
                onChange={e => setVoteValue(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-sm text-craft-400 mt-2">
                <span>0% 不可能</span>
                <span className={`font-bold text-xl ${
                  voteValue >= 70 ? 'text-red-500' : voteValue <= 40 ? 'text-green-500' : 'text-yellow-500'
                }`}>{voteValue}%</span>
                <span>100% 完全替代</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowVoteModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-craft-700 text-craft-600 dark:text-craft-300 rounded-lg">
                取消
              </button>
              <button onClick={handleVote}
                className="flex-1 py-2 bg-craft-600 text-white rounded-lg">
                确认投票
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 趋势图 */}
      <div className="bg-white dark:bg-craft-700 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-craft-700 dark:text-craft-200 mb-4">📈 替代度趋势</h2>
        <TrendChart history={history} currentScore={occupation.replacement_score} />
      </div>

      {/* Tab切换 */}
      <div className="bg-white dark:bg-craft-700 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-craft-200 dark:border-craft-600 overflow-x-auto">
          {[
            ['works', `人类作品 (${works.length})`],
            ['milestones', `里程碑 (${milestones.length})`],
            ['insights', `洞察 (${insights.length})`],
            ['analysis', `AI分析报告`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === key ? 'text-craft-700 dark:text-craft-200 border-b-2 border-craft-600' : 'text-craft-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'works' && (
            <div className="grid md:grid-cols-3 gap-4">
              {works.map(work => (
                <Link key={work.id} to={`/works/${work.id}`} className="block">
                  <div className="bg-craft-50 dark:bg-craft-800 rounded-xl overflow-hidden card-hover">
                    {work.image_url && (
                      <div className="aspect-square">
                        <img src={`http://localhost:5001${work.image_url}`} alt={work.title}
                          className="w-full h-full object-cover"
                          onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-craft-800 dark:text-craft-100 text-sm truncate">{work.title}</h3>
                      <p className="text-xs text-craft-400">@{work.username} ❤️ {work.likes_count}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {works.length === 0 && (
                <div className="col-span-3 text-center py-8 text-craft-400">
                  暂无作品，<Link to={`/upload?occupation=${id}`} className="text-craft-600 dark:text-craft-400 underline">成为第一个上传者</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              {milestones.map(m => (
                <div key={m.id} className="border-l-2 border-craft-300 dark:border-craft-500 pl-4">
                  <div className="text-xs text-craft-400 mb-1">{m.date}</div>
                  <h3 className="font-medium text-craft-800 dark:text-craft-100">{m.title}</h3>
                  {m.description && <p className="text-sm text-craft-500 dark:text-craft-400 mt-1">{m.description}</p>}
                  {(m.score_before !== null || m.score_after !== null) && (
                    <div className="text-xs mt-2">
                      {m.score_before !== null && <span className="text-craft-400">替代度: {m.score_before}%</span>}
                      {m.score_before !== null && m.score_after !== null && <span className="text-craft-400"> → </span>}
                      {m.score_after !== null && <span className="text-craft-600 dark:text-craft-300 font-medium">{m.score_after}%</span>}
                    </div>
                  )}
                </div>
              ))}
              {milestones.length === 0 && (
                <div className="text-center py-6 text-craft-400 text-sm">暂无里程碑记录</div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {insights.map(ins => (
                <div key={ins.id} className="bg-craft-50 dark:bg-craft-800 rounded-xl p-4">
                  <div className="text-xs text-craft-400 mb-2">{ins.date}</div>
                  <h3 className="font-medium text-craft-800 dark:text-craft-100 mb-2">{ins.title}</h3>
                  <p className="text-sm text-craft-500 dark:text-craft-400 leading-relaxed">{ins.content}</p>
                  {ins.score_change !== null && (
                    <div className={`mt-3 text-sm font-medium ${ins.score_change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {ins.score_change > 0 ? '↑' : '↓'} {Math.abs(ins.score_change)}% 替代度变化
                    </div>
                  )}
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center py-6 text-craft-400 text-sm">
                  暂无相关洞察，<Link to="/insights" className="text-craft-600 dark:text-craft-400 underline">查看全部洞察 →</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <AnalysisTab occupation={occupation} analysis={analysis} />
          )}
        </div>
      </div>
    </div>
  )
}