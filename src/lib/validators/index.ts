import { z } from "zod"

/**
 * Validation schema for employee login with NIK
 */
export const loginSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus 16 digit angka"),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Validation schema for OTP verification
 */
export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Kode OTP harus 6 digit")
    .regex(/^\d{6}$/, "Kode OTP harus 6 digit"),
})

export type OtpInput = z.infer<typeof otpSchema>

/**
 * Validation schema for employee registration / onboarding
 */
export const registerEmployeeSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  full_name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  birth_place: z.string().min(1, "Tempat lahir wajib diisi"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, "Format nomor telepon tidak valid"),
  company_id: z.string().uuid("ID Perusahaan tidak valid"),
  site_id: z.string().uuid("ID Site tidak valid"),
  department_id: z.string().uuid("ID Departemen tidak valid"),
  position_id: z.string().uuid("ID Jabatan tidak valid"),
  is_crew_member: z.boolean(),
  crew_id: z.string().uuid("ID Regu tidak valid").optional().nullable(),
  start_date: z.string().min(1, "Tanggal mulai kerja wajib diisi"),
  bank_name: z.string().min(1, "Nama bank wajib diisi"),
  account_number: z
    .string()
    .min(10, "Nomor rekening minimal 10 digit")
    .regex(/^\d+$/, "Nomor rekening hanya boleh berisi angka"),
  account_holder: z.string().min(3, "Nama pemilik rekening minimal 3 karakter"),
})

export type RegisterEmployeeInput = z.infer<typeof registerEmployeeSchema>

/**
 * Validation schema for employee leave requests
 */
export const leaveRequestSchema = z.object({
  selected_dates: z
    .array(z.string())
    .min(1, "Pilih minimal 1 tanggal cuti"),
  reason: z.string().min(10, "Alasan cuti minimal 10 karakter"),
  emergency_contact: z.string().min(10, "Kontak darurat minimal 10 karakter"),
})

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>

/**
 * Validation schema for employee cooperative loan requests
 */
export const loanRequestSchema = z.object({
  loan_amount: z
    .number()
    .min(500000, "Jumlah pinjaman minimal Rp 500.000"),
  tenor: z
    .number()
    .min(1, "Tenor pinjaman minimal 1 bulan")
    .max(12, "Tenor pinjaman maksimal 12 bulan"),
})

export type LoanRequestInput = z.infer<typeof loanRequestSchema>

/**
 * Validation schema for admin login
 */
export const adminLoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  pin: z
    .string()
    .length(4, "PIN harus 4 digit")
    .regex(/^\d{4}$/, "PIN harus 4 digit angka"),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

/**
 * Validation schema for changing admin PIN
 */
export const changePinSchema = z
  .object({
    current_pin: z
      .string()
      .length(4, "PIN saat ini harus 4 digit")
      .regex(/^\d{4}$/, "PIN saat ini harus 4 digit angka"),
    new_pin: z
      .string()
      .length(4, "PIN baru harus 4 digit")
      .regex(/^\d{4}$/, "PIN baru harus 4 digit angka"),
    confirm_pin: z
      .string()
      .length(4, "Konfirmasi PIN harus 4 digit")
      .regex(/^\d{4}$/, "Konfirmasi PIN harus 4 digit angka"),
  })
  .refine((data) => data.new_pin === data.confirm_pin, {
    message: "Konfirmasi PIN tidak cocok",
    path: ["confirm_pin"],
  })

export type ChangePinInput = z.infer<typeof changePinSchema>

/**
 * Validation schema for master data entities (company, site, department, position, crew)
 */
export const masterDataSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
})

export type MasterDataInput = z.infer<typeof masterDataSchema>

/**
 * Validation schema for employee leave quota
 */
export const leaveQuotaSchema = z.object({
  employee_id: z.string().uuid("ID Pegawai tidak valid"),
  year: z.number().min(2020, "Tahun minimal 2020"),
  amount: z.number().min(0, "Jumlah kuota minimal 0"),
})

export type LeaveQuotaInput = z.infer<typeof leaveQuotaSchema>

/**
 * Validation schema for admin approval or rejection action
 */
export const approvalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
})

export type ApprovalInput = z.infer<typeof approvalSchema>
