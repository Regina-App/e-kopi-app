import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { Employee, LeaveRequest, LoanRequest } from '@/lib/types/database'
import {
  otpTemplate,
  registrationTemplate,
  leaveApprovalEmailTemplate,
  leaveStatusTemplate,
  loanApprovalEmailTemplate,
  loanStatusTemplate,
} from './email-templates'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface SendMailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

/**
 * Creates and caches the nodemailer transporter
 */
let cachedTransporter: Transporter | null = null

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return false
  if (user === 'your_email' || pass === 'your_app_password') return false
  if (host.includes('placeholder')) return false

  return true
}

export function getEmailTransporter(): Transporter | null {
  if (!isSmtpConfigured()) {
    return null
  }

  if (cachedTransporter) {
    return cachedTransporter
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const isSecure = port === 465

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  return cachedTransporter
}

/**
 * Core sendEmail helper with console fallback
 */
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fromEmail = process.env.EMAIL_FROM || 'noreply@ekopi.app'
  const from = `"E-KOPI By Regina - App" <${fromEmail}>`
  const transporter = getEmailTransporter()

  if (!transporter) {
    console.info(`[EmailService:Fallback] SMTP not configured. Simulating email dispatch:`)
    console.info(`[EmailService:To] ${Array.isArray(to) ? to.join(', ') : to}`)
    console.info(`[EmailService:Subject] ${subject}`)
    if (attachments && attachments.length > 0) {
      console.info(`[EmailService:Attachments] ${attachments.map((a) => a.filename).join(', ')}`)
    }
    return { success: true, messageId: `mock-email-${Date.now()}` }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })

    return { success: true, messageId: info.messageId }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown SMTP error'
    console.error(`[EmailService:Error] Failed to send email to ${to}:`, errMsg)
    return { success: false, error: errMsg }
  }
}

/**
 * 1. sendOTP(to, otp, name?)
 */
export async function sendOTP(to: string, otp: string, name?: string) {
  const html = otpTemplate(otp, name)
  return sendEmail({
    to,
    subject: `[E-KOPI] Kode Verifikasi OTP: ${otp}`,
    html,
  })
}

/**
 * 2. sendRegistrationNotification(adminEmail, employee)
 */
export async function sendRegistrationNotification(
  adminEmail: string,
  employee: Partial<Employee>
) {
  const html = registrationTemplate(employee, 'notification')
  return sendEmail({
    to: adminEmail,
    subject: `[E-KOPI] Registrasi Karyawan Baru: ${employee.full_name || 'Karyawan'} (${employee.nik || '-'})`,
    html,
  })
}

/**
 * 3. sendRegistrationApproved(employee)
 */
export async function sendRegistrationApproved(employee: Partial<Employee>) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = registrationTemplate(employee, 'approved')
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pendaftaran Akun Disetujui`,
    html,
  })
}

/**
 * 4. sendRegistrationRejected(employee, reason)
 */
export async function sendRegistrationRejected(employee: Partial<Employee>, reason?: string) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = registrationTemplate(employee, 'rejected', reason)
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pemberitahuan Status Pendaftaran Akun`,
    html,
  })
}

/**
 * 5. sendLeaveSubmitted(employee, leaveRequest)
 */
export async function sendLeaveSubmitted(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = leaveStatusTemplate(employee, leaveRequest, 'submitted')
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Konfirmasi Pengajuan Cuti (${leaveRequest.id})`,
    html,
  })
}

/**
 * 6. sendLeaveApprovalRequest(adminEmail, employee, leaveRequest, approveToken, rejectToken)
 */
export async function sendLeaveApprovalRequest(
  adminEmail: string,
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>,
  approveToken: string,
  rejectToken: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const approveUrl = `${baseUrl}/api/email-approval?token=${approveToken}&action=approve`
  const rejectUrl = `${baseUrl}/api/email-approval?token=${rejectToken}&action=reject`

  const html = leaveApprovalEmailTemplate(employee, leaveRequest, approveUrl, rejectUrl)
  return sendEmail({
    to: adminEmail,
    subject: `[E-KOPI Permohonan Cuti] ${employee.full_name || 'Karyawan'} - ${leaveRequest.total_days || 0} Hari`,
    html,
  })
}

/**
 * 7. sendLeaveApproved(employee, leaveRequest, pdfBuffer)
 */
export async function sendLeaveApproved(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>,
  pdfBuffer?: Buffer | string
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = leaveStatusTemplate(employee, leaveRequest, 'approved')

  const attachments: EmailAttachment[] = []
  if (pdfBuffer) {
    attachments.push({
      filename: `Surat-Cuti-${leaveRequest.id || 'EKopi'}.html`,
      content: pdfBuffer,
      contentType: 'text/html',
    })
  }

  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Surat Permohonan Cuti Disetujui (${leaveRequest.id})`,
    html,
    attachments,
  })
}

/**
 * 8. sendLeaveRejected(employee, leaveRequest, reason)
 */
export async function sendLeaveRejected(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>,
  reason?: string
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = leaveStatusTemplate(employee, leaveRequest, 'rejected', reason)
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pengajuan Cuti Ditolak (${leaveRequest.id})`,
    html,
  })
}

/**
 * 9. sendLeaveCancelled(employee, leaveRequest)
 */
export async function sendLeaveCancelled(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = leaveStatusTemplate(employee, leaveRequest, 'cancelled')
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pembatalan Pengajuan Cuti (${leaveRequest.id})`,
    html,
  })
}

/**
 * 10. sendLoanSubmitted(employee, loanRequest)
 */
export async function sendLoanSubmitted(
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = loanStatusTemplate(employee, loanRequest, 'submitted')
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Konfirmasi Pengajuan Pinjaman (${loanRequest.id})`,
    html,
  })
}

/**
 * 11. sendLoanApprovalRequest(adminEmail, employee, loanRequest, tokens)
 */
export async function sendLoanApprovalRequest(
  adminEmail: string,
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>,
  tokens: { approveToken: string; rejectToken: string } | string,
  rejectTokenOptional?: string
) {
  const approveToken = typeof tokens === 'string' ? tokens : tokens.approveToken
  const rejectToken = typeof tokens === 'string' ? rejectTokenOptional || '' : tokens.rejectToken

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const approveUrl = `${baseUrl}/api/email-approval?token=${approveToken}&action=approve`
  const rejectUrl = `${baseUrl}/api/email-approval?token=${rejectToken}&action=reject`

  const html = loanApprovalEmailTemplate(employee, loanRequest, approveUrl, rejectUrl)
  return sendEmail({
    to: adminEmail,
    subject: `[E-KOPI Pinjaman Koperasi] ${employee.full_name || 'Karyawan'} - ID ${loanRequest.id}`,
    html,
  })
}

/**
 * 12. sendLoanApproved(employee, loanRequest)
 */
export async function sendLoanApproved(
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = loanStatusTemplate(employee, loanRequest, 'approved')
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pengajuan Pinjaman Disetujui (${loanRequest.id})`,
    html,
  })
}

/**
 * 13. sendLoanRejected(employee, loanRequest, reason)
 */
export async function sendLoanRejected(
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>,
  reason?: string
) {
  if (!employee.email) return { success: false, error: 'Email karyawan tidak tersedia' }
  const html = loanStatusTemplate(employee, loanRequest, 'rejected', undefined, reason)
  return sendEmail({
    to: employee.email,
    subject: `[E-KOPI] Pengajuan Pinjaman Ditolak (${loanRequest.id})`,
    html,
  })
}
