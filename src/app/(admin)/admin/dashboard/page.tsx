'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Clock,
  CalendarDays,
  Wallet,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Crown,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  FileBarChart,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  totalEmployees: number
  pendingRegistrations: number
  pendingLeaveRequests: number
  pendingLoanRequests: number
  totalPendingRequests: number
  thisMonthLeaveDays: number
  activeLoansCount: number
  totalActiveLoanAmount: number
  approvedLeaveCount: number
  completedLoansCount: number
}

interface MonthlyTrend {
  month: string
  cuti: number
  koperasi: number
  cutiDays: number
  totalLoan: number
}

interface StatusBreakdownItem {
  name: string
  value: number
  color: string
  [key: string]: any
}

interface RecentActivityItem {
  id: string
  action: string
  actor_type: string
  target_type: string | null
  target_id: string | null
  created_at: string
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownItem[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])

  // Master options for filters
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])

  // Admin user & Greeting state
  const [adminName, setAdminName] = useState<string>('Pemilik & Super Admin')
  const [adminRole, setAdminRole] = useState<string>('Super Admin')
  const [greetingText, setGreetingText] = useState<string>('Selamat Datang')
  const [currentDateStr, setCurrentDateStr] = useState<string>('')

  // Set greeting & current date on mount
  useEffect(() => {
    const hours = new Date().getHours()
    if (hours < 11) setGreetingText('Selamat Pagi')
    else if (hours < 15) setGreetingText('Selamat Siang')
    else if (hours < 18) setGreetingText('Selamat Sore')
    else setGreetingText('Selamat Malam')

    try {
      setCurrentDateStr(
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date())
      )
    } catch {
      setCurrentDateStr(new Date().toLocaleDateString())
    }

    // Fetch active session info
    fetch('/api/admin/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d?.admin?.name) {
          setAdminName(d.admin.name)
          setAdminRole(d.admin.role === 'super_admin' ? 'Pemilik & Super Admin' : 'Administrator')
        }
      })
      .catch(() => {})
  }, [])

  // Filters state
  const [selectedYear, setSelectedYear] = useState<string>('2025')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedSite, setSelectedSite] = useState<string>('all')

  // Set current year on client mount
  useEffect(() => {
    setSelectedYear(String(new Date().getFullYear()))
  }, [])

  // Load master companies and sites once
  useEffect(() => {
    fetch('/api/master')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCompanies(data.companies || [])
          setSites(data.sites || [])
        }
      })
      .catch(() => {})
  }, [])

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        year: selectedYear,
        company_id: selectedCompany,
        site_id: selectedSite,
      })

      const res = await fetch(`/api/admin/stats?${query.toString()}`)
      const data = await res.json()

      if (data.success) {
        setStats(data.stats)
        setMonthlyTrends(data.monthlyTrends || [])
        setStatusBreakdown(data.statusBreakdown || [])
        setRecentActivity(data.recentActivity || [])
      }
    } catch (err) {
      console.error('[DashboardPage] Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedCompany, selectedSite])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. ULTRA-PREMIUM OWNER & ADMIN GREETING CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-blue-900/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{adminRole}</span>
              </span>
              {currentDateStr && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentDateStr}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xs">
              {greetingText},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-200 to-amber-200">
                {adminName}!
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selamat datang di Panel Kontrol Manajemen PT E-KOPI Sukses Makmur. Akses langsung pengaturan Master Perusahaan, database kepegawaian, serta laporan resmi siap cetak.
            </p>
          </div>

          {/* Quick Access Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/master-perusahaan"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 backdrop-blur-md transition-all shadow-sm"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Master Perusahaan</span>
            </Link>
            <Link
              href="/admin/karyawan"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-900/30 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Database Karyawan</span>
            </Link>
            <Link
              href="/admin/laporan"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-950/30 transition-all"
            >
              <FileBarChart className="w-4 h-4" />
              <span>Laporan Cetak</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Page Title & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Ringkasan Statistik & Operasional
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analisis metrik permohonan cuti, pinjaman koperasi aktif, dan tren bulanan
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          {/* Year Filter */}
          <div className="w-32">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">Tahun 2024</SelectItem>
                <SelectItem value="2025">Tahun 2025</SelectItem>
                <SelectItem value="2026">Tahun 2026</SelectItem>
                <SelectItem value="2027">Tahun 2027</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="w-44">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="h-9 text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Perusahaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Perusahaan</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Filter */}
          <div className="w-40">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="h-9 text-xs">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Site / Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="h-9 px-3 gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Row of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse p-5"
            />
          ))
        ) : (
          <>
            <StatCard
              title="Total Karyawan"
              value={stats?.totalEmployees || 0}
              description="Pegawai aktif terdaftar"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              footer={
                <Link
                  href="/admin/karyawan"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <span>Lihat database</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />

            <StatCard
              title="Pengajuan Pending"
              value={stats?.totalPendingRequests || 0}
              description={`${stats?.pendingLeaveRequests || 0} cuti, ${stats?.pendingLoanRequests || 0} pinjaman, ${stats?.pendingRegistrations || 0} reg`}
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              footer={
                <Link
                  href="/admin/pengajuan-cuti"
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium"
                >
                  <span>Proses persetujuan</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />

            <StatCard
              title="Cuti Bulan Ini"
              value={`${stats?.thisMonthLeaveDays || 0} Hari`}
              description="Total hari cuti disetujui bulan ini"
              icon={CalendarDays}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
              footer={
                <Link
                  href="/admin/pengajuan-cuti"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-medium"
                >
                  <span>Riwayat cuti</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />

            <StatCard
              title="Pinjaman Aktif"
              value={formatCurrency(stats?.totalActiveLoanAmount || 0)}
              description={`${stats?.activeLoansCount || 0} pinjaman berjalan`}
              icon={Wallet}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
              footer={
                <Link
                  href="/admin/pengajuan-koperasi"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                >
                  <span>Kelola pinjaman</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
          </>
        )}
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Bar Chart (Cuti vs Koperasi per Bulan) */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Pengajuan per Bulan ({selectedYear})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Perbandingan frekuensi permohonan Cuti vs Pinjaman Koperasi
                </CardDescription>
              </div>
              {monthlyTrends.every((m) => m.cuti === 0 && m.koperasi === 0) && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Data 0 (Bersih)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-72 w-full bg-slate-100 rounded-lg animate-pulse" />
            ) : monthlyTrends.every((m) => m.cuti === 0 && m.koperasi === 0) ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 shadow-xs">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Database Belum Memiliki Pengajuan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Grafik bulanan tahun {selectedYear} saat ini bernilai 0. Diagram batang akan otomatis terisi secara dinamis saat karyawan mulai mengajukan cuti atau pinjaman.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="cuti" name="Cuti" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="koperasi" name="Koperasi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Pie Chart (Status Pengajuan) */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              Status Pengajuan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Distribusi status seluruh permohonan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-72 w-full bg-slate-100 rounded-lg animate-pulse" />
            ) : statusBreakdown.every((item) => item.value === 0) ? (
              <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Tidak Ada Antrean Pengajuan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Semua transaksi berstatus 0. Diagram lingkaran akan otomatis memetakan rasio Disetujui, Menunggu, dan Ditolak secara realtime.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 text-xs mt-2">
                  {statusBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                      <span className="text-slate-400">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Line Chart (Penggunaan Cuti Bulanan) */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              Hari Cuti yang Diambil (Bulanan)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Total durasi hari cuti terpakai pegawai per bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-64 w-full bg-slate-100 rounded-lg animate-pulse" />
            ) : monthlyTrends.every((m) => m.cutiDays === 0) ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">Belum Ada Pengambilan Cuti</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Rekap akumulasi hari cuti per bulan masih 0. Grafik garis akan terpetakan saat pengajuan cuti disetujui.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Hari`, 'Total Hari']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cutiDays"
                      name="Hari Cuti"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Bar Chart (Total Pinjaman Bulanan) */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              Total Penyaluran Pinjaman Koperasi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Akumulasi nominal pinjaman disetujui (Rupiah)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-64 w-full bg-slate-100 rounded-lg animate-pulse" />
            ) : monthlyTrends.every((m) => m.totalLoan === 0) ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">Belum Ada Penyaluran Dana</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Total nominal pinjaman yang dicairkan masih Rp 0. Grafik akan diperbarui secara otomatis pasca pencairan dana.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `${val / 1000000} Jt`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Nominal']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="totalLoan" name="Nominal Pinjaman" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">
              Aktivitas Sistem Terkini
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Catatan audit log transaksi dan perubahan terbaru
            </CardDescription>
          </div>
          <Link href="/admin/riwayat">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 gap-1 h-8">
              <span>Buka Riwayat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((log) => {
                const date = new Date(log.created_at)
                const formattedDate = date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {log.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Target: {log.target_type || 'system'} {log.target_id ? `(#${log.target_id.slice(0, 8)})` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      {formattedDate}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
