import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { otpSchema } from '@/lib/validators'
import { verifyOTP, AUTH_COOKIE_NAME } from '@/lib/services/auth.service'
import { SESSION_DURATION_DAYS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, code } = body

    if (!employeeId || typeof employeeId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Employee ID diperlukan' },
        { status: 400 }
      )
    }

    // Validate OTP format
    const parsedOtp = otpSchema.safeParse({ code })
    if (!parsedOtp.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsedOtp.error.issues[0]?.message || 'Kode OTP harus 6 digit angka',
        },
        { status: 400 }
      )
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Verify OTP and create session
    const result = await verifyOTP(employeeId, code, {
      deviceInfo: userAgent,
      ipAddress,
      userAgent,
    })

    if (!result.success || !result.sessionToken) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verifikasi OTP gagal' },
        { status: 400 }
      )
    }

    // Set HTTP-only secure cookie
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    })

    return NextResponse.json({
      success: true,
      message: 'Verifikasi berhasil',
      employee: result.employee,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan internal server'
    console.error('[API Verify OTP] Unexpected error:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat verifikasi OTP.' },
      { status: 500 }
    )
  }
}
