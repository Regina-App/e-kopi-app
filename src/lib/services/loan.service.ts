import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import type {
  LoanRequest,
  LoanInstallment,
  LoanTakeover,
  LoanStatus,
  ApprovalSource,
  Employee,
  Json,
} from '@/lib/types/database'
import { generateId } from '@/lib/utils'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

export interface LoanInstallmentCalculation {
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
}

export interface LoanCalculation {
  loan_amount: number
  tenor: number
  interest_rate: number
  principal_per_month: number
  interest_per_month: number
  installment_per_month: number
  last_principal: number
  total_obligation: number
  schedule: LoanInstallmentCalculation[]
}

export interface LoanSettings {
  interest_rate: number
  max_tenor: number
  max_loan: number
  loan_period_start: number
  loan_period_end: number
  loan_deduction_day: number
  current_day: number
  is_within_period: boolean
}

export interface CreateLoanRequestInput {
  loan_amount: number
  tenor: number
  is_takeover?: boolean
}

export interface LoanWithInstallments extends LoanRequest {
  installments?: LoanInstallment[]
  employee?: Partial<Employee>
  previous_loan?: LoanRequest | null
  summary?: {
    confirmed_count: number
    total_installments: number
    remaining_obligation: number
    next_installment?: LoanInstallment | null
  }
}

export interface LoanFilterOptions {
  status?: string
  search?: string
  page?: number
  limit?: number
}

// Default settings fallback
const DEFAULT_SETTINGS: LoanSettings = {
  interest_rate: 0.025,
  max_tenor: 4,
  max_loan: 10000000,
  loan_period_start: 8,
  loan_period_end: 28,
  loan_deduction_day: 5,
  current_day: new Date().getDate(),
  is_within_period: true,
}

// Helper to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!url && !!key && !url.includes('your_supabase_url')
}

// In-Memory store fallback for offline/local-demo testing
interface MockStore {
  settings: Record<string, number | string>
  loans: Map<string, LoanRequest>
  installments: Map<string, LoanInstallment>
  takeovers: Map<string, LoanTakeover>
  auditLogs: Array<Record<string, unknown>>
  employees: Map<string, Partial<Employee>>
}

const mockStore: MockStore = {
  settings: {
    interest_rate: 0.025,
    max_tenor: 4,
    max_loan: 10000000,
    loan_period_start: 8,
    loan_period_end: 28,
    loan_deduction_day: 5,
  },
  loans: new Map(),
  installments: new Map(),
  takeovers: new Map(),
  auditLogs: [],
  employees: new Map(),
}

// Seed default demo employee and loan in mock store
const DEMO_EMPLOYEE_ID = 'e1000000-0000-0000-0000-000000000001'
mockStore.employees.set(DEMO_EMPLOYEE_ID, {
  id: DEMO_EMPLOYEE_ID,
  nik: '3201123456780001',
  full_name: 'Budi Santoso',
  company_id: 'c1000000-0000-0000-0000-000000000001',
  site_id: 's1000000-0000-0000-0000-000000000001',
  department_id: 'd1000000-0000-0000-0000-000000000001',
  position_id: 'p1000000-0000-0000-0000-000000000001',
  bank_name: 'Mandiri',
  account_number: '1230009876543',
  account_holder: 'BUDI SANTOSO',
  is_active: true,
  status: 'approved',
  start_date: '2023-01-15',
})

// ==============================================================================
// DATE HELPER
// ==============================================================================

/**
 * Calculates due date on the deduction day (default: 5th) starting monthOffset months ahead.
 * e.g., if baseDate is in Nov 2026 and monthOffset is 1, returns 2026-12-05.
 */
export function calculateDueDate(
  baseDate: Date,
  monthOffset: number,
  deductionDay: number = 5
): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, deductionDay)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ==============================================================================
// LOAN SERVICE IMPLEMENTATION
// ==============================================================================

