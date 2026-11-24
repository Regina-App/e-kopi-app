'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function SplashScreen() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2800)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] text-white px-4 relative overflow-hidden select-none">
      {/* Background Animated Glows */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-600/30 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-indigo-600/30 blur-[100px] pointer-events-none"
      />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 blur-xl opacity-60 animate-pulse" />
        <div className="relative rounded-3xl ring-2 ring-white/25 shadow-2xl overflow-hidden bg-slate-900/80 backdrop-blur-md p-3">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={110}
            height={110}
            priority
            className="rounded-2xl object-cover drop-shadow-lg"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mt-6"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Layanan Mandiri Karyawan Modern</span>
        </div>

        <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
          E-KOPI By Regina - App
        </h1>
        <p className="text-slate-200 text-xs sm:text-sm font-medium mt-2 max-w-sm mx-auto leading-relaxed">
          Employee Self-Service &amp; Cooperative Management Platform
        </p>
      </motion.div>

      {/* Progress / Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex items-center gap-2 mt-7 mb-4"
      >
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="w-2.5 h-2.5 rounded-full bg-blue-400"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>

      {/* Direct Skip Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-all shadow-md"
        >
          <span>Masuk Sekarang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  )
}
