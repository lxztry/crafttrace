import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { API, AuthContext } from '../App'
import { useToast } from '../components/Toast'

function AvatarUpload({ user, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('图片大小不能超过2MB', 'warning')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch(`${API}/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('上传失败')
      const data = await res.json()
      onUpdate({ ...user, avatar_url: data.avatar_url })
      addToast('头像上传成功', 'success')
    } catch {
      addToast('头像上传失败', 'error')
    }
    setUploading(false)
  }

  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API}${user.avatar_url}`)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=a67f50`

  return (
    <label style={{ position: 'relative', cursor: 'pointer' }}>
      <img
        src={avatarUrl}
        alt={user?.username}
        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2d6c6' }}
        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=a67f50` }}
      />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 12, opacity: uploading ? 1 : 0, transition: 'opacity 0.2s'
      }}>
        {uploading ? '上传中...' : '修改'}
      </div>
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </label>
  )
}

export default function Profile() {
  const { user: authUser, login, logout } = useContext(AuthContext)
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('works')
  const [works, setWorks] = useState([])
  const [followed, setFollowed] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [userStats, setUserStats] = useState({ works_count: 0, likes_count: 0, follows_count: 0 })

  useEffect(() => {
    if (!authUser) { setLoading(false); return }
    setUser(authUser)
    fetchUserData(authUser.id)
  }, [authUser])

  const fetchUserData = (userId) => {
    fetch(`${API}/users/${userId}`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))

    fetch(`${API}/works?user_id=${userId}&limit=100`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setWorks(arr)
        setUserStats(prev => ({ ...prev, works_count: arr.length, likes_count: arr.reduce((a, w) => a + (w.likes_count || 0), 0) }))
      })

    fetch(`${API}/follows?user_id=${userId}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setFollowed(arr)
        setUserStats(prev => ({ ...prev, follows_count: arr.length }))
      })
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (!loginUsername.trim() || !loginEmail.trim()) {
      addToast('请填写用户名和邮箱', 'warning')
      return
    }
    if (isRegister && !loginPassword.trim()) {
      addToast('请填写密码', 'warning')
      return
    }
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login'
      const body = isRegister
        ? { username: loginUsername, email: loginEmail, password: loginPassword }
        : { username: loginUsername, email: loginEmail }
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { addToast(data.error || '操作失败', 'error'); return }
      login(data.user || data, data.token || '')
      addToast(isRegister ? '注册成功' : '登录成功', 'success')
    } catch { addToast('网络错误，请重试', 'error') }
  }

  const handleLogout = () => {
    logout()
    setUser(null); setWorks([]); setFollowed([])
    setUserStats({ works_count: 0, likes_count: 0, follows_count: 0 })
    addToast('已退出登录', 'info')
  }

  const handleLike = async (workId) => {
    if (!user) { addToast('请先登录', 'warning'); return }
    try {
      const res = await fetch(`${API}/works/${workId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })
      const data = await res.json()
      setWorks(works.map(w => w.id === workId ? { ...w, likes_count: data.likes_count } : w))
    } catch {}
  }

  if (!authUser) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 }}>👤 个人中心</h1>
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px var(--shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
            <p style={{ color: 'var(--text-3)', fontSize: 14 }}>登录后查看您的作品和收藏</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setIsRegister(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', background: !isRegister ? 'var(--primary)' : 'var(--surface-2)', color: !isRegister ? '#fff' : 'var(--text-2)' }}>登录</button>
            <button onClick={() => setIsRegister(true)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', background: isRegister ? 'var(--primary)' : 'var(--surface-2)', color: isRegister ? '#fff' : 'var(--text-2)' }}>注册</button>
          </div>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" placeholder="用户名" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
            <input type="email" placeholder="邮箱" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
            {isRegister && <input type="password" placeholder="密码" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />}
            <button type="submit" style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              {isRegister ? '注册' : '登录'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const statStyle = { textAlign: 'center' }
  const statValStyle = { fontWeight: 'bold', fontSize: 18, color: 'var(--text)' }
  const statLabelStyle = { color: 'var(--text-3)', fontSize: 12 }

  return (
    <div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px var(--shadow)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <AvatarUpload user={user} onUpdate={(u) => { setUser(u); login(u, '') }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--text)' }}>{user?.username}</h2>
              {user?.is_admin === 1 && <span style={{ padding: '2px 8px', background: 'var(--primary)', color: '#fff', borderRadius: 4, fontSize: 12 }}>管理员</span>}
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 12 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
              <div style={statStyle}><div style={statValStyle}>{userStats.works_count}</div><div style={statLabelStyle}>作品</div></div>
              <div style={statStyle}><div style={statValStyle}>{userStats.likes_count}</div><div style={statLabelStyle}>获赞</div></div>
              <div style={statStyle}><div style={statValStyle}>{userStats.follows_count}</div><div style={statLabelStyle}>关注</div></div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', fontSize: 14, color: 'var(--text-3)', border: '1px solid var(--border)', borderRadius: 8 }}>
            退出
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {[['works', `作品 (${works.length})`], ['following', `关注 (${followed.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 500, border: 'none', borderBottom: `2px solid ${activeTab === key ? 'var(--primary)' : 'transparent'}`,
            color: activeTab === key ? 'var(--text)' : 'var(--text-3)', background: 'none', cursor: 'pointer'
          }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'works' && (
        works.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📤</div>
            <p>还没有上传作品</p>
            <Link to="/upload" style={{ marginTop: 12, display: 'inline-block', color: 'var(--primary)' }}>上传第一个作品</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {works.map(work => (
              <div key={work.id} style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px var(--shadow)' }}>
                <Link to={`/works/${work.id}`} style={{ display: 'block' }}>
                  {work.image_url && (
                    <div style={{ aspectRatio: '1', background: 'var(--surface-2)' }}>
                      <img src={`http://localhost:5001${work.image_url}`} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                  <div style={{ padding: 12 }}>
                    <h3 style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{work.occupation_name}</span>
                      <button onClick={(e) => { e.preventDefault(); handleLike(work.id) }} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ❤️ {work.likes_count}
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'following' && (
        followed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏭</div>
            <p>还没有关注任何工种</p>
            <Link to="/occupations" style={{ marginTop: 12, display: 'inline-block', color: 'var(--primary)' }}>去探索工种</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {followed.map(f => (
              <Link key={f.id} to={`/occupations/${f.id}`}>
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px var(--shadow)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon || '⚙️'}</div>
                  <h3 style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{f.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{f.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
