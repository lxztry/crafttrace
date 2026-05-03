import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Occupations from './pages/Occupations'
import OccupationDetail from './pages/OccupationDetail'
import Gallery from './pages/Gallery'
import Upload from './pages/Upload'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import Milestones from './pages/Milestones'
import WorkDetail from './pages/WorkDetail'
import Exhibition from './pages/Exhibition'
import ExhibitDetail from './pages/ExhibitDetail'
import CreateExhibit from './pages/CreateExhibit'
import Chat from './pages/Chat'

const API = 'http://localhost:5001/api'

// 简单Auth Context（模拟）
export const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('crafttrace_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('crafttrace_token') || '')

  const login = (userData, token) => {
    setUser(userData)
    setToken(token)
    localStorage.setItem('crafttrace_user', JSON.stringify(userData))
    localStorage.setItem('crafttrace_token', token)
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('crafttrace_user')
    localStorage.removeItem('crafttrace_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { API }
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="occupations" element={<Occupations />} />
            <Route path="occupations/:id" element={<OccupationDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="upload" element={<Upload />} />
            <Route path="insights" element={<Insights />} />
            <Route path="milestones" element={<Milestones />} />
            <Route path="profile" element={<Profile />} />
            <Route path="works/:id" element={<WorkDetail />} />
            <Route path="exhibition" element={<Exhibition />} />
            <Route path="exhibits/create" element={<CreateExhibit />} />
            <Route path="exhibits/:id" element={<ExhibitDetail />} />
            <Route path="exhibits/:id/chat" element={<Chat />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}