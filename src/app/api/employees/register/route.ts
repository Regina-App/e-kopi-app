import { NextRequest, NextResponse } from 'next/server'
import { registerEmployee } from '@/lib/services/employee.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const result = await registerEmployee(body, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Pendaftaran berhasil dikirim. Menunggu persetujuan admin.',
      employee: result.employee,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error during employee registration'
    console.error('[API Register] Error:', errorMsg)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan sistem saat memproses pendaftaran pegawai.',
      },
      { status: 500 }
    )
  }
}
