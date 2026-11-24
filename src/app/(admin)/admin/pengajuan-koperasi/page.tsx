'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  Search,
  Check,
  X,
  Eye,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Receipt,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/lib/utils'

interface LoanInstallmentItem {
  id: string
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
  status: 'scheduled' | 'confirmed' | 'skipped'
  confirmed_at: string | null
}

interface LoanRequestItem {
  id: string
  employee_id: string
  loan_amount: number
  tenor: number
  interest_per_month: number
  principal_per_month: number
  installment_per_month: number
  total_obligation: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  is_takeover: boolean
  previous_loan_id: string | null
  previous_remaining: number | null
  net_disbursement: number | null
  first_time_borrower: boolean
  admin_notes: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  employee?: {
    id: string
    nik: string
    full_name: string
    email?: string | null
    company_name?: string | null
    site_name?: string | null
    bank_name?: string | null
    account_number?: string | null
    account_holder?: string | null
  } | null
  installments?: LoanInstallmentItem[]
}

export default function AdminPengajuanKoperasiPage() {
  const [loading, setLoading] = useState(true)
  const [loans, setLoans] = useState<LoanRequestItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Approve / Reject Dialogs
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [targetApproveId, setTargetApproveId] = useState<string | null>(null)
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        status: statusFilter,
        search: searchQuery,
      })

      const res = await fetch(`/api/admin/loan/requests?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setLoans(data.requests || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('[PengajuanKoperasiPage] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  // Open detail with full record from API
  const handleOpenDetail = async (item: LoanRequestItem) => {
    setSelectedLoan(item)
    setActionNotes(item.admin_notes || '')
    setDetailOpen(true)

    try {
      const res = await fetch(`/api/admin/loan/requests/${item.id}`)
      const data = await res.json()
      if (data.success && data.loan) {
        setSelectedLoan(data.loan)
      }
    } catch (err) {
      console.warn('Error fetching full loan detail:', err)
    }
  }

  // Handle Approve
  const handleApprove = async (id: string, notes?: string) => {
    setProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/loan/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: notes || '' }),
      })
      const data = await res.json()
      if (data.success) {
        setApproveConfirmOpen(false)
        setDetailOpen(false)
        setActionNotes('')
        fetchLoans()
      } else {
        alert(data.error || 'Gagal menyetujui pinjaman.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setProcessingAction(false)
    }
  }

  // Handle Reject
  const handleReject = async (id: string, notes?: string) => {
    setProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/loan/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: notes || '' }),
      })
      const data = await res.json()
      if (data.success) {
        setRejectConfirmOpen(false)
        setDetailOpen(false)
        setRejectReason('')
        setActionNotes('')
        fetchLoans()
      } else {
        alert(data.error || 'Gagal menolak pinjaman.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setProcessingAction(false)
    }
  }

  // Confirm installment
  const handleConfirmInstallment = async (installmentId: string) => {
    try {
      const res = await fetch(`/api/admin/loan/installments/${installmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh selected loan detail
        if (selectedLoan) {
          handleOpenDetail(selectedLoan)
        }
        fetchLoans()
      } else {
        alert(data.error || 'Gagal mengonfirmasi angsuran.')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat konfirmasi angsuran.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Persetujuan Pinjaman Koperasi"
        description="Verifikasi permohonan pinjaman pegawai, jadwal angsuran, dan persetujuan takeover"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
            <Wallet className="w-3.5 h-3.5" />
            <span>{total} Total Pengajuan</span>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari NIK, Nama Pegawai, atau ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="w-48">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Persetujuan</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="completed">Lunas</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold">ID</TableHead>
                <TableHead className="text-xs font-semibold">NIK & Nama</TableHead>
                <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                <TableHead className="text-xs font-semibold text-center">Tenor</TableHead>
                <TableHead className="text-xs font-semibold text-right">Angsuran / Bln</TableHead>
                <TableHead className="text-xs font-semibold">Tipe</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <EmptyState
                      title="Tidak ada permohonan pinjaman"
                      description="Belum ada permohonan pinjaman koperasi yang cocok dengan filter."
                      icon={Wallet}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((item) => {
                  const isPending = item.status === 'pending'
                  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {item.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {item.employee?.full_name || 'Pegawai'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {item.employee?.nik || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-slate-900">
                        {formatCurrency(item.loan_amount)}
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-700">
                        {item.tenor} Bulan
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-indigo-700">
                        {formatCurrency(item.installment_per_month)}
                      </TableCell>
                      <TableCell>
                        {item.is_takeover ? (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            Takeover
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            Baru
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{formattedDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDetail(item)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                            title="Lihat Detail & Angsuran"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setTargetApproveId(item.id)
                                  setApproveConfirmOpen(true)
                                }}
                                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span className="hidden sm:inline">Setuju</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTargetRejectId(item.id)
                                  setRejectConfirmOpen(true)
                                }}
                                className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs gap-1"
                              >
                                <X className="w-3 h-3" />
                                <span className="hidden sm:inline">Tolak</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold">
                Detail Pinjaman #{selectedLoan?.id.slice(0, 8)}
              </DialogTitle>
              {selectedLoan && <StatusBadge status={selectedLoan.status} />}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Rincian perhitungan bunga, angsuran per bulan, dan status pelunasan
            </DialogDescription>
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-4 py-2 text-xs">
              {/* Employee info box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Peminjam:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedLoan.employee?.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">NIK:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {selectedLoan.employee?.nik}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Rekening Pencairan:</span>
                  <span className="text-slate-700">
                    {selectedLoan.employee?.bank_name || 'Mandiri'} -{' '}
                    {selectedLoan.employee?.account_number || '-'} (
                    {selectedLoan.employee?.account_holder || '-'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Riwayat Peminjam:</span>
                  {selectedLoan.first_time_borrower ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      <Sparkles className="w-3 h-3" /> Peminjam Pertama Kali
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Pernah Meminjam Sebelumnya
                    </span>
                  )}
                </div>
              </div>

              {/* Takeover notice banner if applicable */}
              {selectedLoan.is_takeover && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Permohonan Takeover Pinjaman Berjalan</span>
                  </div>
                  <div className="text-[11px] grid grid-cols-2 gap-1 text-amber-700">
                    <div>
                      ID Pinjaman Lama: #{selectedLoan.previous_loan_id?.slice(0, 8)}
                    </div>
                    <div>
                      Sisa Kewajiban: {formatCurrency(selectedLoan.previous_remaining || 0)}
                    </div>
                    <div className="col-span-2 font-bold text-amber-900">
                      Pencairan Bersih ke Pegawai:{' '}
                      {formatCurrency(selectedLoan.net_disbursement || 0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Calculation Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Nominal Pinjaman</span>
                  <span className="font-bold text-xs text-slate-800">
                    {formatCurrency(selectedLoan.loan_amount)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Bunga / Bulan (2.5%)</span>
                  <span className="font-bold text-xs text-slate-800">
                    {formatCurrency(selectedLoan.interest_per_month)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Angsuran / Bulan</span>
                  <span className="font-bold text-xs text-indigo-700">
                    {formatCurrency(selectedLoan.installment_per_month)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Total Kewajiban</span>
                  <span className="font-bold text-xs text-slate-800">
                    {formatCurrency(selectedLoan.total_obligation)}
                  </span>
                </div>
              </div>

              {/* Installment Schedule (if approved) */}
              {selectedLoan.installments && selectedLoan.installments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Jadwal Angsuran Bulanan ({selectedLoan.installments.length} Bulan)</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Potongan tanggal 5 setiap bulan
                    </span>
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                          <TableHead className="w-12 text-center">Ke-</TableHead>
                          <TableHead>Jatuh Tempo</TableHead>
                          <TableHead className="text-right">Pokok</TableHead>
                          <TableHead className="text-right">Bunga</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLoan.installments.map((inst) => {
                          const isConfirmed = inst.status === 'confirmed'
                          return (
                            <TableRow key={inst.id} className="text-xs">
                              <TableCell className="text-center font-bold">
                                {inst.installment_number}
                              </TableCell>
                              <TableCell className="font-mono">{inst.due_date}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(inst.principal_amount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-slate-500">
                                {formatCurrency(inst.interest_amount)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-slate-800">
                                {formatCurrency(inst.total_amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={inst.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                {!isConfirmed && inst.status === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmInstallment(inst.id)}
                                    className="h-6 px-2 text-[10px] bg-teal-600 hover:bg-teal-500 text-white"
                                  >
                                    Konfirmasi
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Administrator:
                </label>
                {selectedLoan.status === 'pending' ? (
                  <Textarea
                    placeholder="Tuliskan catatan persetujuan atau alasan penolakan..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 italic">
                    {selectedLoan.admin_notes || 'Tidak ada catatan.'}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedLoan?.status === 'pending' ? (
              <div className="flex w-full items-center justify-between gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="text-xs">
                  Tutup
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedLoan.id, actionNotes)}
                    disabled={processingAction}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Tolak Pinjaman
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedLoan.id, actionNotes)}
                    disabled={processingAction}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Setujui Pinjaman
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setDetailOpen(false)} className="text-xs">
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="Setujui Pinjaman Koperasi?"
        description="Sistem akan membentuk jadwal angsuran bulanan otomatis dengan penarikan setiap tanggal 5."
        confirmText="Ya, Setujui Pinjaman"
        onConfirm={() => {
          if (targetApproveId) handleApprove(targetApproveId)
        }}
      />

      {/* Confirm Reject Dialog */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">
              Tolak Pinjaman Koperasi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tuliskan alasan penolakan pinjaman bagi pemohon.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Contoh: Beban angsuran melebihi batas maksimal gaji bulanan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectConfirmOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => targetRejectId && handleReject(targetRejectId, rejectReason)}
              disabled={processingAction}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
