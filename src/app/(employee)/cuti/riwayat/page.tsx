'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import {
  CalendarDays,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Eye,
  FileDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  PhoneCall,
  FileText,
  AlertTriangle,
  Loader2,
  Inbox,
  Filter,
  Mail,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
} from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { LeaveStatus } from '@/lib/types/database'

interface LeaveRequestItem {
  id: string
  employee_id: string
  selected_dates: string[]
  total_days: number
  reason: string
  emergency_contact: string
  status: LeaveStatus
  processed_by: string | null
  processed_at: string | null
  admin_notes: string | null
  approval_source: string | null
  verification_code: string | null
  year: number
  created_at: string
  employee?: {
    id: string
    nik: string
    full_name: string
    company_name?: string | null
    site_name?: string | null
    department_name?: string | null
    position_name?: string | null
  } | null
  processed_by_admin?: {
    id: string
    name: string
    email: string
  } | null
}

interface LeaveBalance {
  total: number
  used: number
  reserved: number
  available: number
}

const statusConfig: Record<
  LeaveStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'
    icon: typeof Clock
    bgClass: string
    textClass: string
    borderClass: string
  }
> = {
  pending: {
    label: 'Menunggu Persetujuan',
    variant: 'warning',
    icon: Clock,
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  approved: {
    label: 'Disetujui',
    variant: 'success',
    icon: CheckCircle2,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    label: 'Ditolak',
    variant: 'destructive',
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
  },
  cancelled: {
    label: 'Dibatalkan',
    variant: 'neutral',
    icon: AlertCircle,
    bgClass: 'bg-slate-50 dark:bg-slate-800/60',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-700',
  },
}

export default function RiwayatCutiPage() {
  const router = useRouter()
  const [currentYear, setCurrentYear] = useState<number>(2026)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  // Data state
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [requests, setRequests] = useState<LeaveRequestItem[]>([])
  const [totalRequests, setTotalRequests] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true)

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 8

  // Detail Modal State
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  // Cancel Confirmation State
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false)
  const [isCancelling, setIsCancelling] = useState<boolean>(false)

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    try {
      setIsBalanceLoading(true)
      const res = await fetch('/api/leave/balance')
      if (res.ok) {
        const data = await res.json()
        if (data.balance) {
          setBalance(data.balance)
        }
      }
    } catch (err) {
      console.error('Error fetching balance:', err)
    } finally {
      setIsBalanceLoading(false)
    }
  }, [])

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())

      const res = await fetch(`/api/leave/request?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setTotalRequests(data.total || 0)
        setTotalPages(data.totalPages || 1)
      } else {
        toast.error('Gagal memuat riwayat pengajuan cuti')
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      toast.error('Gagal terhubung ke server')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, currentPage])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Handle Tab Change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  // Handle Open Detail
  const handleViewDetail = (item: LeaveRequestItem) => {
    setSelectedRequest(item)
    setIsDetailOpen(true)
  }

  // Handle Cancel Request
  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    try {
      setIsCancelling(true)
      const res = await fetch(`/api/leave/request/${selectedRequest.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membatalkan pengajuan cuti')
      }

      toast.success('Pengajuan cuti berhasil dibatalkan')
      setIsCancelConfirmOpen(false)
      setIsDetailOpen(false)

      // Refresh data
      fetchRequests()
      fetchBalance()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      toast.error(msg)
    } finally {
      setIsCancelling(false)
    }
  }

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)

  // Handle PDF Download (for approved requests)
  const handleDownloadPDF = (request: LeaveRequestItem) => {
    toast.info(`Membuka Surat Cuti Resmi #${request.id.slice(0, 8)}...`)
    window.open(`/api/leave/letter/${request.id}`, '_blank')
  }

  // Handle Send to Registered Email
  const handleSendEmail = async (request: LeaveRequestItem) => {
    setSendingEmailId(request.id)
    toast.info(`Mengirim Surat Cuti Resmi #${request.id.slice(0, 8)} ke email terdaftar...`)
    try {
      const res = await fetch(`/api/leave/letter/${request.id}/email`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Surat cuti resmi berhasil dikirim ke email!')
      } else {
        toast.error(data.error || 'Gagal mengirim surat cuti ke email')
      }
    } catch {
      toast.error('Terjadi gangguan jaringan saat mengirim email')
    } finally {
      setSendingEmailId(null)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            Riwayat Cuti
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau status dan catatan riwayat seluruh permohonan cuti tahunan Anda
          </p>
        </div>

        <Button
          onClick={() => router.push('/cuti/ajukan')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Ajukan Cuti Baru
        </Button>
      </motion.div>

      {/* Compact Balance Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Ringkasan Saldo Cuti Tahun {currentYear}
            </span>
            <span className="text-xs text-blue-400 font-medium hidden sm:inline">
              PT E-KOPI ESS
            </span>
          </div>
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Total Kuota</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                {isBalanceLoading ? '...' : balance?.total ?? 0} <span className="text-xs font-normal text-slate-500">hari</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Digunakan</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {isBalanceLoading ? '...' : balance?.used ?? 0} <span className="text-xs font-normal text-slate-500">hari</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Reserved</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {isBalanceLoading ? '...' : balance?.reserved ?? 0} <span className="text-xs font-normal text-slate-500">hari</span>
              </span>
            </div>

            <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-xs text-blue-700 dark:text-blue-300 block font-semibold">Sisa Tersedia</span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {isBalanceLoading ? '...' : balance?.available ?? 0} <span className="text-xs font-medium text-blue-600/80">hari</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs sm:text-sm font-medium">
              Semua
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm font-medium">
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm font-medium">
              Disetujui
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm font-medium">
              Ditolak
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm font-medium">
              Dibatalkan
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center font-medium">
          Total: <strong className="text-slate-800 dark:text-slate-200">{totalRequests}</strong> pengajuan
        </span>
      </div>

      {/* Requests List: Mobile Cards & Desktop Table */}
      {isLoading ? (
        // Loading Skeleton
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-36" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-sm w-3/4" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-28" />
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        // Empty State
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="py-12">
            <EmptyState
              icon={CalendarDays}
              title={
                activeTab === 'all'
                  ? 'Belum Ada Pengajuan Cuti'
                  : `Tidak Ada Pengajuan Berstatus '${activeTab}'`
              }
              description={
                activeTab === 'all'
                  ? 'Anda belum pernah mengajukan cuti tahunan. Klik tombol di bawah untuk membuat pengajuan baru.'
                  : 'Tidak ditemukan riwayat permohonan cuti pada kategori status yang dipilih.'
              }
              actionLabel={activeTab === 'all' ? 'Ajukan Cuti Sekarang' : 'Tampilkan Semua Cuti'}
              onAction={() => {
                if (activeTab === 'all') {
                  router.push('/cuti/ajukan')
                } else {
                  setActiveTab('all')
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Desktop Table View (md:block) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-36">ID Pengajuan</TableHead>
                  <TableHead>Tanggal Cuti</TableHead>
                  <TableHead className="w-24 text-center">Durasi</TableHead>
                  <TableHead className="max-w-[220px]">Alasan</TableHead>
                  <TableHead className="w-40 text-center">Status</TableHead>
                  <TableHead className="w-36">Diajukan Pada</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((item) => {
                  const statusInfo = statusConfig[item.status]
                  const dates = item.selected_dates || []

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => handleViewDetail(item)}
                    >
                      {/* ID */}
                      <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.id}
                      </TableCell>

                      {/* Dates pills preview */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {dates.slice(0, 2).map((d) => (
                            <span
                              key={d}
                              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            >
                              {formatDate(d, 'dd MMM yyyy')}
                            </span>
                          ))}
                          {dates.length > 2 && (
                            <span className="text-[11px] text-slate-400 font-medium self-center">
                              +{dates.length - 2} hari lagi
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">
                        {item.total_days} hari
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="max-w-[220px] truncate text-slate-600 dark:text-slate-400 text-xs" title={item.reason}>
                        {item.reason}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <Badge
                          variant={statusInfo.variant}
                          className="text-xs font-semibold px-2.5 py-0.5 inline-flex items-center gap-1.5"
                        >
                          <statusInfo.icon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Submitted date */}
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.created_at, 'dd MMM yyyy')}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Unduh Surat Cuti Resmi"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadPDF(item)
                              }}
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetail(item)
                            }}
                            className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {requests.map((item) => {
              const statusInfo = statusConfig[item.status]
              const dates = item.selected_dates || []

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  onClick={() => handleViewDetail(item)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {item.id}
                    </span>
                    <Badge
                      variant={statusInfo.variant}
                      className="text-[11px] font-semibold px-2 py-0.5 inline-flex items-center gap-1"
                    >
                      <statusInfo.icon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Dates Pills */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Tanggal ({item.total_days} hari):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dates.slice(0, 3).map((d) => (
                        <span
                          key={d}
                          className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        >
                          {formatDate(d, 'dd MMM yyyy')}
                        </span>
                      ))}
                      {dates.length > 3 && (
                        <span className="text-xs text-slate-400 self-center font-medium">
                          +{dates.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {item.reason}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <span>Diajukan: {formatDate(item.created_at, 'dd MMM yyyy')}</span>
                    <div className="flex items-center gap-2.5">
                      {item.status === 'approved' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadPDF(item)
                          }}
                          className="text-emerald-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          <span>Surat Cuti</span>
                        </button>
                      )}
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        Lihat Rincian <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <span className="text-xs text-slate-500 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    {selectedRequest.id}
                  </span>
                  <Badge
                    variant={statusConfig[selectedRequest.status].variant}
                    className="text-xs font-semibold px-2.5 py-0.5 inline-flex items-center gap-1"
                  >
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                  Detail Pengajuan Cuti
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Diajukan pada {formatDateTime(selectedRequest.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Duration & Quota Stat */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Total Durasi:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedRequest.total_days} Hari Kerja
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Tahun Kuota:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedRequest.year}
                    </span>
                  </div>
                </div>

                {/* Dates List */}
                <div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                    Daftar Tanggal Cuti ({selectedRequest.selected_dates?.length || 0} hari):
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                    {(selectedRequest.selected_dates || []).map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        {formatDate(d, 'EEEE, dd MMMM yyyy')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                    Alasan Permohonan Cuti:
                  </span>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedRequest.reason}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <PhoneCall className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Nomor Kontak Darurat:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRequest.emergency_contact}
                    </span>
                  </div>
                </div>

                {/* Approval / Rejection Info */}
                {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Catatan Pemrosesan Admin
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block">Diproses Oleh:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedRequest.processed_by_admin?.name || 'Administrator'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Waktu Proses:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatDateTime(selectedRequest.processed_at)}
                        </span>
                      </div>
                    </div>

                    {selectedRequest.admin_notes && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-400 block">Catatan Tambahan:</span>
                        <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                          &ldquo;{selectedRequest.admin_notes}&rdquo;
                        </p>
                      </div>
                    )}

                    {selectedRequest.status === 'approved' && selectedRequest.verification_code && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kode Verifikasi Surat:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                          {selectedRequest.verification_code}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-800 pt-3">
                {/* Cancel Button for pending */}
                {selectedRequest.status === 'pending' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Batalkan Pengajuan
                  </Button>
                )}

                {/* PDF Download & Email for approved */}
                {selectedRequest.status === 'approved' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={sendingEmailId === selectedRequest.id}
                      onClick={() => handleSendEmail(selectedRequest)}
                      className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300"
                    >
                      {sendingEmailId === selectedRequest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-600" />
                      )}
                      <span>Kirim ke Email</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDownloadPDF(selectedRequest)}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold shadow-sm"
                    >
                      <FileDown className="h-4 w-4" />
                      Unduh Surat Cuti (PDF)
                    </Button>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Pembatalan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tindakan ini tidak dapat diurungkan. Kuota cuti yang di-reserved akan otomatis dikembalikan ke saldo aktif Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-700 dark:text-slate-300">
            Apakah Anda yakin ingin membatalkan pengajuan cuti nomor{' '}
            <strong className="text-blue-600 font-mono">{selectedRequest?.id}</strong> dengan durasi{' '}
            <strong>{selectedRequest?.total_days} hari</strong>?
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isCancelling}
              onClick={() => setIsCancelConfirmOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isCancelling}
              onClick={handleCancelRequest}
              className="gap-2"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                'Ya, Batalkan Pengajuan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
