'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  CalendarDays,
  Landmark,
  FileText,
  Download,
  Mail,
  XCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react'
import { formatDate, formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function RiwayatHubPage() {
  const [activeTab, setActiveTab] = useState<'cuti' | 'koperasi'>('cuti')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Leave State
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [leaveBalance, setLeaveBalance] = useState<any>(null)
  const [loadingLeave, setLoadingLeave] = useState<boolean>(true)
  const [cancelLeaveTarget, setCancelLeaveTarget] = useState<any>(null)
  const [cancellingLeave, setCancellingLeave] = useState<boolean>(false)

  // Loan State
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [activeLoan, setActiveLoan] = useState<any>(null)
  const [loadingLoan, setLoadingLoan] = useState<boolean>(true)
  const [cancelLoanTarget, setCancelLoanTarget] = useState<any>(null)
  const [cancellingLoan, setCancellingLoan] = useState<boolean>(false)

  // Fetch Leave Data
  const fetchLeaveData = async () => {
    setLoadingLeave(true)
    try {
      const [balRes, reqRes] = await Promise.all([
        fetch('/api/leave/balance'),
        fetch('/api/leave/request'),
      ])

      if (balRes.ok) {
        const balJson = await balRes.json()
        if (balJson.success) setLeaveBalance(balJson.data)
      }

      if (reqRes.ok) {
        const reqJson = await reqRes.json()
        if (reqJson.success && Array.isArray(reqJson.data)) {
          setLeaveRequests(reqJson.data)
        }
      }
    } catch {
      console.error('[RiwayatHub] Gagal memuat riwayat cuti')
    } finally {
      setLoadingLeave(false)
    }
  }

  // Fetch Loan Data
  const fetchLoanData = async () => {
    setLoadingLoan(true)
    try {
      const [actRes, reqRes] = await Promise.all([
        fetch('/api/loan/active'),
        fetch('/api/loan/request'),
      ])

      if (actRes.ok) {
        const actJson = await actRes.json()
        if (actJson.success) setActiveLoan(actJson.data)
      }

      if (reqRes.ok) {
        const reqJson = await reqRes.json()
        if (reqJson.success && Array.isArray(reqJson.data)) {
          setLoanRequests(reqJson.data)
        }
      }
    } catch {
      console.error('[RiwayatHub] Gagal memuat riwayat koperasi')
    } finally {
      setLoadingLoan(false)
    }
  }

  useEffect(() => {
    fetchLeaveData()
    fetchLoanData()
  }, [])

  // Cancel Leave Handler
  const handleCancelLeave = async () => {
    if (!cancelLeaveTarget) return
    setCancellingLeave(true)
    try {
      const res = await fetch(`/api/leave/request/${cancelLeaveTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengajuan cuti berhasil dibatalkan.')
        setCancelLeaveTarget(null)
        fetchLeaveData()
      } else {
        toast.error(json.error || 'Gagal membatalkan pengajuan.')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setCancellingLeave(false)
    }
  }

  // Cancel Loan Handler
  const handleCancelLoan = async () => {
    if (!cancelLoanTarget) return
    setCancellingLoan(true)
    try {
      const res = await fetch(`/api/loan/request/${cancelLoanTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengajuan pinjaman berhasil dibatalkan.')
        setCancelLoanTarget(null)
        fetchLoanData()
      } else {
        toast.error(json.error || 'Gagal membatalkan pengajuan pinjaman.')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.')
    } finally {
      setCancellingLoan(false)
    }
  }

  // Send Surat Cuti to Email
  const handleSendEmail = async (id: string) => {
    const toastId = toast.loading('Mengirimkan surat cuti ke email Anda...')
    try {
      const res = await fetch(`/api/leave/letter/${id}/email`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || 'Surat cuti PDF berhasil dikirim ke email!', { id: toastId })
      } else {
        toast.error(json.error || 'Gagal mengirimkan email.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat mengirim email.', { id: toastId })
    }
  }

  // Filter lists
  const filteredLeaves = leaveRequests.filter((item) => {
    if (statusFilter === 'all') return true
    return item.status === statusFilter
  })

  const filteredLoans = loanRequests.filter((item) => {
    if (statusFilter === 'all') return true
    return item.status === statusFilter
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Riwayat Pengajuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Pantau status verifikasi cuti tahunan, pinjaman koperasi, dan unduh dokumen resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cuti' ? (
            <Link
              href="/cuti/ajukan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Cuti Baru</span>
            </Link>
          ) : (
            <Link
              href="/koperasi/ajukan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Pinjaman Baru</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800 p-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveTab('cuti')
            setStatusFilter('all')
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'cuti'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Riwayat Cuti ({leaveRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('koperasi')
            setStatusFilter('all')
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'koperasi'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Riwayat Koperasi ({loanRequests.length})</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      {activeTab === 'cuti' ? (
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Jatah Kuota</span>
            <div className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300">
              {leaveBalance?.total_allocation ?? 12} Hari
            </div>
          </div>
          <div className="border-x border-blue-200/80 dark:border-blue-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Terpakai</span>
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
              {leaveBalance?.used_days ?? 0} Hari
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Sisa Kuota</span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {leaveBalance?.remaining_days ?? 12} Hari
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Pinjaman Aktif</span>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {activeLoan ? formatRupiah(activeLoan.loan_amount) : 'Rp 0'}
            </div>
          </div>
          <div className="border-x border-emerald-200/80 dark:border-emerald-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Angsuran / Bln</span>
            <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 truncate">
              {activeLoan ? formatRupiah(activeLoan.installment_per_month) : 'Rp 0'}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Sisa Kewajiban</span>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 truncate">
              {activeLoan ? formatRupiah(activeLoan.total_obligation) : 'Rp 0'}
            </div>
          </div>
        </div>
      )}

      {/* Filter Status Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Filter:</span>
        {[
          { key: 'all', label: 'Semua Status' },
          { key: 'pending', label: 'Menunggu (Pending)' },
          { key: 'approved', label: 'Disetujui (Approved)' },
          { key: 'rejected', label: 'Ditolak' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === f.key
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 1. SECTION RIWAYAT CUTI */}
      {activeTab === 'cuti' && (
        <div className="space-y-4">
          {loadingLeave ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <CalendarDays className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Riwayat Cuti</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter === 'all'
                  ? 'Anda belum pernah mengajukan cuti tahunan. Klik tombol di bawah untuk membuat pengajuan baru.'
                  : `Tidak ada riwayat pengajuan cuti dengan status "${statusFilter}".`}
              </p>
              <div className="mt-4">
                <Link
                  href="/cuti/ajukan"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajukan Cuti Sekarang</span>
                </Link>
              </div>
            </div>
          ) : (
            filteredLeaves.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {req.id}
                      </span>
                      <Badge
                        variant={
                          req.status === 'approved'
                            ? 'success'
                            : req.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {req.status === 'approved'
                          ? 'Disetujui'
                          : req.status === 'pending'
                          ? 'Menunggu'
                          : req.status === 'rejected'
                          ? 'Ditolak'
                          : 'Dibatalkan'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Diajukan pada: {formatDate(req.created_at, 'dd MMMM yyyy, HH:mm')} WIB
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Durasi</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {req.total_days} Hari Kerja
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="py-3 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 font-medium w-24 shrink-0">Alasan Cuti:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{req.reason}</span>
                  </div>
                  {req.emergency_contact && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-medium w-24 shrink-0">Kontak Darurat:</span>
                      <span className="text-slate-800 dark:text-slate-200">{req.emergency_contact}</span>
                    </div>
                  )}
                  {req.rejection_reason && req.status === 'rejected' && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs">
                      <strong>Alasan Penolakan:</strong> {req.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    {req.status === 'approved' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Surat cuti resmi siap diunduh & dicetak
                      </span>
                    ) : req.status === 'pending' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Sedang dalam antrean persetujuan atasan/admin
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'approved' && (
                      <>
                        <a
                          href={`/api/leave/letter/${req.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Surat Cuti (PDF)</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSendEmail(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                          title="Kirim file surat cuti ke email saya"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kirim ke Email</span>
                        </button>
                      </>
                    )}

                    {req.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setCancelLeaveTarget(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Batalkan</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* 2. SECTION RIWAYAT KOPERASI */}
      {activeTab === 'koperasi' && (
        <div className="space-y-4">
          {loadingLoan ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <Landmark className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Riwayat Koperasi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter === 'all'
                  ? 'Anda belum pernah mengajukan pinjaman koperasi. Formulir dibuka setiap tanggal 8 s/d 28.'
                  : `Tidak ada riwayat pinjaman dengan status "${statusFilter}".`}
              </p>
              <div className="mt-4">
                <Link
                  href="/koperasi/ajukan"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajukan Pinjaman Sekarang</span>
                </Link>
              </div>
            </div>
          ) : (
            filteredLoans.map((loan) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {loan.id}
                      </span>
                      {loan.is_takeover && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                          Takeover
                        </span>
                      )}
                      <Badge
                        variant={
                          loan.status === 'approved' || loan.status === 'completed'
                            ? 'success'
                            : loan.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {loan.status === 'approved'
                          ? 'Aktif (Berjalan)'
                          : loan.status === 'pending'
                          ? 'Menunggu'
                          : loan.status === 'completed'
                          ? 'Lunas'
                          : 'Ditolak'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Diajukan: {formatDate(loan.created_at, 'dd MMMM yyyy, HH:mm')} WIB
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Nominal Pinjaman</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatRupiah(loan.loan_amount)}
                    </span>
                  </div>
                </div>

                {/* Loan Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl my-2 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tenor:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{loan.tenor} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Angsuran/Bln:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(loan.installment_per_month)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Kewajiban:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(loan.total_obligation)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pencairan Bersih:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatRupiah(loan.net_disbursement || loan.loan_amount)}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Potongan gaji otomatis setiap tanggal 5 setiap bulannya.
                  </span>

                  {loan.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => setCancelLoanTarget(loan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Batalkan Pinjaman</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Cancel Leave Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(cancelLeaveTarget)}
        onOpenChange={(open) => !open && setCancelLeaveTarget(null)}
        title="Batalkan Pengajuan Cuti?"
        description={`Apakah Anda yakin ingin membatalkan pengajuan cuti ${cancelLeaveTarget?.total_days} hari (${cancelLeaveTarget?.id})? Kuota cuti Anda tidak akan terpotong.`}
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        variant="destructive"
        loading={cancellingLeave}
        onConfirm={handleCancelLeave}
      />

      {/* Cancel Loan Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(cancelLoanTarget)}
        onOpenChange={(open) => !open && setCancelLoanTarget(null)}
        title="Batalkan Pengajuan Pinjaman?"
        description={`Apakah Anda yakin ingin membatalkan pengajuan pinjaman sebesar ${formatRupiah(cancelLoanTarget?.loan_amount || 0)} (${cancelLoanTarget?.id})?`}
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        variant="destructive"
        loading={cancellingLoan}
        onConfirm={handleCancelLoan}
      />
    </div>
  )
}
