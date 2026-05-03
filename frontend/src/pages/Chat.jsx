import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function Chat() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [exhibit, setExhibit] = useState(null)
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/exhibits/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/exhibition'); return }
        setExhibit(data)
      })
      .catch(() => navigate('/exhibition'))
  }, [id, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input.trim() }
    setHistory(h => [...h, userMsg])
    setInput('')
    setLoading(true)
    setTyping(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibit_id: Number(id),
          history: [...history, userMsg]
        })
      })
      const data = await res.json()
      if (data.reply) {
        setHistory(h => [...h, { role: 'assistant', content: data.reply }])
      } else if (data.error) {
        setHistory(h => [...h, { role: 'assistant', content: `出错：${data.error}` }])
      }
    } catch (err) {
      setHistory(h => [...h, { role: 'assistant', content: '网络连接失败，请重试。' }])
    } finally {
      setLoading(false)
      setTyping(false)
    }
  }

  if (!exhibit) return <div className="text-center py-12 text-craft-400">加载中...</div>

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-craft-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-craft-400 hover:text-craft-600 text-xl">←</button>
        <div className="w-10 h-10 rounded-full bg-craft-100 flex items-center justify-center text-lg overflow-hidden">
          {exhibit.avatar_url ? (
            <img src={exhibit.avatar_url.startsWith('http') ? exhibit.avatar_url : `http://localhost:5001${exhibit.avatar_url}`}
              alt={exhibit.name} className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = exhibit.name[0]; }} />
          ) : (
            <span>{exhibit.name[0]}</span>
          )}
        </div>
        <div>
          <div className="font-semibold text-craft-800">{exhibit.name}</div>
          <div className="text-xs text-craft-400">{exhibit.identity}</div>
        </div>
        <Link to={`/exhibits/${id}`} className="ml-auto text-sm text-craft-400 hover:text-craft-600">
          关于此人 →
        </Link>
      </div>

      {/* System prompt hint */}
      <div className="bg-craft-50 px-4 py-2 text-xs text-craft-500 text-center">
        💡 正在与 {exhibit.name} 对话 | {exhibit.personality?.slice(0, 30) || '性格稳重'}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Welcome */}
        {history.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-craft-100 flex items-center justify-center text-2xl mb-3 overflow-hidden">
              {exhibit.avatar_url ? (
                <img src={exhibit.avatar_url.startsWith('http') ? exhibit.avatar_url : `http://localhost:5001${exhibit.avatar_url}`}
                  alt={exhibit.name} className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = exhibit.name[0]; }} />
              ) : (
                <span>{exhibit.name[0]}</span>
              )}
            </div>
            <p className="text-craft-500 text-sm mb-4">{exhibit.story?.slice(0, 100) || exhibit.identity}</p>
            <p className="text-craft-400 text-xs">发送消息开始对话</p>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-craft-600 text-white rounded-br-md'
                : 'bg-white text-craft-700 shadow-sm rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm text-sm text-craft-400">
              ...正在输入
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-craft-200 px-4 py-3 pb-safe">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="对他说点什么..."
            className="flex-1 px-4 py-2.5 bg-craft-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-craft-400"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-craft-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-craft-700 transition-colors"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-craft-300 mt-1.5 text-center">AI生成内容仅供参考，不代表真实人物观点</p>
      </div>
    </div>
  )
}