export const loanService = {
  /**
   * Calculates monthly breakdown and installment schedule using strict integer arithmetic.
   * - Flat interest: 2.5% per month on original loan amount
   * - Principal per month = floor(loan_amount / tenor)
   * - Interest per month = floor(loan_amount * interestRate)
   * - Installment per month = principal + interest
   * - Last principal absorbs remainder: loan_amount - (principalPerMonth * (tenor - 1))
   * - Total obligation = (principalPerMonth * (tenor - 1) + lastPrincipal) + (interestPerMonth * tenor)
   */
  calculateLoan(
    amount: number,
    tenor: number,
    interestRate: number = 0.025,
    startDate: Date = new Date(),
    deductionDay: number = 5
  ): LoanCalculation {
    const cleanAmount = Math.floor(Math.max(0, amount))
    const cleanTenor = Math.floor(Math.max(0, tenor))

    if (cleanTenor <= 0 || cleanAmount <= 0) {
      return {
        loan_amount: cleanAmount,
        tenor: cleanTenor,
        interest_rate: interestRate,
        principal_per_month: 0,
        interest_per_month: 0,
        installment_per_month: 0,
        last_principal: 0,
        total_obligation: 0,
        schedule: [],
      }
    }

    const principalPerMonth = Math.floor(cleanAmount / cleanTenor)
    const interestPerMonth = Math.floor(cleanAmount * interestRate)
    const installmentPerMonth = principalPerMonth + interestPerMonth
    const lastPrincipal = cleanAmount - principalPerMonth * (cleanTenor - 1)
    const totalObligation =
      principalPerMonth * (cleanTenor - 1) + lastPrincipal + interestPerMonth * cleanTenor

    const schedule: LoanInstallmentCalculation[] = []

    for (let i = 1; i <= cleanTenor; i++) {
      const isLast = i === cleanTenor
      const principalAmount = isLast ? lastPrincipal : principalPerMonth
      const totalAmount = principalAmount + interestPerMonth
      const dueDate = calculateDueDate(startDate, i, deductionDay)

      schedule.push({
        installment_number: i,
        due_date: dueDate,
        principal_amount: principalAmount,
        interest_amount: interestPerMonth,
        total_amount: totalAmount,
      })
    }

    return {
      loan_amount: cleanAmount,
      tenor: cleanTenor,
      interest_rate: interestRate,
      principal_per_month: principalPerMonth,
      interest_per_month: interestPerMonth,
      installment_per_month: installmentPerMonth,
      last_principal: lastPrincipal,
      total_obligation: totalObligation,
      schedule,
    }
  },

  /**
   * Retrieves current loan settings from app_settings with intelligent defaults.
   */
  async getLoanSettings(): Promise<LoanSettings> {
    const now = new Date()
    const currentDay = now.getDate()

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await adminClient
          .from('app_settings')
          .select('key, value')
          .in('key', [
            'interest_rate',
            'max_tenor',
            'max_loan',
            'loan_period_start',
            'loan_period_end',
            'loan_deduction_day',
          ])

        if (!error && data && data.length > 0) {
          const settingsMap: Record<string, number> = {}
          data.forEach((item) => {
            const parsed = typeof item.value === 'number' ? item.value : Number(item.value)
            if (!isNaN(parsed)) {
              settingsMap[item.key] = parsed
            }
          })

          const interest_rate = settingsMap.interest_rate ?? DEFAULT_SETTINGS.interest_rate
          const max_tenor = Math.floor(settingsMap.max_tenor ?? DEFAULT_SETTINGS.max_tenor)
          const max_loan = Math.floor(settingsMap.max_loan ?? DEFAULT_SETTINGS.max_loan)
          const loan_period_start = Math.floor(
            settingsMap.loan_period_start ?? DEFAULT_SETTINGS.loan_period_start
          )
          const loan_period_end = Math.floor(
            settingsMap.loan_period_end ?? DEFAULT_SETTINGS.loan_period_end
          )
          const loan_deduction_day = Math.floor(
            settingsMap.loan_deduction_day ?? DEFAULT_SETTINGS.loan_deduction_day
          )

          const is_within_period =
            currentDay >= loan_period_start && currentDay <= loan_period_end

          return {
            interest_rate,
            max_tenor,
            max_loan,
            loan_period_start,
            loan_period_end,
            loan_deduction_day,
            current_day: currentDay,
            is_within_period,
          }
        }
      } catch (err) {
        console.warn('Failed to fetch loan settings from Supabase, using defaults:', err)
      }
    }

    // Mock store / fallback
    const interest_rate = Number(mockStore.settings.interest_rate) || 0.025
    const max_tenor = Number(mockStore.settings.max_tenor) || 4
    const max_loan = Number(mockStore.settings.max_loan) || 10000000
    const loan_period_start = Number(mockStore.settings.loan_period_start) || 8
    const loan_period_end = Number(mockStore.settings.loan_period_end) || 28
    const loan_deduction_day = Number(mockStore.settings.loan_deduction_day) || 5
    const is_within_period = currentDay >= loan_period_start && currentDay <= loan_period_end

    return {
      interest_rate,
      max_tenor,
      max_loan,
      loan_period_start,
      loan_period_end,
      loan_deduction_day,
      current_day: currentDay,
      is_within_period,
    }
  },

  /**
   * Creates a new loan request:
   * - Checks no pending request exists
   * - Validates application period (day 8-28)
   * - Checks if first-time borrower
   * - Handles takeover: checks active loan, validates new_amount > remaining_obligation
   * - Calculates integer amounts
   * - Records audit log
   */
  async createLoanRequest(
    employeeId: string,
    data: CreateLoanRequestInput
  ): Promise<LoanRequest> {
    const settings = await this.getLoanSettings()

    // 1. Check application period
    const currentDay = new Date().getDate()
    if (currentDay < settings.loan_period_start || currentDay > settings.loan_period_end) {
      throw new Error(
        `Pengajuan pinjaman hanya dibuka pada tanggal ${settings.loan_period_start} s/d ${settings.loan_period_end} setiap bulan.`
      )
    }

    // 2. Validate tenor & amount
    const amount = Math.floor(Number(data.loan_amount))
    const tenor = Math.floor(Number(data.tenor))

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pinjaman harus lebih besar dari 0.')
    }
    if (amount > settings.max_loan) {
      throw new Error(
        `Nominal pinjaman maksimal adalah Rp ${settings.max_loan.toLocaleString('id-ID')}.`
      )
    }
    if (isNaN(tenor) || tenor < 1 || tenor > settings.max_tenor) {
      throw new Error(`Tenor pinjaman harus antara 1 sampai ${settings.max_tenor} bulan.`)
    }

    // 3. Check for existing pending request
    if (isSupabaseConfigured()) {
      try {
        const { data: existingPending, error: pendingErr } = await adminClient
          .from('loan_requests')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('status', 'pending')
          .maybeSingle()

        if (!pendingErr && existingPending) {
          throw new Error(
            `Anda masih memiliki permohonan pinjaman yang sedang diproses (${existingPending.id}). Harap tunggu keputusan admin.`
          )
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('masih memiliki permohonan')) {
          throw err
        }
        console.warn('Supabase pending check error, proceeding with fallback:', err)
      }
    } else {
      for (const loan of mockStore.loans.values()) {
        if (loan.employee_id === employeeId && loan.status === 'pending') {
          throw new Error(
            `Anda masih memiliki permohonan pinjaman yang sedang diproses (${loan.id}). Harap tunggu keputusan admin.`
          )
        }
      }
    }

    // 4. Check if first-time borrower
    let isFirstTimeBorrower = true
    if (isSupabaseConfigured()) {
      try {
        const { count, error: countErr } = await adminClient
          .from('loan_requests')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', employeeId)
          .in('status', ['approved', 'completed'])

        if (!countErr && typeof count === 'number' && count > 0) {
          isFirstTimeBorrower = false
        }
      } catch (err) {
        console.warn('Failed to query borrower history:', err)
      }
    } else {
      let pastLoansCount = 0
      for (const loan of mockStore.loans.values()) {
        if (
          loan.employee_id === employeeId &&
          (loan.status === 'approved' || loan.status === 'completed')
        ) {
          pastLoansCount++
        }
      }
      isFirstTimeBorrower = pastLoansCount === 0
    }

    // 5. Active loan and takeover validation
    const activeLoan = await this.getActiveLoan(employeeId)
    const remainingObligation = activeLoan
      ? await this.getRemainingObligation(employeeId)
      : 0

    let previousLoanId: string | null = null
    let previousRemaining: number | null = null
    let netDisbursement = amount

    if (activeLoan && remainingObligation > 0) {
      if (!data.is_takeover) {
        throw new Error(
          `Anda masih memiliki pinjaman aktif (${activeLoan.id}) dengan sisa kewajiban Rp ${remainingObligation.toLocaleString('id-ID')}. Silakan centang opsi Takeover untuk mengajukan pinjaman baru.`
        )
      }

      if (amount <= remainingObligation) {
        throw new Error(
          `Nominal pinjaman baru (Rp ${amount.toLocaleString('id-ID')}) harus lebih besar dari sisa kewajiban pinjaman berjalan (Rp ${remainingObligation.toLocaleString('id-ID')}).`
        )
      }

      previousLoanId = activeLoan.id
      previousRemaining = remainingObligation
      netDisbursement = amount - remainingObligation
    } else if (data.is_takeover) {
      throw new Error(
        'Tidak ditemukan pinjaman aktif yang dapat dilakukan takeover. Silakan ajukan pinjaman biasa.'
      )
    }

    // 6. Calculate full amounts with integer arithmetic
    const calc = this.calculateLoan(
      amount,
      tenor,
      settings.interest_rate,
      new Date(),
      settings.loan_deduction_day
    )

    const loanId = generateId('KOP')
    const nowIso = new Date().toISOString()

    const newRequest: LoanRequest = {
      id: loanId,
      employee_id: employeeId,
      loan_amount: amount,
      tenor,
      interest_per_month: calc.interest_per_month,
      principal_per_month: calc.principal_per_month,
      installment_per_month: calc.installment_per_month,
      total_obligation: calc.total_obligation,
      status: 'pending',
      is_takeover: !!data.is_takeover,
      previous_loan_id: previousLoanId,
      previous_remaining: previousRemaining,
      net_disbursement: netDisbursement,
      processed_by: null,
      processed_at: null,
      admin_notes: null,
      approval_source: null,
      first_time_borrower: isFirstTimeBorrower,
      created_at: nowIso,
    }

    // 7. Insert into database
    if (isSupabaseConfigured()) {
      try {
        const { data: inserted, error: insertErr } = await adminClient
          .from('loan_requests')
          .insert(newRequest)
          .select()
          .single()

        if (insertErr) {
          throw new Error(`Gagal menyimpan pengajuan pinjaman: ${insertErr.message}`)
        }

        // Audit log
        await adminClient.from('audit_logs').insert({
          actor_type: 'employee',
          actor_id: employeeId,
          action: 'create_loan_request',
          target_type: 'loan_requests',
          target_id: inserted.id,
          new_values: inserted as unknown as Json,
          created_at: nowIso,
        })

        return inserted
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Gagal menyimpan')) {
          throw err
        }
        console.warn('Supabase insert failed, falling back to mock store:', err)
      }
    }

    // Mock store insert
    mockStore.loans.set(loanId, newRequest)
    mockStore.auditLogs.push({
      id: generateId('AUD'),
      actor_type: 'employee',
      actor_id: employeeId,
      action: 'create_loan_request',
      target_type: 'loan_requests',
      target_id: loanId,
      new_values: newRequest,
      created_at: nowIso,
    })

    return newRequest
  },

  /**
   * Approves a pending loan request:
   * - Updates status to 'approved'
   * - Generates installment schedule (due dates on 5th of each month starting next month)
   * - If takeover: completes old loan and creates loan_takeover record
   * - Audit log
   */
  async approveLoanRequest(
    requestId: string,
    adminId: string,
    notes?: string,
    source: ApprovalSource = 'panel'
  ): Promise<LoanWithInstallments> {
    const loan = await this.getLoanRequestById(requestId)
    if (!loan) {
      throw new Error(`Permohonan pinjaman ${requestId} tidak ditemukan.`)
    }
    if (loan.status !== 'pending') {
      throw new Error(
        `Permohonan pinjaman ${requestId} tidak dapat disetujui karena berstatus '${loan.status}'.`
      )
    }

    const settings = await this.getLoanSettings()
    const now = new Date()
    const nowIso = now.toISOString()

    // Generate schedule
    const calc = this.calculateLoan(
      loan.loan_amount,
      loan.tenor,
      settings.interest_rate,
      now,
      settings.loan_deduction_day
    )

    const installmentsToInsert: LoanInstallment[] = calc.schedule.map((item) => ({
      id: generateId('INS'),
      loan_id: requestId,
      installment_number: item.installment_number,
      due_date: item.due_date,
      principal_amount: item.principal_amount,
      interest_amount: item.interest_amount,
      total_amount: item.total_amount,
      status: 'scheduled',
      confirmed_at: null,
      confirmed_by: null,
      created_at: nowIso,
    }))

    if (isSupabaseConfigured()) {
      try {
        // 1. Update loan request to approved
        const { error: updateErr } = await adminClient
          .from('loan_requests')
          .update({
            status: 'approved',
            processed_by: adminId,
            processed_at: nowIso,
            admin_notes: notes || null,
            approval_source: source,
          })
          .eq('id', requestId)

        if (updateErr) throw new Error(updateErr.message)

        // 2. Insert installments
        const { data: insertedInstallments, error: instErr } = await adminClient
          .from('loan_installments')
          .insert(installmentsToInsert)
          .select()

        if (instErr) throw new Error(instErr.message)

        // 3. Handle takeover
        if (loan.is_takeover && loan.previous_loan_id) {
          // Complete previous loan
          await adminClient
            .from('loan_requests')
            .update({ status: 'completed' })
            .eq('id', loan.previous_loan_id)

          // Mark remaining scheduled installments of old loan as skipped
          await adminClient
            .from('loan_installments')
            .update({ status: 'skipped' })
            .eq('loan_id', loan.previous_loan_id)
            .eq('status', 'scheduled')

          // Record takeover
          await adminClient.from('loan_takeovers').insert({
            old_loan_id: loan.previous_loan_id,
            new_loan_id: requestId,
            remaining_obligation: loan.previous_remaining || 0,
            settlement_amount: loan.previous_remaining || 0,
            created_at: nowIso,
          })
        }

        // 4. Audit log
        await adminClient.from('audit_logs').insert({
          actor_type: 'admin',
          actor_id: adminId,
          action: 'approve_loan_request',
          target_type: 'loan_requests',
          target_id: requestId,
          old_values: { status: 'pending' },
          new_values: { status: 'approved', admin_notes: notes, approval_source: source },
          created_at: nowIso,
        })

        return {
          ...loan,
          status: 'approved',
          processed_by: adminId,
          processed_at: nowIso,
          admin_notes: notes || null,
          approval_source: source,
          installments: insertedInstallments || installmentsToInsert,
        }
      } catch (err: unknown) {
        console.warn('Supabase approval failed, using fallback:', err)
      }
    }

    // Mock store approval
    const updatedLoan: LoanRequest = {
      ...loan,
      status: 'approved',
      processed_by: adminId,
      processed_at: nowIso,
      admin_notes: notes || null,
      approval_source: source,
    }
    mockStore.loans.set(requestId, updatedLoan)

    installmentsToInsert.forEach((inst) => {
      mockStore.installments.set(inst.id, inst)
    })

    if (loan.is_takeover && loan.previous_loan_id) {
      const old = mockStore.loans.get(loan.previous_loan_id)
      if (old) {
        mockStore.loans.set(loan.previous_loan_id, { ...old, status: 'completed' })
      }
      for (const inst of mockStore.installments.values()) {
        if (inst.loan_id === loan.previous_loan_id && inst.status === 'scheduled') {
          mockStore.installments.set(inst.id, { ...inst, status: 'skipped' })
        }
      }
      mockStore.takeovers.set(generateId('TO'), {
        id: generateId('TO'),
        old_loan_id: loan.previous_loan_id,
        new_loan_id: requestId,
        remaining_obligation: loan.previous_remaining || 0,
        settlement_amount: loan.previous_remaining || 0,
        created_at: nowIso,
      })
    }

    mockStore.auditLogs.push({
      id: generateId('AUD'),
      actor_type: 'admin',
      actor_id: adminId,
      action: 'approve_loan_request',
      target_type: 'loan_requests',
      target_id: requestId,
      old_values: { status: 'pending' },
      new_values: { status: 'approved', notes },
      created_at: nowIso,
    })

    return {
      ...updatedLoan,
      installments: installmentsToInsert,
    }
  },

  /**
   * Rejects a loan request.
   */
  async rejectLoanRequest(
    requestId: string,
    adminId: string,
    notes?: string,
    source: ApprovalSource = 'panel'
  ): Promise<LoanRequest> {
    const loan = await this.getLoanRequestById(requestId)
    if (!loan) throw new Error(`Permohonan ${requestId} tidak ditemukan.`)
    if (loan.status !== 'pending') {
      throw new Error(`Permohonan ${requestId} tidak berstatus pending.`)
    }

    const nowIso = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await adminClient
          .from('loan_requests')
          .update({
            status: 'rejected',
            processed_by: adminId,
            processed_at: nowIso,
            admin_notes: notes || null,
            approval_source: source,
          })
          .eq('id', requestId)
          .select()
          .single()

        if (error) throw new Error(error.message)

        await adminClient.from('audit_logs').insert({
          actor_type: 'admin',
          actor_id: adminId,
          action: 'reject_loan_request',
          target_type: 'loan_requests',
          target_id: requestId,
          old_values: { status: 'pending' },
          new_values: { status: 'rejected', admin_notes: notes },
          created_at: nowIso,
        })

        return updated
      } catch (err) {
        console.warn('Supabase reject failed, using fallback:', err)
      }
    }

    const rejected: LoanRequest = {
      ...loan,
      status: 'rejected',
      processed_by: adminId,
      processed_at: nowIso,
      admin_notes: notes || null,
      approval_source: source,
    }
    mockStore.loans.set(requestId, rejected)
    mockStore.auditLogs.push({
      id: generateId('AUD'),
      actor_type: 'admin',
      actor_id: adminId,
      action: 'reject_loan_request',
      target_type: 'loan_requests',
      target_id: requestId,
      old_values: { status: 'pending' },
      new_values: { status: 'rejected', admin_notes: notes },
      created_at: nowIso,
    })

    return rejected
  },

  /**
   * Cancels a pending loan request by employee.
   */
  async cancelLoanRequest(requestId: string, employeeId: string): Promise<LoanRequest> {
    const loan = await this.getLoanRequestById(requestId)
    if (!loan) throw new Error(`Pengajuan ${requestId} tidak ditemukan.`)

    if (loan.employee_id !== employeeId) {
      throw new Error('Anda tidak memiliki izin untuk membatalkan pengajuan ini.')
    }

    if (loan.status !== 'pending') {
      throw new Error('Hanya pengajuan dengan status pending yang dapat dibatalkan.')
    }

    const nowIso = new Date().toISOString()

    if (isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await adminClient
          .from('loan_requests')
          .update({
            status: 'cancelled',
          })
          .eq('id', requestId)
          .select()
          .single()

        if (error) throw new Error(error.message)

        await adminClient.from('audit_logs').insert({
          actor_type: 'employee',
          actor_id: employeeId,
          action: 'cancel_loan_request',
          target_type: 'loan_requests',
          target_id: requestId,
          old_values: { status: 'pending' },
          new_values: { status: 'cancelled' },
          created_at: nowIso,
        })

        return updated
      } catch (err) {
        console.warn('Supabase cancel failed, using fallback:', err)
      }
    }

    const cancelled: LoanRequest = {
      ...loan,
      status: 'cancelled',
    }
    mockStore.loans.set(requestId, cancelled)
    mockStore.auditLogs.push({
      id: generateId('AUD'),
      actor_type: 'employee',
      actor_id: employeeId,
      action: 'cancel_loan_request',
      target_type: 'loan_requests',
      target_id: requestId,
      old_values: { status: 'pending' },
      new_values: { status: 'cancelled' },
      created_at: nowIso,
    })

    return cancelled
  },

  /**
   * Confirms deduction of an installment:
   * - Updates status to 'confirmed'
   * - Checks if all installments are confirmed -> marks loan 'completed'
   * - Audit log
   */
  async confirmInstallment(
    installmentId: string,
    adminId: string
  ): Promise<{ installment: LoanInstallment; loan_completed: boolean }> {
    const today = new Date().toISOString().split('T')[0]
    const nowIso = new Date().toISOString()

    let installment: LoanInstallment | null = null

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await adminClient
          .from('loan_installments')
          .select('*')
          .eq('id', installmentId)
          .single()

        if (error) throw new Error(error.message)
        installment = data
      } catch (err) {
        console.warn('Supabase fetch installment failed:', err)
      }
    } else {
      installment = mockStore.installments.get(installmentId) || null
    }

    if (!installment) {
      throw new Error(`Data angsuran ${installmentId} tidak ditemukan.`)
    }
    if (installment.status === 'confirmed') {
      throw new Error('Angsuran ini sudah dikonfirmasi sebelumnya.')
    }

    let isLoanCompleted = false

    if (isSupabaseConfigured()) {
      try {
        const { data: updatedInst, error: updErr } = await adminClient
          .from('loan_installments')
          .update({
            status: 'confirmed',
            confirmed_at: today,
            confirmed_by: adminId,
          })
          .eq('id', installmentId)
          .select()
          .single()

        if (updErr) throw new Error(updErr.message)

        // Check if any scheduled installments remain for this loan
        const { count, error: countErr } = await adminClient
          .from('loan_installments')
          .select('id', { count: 'exact', head: true })
          .eq('loan_id', installment.loan_id)
          .eq('status', 'scheduled')

        if (!countErr && (count === 0 || count === null)) {
          isLoanCompleted = true
          await adminClient
            .from('loan_requests')
            .update({ status: 'completed' })
            .eq('id', installment.loan_id)

          await adminClient.from('audit_logs').insert({
            actor_type: 'admin',
            actor_id: adminId,
            action: 'complete_loan',
            target_type: 'loan_requests',
            target_id: installment.loan_id,
            new_values: { status: 'completed' },
            created_at: nowIso,
          })
        }

        await adminClient.from('audit_logs').insert({
          actor_type: 'admin',
          actor_id: adminId,
          action: 'confirm_installment',
          target_type: 'loan_installments',
          target_id: installmentId,
          new_values: { status: 'confirmed', confirmed_at: today, confirmed_by: adminId },
          created_at: nowIso,
        })

        return { installment: updatedInst, loan_completed: isLoanCompleted }
      } catch (err) {
        console.warn('Supabase confirm installment failed, using fallback:', err)
      }
    }

    // Mock store confirm
    const updated: LoanInstallment = {
      ...installment,
      status: 'confirmed',
      confirmed_at: today,
      confirmed_by: adminId,
    }
    mockStore.installments.set(installmentId, updated)

    // Check mock remaining
    let scheduledCount = 0
    for (const inst of mockStore.installments.values()) {
      if (inst.loan_id === installment.loan_id && inst.status === 'scheduled') {
        scheduledCount++
      }
    }

    if (scheduledCount === 0) {
      isLoanCompleted = true
      const loan = mockStore.loans.get(installment.loan_id)
      if (loan) {
        mockStore.loans.set(installment.loan_id, { ...loan, status: 'completed' })
      }
    }

    mockStore.auditLogs.push({
      id: generateId('AUD'),
      actor_type: 'admin',
      actor_id: adminId,
      action: 'confirm_installment',
      target_type: 'loan_installments',
      target_id: installmentId,
      new_values: { status: 'confirmed', confirmed_at: today, confirmed_by: adminId },
      created_at: nowIso,
    })

    return { installment: updated, loan_completed: isLoanCompleted }
  },

  /**
   * Retrieves the employee's current active approved loan with its installment schedule.
   */
  async getActiveLoan(employeeId: string): Promise<LoanWithInstallments | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: loan, error } = await adminClient
          .from('loan_requests')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .maybeSingle()

        if (!error && loan) {
          const { data: installments } = await adminClient
            .from('loan_installments')
            .select('*')
            .eq('loan_id', loan.id)
            .order('installment_number', { ascending: true })

          const list = installments || []
          const confirmedCount = list.filter((i) => i.status === 'confirmed').length
          const remainingObligation = list
            .filter((i) => i.status === 'scheduled')
            .reduce((sum, i) => sum + Number(i.total_amount), 0)
          const nextInstallment = list.find((i) => i.status === 'scheduled') || null

          return {
            ...loan,
            installments: list,
            summary: {
              confirmed_count: confirmedCount,
              total_installments: loan.tenor,
              remaining_obligation:
                list.length > 0 ? remainingObligation : loan.total_obligation,
              next_installment: nextInstallment,
            },
          }
        }
      } catch (err) {
        console.warn('Supabase getActiveLoan error:', err)
      }
    }

    // Mock store
    for (const loan of mockStore.loans.values()) {
      if (loan.employee_id === employeeId && loan.status === 'approved') {
        const list: LoanInstallment[] = []
        for (const inst of mockStore.installments.values()) {
          if (inst.loan_id === loan.id) {
            list.push(inst)
          }
        }
        list.sort((a, b) => a.installment_number - b.installment_number)

        const confirmedCount = list.filter((i) => i.status === 'confirmed').length
        const remainingObligation = list
          .filter((i) => i.status === 'scheduled')
          .reduce((sum, i) => sum + Number(i.total_amount), 0)
        const nextInstallment = list.find((i) => i.status === 'scheduled') || null

        return {
          ...loan,
          installments: list,
          summary: {
            confirmed_count: confirmedCount,
            total_installments: loan.tenor,
            remaining_obligation:
              list.length > 0 ? remainingObligation : loan.total_obligation,
            next_installment: nextInstallment,
          },
        }
      }
    }

    return null
  },

  /**
   * Calculates the remaining unpaid obligation for an employee's active loan.
   */
  async getRemainingObligation(employeeId: string): Promise<number> {
    const activeLoan = await this.getActiveLoan(employeeId)
    if (!activeLoan) return 0
    return activeLoan.summary?.remaining_obligation ?? activeLoan.total_obligation
  },

  /**
   * Retrieves loan request history for an employee.
   */
  async getLoanRequests(
    employeeId: string,
    filters?: { status?: string }
  ): Promise<LoanWithInstallments[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = adminClient
          .from('loan_requests')
          .select('*, loan_installments(*)')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status as LoanStatus)
        }

        const { data, error } = await query
        if (!error && data) {
          return data.map((item) => {
            const installments = ((item.loan_installments as unknown) as LoanInstallment[]) || []
            installments.sort((a, b) => a.installment_number - b.installment_number)
            return {
              ...item,
              installments,
            }
          })
        }
      } catch (err) {
        console.warn('Supabase getLoanRequests error:', err)
      }
    }

    // Mock store
    const results: LoanWithInstallments[] = []
    for (const loan of mockStore.loans.values()) {
      if (loan.employee_id === employeeId) {
        if (!filters?.status || filters.status === 'all' || loan.status === filters.status) {
          const list: LoanInstallment[] = []
          for (const inst of mockStore.installments.values()) {
            if (inst.loan_id === loan.id) {
              list.push(inst)
            }
          }
          list.sort((a, b) => a.installment_number - b.installment_number)
          results.push({
            ...loan,
            installments: list,
          })
        }
      }
    }

    results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return results
  },

  /**
   * Retrieves a single loan request by ID with full installment schedule and details.
   */
  async getLoanRequestById(requestId: string): Promise<LoanWithInstallments | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: loan, error } = await adminClient
          .from('loan_requests')
          .select('*, employees(*), loan_installments(*)')
          .eq('id', requestId)
          .maybeSingle()

        if (!error && loan) {
          const installments = ((loan.loan_installments as unknown) as LoanInstallment[]) || []
          installments.sort((a, b) => a.installment_number - b.installment_number)
          return {
            ...loan,
            employee: loan.employees as Partial<Employee>,
            installments,
          }
        }
      } catch (err) {
        console.warn('Supabase getLoanRequestById error:', err)
      }
    }

    // Mock store
    const loan = mockStore.loans.get(requestId)
    if (!loan) return null

    const list: LoanInstallment[] = []
    for (const inst of mockStore.installments.values()) {
      if (inst.loan_id === loan.id) {
        list.push(inst)
      }
    }
    list.sort((a, b) => a.installment_number - b.installment_number)

    const emp = mockStore.employees.get(loan.employee_id) || undefined

    return {
      ...loan,
      employee: emp,
      installments: list,
    }
  },

  /**
   * Retrieves all loan requests (Admin view) with filtering, search, and pagination.
   */
  async getAllLoanRequests(
    filters?: LoanFilterOptions
  ): Promise<{ data: LoanWithInstallments[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit

    if (isSupabaseConfigured()) {
      try {
        let query = adminClient
          .from('loan_requests')
          .select('*, employees(id, nik, full_name, company_id, site_id), loan_installments(*)', {
            count: 'exact',
          })
          .order('created_at', { ascending: false })

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status as LoanStatus)
        }

        query = query.range(offset, offset + limit - 1)

        const { data, count, error } = await query
        if (!error && data) {
          const mapped = data.map((item) => ({
            ...item,
            employee: item.employees as unknown as Partial<Employee>,
            installments: ((item.loan_installments as unknown) as LoanInstallment[]) || [],
          }))
          return {
            data: mapped,
            total: count || mapped.length,
            page,
            limit,
          }
        }
      } catch (err) {
        console.warn('Supabase getAllLoanRequests error:', err)
      }
    }

    // Mock store
    let all: LoanWithInstallments[] = []
    for (const loan of mockStore.loans.values()) {
      if (!filters?.status || filters.status === 'all' || loan.status === filters.status) {
        const emp = mockStore.employees.get(loan.employee_id) || undefined
        if (filters?.search) {
          const s = filters.search.toLowerCase()
          const matchNik = emp?.nik?.toLowerCase().includes(s)
          const matchName = emp?.full_name?.toLowerCase().includes(s)
          const matchId = loan.id.toLowerCase().includes(s)
          if (!matchNik && !matchName && !matchId) continue
        }

        const list: LoanInstallment[] = []
        for (const inst of mockStore.installments.values()) {
          if (inst.loan_id === loan.id) {
            list.push(inst)
          }
        }
        list.sort((a, b) => a.installment_number - b.installment_number)

        all.push({
          ...loan,
          employee: emp,
          installments: list,
        })
      }
    }

    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = all.length
    const paginated = all.slice(offset, offset + limit)

    return {
      data: paginated,
      total,
      page,
      limit,
    }
  },

  /**
   * Helper to fetch employee profile data for UI auto-fill.
   */
  async getEmployeeProfile(
    employeeId: string
  ): Promise<Partial<Employee> & {
    company_name?: string
    site_name?: string
    department_name?: string
    position_name?: string
  }> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await adminClient
          .from('employees')
          .select('*, companies(name), sites(name), departments(name), positions(name)')
          .eq('id', employeeId)
          .maybeSingle()

        if (!error && data) {
          return {
            ...data,
            company_name: (data as any).companies?.name || 'PT E-Kopi Prima Sejahtera',
            site_name: (data as any).sites?.name || 'Head Office',
            department_name: (data as any).departments?.name || 'Operasional',
            position_name: (data as any).positions?.name || 'Pegawai',
          }
        }
      } catch (err) {
        console.warn('Failed to fetch employee profile from Supabase:', err)
      }
    }

    const mockEmp = mockStore.employees.get(employeeId) || mockStore.employees.get(DEMO_EMPLOYEE_ID)!
    return {
      ...mockEmp,
      company_name: 'PT E-Kopi Prima Sejahtera',
      site_name: 'Head Office Jakarta',
      department_name: 'Security & Operations',
      position_name: 'Anggota Satpam',
    }
  },
}
