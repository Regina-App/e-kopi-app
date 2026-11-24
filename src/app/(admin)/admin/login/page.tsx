'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'
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

  const fillDefaultAdmin = () => {
    setEmail('mohammadrizal6666@gmail.com')
    setPin('1111')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4 tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5" />
            PANEL ADMIN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            E-KOPI By Regina
          </h1>
          <p className="text-sm text-slate-400">
            Sistem Informasi Manajemen & Administrasi Karyawan
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs text-slate-300 font-medium">
                Email Administrator
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@ekopi.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950/60 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-11 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            {/* 4-digit PIN Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-pin" className="text-xs text-slate-300 font-medium">
                  PIN Keamanan (4 Digit)
                </Label>
                <span className="text-[11px] text-slate-500">Angka rahasia</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  className="pl-10 tracking-[0.4em] font-mono text-center text-lg bg-slate-950/60 border-slate-700/80 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20 gap-2 text-sm mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                <>
                  <span>Masuk Panel Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Credential Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Kredensial bawaan:</span>
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium underline underline-offset-4"
            >
              Super Admin (1111)
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-600">
          Akses terbatas hanya untuk administrator resmi E-KOPI.
        </div>
      </motion.div>

      {/* Force PIN Change Modal */}
      <Dialog open={showForceChange} onOpenChange={setShowForceChange}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Wajib Perbarui PIN Anda
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs leading-relaxed">
              Ini adalah login pertama Anda atau akun Anda memerlukan pembaruan PIN keamanan. Buat 4 digit PIN baru yang aman.
            </DialogDescription>
          </DialogHeader>

          {changePinError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{changePinError}</span>
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">PIN Baru (4 Digit Angka)</Label>
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
              <Label className="text-xs text-slate-300">Konfirmasi PIN Baru</Label>
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
