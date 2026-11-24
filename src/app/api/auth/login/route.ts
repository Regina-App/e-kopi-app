import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validators'
import { loginWithNIK } from '@/lib/services/auth.service'

// In-memory rate limiting: max 5 attempts per NIK per 15 minutes
interface RateLimitEntry {
  count: number
  firstAttempt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

function checkRateLimit(nik: string): { allowed: boolean; remainingMs: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(nik)

  if (!entry) {
    rateLimitMap.set(nik, { count: 1, firstAttempt: now })
    return { allowed: true, remainingMs: RATE_LIMIT_WINDOW_MS }
  }

  // If window expired, reset
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(nik, { count: 1, firstAttempt: now })
    return { allowed: true, remainingMs: RATE_LIMIT_WINDOW_MS }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt)
    return { allowed: false, remainingMs }
  }

  entry.count += 1
  return { allowed: true, remainingMs: RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with loginSchema
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Format NIK tidak valid',
        },
        { status: 400 }
      )
    }

    const { nik } = parsed.data
    const cleanNIK = nik.trim()

    // Rate limiting check
    const rateLimit = checkRateLimit(cleanNIK)
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.remainingMs / (60 * 1000))
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan masuk untuk NIK ini. Silakan coba lagi dalam ${minutesLeft} menit.`,
        },
        { status: 429 }
      )
    }

    // Extract client IP and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Attempt login with NIK
    const result = await loginWithNIK(cleanNIK, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      employeeId: result.employeeId,
      maskedEmail: result.maskedEmail,
      maskedPhone: result.maskedPhone,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan internal server'
    console.error('[API Login] Unexpected error:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem internal. Silakan coba lagi nanti.' },
      { status: 500 }
    )
  }
}
