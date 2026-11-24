'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Lock,
  Headphones,
} from 'lucide-react'

import { loginSchema, type LoginInput } from '@/lib/validators'
import { formatNIK } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/loading'
import {
  WhatsAppLogo,
  GmailLogo,
  CS_WHATSAPP_URL,
  CS_GMAIL_URL,
} from '@/components/CsContactButtons'

export default function LoginPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayNIK, setDisplayNIK] = useState('')

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nik: '' },
  })

  const handleNIKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 16)
    setValue('nik', rawVal, { shouldValidate: true })
    setDisplayNIK(formatNIK(rawVal))
  }

  const onSubmit = async (data: LoginInput) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: data.nik }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal masuk. Periksa kembali NIK Anda.')
        setIsSubmitting(false)
        return
      }

      toast.success('Kode OTP berhasil dikirim!')

      // Store basic auth handshake data in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ekopi_auth_employee_id', result.employeeId)
        sessionStorage.setItem('ekopi_auth_masked_email', result.maskedEmail || '')
        sessionStorage.setItem('ekopi_auth_masked_phone', result.maskedPhone || '')
      }

      // Redirect to OTP verification page
      const queryParams = new URLSearchParams({
        id: result.employeeId,
        target: result.maskedEmail || result.maskedPhone || '',
      })

      router.push(`/verify-otp?${queryParams.toString()}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan'
      toast.error(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* 1. Animated Online Status Pill */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-5 shadow-xs"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Sistem Online • E-KOPI Mobile</span>
      </motion.div>

      {/* 2. Brand Logo with Ambient Pulsing Glow */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-5"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 blur-xl"
        />
        <div className="relative rounded-2xl bg-slate-900/90 p-3 ring-2 ring-white/20 shadow-2xl backdrop-blur-md">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={72}
            height={72}
            priority
            className="rounded-xl object-contain drop-shadow-md"
          />
        </div>
      </motion.div>

      {/* 3. Welcome Headline & Description (Kata Pembuka Terkait Aplikasi) */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Selamat Datang di{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-200">
            E-KOPI
          </span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-200 max-w-sm mx-auto leading-relaxed">
          Platform Layanan Mandiri Karyawan Cerdas: Pengajuan Cuti Online, Pinjaman Koperasi Resmi, & Pengunduhan Surat Cuti Digital.
        </p>
      </motion.div>

      {/* 4. Form NIK */}
      <motion.form
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="nik" className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Nomor Induk Kependudukan (NIK)</span>
            </label>
            <span
              className={
                displayNIK.replace(/\s+/g, '').length === 16
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-300 font-medium'
              }
            >
              {displayNIK.replace(/\s+/g, '').length} / 16 Digit
            </span>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-300">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <input
              id="nik"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={displayNIK}
              onChange={handleNIKChange}
              placeholder="3201 1234 5678 0001"
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-slate-950/80 px-4 py-3 pl-11 text-base tracking-wider text-white font-medium placeholder:text-slate-500 shadow-inner outline-none transition-all focus:bg-slate-950 focus:ring-2 focus:ring-blue-400 ${
                errors.nik ? 'border-red-400 focus:border-red-400' : 'border-slate-600 focus:border-blue-400'
              }`}
            />
          </div>

          {errors.nik && (
            <p className="text-xs text-red-300 font-semibold pl-1">
              {errors.nik.message}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 rounded-xl bg-blue-500/15 p-3 border border-blue-400/25 text-xs text-blue-100 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" />
          <span>Login aman bebas password. Kode OTP dikirim langsung ke kontak Anda.</span>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || displayNIK.replace(/\s+/g, '').length !== 16}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <ButtonSpinner size={18} />
              <span>Mengirim Kode OTP...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Masuk Aplikasi</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </motion.form>

      {/* 5. Navigation Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-6 flex flex-col items-center gap-2 text-center w-full"
      >
        <p className="text-xs sm:text-sm text-slate-200">
          Karyawan baru dan belum terdaftar?{' '}
          <Link
            href="/register"
            className="font-bold text-blue-300 hover:text-blue-200 underline underline-offset-4 transition-colors"
          >
            Daftar Akun Sekarang
          </Link>
        </p>

        <div className="pt-2 border-t border-slate-700/60 w-full flex justify-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-white/5"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Login Khusus Administrator / HRD</span>
          </Link>
        </div>
      </motion.div>

      {/* 6. CS Support Card Terintegrasi di Awal Halaman Login */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-6 w-full rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-200 mb-2.5">
          <Headphones className="w-4 h-4 text-emerald-400" />
          <span>Bantuan & Layanan Customer Service Resmi</span>
        </div>
        <p className="text-[11px] text-slate-300 mb-3 max-w-xs mx-auto">
          Ada kendala NIK tidak terdaftar, OTP, atau pertanyaan seputar aplikasi? Hubungi kami langsung:
        </p>

        <div className="flex items-center justify-center gap-4">
          <a
            href={CS_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Hubungi Customer Service via WhatsApp"
            className="p-2.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-transform active:scale-95 shadow-sm"
          >
            <WhatsAppLogo className="w-6 h-6" />
          </a>

          <a
            href={CS_GMAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Hubungi Customer Service via Email"
            className="p-2.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-transform active:scale-95 shadow-sm"
          >
            <GmailLogo className="w-6 h-6" />
          </a>
        </div>
      </motion.div>
    </div>
  )
}
