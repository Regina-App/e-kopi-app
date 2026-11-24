'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function TopLoadingBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Trigger on route change
  useEffect(() => {
    setVisible(true)
    setProgress(30)

    if (timerRef.current) clearTimeout(timerRef.current)

    const timer1 = setTimeout(() => {
      setProgress(75)
    }, 150)

    const timer2 = setTimeout(() => {
      setProgress(100)
    }, 400)

    const timer3 = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 650)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [pathname, searchParams])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-1"
      role="progressbar"
      aria-label="Loading bar"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  )
}

