import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function Profile() {
  const { user, login, logout } = useContext(AuthContext)
  const [myWorks, setMyWorks] = useState([])
  const [myFollows, setMyFollows] = useState([])
  const [showLogin, setShowLogin] = useState(false)
  const [loginType, setLoginType] = useState('login')
  const [formData, setFormData] = useState({ username: '', password: '', email: '' })

  useEffect(() => {
    if (user) {
      fetch(`${API}/users/${user.id}/works`).then(r => r.json()).then(setMyWorks).catch(() => {})
      fetch(`${API}/users/${user.id}/follows`).then(r => r.json()).then(setMyFollows).catch(() => {})
    }
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    const endpoint = loginType === 'register' ? '/auth/register' : '/auth/login'
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        login(data.user, data.token)
        setShowLogin(false)
        setFormData({ username: '', password: '', email: '' })
      } else {
        alert(data.error || '登录失败')
      }
    } catch (err) {
      alert('请求失败')
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="text-2xl font-bold text-craft-700 mb-2">个人中心</h1>
        <p className="text-craft-400 mb-6">登录后查看你的作品和投票记录</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setLoginType('login'); setShowLogin(true) }}
            className="px-6 py-3 bg-craft-600 text-white rounded-xl font-medium hover:bg-craft-700">
            登录
          </button>
          <button onClick={() => { setLoginType('register'); setShowLogin(true) }}
            className="px-6 py-3 bg-white border border-craft-300 text-craft-600 rounded-xl font-medium hover:bg-craft-50">
            注册
          </button>
        </div>

        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold text-craft-800 mb-4">{loginType === 'login' ? '登录' : '注册'}</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <input type="text" placeholder="用户名" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg" required />
                {loginType === 'register' && (
                  <input type="email" placeholder="邮箱" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg" required />
                )}
                <input type="password" placeholder="密码" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg" required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowLogin(false)}
                    className="flex-1 py-2 bg-gray-100 rounded-lg">取消</button>
                  <button type="submit"
                    className="flex-1 py-2 bg-craft-600 text-white rounded-lg">
                    {loginType === 'login' ? '登录' : '注册'}
                  </button>
                </div>
              </form>
              <p className="text-center text-sm text-craft-400 mt-3">
                {loginType === 'login' ? (
                  <>没有账号？<button onClick={() => setLoginType('register')} className="text-craft-600">注册</button></>
                ) : (
                  <>已有账号？<button onClick={() => setLoginType('login')} className="text-craft-600">登录</button></>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-craft-700 mb-6">👤 个人中心</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-craft-200 rounded-full flex items-center justify-center text-2xl">
            {user.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-xl font-bold text-craft-800">{user.username}</div>
            <div className="text-sm text-craft-400">{user.email}</div>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-gray-100 text-craft-600 rounded-lg hover:bg-gray-200">
          退出
        </button>
      </div>

      {/* 我关注的工种 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-craft-700 mb-4">⭐ 关注的工种</h2>
        {myFollows.length === 0 ? (
          <p className="text-craft-400 text-sm">还没有关注任何工种</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myFollows.map(f => (
              <Link key={f.id} to={`/occupations/${f.id}`}
                className="px-3 py-1 bg-craft-100 text-craft-700 rounded-full text-sm hover:bg-craft-200">
                {f.icon} {f.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 我的作品 */}
      <div>
        <h2 className="text-lg font-semibold text-craft-700 mb-4">📤 我的作品</h2>
        {myWorks.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl">
            <p className="text-craft-400 mb-3">还没有上传作品</p>
            <Link to="/upload" className="text-craft-600 hover:underline">去上传 →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {myWorks.map(work => (
              <div key={work.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                {work.image_url && (
                  <div className="aspect-square bg-craft-100">
                    <img src={`http://localhost:5001${work.image_url}`} alt={work.title}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-craft-800 text-sm">{work.title}</h3>
                  <p className="text-xs text-craft-400 mt-1">{work.occupation_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}