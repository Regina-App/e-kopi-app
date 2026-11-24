'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  History,
  Search,
  CalendarDays,
  Wallet,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { formatCurrency } from '@/lib/utils'

interface HistoryEntry {
  id: string
  type: 'cuti' | 'koperasi'
  nik: string
  name: string
  description: string
  value: string
  status: string
  created_at: string
  raw: any
}

export default function AdminRiwayatPage() {
  const [activeTab, setActiveTab] = useState<'semua' | 'cuti' | 'koperasi'>('semua')
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Detail Modal
  const [detailItem, setDetailItem] = useState<HistoryEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch all leave and loan requests to build combined history
  const fetchAllHistory = useCallback(async () => {
    setLoading(true)
    try {
      const [leaveRes, loanRes] = await Promise.all([
        fetch('/api/admin/leave/requests?limit=100').then((r) => r.json()),
        fetch('/api/admin/loan/requests?limit=100').then((r) => r.json()),
      ])

      const combined: HistoryEntry[] = []

      if (leaveRes?.success && Array.isArray(leaveRes.requests)) {
        leaveRes.requests.forEach((l: any) => {
          combined.push({
            id: l.id,
            type: 'cuti',
            nik: l.employee?.nik || '-',
            name: l.employee?.full_name || 'Pegawai',
            description: l.reason || 'Pengajuan Cuti Tahunan',
            value: `${l.total_days} Hari`,
            status: l.status,
            created_at: l.created_at,
            raw: l,
          })
        })
      }

      if (loanRes?.success && Array.isArray(loanRes.requests)) {
        loanRes.requests.forEach((k: any) => {
          combined.push({
            id: k.id,
            type: 'koperasi',
            nik: k.employee?.nik || '-',
            name: k.employee?.full_name || 'Pegawai',
            description: k.is_takeover ? 'Takeover Pinjaman' : 'Pinjaman Baru',
            value: formatCurrency(k.loan_amount),
            status: k.status,
            created_at: k.created_at,
            raw: k,
          })
        })
      }

      // Sort by newest created_at
      combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setEntries(combined)
    } catch (err) {
      console.error('[AdminRiwayatPage] Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllHistory()
  }, [fetchAllHistory])

  // Filtered and paginated entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // Tab filter
      if (activeTab === 'cuti' && item.type !== 'cuti') return false
      if (activeTab === 'koperasi' && item.type !== 'koperasi') return false

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchId = item.id.toLowerCase().includes(query)
        const matchNik = item.nik.toLowerCase().includes(query)
        const matchName = item.name.toLowerCase().includes(query)
        const matchDesc = item.description.toLowerCase().includes(query)
        if (!matchId && !matchNik && !matchName && !matchDesc) return false
      }

      return true
    })
  }, [entries, activeTab, statusFilter, searchQuery])

  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, currentPage, pageSize])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Riwayat Seluruh Transaksi"
        description="Rekapitulasi riwayat pengajuan cuti dan pinjaman koperasi seluruh pegawai"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{filteredEntries.length} Data Ditampilkan</span>
          </div>
        }
      />

      {/* Tabs and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as any)
            setCurrentPage(1)
          }}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-white border border-slate-200 shadow-xs h-10 p-1">
            <TabsTrigger value="semua" className="text-xs px-4">
              Semua ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="cuti" className="text-xs px-4 gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
              <span>Cuti ({entries.filter((e) => e.type === 'cuti').length})</span>
            </TabsTrigger>
            <TabsTrigger value="koperasi" className="text-xs px-4 gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-purple-500" />
              <span>Koperasi ({entries.filter((e) => e.type === 'koperasi').length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari NIK, Nama, atau ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 h-10 text-xs bg-white border-slate-200"
            />
          </div>

          <div className="w-44">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-10 text-xs bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="completed">Lunas</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold">Tipe</TableHead>
                <TableHead className="text-xs font-semibold">ID Transaksi</TableHead>
                <TableHead className="text-xs font-semibold">NIK & Nama</TableHead>
                <TableHead className="text-xs font-semibold">Keterangan / Alasan</TableHead>
                <TableHead className="text-xs font-semibold text-right">Nilai / Durasi</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Tanggal Diajukan</TableHead>
                <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="Tidak ada riwayat transaksi"
                      description="Belum ada transaksi cuti atau koperasi yang sesuai dengan filter."
                      icon={History}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((item) => {
                  const isCuti = item.type === 'cuti'
                  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        {isCuti ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            <CalendarDays className="w-3 h-3" /> Cuti
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            <Wallet className="w-3 h-3" /> Pinjaman
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {item.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.nik}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-slate-900 font-mono">
                        {item.value}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{formattedDate}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDetailItem(item)
                            setDetailOpen(true)
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
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
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEntries.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold">
                Detail Transaksi #{detailItem?.id.slice(0, 8)}
              </DialogTitle>
              {detailItem && <StatusBadge status={detailItem.status} />}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Informasi terperinci transaksi {detailItem?.type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-900 text-sm">{detailItem.name}</div>
                <div className="text-slate-500">NIK: {detailItem.nik}</div>
                <div className="text-slate-500">
                  Tanggal Pengajuan:{' '}
                  {new Date(detailItem.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {detailItem.type === 'cuti' ? (
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Jumlah Hari Cuti:</span>
                    <span className="font-bold text-slate-800">{detailItem.value}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-500 block mb-1">Alasan:</span>
                    <span className="text-slate-800">{detailItem.raw?.reason}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Kontak Darurat:</span>
                    <span className="text-slate-800">{detailItem.raw?.emergency_contact}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Nominal Pinjaman:</span>
                    <span className="font-bold text-slate-800">{detailItem.value}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Tenor:</span>
                    <span className="font-medium">{detailItem.raw?.tenor} Bulan</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Angsuran / Bulan:</span>
                    <span className="font-bold text-indigo-700">
                      {formatCurrency(detailItem.raw?.installment_per_month || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span className="text-slate-500">Total Kewajiban:</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(detailItem.raw?.total_obligation || 0)}
                    </span>
                  </div>
                </div>
              )}

              {detailItem.raw?.admin_notes && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[11px] mb-1">Catatan Admin:</span>
                  <span className="text-slate-700 italic">{detailItem.raw.admin_notes}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="text-xs">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
