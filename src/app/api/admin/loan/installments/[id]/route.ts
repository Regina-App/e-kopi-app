import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { loanService } from '@/lib/services/loan.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (body.action !== 'confirm') {
      return NextResponse.json(
        { success: false, error: 'Aksi harus berupa "confirm".' },
        { status: 400 }
      )
    }

    const result = await loanService.confirmInstallment(id, admin.id)

    return NextResponse.json({
      success: true,
      message: result.loan_completed
        ? 'Angsuran berhasil dikonfirmasi. Seluruh pinjaman telah lunas!'
        : 'Angsuran berhasil dikonfirmasi.',
      installment: result.installment,
      loan_completed: result.loan_completed,
    })
  } catch (error: unknown) {
    console.error('[AdminInstallmentAPI] PUT Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengonfirmasi angsuran pinjaman.',
      },
      { status: 500 }
    )
  }
}
