import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_AUTH_COOKIE_NAME, getAdminFromSession } from '@/lib/services/admin.service'
import { logAction } from '@/lib/services/audit.service'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)

    if (admin) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined

      await logAction({
        actorType: 'admin',
        actorId: admin.id,
        action: 'ADMIN_LOGOUT',
        targetType: 'admin',
        targetId: admin.id,
        ipAddress,
        userAgent,
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari sesi admin.',
    })

    response.cookies.delete(ADMIN_AUTH_COOKIE_NAME)

    return response
  } catch (error: unknown) {
    console.error('[AdminLogoutRoute] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat logout.',
      },
      { status: 500 }
    )
  }
}
