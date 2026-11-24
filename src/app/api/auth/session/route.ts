import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeFromSession } from '@/lib/services/auth.service'

export async function GET(request: NextRequest) {
  try {
    const employee = await getEmployeeFromSession(request)

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesi tidak valid atau telah berakhir',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error
    }
    const errorMsg = error instanceof Error ? error.message : 'Error validating session'
    console.error('[API Session] Error:', errorMsg)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat memeriksa sesi',
      },
      { status: 500 }
    )
  }
}
