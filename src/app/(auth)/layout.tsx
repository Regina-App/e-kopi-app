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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1120] via-[#111c38] to-[#0b1120] p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`w-full ${
          isRegister ? 'max-w-2xl' : 'max-w-md'
        } mx-auto p-6 sm:p-8 rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl text-white transition-all duration-300`}
      >
        {children}
      </motion.div>
      <AnnouncementPopup />
    </div>
  )
}
