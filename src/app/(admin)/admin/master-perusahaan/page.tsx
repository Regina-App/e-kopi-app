'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  MapPin,
  Briefcase,
  Users2,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface MasterItem {
  id: string
  name: string
  company_id?: string | null
  is_active?: boolean
  created_at?: string
}

type EntityType = 'companies' | 'sites' | 'departments' | 'positions' | 'crews'

export default function MasterPerusahaanPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('companies')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // State master data
  const [companies, setCompanies] = useState<MasterItem[]>([])
  const [sites, setSites] = useState<MasterItem[]>([])
  const [departments, setDepartments] = useState<MasterItem[]>([])
  const [positions, setPositions] = useState<MasterItem[]>([])
  const [crews, setCrews] = useState<MasterItem[]>([])

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<MasterItem | null>(null)
  const [formName, setFormName] = useState('')
  const [formCompanyId, setFormCompanyId] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch all master data from API
  const fetchMasterData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/master?all=true')
      const json = await res.json()
      if (json.success) {
        setCompanies(json.companies || [])
        setSites(json.sites || [])
        setDepartments(json.departments || [])
        setPositions(json.positions || [])
        setCrews(json.crews || [])
      } else {
        toast.error('Gagal memuat master data: ' + json.error)
      }
    } catch {
      toast.error('Gagal terhubung ke server master data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMasterData()
  }, [])

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditItem(null)
    setFormName('')
    setFormCompanyId(companies[0]?.id || '')
    setFormIsActive(true)
    setModalOpen(true)
  }

  // Handle open edit modal
  const handleOpenEdit = (item: MasterItem) => {
    setEditItem(item)
    setFormName(item.name)
    setFormCompanyId(item.company_id || companies[0]?.id || '')
    setFormIsActive(item.is_active ?? true)
    setModalOpen(true)
  }

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Nama wajib diisi!')
      return
    }

    setIsSaving(true)
    try {
      if (editItem) {
        // UPDATE
        const res = await fetch('/api/master', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: activeTab,
            id: editItem.id,
            data: {
              name: formName.trim(),
              is_active: formIsActive,
              ...(activeTab === 'sites' ? { company_id: formCompanyId } : {}),
            },
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Data berhasil diperbarui!')
          setModalOpen(false)
          fetchMasterData()
        } else {
          toast.error(json.error || 'Gagal memperbarui data')
        }
      } else {
        // CREATE
        const res = await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: activeTab,
            data: {
              name: formName.trim(),
              is_active: formIsActive,
              ...(activeTab === 'sites' ? { company_id: formCompanyId } : {}),
            },
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Data baru berhasil ditambahkan!')
          setModalOpen(false)
          fetchMasterData()
        } else {
          toast.error(json.error || 'Gagal menambahkan data')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return

    try {
      const res = await fetch(`/api/master?entity=${activeTab}&id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`"${name}" berhasil dihapus`)
        fetchMasterData()
      } else {
        toast.error(json.error || 'Gagal menghapus data')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  // Get current list based on active tab
  const getCurrentList = (): MasterItem[] => {
    let list: MasterItem[] = []
    switch (activeTab) {
      case 'companies':
        list = companies
        break
      case 'sites':
        list = sites
        break
      case 'departments':
        list = departments
        break
      case 'positions':
        list = positions
        break
      case 'crews':
        list = crews
        break
    }
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((i) => i.name.toLowerCase().includes(q))
  }

  const getEntityTitle = () => {
    switch (activeTab) {
      case 'companies':
        return 'Perusahaan'
      case 'sites':
        return 'Site / Lokasi Kerja'
      case 'departments':
        return 'Departemen'
      case 'positions':
        return 'Jabatan'
      case 'crews':
        return 'Nama Regu (Shift/Crew)'
    }
  }

  const list = getCurrentList()

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-blue-500/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Master Organization Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Master Perusahaan & Organisasi
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Kelola data Perusahaan, Site, Departemen, Jabatan, dan Nama Regu yang akan dipilih karyawan secara dinamis saat mendaftar akun E-KOPI.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMasterData}
            disabled={loading}
            className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah {getEntityTitle()}
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-200/80 shadow-md rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as EntityType)
              setSearch('')
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1.5 bg-slate-200/70 rounded-2xl gap-1">
              <TabsTrigger
                value="companies"
                className="py-2.5 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Building className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Perusahaan ({companies.length})
              </TabsTrigger>
              <TabsTrigger
                value="sites"
                className="py-2.5 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm cursor-pointer"
              >
                <MapPin className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Site ({sites.length})
              </TabsTrigger>
              <TabsTrigger
                value="departments"
                className="py-2.5 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Briefcase className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Departemen ({departments.length})
              </TabsTrigger>
              <TabsTrigger
                value="positions"
                className="py-2.5 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Users2 className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Jabatan ({positions.length})
              </TabsTrigger>
              <TabsTrigger
                value="crews"
                className="col-span-2 sm:col-span-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-1.5 hidden sm:inline" />
                Nama Regu ({crews.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari nama ${getEntityTitle().toLowerCase()}...`}
                className="pl-10 h-10 rounded-xl border-slate-200 text-slate-900 bg-white"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Menampilkan {list.length} data
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-semibold">Memuat master data...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {search ? 'Pencarian Tidak Ditemukan' : `Belum Ada Data ${getEntityTitle()}`}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                {search
                  ? 'Tidak ada nama yang cocok dengan kata kunci pencarian.'
                  : `Tabel ${getEntityTitle()} masih kosong. Klik tombol di bawah untuk menambahkan data pertama.`}
              </p>
              {!search && (
                <Button
                  onClick={handleOpenAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah {getEntityTitle()} Sekarang
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 text-xs uppercase font-extrabold tracking-wider">
                    <th className="py-3.5 px-6 w-12 text-center">No</th>
                    <th className="py-3.5 px-6">Nama {getEntityTitle()}</th>
                    {activeTab === 'sites' && <th className="py-3.5 px-6">Perusahaan Induk</th>}
                    <th className="py-3.5 px-6 w-32 text-center">Status</th>
                    <th className="py-3.5 px-6 w-36 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {list.map((item, index) => {
                    const companyName =
                      activeTab === 'sites'
                        ? companies.find((c) => c.id === item.company_id)?.name || 'Semua Perusahaan'
                        : null

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="py-4 px-6 text-center font-bold text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {item.name}
                        </td>
                        {activeTab === 'sites' && (
                          <td className="py-4 px-6 text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              <Building className="w-3.5 h-3.5 text-blue-600" />
                              {companyName}
                            </span>
                          </td>
                        )}
                        <td className="py-4 px-6 text-center">
                          {item.is_active ?? true ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-bold text-xs px-2.5 py-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 font-medium text-xs">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Nonaktif
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="h-8 px-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold active:scale-95 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="h-8 px-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 font-bold active:scale-95 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Add / Edit */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200"
            >
              <h3 className="text-xl font-black text-slate-900 mb-1">
                {editItem ? `Edit ${getEntityTitle()}` : `Tambah ${getEntityTitle()} Baru`}
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Pastikan nama yang dimasukkan sesuai dengan struktur operasional perusahaan.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama {getEntityTitle()} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={`Contoh: ${
                      activeTab === 'companies'
                        ? 'PT E-KOPI Nusantara'
                        : activeTab === 'sites'
                        ? 'Site Kebun A (Malang)'
                        : activeTab === 'departments'
                        ? 'Operasional & Produksi'
                        : activeTab === 'positions'
                        ? 'Supervisor Lapangan'
                        : 'Regu 1 (Alpha)'
                    }`}
                    className="h-11 rounded-xl text-slate-900 border-slate-300 focus:ring-blue-500"
                  />
                </div>

                {activeTab === 'sites' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Pilih Perusahaan Induk
                    </label>
                    <select
                      value={formCompanyId}
                      onChange={(e) => setFormCompanyId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Berlaku untuk Semua Perusahaan --</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="isActiveToggle" className="text-sm font-semibold text-slate-800 cursor-pointer">
                    Status Aktif (Dapat dipilih oleh karyawan baru saat registrasi)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    disabled={isSaving}
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 cursor-pointer shadow-md"
                  >
                    {isSaving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Sekarang'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
