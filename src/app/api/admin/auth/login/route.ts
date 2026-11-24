import { NextRequest, NextResponse } from 'next/server'
import { adminLogin, ADMIN_AUTH_COOKIE_NAME, ADMIN_SESSION_DURATION_DAYS } from '@/lib/services/admin.service'
import { adminLoginSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = adminLoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Email atau PIN tidak valid.',
        },
        { status: 400 }
      )
    }

    const { email, pin } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const loginResult = await adminLogin(email, pin, { ipAddress, userAgent })

    if (!loginResult.success || !loginResult.sessionToken || !loginResult.admin) {
      return NextResponse.json(
        {
          success: false,
          error: loginResult.error || 'Autentikasi gagal.',
        },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      admin: {
        id: loginResult.admin.id,
        name: loginResult.admin.name,
        email: loginResult.admin.email,
        role: loginResult.admin.role,
        force_pin_change: loginResult.admin.force_pin_change,
        permissions: loginResult.admin.permissions,
      },
      forcePinChange: loginResult.forcePinChange,
    })

    // Set secure admin session cookie
    response.cookies.set({
      name: ADMIN_AUTH_COOKIE_NAME,
      value: loginResult.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_DURATION_DAYS * 24 * 60 * 60,
    })

    return response
  } catch (error: unknown) {
    console.error('[AdminLoginRoute] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat login.',
      },
      { status: 500 }
    )
  }
}
