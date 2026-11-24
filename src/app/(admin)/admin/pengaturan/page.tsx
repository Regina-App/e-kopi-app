'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Building,
  Database,
  Calendar,
  Wallet,
  ImageIcon,
  Save,
  Plus,
  Trash2,
  Edit2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { formatRupiah } from '@/lib/utils'

interface MasterItem {
  id: string
  name: string
  company_id?: string | null
  is_active: boolean
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    'identitas' | 'perusahaan' | 'master' | 'cuti' | 'koperasi' | 'aset'
  >('identitas')
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<
    'companies' | 'sites' | 'departments' | 'positions' | 'crews'
  >('companies')

  // Global settings state
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [settings, setSettings] = useState<Record<string, any>>({
    app_name: 'E-KOPI By Regina - App',
    app_description: 'Sistem Terpadu Pengajuan Cuti & Pinjaman Koperasi Karyawan',
    app_version: '1.0.0',
    app_developer: 'Regina - App',
    company_name: 'PT REGINA PRIMA NUSANTARA',
    company_address: 'Kawasan Operasional E-KOPI, Jl. Industri Makmur No. 88, Indonesia',
    company_email: 'admin@ekopi.app',
    company_phone: '+62 21 8899 0011',
    default_leave_quota: 12,
    min_work_duration_months: 12,
    leave_accumulation_enabled: true,
    interest_rate: 0.025,
    max_loan_amount: 10000000,
    max_tenor: 4,
    loan_period_start: 8,
    loan_period_end: 28,
    loan_deduction_day: 5,
    first_time_borrower_rule:
      'Peminjam baru untuk pertama kali wajib menyerahkan salinan KTP dan slip gaji asli ke kantor operasional.',
    logo_url: '/images/logo.png',
    letterhead_url: null,
    donation_qr_url: null,
  })

  // Master data state
  const [masterData, setMasterData] = useState<{
    companies: MasterItem[]
    sites: MasterItem[]
    departments: MasterItem[]
    positions: MasterItem[]
    crews: MasterItem[]
  }>({
    companies: [],
    sites: [],
    departments: [],
    positions: [],
    crews: [],
  })

