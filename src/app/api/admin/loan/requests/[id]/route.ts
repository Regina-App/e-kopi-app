import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { loanService } from '@/lib/services/loan.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const loan = await loanService.getLoanRequestById(id)

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Permohonan pinjaman tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      loan,
    })
  } catch (error: unknown) {
    console.error('[AdminLoanDetailAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat detail pinjaman.',
      },
      { status: 500 }
    )
  }
}

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

    const { action, notes } = body
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { success: false, error: 'Action harus berupa "approve" atau "reject".' },
        { status: 400 }
      )
    }

    let updatedLoan
    if (action === 'approve') {
      updatedLoan = await loanService.approveLoanRequest(id, admin.id, notes, 'panel')
    } else {
      updatedLoan = await loanService.rejectLoanRequest(id, admin.id, notes, 'panel')
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Pinjaman koperasi berhasil disetujui dan jadwal angsuran telah dibentuk.'
          : 'Pinjaman koperasi telah ditolak.',
      loan: updatedLoan,
    })
  } catch (error: unknown) {
    console.error('[AdminLoanDetailAPI] PUT Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat memproses pinjaman.',
      },
      { status: 500 }
    )
  }
}
