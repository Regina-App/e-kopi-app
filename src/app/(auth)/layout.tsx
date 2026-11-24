'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import AnnouncementPopup from '@/components/AnnouncementPopup'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRegister = pathname?.includes('/register')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden p-4 py-8 sm:py-12">
      {/* Dynamic Animated Ambient Glow Spheres */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 -left-20 w-96 h-96 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -30, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`w-full ${
          isRegister ? 'max-w-2xl' : 'max-w-md'
        } mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-2xl shadow-black/80 text-white relative z-10`}
      >
        {children}
      </motion.div>

      <AnnouncementPopup />
    </div>
  )
}
