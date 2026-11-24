'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  MapPin,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatRupiah } from '@/lib/utils'

interface MasterOption {
  id: string
  name: string
  company_id?: string | null
}

export default function AdminLaporanPage() {
  const [activeTab, setActiveTab] = useState<'cuti' | 'koperasi' | 'gabungan'>('cuti')

  // Filters state
  const [period, setPeriod] = useState<'all' | 'bulanan' | 'tahunan' | 'rentang'>('all')
  const [year, setYear] = useState<number>(2025)
  const [month, setMonth] = useState<number>(1)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('all')
  const [siteId, setSiteId] = useState<string>('all')

  useEffect(() => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }, [])

  // Master data state
  const [companies, setCompanies] = useState<MasterOption[]>([])
  const [sites, setSites] = useState<MasterOption[]>([])

  // Preview data state
  const [loading, setLoading] = useState<boolean>(true)
  const [exporting, setExporting] = useState<boolean>(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [summaryStats, setSummaryStats] = useState<any>(null)

  // Fetch master data on mount
  useEffect(() => {
    async function loadMasterData() {
      try {
        const res = await fetch('/api/master')
        const json = await res.json()
        if (json.companies) setCompanies(json.companies)
        if (json.sites) setSites(json.sites)
      } catch (err) {
        console.error('Failed to load master data:', err)
      }
    }
    loadMasterData()
  }, [])

  // Filtered sites based on company selection
  const filteredSites =
    companyId && companyId !== 'all'
      ? sites.filter((s) => !s.company_id || s.company_id === companyId)
      : sites

  // Build query string
  const buildQueryParams = (format: 'json' | 'excel' | 'pdf' = 'json') => {
    const params = new URLSearchParams()
    params.set('format', format)
    params.set('period', period)

    if (period === 'tahunan') {
      params.set('year', String(year))
    } else if (period === 'bulanan') {
      params.set('year', String(year))
      params.set('month', String(month))
    } else if (period === 'rentang') {
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
    }

    if (companyId && companyId !== 'all') params.set('companyId', companyId)
    if (siteId && siteId !== 'all') params.set('siteId', siteId)

    return params.toString()
  }

  // Fetch preview data
  const fetchReportData = async () => {
    setLoading(true)
    try {
      const q = buildQueryParams('json')
      let endpoint = '/api/admin/reports/leave'
      if (activeTab === 'koperasi') endpoint = '/api/admin/reports/loan'
      if (activeTab === 'gabungan') endpoint = '/api/admin/reports/combined'

      const res = await fetch(`${endpoint}?${q}`)
      const json = await res.json()

      if (json.success) {
        if (activeTab === 'gabungan') {
          setSummaryStats(json.summary)
          setPreviewData(json.leaveData || [])
        } else {
          setSummaryStats(json.summary)
          setPreviewData(json.data || [])
        }
      } else {
        toast.error(json.error || 'Gagal memuat pratinjau laporan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengambil data laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [activeTab, period, year, month, startDate, endDate, companyId, siteId])

  // Download Handler
  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true)
    const toastId = toast.loading(`Menyiapkan unduhan ${format.toUpperCase()}...`)

    try {
      const q = buildQueryParams(format)
      let endpoint = '/api/admin/reports/leave'
      if (activeTab === 'koperasi') endpoint = '/api/admin/reports/loan'
      if (activeTab === 'gabungan') endpoint = '/api/admin/reports/combined'

      const url = `${endpoint}?${q}`

      if (format === 'pdf') {
        // Open PDF printable page in new window
        window.open(url, '_blank')
        toast.success('Pratinjau cetak PDF dibuka di tab baru', { id: toastId })
      } else {
        // Download Excel via link trigger
        const res = await fetch(url)
        if (!res.ok) throw new Error('Gagal mengunduh file Excel')

        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `Laporan-${activeTab.toUpperCase()}-${Date.now()}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)

        toast.success('Laporan Excel berhasil diunduh!', { id: toastId })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor laporan'
      toast.error(msg, { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan</h1>
              <p className="text-sm text-slate-500">
                Pusat rekapitulasi data, analitik statistik, dan ekspor dokumen cuti serta pinjaman
              </p>
            </div>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting || loading}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Download Excel
          </Button>
          <Button
            variant="default"
            onClick={() => handleExport('pdf')}
            disabled={exporting || loading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-2 pt-2 shadow-xs">
        <button
          onClick={() => setActiveTab('cuti')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'cuti'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Laporan Cuti
        </button>
        <button
          onClick={() => setActiveTab('koperasi')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'koperasi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Laporan Koperasi
        </button>
        <button
          onClick={() => setActiveTab('gabungan')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'gabungan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileBarChart className="w-4 h-4" />
          Laporan Gabungan
        </button>
      </div>

      {/* Filters Section */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-blue-600" />
              Filter &amp; Parameter Laporan
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchReportData}
              disabled={loading}
              className="text-xs h-8 text-slate-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Jenis Periode
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Semua Periode</option>
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
                <option value="rentang">Rentang Tanggal</option>
              </select>
            </div>

            {/* Bulanan Picker */}
            {period === 'bulanan' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bulan</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    {[
                      'Januari',
                      'Februari',
                      'Maret',
                      'April',
                      'Mei',
                      'Juni',
                      'Juli',
                      'Agustus',
                      'September',
                      'Oktober',
                      'November',
                      'Desember',
                    ].map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </>
            )}

            {/* Tahunan Picker */}
            {period === 'tahunan' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {/* Rentang Tanggal Picker */}
            {period === 'rentang' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </>
            )}

            {/* Company Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Perusahaan
              </label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value)
                  setSiteId('all')
                }}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Semua Perusahaan</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Lokasi / Site
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Semua Site</option>
                {filteredSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === 'cuti' && summaryStats && (
          <>
            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Pengajuan</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {summaryStats.totalRequests || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Hari Cuti</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {summaryStats.totalDays || 0} Hari
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Disetujui</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {summaryStats.approvedCount || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Menunggu / Ditolak</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {(summaryStats.pendingCount || 0) + (summaryStats.rejectedCount || 0)}
                  </p>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'koperasi' && summaryStats && (
          <>
            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Pinjaman</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {summaryStats.totalLoans || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Nominal Disbursed</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {formatRupiah(summaryStats.totalDisbursed || 0)}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Net Pencairan</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {formatRupiah(summaryStats.totalNetDisbursement || 0)}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Disetujui / Selesai</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {summaryStats.approvedCount || 0}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'gabungan' && summaryStats && (
          <>
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Pengajuan Cuti</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summaryStats.totalLeaveRequests || 0} Pengajuan
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {summaryStats.totalLeaveDays || 0} Hari Kerja
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Pengajuan Pinjaman</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summaryStats.totalLoans || 0} Berkas
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {formatRupiah(summaryStats.totalLoanDisbursed || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Total Net Pencairan</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {formatRupiah(summaryStats.totalLoanNetDisbursement || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Setelah potongan takeover</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Status Ekspor</p>
                <p className="text-lg font-bold text-slate-800 mt-1">2 Lembar Kerja</p>
                <p className="text-xs text-slate-500 mt-0.5">Cuti &amp; Pinjaman Terpisah</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Preview Section Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Pratinjau Data (Maksimal 10 Baris Pertama)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Gunakan tombol unduh di bagian atas untuk mendapatkan keseluruhan dataset dalam format Excel atau PDF
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {previewData.length} baris ditampilkan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">NO</th>
                  <th className="py-2.5 px-3">ID PENGAJUAN</th>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">NAMA LENGKAP</th>
                  <th className="py-2.5 px-3">PERUSAHAAN / SITE</th>
                  {activeTab === 'cuti' && (
                    <>
                      <th className="py-2.5 px-3 text-center">TOTAL HARI</th>
                      <th className="py-2.5 px-3">TANGGAL CUTI</th>
                      <th className="py-2.5 px-3">ALASAN</th>
                    </>
                  )}
                  {activeTab === 'koperasi' && (
                    <>
                      <th className="py-2.5 px-3 text-right">JUMLAH PINJAMAN</th>
                      <th className="py-2.5 px-3 text-center">TENOR</th>
                      <th className="py-2.5 px-3 text-right">ANGSURAN</th>
                      <th className="py-2.5 px-3 text-right">NET CAIR</th>
                    </>
                  )}
                  {activeTab === 'gabungan' && (
                    <>
                      <th className="py-2.5 px-3 text-center">TOTAL HARI</th>
                      <th className="py-2.5 px-3">TANGGAL</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      Memuat data laporan...
                    </td>
                  </tr>
                ) : previewData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      Tidak ada data yang sesuai dengan kriteria filter terpilih.
                    </td>
                  </tr>
                ) : (
                  previewData.slice(0, 10).map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                        {row.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{row.nik}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.fullName}</td>
                      <td className="py-2.5 px-3">
                        <div>{row.companyName}</div>
                        <div className="text-[10px] text-slate-400">{row.siteName}</div>
                      </td>

                      {activeTab === 'cuti' && (
                        <>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                            {row.totalDays} Hari
                          </td>
                          <td className="py-2.5 px-3 max-w-[180px] truncate">
                            {Array.isArray(row.selectedDates)
                              ? row.selectedDates
                                  .map((d: string) => formatDate(d, 'dd/MM'))
                                  .join(', ')
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate">{row.reason}</td>
                        </>
                      )}

                      {activeTab === 'koperasi' && (
                        <>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {formatRupiah(row.loanAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">{row.tenor} Bln</td>
                          <td className="py-2.5 px-3 text-right">
                            {formatRupiah(row.installmentPerMonth)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {formatRupiah(row.netDisbursement)}
                          </td>
                        </>
                      )}

                      {activeTab === 'gabungan' && (
                        <>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                            {row.totalDays} Hari
                          </td>
                          <td className="py-2.5 px-3">
                            {Array.isArray(row.selectedDates)
                              ? row.selectedDates
                                  .map((d: string) => formatDate(d, 'dd/MM'))
                                  .join(', ')
                              : '-'}
                          </td>
                        </>
                      )}

                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={
                            row.status === 'approved' || row.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : row.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }
                        >
                          {row.status ? row.status.toUpperCase() : 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
