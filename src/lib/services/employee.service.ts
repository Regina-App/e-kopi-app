import { createAdminClient } from '@/lib/supabase/admin'
import { registerEmployeeSchema, type RegisterEmployeeInput } from '@/lib/validators'
import { calculateWorkDuration } from '@/lib/utils'
import { logAction, AUDIT_ACTIONS } from './audit.service'
import type { Employee, ActorType } from '@/lib/types/database'

export interface EmployeeProfile extends Employee {
  company_name?: string | null
  site_name?: string | null
  department_name?: string | null
  position_name?: string | null
  crew_name?: string | null
  work_duration?: {
    years: number
    months: number
    days: number
    totalMonths: number
    eligible: boolean
  }
}

/**
 * Register a new employee with pending status
 */
export async function registerEmployee(
  data: RegisterEmployeeInput,
  context?: { ipAddress?: string; userAgent?: string }
) {
  // Validate schema
  const parsed = registerEmployeeSchema.safeParse(data)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Data registrasi tidak valid'
    return { success: false, error: errorMsg }
  }

  const admin = createAdminClient()

  // Check NIK uniqueness
  const { data: existing, error: checkError } = await admin
    .from('employees')
    .select('id, nik, status, is_deleted')
    .eq('nik', data.nik.trim())
    .eq('is_deleted', false)
    .maybeSingle()

  if (checkError) {
    console.error('[EmployeeService] Error checking NIK:', checkError.message)
    return { success: false, error: 'Gagal memverifikasi NIK di database' }
  }

  if (existing) {
    return {
      success: false,
      error: `NIK ${data.nik} sudah terdaftar dengan status "${existing.status}". Silakan masuk atau hubungi admin.`,
    }
  }

  // Insert employee with pending status
  const insertPayload = {
    nik: data.nik.trim(),
    full_name: data.full_name.trim(),
    birth_place: data.birth_place?.trim() || null,
    birth_date: data.birth_date || null,
    address: data.address?.trim() || null,
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    company_id: data.company_id || null,
    site_id: data.site_id || null,
    department_id: data.department_id || null,
    position_id: data.position_id || null,
    is_crew_member: Boolean(data.is_crew_member),
    crew_id: data.is_crew_member && data.crew_id ? data.crew_id : null,
    start_date: data.start_date,
    bank_name: data.bank_name || 'Mandiri',
    account_number: data.account_number?.trim() || null,
    account_holder: data.account_holder?.trim() || null,
    status: 'pending' as const,
    is_active: false,
    is_deleted: false,
  }

  const { data: newEmployee, error: insertError } = await admin
    .from('employees')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError || !newEmployee) {
    console.error('[EmployeeService] Error registering employee:', insertError?.message)
    return { success: false, error: insertError?.message || 'Gagal menyimpan data pendaftaran' }
  }

  // Create audit log
  await logAction({
    actorType: 'employee',
    actorId: newEmployee.id,
    action: AUDIT_ACTIONS.REGISTER,
    targetType: 'employee',
    targetId: newEmployee.id,
    newValues: {
      nik: newEmployee.nik,
      full_name: newEmployee.full_name,
      email: newEmployee.email,
      status: newEmployee.status,
    },
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  })

  return {
    success: true,
    message: 'Pendaftaran berhasil dikirim. Menunggu persetujuan administrator.',
    employee: newEmployee,
  }
}

/**
 * Get employee by ID with relation joins
 */
export async function getEmployeeById(id: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('employees')
    .select(`
      *,
      company:companies(id, name),
      site:sites(id, name),
      department:departments(id, name),
      position:positions(id, name),
      crew:crews(id, name)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    console.error('[EmployeeService] Error fetching employee by id:', error.message)
    return null
  }

  return data
}

/**
 * Get employee by NIK
 */
export async function getEmployeeByNIK(nik: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('employees')
    .select('*')
    .eq('nik', nik.trim())
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    console.error('[EmployeeService] Error fetching employee by NIK:', error.message)
    return null
  }

  return data
}

/**
 * Update employee record and create audit log
 */
export async function updateEmployee(
  id: string,
  data: Partial<Omit<Employee, 'id' | 'nik' | 'created_at'>>,
  context?: {
    actorType?: ActorType
    actorId?: string
    ipAddress?: string
    userAgent?: string
  }
) {
  const admin = createAdminClient()

  // Get current record for audit diff
  const { data: current, error: fetchError } = await admin
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !current) {
    return { success: false, error: 'Karyawan tidak ditemukan' }
  }

  const updatePayload = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  const { data: updated, error: updateError } = await admin
    .from('employees')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    return { success: false, error: updateError?.message || 'Gagal memperbarui data karyawan' }
  }

  // Audit log
  await logAction({
    actorType: context?.actorType || 'employee',
    actorId: context?.actorId || id,
    action: AUDIT_ACTIONS.UPDATE_PROFILE,
    targetType: 'employee',
    targetId: id,
    oldValues: current as unknown as Record<string, unknown>,
    newValues: updatePayload as unknown as Record<string, unknown>,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  })

  return { success: true, employee: updated }
}

/**
 * Get employee profile with resolved master data names and calculated work duration
 */
export async function getEmployeeProfile(id: string): Promise<EmployeeProfile | null> {
  const employeeData = await getEmployeeById(id)
  if (!employeeData) return null

  // Supabase returns related objects as company, site, etc.
  const raw = employeeData as Record<string, any>
  const companyName = raw.company?.name || null
  const siteName = raw.site?.name || null
  const departmentName = raw.department?.name || null
  const positionName = raw.position?.name || null
  const crewName = raw.crew?.name || null

  const workDuration = raw.start_date
    ? calculateWorkDuration(raw.start_date)
    : { years: 0, months: 0, days: 0, totalMonths: 0, eligible: false }

  return {
    ...employeeData,
    company_name: companyName,
    site_name: siteName,
    department_name: departmentName,
    position_name: positionName,
    crew_name: crewName,
    work_duration: workDuration,
  }
}

/**
 * Calculate work duration helper
 */
export { calculateWorkDuration }

/**
 * Check leave eligibility based on work duration (12+ months)
 */
export async function checkEligibility(employeeId: string) {
  const admin = createAdminClient()

  const { data: employee, error } = await admin
    .from('employees')
    .select('id, start_date, status, is_active')
    .eq('id', employeeId)
    .maybeSingle()

  if (error || !employee) {
    return {
      eligible: false,
      reason: 'Pegawai tidak ditemukan',
      workDuration: null,
    }
  }

  const duration = calculateWorkDuration(employee.start_date)

  if (employee.status !== 'approved' || !employee.is_active) {
    return {
      eligible: false,
      reason: 'Status pegawai belum aktif atau disetujui',
      workDuration: duration,
    }
  }

  return {
    eligible: duration.eligible, // totalMonths >= 12
    reason: duration.eligible
      ? 'Memenuhi syarat cuti tahunan (masa kerja minimal 1 tahun)'
      : `Masa kerja baru ${duration.years} tahun ${duration.months} bulan. Minimal 1 tahun (12 bulan) masa kerja untuk hak cuti tahunan.`,
    workDuration: duration,
  }
}
