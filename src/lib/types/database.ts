export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ==============================================================================
// ENUM TYPES
// ==============================================================================

export type AdminRole = 'super_admin' | 'admin'

export type EmployeeStatus = 'pending' | 'approved' | 'rejected'

export type OtpChannel = 'email' | 'sms'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type LeaveBalanceType =
  | 'allocation'
  | 'usage'
  | 'reservation'
  | 'release'
  | 'accumulation'

export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export type LoanInstallmentStatus = 'scheduled' | 'confirmed' | 'skipped'

export type ApprovalSource = 'panel' | 'email'

export type RequestType = 'leave' | 'loan'

export type ApprovalAction = 'approve' | 'reject'

export type ActorType = 'employee' | 'admin' | 'system'

export type AdminPermissionKey =
  | 'dashboard'
  | 'pengajuan_cuti'
  | 'pengajuan_koperasi'
  | 'riwayat'
  | 'database_karyawan'
  | 'kuota_cuti'
  | 'import_export'
  | 'laporan'
  | 'pengaturan_koperasi'
  | 'master_perusahaan'
  | 'pengaturan_surat'
  | 'email'
  | 'audit_log'
  | 'manajemen_admin'

// ==============================================================================
// TABLE ROW TYPES
// ==============================================================================

export interface Company {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Site {
  id: string
  name: string
  company_id: string | null
  is_active: boolean
  created_at: string
}

export interface Department {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Position {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Crew {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Admin {
  id: string
  name: string
  email: string
  pin_hash: string
  role: AdminRole
  is_active: boolean
  force_pin_change: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  nik: string
  full_name: string
  birth_place: string | null
  birth_date: string | null
  address: string | null
  email: string | null
  phone: string | null
  company_id: string | null
  site_id: string | null
  department_id: string | null
  position_id: string | null
  is_crew_member: boolean
  crew_id: string | null
  start_date: string
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
  status: EmployeeStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface AdminPermission {
  id: string
  admin_id: string
  permission_key: AdminPermissionKey | string
  granted: boolean
}

export interface Session {
  id: string
  employee_id: string
  refresh_token_hash: string
  expires_at: string
  is_revoked: boolean
  device_info: string | null
  created_at: string
}

export interface OtpCode {
  id: string
  employee_id: string
  code_hash: string
  channel: OtpChannel
  target: string
  attempts: number
  expires_at: string
  is_used: boolean
  created_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  selected_dates: Json
  total_days: number
  reason: string
  emergency_contact: string
  status: LeaveStatus
  processed_by: string | null
  processed_at: string | null
  admin_notes: string | null
  approval_source: ApprovalSource | null
  verification_code: string | null
  year: number
  created_at: string
}

export interface LeaveBalanceLedger {
  id: string
  employee_id: string
  year: number
  type: LeaveBalanceType
  amount: number
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_by: string | null
  created_at: string
}

export interface LoanRequest {
  id: string
  employee_id: string
  loan_amount: number
  tenor: number
  interest_per_month: number
  principal_per_month: number
  installment_per_month: number
  total_obligation: number
  status: LoanStatus
  is_takeover: boolean
  previous_loan_id: string | null
  previous_remaining: number | null
  net_disbursement: number | null
  processed_by: string | null
  processed_at: string | null
  admin_notes: string | null
  approval_source: ApprovalSource | null
  first_time_borrower: boolean
  created_at: string
}

export interface LoanInstallment {
  id: string
  loan_id: string
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
  status: LoanInstallmentStatus
  confirmed_at: string | null
  confirmed_by: string | null
  created_at: string
}

export interface LoanTakeover {
  id: string
  old_loan_id: string
  new_loan_id: string
  remaining_obligation: number
  settlement_amount: number
  created_at: string
}

export interface LeaveLetter {
  id: string
  leave_request_id: string
  file_path: string | null
  snapshot_data: Json | null
  generated_at: string
}

export interface EmailApprovalToken {
  id: string
  request_type: RequestType
  request_id: string
  token: string
  action: ApprovalAction
  is_used: boolean
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_type: ActorType
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AppSetting {
  key: string
  value: Json
  updated_at: string
  updated_by: string | null
}

// ==============================================================================
// INSERT TYPES
// ==============================================================================

export interface CompanyInsert {
  id?: string
  name: string
  is_active?: boolean
  created_at?: string
}

export interface SiteInsert {
  id?: string
  name: string
  company_id?: string | null
  is_active?: boolean
  created_at?: string
}

export interface DepartmentInsert {
  id?: string
  name: string
  is_active?: boolean
  created_at?: string
}

export interface PositionInsert {
  id?: string
  name: string
  is_active?: boolean
  created_at?: string
}

export interface CrewInsert {
  id?: string
  name: string
  is_active?: boolean
  created_at?: string
}

export interface AdminInsert {
  id?: string
  name: string
  email: string
  pin_hash: string
  role: AdminRole
  is_active?: boolean
  force_pin_change?: boolean
  created_at?: string
  updated_at?: string
}

export interface EmployeeInsert {
  id?: string
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
  status?: EmployeeStatus
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
  is_active?: boolean
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface AdminPermissionInsert {
  id?: string
  admin_id: string
  permission_key: AdminPermissionKey | string
  granted?: boolean
}

export interface SessionInsert {
  id?: string
  employee_id: string
  refresh_token_hash: string
  expires_at: string
  is_revoked?: boolean
  device_info?: string | null
  created_at?: string
}

export interface OtpCodeInsert {
  id?: string
  employee_id: string
  code_hash: string
  channel: OtpChannel
  target: string
  attempts?: number
  expires_at: string
  is_used?: boolean
  created_at?: string
}

export interface LeaveRequestInsert {
  id?: string
  employee_id: string
  selected_dates: Json
  total_days: number
  reason: string
  emergency_contact: string
  status?: LeaveStatus
  processed_by?: string | null
  processed_at?: string | null
  admin_notes?: string | null
  approval_source?: ApprovalSource | null
  verification_code?: string | null
  year: number
  created_at?: string
}

export interface LeaveBalanceLedgerInsert {
  id?: string
  employee_id: string
  year: number
  type: LeaveBalanceType
  amount: number
  reference_type?: string | null
  reference_id?: string | null
  description?: string | null
  created_by?: string | null
  created_at?: string
}

export interface LoanRequestInsert {
  id?: string
  employee_id: string
  loan_amount: number
  tenor: number
  interest_per_month: number
  principal_per_month: number
  installment_per_month: number
  total_obligation: number
  status?: LoanStatus
  is_takeover?: boolean
  previous_loan_id?: string | null
  previous_remaining?: number | null
  net_disbursement?: number | null
  processed_by?: string | null
  processed_at?: string | null
  admin_notes?: string | null
  approval_source?: ApprovalSource | null
  first_time_borrower?: boolean
  created_at?: string
}

export interface LoanInstallmentInsert {
  id?: string
  loan_id: string
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
  status?: LoanInstallmentStatus
  confirmed_at?: string | null
  confirmed_by?: string | null
  created_at?: string
}

export interface LoanTakeoverInsert {
  id?: string
  old_loan_id: string
  new_loan_id: string
  remaining_obligation: number
  settlement_amount: number
  created_at?: string
}

export interface LeaveLetterInsert {
  id?: string
  leave_request_id: string
  file_path?: string | null
  snapshot_data?: Json | null
  generated_at?: string
}

export interface EmailApprovalTokenInsert {
  id?: string
  request_type: RequestType
  request_id: string
  token: string
  action: ApprovalAction
  is_used?: boolean
  expires_at: string
  used_at?: string | null
  used_by?: string | null
  created_at?: string
}

export interface AuditLogInsert {
  id?: string
  actor_type: ActorType
  actor_id?: string | null
  action: string
  target_type?: string | null
  target_id?: string | null
  old_values?: Json | null
  new_values?: Json | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
}

export interface AppSettingInsert {
  key: string
  value: Json
  updated_at?: string
  updated_by?: string | null
}

// ==============================================================================
// UPDATE TYPES (Partial of Insert)
// ==============================================================================

export type CompanyUpdate = Partial<CompanyInsert>
export type SiteUpdate = Partial<SiteInsert>
export type DepartmentUpdate = Partial<DepartmentInsert>
export type PositionUpdate = Partial<PositionInsert>
export type CrewUpdate = Partial<CrewInsert>
export type AdminUpdate = Partial<AdminInsert>
export type EmployeeUpdate = Partial<EmployeeInsert>
export type AdminPermissionUpdate = Partial<AdminPermissionInsert>
export type SessionUpdate = Partial<SessionInsert>
export type OtpCodeUpdate = Partial<OtpCodeInsert>
export type LeaveRequestUpdate = Partial<LeaveRequestInsert>
export type LeaveBalanceLedgerUpdate = Partial<LeaveBalanceLedgerInsert>
export type LoanRequestUpdate = Partial<LoanRequestInsert>
export type LoanInstallmentUpdate = Partial<LoanInstallmentInsert>
export type LoanTakeoverUpdate = Partial<LoanTakeoverInsert>
export type LeaveLetterUpdate = Partial<LeaveLetterInsert>
export type EmailApprovalTokenUpdate = Partial<EmailApprovalTokenInsert>
export type AuditLogUpdate = Partial<AuditLogInsert>
export type AppSettingUpdate = Partial<AppSettingInsert>

type RecordRow<T> = { [K in keyof T]: T[K] }

// ==============================================================================
// DATABASE SCHEMA DEFINITION FOR SUPABASE CLIENT
// ==============================================================================

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: RecordRow<Company>
        Insert: RecordRow<CompanyInsert>
        Update: RecordRow<CompanyUpdate>
        Relationships: []
      }
      sites: {
        Row: RecordRow<Site>
        Insert: RecordRow<SiteInsert>
        Update: RecordRow<SiteUpdate>
        Relationships: []
      }
      departments: {
        Row: RecordRow<Department>
        Insert: RecordRow<DepartmentInsert>
        Update: RecordRow<DepartmentUpdate>
        Relationships: []
      }
      positions: {
        Row: RecordRow<Position>
        Insert: RecordRow<PositionInsert>
        Update: RecordRow<PositionUpdate>
        Relationships: []
      }
      crews: {
        Row: RecordRow<Crew>
        Insert: RecordRow<CrewInsert>
        Update: RecordRow<CrewUpdate>
        Relationships: []
      }
      admins: {
        Row: RecordRow<Admin>
        Insert: RecordRow<AdminInsert>
        Update: RecordRow<AdminUpdate>
        Relationships: []
      }
      employees: {
        Row: RecordRow<Employee>
        Insert: RecordRow<EmployeeInsert>
        Update: RecordRow<EmployeeUpdate>
        Relationships: []
      }
      admin_permissions: {
        Row: RecordRow<AdminPermission>
        Insert: RecordRow<AdminPermissionInsert>
        Update: RecordRow<AdminPermissionUpdate>
        Relationships: []
      }
      sessions: {
        Row: RecordRow<Session>
        Insert: RecordRow<SessionInsert>
        Update: RecordRow<SessionUpdate>
        Relationships: []
      }
      otp_codes: {
        Row: RecordRow<OtpCode>
        Insert: RecordRow<OtpCodeInsert>
        Update: RecordRow<OtpCodeUpdate>
        Relationships: []
      }
      leave_requests: {
        Row: RecordRow<LeaveRequest>
        Insert: RecordRow<LeaveRequestInsert>
        Update: RecordRow<LeaveRequestUpdate>
        Relationships: []
      }
      leave_balance_ledger: {
        Row: RecordRow<LeaveBalanceLedger>
        Insert: RecordRow<LeaveBalanceLedgerInsert>
        Update: RecordRow<LeaveBalanceLedgerUpdate>
        Relationships: []
      }
      loan_requests: {
        Row: RecordRow<LoanRequest>
        Insert: RecordRow<LoanRequestInsert>
        Update: RecordRow<LoanRequestUpdate>
        Relationships: []
      }
      loan_installments: {
        Row: RecordRow<LoanInstallment>
        Insert: RecordRow<LoanInstallmentInsert>
        Update: RecordRow<LoanInstallmentUpdate>
        Relationships: []
      }
      loan_takeovers: {
        Row: RecordRow<LoanTakeover>
        Insert: RecordRow<LoanTakeoverInsert>
        Update: RecordRow<LoanTakeoverUpdate>
        Relationships: []
      }
      leave_letters: {
        Row: RecordRow<LeaveLetter>
        Insert: RecordRow<LeaveLetterInsert>
        Update: RecordRow<LeaveLetterUpdate>
        Relationships: []
      }
      email_approval_tokens: {
        Row: RecordRow<EmailApprovalToken>
        Insert: RecordRow<EmailApprovalTokenInsert>
        Update: RecordRow<EmailApprovalTokenUpdate>
        Relationships: []
      }
      audit_logs: {
        Row: RecordRow<AuditLog>
        Insert: RecordRow<AuditLogInsert>
        Update: RecordRow<AuditLogUpdate>
        Relationships: []
      }
      app_settings: {
        Row: RecordRow<AppSetting>
        Insert: RecordRow<AppSettingInsert>
        Update: RecordRow<AppSettingUpdate>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_leave_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_loan_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      admin_role: AdminRole
      employee_status: EmployeeStatus
      otp_channel: OtpChannel
      leave_status: LeaveStatus
      leave_balance_type: LeaveBalanceType
      loan_status: LoanStatus
      loan_installment_status: LoanInstallmentStatus
      approval_source: ApprovalSource
      request_type: RequestType
      approval_action: ApprovalAction
      actor_type: ActorType
    }
  }
}
