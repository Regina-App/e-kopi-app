import { NextRequest, NextResponse } from 'next/server'
import { changePin, getAdminFromSession } from '@/lib/services/admin.service'
import { changePinSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Sesi admin tidak valid atau telah berakhir.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = changePinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data PIN tidak valid' },
        { status: 400 }
      )
    }

    const { current_pin, new_pin } = parsed.data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await changePin(admin.id, current_pin, new_pin, { ipAddress, userAgent })
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'PIN administrator berhasil diperbarui.',
    })
  } catch (error: unknown) {
    console.error('[AdminChangePinRoute] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat mengubah PIN.',
      },
      { status: 500 }
    )
  }
}
