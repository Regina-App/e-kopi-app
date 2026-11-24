'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SplashScreen() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4 select-none">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
        <div className="relative rounded-2xl ring-2 ring-white/20 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm p-2">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={120}
            height={120}
            priority
            className="rounded-2xl object-cover"
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-white text-2xl font-bold mt-6 text-center tracking-tight"
      >
        E-KOPI By Regina - App
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-slate-400 text-sm mt-2 text-center max-w-sm"
      >
        Employee Self-Service &amp; Cooperative Management Platform
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="flex items-center gap-2 mt-8"
      >
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="w-2.5 h-2.5 rounded-full bg-blue-500"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
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
    </div>
  )
}
