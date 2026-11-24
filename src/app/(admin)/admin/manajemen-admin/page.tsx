'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Plus,
  KeyRound,
  Lock,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Check,
  X,
  Sliders,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

export interface AdminPermissionDef {
  key: string
  label: string
  description: string
}

export const ADMIN_PERMISSION_DEFS: AdminPermissionDef[] = [
  { key: 'dashboard', label: 'Dashboard Utama', description: 'Akses ringkasan statistik & analitik operasional' },
  { key: 'pengajuan_cuti', label: 'Persetujuan Cuti', description: 'Meninjau, menyetujui, dan menolak permohonan cuti' },
  { key: 'pengajuan_koperasi', label: 'Persetujuan Pinjaman', description: 'Meninjau dan menyetujui permohonan pinjaman koperasi' },
  { key: 'riwayat', label: 'Riwayat Transaksi', description: 'Melihat seluruh catatan transaksi cuti dan pinjaman' },
  { key: 'database_karyawan', label: 'Database Karyawan', description: 'Menambah, mengubah, dan mengelola data pegawai' },
  { key: 'kuota_cuti', label: 'Kelola Kuota Cuti', description: 'Mengatur jatah dan penyesuaian kuota cuti tahunan' },
  { key: 'import_export', label: 'Import & Export Excel', description: 'Mengimpor pegawai dan mengekspor data transaksi' },
  { key: 'laporan', label: 'Laporan Rekapitulasi', description: 'Melihat laporan dan rekap keuangan koperasi' },
  { key: 'pengaturan_koperasi', label: 'Pengaturan Koperasi', description: 'Mengatur bunga, tenor, dan batas pinjaman' },
  { key: 'master_perusahaan', label: 'Kelola Master Data', description: 'Mengelola perusahaan, site, departemen, dan regu' },
  { key: 'pengaturan_surat', label: 'Template Surat', description: 'Konfigurasi surat izin cuti dan perjanjian pinjaman' },
  { key: 'email', label: 'Pengaturan Email / Notifikasi', description: 'Mengatur template notifikasi dan persetujuan via email' },
  { key: 'audit_log', label: 'Audit Log Aktivitas', description: 'Memantau jejak audit seluruh tindakan pengguna' },
  { key: 'manajemen_admin', label: 'Manajemen Administrator', description: 'Mengelola akun admin lain dan mengatur hak akses' },
]

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin'
  is_active: boolean
  force_pin_change: boolean
  permissions: Record<string, boolean>
  permissions_count: number
  created_at: string
}

