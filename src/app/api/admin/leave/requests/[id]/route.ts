import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import {
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveBalanceDetail,
} from '@/lib/services/leave.service'

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
    const leaveRequest = await getLeaveRequestById(id)

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Permohonan cuti tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Also get current leave balance detail
    let balance = null
    try {
      balance = await getLeaveBalanceDetail(leaveRequest.employee_id, leaveRequest.year)
    } catch (e) {
      console.warn('[AdminLeaveDetail] Balance lookup warning:', e)
    }

    return NextResponse.json({
      success: true,
      request: leaveRequest,
      balance,
    })
  } catch (error: unknown) {
    console.error('[AdminLeaveDetailAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat detail permohonan cuti.',
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

    let updatedRequest
    if (action === 'approve') {
      updatedRequest = await approveLeaveRequest(id, admin.id, notes, 'panel')
    } else {
      updatedRequest = await rejectLeaveRequest(id, admin.id, notes, 'panel')
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Permohonan cuti berhasil disetujui.'
          : 'Permohonan cuti telah ditolak.',
      request: updatedRequest,
    })
  } catch (error: unknown) {
    console.error('[AdminLeaveDetailAPI] PUT Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat memproses permohonan cuti.',
      },
      { status: 500 }
    )
  }
}
