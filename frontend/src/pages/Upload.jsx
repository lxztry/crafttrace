import React, { useState, useEffect, useContext } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API, AuthContext } from '../App'

export default function Upload() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [occupations, setOccupations] = useState([])
  const [selectedOccupation, setSelectedOccupation] = useState(searchParams.get('occupation') || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(`${API}/occupations`)
      .then(r => r.json())
      .then(setOccupations)
      .catch(() => {})
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('请先登录')
      return
    }
    if (!title.trim() || !selectedOccupation) {
      alert('请填写标题并选择工种')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('user_id', user.id)
    formData.append('occupation_id', selectedOccupation)
    formData.append('title', title.trim())
    formData.append('description', description.trim())
    formData.append('tags', tags.trim())

    if (file) {
      formData.append('file', file)
    }

    try {
      const res = await fetch(`${API}/works`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        alert('作品上传成功！')
        navigate('/gallery')
      } else {
        const data = await res.json()
        alert(data.error || '上传失败')
      }
    } catch (err) {
      alert('上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-craft-700 mb-6">📤 上传作品</h1>

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-700">请先登录后才能上传作品</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-2">作品图片</label>
          <div
            className="border-2 border-dashed border-craft-300 rounded-xl p-8 text-center cursor-pointer hover:border-craft-500 transition-colors"
            onClick={() => document.getElementById('file-input').click()}
          >
            {preview ? (
              <img src={preview} alt="预览" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-craft-500">点击或拖拽上传图片</p>
                <p className="text-xs text-craft-400 mt-1">支持 JPG/PNG/GIF/WebP</p>
              </div>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-2">作品标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的作品起个名字"
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500"
            required
          />
        </div>

        {/* 工种选择 */}
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-2">关联工种 *</label>
          <select
            value={selectedOccupation}
            onChange={(e) => setSelectedOccupation(e.target.value)}
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500"
            required
          >
            <option value="">选择工种...</option>
            {occupations.map(occ => (
              <option key={occ.id} value={occ.id}>
                {occ.icon} {occ.name} ({occ.replacement_score}% 替代度)
              </option>
            ))}
          </select>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-2">作品故事</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="这个技能学了多少年？背后有什么故事？"
            rows={4}
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500 resize-none"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-craft-700 mb-2">标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔，如：手工，木工，传承"
            className="w-full px-4 py-3 border border-craft-200 rounded-xl focus:outline-none focus:border-craft-500"
          />
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={uploading || !user}
          className={`w-full py-3 rounded-xl font-semibold transition-colors ${
            uploading || !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-craft-600 text-white hover:bg-craft-700'
          }`}
        >
          {uploading ? '上传中...' : '发布作品'}
        </button>
      </form>
    </div>
  )
}