import React from 'react'

export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white dark:bg-craft-700 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-craft-200 dark:bg-craft-600 rounded w-3/4 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-craft-100 dark:bg-craft-600 rounded"
            style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 5 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-craft-200 dark:bg-craft-600 rounded" style={{ width: `${Math.floor(Math.random() * 30 + 70)}%` }} />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40 }) {
  return (
    <div
      className="bg-craft-200 dark:bg-craft-600 rounded-full animate-pulse"
      style={{ width: size, height: size }}
    />
  )
}