export default function AdminManajemenAdminPage() {
  const [currentSessionAdmin, setCurrentSessionAdmin] = useState<{ id: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState<AdminUser[]>([])

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    pin: '',
    role: 'admin' as 'admin' | 'super_admin',
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // PIN Reset Modal
  const [pinResetOpen, setPinResetOpen] = useState(false)
  const [pinResetAdmin, setPinResetAdmin] = useState<AdminUser | null>(null)
  const [newPin, setNewPin] = useState('')
  const [pinResetLoading, setPinResetLoading] = useState(false)
  const [pinResetError, setPinResetError] = useState<string | null>(null)

  // Permissions Modal
  const [permsOpen, setPermsOpen] = useState(false)
  const [permsAdmin, setPermsAdmin] = useState<AdminUser | null>(null)
  const [permsState, setPermsState] = useState<Record<string, boolean>>({})
  const [permsLoading, setPermsLoading] = useState(false)

  // Delete Confirm
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null)

  // Fetch session & admin list
  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Session check
      const sessionRes = await fetch('/api/admin/auth/session')
      const sessionData = await sessionRes.json()
      if (sessionData?.admin) {
        setCurrentSessionAdmin(sessionData.admin)
      }

      // 2. Admins list
      const res = await fetch('/api/admin/admins')
      const data = await res.json()
      if (data.success) {
        setAdmins(data.admins || [])
      }
    } catch (err) {
      console.error('[ManajemenAdminPage] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  // Handle Create Admin
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    if (!createData.name || !createData.email || !createData.pin) {
      setCreateError('Semua kolom wajib diisi.')
      return
    }

    if (!/^\d{4}$/.test(createData.pin.trim())) {
      setCreateError('PIN harus tepat 4 digit angka.')
      return
    }

    setCreateLoading(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCreateError(data.error || 'Gagal menambahkan admin.')
        setCreateLoading(false)
        return
      }

      setCreateOpen(false)
      setCreateData({ name: '', email: '', pin: '', role: 'admin' })
      fetchAdmins()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Terjadi gangguan sistem.')
    } finally {
      setCreateLoading(false)
    }
  }

  // Handle Edit Admin
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    setEditLoading(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAdmin.name,
          email: editingAdmin.email,
          role: editingAdmin.role,
          is_active: editingAdmin.is_active,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setEditError(data.error || 'Gagal memperbarui admin.')
        setEditLoading(false)
        return
      }

      setEditOpen(false)
      fetchAdmins()
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Terjadi gangguan sistem.')
    } finally {
      setEditLoading(false)
    }
  }

  // Handle PIN Reset
  const handlePinResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinResetAdmin) return

    if (!/^\d{4}$/.test(newPin.trim())) {
      setPinResetError('PIN baru harus tepat 4 digit angka.')
      return
    }

    setPinResetLoading(true)
    setPinResetError(null)

    try {
      const res = await fetch(`/api/admin/admins/${pinResetAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin.trim() }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setPinResetError(data.error || 'Gagal me-reset PIN.')
        setPinResetLoading(false)
        return
      }

      setPinResetOpen(false)
      setNewPin('')
      alert(`PIN untuk ${pinResetAdmin.name} berhasil di-reset menjadi "${newPin.trim()}". Admin akan diminta mengubah PIN pada login berikutnya.`)
      fetchAdmins()
    } catch (err: unknown) {
      setPinResetError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.')
    } finally {
      setPinResetLoading(false)
    }
  }

  // Open Permissions Dialog
  const handleOpenPermissions = (adm: AdminUser) => {
    setPermsAdmin(adm)
    // Preload current permissions
    const state: Record<string, boolean> = {}
    ADMIN_PERMISSION_DEFS.forEach((p) => {
      state[p.key] = adm.role === 'super_admin' ? true : Boolean(adm.permissions?.[p.key])
    })
    setPermsState(state)
    setPermsOpen(true)
  }

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!permsAdmin) return

    setPermsLoading(true)
    try {
      const res = await fetch(`/api/admin/admins/${permsAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permsState }),
      })

      const data = await res.json()
      if (data.success) {
        setPermsOpen(false)
        fetchAdmins()
      } else {
        alert(data.error || 'Gagal memperbarui izin.')
      }
    } catch {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setPermsLoading(false)
    }
  }

  // Toggle active status directly
  const handleToggleActive = async (adm: AdminUser) => {
    if (currentSessionAdmin?.id === adm.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.')
      return
    }

    try {
      const nextActive = !adm.is_active
      const res = await fetch(`/api/admin/admins/${adm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      const data = await res.json()
      if (data.success) {
        fetchAdmins()
      } else {
        alert(data.error || 'Gagal memperbarui status aktif.')
      }
    } catch {
      alert('Terjadi kesalahan sistem.')
    }
  }

  // Delete Admin
  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return

    if (currentSessionAdmin?.id === deletingAdmin.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.')
      return
    }

    try {
      const res = await fetch(`/api/admin/admins/${deletingAdmin.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setDeleteOpen(false)
        setDeletingAdmin(null)
        fetchAdmins()
      } else {
        alert(data.error || 'Gagal menghapus administrator.')
      }
    } catch {
      alert('Terjadi kesalahan sistem.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Manajemen Administrator"
        description="Kelola akun pengelola sistem, hak akses 14 modul, dan reset PIN keamanan (Khusus Super Admin)"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Restricted</span>
          </div>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setCreateError(null)
              setCreateOpen(true)
            }}
            className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Administrator</span>
          </Button>
        }
      />

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold">Nama Administrator</TableHead>
                <TableHead className="text-xs font-semibold">Email Login</TableHead>
                <TableHead className="text-xs font-semibold">Peran / Role</TableHead>
                <TableHead className="text-xs font-semibold text-center">Status Akun</TableHead>
                <TableHead className="text-xs font-semibold text-center">Hak Akses Modul</TableHead>
                <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="Tidak ada administrator"
                      description="Belum ada data administrator lain."
                      icon={Shield}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((adm) => {
                  const isSuperAdmin = adm.role === 'super_admin'
                  const isSelf = currentSessionAdmin?.id === adm.id

                  return (
                    <TableRow key={adm.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {adm.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{adm.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-normal">
                                  Anda
                                </span>
                              )}
                            </div>
                            {adm.force_pin_change && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                • Wajib ganti PIN pada login
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {adm.email}
                      </TableCell>
                      <TableCell>
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            <Shield className="w-3 h-3" /> Administrator
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-2">
                          <Switch
                            checked={adm.is_active}
                            disabled={isSelf}
                            onCheckedChange={() => handleToggleActive(adm)}
                          />
                          <span className="text-[11px] font-medium text-slate-600">
                            {adm.is_active ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPermissions(adm)}
                          className="h-7 px-2.5 text-xs text-slate-700 gap-1.5 border-slate-200"
                        >
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {isSuperAdmin ? '14 / 14 (Semua)' : `${adm.permissions_count} / 14 Izin`}
                          </span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAdmin({ ...adm })
                              setEditError(null)
                              setEditOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                            title="Edit Akun"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPinResetAdmin(adm)
                              setNewPin('')
                              setPinResetError(null)
                              setPinResetOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Reset PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSelf}
                            onClick={() => {
                              setDeletingAdmin(adm)
                              setDeleteOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30"
                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Admin'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Tambah Administrator Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat akun admin baru dengan PIN awal 4 digit
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama Lengkap*</Label>
              <Input
                placeholder="Contoh: Budi HR Admin"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Administrator*</Label>
              <Input
                type="email"
                placeholder="budi@ekopi.id"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">PIN Keamanan Awal (4 Digit)*</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={createData.pin}
                onChange={(e) =>
                  setCreateData({ ...createData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                className="font-mono text-center tracking-widest text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tingkatan Hak Akses (Role)</Label>
              <Select
                value={createData.role}
                onValueChange={(val: any) => setCreateData({ ...createData, role: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator Biasa (Izin Disesuaikan)</SelectItem>
                  <SelectItem value="super_admin">Super Admin (Akses Penuh Semua Modul)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createLoading}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                {createLoading ? 'Menyimpan...' : 'Buat Administrator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Akun Administrator</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui nama, email, dan peran administrator
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {editingAdmin && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Lengkap</Label>
                <Input
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email</Label>
                <Input
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Peran (Role)</Label>
                <Select
                  value={editingAdmin.role}
                  onValueChange={(val: any) => setEditingAdmin({ ...editingAdmin, role: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator Biasa</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Status Akun Aktif</div>
                  <div className="text-[11px] text-slate-500">Non-aktifkan untuk mencabut akses login</div>
                </div>
                <Switch
                  checked={editingAdmin.is_active}
                  onCheckedChange={(val) => setEditingAdmin({ ...editingAdmin, is_active: val })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={pinResetOpen} onOpenChange={setPinResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              <span>Reset PIN Administrator</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan 4 digit PIN baru untuk {pinResetAdmin?.name}. Admin akan diwajibkan mengubah PIN saat login pertama.
            </DialogDescription>
          </DialogHeader>

          {pinResetError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{pinResetError}</span>
            </div>
          )}

          <form onSubmit={handlePinResetSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">PIN Baru (4 Digit Angka)*</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="font-mono text-center tracking-widest text-sm h-10"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPinResetOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={pinResetLoading}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white"
              >
                {pinResetLoading ? 'Menyimpan...' : 'Reset PIN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog (14 Permissions) */}
      <Dialog open={permsOpen} onOpenChange={setPermsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold">
                Hak Akses Modul: {permsAdmin?.name}
              </DialogTitle>
              {permsAdmin?.role === 'super_admin' ? (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Super Admin (Akses Penuh)
                </span>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<string, boolean> = {}
                      ADMIN_PERMISSION_DEFS.forEach((p) => (all[p.key] = true))
                      setPermsState(all)
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setPermsState({})}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Atur hak akses secara spesifik untuk masing-masing dari 14 fitur sistem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            {ADMIN_PERMISSION_DEFS.map((perm) => {
              const isChecked = permsAdmin?.role === 'super_admin' ? true : Boolean(permsState[perm.key])

              return (
                <div
                  key={perm.key}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between bg-slate-50/50"
                >
                  <div className="space-y-0.5 pr-4">
                    <div className="font-semibold text-slate-800">{perm.label}</div>
                    <div className="text-[11px] text-slate-500">{perm.description}</div>
                  </div>
                  <Switch
                    checked={isChecked}
                    disabled={permsAdmin?.role === 'super_admin'}
                    onCheckedChange={(val) => setPermsState({ ...permsState, [perm.key]: val })}
                  />
                </div>
              )
            })}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPermsOpen(false)}
              className="text-xs"
            >
              Tutup
            </Button>
            {permsAdmin?.role !== 'super_admin' && (
              <Button
                type="button"
                size="sm"
                disabled={permsLoading}
                onClick={handleSavePermissions}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                {permsLoading ? 'Menyimpan...' : 'Simpan Izin Akses'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus / Nonaktifkan Administrator?"
        description={`Akun "${deletingAdmin?.name}" (${deletingAdmin?.email}) akan dinonaktifkan dan hak aksesnya dicabut.`}
        confirmText="Ya, Hapus Admin"
        variant="destructive"
        onConfirm={handleDeleteAdmin}
      />
    </div>
  )
}
