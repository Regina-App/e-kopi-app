'use client'

import React, { useState, useEffect } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Globe,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

interface EnrichedAuditLog {
  id: string
  actor_type: 'employee' | 'admin' | 'system'
  actor_id: string | null
  actorName?: string
  actorDetail?: string
  action: string
  target_type: string | null
  target_id: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const ACTION_OPTIONS = [
  { value: 'all', label: 'Semua Tindakan' },
  { value: 'LOGIN', label: 'LOGIN (Masuk)' },
  { value: 'LOGOUT', label: 'LOGOUT (Keluar)' },
  { value: 'REGISTER', label: 'REGISTER (Pendaftaran)' },
  { value: 'APPROVE_REGISTRATION', label: 'APPROVE_REGISTRATION' },
  { value: 'REJECT_REGISTRATION', label: 'REJECT_REGISTRATION' },
  { value: 'REQUEST_LEAVE', label: 'REQUEST_LEAVE (Cuti)' },
  { value: 'APPROVE_LEAVE', label: 'APPROVE_LEAVE' },
  { value: 'REJECT_LEAVE', label: 'REJECT_LEAVE' },
  { value: 'CANCEL_LEAVE', label: 'CANCEL_LEAVE' },
  { value: 'REQUEST_LOAN', label: 'REQUEST_LOAN (Pinjaman)' },
  { value: 'APPROVE_LOAN', label: 'APPROVE_LOAN' },
  { value: 'REJECT_LOAN', label: 'REJECT_LOAN' },
  { value: 'CANCEL_LOAN', label: 'CANCEL_LOAN' },
  { value: 'UPDATE_SETTINGS', label: 'UPDATE_SETTINGS' },
]

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<EnrichedAuditLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const limit = 15

  // Filters state
  const [actorType, setActorType] = useState<string>('all')
  const [action, setAction] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Expandable row state (log IDs that are expanded)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const fetchLogs = async (targetPage = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('limit', String(limit))

      if (actorType !== 'all') params.set('actorType', actorType)
      if (action !== 'all') params.set('action', action)
      if (search.trim()) params.set('search', search.trim())
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        setLogs(json.logs || [])
        setTotal(json.total || 0)
        setTotalPages(json.totalPages || 1)
        setPage(json.page || 1)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [actorType, action, startDate, endDate])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1)
  }

  const getActionBadgeClass = (act: string) => {
    if (act.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 border-emerald-300'
    if (act.includes('REJECT') || act.includes('CANCEL'))
      return 'bg-rose-50 text-rose-700 border-rose-300'
    if (act.includes('LOGIN') || act.includes('REGISTER'))
      return 'bg-blue-50 text-blue-700 border-blue-300'
    if (act.includes('REQUEST')) return 'bg-amber-50 text-amber-700 border-amber-300'
    return 'bg-slate-100 text-slate-700 border-slate-300'
  }

  const getActorBadge = (type: string) => {
    if (type === 'admin') {
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] uppercase font-bold"
        >
          ADMIN
        </Badge>
      )
    }
    if (type === 'employee') {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase font-bold"
        >
          KARYAWAN
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] uppercase font-bold"
      >
        SISTEM
      </Badge>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl text-blue-400 ring-4 ring-slate-100">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Log</h1>
            <p className="text-sm text-slate-500">
              Jejak audit tidak dapat diubah (immutable trail) untuk seluruh aktivitas dan perubahan data sistem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 font-mono py-1">
            Total: {total.toLocaleString('id-ID')} Entri
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pencarian</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID target, aksi, nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Actor Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipe Pengguna (Actor)
              </label>
              <select
                value={actorType}
                onChange={(e) => setActorType(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Semua Tipe</option>
                <option value="employee">Karyawan (Pegawai)</option>
                <option value="admin">Administrator</option>
                <option value="system">Sistem Otomatis</option>
              </select>
            </div>

            {/* Action Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Aksi</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* End Date & Submit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
                <Button type="submit" size="sm" className="h-9 px-3 bg-blue-700 hover:bg-blue-800">
                  <Filter className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">WAKTU (WIB)</th>
                  <th className="py-3 px-3">PENGGUNA (ACTOR)</th>
                  <th className="py-3 px-3">AKSI</th>
                  <th className="py-3 px-3">TARGET</th>
                  <th className="py-3 px-3">IP ADDRESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      Memuat rekaman log audit...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Terminal className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Tidak ada catatan log audit yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = !!expandedIds[log.id]
                    const hasValues = log.old_values || log.new_values

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => hasValues && toggleExpand(log.id)}
                          className={`hover:bg-slate-50 transition-colors ${
                            hasValues ? 'cursor-pointer' : ''
                          } ${isExpanded ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="py-2.5 px-3 text-slate-400">
                            {hasValues &&
                              (isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              ))}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {getActorBadge(log.actor_type)}
                              <span className="font-semibold text-slate-900">{log.actorName}</span>
                            </div>
                            {log.actorDetail && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {log.actorDetail}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant="outline"
                              className={`text-[10.5px] font-mono font-bold ${getActionBadgeClass(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {log.target_type && (
                              <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm mr-1.5 border border-slate-200">
                                {log.target_type}
                              </span>
                            )}
                            <span className="font-mono text-slate-700">{log.target_id || '-'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {log.ip_address || '-'}
                          </td>
                        </tr>

                        {/* Expandable JSON Detail View */}
                        {isExpanded && (
                          <tr className="bg-slate-950 text-slate-200">
                            <td colSpan={6} className="p-4 pl-10 border-b border-slate-800">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                                {log.old_values && (
                                  <div>
                                    <div className="text-amber-400 font-bold mb-1.5 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                      DATA SEBELUMNYA (OLD VALUES):
                                    </div>
                                    <pre className="bg-slate-900 p-3 rounded-md overflow-x-auto text-slate-300 border border-slate-800">
                                      {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_values && (
                                  <div>
                                    <div className="text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      DATA PERUBAHAN (NEW VALUES):
                                    </div>
                                    <pre className="bg-slate-900 p-3 rounded-md overflow-x-auto text-slate-300 border border-slate-800">
                                      {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              {log.user_agent && (
                                <div className="mt-3 text-[10px] text-slate-400 font-mono">
                                  User-Agent: {log.user_agent}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-slate-50 gap-3 text-xs text-slate-600">
            <div>
              Halaman <strong>{page}</strong> dari <strong>{totalPages || 1}</strong> (Menampilkan{' '}
              {logs.length} dari {total} data)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 text-xs"
              >
                Berikutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
