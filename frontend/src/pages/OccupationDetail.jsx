import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API, AuthContext } from '../App'
import TrendChart from '../components/TrendChart'

export default function OccupationDetail() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [occupation, setOccupation] = useState(null)
  const [works, setWorks] = useState([])
  const [history, setHistory] = useState([])
  const [milestones, setMilestones] = useState([])
  const [userVote, setUserVote] = useState(null)
  const [voteValue, setVoteValue] = useState(50)
  const [voted, setVoted] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [activeTab, setActiveTab] = useState('works')

  useEffect(() => {
    fetch(`${API}/occupations/${id}`)
      .then(r => r.json())
      .then(setOccupation)
      .catch(() => {})

    fetch(`${API}/works?occupation_id=${id}&limit=20`)
      .then(r => r.json())
      .then(setWorks)
      .catch(() => {})

    fetch(`${API}/occupations/${id}/history`)
      .then(r => r.json())
      .then(setHistory)
      .catch(() => {})

    fetch(`${API}/milestones?occupation_id=${id}`)
      .then(r => r.json())
      .then(data => setMilestones(Array.isArray(data) ? data : []))
      .catch(() => setMilestones([]))

    if (user) {
      fetch(`${API}/occupations/${id}/user-vote?user_id=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.voted) { setVoted(true); setVoteValue(data.score) }
        })
        .catch(() => {})

      fetch(`${API}/occupations/${id}/is-followed?user_id=${user.id}`)
        .then(r => r.json())
        .then(data => setFollowed(data.followed))
        .catch(() => {})
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
      // Refresh history
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

  const scoreColor = occupation.replacement_score >= 70 ? 'text-red-600'
    : occupation.replacement_score <= 40 ? 'text-green-600'
    : 'text-yellow-600'

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-craft-400 mb-4">
        <Link to="/occupations">工种馆</Link><span>/</span><span>{occupation.name}</span>
      </div>

      {/* 工种信息 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{occupation.icon || '⚙️'}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-craft-800 mb-1">{occupation.name}</h1>
            <p className="text-craft-400 mb-3">{occupation.category}</p>
            <p className="text-craft-600">{occupation.description}</p>
          </div>
          <button
            onClick={handleFollow}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              followed ? 'bg-craft-100 text-craft-700' : 'bg-craft-600 text-white hover:bg-craft-700'
            }`}
          >
            {followed ? '✓ 已关注' : '+ 关注'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-craft-50 rounded-xl">
            <div className={`text-3xl font-bold ${scoreColor}`}>{occupation.replacement_score}%</div>
            <div className="text-sm text-craft-400 mt-1">替代度</div>
          </div>
          <div className="text-center p-4 bg-craft-50 rounded-xl">
            <div className="text-3xl font-bold text-craft-600">{occupation.score_count}</div>
            <div className="text-sm text-craft-400 mt-1">投票人数</div>
          </div>
          <div className="text-center p-4 bg-craft-50 rounded-xl">
            <div className={`text-3xl font-bold ${
              occupation.trend === 'up' ? 'text-red-500' : occupation.trend === 'down' ? 'text-green-500' : 'text-gray-400'
            }`}>
              {occupation.trend === 'up' ? '↑↑' : occupation.trend === 'down' ? '↓↓' : '—'}
            </div>
            <div className="text-sm text-craft-400 mt-1">趋势</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {voted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
              ✅ 你已投票：{voteValue}%
            </div>
          ) : (
            <button
              onClick={() => setShowVoteModal(true)}
              className="px-6 py-3 bg-craft-600 text-white rounded-xl font-medium hover:bg-craft-700 transition-colors"
            >
              参与投票
            </button>
          )}
          <Link
            to={`/upload?occupation=${id}`}
            className="px-6 py-3 bg-white border border-craft-300 text-craft-600 rounded-xl font-medium hover:bg-craft-50 transition-colors"
          >
            📤 上传作品
          </Link>
        </div>
      </div>

      {/* 投票弹窗 */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-craft-800 mb-4">你觉得这个工作被AI替代的可能性？</h3>
            <div className="mb-4">
              <input
                type="range" min="0" max="100" value={voteValue}
                onChange={(e) => setVoteValue(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-craft-400 mt-1">
                <span>0% 不可能</span>
                <span className={`font-bold text-xl ${
                  voteValue >= 70 ? 'text-red-500' : voteValue <= 40 ? 'text-green-500' : 'text-yellow-500'
                }`}>{voteValue}%</span>
                <span>100% 完全替代</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowVoteModal(false)} className="flex-1 py-2 bg-gray-100 text-craft-600 rounded-lg">取消</button>
              <button onClick={handleVote} className="flex-1 py-2 bg-craft-600 text-white rounded-lg">确认投票</button>
            </div>
          </div>
        </div>
      )}

      {/* 趋势图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-craft-700 mb-4">📈 替代度趋势</h2>
        <TrendChart history={history} currentScore={occupation.replacement_score} />
      </div>

      {/* Tab切换 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('works')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'works' ? 'text-craft-700 border-b-2 border-craft-600' : 'text-craft-400'
            }`}
          >
            人类作品 ({works.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'milestones' ? 'text-craft-700 border-b-2 border-craft-600' : 'text-craft-400'
            }`}
          >
            里程碑
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'works' && (
            <div className="grid md:grid-cols-3 gap-4">
              {works.map(work => (
                <Link key={work.id} to="/gallery" className="block">
                  <div className="bg-craft-50 rounded-xl overflow-hidden card-hover">
                    {work.image_url && (
                      <div className="aspect-square">
                        <img
                          src={`http://localhost:5001${work.image_url}`}
                          alt={work.title}
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-craft-800 text-sm truncate">{work.title}</h3>
                      <p className="text-xs text-craft-400">@{work.username} ❤️ {work.likes_count}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {works.length === 0 && (
                <div className="col-span-3 text-center py-8 text-craft-400">
                  暂无作品，<Link to={`/upload?occupation=${id}`} className="text-craft-600 underline">成为第一个上传者</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              {milestones.map(m => (
                <div key={m.id} className="border-l-2 border-craft-300 pl-4">
                  <div className="text-xs text-craft-400 mb-1">{m.date}</div>
                  <h3 className="font-medium text-craft-800">{m.title}</h3>
                  {m.description && <p className="text-sm text-craft-500 mt-1">{m.description}</p>}
                  {(m.score_before !== null || m.score_after !== null) && (
                    <div className="text-xs mt-2">
                      {m.score_before !== null && <span className="text-craft-400">替代度: {m.score_before}%</span>}
                      {m.score_before !== null && m.score_after !== null && <span className="text-craft-400"> → </span>}
                      {m.score_after !== null && <span className="text-craft-600 font-medium">{m.score_after}%</span>}
                    </div>
                  )}
                </div>
              ))}
              {milestones.length === 0 && (
                <div className="text-center py-6 text-craft-400 text-sm">
                  暂无里程碑记录
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}