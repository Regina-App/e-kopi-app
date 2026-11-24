'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Briefcase,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
  CalendarDays,
  Wallet,
  Phone,
  Mail,
  User,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatCurrency } from '@/lib/utils'

interface MasterItem {
  id: string
  name: string
}

interface EmployeeItem {
  id: string
  nik: string
  full_name: string
  birth_place?: string | null
  birth_date?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  company_id?: string | null
  site_id?: string | null
  department_id?: string | null
  position_id?: string | null
  is_crew_member?: boolean
  crew_id?: string | null
  start_date: string
  bank_name?: string | null
  account_number?: string | null
  account_holder?: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_active: boolean
  company?: { id: string; name: string } | null
  site?: { id: string; name: string } | null
  department?: { id: string; name: string } | null
  position?: { id: string; name: string } | null
  crew?: { id: string; name: string } | null
}

export default function AdminKaryawanPage() {
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')

  // Master Data
  const [companies, setCompanies] = useState<MasterItem[]>([])
  const [sites, setSites] = useState<MasterItem[]>([])
  const [departments, setDepartments] = useState<MasterItem[]>([])
  const [positions, setPositions] = useState<MasterItem[]>([])
  const [crews, setCrews] = useState<MasterItem[]>([])

  // Bulk selection on current page (max 10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null)
  const [detailLeaveBalance, setDetailLeaveBalance] = useState<any>(null)
  const [detailLoanInfo, setDetailLoanInfo] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create / Edit Modal State
  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<EmployeeItem>>({
    nik: '',
    full_name: '',
    email: '',
    phone: '',
    birth_place: '',
    birth_date: '',
    address: '',
    start_date: '2025-01-01',
    bank_name: 'Mandiri',
    account_number: '',
    account_holder: '',
    company_id: '',
    site_id: '',
    department_id: '',
    position_id: '',
    crew_id: '',
    is_crew_member: false,
    status: 'approved',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add Quota Modal State
  const [quotaOpen, setQuotaOpen] = useState(false)
  const [targetQuotaEmpId, setTargetQuotaEmpId] = useState<string | null>(null)
  const [quotaYear, setQuotaYear] = useState(2025)
  const [quotaAmount, setQuotaAmount] = useState('12')
  const [quotaDescription, setQuotaDescription] = useState('')
  const [quotaSubmitting, setQuotaSubmitting] = useState(false)

  // Delete Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [targetDeleteEmp, setTargetDeleteEmp] = useState<EmployeeItem | null>(null)

  // Import Excel State
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    failed: number
    duplicates: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load master data once
  useEffect(() => {
    fetch('/api/master')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCompanies(d.companies || [])
          setSites(d.sites || [])
          setDepartments(d.departments || [])
          setPositions(d.positions || [])
          setCrews(d.crews || [])
        }
      })
      .catch(() => {})
  }, [])

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: searchQuery,
        status: statusFilter,
        company_id: companyFilter,
      })

      const res = await fetch(`/api/admin/employees?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setEmployees(data.employees || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('[AdminKaryawanPage] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, statusFilter, companyFilter])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Select all on current page (max 10)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(employees.map((e) => e.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const isAllSelected = employees.length > 0 && selectedIds.length === employees.length

  // Open Detail
  const handleOpenDetail = async (emp: EmployeeItem) => {
    setSelectedEmployee(emp)
    setDetailLeaveBalance(null)
    setDetailLoanInfo(null)
    setDetailOpen(true)
    setDetailLoading(true)

    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedEmployee(data.employee)
        setDetailLeaveBalance(data.leave_balance)
        setDetailLoanInfo(data.loan_info)
      }
    } catch (e) {
      console.warn('Error loading employee detail:', e)
    } finally {
      setDetailLoading(false)
    }
  }

  // Open Create Form
  const handleOpenCreate = () => {
    setIsEditing(false)
    setFormData({
      nik: '',
      full_name: '',
      email: '',
      phone: '',
      birth_place: '',
      birth_date: '',
      address: '',
      start_date: new Date().toISOString().split('T')[0],
      bank_name: 'Mandiri',
      account_number: '',
      account_holder: '',
      company_id: companies[0]?.id || '',
      site_id: sites[0]?.id || '',
      department_id: departments[0]?.id || '',
      position_id: positions[0]?.id || '',
      crew_id: '',
      is_crew_member: false,
      status: 'approved',
    })
    setFormError(null)
    setFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (emp: EmployeeItem) => {
    setIsEditing(true)
    setFormData({
      ...emp,
      company_id: emp.company_id || '',
      site_id: emp.site_id || '',
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      crew_id: emp.crew_id || '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  // Submit Create or Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.nik || !formData.full_name || !formData.start_date) {
      setFormError('NIK, Nama Lengkap, dan Tanggal Mulai Kerja wajib diisi.')
      return
    }

    if (!/^\d{16}$/.test(formData.nik.trim())) {
      setFormError('NIK harus berupa 16 digit angka.')
      return
    }

    setFormSubmitting(true)

    try {
      const url = isEditing
        ? `/api/admin/employees/${formData.id}`
        : '/api/admin/employees'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal menyimpan data karyawan.')
        setFormSubmitting(false)
        return
      }

      setFormOpen(false)
      fetchEmployees()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi gangguan sistem.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Submit Quota
  const handleAddQuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetQuotaEmpId) return

    setQuotaSubmitting(true)
    try {
      const res = await fetch(`/api/admin/employees/${targetQuotaEmpId}/quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: quotaYear,
          amount: Number(quotaAmount),
          description: quotaDescription || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setQuotaOpen(false)
        setQuotaDescription('')
        if (selectedEmployee && selectedEmployee.id === targetQuotaEmpId) {
          handleOpenDetail(selectedEmployee)
        }
      } else {
        alert(data.error || 'Gagal menambahkan kuota cuti.')
      }
    } catch {
      alert('Terjadi kesalahan sistem.')
    } finally {
      setQuotaSubmitting(false)
    }
  }

  // Delete Employee (Soft Delete)
  const handleDeleteEmployee = async () => {
    if (!targetDeleteEmp) return
    try {
      const res = await fetch(`/api/admin/employees/${targetDeleteEmp.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setDeleteConfirmOpen(false)
        setTargetDeleteEmp(null)
        setDetailOpen(false)
        fetchEmployees()
      } else {
        alert(data.error || 'Gagal menghapus karyawan.')
      }
    } catch {
      alert('Terjadi kesalahan sistem saat menghapus.')
    }
  }

  // Bulk Approve
  const handleBulkApprove = async () => {
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/employees/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
      }
      setSelectedIds([])
      fetchEmployees()
    } catch {
      alert('Terjadi kesalahan saat persetujuan massal.')
    }
  }

  // Bulk Add Quota trigger
  const handleBulkAddQuota = () => {
    if (selectedIds.length === 0) return
    const firstId = selectedIds[0]
    setTargetQuotaEmpId(firstId)
    setQuotaOpen(true)
  }

  // Import Excel Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    setImportLoading(true)
    setImportProgress(25)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      setImportProgress(50)
      const res = await fetch('/api/admin/employees/import', {
        method: 'POST',
        body: formData,
      })

      setImportProgress(90)
      const data = await res.json()

      setImportProgress(100)
      setImportResult({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        failed: data.failed || 0,
        duplicates: data.duplicates || 0,
        errors: data.errors || [],
      })

      if (data.imported > 0) {
        fetchEmployees()
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses file import.')
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Database Karyawan"
        description="Kelola data induk kepegawaian, kuota cuti tahunan, dan import massal Excel"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Users className="w-3.5 h-3.5" />
            <span>{total} Total Pegawai</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportResult(null)
                setImportFile(null)
                setImportOpen(true)
              }}
              className="h-9 gap-1.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari NIK, Nama, Email, atau ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="w-44">
            <Select
              value={companyFilter}
              onValueChange={(val) => {
                setCompanyFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs">
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

          <div className="w-40">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="approved">Aktif (Approved)</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {selectedIds.length} dipilih
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkApprove}
              className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Setujui Dipilih</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkAddQuota}
              className="h-8 text-xs text-blue-700 border-blue-300 hover:bg-blue-50 gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Tambah Kuota</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Pilih 10 baris di halaman ini"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold">NIK</TableHead>
                <TableHead className="text-xs font-semibold">Nama Lengkap</TableHead>
                <TableHead className="text-xs font-semibold">Perusahaan</TableHead>
                <TableHead className="text-xs font-semibold">Site</TableHead>
                <TableHead className="text-xs font-semibold">Departemen</TableHead>
                <TableHead className="text-xs font-semibold">Jabatan</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <EmptyState
                      title="Belum ada data karyawan"
                      description="Tambahkan karyawan baru atau unggah file Excel untuk memulai."
                      icon={Users}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const isChecked = selectedIds.includes(emp.id)

                  return (
                    <TableRow key={emp.id} className={isChecked ? 'bg-blue-50/40' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => handleSelectOne(emp.id, Boolean(checked))}
                          aria-label={`Pilih ${emp.full_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">
                        {emp.nik}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">{emp.full_name}</div>
                        <div className="text-[11px] text-slate-400">{emp.email || '-'}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {emp.company?.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {emp.site?.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {emp.department?.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {emp.position?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={emp.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => handleOpenDetail(emp)} className="gap-2">
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>Lihat Detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(emp)} className="gap-2">
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Profil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetQuotaEmpId(emp.id)
                                setQuotaOpen(true)
                              }}
                              className="gap-2"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Tambah Kuota Cuti</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetDeleteEmp(emp)
                                setDeleteConfirmOpen(true)
                              }}
                              className="gap-2 text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus / Nonaktifkan</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={10}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold">
                {selectedEmployee?.full_name}
              </DialogTitle>
              {selectedEmployee && <StatusBadge status={selectedEmployee.status} />}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Profil lengkap pegawai, kuota cuti tahun berjalan, dan data pinjaman
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 py-2 text-xs">
              {/* Profile grid */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">NIK:</span>
                  <span className="font-mono font-semibold">{selectedEmployee.nik}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email & HP:</span>
                  <span>{selectedEmployee.email || '-'} / {selectedEmployee.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Perusahaan / Site:</span>
                  <span>{selectedEmployee.company?.name || '-'} ({selectedEmployee.site?.name || '-'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Departemen / Jabatan:</span>
                  <span>{selectedEmployee.department?.name || '-'} - {selectedEmployee.position?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Regu Kerja:</span>
                  <span>{selectedEmployee.crew?.name || 'Non-Regu'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mulai Kerja:</span>
                  <span className="font-medium">{selectedEmployee.start_date}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Rekening Bank:</span>
                  <span>
                    {selectedEmployee.bank_name || 'Mandiri'} - {selectedEmployee.account_number || '-'} a.n.{' '}
                    {selectedEmployee.account_holder || selectedEmployee.full_name}
                  </span>
                </div>
              </div>

              {/* Leave Balance Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span>Hak Cuti Tahunan ({quotaYear})</span>
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTargetQuotaEmpId(selectedEmployee.id)
                      setQuotaOpen(true)
                    }}
                    className="h-7 text-xs text-blue-600 border-blue-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span>Tambah Kuota</span>
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Total Jatah</span>
                    <span className="font-bold text-sm text-blue-700">
                      {detailLeaveBalance?.total ?? 12} Hari
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Tersedia</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {detailLeaveBalance?.available ?? 12} Hari
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Terpakai</span>
                    <span className="font-bold text-sm text-slate-700">
                      {detailLeaveBalance?.used ?? 0} Hari
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Menunggu</span>
                    <span className="font-bold text-sm text-amber-700">
                      {detailLeaveBalance?.reserved ?? 0} Hari
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Summary Box */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  <span>Pinjaman Koperasi Berjalan</span>
                </h4>

                {detailLoanInfo ? (
                  <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg grid grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nominal:</span>
                      <span className="font-bold text-xs">{formatCurrency(detailLoanInfo.loan_amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Angsuran:</span>
                      <span className="font-bold text-xs text-purple-700">
                        {formatCurrency(detailLoanInfo.installment_per_month)}/bln
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sisa Kewajiban:</span>
                      <span className="font-bold text-xs text-rose-600">
                        {formatCurrency(detailLoanInfo.remaining_obligation)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-center">
                    Tidak ada pinjaman koperasi yang sedang aktif.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedEmployee && handleOpenEdit(selectedEmployee)}
                className="text-xs gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Karyawan</span>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="text-xs">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isEditing ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lengkapi informasi identitas pegawai, penempatan kerja, dan rekening bank
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2 text-xs">
            {/* Row 1: NIK & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">NIK (16 Digit)*</Label>
                <Input
                  maxLength={16}
                  disabled={isEditing}
                  placeholder="3201012304900001"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className="font-mono text-xs h-9"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Lengkap*</Label>
                <Input
                  placeholder="Nama sesuai KTP"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email</Label>
                <Input
                  type="email"
                  placeholder="karyawan@ekopi.id"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nomor Telepon / WhatsApp</Label>
                <Input
                  placeholder="081234567890"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Row 3: Start Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tanggal Mulai Kerja*</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status Karyawan</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aktif (Approved)</SelectItem>
                    <SelectItem value="pending">Menunggu Persetujuan</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Company & Site */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Perusahaan</Label>
                <Select
                  value={formData.company_id || ''}
                  onValueChange={(val) => setFormData({ ...formData, company_id: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Perusahaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Site / Lokasi</Label>
                <Select
                  value={formData.site_id || ''}
                  onValueChange={(val) => setFormData({ ...formData, site_id: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Dept & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departemen</Label>
                <Select
                  value={formData.department_id || ''}
                  onValueChange={(val) => setFormData({ ...formData, department_id: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Jabatan</Label>
                <Select
                  value={formData.position_id || ''}
                  onValueChange={(val) => setFormData({ ...formData, position_id: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 6: Bank & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Bank</Label>
                <Input
                  value={formData.bank_name || 'Mandiri'}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nomor Rekening</Label>
                <Input
                  placeholder="1440012345678"
                  value={formData.account_number || ''}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={formSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                {formSubmitting ? 'Menyimpan...' : 'Simpan Karyawan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Leave Quota Modal */}
      <Dialog open={quotaOpen} onOpenChange={setQuotaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Tambah Kuota Cuti Tahunan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jatah kuota cuti akan dialokasikan ke buku besar cuti pegawai
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddQuotaSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tahun Berlaku</Label>
              <Select
                value={String(quotaYear)}
                onValueChange={(val) => setQuotaYear(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Jumlah Hari Kuota</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Keterangan / Alasan</Label>
              <Input
                placeholder="Contoh: Alokasi tahunan reguler / Bonus kuota"
                value={quotaDescription}
                onChange={(e) => setQuotaDescription(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuotaOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={quotaSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                {quotaSubmitting ? 'Menyimpan...' : 'Tambahkan Kuota'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Nonaktifkan Karyawan?"
        description={`Karyawan "${targetDeleteEmp?.full_name}" (${targetDeleteEmp?.nik}) akan dinonaktifkan (soft delete). Sesi login akan dicabut.`}
        confirmText="Ya, Hapus/Nonaktifkan"
        variant="destructive"
        onConfirm={handleDeleteEmployee}
      />

      {/* Import Excel Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Import Data Karyawan (Excel)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Unggah file Excel (.xlsx) untuk menambahkan data pegawai secara massal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Step 1: Download template */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Unduh Format Template</div>
                <div className="text-[11px] text-slate-500">Gunakan kolom yang telah disediakan agar valid</div>
              </div>
              <a href="/api/admin/employees/template" download>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-300">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xlsx</span>
                </Button>
              </a>
            </div>

            {/* Step 2: Dropzone */}
            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setImportFile(f)
                  }}
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-semibold text-slate-800">
                  {importFile ? importFile.name : 'Klik untuk memilih file Excel'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Hanya mendukung format .xlsx (Maks 10MB)
                </div>
              </div>

              {/* Progress Bar */}
              {importLoading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Sedang memproses dan memvalidasi...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              {/* Results Display */}
              {importResult && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hasil Import:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded font-semibold">
                      {importResult.imported} Berhasil
                    </div>
                    <div className="p-2 bg-slate-100 text-slate-700 rounded font-semibold">
                      {importResult.skipped} Dilewati
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-800 rounded font-semibold">
                      {importResult.duplicates} Duplikat
                    </div>
                    <div className="p-2 bg-rose-50 text-rose-800 rounded font-semibold">
                      {importResult.failed} Gagal
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] max-h-28 overflow-y-auto space-y-1">
                      <div className="font-semibold">Catatan Kesalahan:</div>
                      {importResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportOpen(false)}
                  className="text-xs"
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!importFile || importLoading}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importLoading ? 'Mengimpor...' : 'Mulai Import'}</span>
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
