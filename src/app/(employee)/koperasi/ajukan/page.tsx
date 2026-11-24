'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Building,
  CreditCard,
  FileCheck2,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah, formatDate, formatNIK } from '@/lib/utils'
import { ButtonSpinner } from '@/components/ui/loading'

interface LoanSettingsData {
  interest_rate: number
  max_tenor: number
  max_loan: number
  loan_period_start: number
  loan_period_end: number
  loan_deduction_day: number
  current_day: number
  is_within_period: boolean
}

interface EmployeeData {
  id: string
  nik: string
  full_name: string
  company_name: string
  site_name: string
  department_name: string
  position_name: string
  bank_name: string
  account_number: string
  account_holder: string
}

interface ActiveLoanData {
  id: string
  loan_amount: number
  tenor: number
  installment_per_month: number
  total_obligation: number
  status: string
}

const QUICK_AMOUNTS = [1000000, 2000000, 3000000, 5000000, 10000000]

export default function PengajuanPinjamanPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat formulir pengajuan...</p>
          </div>
        </div>
      }
    >
      <PengajuanPinjamanContent />
    </React.Suspense>
  )
}

function PengajuanPinjamanContent() {
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  // Remote data
  const [settings, setSettings] = useState<LoanSettingsData>({
    interest_rate: 0.025,
    max_tenor: 4,
    max_loan: 10000000,
    loan_period_start: 8,
    loan_period_end: 28,
    loan_deduction_day: 5,
    current_day: 15,
    is_within_period: true,
  })
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [activeLoan, setActiveLoan] = useState<ActiveLoanData | null>(null)
  const [remainingObligation, setRemainingObligation] = useState(0)
  const [pendingRequest, setPendingRequest] = useState<any>(null)
  const [isFirstTimeBorrower, setIsFirstTimeBorrower] = useState(true)

  // Form input state
  const [loanAmount, setLoanAmount] = useState<number>(3000000)
  const [tenor, setTenor] = useState<number>(3)
  const [isTakeover, setIsTakeover] = useState<boolean>(false)

  // Load initial settings and eligibility
  useEffect(() => {
    setCurrentDate(new Date())

    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch('/api/loan/settings')
        const json = await res.json()

        if (json.success && json.data) {
          const {
            settings: s,
            employee: emp,
            active_loan: al,
            remaining_obligation: ro,
            pending_request: pr,
            is_first_time_borrower: iftb,
          } = json.data

          if (s) setSettings(s)
          if (emp) setEmployee(emp)
          if (al) {
            setActiveLoan(al)
            setIsTakeover(true) // default to takeover if active loan exists
          }
          if (typeof ro === 'number') setRemainingObligation(ro)
          if (pr) setPendingRequest(pr)
          if (typeof iftb === 'boolean') setIsFirstTimeBorrower(iftb)

          // Pre-set loan amount if takeover is required
          if (al && ro > 0) {
            const suggested = Math.min(
              s?.max_loan || 10000000,
              Math.ceil((ro + 1000000) / 1000000) * 1000000
            )
            setLoanAmount(suggested)
          }
        }
      } catch (err) {
        console.error('Failed to load loan settings:', err)
        toast.error('Gagal memuat konfigurasi pengajuan')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Strict integer math calculation
  const calculation = useMemo(() => {
    const cleanAmount = Math.floor(Math.max(0, loanAmount))
    const cleanTenor = Math.floor(Math.max(1, tenor))

    const principalPerMonth = Math.floor(cleanAmount / cleanTenor)
    const interestPerMonth = Math.floor(cleanAmount * (settings.interest_rate || 0.025))
    const installmentPerMonth = principalPerMonth + interestPerMonth
    const lastPrincipal = cleanAmount - principalPerMonth * (cleanTenor - 1)
    const totalObligation =
      principalPerMonth * (cleanTenor - 1) + lastPrincipal + interestPerMonth * cleanTenor

    const schedule = []
    const refDate = currentDate || new Date(2026, 0, 1)
    for (let i = 1; i <= cleanTenor; i++) {
      const isLast = i === cleanTenor
      const p = isLast ? lastPrincipal : principalPerMonth
      const total = p + interestPerMonth

      // 5th of each month starting next month
      const dueDate = new Date(
        refDate.getFullYear(),
        refDate.getMonth() + i,
        settings.loan_deduction_day || 5
      )
      schedule.push({
        number: i,
        dueDate,
        principal: p,
        interest: interestPerMonth,
        total,
      })
    }

    // Takeover calculations
    const netDisbursement = isTakeover
      ? Math.max(0, cleanAmount - remainingObligation)
      : cleanAmount
    const isTakeoverValid = !isTakeover || cleanAmount > remainingObligation

    return {
      principalPerMonth,
      interestPerMonth,
      installmentPerMonth,
      lastPrincipal,
      totalObligation,
      schedule,
      netDisbursement,
      isTakeoverValid,
    }
  }, [loanAmount, tenor, settings, isTakeover, remainingObligation])

  // Handle amount change with number formatting
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const val = parseInt(raw || '0', 10)
    setLoanAmount(val)
  }

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!settings.is_within_period) {
      toast.error('Periode pengajuan pinjaman saat ini sedang ditutup.')
      return
    }

    if (pendingRequest) {
      toast.error('Anda masih memiliki pengajuan pinjaman yang sedang diproses.')
      return
    }

    if (loanAmount < 500000) {
      toast.error('Nominal pinjaman minimal Rp 500.000')
      return
    }

    if (loanAmount > settings.max_loan) {
      toast.error(`Nominal pinjaman maksimal ${formatRupiah(settings.max_loan)}`)
      return
    }

    if (isTakeover && !calculation.isTakeoverValid) {
      toast.error(
        `Nominal pinjaman baru harus lebih besar dari sisa kewajiban (${formatRupiah(
          remainingObligation
        )})`
      )
      return
    }

    setAgreeTerms(false)
    setShowConfirmModal(true)
  }

  // Process Application Submission
  const handleConfirmSubmit = async () => {
    if (!agreeTerms) {
      toast.error('Harap setujui syarat dan ketentuan pemotongan gaji.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/loan/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_amount: loanAmount,
          tenor,
          is_takeover: isTakeover,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Terjadi kesalahan saat memproses pengajuan')
      }

      toast.success('Pengajuan pinjaman berhasil diajukan!')
      setShowConfirmModal(false)
      router.push('/koperasi/riwayat')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pengajuan'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <ButtonSpinner size={36} className="text-blue-600 mb-4" />
        <p className="text-slate-600 font-medium">Memuat data pengajuan pinjaman...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pengajuan Pinjaman Koperasi
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Bunga Flat 2.5%
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Fasilitas pinjaman karyawan dengan cicilan ringan dan pemotongan gaji otomatis setiap
            tanggal 5.
          </p>
        </div>

        <Link
          href="/koperasi/riwayat"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" />
          <span>Lihat Riwayat Pinjaman</span>
        </Link>
      </div>

      {/* 1. Locked Notice: Outside Application Period */}
      {!settings.is_within_period && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-xs"
        >
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-900">
              Periode Pengajuan Pinjaman Sedang Ditutup
            </h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              Pengajuan pinjaman koperasi hanya dibuka pada{' '}
              <strong className="font-semibold text-amber-950">
                tanggal {settings.loan_period_start} hingga {settings.loan_period_end}
              </strong>{' '}
              setiap bulannya. Saat ini adalah{' '}
              <strong>tanggal {settings.current_day}</strong>. Anda dapat melihat simulasi atau
              kembali saat periode dibuka.
            </p>
            <div className="mt-3">
              <Link
                href="/koperasi/simulasi"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-4"
              >
                Buka Simulator Pinjaman Standalone
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Notice: Existing Pending Loan */}
      {pendingRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4 shadow-xs"
        >
          <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700 shrink-0 mt-0.5">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-blue-950">
                Pengajuan Pinjaman Sedang Diproses
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Menunggu Persetujuan
              </span>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              Anda telah mengajukan pinjaman dengan ID{' '}
              <strong className="text-blue-900 font-mono">{pendingRequest.id}</strong> sejumlah{' '}
              <strong>{formatRupiah(pendingRequest.loan_amount)}</strong> ({pendingRequest.tenor}{' '}
              Bulan). Anda tidak dapat mengajukan pinjaman baru sampai permohonan ini selesai diproses
              atau dibatalkan.
            </p>
            <div className="mt-3.5 flex items-center gap-3">
              <Link
                href="/koperasi/riwayat"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Lihat Detail Pengajuan
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. First-Time Borrower Info Box */}
      {isFirstTimeBorrower && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4"
        >
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0 mt-0.5">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-emerald-950">
                Informasi Penting: Peminjam Pertama Kali
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-200/70 text-emerald-800">
                Wajib Dokumen Fisik
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 mt-1.5 leading-relaxed">
              Sebagai pemohon pinjaman perdana di Koperasi E-KOPI, Anda{' '}
              <strong>diwajibkan membawa dan memperlihatkan dokumen asli/fotokopi Ijazah Satpam</strong>{' '}
              (atau <strong>Ijazah Terakhir</strong>) kepada pengurus Koperasi / HR Admin saat proses
              verifikasi sebelum pencairan dana dilakukan.
            </p>
          </div>
        </motion.div>
      )}

      {/* 4. Active Loan & Takeover Section */}
      {activeLoan && remainingObligation > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 transition-all ${
            isTakeover
              ? 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 border-indigo-200 shadow-sm'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Pinjaman Berjalan Terdeteksi</h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {activeLoan.id}</p>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-slate-500 font-medium">Sisa Kewajiban Belum Lunas</div>
              <div className="text-base font-bold text-indigo-700">
                {formatRupiah(remainingObligation)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isTakeover}
                onChange={(e) => setIsTakeover(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Ajukan sebagai Pinjaman Takeover (Pelunasan Otomatis Pinjaman Berjalan)
                </span>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Pinjaman aktif Anda sebesar{' '}
                  <strong className="text-slate-700">{formatRupiah(remainingObligation)}</strong>{' '}
                  akan dilunasi langsung melalui pemotongan dari pinjaman baru yang disetujui. Anda
                  hanya menerima sisa dana bersih (net disbursement).
                </p>
              </div>
            </label>

            {isTakeover && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Nominal Pinjaman Baru:</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(loanAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Pelunasan Pinjaman Lama:</span>
                  <span className="font-semibold text-rose-600">
                    - {formatRupiah(remainingObligation)}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200/60 flex justify-between text-sm font-bold">
                  <span className="text-indigo-950">Estimasi Dana Bersih Diterima:</span>
                  <span
                    className={
                      calculation.isTakeoverValid ? 'text-emerald-700' : 'text-rose-600'
                    }
                  >
                    {formatRupiah(calculation.netDisbursement)}
                  </span>
                </div>

                {!calculation.isTakeoverValid && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-100/70 border border-rose-200 rounded-lg p-2.5 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      Nominal pinjaman baru harus lebih besar dari sisa kewajiban (
                      <strong>{formatRupiah(remainingObligation)}</strong>). Minimal pengajuan untuk
                      takeover adalah{' '}
                      <strong>{formatRupiah(remainingObligation + 100000)}</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 5. Main Loan Application Form & Simulator */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Simulasi & Rencana Pinjaman
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan nominal dan tenor. Rincian cicilan dan jadwal angsuran akan terhitung secara
              otomatis.
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Input Nominal Pinjaman */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">
                  Nominal Pinjaman (Rupiah)
                </label>
                <span className="text-xs text-slate-500">
                  Maks. {formatRupiah(settings.max_loan)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  Rp
                </span>
                <input
                  type="text"
                  value={loanAmount > 0 ? loanAmount.toLocaleString('id-ID') : ''}
                  onChange={handleAmountInputChange}
                  placeholder="Contoh: 3.000.000"
                  disabled={!settings.is_within_period || !!pendingRequest}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_AMOUNTS.filter((amt) => amt <= settings.max_loan).map((amt) => {
                  const isSelected = loanAmount === amt
                  return (
                    <button
                      key={amt}
                      type="button"
                      disabled={!settings.is_within_period || !!pendingRequest}
                      onClick={() => setLoanAmount(amt)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input Tenor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">Tenor Pinjaman</label>
                <span className="text-xs text-slate-500">
                  Maksimal {settings.max_tenor} Bulan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Array.from({ length: settings.max_tenor || 4 }, (_, idx) => idx + 1).map((t) => {
                  const isSelected = tenor === t
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!settings.is_within_period || !!pendingRequest}
                      onClick={() => setTenor(t)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{t} Bulan</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t}x Potong Gaji
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Calculation Breakdown Cards */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Rincian Pembayaran Bulanan
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-500 block">Pokok / Bulan</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                    {formatRupiah(calculation.principalPerMonth)}
                  </span>
                  {calculation.lastPrincipal !== calculation.principalPerMonth && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Bulan ke-{tenor}: {formatRupiah(calculation.lastPrincipal)}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-500 block">Bunga / Bulan (2.5%)</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                    {formatRupiah(calculation.interestPerMonth)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Flat pokok awal</span>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5">
                  <span className="text-xs text-blue-700 font-medium block">Total Angsuran / Bln</span>
                  <span className="text-sm sm:text-base font-bold text-blue-900 mt-0.5 block">
                    {formatRupiah(calculation.installmentPerMonth)}
                  </span>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Potong tgl 5</span>
                </div>

                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5">
                  <span className="text-xs text-indigo-700 font-medium block">Total Kewajiban</span>
                  <span className="text-sm sm:text-base font-bold text-indigo-900 mt-0.5 block">
                    {formatRupiah(calculation.totalObligation)}
                  </span>
                  <span className="text-[10px] text-indigo-600 mt-0.5 block">
                    {tenor} bulan angsuran
                  </span>
                </div>
              </div>
            </div>

            {/* Installment Schedule Table */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Jadwal Rencana Angsuran
                </span>
                <span className="text-xs text-slate-500">
                  Jatuh tempo: Tanggal {settings.loan_deduction_day} setiap bulan
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Tanggal Jatuh Tempo</th>
                      <th className="py-2.5 px-3 text-right">Pokok</th>
                      <th className="py-2.5 px-3 text-right">Bunga (2.5%)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Total Angsuran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {calculation.schedule.map((item) => (
                      <tr key={item.number} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                          {item.number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {formatDate(item.dueDate, 'dd MMMM yyyy')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatRupiah(item.principal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatRupiah(item.interest)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Employee & Bank Info Section (Read-Only) */}
        {employee && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Data Pegawai & Rekening Penerima
                </h3>
                <p className="text-xs text-slate-400">
                  Data otomatis terisi sesuai database kepegawaian (Hanya baca).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">NIK</span>
                <span className="text-slate-800 font-semibold font-mono text-sm">
                  {formatNIK(employee.nik)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Nama Lengkap</span>
                <span className="text-slate-800 font-semibold text-sm">
                  {employee.full_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Perusahaan</span>
                <span className="text-slate-800 font-semibold">{employee.company_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Site / Lokasi</span>
                <span className="text-slate-800 font-semibold">{employee.site_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Departemen & Jabatan</span>
                <span className="text-slate-800 font-semibold">
                  {employee.department_name} - {employee.position_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Rekening Tujuan Pencairan</span>
                <span className="text-slate-900 font-bold block">
                  {employee.bank_name}: {employee.account_number}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  a.n. {employee.account_holder}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7. Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={
              !settings.is_within_period ||
              !!pendingRequest ||
              (isTakeover && !calculation.isTakeoverValid) ||
              loanAmount <= 0
            }
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Lanjutkan Pengajuan Pinjaman</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Konfirmasi Pengajuan Pinjaman
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Harap periksa kembali detail pinjaman Anda sebelum mengirim permohonan.
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Pinjaman:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenor:</span>
                  <span className="font-semibold text-slate-800">{tenor} Bulan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bunga Per Bulan (2.5%):</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(calculation.interestPerMonth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Angsuran Per Bulan:</span>
                  <span className="font-bold text-blue-600">
                    {formatRupiah(calculation.installmentPerMonth)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Total Kewajiban:</span>
                  <span className="text-slate-900">{formatRupiah(calculation.totalObligation)}</span>
                </div>

                {isTakeover && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between text-rose-600">
                      <span>Pelunasan Pinjaman Lama:</span>
                      <span>- {formatRupiah(remainingObligation)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Pencairan Bersih Diterima:</span>
                      <span>{formatRupiah(calculation.netDisbursement)}</span>
                    </div>
                  </div>
                )}

                {employee && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block">Rekening Pencairan:</span>
                    <span className="font-semibold text-slate-800">
                      {employee.bank_name} {employee.account_number} ({employee.account_holder})
                    </span>
                  </div>
                )}
              </div>

              {/* Terms Agreement Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>
                  Saya menyetujui bahwa angsuran akan dipotong langsung melalui gaji bulanan setiap
                  tanggal 5 sesuai jadwal angsuran yang ditentukan Koperasi E-KOPI.
                </span>
              </label>

              {/* Dialog Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting || !agreeTerms}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <ButtonSpinner size={14} className="text-white" />}
                  <span>{submitting ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
