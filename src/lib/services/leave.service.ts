import { createAdminClient } from '@/lib/supabase/admin'
import { generateId, generateVerificationCode } from '@/lib/utils'
import { leaveRequestSchema, type LeaveRequestInput } from '@/lib/validators'
import { logAction, AUDIT_ACTIONS } from './audit.service'
import type {
  LeaveRequest,
  LeaveBalanceLedger,
  LeaveStatus,
  ApprovalSource,
  Employee,
} from '@/lib/types/database'

export interface LeaveBalanceDetail {
  total: number
  used: number
  reserved: number
  available: number
  allocated: number
  accumulated: number
}

export interface LeaveRequestWithRelations extends LeaveRequest {
  employee?: {
    id: string
    nik: string
    full_name: string
    email?: string | null
    phone?: string | null
    company_name?: string | null
    site_name?: string | null
    department_name?: string | null
    position_name?: string | null
    crew_name?: string | null
  } | null
  processed_by_admin?: {
    id: string
    name: string
    email: string
  } | null
}

export interface LeaveFilters {
  status?: LeaveStatus | 'all'
  year?: number
  search?: string
  company_id?: string
  department_id?: string
  page?: number
  limit?: number
}

export interface PaginatedLeaveRequests {
  requests: LeaveRequestWithRelations[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 1. getLeaveBalance
 * Get current balance from ledger (sum allocations + accumulations - sum usages)
 */
export async function getLeaveBalance(
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<number> {
  const detail = await getLeaveBalanceDetail(employeeId, year)
  return detail.available
}

/**
 * 2. getLeaveBalanceDetail
 * Get full breakdown with reserved, used, allocated, accumulated, total, available
 */
export async function getLeaveBalanceDetail(
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<LeaveBalanceDetail> {
  const admin = createAdminClient()

  const { data: entries, error } = await admin
    .from('leave_balance_ledger')
    .select('type, amount')
    .eq('employee_id', employeeId)
    .eq('year', year)

  if (error) {
    console.error('[LeaveService] Error fetching balance detail:', error.message)
    return {
      total: 0,
      used: 0,
      reserved: 0,
      available: 0,
      allocated: 0,
      accumulated: 0,
    }
  }

  let allocated = 0
  let accumulated = 0
  let used = 0
  let reservations = 0
  let releases = 0

  for (const entry of entries || []) {
    const amount = Number(entry.amount) || 0
    switch (entry.type) {
      case 'allocation':
        allocated += amount
        break
      case 'accumulation':
        accumulated += amount
        break
      case 'usage':
        used += amount
        break
      case 'reservation':
        reservations += amount
        break
      case 'release':
        releases += amount
        break
    }
  }

  const total = allocated + accumulated
  const reserved = Math.max(0, reservations - releases)
  const available = Math.max(0, total - used - reserved)

  return {
    total,
    used,
    reserved,
    available,
    allocated,
    accumulated,
  }
}

/**
 * 3. addLeaveAllocation
 * Add allocation entry to ledger
 */
export async function addLeaveAllocation(
  employeeId: string,
  year: number,
  amount: number,
  adminId: string,
  description?: string
): Promise<{ success: boolean; entry?: LeaveBalanceLedger; error?: string }> {
  if (amount < 0) {
    return { success: false, error: 'Jumlah alokasi tidak boleh negatif' }
  }

  const admin = createAdminClient()

  // Verify employee exists
  const { data: emp, error: empErr } = await admin
    .from('employees')
    .select('id, full_name, nik')
    .eq('id', employeeId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (empErr || !emp) {
    return { success: false, error: 'Pegawai tidak ditemukan' }
  }

  const desc = description || `Alokasi kuota cuti tahun ${year} (${amount} hari)`

  const { data: entry, error: insertErr } = await admin
    .from('leave_balance_ledger')
    .insert({
      employee_id: employeeId,
      year: year,
      type: 'allocation',
      amount: amount,
      reference_type: 'manual_allocation',
      reference_id: null,
      description: desc,
      created_by: adminId,
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[LeaveService] Error adding leave allocation:', insertErr.message)
    return { success: false, error: insertErr.message }
  }

  // Audit log
  await logAction({
    actorType: 'admin',
    actorId: adminId,
    action: 'add_leave_allocation',
    targetType: 'leave_balance_ledger',
    targetId: entry.id,
    newValues: {
      employee_id: employeeId,
      year,
      amount,
      description: desc,
    },
  })

  return { success: true, entry }
}

/**
 * 4. createLeaveRequest
 * - Check no pending leave request exists for this employee
 * - Check employee is approved and active
 * - Check leave balance sufficient (available >= requested days)
 * - Create reservation in ledger
 * - Insert leave_request with status 'pending'
 * - Return created request
 */
export async function createLeaveRequest(
  employeeId: string,
  data: LeaveRequestInput
): Promise<{ success: boolean; request?: LeaveRequest; error?: string }> {
  // Validate schema
  const parsed = leaveRequestSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pengajuan cuti tidak valid',
    }
  }

  const admin = createAdminClient()

  // 1. Check employee is approved and active
  const { data: employee, error: empErr } = await admin
    .from('employees')
    .select('id, full_name, nik, status, is_active, is_deleted')
    .eq('id', employeeId)
    .maybeSingle()

  if (empErr || !employee) {
    return { success: false, error: 'Data pegawai tidak ditemukan' }
  }

  if (employee.is_deleted) {
    return { success: false, error: 'Akun pegawai telah dinonaktifkan / dihapus' }
  }

  if (employee.status !== 'approved' || !employee.is_active) {
    return {
      success: false,
      error: 'Pengajuan cuti hanya dapat dilakukan oleh pegawai yang telah disetujui dan berstatus aktif',
    }
  }

  // 2. Check no pending leave request exists for this employee
  const { data: pendingRequests, error: pendingErr } = await admin
    .from('leave_requests')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .limit(1)

  if (pendingErr) {
    console.error('[LeaveService] Error checking pending requests:', pendingErr.message)
    return { success: false, error: 'Gagal memverifikasi status pengajuan cuti sebelumnya' }
  }

  if (pendingRequests && pendingRequests.length > 0) {
    return {
      success: false,
      error: 'Anda memiliki pengajuan cuti yang masih menunggu persetujuan.',
    }
  }

  // 3. Sort dates and determine year
  const sortedDates = [...data.selected_dates].sort()
  const requestedDays = sortedDates.length
  if (requestedDays < 1) {
    return { success: false, error: 'Pilih minimal 1 tanggal cuti' }
  }

  const requestYear = new Date(sortedDates[0]).getFullYear() || new Date().getFullYear()

  // 4. Check leave balance sufficient
  const balanceDetail = await getLeaveBalanceDetail(employeeId, requestYear)
  if (balanceDetail.available < requestedDays) {
    return {
      success: false,
      error: `Saldo cuti tidak mencukupi. Kuota tersedia: ${balanceDetail.available} hari, jumlah cuti diajukan: ${requestedDays} hari.`,
    }
  }

  // 5. Generate identifiers
  const requestId = generateId('CT')
  const verificationCode = generateVerificationCode()

  // 6. Create reservation in ledger
  const { data: reservationEntry, error: reservationErr } = await admin
    .from('leave_balance_ledger')
    .insert({
      employee_id: employeeId,
      year: requestYear,
      type: 'reservation',
      amount: requestedDays,
      reference_type: 'leave_request',
      reference_id: requestId,
      description: `Reservasi cuti untuk pengajuan ${requestId}`,
      created_by: employeeId,
    })
    .select()
    .single()

  if (reservationErr) {
    console.error('[LeaveService] Error creating ledger reservation:', reservationErr.message)
    return { success: false, error: 'Gagal membuat reservasi kuota cuti di ledger' }
  }

  // 7. Insert leave_request with status 'pending'
  const { data: newRequest, error: insertErr } = await admin
    .from('leave_requests')
    .insert({
      id: requestId,
      employee_id: employeeId,
      selected_dates: sortedDates,
      total_days: requestedDays,
      reason: data.reason.trim(),
      emergency_contact: data.emergency_contact.trim(),
      status: 'pending',
      processed_by: null,
      processed_at: null,
      admin_notes: null,
      approval_source: null,
      verification_code: verificationCode,
      year: requestYear,
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[LeaveService] Error inserting leave request:', insertErr.message)
    // Rollback reservation in ledger to maintain data consistency
    await admin
      .from('leave_balance_ledger')
      .delete()
      .eq('id', reservationEntry.id)

    return { success: false, error: 'Gagal menyimpan permohonan cuti: ' + insertErr.message }
  }

  // 8. Audit log
  await logAction({
    actorType: 'employee',
    actorId: employeeId,
    action: AUDIT_ACTIONS.REQUEST_LEAVE,
    targetType: 'leave_request',
    targetId: requestId,
    newValues: {
      selected_dates: sortedDates,
      total_days: requestedDays,
      reason: data.reason,
      emergency_contact: data.emergency_contact,
      year: requestYear,
    },
  })

  return { success: true, request: newRequest }
}

/**
 * 5. approveLeaveRequest
 * - Update status to 'approved'
 * - Convert reservation to usage in ledger (release reservation + record usage)
 * - Set processed_by, processed_at, approval_source
 * - Generate/ensure verification code
 * - Audit log
 */
export async function approveLeaveRequest(
  requestId: string,
  adminId: string,
  notes?: string,
  source: ApprovalSource = 'panel'
): Promise<{ success: boolean; request?: LeaveRequest; error?: string }> {
  const admin = createAdminClient()

  // Fetch request
  const { data: request, error: fetchErr } = await admin
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (fetchErr || !request) {
    return { success: false, error: 'Pengajuan cuti tidak ditemukan' }
  }

  if (request.status !== 'pending') {
    return {
      success: false,
      error: `Pengajuan cuti tidak dapat disetujui karena berstatus '${request.status}'`,
    }
  }

  const now = new Date().toISOString()
  const verificationCode = request.verification_code || generateVerificationCode()

  // 1. Release reservation in ledger
  const { error: releaseErr } = await admin.from('leave_balance_ledger').insert({
    employee_id: request.employee_id,
    year: request.year,
    type: 'release',
    amount: request.total_days,
    reference_type: 'leave_request',
    reference_id: requestId,
    description: `Pelepasan reservasi (persetujuan pengajuan ${requestId})`,
    created_by: adminId,
  })

  if (releaseErr) {
    console.error('[LeaveService] Error releasing reservation:', releaseErr.message)
  }

  // 2. Insert usage in ledger
  const { error: usageErr } = await admin.from('leave_balance_ledger').insert({
    employee_id: request.employee_id,
    year: request.year,
    type: 'usage',
    amount: request.total_days,
    reference_type: 'leave_request',
    reference_id: requestId,
    description: `Penggunaan cuti tahunan disetujui (${requestId})`,
    created_by: adminId,
  })

  if (usageErr) {
    console.error('[LeaveService] Error recording leave usage in ledger:', usageErr.message)
    return { success: false, error: 'Gagal mencatat pemotongan kuota cuti di ledger' }
  }

  // 3. Update leave_request status
  const { data: updatedRequest, error: updateErr } = await admin
    .from('leave_requests')
    .update({
      status: 'approved',
      processed_by: adminId,
      processed_at: now,
      admin_notes: notes || null,
      approval_source: source,
      verification_code: verificationCode,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (updateErr) {
    console.error('[LeaveService] Error updating leave request to approved:', updateErr.message)
    return { success: false, error: updateErr.message }
  }

  // 4. Audit log
  await logAction({
    actorType: 'admin',
    actorId: adminId,
    action: AUDIT_ACTIONS.APPROVE_LEAVE,
    targetType: 'leave_request',
    targetId: requestId,
    oldValues: { status: 'pending' },
    newValues: {
      status: 'approved',
      admin_notes: notes || null,
      approval_source: source,
      processed_at: now,
    },
  })

  return { success: true, request: updatedRequest }
}

/**
 * 6. rejectLeaveRequest
 * - Update status to 'rejected'
 * - Release reservation in ledger
 * - Set processed_by, processed_at
 * - Audit log
 */
export async function rejectLeaveRequest(
  requestId: string,
  adminId: string,
  notes?: string,
  source: ApprovalSource = 'panel'
): Promise<{ success: boolean; request?: LeaveRequest; error?: string }> {
  const admin = createAdminClient()

  // Fetch request
  const { data: request, error: fetchErr } = await admin
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (fetchErr || !request) {
    return { success: false, error: 'Pengajuan cuti tidak ditemukan' }
  }

  if (request.status !== 'pending') {
    return {
      success: false,
      error: `Pengajuan cuti tidak dapat ditolak karena berstatus '${request.status}'`,
    }
  }

  const now = new Date().toISOString()

  // 1. Release reservation in ledger
  const { error: releaseErr } = await admin.from('leave_balance_ledger').insert({
    employee_id: request.employee_id,
    year: request.year,
    type: 'release',
    amount: request.total_days,
    reference_type: 'leave_request',
    reference_id: requestId,
    description: `Pelepasan reservasi (penolakan cuti ${requestId})`,
    created_by: adminId,
  })

  if (releaseErr) {
    console.error('[LeaveService] Error releasing reservation on reject:', releaseErr.message)
  }

  // 2. Update status to rejected
  const { data: updatedRequest, error: updateErr } = await admin
    .from('leave_requests')
    .update({
      status: 'rejected',
      processed_by: adminId,
      processed_at: now,
      admin_notes: notes || null,
      approval_source: source,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (updateErr) {
    console.error('[LeaveService] Error updating leave request to rejected:', updateErr.message)
    return { success: false, error: updateErr.message }
  }

  // 3. Audit log
  await logAction({
    actorType: 'admin',
    actorId: adminId,
    action: AUDIT_ACTIONS.REJECT_LEAVE,
    targetType: 'leave_request',
    targetId: requestId,
    oldValues: { status: 'pending' },
    newValues: {
      status: 'rejected',
      admin_notes: notes || null,
      approval_source: source,
      processed_at: now,
    },
  })

  return { success: true, request: updatedRequest }
}

/**
 * 7. cancelLeaveRequest
 * - Verify status is 'pending'
 * - Verify employee owns this request
 * - Update status to 'cancelled'
 * - Release reservation in ledger
 * - Audit log
 */
export async function cancelLeaveRequest(
  requestId: string,
  employeeId: string
): Promise<{ success: boolean; request?: LeaveRequest; error?: string }> {
  const admin = createAdminClient()

  // Fetch request
  const { data: request, error: fetchErr } = await admin
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (fetchErr || !request) {
    return { success: false, error: 'Pengajuan cuti tidak ditemukan' }
  }

  if (request.employee_id !== employeeId) {
    return { success: false, error: 'Anda tidak memiliki hak untuk membatalkan pengajuan ini' }
  }

  if (request.status !== 'pending') {
    return {
      success: false,
      error: `Hanya pengajuan cuti berstatus 'pending' yang dapat dibatalkan (status saat ini: ${request.status})`,
    }
  }

  // 1. Release reservation in ledger
  const { error: releaseErr } = await admin.from('leave_balance_ledger').insert({
    employee_id: request.employee_id,
    year: request.year,
    type: 'release',
    amount: request.total_days,
    reference_type: 'leave_request',
    reference_id: requestId,
    description: `Pelepasan reservasi (pembatalan cuti oleh pegawai ${requestId})`,
    created_by: employeeId,
  })

  if (releaseErr) {
    console.error('[LeaveService] Error releasing reservation on cancel:', releaseErr.message)
  }

  // 2. Update status to cancelled
  const { data: updatedRequest, error: updateErr } = await admin
    .from('leave_requests')
    .update({
      status: 'cancelled',
    })
    .eq('id', requestId)
    .select()
    .single()

  if (updateErr) {
    console.error('[LeaveService] Error updating leave request to cancelled:', updateErr.message)
    return { success: false, error: updateErr.message }
  }

  // 3. Audit log
  await logAction({
    actorType: 'employee',
    actorId: employeeId,
    action: AUDIT_ACTIONS.CANCEL_LEAVE,
    targetType: 'leave_request',
    targetId: requestId,
    oldValues: { status: 'pending' },
    newValues: { status: 'cancelled' },
  })

  return { success: true, request: updatedRequest }
}

/**
 * 8. getLeaveRequests
 * Get employee's leave history with pagination and status filter
 */
export async function getLeaveRequests(
  employeeId: string,
  filters?: {
    status?: LeaveStatus | 'all'
    year?: number
    page?: number
    limit?: number
  }
): Promise<PaginatedLeaveRequests> {
  const admin = createAdminClient()
  const page = Math.max(1, filters?.page || 1)
  const limit = Math.max(1, filters?.limit || 10)
  const offset = (page - 1) * limit

  let query = admin
    .from('leave_requests')
    .select('*', { count: 'exact' })
    .eq('employee_id', employeeId)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.year) {
    query = query.eq('year', filters.year)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: requests, count, error } = await query

  if (error) {
    console.error('[LeaveService] Error fetching leave requests:', error.message)
    return {
      requests: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Fetch admin names for processed_by
  const adminIds = Array.from(
    new Set((requests || []).map((r) => r.processed_by).filter(Boolean))
  ) as string[]

  let adminMap = new Map<string, { id: string; name: string; email: string }>()
  if (adminIds.length > 0) {
    const { data: admins } = await admin
      .from('admins')
      .select('id, name, email')
      .in('id', adminIds)

    if (admins) {
      for (const a of admins) {
        adminMap.set(a.id, a)
      }
    }
  }

  const enriched: LeaveRequestWithRelations[] = (requests || []).map((r) => ({
    ...r,
    processed_by_admin: r.processed_by ? adminMap.get(r.processed_by) || null : null,
  }))

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    requests: enriched,
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * 9. getLeaveRequestById
 * Get full details of a specific leave request
 */
export async function getLeaveRequestById(
  requestId: string
): Promise<LeaveRequestWithRelations | null> {
  const admin = createAdminClient()

  const { data: request, error } = await admin
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error || !request) {
    return null
  }

  // Fetch employee details
  const { data: emp } = await admin
    .from('employees')
    .select('id, nik, full_name, email, phone, company_id, site_id, department_id, position_id, crew_id')
    .eq('id', request.employee_id)
    .maybeSingle()

  let employeeDetails: LeaveRequestWithRelations['employee'] = null
  if (emp) {
    // Look up company, site, dept, pos, crew names
    let companyName: string | null = null
    let siteName: string | null = null
    let deptName: string | null = null
    let posName: string | null = null
    let crewName: string | null = null

    if (emp.company_id) {
      const { data: c } = await admin.from('companies').select('name').eq('id', emp.company_id).maybeSingle()
      companyName = c?.name || null
    }
    if (emp.site_id) {
      const { data: s } = await admin.from('sites').select('name').eq('id', emp.site_id).maybeSingle()
      siteName = s?.name || null
    }
    if (emp.department_id) {
      const { data: d } = await admin.from('departments').select('name').eq('id', emp.department_id).maybeSingle()
      deptName = d?.name || null
    }
    if (emp.position_id) {
      const { data: p } = await admin.from('positions').select('name').eq('id', emp.position_id).maybeSingle()
      posName = p?.name || null
    }
    if (emp.crew_id) {
      const { data: cr } = await admin.from('crews').select('name').eq('id', emp.crew_id).maybeSingle()
      crewName = cr?.name || null
    }

    employeeDetails = {
      id: emp.id,
      nik: emp.nik,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      company_name: companyName,
      site_name: siteName,
      department_name: deptName,
      position_name: posName,
      crew_name: crewName,
    }
  }

  // Fetch admin processor
  let processorAdmin: LeaveRequestWithRelations['processed_by_admin'] = null
  if (request.processed_by) {
    const { data: adm } = await admin
      .from('admins')
      .select('id, name, email')
      .eq('id', request.processed_by)
      .maybeSingle()

    if (adm) {
      processorAdmin = adm
    }
  }

  return {
    ...request,
    employee: employeeDetails,
    processed_by_admin: processorAdmin,
  }
}

/**
 * 10. getAllLeaveRequests
 * Admin - get all requests with filters, pagination, and joined employee data
 */
export async function getAllLeaveRequests(
  filters?: LeaveFilters
): Promise<PaginatedLeaveRequests> {
  const admin = createAdminClient()
  const page = Math.max(1, filters?.page || 1)
  const limit = Math.max(1, filters?.limit || 10)
  const offset = (page - 1) * limit

  let query = admin
    .from('leave_requests')
    .select('*', { count: 'exact' })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.year) {
    query = query.eq('year', filters.year)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: requests, count, error } = await query

  if (error) {
    console.error('[LeaveService] Error fetching all leave requests:', error.message)
    return {
      requests: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    }
  }

  // Gather unique employee and admin IDs
  const empIds = Array.from(new Set((requests || []).map((r) => r.employee_id)))
  const adminIds = Array.from(
    new Set((requests || []).map((r) => r.processed_by).filter(Boolean))
  ) as string[]

  let empMap = new Map<string, NonNullable<LeaveRequestWithRelations['employee']>>()
  if (empIds.length > 0) {
    const { data: emps } = await admin
      .from('employees')
      .select('id, nik, full_name, email, phone, company_id, site_id, department_id, position_id, crew_id')
      .in('id', empIds)

    if (emps) {
      for (const e of emps) {
        empMap.set(e.id, {
          id: e.id,
          nik: e.nik,
          full_name: e.full_name,
          email: e.email,
          phone: e.phone,
        })
      }
    }
  }

  let adminMap = new Map<string, { id: string; name: string; email: string }>()
  if (adminIds.length > 0) {
    const { data: adms } = await admin
      .from('admins')
      .select('id, name, email')
      .in('id', adminIds)

    if (adms) {
      for (const a of adms) {
        adminMap.set(a.id, a)
      }
    }
  }

  let enriched: LeaveRequestWithRelations[] = (requests || []).map((r) => ({
    ...r,
    employee: empMap.get(r.employee_id) || null,
    processed_by_admin: r.processed_by ? adminMap.get(r.processed_by) || null : null,
  }))

  // Apply search filter if provided (in-memory if joined search)
  if (filters?.search) {
    const s = filters.search.toLowerCase()
    enriched = enriched.filter(
      (r) =>
        r.id.toLowerCase().includes(s) ||
        r.employee?.full_name?.toLowerCase().includes(s) ||
        r.employee?.nik?.includes(s)
    )
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    requests: enriched,
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * 11. getAllEmployeesWithLeaveBalances
 * Helper for admin leave quota management
 */
export async function getAllEmployeesWithLeaveBalances(
  year: number = new Date().getFullYear()
): Promise<
  Array<{
    employee: Employee & {
      company_name?: string | null
      department_name?: string | null
      position_name?: string | null
    }
    balance: LeaveBalanceDetail
  }>
> {
  const admin = createAdminClient()

  const { data: emps, error } = await admin
    .from('employees')
    .select('*, companies(name), departments(name), positions(name)')
    .eq('is_deleted', false)
    .order('full_name', { ascending: true })

  if (error || !emps) {
    console.error('[LeaveService] Error fetching employees for quota view:', error?.message)
    return []
  }

  const result: Array<{
    employee: Employee & {
      company_name?: string | null
      department_name?: string | null
      position_name?: string | null
    }
    balance: LeaveBalanceDetail
  }> = []

  for (const emp of emps) {
    const balance = await getLeaveBalanceDetail(emp.id, year)
    result.push({
      employee: {
        ...(emp as unknown as Employee),
        company_name: (emp as { companies?: { name?: string } | null })?.companies?.name || null,
        department_name: (emp as { departments?: { name?: string } | null })?.departments?.name || null,
        position_name: (emp as { positions?: { name?: string } | null })?.positions?.name || null,
      },
      balance,
    })
  }

  return result
}
