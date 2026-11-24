'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 opacity-60" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`p-2 rounded-xl transition-all cursor-pointer border ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700 shadow-sm'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
      } ${className}`}
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
      aria-label="Toggle Dark and Light Mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-blue-600" />
      )}
    </button>
  )
}

export default ThemeToggle
