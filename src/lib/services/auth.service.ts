import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOTP } from '@/lib/utils'
import {
  SESSION_DURATION_DAYS,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
} from '@/lib/constants'
import { logAction, AUDIT_ACTIONS } from './audit.service'
import { getEmployeeProfile } from './employee.service'
import type { Session, Employee } from '@/lib/types/database'

export const AUTH_COOKIE_NAME = 'ekopi_session'

export function maskEmail(email: string | null | undefined): string {
  if (!email) return ''
  const [user, domain] = email.split('@')
  if (!domain) return email
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length < 8) return phone
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Login with NIK:
 * Check if employee exists and is approved, generate OTP, store hashed OTP, return employee info
 */
export async function loginWithNIK(
  nik: string,
  context?: { ipAddress?: string; userAgent?: string }
) {
  const admin = createAdminClient()
  const cleanNIK = nik.trim().replace(/\s+/g, '')

  // Fetch employee
  const { data: employee, error: empError } = await admin
    .from('employees')
    .select('*')
    .eq('nik', cleanNIK)
    .eq('is_deleted', false)
    .maybeSingle()

  if (empError) {
    console.error('[AuthService] Error querying employee:', empError.message)
    return { success: false, error: 'Terjadi kesalahan sistem saat mencari data pegawai' }
  }

  if (!employee) {
    return {
      success: false,
      error: 'NIK tidak ditemukan dalam sistem. Pastikan Anda sudah terdaftar.',
    }
  }

  if (employee.status === 'pending') {
    return {
      success: false,
      error: 'Pendaftaran Anda masih dalam status Menunggu Persetujuan admin.',
    }
  }

  if (employee.status === 'rejected') {
    return {
      success: false,
      error: `Pendaftaran Anda ditolak.${employee.rejection_reason ? ` Alasan: ${employee.rejection_reason}` : ''}`,
    }
  }

  if (!employee.is_active) {
    return {
      success: false,
      error: 'Akun Anda berstatus non-aktif. Silakan hubungi bagian HR / Administrator.',
    }
  }

  // Generate 6-digit OTP
  const rawOtp = generateOTP()
  const hashedOtp = hashValue(rawOtp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()
  const target = employee.email || employee.phone || cleanNIK

  // Invalidate any active unused OTPs for this employee
  await admin
    .from('otp_codes')
    .update({ is_used: true })
    .eq('employee_id', employee.id)
    .eq('is_used', false)

  // Insert new OTP record
  const { error: otpError } = await admin.from('otp_codes').insert({
    employee_id: employee.id,
    code_hash: hashedOtp,
    channel: 'email',
    target,
    attempts: 0,
    expires_at: expiresAt,
    is_used: false,
  })

  if (otpError) {
    console.error('[AuthService] Error storing OTP:', otpError.message)
    return { success: false, error: 'Gagal membuat kode verifikasi OTP' }
  }

  // In Phase 2: Log OTP to console (email delivery will be added in Phase 6)
  console.log('='.repeat(60))
  console.log(`[E-KOPI OTP AUTH] Pegawai: ${employee.full_name} (NIK: ${employee.nik})`)
  console.log(`[E-KOPI OTP AUTH] Target: ${target}`)
  console.log(`[E-KOPI OTP AUTH] KODE OTP: ${rawOtp}`)
  console.log(`[E-KOPI OTP AUTH] Berlaku hingga: ${expiresAt}`)
  console.log('='.repeat(60))

  // Audit log
  await logAction({
    actorType: 'employee',
    actorId: employee.id,
    action: AUDIT_ACTIONS.REQUEST_OTP,
    targetType: 'employee',
    targetId: employee.id,
    newValues: { target, expires_at: expiresAt },
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  })

  return {
    success: true,
    message: 'Kode OTP telah dikirim ke email/telepon terdaftar Anda',
    employeeId: employee.id,
    maskedEmail: maskEmail(employee.email),
    maskedPhone: maskPhone(employee.phone),
  }
}

/**
 * Verify OTP code against hash and create 30-day session
 */
export async function verifyOTP(
  employeeId: string,
  code: string,
  context?: { deviceInfo?: string; ipAddress?: string; userAgent?: string }
) {
  const admin = createAdminClient()
  const cleanCode = code.trim()

  // Find latest active OTP
  const { data: otp, error: otpError } = await admin
    .from('otp_codes')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError || !otp) {
    return {
      success: false,
      error: 'Kode OTP tidak ditemukan atau sudah pernah digunakan. Silakan minta kode baru.',
    }
  }

  // Check attempts
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await admin.from('otp_codes').update({ is_used: true }).eq('id', otp.id)
    return {
      success: false,
      error: 'Batas maksimum percobaan OTP telah tercapai. Silakan minta kode baru.',
    }
  }

  // Check expiration
  if (new Date(otp.expires_at) < new Date()) {
    await admin.from('otp_codes').update({ is_used: true }).eq('id', otp.id)
    return {
      success: false,
      error: 'Kode OTP telah kedaluwarsa. Silakan minta kode verifikasi baru.',
    }
  }

  // Verify hash
  const inputHash = hashValue(cleanCode)
  if (inputHash !== otp.code_hash) {
    const nextAttempts = otp.attempts + 1
    await admin
      .from('otp_codes')
      .update({ attempts: nextAttempts })
      .eq('id', otp.id)

    const remaining = OTP_MAX_ATTEMPTS - nextAttempts
    return {
      success: false,
      error: `Kode OTP salah.${remaining > 0 ? ` Sisa percobaan: ${remaining} kali.` : ' Batas percobaan habis.'}`,
    }
  }

  // Mark OTP as used
  await admin.from('otp_codes').update({ is_used: true }).eq('id', otp.id)

  // Fetch employee
  const employee = await getEmployeeProfile(employeeId)
  if (!employee) {
    return { success: false, error: 'Data pegawai tidak ditemukan' }
  }

  // Create session
  const sessionResult = await createSession(employeeId, context?.deviceInfo)
  if (!sessionResult.success || !sessionResult.sessionToken) {
    return { success: false, error: sessionResult.error || 'Gagal membuat sesi login' }
  }

  // Audit log
  await logAction({
    actorType: 'employee',
    actorId: employeeId,
    action: AUDIT_ACTIONS.VERIFY_OTP,
    targetType: 'employee',
    targetId: employeeId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  })

  await logAction({
    actorType: 'employee',
    actorId: employeeId,
    action: AUDIT_ACTIONS.LOGIN,
    targetType: 'session',
    targetId: sessionResult.sessionId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  })

  return {
    success: true,
    sessionToken: sessionResult.sessionToken,
    sessionId: sessionResult.sessionId,
    expiresAt: sessionResult.expiresAt,
    employee,
  }
}