  // Modal state for Master Data
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalCompanyId, setModalCompanyId] = useState('')
  const [modalSubmitting, setModalSubmitting] = useState(false)

  // Uploading state
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  // Fetch settings & master data on load
  const loadSettingsAndMaster = async () => {
    setLoading(true)
    try {
      const [settingsRes, masterRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/master?all=true'),
      ])

      const settingsJson = await settingsRes.json()
      if (settingsJson.success) {
        setSettings((prev) => ({ ...prev, ...settingsJson.settings }))
      }

      const masterJson = await masterRes.json()
      if (masterJson.success) {
        setMasterData({
          companies: masterJson.companies || [],
          sites: masterJson.sites || [],
          departments: masterJson.departments || [],
          positions: masterJson.positions || [],
          crews: masterJson.crews || [],
        })
      }
    } catch (err) {
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettingsAndMaster()
  }, [])

  // Save current settings tab
  const handleSaveSettings = async (keysToSave?: string[]) => {
    setSaving(true)
    const toastId = toast.loading('Menyimpan perubahan pengaturan...')
    try {
      const payload: Record<string, any> = {}
      if (keysToSave) {
        keysToSave.forEach((k) => {
          payload[k] = settings[k]
        })
      } else {
        Object.assign(payload, settings)
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Pengaturan berhasil diperbarui!', { id: toastId })
        if (json.settings) setSettings(json.settings)
      } else {
        toast.error(json.error || 'Gagal menyimpan pengaturan', { id: toastId })
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan pengaturan', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  // Handle Asset Upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: 'logo_url' | 'letterhead_url' | 'donation_qr_url',
    type: string
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(fieldKey)
    const toastId = toast.loading('Mengunggah gambar aset...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success && json.url) {
        setSettings((prev) => ({ ...prev, [fieldKey]: json.url }))
        // Auto-save this setting to backend
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [fieldKey]: json.url }),
        })
        toast.success('Aset berhasil diunggah & disimpan!', { id: toastId })
      } else {
        toast.error(json.error || 'Gagal mengunggah berkas', { id: toastId })
      }
    } catch (err) {
      toast.error('Gagal mengunggah gambar', { id: toastId })
    } finally {
      setUploadingField(null)
      e.target.value = ''
    }
  }

  // Remove Asset
  const handleRemoveAsset = async (fieldKey: 'logo_url' | 'letterhead_url' | 'donation_qr_url') => {
    setSettings((prev) => ({ ...prev, [fieldKey]: null }))
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [fieldKey]: null }),
    })
    toast.success('Aset berhasil dihapus')
  }

  // Master Data Add/Edit/Delete Handlers
  const openAddModal = () => {
    setEditingItem(null)
    setModalName('')
    setModalCompanyId(masterData.companies[0]?.id || '')
    setIsModalOpen(true)
  }

  const openEditModal = (item: MasterItem) => {
    setEditingItem(item)
    setModalName(item.name)
    setModalCompanyId(item.company_id || masterData.companies[0]?.id || '')
    setIsModalOpen(true)
  }

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalName.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }

    setModalSubmitting(true)
    try {
      if (editingItem) {
        // PUT
        const res = await fetch('/api/master', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: activeMasterSubTab,
            id: editingItem.id,
            data: {
              name: modalName.trim(),
              company_id: activeMasterSubTab === 'sites' ? modalCompanyId : undefined,
            },
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Data berhasil diperbarui')
          setIsModalOpen(false)
          loadSettingsAndMaster()
        } else {
          toast.error(json.error || 'Gagal memperbarui data')
        }
      } else {
        // POST
        const res = await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: activeMasterSubTab,
            data: {
              name: modalName.trim(),
              company_id: activeMasterSubTab === 'sites' ? modalCompanyId : undefined,
              is_active: true,
            },
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Data baru berhasil ditambahkan')
          setIsModalOpen(false)
          loadSettingsAndMaster()
        } else {
          toast.error(json.error || 'Gagal menambahkan data')
        }
      }
    } catch {
      toast.error('Gagal menyimpan master data')
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: MasterItem) => {
    try {
      const updatedStatus = !item.is_active
      const res = await fetch('/api/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: activeMasterSubTab,
          id: item.id,
          data: { is_active: updatedStatus },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Status ${item.name} berhasil diubah`)
        loadSettingsAndMaster()
      } else {
        toast.error(json.error || 'Gagal mengubah status')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleDeleteItem = async (item: MasterItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${item.name}"?`)) return

    try {
      const res = await fetch(`/api/master?entity=${activeMasterSubTab}&id=${item.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`"${item.name}" berhasil dihapus`)
        loadSettingsAndMaster()
      } else {
        toast.error(json.error || 'Gagal menghapus data')
      }
    } catch {
      toast.error('Gagal menghapus data master')
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan</h1>
            <p className="text-sm text-slate-500">
              Konfigurasi parameter operasional, identitas aplikasi, master data, kuota cuti &amp; koperasi
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-lg px-2 pt-2 shadow-xs gap-1">
        {[
          { key: 'identitas', label: 'Identitas', icon: Settings },
          { key: 'perusahaan', label: 'Perusahaan', icon: Building },
          { key: 'master', label: 'Master Data', icon: Database },
          { key: 'cuti', label: 'Cuti', icon: Calendar },
          { key: 'koperasi', label: 'Koperasi', icon: Wallet },
          { key: 'aset', label: 'Aset', icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-md'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 1. IDENTITAS TAB */}
      {activeTab === 'identitas' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900">Identitas Aplikasi</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ubah judul, deskripsi, dan metadata yang ditampilkan pada aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  value={settings.app_name || ''}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Versi Sistem</label>
                <input
                  type="text"
                  value={settings.app_version || ''}
                  onChange={(e) => setSettings({ ...settings, app_version: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deskripsi Aplikasi
                </label>
                <textarea
                  rows={3}
                  value={settings.app_description || ''}
                  onChange={(e) => setSettings({ ...settings, app_description: e.target.value })}
                  className="w-full p-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pengembang</label>
                <input
                  type="text"
                  value={settings.app_developer || ''}
                  onChange={(e) => setSettings({ ...settings, app_developer: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() =>
                  handleSaveSettings(['app_name', 'app_version', 'app_description', 'app_developer'])
                }
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Identitas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. PERUSAHAAN TAB */}
      {activeTab === 'perusahaan' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900">Profil &amp; Kop Perusahaan</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Informasi resmi perusahaan untuk kop surat, kwitansi, dan dokumen resmi sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={settings.company_name || ''}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Perusahaan / HRD
                </label>
                <input
                  type="email"
                  value={settings.company_email || ''}
                  onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">No. Telepon / Hotline</label>
                <input
                  type="text"
                  value={settings.company_phone || ''}
                  onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Lengkap Perusahaan
                </label>
                <textarea
                  rows={2}
                  value={settings.company_address || ''}
                  onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                  className="w-full p-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() =>
                  handleSaveSettings([
                    'company_name',
                    'company_email',
                    'company_phone',
                    'company_address',
                  ])
                }
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Profil Perusahaan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. MASTER DATA TAB */}
      {activeTab === 'master' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Pengelolaan Master Data</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Data referensi struktur organisasi: Perusahaan, Site, Departemen, Jabatan, dan Regu
                </CardDescription>
              </div>
              <Button onClick={openAddModal} size="sm" className="bg-blue-700 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Baru
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-4">
              {[
                { key: 'companies', label: 'Perusahaan' },
                { key: 'sites', label: 'Site / Lokasi' },
                { key: 'departments', label: 'Departemen' },
                { key: 'positions', label: 'Jabatan' },
                { key: 'crews', label: 'Regu Kerja' },
              ].map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setActiveMasterSubTab(sub.key as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeMasterSubTab === sub.key
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label} ({masterData[sub.key as keyof typeof masterData]?.length || 0})
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">NO</th>
                    <th className="py-2.5 px-3">NAMA</th>
                    {activeMasterSubTab === 'sites' && <th className="py-2.5 px-3">PERUSAHAAN</th>}
                    <th className="py-2.5 px-3 text-center w-28">STATUS</th>
                    <th className="py-2.5 px-3 text-center w-28">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {masterData[activeMasterSubTab]?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada data master pada kategori ini.
                      </td>
                    </tr>
                  ) : (
                    masterData[activeMasterSubTab]?.map((item, idx) => {
                      const comp =
                        activeMasterSubTab === 'sites'
                          ? masterData.companies.find((c) => c.id === item.company_id)
                          : null

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                          {activeMasterSubTab === 'sites' && (
                            <td className="py-2.5 px-3 text-slate-600">{comp?.name || '-'}</td>
                          )}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                item.is_active
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(item)}
                                className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. CUTI TAB */}
      {activeTab === 'cuti' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900">
              Pengaturan &amp; Kebijakan Cuti
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Konfigurasi jatah kuota tahunan dan syarat kelayakan masa kerja
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Kuota Cuti Tahunan (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.default_leave_quota || 12}
                  onChange={(e) =>
                    setSettings({ ...settings, default_leave_quota: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Alokasi kuota standar yang diberikan kepada karyawan setiap tahun kalender baru
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Masa Kerja Minimal Hak Cuti (Bulan)
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={settings.min_work_duration_months || 12}
                  onChange={(e) =>
                    setSettings({ ...settings, min_work_duration_months: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Masa kerja minimum sebelum karyawan berhak mengajukan cuti tahunan (default: 12 bulan)
                </p>
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Akumulasi Sisa Cuti ke Tahun Berikutnya
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Jika diaktifkan, sisa kuota yang belum terpakai pada akhir tahun akan ditambahkan ke saldo tahun berikutnya
                  </div>
                </div>
                <Switch
                  checked={Boolean(settings.leave_accumulation_enabled)}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, leave_accumulation_enabled: checked })
                  }
                />
              </div>
            </div>

            {/* Balance Management Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                <strong>Catatan Manajemen Saldo Cuti:</strong> Penyesuaian kuota cuti individual dapat dilakukan langsung melalui menu <strong>Database Karyawan &rarr; Rincian Pegawai &rarr; Sesuaikan Saldo</strong>. Setiap perubahan saldo akan dicatat dalam buku besar cuti (leave_balance_ledger).
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() =>
                  handleSaveSettings([
                    'default_leave_quota',
                    'min_work_duration_months',
                    'leave_accumulation_enabled',
                  ])
                }
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Kebijakan Cuti
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. KOPERASI TAB */}
      {activeTab === 'koperasi' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900">
              Pengaturan Pinjaman Koperasi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Parameter suku bunga flat, limit pinjaman, tenor, dan jadwal pemotongan gaji
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Warning Banner */}
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Peringatan Kebijakan:</strong> Perubahan suku bunga, limit, atau tenor di bawah ini{' '}
                <strong>tidak mempengaruhi kontrak pinjaman yang sudah berjalan</strong>. Perubahan hanya berlaku untuk pengajuan pinjaman baru yang disetujui setelah tanggal penyimpanan.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Suku Bunga per Bulan (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={20}
                    value={(settings.interest_rate || 0.025) * 100}
                    onChange={(e) =>
                      setSettings({ ...settings, interest_rate: Number(e.target.value) / 100 })
                    }
                    className="w-full h-10 px-3 pr-8 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Default flat: 2.5% per bulan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Maksimal Plafon Pinjaman (Rp)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={settings.max_loan_amount || 10000000}
                  onChange={(e) =>
                    setSettings({ ...settings, max_loan_amount: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  {formatRupiah(settings.max_loan_amount || 10000000)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Maksimal Tenor Pinjaman (Bulan)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.max_tenor || 4}
                  onChange={(e) => setSettings({ ...settings, max_tenor: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default maksimal: 4 bulan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Periode Pengajuan: Tanggal Mulai
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.loan_period_start || 8}
                  onChange={(e) =>
                    setSettings({ ...settings, loan_period_start: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Setiap tanggal 8 tiap bulan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Periode Pengajuan: Tanggal Akhir
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.loan_period_end || 28}
                  onChange={(e) =>
                    setSettings({ ...settings, loan_period_end: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Setiap tanggal 28 tiap bulan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Pemotongan Angsuran Gaji
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={settings.loan_deduction_day || 5}
                  onChange={(e) =>
                    setSettings({ ...settings, loan_deduction_day: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dipotong setiap tanggal 5</p>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Syarat &amp; Ketentuan Peminjam Baru (First-Time Borrower)
                </label>
                <textarea
                  rows={3}
                  value={settings.first_time_borrower_rule || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, first_time_borrower_rule: e.target.value })
                  }
                  className="w-full p-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() =>
                  handleSaveSettings([
                    'interest_rate',
                    'max_loan_amount',
                    'max_tenor',
                    'loan_period_start',
                    'loan_period_end',
                    'loan_deduction_day',
                    'first_time_borrower_rule',
                  ])
                }
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Simpan Konfigurasi Koperasi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. ASET TAB */}
      {activeTab === 'aset' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base font-bold text-slate-900">
              Pengelolaan Berkas &amp; Aset Gambar
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Unggah logo aplikasi, gambar kop surat resmi, dan QR Code donasi/pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Asset 1: Logo */}
              <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Logo Aplikasi
                </div>
                <div className="w-32 h-32 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-4 p-2 shadow-xs">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Logo App"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="w-full flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logo_url', 'logo')}
                      disabled={uploadingField === 'logo_url'}
                    />
                    <div className="w-full text-center py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold cursor-pointer">
                      {uploadingField === 'logo_url' ? 'Mengunggah...' : 'Unggah Logo'}
                    </div>
                  </label>
                  {settings.logo_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAsset('logo_url')}
                      className="text-rose-600 hover:bg-rose-50 border-slate-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Asset 2: Letterhead / Kop Surat */}
              <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Kop Surat Resmi (Banner)
                </div>
                <div className="w-full h-32 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-4 p-2 shadow-xs">
                  {settings.letterhead_url ? (
                    <img
                      src={settings.letterhead_url}
                      alt="Kop Surat"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      Belum ada kop surat
                    </div>
                  )}
                </div>

                <div className="w-full flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'letterhead_url', 'letterhead')}
                      disabled={uploadingField === 'letterhead_url'}
                    />
                    <div className="w-full text-center py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold cursor-pointer">
                      {uploadingField === 'letterhead_url' ? 'Mengunggah...' : 'Unggah Kop Surat'}
                    </div>
                  </label>
                  {settings.letterhead_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAsset('letterhead_url')}
                      className="text-rose-600 hover:bg-rose-50 border-slate-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Asset 3: QR Code Donasi */}
              <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  QR Code Donasi / Kas
                </div>
                <div className="w-32 h-32 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-4 p-2 shadow-xs">
                  {settings.donation_qr_url ? (
                    <img
                      src={settings.donation_qr_url}
                      alt="QR Code"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="w-full flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'donation_qr_url', 'qr_code')}
                      disabled={uploadingField === 'donation_qr_url'}
                    />
                    <div className="w-full text-center py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold cursor-pointer">
                      {uploadingField === 'donation_qr_url' ? 'Mengunggah...' : 'Unggah QR Code'}
                    </div>
                  </label>
                  {settings.donation_qr_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAsset('donation_qr_url')}
                      className="text-rose-600 hover:bg-rose-50 border-slate-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL ADD / EDIT MASTER DATA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingItem ? 'Edit Data Master' : 'Tambah Data Master Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleModalSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama {activeMasterSubTab.slice(0, -1)}
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Masukkan nama..."
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {activeMasterSubTab === 'sites' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Perusahaan Terkait
                  </label>
                  <select
                    value={modalCompanyId}
                    onChange={(e) => setModalCompanyId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  >
                    {masterData.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={modalSubmitting} className="bg-blue-700 hover:bg-blue-800">
                  {modalSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
