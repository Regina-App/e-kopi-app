'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarCheck,
  Landmark,
  History,
  Users,
  Shield,
  Building2,
  FileBarChart,
  ScrollText,
  Settings,
  Menu,
  X,
  Search,
  LogOut,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/master-perusahaan', label: 'Master Perusahaan', icon: Building2 },
  { href: '/admin/pengajuan-cuti', label: 'Pengajuan Cuti', icon: CalendarCheck },
  { href: '/admin/pengajuan-koperasi', label: 'Pengajuan Koperasi', icon: Landmark },
  { href: '/admin/riwayat', label: 'Riwayat', icon: History },
  { href: '/admin/karyawan', label: 'Database Karyawan', icon: Users },
  { href: '/admin/laporan', label: 'Laporan (Excel & PDF)', icon: FileBarChart },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: Settings },
  { href: '/admin/manajemen-admin', label: 'Manajemen Admin', icon: Shield },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  // Fetch admin session
  useEffect(() => {
    if (isLoginPage) return

    fetch('/api/admin/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.admin) {
          setAdminUser(data.admin)
        } else {
          router.push('/admin/login')
        }
      })
      .catch(() => {
        router.push('/admin/login')
      })
  }, [pathname, isLoginPage, router])

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isLoginPage) {
    return <>{children}</>
  }

  const activeNavItem = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))
  )

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleConfirmLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
    } finally {
      setLoggingOut(false)
      setShowLogoutConfirm(false)
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#0f172a] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-sm tracking-wider">
              EK
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                PANEL ADMIN
              </div>
              <div className="text-[11px] text-slate-400 font-medium">E-KOPI By Regina</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800/60">
              v1.0
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
              aria-label="Tutup sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))

            // Hide manajemen-admin if not super_admin
            if (item.href === '/admin/manajemen-admin' && adminUser && adminUser.role !== 'super_admin') {
              return null
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400 font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom User & Logout Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-sm font-semibold text-white truncate">
                {adminUser?.name || 'Administrator'}
              </div>
              <span className="inline-block mt-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Keluar"
              aria-label="Keluar"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-white border-b border-slate-200 z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-slate-400 hidden sm:inline">Admin</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-800">
              {activeNavItem?.label || 'Dashboard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-blue-100">
              {adminUser?.name ? adminUser.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-xs">
              <div className="font-semibold text-slate-700 leading-tight">{adminUser?.name || 'Administrator'}</div>
              <div className="text-[10px] text-slate-400">{adminUser?.email || ''}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 p-6 min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Konfirmasi Keluar Sesi Admin"
        description="Apakah Anda yakin ingin mengakhiri sesi dan keluar dari Panel Administrator PT E-KOPI?"
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
        variant="destructive"
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}
