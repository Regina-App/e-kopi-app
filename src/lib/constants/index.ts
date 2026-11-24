export const APP_NAME = "E-KOPI By Regina - App"
export const APP_DESCRIPTION = "Employee Self-Service & Cooperative Management Platform"
export const APP_VERSION = "1.0.0"
export const APP_DEVELOPER = "Regina - App"

export const SESSION_DURATION_DAYS = 30
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const OTP_EXPIRY_MINUTES = 5
export const OTP_MAX_ATTEMPTS = 5

export const DEFAULT_INTEREST_RATE = 0.025
export const DEFAULT_LEAVE_QUOTA = 12
export const MIN_WORK_DURATION_MONTHS = 12

export const LOAN_PERIOD_START = 8
export const LOAN_PERIOD_END = 28
export const LOAN_DEDUCTION_DAY = 5

export const DEFAULT_MAX_TENOR = 4
export const DEFAULT_MAX_LOAN = 10000000
export const ITEMS_PER_PAGE = 10

export interface AdminPermission {
  key: string
  label: string
  description: string
}

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  {
    key: "manage_employees",
    label: "Kelola Pegawai",
    description: "Menambah, mengubah, dan mengarsipkan data induk pegawai",
  },
  {
    key: "view_employees",
    label: "Lihat Pegawai",
    description: "Melihat daftar dan informasi profil lengkap pegawai",
  },
  {
    key: "manage_leave",
    label: "Kelola Cuti",
    description: "Membuat dan mengubah data permohonan cuti pegawai",
  },
  {
    key: "approve_leave",
    label: "Persetujuan Cuti",
    description: "Menyetujui atau menolak permohonan cuti pegawai",
  },
  {
    key: "manage_leave_quota",
    label: "Kelola Kuota Cuti",
    description: "Mengatur jatah dan penyesuaian kuota cuti tahunan pegawai",
  },
  {
    key: "manage_loans",
    label: "Kelola Pinjaman",
    description: "Membuat, mengedit, dan memantau pengajuan pinjaman koperasi",
  },
  {
    key: "approve_loans",
    label: "Persetujuan Pinjaman",
    description: "Menyetujui atau menolak permohonan pinjaman koperasi",
  },
  {
    key: "manage_deductions",
    label: "Kelola Potongan Gaji",
    description: "Menjadwalkan dan mengonfirmasi potongan angsuran pinjaman",
  },
  {
    key: "manage_master_data",
    label: "Kelola Master Data",
    description: "Mengelola perusahaan, site, departemen, jabatan, dan regu kerja",
  },
  {
    key: "manage_admins",
    label: "Kelola Administrator",
    description: "Menambah administrator baru dan mengatur hak akses pengguna",
  },
  {
    key: "view_reports",
    label: "Lihat Laporan",
    description: "Mengakses dashboard analitik dan statistik operasional",
  },
  {
    key: "export_reports",
    label: "Ekspor Laporan",
    description: "Mengunduh rekapitulasi data dalam format Excel / CSV / PDF",
  },
  {
    key: "view_audit_log",
    label: "Lihat Log Audit",
    description: "Memantau catatan riwayat aktivitas dan perubahan data sistem",
  },
  {
    key: "manage_settings",
    label: "Pengaturan Sistem",
    description: "Mengubah parameter konfigurasi dan operasional aplikasi",
  },
]

export interface StatusColorStyle {
  bg: string
  text: string
  border: string
  dot: string
}

export const STATUS_COLORS: Record<string, StatusColorStyle> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  approved: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  rejected: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  cancelled: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
  completed: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  scheduled: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
  },
  confirmed: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
  },
  skipped: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
  },
}

export interface EmployeeNavItem {
  href: string
  label: string
  icon: string
}

export const EMPLOYEE_NAV_ITEMS: EmployeeNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
  },
  {
    href: "/cuti/ajukan",
    label: "Ajukan Cuti",
    icon: "CalendarPlus",
  },
  {
    href: "/koperasi/ajukan",
    label: "Ajukan Pinjaman",
    icon: "WalletCards",
  },
  {
    href: "/profil",
    label: "Profil",
    icon: "User",
  },
  {
    href: "/tentang",
    label: "Tentang",
    icon: "Info",
  },
]

export interface AdminNavItem {
  href: string
  label: string
  icon: string
  permissionKey?: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
  },
  {
    href: "/admin/pegawai",
    label: "Data Pegawai",
    icon: "Users",
    permissionKey: "view_employees",
  },
  {
    href: "/admin/cuti",
    label: "Permohonan Cuti",
    icon: "CalendarDays",
    permissionKey: "approve_leave",
  },
  {
    href: "/admin/cuti/kuota",
    label: "Kuota Cuti",
    icon: "CalendarCheck",
    permissionKey: "manage_leave_quota",
  },
  {
    href: "/admin/koperasi",
    label: "Pinjaman Koperasi",
    icon: "Landmark",
    permissionKey: "approve_loans",
  },
  {
    href: "/admin/koperasi/potongan",
    label: "Potongan Gaji",
    icon: "Receipt",
    permissionKey: "manage_deductions",
  },
  {
    href: "/admin/master",
    label: "Master Data",
    icon: "Database",
    permissionKey: "manage_master_data",
  },
  {
    href: "/admin/pengguna",
    label: "Kelola Admin",
    icon: "ShieldCheck",
    permissionKey: "manage_admins",
  },
  {
    href: "/admin/laporan",
    label: "Laporan",
    icon: "BarChart3",
    permissionKey: "view_reports",
  },
  {
    href: "/admin/audit",
    label: "Log Aktivitas",
    icon: "History",
    permissionKey: "view_audit_log",
  },
  {
    href: "/admin/pengaturan",
    label: "Pengaturan",
    icon: "Settings",
    permissionKey: "manage_settings",
  },
]

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
}

export const LOAN_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Lunas",
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const

export const BANK_OPTIONS = ["Mandiri"] as const

export const CREW_DEFAULTS = [
  "Regu 1",
  "Regu 2",
  "Regu 3",
  "Non-Regu",
  "Secwan",
] as const
