'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  User,
  Briefcase,
  CreditCard,
  FileCheck,
  Calendar,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react'

import {
  registerEmployeeSchema,
  type RegisterEmployeeInput,
} from '@/lib/validators'
import {
  formatNIK,
  formatDate,
  calculateWorkDuration,
} from '@/lib/utils'
import { BANK_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ButtonSpinner } from '@/components/ui/loading'

interface MasterItem {
  id: string
  name: string
  company_id?: string | null
}

const STEPS = [
  { id: 1, title: 'Data Pribadi', icon: User, desc: 'Identitas diri' },
  { id: 2, title: 'Pekerjaan', icon: Briefcase, desc: 'Unit & divisi' },
  { id: 3, title: 'Rekening', icon: CreditCard, desc: 'Gaji & koperasi' },
  { id: 4, title: 'Konfirmasi', icon: FileCheck, desc: 'Tinjau data' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [direction, setDirection] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false)

  // Master Data State
  const [companies, setCompanies] = useState<MasterItem[]>([])
  const [sites, setSites] = useState<MasterItem[]>([])
  const [departments, setDepartments] = useState<MasterItem[]>([])
  const [positions, setPositions] = useState<MasterItem[]>([])
  const [crews, setCrews] = useState<MasterItem[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterEmployeeInput>({
    resolver: zodResolver(registerEmployeeSchema),
    mode: 'onTouched',
    defaultValues: {
      nik: '',
      full_name: '',
      birth_place: '',
      birth_date: '',
      address: '',
      email: '',
      phone: '',
      company_id: '',
      site_id: '',
      department_id: '',
      position_id: '',
      is_crew_member: false,
      crew_id: null,
      start_date: '',
      bank_name: 'Mandiri',
      account_number: '',
      account_holder: '',
    },
  })

  // Watch form fields
  const watchedValues = watch()
  const watchedStartDate = watch('start_date')
  const watchedIsCrewMember = watch('is_crew_member')
  const watchedCompanyId = watch('company_id')
  const watchedNIK = watch('nik')

  // Fetch Master Data
  useEffect(() => {
    async function loadMasterData() {
      try {
        const res = await fetch('/api/master')
        const data = await res.json()
        if (data.success) {
          setCompanies(data.companies || [])
          setSites(data.sites || [])
          setDepartments(data.departments || [])
          setPositions(data.positions || [])
          setCrews(data.crews || [])

          // Set default select values if not set
          if (data.companies?.[0]) setValue('company_id', data.companies[0].id)
          if (data.sites?.[0]) setValue('site_id', data.sites[0].id)
          if (data.departments?.[0]) setValue('department_id', data.departments[0].id)
          if (data.positions?.[0]) setValue('position_id', data.positions[0].id)
        }
      } catch (err) {
        console.error('Failed to load master data:', err)
      }
    }
    loadMasterData()
  }, [setValue])

  // Filter sites based on selected company
  const availableSites = useMemo(() => {
    if (!watchedCompanyId) return sites
    const filtered = sites.filter((s) => !s.company_id || s.company_id === watchedCompanyId)
    return filtered.length > 0 ? filtered : sites
  }, [sites, watchedCompanyId])

  // Real-time work duration calculation
  const workDuration = useMemo(() => {
    if (!watchedStartDate) return null
    return calculateWorkDuration(watchedStartDate)
  }, [watchedStartDate])

  // Step field lists for validation
  const stepFields: Record<number, (keyof RegisterEmployeeInput)[]> = {
    1: ['nik', 'full_name', 'birth_place', 'birth_date', 'address', 'email', 'phone'],
    2: ['company_id', 'site_id', 'department_id', 'position_id', 'start_date'],
    3: ['bank_name', 'account_number', 'account_holder'],
    4: [],
  }

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep]
    const isValid = await trigger(fieldsToValidate)

    if (!isValid) {
      toast.error('Harap lengkapi semua bidang yang wajib diisi dengan benar.')
      return
    }

    if (currentStep < 4) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Final Form Submission
  const onSubmit = async (data: RegisterEmployeeInput) => {
    if (!agreementChecked) {
      toast.error('Anda harus menyetujui pernyataan keabsahan data terlebih dahulu.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/employees/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Pendaftaran gagal diproses.')
        setIsSubmitting(false)
        return
      }

      toast.success(
        'Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi oleh Administrator.'
      )

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      toast.error(msg)
      setIsSubmitting(false)
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 30 : -30,
      opacity: 0,
    }),
  }

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Pendaftaran Pegawai Baru</span>
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          </h1>
          <p className="text-xs text-slate-300">
            Lengkapi 4 langkah data pegawai untuk mendaftar akun E-KOPI
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="my-6">
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                      : 'bg-white/10 text-slate-400 border border-white/10'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="mt-2 hidden sm:block">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: '25%' }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Multi-Step Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence custom={direction} mode="wait">
          {/* STEP 1: DATA PRIBADI */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 mb-4">
                <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Langkah 1: Informasi Data Pribadi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pastikan data sesuai dengan KTP elektronik yang sah.
                </p>
              </div>

              {/* NIK */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="nik" className="text-xs text-slate-200">
                    Nomor Induk Kependudukan (NIK 16 Digit) *
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    {watchedNIK?.replace(/\s+/g, '').length || 0} / 16
                  </span>
                </div>
                <Input
                  id="nik"
                  maxLength={19}
                  placeholder="3201 1234 5678 0001"
                  value={formatNIK(watchedNIK || '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 16)
                    setValue('nik', clean, { shouldValidate: true })
                  }}
                  className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                />
                {errors.nik && (
                  <p className="text-xs text-red-400">{errors.nik.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs text-slate-200">
                  Nama Lengkap (Sesuai KTP) *
                </Label>
                <Input
                  id="full_name"
                  placeholder="Contoh: Budi Santoso"
                  {...register('full_name')}
                  className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                />
                {errors.full_name && (
                  <p className="text-xs text-red-400">{errors.full_name.message}</p>
                )}
              </div>

              {/* Birth Place & Birth Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="birth_place" className="text-xs text-slate-200">
                    Tempat Lahir *
                  </Label>
                  <Input
                    id="birth_place"
                    placeholder="Contoh: Bandung"
                    {...register('birth_place')}
                    className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                  />
                  {errors.birth_place && (
                    <p className="text-xs text-red-400">{errors.birth_place.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birth_date" className="text-xs text-slate-200">
                    Tanggal Lahir *
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register('birth_date')}
                    className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                  />
                  {errors.birth_date && (
                    <p className="text-xs text-red-400">{errors.birth_date.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs text-slate-200">
                  Alamat Lengkap Tempat Tinggal *
                </Label>
                <textarea
                  id="address"
                  rows={2}
                  placeholder="Jl. Raya Kopi No. 12, RT 01/RW 04, Kelurahan..."
                  {...register('address')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.address && (
                  <p className="text-xs text-red-400">{errors.address.message}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-slate-200">
                    Alamat Email Aktif *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@perusahaan.com"
                    {...register('email')}
                    className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-slate-200">
                    Nomor WhatsApp / HP Aktif *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="081234567890"
                    {...register('phone')}
                    className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DATA PEKERJAAN */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 mb-4">
                <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Langkah 2: Data Pekerjaan & Penugasan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih perusahaan, site penempatan, dan tanggal mulai bekerja.
                </p>
              </div>

              {/* Perusahaan & Site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Perusahaan *</Label>
                  <Controller
                    name="company_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20">
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
                    )}
                  />
                  {errors.company_id && (
                    <p className="text-xs text-red-400">{errors.company_id.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Site Penempatan *</Label>
                  <Controller
                    name="site_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20">
                          <SelectValue placeholder="Pilih Site" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSites.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.site_id && (
                    <p className="text-xs text-red-400">{errors.site_id.message}</p>
                  )}
                </div>
              </div>

              {/* Departemen & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Departemen *</Label>
                  <Controller
                    name="department_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20">
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
                    )}
                  />
                  {errors.department_id && (
                    <p className="text-xs text-red-400">{errors.department_id.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-200">Jabatan *</Label>
                  <Controller
                    name="position_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/10 text-white border-white/20">
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
                    )}
                  />
                  {errors.position_id && (
                    <p className="text-xs text-red-400">{errors.position_id.message}</p>
                  )}
                </div>
              </div>

              {/* Regu Section */}
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="is_crew_member"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="is_crew_member"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <label
                    htmlFor="is_crew_member"
                    className="text-sm font-medium text-slate-200 cursor-pointer"
                  >
                    Anggota Regu Kerja (Shift/Grup)
                  </label>
                </div>

                {watchedIsCrewMember && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 pt-2"
                  >
                    <Label className="text-xs text-slate-200">Pilih Regu Kerja *</Label>
                    <Controller
                      name="crew_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={(val) => field.onChange(val || null)}
                        >
                          <SelectTrigger className="bg-white/10 text-white border-white/20">
                            <SelectValue placeholder="Pilih Regu Kerja" />
                          </SelectTrigger>
                          <SelectContent>
                            {crews.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </motion.div>
                )}
              </div>

              {/* TMT Kerja (Start Date) with Real-Time Duration Preview */}
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-xs text-slate-200">
                  Tanggal Mulai Tugas (TMT Kerja) *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  className="bg-white/10 text-white placeholder:text-slate-400 border-white/20"
                />
                {errors.start_date && (
                  <p className="text-xs text-red-400">{errors.start_date.message}</p>
                )}

                {/* Real-time Work Duration Display */}
                {workDuration && (
                  <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3.5 mt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                      <Clock className="h-4 w-4" />
                      <span>Kalkulasi Masa Kerja Saat Ini:</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-white">
                      {workDuration.years} Tahun, {workDuration.months} Bulan, {workDuration.days} Hari
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      {workDuration.eligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Masa kerja &ge; 12 bulan (Memenuhi syarat pengajuan pinjaman koperasi & cuti tahunan)</span>
                        </span>
                      ) : (
                        <span className="text-amber-300">
                          Masa kerja &lt; 12 bulan ({12 - workDuration.totalMonths} bulan lagi untuk hak cuti tahunan & koperasi)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: DATA REKENING */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 mb-4">
                <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Langkah 3: Data Rekening Bank</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Digunakan untuk pencairan pinjaman koperasi dan verifikasi payroll.
                </p>
              </div>

              {/* Bank Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200">Nama Bank *</Label>
                <Controller
                  name="bank_name"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/10 text-white border-white/20">
                        <SelectValue placeholder="Pilih Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            Bank {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-400">{errors.bank_name.message}</p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <Label htmlFor="account_number" className="text-xs text-slate-200">
                  Nomor Rekening Bank *
                </Label>
                <Input
                  id="account_number"
                  inputMode="numeric"
                  placeholder="Contoh: 1420018293847"
                  {...register('account_number')}
                  className="bg-white/10 text-white placeholder:text-slate-400 border-white/20 font-mono tracking-wider"
                />
                {errors.account_number && (
                  <p className="text-xs text-red-400">{errors.account_number.message}</p>
                )}
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="account_holder" className="text-xs text-slate-200">
                    Nama Pemilik Rekening (Sesuai Buku Tabungan) *
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      const name = watch('full_name')
                      if (name) setValue('account_holder', name, { shouldValidate: true })
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Salin dari Nama Lengkap
                  </button>
                </div>
                <Input
                  id="account_holder"
                  placeholder="Contoh: BUDI SANTOSO"
                  {...register('account_holder')}
                  className="bg-white/10 text-white placeholder:text-slate-400 border-white/20 uppercase"
                />
                {errors.account_holder && (
                  <p className="text-xs text-red-400">{errors.account_holder.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW & KONFIRMASI */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 mb-2">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span>Langkah 4: Tinjau & Konfirmasi Data</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mohon periksa kembali kelengkapan seluruh data sebelum dikirim ke sistem.
                </p>
              </div>

              {/* Section 1: Data Pribadi Summary */}
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-blue-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Data Pribadi
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Ubah
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block">NIK:</span>
                    <span className="font-semibold text-white">{formatNIK(watchedValues.nik)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nama Lengkap:</span>
                    <span className="font-semibold text-white">{watchedValues.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tempat/Tgl Lahir:</span>
                    <span className="text-white">
                      {watchedValues.birth_place},{' '}
                      {watchedValues.birth_date ? formatDate(watchedValues.birth_date) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email & No. HP:</span>
                    <span className="text-white block truncate">{watchedValues.email}</span>
                    <span className="text-white">{watchedValues.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Alamat:</span>
                    <span className="text-white">{watchedValues.address}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Data Pekerjaan Summary */}
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-blue-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Data Pekerjaan
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Ubah
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Perusahaan:</span>
                    <span className="text-white font-medium">
                      {companies.find((c) => c.id === watchedValues.company_id)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Site:</span>
                    <span className="text-white font-medium">
                      {sites.find((s) => s.id === watchedValues.site_id)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Departemen:</span>
                    <span className="text-white font-medium">
                      {departments.find((d) => d.id === watchedValues.department_id)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jabatan:</span>
                    <span className="text-white font-medium">
                      {positions.find((p) => p.id === watchedValues.position_id)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Regu:</span>
                    <span className="text-white">
                      {watchedValues.is_crew_member
                        ? crews.find((c) => c.id === watchedValues.crew_id)?.name || 'Regu Terpilih'
                        : 'Bukan Anggota Regu'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">TMT Kerja:</span>
                    <span className="text-white font-medium">
                      {watchedValues.start_date ? formatDate(watchedValues.start_date) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Data Rekening Summary */}
              <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-blue-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Rekening Bank
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Ubah
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Bank:</span>
                    <span className="text-white font-semibold">{watchedValues.bank_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">No. Rekening:</span>
                    <span className="text-white font-mono">{watchedValues.account_number}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Atas Nama:</span>
                    <span className="text-white font-semibold">{watchedValues.account_holder}</span>
                  </div>
                </div>
              </div>

              {/* Legal Agreement Checkbox */}
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreement"
                    checked={agreementChecked}
                    onCheckedChange={(val) => setAgreementChecked(Boolean(val))}
                    className="mt-0.5 border-amber-300 data-[state=checked]:bg-amber-600"
                  />
                  <label
                    htmlFor="agreement"
                    className="text-xs text-amber-200 leading-relaxed cursor-pointer"
                  >
                    Saya menyatakan dengan sesungguhnya bahwa seluruh data yang saya isikan dalam formulir pendaftaran ini adalah benar dan dapat dipertanggungjawabkan sesuai ketentuan perusahaan.
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-white/10">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Sebelumnya</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 font-semibold px-6"
            >
              <span>Lanjut</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || !agreementChecked}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/30 px-8"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <ButtonSpinner size={16} />
                  <span>Mengirimkan Pendaftaran...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Kirim Pendaftaran</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
