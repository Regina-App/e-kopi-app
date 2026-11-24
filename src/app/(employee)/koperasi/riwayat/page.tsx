'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  CreditCard,
  Ban,
  ArrowRight,
  Building,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah, formatDate, getStatusColor } from '@/lib/utils'
import { SkeletonCard, ButtonSpinner } from '@/components/ui/loading'
import EmptyState from '@/components/ui/empty-state'
import type { LoanRequest, LoanInstallment } from '@/lib/types/database'

interface LoanWithInstallments extends LoanRequest {
  installments?: LoanInstallment[]
  summary?: {
    confirmed_count: number
    total_installments: number
    remaining_obligation: number
    next_installment?: LoanInstallment | null
  }
}

const STATUS_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'completed', label: 'Lunas' },
  { id: 'rejected', label: 'Ditolak' },
  { id: 'cancelled', label: 'Dibatalkan' },
]

export default function RiwayatPinjamanPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat riwayat pinjaman...</p>
          </div>
        </div>
      }
    >
      <RiwayatPinjamanContent />
    </React.Suspense>
  )
}

function RiwayatPinjamanContent() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeLoan, setActiveLoan] = useState<LoanWithInstallments | null>(null)
  const [historyList, setHistoryList] = useState<LoanWithInstallments[]>([])

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Detail Modal & Cancel Modal State
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInstallments | null>(null)
  const [loanToCancel, setLoanToCancel] = useState<LoanWithInstallments | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Fetch Active Loan and History
  const fetchData = async () => {
    try {
      setRefreshing(true)
      // Fetch Active Loan
      const activeRes = await fetch('/api/loan/active')
      const activeJson = await activeRes.json()
      if (activeJson.success && activeJson.data) {
        setActiveLoan(activeJson.data)
      } else {
        setActiveLoan(null)
      }

      // Fetch All History
      const histRes = await fetch('/api/loan/request')
      const histJson = await histRes.json()
      if (histJson.success && Array.isArray(histJson.data)) {
        setHistoryList(histJson.data)
      }
    } catch (err) {
      console.error('Error fetching loan data:', err)
      toast.error('Gagal memperbarui data riwayat pinjaman')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return historyList.filter((loan) => {
      // Status filter
      if (activeTab !== 'all' && loan.status !== activeTab) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = loan.id.toLowerCase().includes(q)
        const matchAmount = String(loan.loan_amount).includes(q)
        return matchId || matchAmount
      }
      return true
    })
  }, [historyList, activeTab, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLoans.slice(start, start + itemsPerPage)
  }, [filteredLoans, currentPage])

  // Handle Cancel Loan
  const handleConfirmCancel = async () => {
    if (!loanToCancel) return

    try {
      setCancelling(true)
      const res = await fetch(`/api/loan/request/${loanToCancel.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membatalkan pengajuan pinjaman')
      }

      toast.success(`Pengajuan ${loanToCancel.id} berhasil dibatalkan`)
      setLoanToCancel(null)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan pengajuan'
      toast.error(msg)
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colorClasses = getStatusColor(status)
    const labels: Record<string, string> = {
      pending: 'Menunggu Persetujuan',
      approved: 'Disetujui',
      completed: 'Lunas',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan',
      scheduled: 'Menunggu Potongan',
      confirmed: 'Lunas',
      skipped: 'Dilewati',
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{labels[status] || status}</span>
      </span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Pinjaman Koperasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status pinjaman aktif, jadwal potongan gaji, dan arsip seluruh pengajuan Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/koperasi/ajukan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Pinjaman</span>
          </Link>
        </div>
      </div>

      {/* 1. Active Loan Card at Top */}
      {loading ? (
        <SkeletonCard lines={4} />
      ) : activeLoan ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl overflow-hidden relative"
        >
          {/* Subtle background decoration */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="p-5 sm:p-6 space-y-5 relative z-10">
            {/* Header / ID & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider block">
                    Pinjaman Aktif Berjalan
                  </span>
                  <span className="text-sm font-mono font-bold text-white tracking-wide">
                    {activeLoan.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Disetujui & Aktif
                </span>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-blue-200 block">Nominal Pinjaman</span>
                <span className="text-base sm:text-lg font-bold text-white mt-0.5 block">
                  {formatRupiah(activeLoan.loan_amount)}
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-200 block">Tenor</span>
                <span className="text-base sm:text-lg font-bold text-white mt-0.5 block">
                  {activeLoan.tenor} Bulan
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-200 block">Angsuran / Bulan</span>
                <span className="text-base sm:text-lg font-bold text-white mt-0.5 block">
                  {formatRupiah(activeLoan.installment_per_month)}
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-200 block">Sisa Kewajiban</span>
                <span className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5 block">
                  {formatRupiah(activeLoan.summary?.remaining_obligation || activeLoan.total_obligation)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {activeLoan.summary && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-blue-200 font-medium">
                  <span>
                    Progres Pelunasan: {activeLoan.summary.confirmed_count} dari{' '}
                    {activeLoan.summary.total_installments} Angsuran Lunas
                  </span>
                  <span className="font-bold text-white">
                    {Math.round(
                      (activeLoan.summary.confirmed_count /
                        (activeLoan.summary.total_installments || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.round(
                        (activeLoan.summary.confirmed_count /
                          (activeLoan.summary.total_installments || 1)) *
                          100
                      )}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Next Deduction Date Notice */}
            {activeLoan.summary?.next_installment && (
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-200">
                  <Calendar className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>
                    Potongan Gaji Berikutnya (Angsuran Ke-
                    {activeLoan.summary.next_installment.installment_number}):
                  </span>
                </div>
                <span className="font-bold text-white">
                  {formatDate(activeLoan.summary.next_installment.due_date, 'dd MMMM yyyy')}
                </span>
              </div>
            )}

            {/* Installments Table */}
            {activeLoan.installments && activeLoan.installments.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  Jadwal & Status Angsuran
                </div>
                <div className="overflow-x-auto rounded-xl bg-white/5 border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/10 text-blue-200 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3">Tanggal Jatuh Tempo</th>
                        <th className="py-2.5 px-3 text-right">Pokok</th>
                        <th className="py-2.5 px-3 text-right">Bunga (2.5%)</th>
                        <th className="py-2.5 px-3 text-right font-bold">Total</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {activeLoan.installments.map((inst) => {
                        const isConfirmed = inst.status === 'confirmed'
                        return (
                          <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 text-center text-blue-300 font-bold">
                              {inst.installment_number}
                            </td>
                            <td className="py-2.5 px-3 text-slate-200">
                              {formatDate(inst.due_date, 'dd MMMM yyyy')}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              {formatRupiah(inst.principal_amount)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              {formatRupiah(inst.interest_amount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-white">
                              {formatRupiah(inst.total_amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isConfirmed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3" />
                                  Lunas
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Menunggu Potongan
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* 2. History List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Arsip Pengajuan Pinjaman</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh permohonan pinjaman yang pernah Anda ajukan.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID pengajuan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count =
              tab.id === 'all'
                ? historyList.length
                : historyList.filter((l) => l.status === tab.id).length

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        ) : paginatedLoans.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak Ada Riwayat Pinjaman"
            description={
              searchQuery
                ? 'Tidak ditemukan pengajuan dengan kata kunci tersebut.'
                : 'Belum ada pengajuan pinjaman dengan status yang dipilih.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedLoans.map((loan) => {
              const isPending = loan.status === 'pending'
              return (
                <div
                  key={loan.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {loan.id}
                      </span>
                      {getStatusBadge(loan.status)}
                      {loan.is_takeover && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          Takeover
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div>
                        Nominal:{' '}
                        <strong className="text-slate-800 font-semibold">
                          {formatRupiah(loan.loan_amount)}
                        </strong>
                      </div>
                      <div>
                        Tenor:{' '}
                        <strong className="text-slate-800 font-semibold">
                          {loan.tenor} Bulan
                        </strong>
                      </div>
                      <div>
                        Angsuran:{' '}
                        <strong className="text-slate-800 font-semibold">
                          {formatRupiah(loan.installment_per_month)}/bln
                        </strong>
                      </div>
                      <div>
                        Diajukan:{' '}
                        <strong className="text-slate-800 font-semibold">
                          {formatDate(loan.created_at, 'dd MMM yyyy')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => setLoanToCancel(loan)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Batalkan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedLoan(loan)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Halaman {currentPage} dari {totalPages} ({filteredLoans.length} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Loan Detail Modal */}
      <AnimatePresence>
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Detail Pinjaman</h3>
                    {getStatusBadge(selectedLoan.status)}
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-1">ID: {selectedLoan.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Pinjaman:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(selectedLoan.loan_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenor Pinjaman:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLoan.tenor} Bulan
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pokok Per Bulan:</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(selectedLoan.principal_per_month)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bunga Per Bulan (2.5%):</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(selectedLoan.interest_per_month)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Angsuran Per Bulan:</span>
                  <span className="font-bold text-blue-600">
                    {formatRupiah(selectedLoan.installment_per_month)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Total Kewajiban:</span>
                  <span className="text-slate-900">
                    {formatRupiah(selectedLoan.total_obligation)}
                  </span>
                </div>

                {selectedLoan.is_takeover && (
                  <div className="pt-2 border-t border-slate-200 space-y-1 bg-indigo-50/50 p-2.5 rounded-lg">
                    <div className="text-[11px] font-bold text-indigo-900 uppercase">
                      Informasi Takeover
                    </div>
                    {selectedLoan.previous_loan_id && (
                      <div className="flex justify-between text-slate-600">
                        <span>Pinjaman Sebelumnya:</span>
                        <span className="font-mono">{selectedLoan.previous_loan_id}</span>
                      </div>
                    )}
                    {typeof selectedLoan.previous_remaining === 'number' && (
                      <div className="flex justify-between text-rose-600">
                        <span>Pelunasan Pinjaman Lama:</span>
                        <span>- {formatRupiah(selectedLoan.previous_remaining)}</span>
                      </div>
                    )}
                    {typeof selectedLoan.net_disbursement === 'number' && (
                      <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-indigo-200">
                        <span>Dana Bersih Diterima:</span>
                        <span>{formatRupiah(selectedLoan.net_disbursement)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {selectedLoan.admin_notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">Catatan Admin:</span>
                  <p className="text-amber-800">{selectedLoan.admin_notes}</p>
                </div>
              )}

              {/* Installments Schedule */}
              {selectedLoan.installments && selectedLoan.installments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Jadwal Angsuran Pinjaman
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-10">No</th>
                          <th className="py-2 px-2.5">Jatuh Tempo</th>
                          <th className="py-2 px-2.5 text-right">Total</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLoan.installments.map((inst) => (
                          <tr key={inst.id}>
                            <td className="py-2 px-2.5 text-center text-slate-400 font-bold">
                              {inst.installment_number}
                            </td>
                            <td className="py-2 px-2.5 text-slate-700">
                              {formatDate(inst.due_date, 'dd MMM yyyy')}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(inst.total_amount)}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              {inst.status === 'confirmed' ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Lunas
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Menunggu
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Cancel Confirmation Dialog */}
      <AnimatePresence>
        {loanToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Ban className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  Batalkan Pengajuan Pinjaman?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan pengajuan pinjaman ID{' '}
                  <strong className="font-mono text-slate-800">{loanToCancel.id}</strong> sejumlah{' '}
                  <strong>{formatRupiah(loanToCancel.loan_amount)}</strong>? Tindakan ini tidak dapat
                  dibatalkan.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLoanToCancel(null)}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {cancelling && <ButtonSpinner size={14} className="text-white" />}
                  <span>{cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
