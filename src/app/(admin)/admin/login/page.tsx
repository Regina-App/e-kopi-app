'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Sparkles,
  Headphones,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  WhatsAppLogo,
  GmailLogo,
  CS_WHATSAPP_URL,
  CS_GMAIL_URL,
} from '@/components/CsContactButtons'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Force PIN change modal state
  const [showForceChange, setShowForceChange] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [changePinLoading, setChangePinLoading] = useState(false)
  const [changePinError, setChangePinError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Masukkan alamat email.')
      return
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN harus berupa 4 digit angka.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin: pin.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Email atau PIN salah. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // Check if force PIN change is required
      if (data.forcePinChange || data.admin?.force_pin_change) {
        setShowForceChange(true)
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi gangguan jaringan saat login.')
      setLoading(false)
    }
  }

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangePinError(null)

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setChangePinError('PIN baru harus tepat 4 digit angka.')
      return
    }

    if (newPin !== confirmPin) {
      setChangePinError('Konfirmasi PIN baru tidak sesuai.')
      return
    }

    if (newPin === pin) {
      setChangePinError('PIN baru tidak boleh sama dengan PIN saat ini.')
      return
    }

    setChangePinLoading(true)

    try {
      const res = await fetch('/api/admin/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_pin: pin.trim(),
          new_pin: newPin.trim(),
          confirm_pin: confirmPin.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setChangePinError(data.error || 'Gagal mengubah PIN.')
        setChangePinLoading(false)
        return
      }

      setShowForceChange(false)
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setChangePinError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.')
      setChangePinLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic Animated Ambient Glows */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 25, 0],
          y: [0, -35, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 -left-28 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -25, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 -right-28 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding Header with Welcome Words */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3 tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            PANEL KENDALI ADMINISTRATOR
          </div>

          <div className="flex justify-center mb-3">
            <div className="p-2 rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-xl backdrop-blur-md">
              <Image
                src="/images/logo.png"
                alt="E-KOPI Logo"
                width={52}
                height={52}
                className="rounded-xl object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            E-KOPI By Regina
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-sm mx-auto leading-relaxed">
            Selamat datang di Portal Manajemen Super Admin. Kelola master perusahaan, persetujuan cuti & pinjaman, serta rekap database.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-start gap-2.5 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs text-slate-100 font-semibold">
                Alamat Email Administrator
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@ekopi.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950/80 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-11 text-sm rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            {/* 4-digit PIN Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-pin" className="text-xs text-slate-100 font-semibold">
                  PIN Keamanan (4 Digit)
                </Label>
                <span className="text-[11px] text-slate-300 font-medium">Kombinasi Rahasia</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setPin(clean)
                  }}
                  className="pl-10 tracking-[0.4em] font-mono text-center text-lg bg-slate-950/80 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 gap-2 text-sm mt-3 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </div>
              ) : (
                <>
                  <span>Masuk Panel Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Switch to Employee Portal */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kembali ke Halaman Login Karyawan</span>
            </Link>
          </div>
        </div>

        {/* CS Support Card di Admin Login */}
        <div className="mt-5 w-full rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-200 mb-1.5">
            <Headphones className="w-4 h-4 text-emerald-400" />
            <span>Bantuan CS Support Aplikasi</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2.5">
            Lupa PIN atau butuh bantuan teknis seputar sistem E-KOPI?
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href={CS_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Hubungi Customer Service via WhatsApp"
              className="p-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-transform active:scale-95 shadow-sm"
            >
              <WhatsAppLogo className="w-5 h-5" />
            </a>

            <a
              href={CS_GMAIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Hubungi Customer Service via Email"
              className="p-2 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-transform active:scale-95 shadow-sm"
            >
              <GmailLogo className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-slate-400">
          Akses terbatas hanya untuk administrator resmi E-KOPI By Regina - App.
        </div>
      </motion.div>

      {/* Force PIN Change Modal */}
      <Dialog open={showForceChange} onOpenChange={setShowForceChange}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Wajib Perbarui PIN Anda
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs leading-relaxed">
              Ini adalah login pertama Anda atau akun Anda memerlukan pembaruan PIN keamanan. Buat 4 digit PIN baru yang aman.
            </DialogDescription>
          </DialogHeader>

          {changePinError && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-700 text-red-200 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{changePinError}</span>
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-semibold">PIN Baru (4 Digit Angka)</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="bg-slate-950 border-slate-700 text-white font-mono tracking-widest text-center h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-200 font-semibold">Konfirmasi PIN Baru</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="bg-slate-950 border-slate-700 text-white font-mono tracking-widest text-center h-10"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={changePinLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
              >
                {changePinLoading ? 'Menyimpan...' : 'Simpan PIN & Lanjutkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
