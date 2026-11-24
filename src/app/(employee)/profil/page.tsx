'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  Briefcase,
  CreditCard,
  Edit3,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '@/lib/hooks/use-auth'
import {
  formatDate,
  formatNIK,
  getInitials,
  calculateWorkDuration,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SkeletonCard, ButtonSpinner } from '@/components/ui/loading'

export default function ProfilePage() {
  const { employee, isLoading, logout, refreshSession } = useAuth()

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Edit form state
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <SkeletonCard lines={3} className="h-44 rounded-3xl" />
        <SkeletonCard lines={6} className="h-96 rounded-2xl" />
      </div>
    )
  }

  const emp = employee || {
    id: 'placeholder',
    nik: '3201000000000000',
    full_name: 'Pegawai E-KOPI',
    birth_place: 'Jakarta',
    birth_date: '1995-05-15',
    address: 'Jl. Raya Kopi Indonesia No. 12',
    email: 'pegawai@ekopi.app',
    phone: '081234567890',
    company_name: 'PT E-KOPI Nusantara',
    site_name: 'Head Office',
    department_name: 'Operasional',
    position_name: 'Staff Administrasi',
    is_crew_member: false,
    crew_name: null,
    start_date: '2023-01-10',
    bank_name: 'Mandiri',
    account_number: '1420018293847',
    account_holder: 'PEGAWAI E-KOPI',
    status: 'approved' as const,
    is_active: true,
  }

  const duration = emp.start_date
    ? calculateWorkDuration(emp.start_date)
    : { years: 0, months: 0, days: 0, eligible: false }

  const initials = getInitials(emp.full_name) || 'EK'

  const handleOpenEdit = () => {
    setEditEmail(emp.email || '')
    setEditPhone(emp.phone || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch('/api/employees/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editEmail,
          phone: editPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal memperbarui data profil')
        setIsSaving(false)
        return
      }

      toast.success('Kontak profil berhasil diperbarui!')
      await refreshSession()
      setIsEditDialogOpen(false)
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Berhasil keluar')
    } catch {
      toast.error('Terjadi kesalahan saat keluar')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. HEADER PROFILE CARD */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Initials */}
            <div className="relative">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-2xl sm:text-3xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-blue-950">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {emp.full_name}
                </h1>
                <Badge
                  variant={emp.status === 'approved' ? 'success' : 'warning'}
                  className="px-2.5 py-0.5 text-xs font-semibold"
                >
                  {emp.status === 'approved' ? 'Aktif' : 'Pending Persetujuan'}
                </Badge>
              </div>

              <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                NIK: {formatNIK(emp.nik)}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>{emp.company_name || 'PT E-KOPI Nusantara'}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>{emp.position_name || 'Staff'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="gap-2 border-slate-200 dark:border-slate-800"
            >
              <Edit3 className="h-4 w-4 text-blue-600" />
              <span>Edit Kontak</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. TABS SECTION */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Tabs defaultValue="pribadi" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800">
            <TabsTrigger
              value="pribadi"
              className="rounded-xl text-xs sm:text-sm font-semibold gap-2 data-[state=active]:shadow-xs"
            >
              <User className="h-4 w-4" />
              <span>Data Pribadi</span>
            </TabsTrigger>
            <TabsTrigger
              value="pekerjaan"
              className="rounded-xl text-xs sm:text-sm font-semibold gap-2 data-[state=active]:shadow-xs"
            >
              <Briefcase className="h-4 w-4" />
              <span>Data Pekerjaan</span>
            </TabsTrigger>
            <TabsTrigger
              value="rekening"
              className="rounded-xl text-xs sm:text-sm font-semibold gap-2 data-[state=active]:shadow-xs"
            >
              <CreditCard className="h-4 w-4" />
              <span>Rekening</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DATA PRIBADI */}
          <TabsContent value="pribadi" className="mt-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Informasi Kependudukan & Kontak</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Perubahan NIK & Nama hanya melalui Admin HR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Nomor Induk Kependudukan (NIK)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-base">
                    {formatNIK(emp.nik)}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Nama Lengkap</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                    {emp.full_name}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Tempat, Tanggal Lahir</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {emp.birth_place || '-'}, {emp.birth_date ? formatDate(emp.birth_date) : '-'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Nomor WhatsApp / HP</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <span>{emp.phone || '-'}</span>
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40 sm:col-span-2">
                  <span className="text-xs text-slate-400 block">Alamat Email</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span>{emp.email || '-'}</span>
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40 sm:col-span-2">
                  <span className="text-xs text-slate-400 block">Alamat Domisili KTP</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{emp.address || '-'}</span>
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: DATA PEKERJAAN */}
          <TabsContent value="pekerjaan" className="mt-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span>Penempatan & Struktur Organisasi</span>
                </h3>
                <Badge variant="outline" className="text-xs">
                  {emp.is_crew_member ? 'Shift / Regu' : 'Non-Shift'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Perusahaan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.company_name || 'PT E-KOPI Nusantara'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Site / Kebun</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.site_name || 'Head Office'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Departemen / Divisi</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.department_name || 'Operasional'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Jabatan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.position_name || 'Staff'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Regu Kerja</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.is_crew_member ? (emp.crew_name || 'Regu 1') : 'Non-Regu'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Tanggal Mulai Tugas (TMT)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>{emp.start_date ? formatDate(emp.start_date) : '-'}</span>
                  </span>
                </div>

                {/* Masa Kerja Calculation Card */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/30 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    <Clock className="h-4 w-4" />
                    <span>Masa Kerja Dihitung:</span>
                  </div>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                    {duration.years} Tahun, {duration.months} Bulan, {duration.days} Hari
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {duration.eligible
                      ? '✓ Memenuhi syarat hak cuti tahunan dan pinjaman koperasi (Masa kerja >= 12 bulan).'
                      : `Belum memenuhi syarat (Masa kerja di bawah 12 bulan).`}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: REKENING */}
          <TabsContent value="rekening" className="mt-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Informasi Rekening Bank</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Digunakan untuk penyaluran dana pinjaman koperasi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400 block">Bank Rekening</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    Bank {emp.bank_name || 'Mandiri'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/40 sm:col-span-2">
                  <span className="text-xs text-slate-400 block">Nomor Rekening</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg tracking-wider">
                    {emp.account_number || '-'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/40 sm:col-span-3">
                  <span className="text-xs text-slate-400 block">Atas Nama Rekening</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 uppercase text-base">
                    {emp.account_holder || emp.full_name}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Pastikan nama pemilik rekening sama persis dengan nama Anda pada buku tabungan. Hubungi Administrator jika ingin memperbarui nomor rekening.
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* 3. LOGOUT ACTION BUTTON */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="pt-4"
      >
        <Button
          variant="outline"
          onClick={() => setIsLogoutDialogOpen(true)}
          className="w-full h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/30 gap-2 font-semibold shadow-xs"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar dari Akun (Logout)</span>
        </Button>
      </motion.div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ubah Kontak Profil</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pegawai hanya diizinkan memperbarui alamat email dan nomor telepon. Untuk data lain silakan hubungi bagian HR.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs">
                Alamat Email Aktif *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-xs">
                Nomor WhatsApp / Telepon *
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="081234567890"
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <ButtonSpinner size={16} />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LOGOUT CONFIRM DIALOG */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              <span>Konfirmasi Keluar</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin keluar dari akun E-KOPI? Anda harus melakukan verifikasi NIK dan OTP kembali untuk masuk.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isLoggingOut ? (
                <div className="flex items-center gap-2">
                  <ButtonSpinner size={16} />
                  <span>Mengeluarkan...</span>
                </div>
              ) : (
                <span>Ya, Keluar</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
