'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator,
  Wallet,
  Calendar,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  RotateCcw,
  BadgePercent,
  Coins,
  ChevronRight,
  TrendingDown,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah, formatDate } from '@/lib/utils'

interface ScheduleItem {
  installmentNumber: number
  dueDate: Date
  principal: number
  interest: number
  total: number
  isAdjusted?: boolean
}

const PRESET_AMOUNTS = [
  1000000,
  2000000,
  3000000,
  5000000,
  7500000,
  10000000,
]

export default function SimulasiPinjamanPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat kalkulator simulasi...</p>
          </div>
        </div>
      }
    >
      <SimulasiPinjamanContent />
    </React.Suspense>
  )
}

function SimulasiPinjamanContent() {
  const [loanAmount, setLoanAmount] = useState<number>(3000000)
  const [displayAmount, setDisplayAmount] = useState<string>('3.000.000')
  const [tenor, setTenor] = useState<number>(3)
  const [copied, setCopied] = useState<boolean>(false)
  const [baseDate, setBaseDate] = useState<Date | null>(null)

  useEffect(() => {
    setBaseDate(new Date())
  }, [])

  const interestRate = 0.025 // Flat 2.5% per month

  // Integer-based simulation calculation matching loan.service.ts
  const calculation = useMemo(() => {
    if (loanAmount <= 0 || tenor <= 0) {
      return null
    }

    const principalPerMonth = Math.floor(loanAmount / tenor)
    const interestPerMonth = Math.floor(loanAmount * interestRate)
    const regularInstallment = principalPerMonth + interestPerMonth

    // Last principal absorbs integer remainder
    const lastPrincipal = loanAmount - principalPerMonth * (tenor - 1)
    const lastInstallment = lastPrincipal + interestPerMonth

    const totalInterest = interestPerMonth * tenor
    const totalObligation =
      principalPerMonth * (tenor - 1) + lastPrincipal + totalInterest

    // Schedule: 5th of each month starting next month
    const schedule: ScheduleItem[] = []
    const now = baseDate || new Date(2026, 0, 1)

    for (let i = 1; i <= tenor; i++) {
      let targetYear = now.getFullYear()
      let targetMonth = now.getMonth() + i
      if (targetMonth > 11) {
        targetYear += Math.floor(targetMonth / 12)
        targetMonth = targetMonth % 12
      }
      const dueDate = new Date(targetYear, targetMonth, 5)
      const isLast = i === tenor
      const principal = isLast ? lastPrincipal : principalPerMonth
      const total = isLast ? lastInstallment : regularInstallment

      schedule.push({
        installmentNumber: i,
        dueDate,
        principal,
        interest: interestPerMonth,
        total,
        isAdjusted: isLast && lastPrincipal !== principalPerMonth,
      })
    }

    return {
      loanAmount,
      tenor,
      interestRate,
      principalPerMonth,
      interestPerMonth,
      regularInstallment,
      lastPrincipal,
      lastInstallment,
      totalInterest,
      totalObligation,
      schedule,
    }
  }, [loanAmount, tenor])

  // Handle amount input typing
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setLoanAmount(0)
      setDisplayAmount('')
      return
    }
    const numeric = parseInt(rawValue, 10)
    setLoanAmount(numeric)
    setDisplayAmount(new Intl.NumberFormat('id-ID').format(numeric))
  }

  // Select quick preset
  const handleSelectPreset = (amount: number) => {
    setLoanAmount(amount)
    setDisplayAmount(new Intl.NumberFormat('id-ID').format(amount))
  }

  // Copy or share simulation result
  const handleShareOrCopy = async () => {
    if (!calculation) return

    const summaryText = `📋 *SIMULASI PINJAMAN KOPERASI E-KOPI*
----------------------------------------
💰 *Nominal Pinjaman:* ${formatRupiah(calculation.loanAmount)}
⏱️ *Tenor:* ${calculation.tenor} Bulan (Bunga Flat 2.5%/bulan)
----------------------------------------
• *Pokok / Bulan:* ${formatRupiah(calculation.principalPerMonth)}
• *Bunga / Bulan:* ${formatRupiah(calculation.interestPerMonth)}
• *Angsuran / Bulan:* ${formatRupiah(calculation.regularInstallment)}
• *Total Bunga (${calculation.tenor} bln):* ${formatRupiah(calculation.totalInterest)}
• *Total Kewajiban:* ${formatRupiah(calculation.totalObligation)}
----------------------------------------
📅 *Jadwal Pemotongan Payroll:*
${calculation.schedule
  .map(
    (s) =>
      `  Ke-${s.installmentNumber}: ${formatDate(s.dueDate, 'dd MMMM yyyy')} -> ${formatRupiah(s.total)}`
  )
  .join('\n')}
----------------------------------------
_Simulasi dihitung otomatis oleh E-KOPI Mobile Koperasi_`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Simulasi Pinjaman Koperasi E-KOPI',
          text: summaryText,
        })
        toast.success('Hasil simulasi berhasil dibagikan')
        return
      } catch {
        // User cancelled share or unsupported, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      toast.success('Rincian simulasi berhasil disalin ke clipboard')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Gagal menyalin rincian')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link
              href="/koperasi/ajukan"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Wallet className="w-3.5 h-3.5" />
              Koperasi
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">Simulasi Pinjaman</span>
          </div>

          <Link
            href="/koperasi/ajukan"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Ajukan Pinjaman
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Kalkulator Pinjaman Karyawan
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Simulasi Pinjaman Koperasi
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Hitung estimasi angsuran bulanan, bunga flat 2.5%, dan jadwal pemotongan
                payroll otomatis tanggal 5 secara transparan dan akurat.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 gap-3">
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block font-medium">Bunga Tetap</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-400">2.5%</span>
                <span className="text-[11px] text-slate-400 block">/ bulan (Flat)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Tenor Fleksibel</span>
                <span className="text-sm font-semibold text-white">1 s.d. 4 Bulan</span>
              </div>
            </div>
          </div>

          {/* Decorative background glows */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Main Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Parameter Pinjaman</h2>
                    <p className="text-xs text-slate-500">Tentukan nominal dan tenor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoanAmount(3000000)
                    setDisplayAmount('3.000.000')
                    setTenor(3)
                    toast.info('Nilai simulasi direset')
                  }}
                  title="Reset simulasi"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="loan-amount-input"
                    className="text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Nominal Pinjaman
                  </label>
                  <span className="text-xs font-semibold text-primary">
                    Min: Rp 500.000
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    Rp
                  </div>
                  <input
                    id="loan-amount-input"
                    type="text"
                    inputMode="numeric"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="Contoh: 3.000.000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 font-bold text-lg sm:text-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Pilihan Cepat:</span>
                    <span>Klik untuk memilih</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((preset) => {
                      const isSelected = loanAmount === preset
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`py-2 px-1 text-xs rounded-xl font-semibold border transition-all text-center ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 text-amber-700 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                          }`}
                        >
                          {preset >= 1000000
                            ? `${preset / 1000000} Juta`
                            : formatRupiah(preset)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tenor Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tenor Angsuran
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Maksimal 4 bulan</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((t) => {
                    const isSelected = tenor === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTenor(t)}
                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-bold leading-none">{t}</span>
                        <span
                          className={`text-[10px] font-medium mt-1 leading-none ${
                            isSelected ? 'text-primary-foreground/90' : 'text-slate-500'
                          }`}
                        >
                          Bulan
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleShareOrCopy}
                  disabled={!calculation}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Rincian Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-slate-500" />
                      <span>Salin / Bagikan Rincian</span>
                    </>
                  )}
                </button>

                <Link
                  href="/koperasi/ajukan"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all group"
                >
                  <span>Ajukan Pinjaman Ini</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick Rules Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                <Info className="w-4 h-4 text-amber-600" />
                Ketentuan Utama Pinjaman
              </div>
              <ul className="text-xs text-amber-900/90 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>
                    <strong>Bunga Flat 2.5%:</strong> Dihitung tetap setiap bulan dari nominal pinjaman awal.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>
                    <strong>Potong Gaji Tanggal 5:</strong> Pemotongan langsung dari payroll bulanan karyawan.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>
                    <strong>Periode Pengajuan:</strong> Dibuka setiap tanggal 8 hingga tanggal 28 setiap bulan.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>
                    <strong>Peminjam Pertama:</strong> Wajib membawa fisik Ijazah Satpam atau Ijazah Terakhir ke pengurus koperasi untuk verifikasi.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {calculation ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Hero Angsuran Card */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        Estimasi Angsuran Bulanan
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-sm">
                        {calculation.tenor}x Pemotongan
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {formatRupiah(calculation.regularInstallment)}
                        <span className="text-sm sm:text-base font-normal text-emerald-100 ml-1">
                          / bulan
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/90 mt-1">
                        Termasuk pokok {formatRupiah(calculation.principalPerMonth)} + bunga {formatRupiah(calculation.interestPerMonth)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] text-emerald-200/90 block font-medium">
                          Total Pinjaman Pokok
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white">
                          {formatRupiah(calculation.loanAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-200/90 block font-medium">
                          Total Kewajiban (Pokok+Bunga)
                        </span>
                        <span className="text-sm sm:text-base font-bold text-amber-300">
                          {formatRupiah(calculation.totalObligation)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative background glow */}
                  <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* Breakdown Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Pokok / Bulan
                    </span>
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      {formatRupiah(calculation.principalPerMonth)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Floor pembagian
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Bunga / Bulan
                    </span>
                    <span className="text-sm font-bold text-amber-600 block truncate">
                      {formatRupiah(calculation.interestPerMonth)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Flat 2.5% per bln
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Total Bunga
                    </span>
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      {formatRupiah(calculation.totalInterest)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Selama {calculation.tenor} bulan
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Jatuh Tempo Pertama
                    </span>
                    <span className="text-sm font-bold text-primary block truncate">
                      {calculation.schedule[0]
                        ? formatDate(calculation.schedule[0].dueDate, 'dd MMM yyyy')
                        : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Tgl 5 bln depan
                    </span>
                  </div>
                </div>

                {/* Installment Schedule Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          Jadwal Angsuran & Pemotongan
                        </h3>
                        <p className="text-xs text-slate-500">
                          Dipotong otomatis dari slip gaji pada tanggal 5 setiap bulan
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleShareOrCopy}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Salin Tabel</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 text-center w-12">Ke</th>
                          <th className="py-3 px-4">Jatuh Tempo</th>
                          <th className="py-3 px-4 text-right">Pokok</th>
                          <th className="py-3 px-4 text-right">Bunga (2.5%)</th>
                          <th className="py-3 px-4 text-right font-bold text-slate-700">
                            Total Angsuran
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {calculation.schedule.map((item) => (
                          <tr
                            key={item.installmentNumber}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                {item.installmentNumber}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(item.dueDate, 'dd MMMM yyyy')}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-700 font-medium whitespace-nowrap">
                              {formatRupiah(item.principal)}
                              {item.isAdjusted && (
                                <span className="block text-[10px] text-amber-600 font-normal">
                                  (penyesuaian sisa pokok)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right text-amber-700 font-medium whitespace-nowrap">
                              {formatRupiah(item.interest)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatRupiah(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200 text-xs sm:text-sm text-slate-900">
                          <td colSpan={2} className="py-3.5 px-4 text-slate-700">
                            Total Keseluruhan
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-800">
                            {formatRupiah(calculation.loanAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-amber-700">
                            {formatRupiah(calculation.totalInterest)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-primary font-black">
                            {formatRupiah(calculation.totalObligation)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center text-xs text-slate-500">
                    💡 Perhitungan di atas menggunakan bilangan bulat (integer math) tanpa
                    pembulatan desimal tersembunyi.
                  </div>
                </div>

                {/* CTA Callout */}
                <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-emerald-500/10 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-slate-900">
                      Ingin Mengajukan Pinjaman Ini Sekarang?
                    </h4>
                    <p className="text-xs text-slate-600">
                      Ajukan langsung melalui form digital koperasi. Dana ditransfer ke rekening gaji Anda.
                    </p>
                  </div>
                  <Link
                    href="/koperasi/ajukan"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all whitespace-nowrap"
                  >
                    Buka Formulir
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">Masukkan Nominal Pinjaman</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tentukan nominal pinjaman di sisi kiri untuk melihat kalkulasi angsuran dan jadwal pemotongan payroll.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
