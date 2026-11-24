'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react'

import { loginSchema, type LoginInput } from '@/lib/validators'
import { formatNIK } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/ui/loading'

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
    <div className="flex flex-col items-center">
      {/* Large E-KOPI Logo */}
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
            width={72}
            height={72}
            priority
            className="rounded-xl object-contain"
          />
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Masuk ke Akun Anda
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Gunakan NIK 16 digit terdaftar untuk menerima kode verifikasi OTP.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-5"
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <label htmlFor="nik" className="font-medium text-slate-200">
              Nomor Induk Kependudukan (NIK)
            </label>
            <span
              className={
                displayNIK.replace(/\s+/g, '').length === 16
                  ? 'text-emerald-400 font-medium'
                  : 'text-slate-400'
              }
            >
              {displayNIK.replace(/\s+/g, '').length} / 16
            </span>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <CreditCard className="h-5 w-5" />
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
              className={`w-full rounded-xl border bg-white/10 px-4 py-3 pl-11 text-base tracking-wider text-white placeholder:text-slate-400 shadow-inner backdrop-blur-md outline-none transition-all focus:bg-white/15 focus:ring-2 focus:ring-blue-400 ${
                errors.nik ? 'border-red-400 focus:border-red-400' : 'border-white/20'
              }`}
            />
          </div>

          {errors.nik && (
            <p className="text-xs text-red-400 font-medium pl-1">
              {errors.nik.message}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 p-3 border border-blue-400/20 text-xs text-blue-200">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" />
          <span>Login aman bebas password. Kode OTP dikirim langsung ke kontak Anda.</span>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || displayNIK.replace(/\s+/g, '').length !== 16}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <ButtonSpinner size={18} />
              <span>Memproses...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Masuk</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </motion.form>

      {/* Link to Register */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-slate-300">
          Belum memiliki akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
          >
            Daftar Sekarang
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
