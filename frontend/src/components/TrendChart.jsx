import React, { useState, useEffect, useRef } from 'react'

export default function TrendChart({ history, currentScore }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!history || history.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const padding = { top: 10, right: 10, bottom: 30, left: 35 }
    const chartW = W - padding.left - padding.right
    const chartH = H - padding.top - padding.bottom

    ctx.clearRect(0, 0, W, H)

    // Data - reverse to chronological order
    const data = [...history].reverse()
    if (data.length < 2) return

    const scores = data.map(d => d.score)
    const minS = Math.max(0, Math.min(...scores) - 5)
    const maxS = Math.min(100, Math.max(...scores) + 5)

    const toX = (i) => padding.left + (i / (data.length - 1)) * chartW
    const toY = (s) => padding.top + (1 - (s - minS) / (maxS - minS)) * chartH

    // Grid lines
    ctx.strokeStyle = '#e2d6c6'
    ctx.lineWidth = 1
    const gridSteps = 5
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (i / gridSteps) * chartH
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(W - padding.right, y)
      ctx.stroke()
    }

    // Area fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, H - padding.bottom)
    grad.addColorStop(0, 'rgba(166, 127, 80, 0.15)')
    grad.addColorStop(1, 'rgba(166, 127, 80, 0)')
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(scores[0]))
    data.forEach((d, i) => ctx.lineTo(toX(i), toY(d.score)))
    ctx.lineTo(toX(data.length - 1), padding.top + chartH)
    ctx.lineTo(toX(0), padding.top + chartH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(scores[0]))
    data.forEach((d, i) => ctx.lineTo(toX(i), toY(d.score)))
    ctx.strokeStyle = '#a67f50'
    ctx.lineWidth = 2
    ctx.stroke()

    // Points
    data.forEach((d, i) => {
      ctx.beginPath()
      ctx.arc(toX(i), toY(d.score), 3, 0, Math.PI * 2)
      ctx.fillStyle = '#a67f50'
      ctx.fill()
    })

    // Y axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= gridSteps; i++) {
      const s = maxS - (i / gridSteps) * (maxS - minS)
      const y = padding.top + (i / gridSteps) * chartH
      ctx.fillText(Math.round(s) + '%', padding.left - 5, y + 3)
    }

    // X axis labels (dates)
    ctx.textAlign = 'center'
    const labelCount = Math.min(data.length, 5)
    const step = Math.max(1, Math.floor(data.length / labelCount))
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        const x = toX(i)
        ctx.fillText(d.date.slice(5), x, H - 8)
      }
    })
  }, [history])

  if (!history || history.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-craft-400 text-sm">
        暂无足够历史数据（至少需要2次投票记录）
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-40"
      style={{ display: 'block' }}
    />
  )
}