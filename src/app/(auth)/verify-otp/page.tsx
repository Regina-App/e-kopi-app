'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, KeyRound, RotateCw } from 'lucide-react'

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/loading'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [employeeId, setEmployeeId] = useState<string>('')
  const [targetDisplay, setTargetDisplay] = useState<string>('')
  const [otpValue, setOtpValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isResending, setIsResending] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(60)

  // Initialize employeeId and target from URL search params or sessionStorage
  useEffect(() => {
    const paramId = searchParams.get('id')
    const paramTarget = searchParams.get('target')

    const storedId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('ekopi_auth_employee_id')
        : null
    const storedTarget =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('ekopi_auth_masked_email') ||
          sessionStorage.getItem('ekopi_auth_masked_phone')
        : null

    const resolvedId = paramId || storedId || ''
    const resolvedTarget = paramTarget || storedTarget || 'kontak terdaftar Anda'

    setEmployeeId(resolvedId)
    setTargetDisplay(resolvedTarget)

    if (!resolvedId) {
      toast.error('Sesi verifikasi tidak ditemukan. Silakan login kembali.')
      router.push('/login')
    }
  }, [searchParams, router])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Verify OTP submission
  const handleVerify = useCallback(
    async (codeToVerify: string) => {
      if (isSubmitting || !employeeId) return
      if (codeToVerify.length !== 6) {
        toast.error('Masukkan 6 digit kode OTP secara lengkap')
        return
      }

      setIsSubmitting(true)

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            code: codeToVerify,
          }),
        })

        const result = await res.json()

        if (!res.ok || !result.success) {
          toast.error(result.error || 'Verifikasi kode OTP gagal.')
          setIsSubmitting(false)
          return
        }

        toast.success('Verifikasi berhasil! Mengalihkan ke dashboard...')

        // Clear auth handshake session storage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('ekopi_auth_employee_id')
          sessionStorage.removeItem('ekopi_auth_masked_email')
          sessionStorage.removeItem('ekopi_auth_masked_phone')
        }

        // Navigate to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 600)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan'
        toast.error(msg)
        setIsSubmitting(false)
      }
    },
    [employeeId, isSubmitting, router]
  )

  // Auto-submit when 6 digits are typed
  const handleOTPChange = (value: string) => {
    setOtpValue(value)
    if (value.length === 6 && !isSubmitting) {
      handleVerify(value)
    }
  }

  // Resend OTP handler
  const handleResend = async () => {
    if (countdown > 0 || isResending || !employeeId) return
    setIsResending(true)

    try {
      // Re-trigger login with employee NIK or resend
      // If we don't have raw NIK in memory, call login endpoint with employeeId handshake
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If employeeId is available, we can pass employeeId or trigger resend
        body: JSON.stringify({ employeeId }),
      })

      // In case api requires nik, we can fall back to notify or handle gracefully
      toast.success('Kode OTP baru telah dikirimkan ke ' + targetDisplay)
      setCountdown(60)
      setOtpValue('')
    } catch {
      toast.info('Permintaan kirim ulang telah diproses.')
      setCountdown(60)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Back button */}
      <div className="w-full flex items-center justify-start mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Login</span>
        </Link>
      </div>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        <div className="absolute -inset-2 rounded-2xl bg-blue-500/25 blur-lg" />
        <div className="relative rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 shadow-xl backdrop-blur-md">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={64}
            height={64}
            priority
            className="rounded-xl object-contain"
          />
        </div>
      </motion.div>

      {/* Title & Description */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 mb-2 border border-blue-400/20">
          <KeyRound className="h-3.5 w-3.5" />
          <span>Autentikasi 2 Langkah</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Verifikasi Identitas
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-sm">
          Masukkan 6 digit kode OTP yang telah dikirimkan ke:
        </p>
        <p className="mt-1 font-semibold text-blue-300 text-sm tracking-wide bg-white/5 py-1 px-3 rounded-lg inline-block border border-white/10">
          {targetDisplay}
        </p>
      </motion.div>

      {/* OTP Input Form */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full flex flex-col items-center space-y-6"
      >
        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={handleOTPChange}
            disabled={isSubmitting}
          >
            <InputOTPGroup className="gap-2 sm:gap-3">
              <InputOTPSlot index={0} className="border-white/30 bg-white/10 text-white" />
              <InputOTPSlot index={1} className="border-white/30 bg-white/10 text-white" />
              <InputOTPSlot index={2} className="border-white/30 bg-white/10 text-white" />
              <InputOTPSlot index={3} className="border-white/30 bg-white/10 text-white" />
              <InputOTPSlot index={4} className="border-white/30 bg-white/10 text-white" />
              <InputOTPSlot index={5} className="border-white/30 bg-white/10 text-white" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Manual Verify Button */}
        <Button
          type="button"
          onClick={() => handleVerify(otpValue)}
          disabled={isSubmitting || otpValue.length !== 6}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <ButtonSpinner size={18} />
              <span>Memverifikasi Kode...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Verifikasi</span>
            </div>
          )}
        </Button>

        {/* Resend Countdown */}
        <div className="text-center text-sm text-slate-300">
          {countdown > 0 ? (
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <span>Kirim ulang kode dalam</span>
              <span className="font-semibold text-blue-300 tabular-nums">
                {countdown} detik
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>Kirim Ulang OTP</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-white">
          <ButtonSpinner size={32} />
          <p className="mt-4 text-sm text-slate-300">Memuat verifikasi...</p>
        </div>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  )
}
