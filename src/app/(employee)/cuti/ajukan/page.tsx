'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import {
  CalendarDays,
  CalendarCheck,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  X,
  User,
  Building2,
  MapPin,
  Briefcase,
  Users,
  PhoneCall,
  FileText,
  ChevronRight,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  Calendar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface LeaveBalance {
  total: number
  used: number
  reserved: number
  available: number
}

interface EmployeeInfo {
  id: string
  nik: string
  full_name: string
  phone?: string | null
  company_name?: string | null
  site_name?: string | null
  department_name?: string | null
  position_name?: string | null
  crew_name?: string | null
}

function PengajuanCutiContent() {
  const router = useRouter()

  // State
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [hasPending, setHasPending] = useState<boolean>(false)
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Form State
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [reason, setReason] = useState<string>('')
  const [emergencyContact, setEmergencyContact] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

  // Fetch balance, employee info, and pending status
  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        setIsLoading(true)

        // 1. Fetch balance
        const balanceRes = await fetch('/api/leave/balance')
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json()
          if (isMounted && balanceData.balance) {
            setBalance(balanceData.balance)
          }
        }

        // 2. Fetch employee profile
        const profileRes = await fetch('/api/employees/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          if (isMounted && profileData.employee) {
            setEmployee(profileData.employee)
          }
        }

        // 3. Check pending leave request
        const pendingRes = await fetch('/api/leave/request?status=pending&limit=1')
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          if (isMounted && pendingData.requests && pendingData.requests.length > 0) {
            setHasPending(true)
            setPendingRequestId(pendingData.requests[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching cuti data:', err)
        toast.error('Gagal memuat data kuota cuti')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  // Date selection handlers
  const handleSelectDates = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([])
      return
    }

    // Sort dates chronologically
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
    setSelectedDates(sorted)
  }

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates((prev) =>
      prev.filter(
        (d) =>
          format(d, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
      )
    )
  }

  // Today at midnight for disabling past dates
  const [today, setToday] = useState<Date | null>(null)
  const [currentYear, setCurrentYear] = useState<number>(2026)

  useEffect(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setToday(t)
    setCurrentYear(new Date().getFullYear())
  }, [])

  const requestedDays = selectedDates.length
  const availableQuota = balance?.available ?? 0
  const balanceAfter = availableQuota - requestedDays
  const isBalanceZero = availableQuota <= 0

  // Validation
  const validateForm = () => {
    if (hasPending) {
      toast.error('Anda memiliki pengajuan cuti yang masih menunggu persetujuan')
      return false
    }

    if (isBalanceZero) {
      toast.error('Saldo cuti Anda saat ini 0. Hubungi admin untuk penyesuaian kuota.')
      return false
    }

    if (selectedDates.length === 0) {
      toast.error('Pilih minimal 1 tanggal cuti pada kalender')
      return false
    }

    if (selectedDates.length > availableQuota) {
      toast.error(
        `Jumlah hari yang dipilih (${selectedDates.length} hari) melebihi sisa kuota Anda (${availableQuota} hari)`
      )
      return false
    }

    if (reason.trim().length < 10) {
      toast.error('Alasan cuti wajib diisi minimal 10 karakter')
      return false
    }

    if (emergencyContact.trim().length < 10) {
      toast.error('Nomor kontak darurat wajib diisi minimal 10 karakter')
      return false
    }

    return true
  }

  const handleOpenConfirm = () => {
    if (validateForm()) {
      setShowConfirmModal(true)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const formattedDates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'))

      const res = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_dates: formattedDates,
          reason: reason.trim(),
          emergency_contact: emergencyContact.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengajukan cuti')
      }

      toast.success('Pengajuan cuti berhasil diajukan!')
      setShowConfirmModal(false)
      router.push('/cuti/riwayat')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            Pengajuan Cuti Tahunan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Formulir resmi permohonan cuti tahunan pegawai PT E-KOPI
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/cuti/riwayat')}
          className="self-start sm:self-auto text-xs sm:text-sm text-slate-600 hover:text-blue-600 gap-1.5"
        >
          Riwayat Pengajuan
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Leave Balance Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                  Informasi Saldo Cuti
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Tahun Periode {currentYear}
                </h3>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl">
                <CalendarIcon className="h-5 w-5 text-blue-200" />
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Kuota */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium block">Total Kuota</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isLoading ? '...' : balance?.total ?? 0}
                </span>
                <span className="text-xs text-slate-500">hari</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Alokasi tahunan</span>
            </div>

            {/* Digunakan */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium block">Digunakan</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {isLoading ? '...' : balance?.used ?? 0}
                </span>
                <span className="text-xs text-slate-500">hari</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Cuti disetujui</span>
            </div>

            {/* Reserved */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium block">Reserved</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {isLoading ? '...' : balance?.reserved ?? 0}
                </span>
                <span className="text-xs text-slate-500">hari</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Sedang diproses</span>
            </div>

            {/* Sisa Tersedia */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold block">
                Sisa Tersedia
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {isLoading ? '...' : balance?.available ?? 0}
                </span>
                <span className="text-xs text-blue-600/80 font-medium">hari</span>
              </div>
              <span className="text-[11px] text-blue-600/70 mt-1 block">Dapat diajukan</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lock State: Balance 0 */}
      {isBalanceZero && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 flex items-start gap-3.5 shadow-xs"
        >
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60 shrink-0">
            <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base">Pengajuan Cuti Terkunci</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Saldo cuti Anda saat ini 0. Hubungi admin untuk informasi lebih lanjut mengenai penyesuaian kuota cuti Anda.
            </p>
          </div>
        </motion.div>
      )}

      {/* Pending State Notice */}
      {hasPending && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 shrink-0">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Pengajuan Cuti Masih Berjalan</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                Anda memiliki pengajuan cuti yang masih menunggu persetujuan. Anda tidak dapat membuat pengajuan baru hingga pengajuan sebelumnya diproses.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/cuti/riwayat')}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-auto"
          >
            Lihat Status
          </Button>
        </motion.div>
      )}

      {/* Auto-populated Employee Data Section (Read-only) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <User className="h-4 w-4 text-blue-600" />
              Data Pemohon Cuti
            </CardTitle>
            <CardDescription className="text-xs">
              Informasi kepegawaian terisi otomatis dari data profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5" /> NIK Pegawai
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block tracking-wide">
                {employee?.nik || '-'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5" /> Nama Lengkap
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {employee?.full_name || '-'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Building2 className="h-3.5 w-3.5" /> Perusahaan
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {employee?.company_name || 'PT E-KOPI Sukses Makmur'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5" /> Lokasi / Site
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {employee?.site_name || 'Head Office - Jakarta'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Briefcase className="h-3.5 w-3.5" /> Departemen &amp; Jabatan
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {employee?.department_name || 'Operasional'} &bull; {employee?.position_name || 'Staff'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Users className="h-3.5 w-3.5" /> Regu Kerja
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {employee?.crew_name || 'Non-Regu (Office)'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {/* Step 1: Multi-date Calendar Picker */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Pilih Tanggal Cuti
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Klik tanggal pada kalender untuk memilih atau membatalkan pilihan. Anda dapat memilih beberapa hari sekaligus.
                </CardDescription>
              </div>
              <Badge
                variant={requestedDays > 0 ? 'default' : 'outline'}
                className="text-xs font-semibold px-2.5 py-1"
              >
                {requestedDays} Hari Dipilih
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Calendar Component */}
              <div className="w-full lg:w-auto shrink-0 flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleSelectDates}
                  disabled={today ? { before: today } : undefined}
                  locale={idLocale}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto shadow-xs"
                />
              </div>

              {/* Selected Dates Display */}
              <div className="w-full flex-1 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Daftar Tanggal yang Dipilih:
                  </span>
                  {selectedDates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDates([])}
                      className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                {selectedDates.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <CalendarDays className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Belum ada tanggal cuti yang dipilih</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilih satu atau beberapa tanggal pada kalender di sebelah kiri
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                      {selectedDates.map((date) => (
                        <motion.span
                          key={date.toISOString()}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                        >
                          <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                          {format(date, 'EEEE, dd MMM yyyy', { locale: idLocale })}
                          <button
                            type="button"
                            onClick={() => removeDate(date)}
                            className="ml-1 text-blue-400 hover:text-red-600 transition-colors cursor-pointer rounded-xs p-0.5"
                            aria-label="Hapus tanggal"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.span>
                      ))}
                    </div>

                    <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 p-3 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Total Durasi Pengajuan:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                        {requestedDays} Hari Kerja
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Reason and Emergency Contact */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Alasan &amp; Kontak Darurat
            </CardTitle>
            <CardDescription className="text-xs">
              Lengkapi alasan permohonan cuti dan nomor yang dapat dihubungi selama cuti
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Alasan Cuti */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason" className="text-sm font-semibold flex items-center gap-1">
                  Alasan Cuti <span className="text-red-500">*</span>
                </Label>
                <span
                  className={`text-xs ${
                    reason.trim().length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {reason.trim().length}/10 karakter minimal
                </span>
              </div>
              <Textarea
                id="reason"
                placeholder="Jelaskan keperluan atau alasan pengajuan cuti secara jelas (minimal 10 karakter)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isBalanceZero || hasPending}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Nomor Kontak Darurat */}
            <div className="space-y-1.5">
              <Label htmlFor="emergency" className="text-sm font-semibold flex items-center gap-1">
                <PhoneCall className="h-4 w-4 text-blue-600" />
                Nomor Kontak Darurat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emergency"
                type="tel"
                placeholder="Contoh: 081234567890 (Keluarga / Kerabat)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={isBalanceZero || hasPending}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wajib diisi nomor kerabat atau keluarga yang dapat dihubungi oleh perusahaan saat terjadi keadaan darurat selama Anda menjalani cuti.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Summary Before Submit */}
        {requestedDays > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-blue-200 bg-blue-50/40 dark:bg-slate-900 dark:border-blue-900/50 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Ringkasan Pengajuan Cuti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Total Hari Diajukan</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {requestedDays} Hari
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Sisa Saldo Setelah Cuti</span>
                    <span
                      className={`text-lg font-bold ${
                        balanceAfter < 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {balanceAfter} Hari
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Kontak Darurat</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {emergencyContact.trim() || '-'}
                    </span>
                  </div>
                </div>

                {balanceAfter < 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Peringatan: Jumlah hari melebihi sisa cuti Anda saat ini.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/cuti/riwayat')}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleOpenConfirm}
            disabled={
              isBalanceZero ||
              hasPending ||
              requestedDays === 0 ||
              requestedDays > availableQuota ||
              reason.trim().length < 10 ||
              emergencyContact.trim().length < 10 ||
              isSubmitting
            }
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirimkan Pengajuan...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Ajukan Cuti Tahunan
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              Konfirmasi Pengajuan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pastikan seluruh rincian permohonan cuti Anda telah benar sebelum diajukan ke admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pemohon:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee?.full_name} ({employee?.nik})
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Durasi:</span>
                <span className="font-bold text-blue-600">{requestedDays} Hari</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Kontak Darurat:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {emergencyContact}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Tanggal Cuti:
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                {selectedDates.map((d) => (
                  <div
                    key={d.toISOString()}
                    className="flex items-center gap-2 text-slate-700 dark:text-slate-300 py-0.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>{format(d, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Alasan:</span>{' '}
              {reason}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setShowConfirmModal(false)}
            >
              Periksa Kembali
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Kirim Pengajuan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PengajuanCutiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm">Memuat formulir pengajuan cuti...</p>
          </div>
        </div>
      }
    >
      <PengajuanCutiContent />
    </Suspense>
  )
}
