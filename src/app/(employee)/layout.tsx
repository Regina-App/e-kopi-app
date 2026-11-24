'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Landmark,
  UserCircle,
  Bell,
  Info,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cuti', label: 'Cuti', icon: CalendarDays },
  { href: '/koperasi', label: 'Koperasi', icon: Landmark },
  { href: '/profil', label: 'Profil', icon: UserCircle },
]

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar (lg:flex) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white border-r border-slate-200 z-50">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
          <div>
            <div className="font-bold text-blue-600 text-base leading-tight">E-KOPI</div>
            <div className="text-[11px] text-slate-400 font-medium">By Regina - Employee</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <Link
              href="/tentang"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/tentang'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Info className={`w-5 h-5 ${pathname === '/tentang' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Tentang</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Top Header */}
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="E-KOPI Logo"
            width={28}
            height={28}
            className="rounded-md object-contain"
          />
          <span className="text-sm font-bold text-blue-600 tracking-tight">E-KOPI</span>
        </div>
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 pb-24 lg:pb-12 px-4 min-h-screen bg-slate-50">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
