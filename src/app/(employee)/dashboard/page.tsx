'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CalendarPlus,
  Landmark,
  History,
  UserCircle,
  Info,
  CalendarCheck,
  Wallet,
  Sparkles,
  Building,
  MapPin,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'

import { useAuth } from '@/lib/hooks/use-auth'
import {
  formatDate,
  formatNIK,
  formatRupiah,
} from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/loading'

// Quick actions configuration
const QUICK_ACTIONS = [
  {
    href: '/cuti/ajukan',
    label: 'Ajukan Cuti',
    desc: 'Permohonan libur kerja',
    icon: CalendarPlus,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 hover:bg-blue-100/80 border-blue-100 dark:bg-blue-950/40 dark:border-blue-900',
  },
  {
    href: '/koperasi/ajukan',
    label: 'Ajukan Pinjaman',
    desc: 'Pinjaman dana koperasi',
    icon: Landmark,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900',
  },
  {
    href: '/cuti',
    label: 'Riwayat Cuti',
    desc: 'Daftar pengajuan cuti',
    icon: History,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 hover:bg-purple-100/80 border-purple-100 dark:bg-purple-950/40 dark:border-purple-900',
  },
  {
    href: '/koperasi',
    label: 'Riwayat Koperasi',
    desc: 'Status pinjaman & angsuran',
    icon: Wallet,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 hover:bg-amber-100/80 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900',
  },
  {
    href: '/profil',
    label: 'Profil Saya',
    desc: 'Informasi data diri',
    icon: UserCircle,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900',
  },
  {
    href: '/tentang',
    label: 'Tentang Aplikasi',
    desc: 'Info & bantuan sistem',
    icon: Info,
    iconColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800',
  },
]

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

export default function DashboardPage() {
  const { employee, isLoading } = useAuth()
  const [todayFormatted, setTodayFormatted] = React.useState<string>('')

  React.useEffect(() => {
    setTodayFormatted(formatDate(new Date(), 'EEEE, dd MMMM yyyy'))
  }, [])

  // Placeholder Leave summary metrics
  const totalLeaveQuota = 12
  const usedLeaveDays = 4
  const remainingLeaveDays = totalLeaveQuota - usedLeaveDays
  const pendingLeaveCount = 0
  const leaveUsagePercentage = (usedLeaveDays / totalLeaveQuota) * 100

  // Placeholder Cooperative Loan summary metrics
  const activeLoanAmount = 2500000
  const installmentPerMonth = 687500
  const remainingInstallments = 3
  const remainingObligation = 2062500
  const nextDeductionDate = '05 Desember 2026'

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <SkeletonCard lines={2} className="h-32 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard lines={4} className="h-56 rounded-2xl" />
          <SkeletonCard lines={4} className="h-56 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const displayName = employee?.full_name || 'Rekan Pegawai'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* 1. GREETING CARD */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 -mb-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md mb-3 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {displayName}!
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-blue-100 max-w-xl">
              Akses cepat pengajuan cuti tahunan, simpan-pinjam koperasi, dan pantau status administrasi Anda dalam satu platform terintegrasi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cuti/ajukan"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-md transition-all hover:bg-blue-50 active:scale-95"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Ajukan Cuti</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. EMPLOYEE INFO CARD */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold text-lg dark:bg-blue-950 dark:text-blue-300">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                NIK: {employee?.nik ? formatNIK(employee.nik) : '3201 0000 0000 0000'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={employee?.status === 'approved' ? 'success' : 'warning'}
              className="capitalize px-3 py-1 text-xs font-semibold"
            >
              {employee?.status === 'approved' ? 'Pegawai Aktif' : 'Status Pending'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> Perusahaan
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {employee?.company_name || 'PT E-KOPI Nusantara'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Site / Lokasi
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {employee?.site_name || 'Head Office'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Departemen</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {employee?.department_name || 'Operasional'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Jabatan</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {employee?.position_name || 'Staff Lapangan'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Regu Kerja
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {employee?.is_crew_member ? (employee.crew_name || 'Regu 1') : 'Non-Regu'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. SUMMARY CARDS GRID: LEAVE & COOPERATIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEAVE SUMMARY CARD */}
        <motion.div variants={itemVariants}>
          <StatCard
            title="Ringkasan Cuti Tahunan"
            value={`${remainingLeaveDays} Hari Tersisa`}
            description="Jatah kuota cuti tahunan berjalan periode tahun ini."
            icon={CalendarCheck}
            iconBg="bg-blue-50 dark:bg-blue-950/60"
            iconColor="text-blue-600 dark:text-blue-400"
            badge={
              <Link
                href="/cuti/ajukan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <span>Ajukan</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            items={[
              { label: 'Total Kuota', value: `${totalLeaveQuota} hari` },
              { label: 'Sudah Digunakan', value: `${usedLeaveDays} hari` },
              { label: 'Sisa Kuota', value: `${remainingLeaveDays} hari`, color: 'text-emerald-600 font-bold' },
              { label: 'Pending Persetujuan', value: `${pendingLeaveCount} pengajuan` },
            ]}
            progress={{
              value: leaveUsagePercentage,
              label: `Penggunaan: ${usedLeaveDays} dari ${totalLeaveQuota} hari`,
            }}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kuota cuti diperbarui setiap awal tahun.</span>
                <Link
                  href="/cuti"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Lihat Riwayat &rarr;
                </Link>
              </div>
            }
          />
        </motion.div>

        {/* COOPERATIVE SUMMARY CARD */}
        <motion.div variants={itemVariants}>
          <StatCard
            title="Koperasi Karyawan"
            value={formatRupiah(activeLoanAmount)}
            description="Total pinjaman aktif dengan potongan payroll terjadwal."
            icon={Landmark}
            iconBg="bg-emerald-50 dark:bg-emerald-950/60"
            iconColor="text-emerald-600 dark:text-emerald-400"
            badge={
              <Link
                href="/koperasi/ajukan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <span>Pinjam</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            items={[
              { label: 'Angsuran Bulanan', value: `${formatRupiah(installmentPerMonth)} / bln` },
              { label: 'Sisa Angsuran', value: `${remainingInstallments} kali lagi` },
              { label: 'Sisa Kewajiban', value: formatRupiah(remainingObligation), color: 'text-amber-600 font-bold' },
              { label: 'Jadwal Potong Gaji', value: nextDeductionDate },
            ]}
            footer={
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Potongan otomatis tanggal 5 setiap bulan.</span>
                </div>
                <Link
                  href="/koperasi"
                  className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Detail &rarr;
                </Link>
              </div>
            }
          />
        </motion.div>
      </div>

      {/* 4. QUICK ACTIONS GRID */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Akses Cepat Layanan
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.href + idx}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Link
                  href={action.href}
                  className={`flex h-full flex-col justify-between rounded-2xl border p-4 text-left transition-all shadow-xs hover:shadow-md ${action.bgColor}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-slate-900">
                    <Icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {action.label}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {action.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
