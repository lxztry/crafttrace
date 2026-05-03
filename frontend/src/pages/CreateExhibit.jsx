import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function CreateExhibit() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    identity: '',
    story: '',
    personality: '',
    is_public: true
  })
  const [submitting, setSubmitting] = useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-craft-400 mb-4">请先登录后再创建展品</p>
        <button onClick={() => navigate('/profile')} className="text-craft-600 underline">去登录</button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { alert('姓名不能为空'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${API}/exhibits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creator_id: user.id })
      })
      const data = await res.json()
      if (data.id) {
        alert('展品创建成功！')
        navigate(`/exhibits/${data.id}`)
      } else {
        alert(data.error || '创建失败')
      }
    } catch (err) { alert('创建失败') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-craft-700 mb-6">📦 创建展品</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-1.5">姓名 *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="比如：我爸、爷爷、喜欢的历史人物"
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-craft-700 mb-1.5">身份/时代</label>
          <input value={form.identity} onChange={e => setForm({ ...form, identity: e.target.value })}
            placeholder="比如：我的父亲1980年生、IT工程师"
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-craft-700 mb-1.5">人物故事 *</label>
          <textarea value={form.story} onChange={e => setForm({ ...form, story: e.target.value })}
            placeholder="描述这个人的生平、经历、特点。AI会基于这些信息生成对话风格。\n\n比如：\n- 他是做什么工作的？\n- 有什么特别的经历？\n- 他的人生观/价值观是什么？"
            rows={5}
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500 resize-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-craft-700 mb-1.5">性格特点</label>
          <input value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })}
            placeholder="比如：话不多但很准、喜欢用行动表达、内敛但温暖"
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500" />
          <p className="text-xs text-craft-400 mt-1">选填，影响AI对话风格</p>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="public" checked={form.is_public}
            onChange={e => setForm({ ...form, is_public: e.target.checked })}
            className="w-4 h-4 accent-craft-600" />
          <label htmlFor="public" className="text-sm text-craft-600">公开展示（其他人可在展览馆看到并对话）</label>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-craft-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-craft-700 transition-colors">
          {submitting ? '创建中...' : '创建展品'}
        </button>
      </form>
    </div>
  )
}