/**
 * Create a new 30-day session in database
 */
export async function createSession(employeeId: string, deviceInfo?: string) {
  const admin = createAdminClient()
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashValue(rawToken)
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: session, error } = await admin
    .from('sessions')
    .insert({
      employee_id: employeeId,
      refresh_token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
      device_info: deviceInfo || null,
    })
    .select()
    .single()

  if (error || !session) {
    console.error('[AuthService] Error creating session:', error?.message)
    return { success: false, error: 'Gagal membuat sesi pengguna' }
  }

  const sessionToken = `${session.id}.${rawToken}`

  return {
    success: true,
    sessionId: session.id,
    sessionToken,
    expiresAt: session.expires_at,
  }
}

/**
 * Validate session token or sessionId:
 * Checks if session exists, not revoked, and not expired
 */
export async function validateSession(tokenOrId: string) {
  if (!tokenOrId) {
    return { valid: false, error: 'Token sesi tidak ditemukan' }
  }

  const admin = createAdminClient()
  let sessionId = tokenOrId
  let rawToken: string | null = null

  if (tokenOrId.includes('.')) {
    const parts = tokenOrId.split('.')
    sessionId = parts[0]
    rawToken = parts[1]
  }

  const { data: session, error } = await admin
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (error || !session) {
    return { valid: false, error: 'Sesi tidak ditemukan' }
  }

  if (session.is_revoked) {
    return { valid: false, error: 'Sesi telah dicabut (revoked)' }
  }

  if (new Date(session.expires_at) < new Date()) {
    return { valid: false, error: 'Sesi telah kedaluwarsa' }
  }

  if (rawToken) {
    const expectedHash = hashValue(rawToken)
    if (expectedHash !== session.refresh_token_hash) {
      return { valid: false, error: 'Token sesi tidak valid' }
    }
  }

  return { valid: true, session }
}

/**
 * Revoke a single session
 */
export async function revokeSession(sessionId: string) {
  const admin = createAdminClient()
  const cleanId = sessionId.includes('.') ? sessionId.split('.')[0] : sessionId

  const { error } = await admin
    .from('sessions')
    .update({ is_revoked: true })
    .eq('id', cleanId)

  if (error) {
    console.error('[AuthService] Error revoking session:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Revoke all active sessions for an employee
 */
export async function revokeAllSessions(employeeId: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('sessions')
    .update({ is_revoked: true })
    .eq('employee_id', employeeId)

  if (error) {
    console.error('[AuthService] Error revoking all sessions:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Logout: Revoke session, clear cookie, and audit log
 */
export async function logout(sessionId?: string, context?: { ipAddress?: string; userAgent?: string }) {
  try {
    let targetSessionId = sessionId

    if (!targetSessionId) {
      const cookieStore = await cookies()
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
      if (token) {
        targetSessionId = token.includes('.') ? token.split('.')[0] : token
      }
    }

    if (targetSessionId) {
      await revokeSession(targetSessionId)
      await logAction({
        actorType: 'employee',
        action: AUDIT_ACTIONS.LOGOUT,
        targetType: 'session',
        targetId: targetSessionId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      })
    }

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_NAME)

    return { success: true }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err
    }
    const errorMsg = err instanceof Error ? err.message : 'Logout error'
    console.error('[AuthService] Error during logout:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Extract session token from cookie, validate session, and return employee data
 */
export async function getEmployeeFromSession(request?: NextRequest | Request) {
  try {
    let sessionToken: string | undefined

    if (request && 'cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
      sessionToken = (request as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value
    } else {
      const cookieStore = await cookies()
      sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    }

    if (!sessionToken) {
      return null
    }

    const validation = await validateSession(sessionToken)
    if (!validation.valid || !validation.session) {
      return null
    }

    const employee = await getEmployeeProfile(validation.session.employee_id)
    return employee
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err
    }
    console.error('[AuthService] Error getting employee from session:', err)
    return null
  }
}
