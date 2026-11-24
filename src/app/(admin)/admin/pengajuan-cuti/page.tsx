'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CalendarDays,
  Search,
  Check,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building2,
  Phone,
  FileText,
  Clock,
  CheckCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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

interface LeaveRequestItem {
  id: string
  employee_id: string
  selected_dates: string[] | string
  total_days: number
  reason: string
  emergency_contact: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  admin_notes: string | null
  processed_by: string | null
  processed_at: string | null
  year: number
  created_at: string
  employee?: {
    id: string
    nik: string
    full_name: string
    email?: string | null
    phone?: string | null
    company_name?: string | null
    site_name?: string | null
    department_name?: string | null
    position_name?: string | null
  } | null
}

export default function AdminPengajuanCutiPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<LeaveRequestItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal detail
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Single Approve Dialog
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [targetApproveId, setTargetApproveId] = useState<string | null>(null)

  // Single Reject Dialog
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Bulk Dialog
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkNotes, setBulkNotes] = useState('')

  // Fetch leave requests
  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        status: statusFilter,
        search: searchQuery,
      })

      const res = await fetch(`/api/admin/leave/requests?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setRequests(data.requests || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('[PengajuanCutiPage] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  // Select all on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentIds = requests.map((r) => r.id)
      setSelectedIds(currentIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const isAllSelected = requests.length > 0 && selectedIds.length === requests.length

  // Parse dates helper
  const parseDates = (dates: string[] | string): string[] => {
    if (Array.isArray(dates)) return dates
    try {
      const parsed = JSON.parse(dates)
      return Array.isArray(parsed) ? parsed : [dates]
    } catch {
      return [dates]
    }
  }

  // Handle single approve
  const handleApprove = async (id: string, notes?: string) => {
    setProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/leave/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: notes || '' }),
      })
      const data = await res.json()
      if (data.success) {
        setApproveConfirmOpen(false)
        setDetailOpen(false)
        setActionNotes('')
        fetchLeaveRequests()
      } else {
        alert(data.error || 'Gagal menyetujui cuti.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setProcessingAction(false)
    }
  }

  // Handle single reject
  const handleReject = async (id: string, notes?: string) => {
    setProcessingAction(true)
    try {
      const res = await fetch(`/api/admin/leave/requests/${id}`, {
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
        fetchLeaveRequests()
      } else {
        alert(data.error || 'Gagal menolak cuti.')
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setProcessingAction(false)
    }
  }

  // Bulk actions
  const handleBulkApprove = async () => {
    setProcessingAction(true)
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/leave/requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', notes: bulkNotes || 'Persetujuan massal oleh admin' }),
        })
      }
      setSelectedIds([])
      setBulkApproveOpen(false)
      setBulkNotes('')
      fetchLeaveRequests()
    } catch (err) {
      alert('Terjadi kesalahan saat pemrosesan massal.')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleBulkReject = async () => {
    setProcessingAction(true)
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/leave/requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', notes: bulkNotes || 'Penolakan massal oleh admin' }),
        })
      }
      setSelectedIds([])
      setBulkRejectOpen(false)
      setBulkNotes('')
      fetchLeaveRequests()
    } catch (err) {
      alert('Terjadi kesalahan saat pemrosesan massal.')
    } finally {
      setProcessingAction(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Persetujuan Pengajuan Cuti"
        description="Verifikasi dan tinjau seluruh permohonan cuti tahunan pegawai"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <CalendarDays className="w-3.5 h-3.5" />
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
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Buttons (shown when items are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {selectedIds.length} dipilih
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkApproveOpen(true)}
              className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Setujui Semua</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRejectOpen(true)}
              className="h-8 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Tolak Semua</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold">ID</TableHead>
                <TableHead className="text-xs font-semibold">NIK & Nama</TableHead>
                <TableHead className="text-xs font-semibold">Perusahaan & Site</TableHead>
                <TableHead className="text-xs font-semibold">Tanggal Cuti</TableHead>
                <TableHead className="text-xs font-semibold text-center">Durasi</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Diajukan</TableHead>
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
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <EmptyState
                      title="Tidak ada permohonan cuti"
                      description="Belum ada permohonan cuti yang sesuai dengan kriteria filter saat ini."
                      icon={CalendarDays}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((item) => {
                  const dates = parseDates(item.selected_dates)
                  const isPending = item.status === 'pending'
                  const isChecked = selectedIds.includes(item.id)
                  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

                  return (
                    <TableRow key={item.id} className={isChecked ? 'bg-blue-50/40' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => handleSelectRow(item.id, Boolean(checked))}
                          aria-label={`Pilih baris ${item.id}`}
                        />
                      </TableCell>
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
                      <TableCell>
                        <div className="text-xs text-slate-700">
                          {item.employee?.company_name || 'PT E-KOPI'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.employee?.site_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {dates.slice(0, 2).map((d) => (
                            <span
                              key={d}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                            >
                              {d}
                            </span>
                          ))}
                          {dates.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{dates.length - 2} lagi
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-slate-800">
                        {item.total_days} Hari
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
                            onClick={() => {
                              setSelectedRequest(item)
                              setActionNotes(item.admin_notes || '')
                              setDetailOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                            title="Lihat Detail"
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

        {/* Pagination footer */}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold">
                Detail Permohonan Cuti #{selectedRequest?.id.slice(0, 8)}
              </DialogTitle>
              {selectedRequest && <StatusBadge status={selectedRequest.status} />}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Informasi lengkap data pegawai dan detail cuti yang diajukan
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2 text-xs">
              {/* Employee info box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{selectedRequest.employee?.full_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIK:</span>
                    <span className="font-mono font-medium">{selectedRequest.employee?.nik}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Perusahaan / Site:</span>
                    <span>
                      {selectedRequest.employee?.company_name || 'PT E-KOPI'} -{' '}
                      {selectedRequest.employee?.site_name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kontak Darurat:</span>
                    <span className="font-medium text-slate-800">
                      {selectedRequest.emergency_contact}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Durasi:</span>
                    <span className="font-bold text-blue-600">
                      {selectedRequest.total_days} Hari Kerja
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Dates */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Tanggal yang Diajukan:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {parseDates(selectedRequest.selected_dates).map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Permohonan:
                </label>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedRequest.reason}
                </p>
              </div>

              {/* Admin notes if already processed or processing */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Administrator:
                </label>
                {selectedRequest.status === 'pending' ? (
                  <Textarea
                    placeholder="Tulis catatan persetujuan atau alasan penolakan..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                ) : (
                  <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 italic">
                    {selectedRequest.admin_notes || 'Tidak ada catatan.'}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedRequest?.status === 'pending' ? (
              <div className="flex w-full items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  className="text-xs"
                >
                  Tutup
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRequest.id, actionNotes)}
                    disabled={processingAction}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Tolak Pengajuan
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id, actionNotes)}
                    disabled={processingAction}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Setujui Pengajuan
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDetailOpen(false)}
                className="text-xs"
              >
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
        title="Setujui Permohonan Cuti?"
        description="Hak kuota cuti pegawai akan dipotong secara otomatis sesuai jumlah hari yang disetujui."
        confirmText="Ya, Setujui"
        onConfirm={() => {
          if (targetApproveId) handleApprove(targetApproveId)
        }}
      />

      {/* Confirm Reject Dialog */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">
              Tolak Permohonan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan alasan penolakan agar pegawai dapat mengetahui pertimbangan admin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Contoh: Operasional regu sedang padat, silakan ajukan di tanggal lain..."
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

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-700">
              Setujui {selectedIds.length} Permohonan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Anda akan menyetujui seluruh permohonan cuti yang telah dicentang sekaligus.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Catatan persetujuan massal (opsional)..."
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkApproveOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={processingAction}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Ya, Setujui Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600">
              Tolak {selectedIds.length} Permohonan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Anda akan menolak seluruh permohonan yang dicentang. Tuliskan alasannya.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Alasan penolakan massal..."
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkRejectOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleBulkReject}
              disabled={processingAction}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              Ya, Tolak Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
