import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await logout(undefined, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal keluar' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari akun',
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat logout'
    console.error('[API Logout] Error:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat proses logout.' },
      { status: 500 }
    )
  }
}
