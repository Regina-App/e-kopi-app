import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { addLeaveAllocation, getLeaveBalanceDetail } from '@/lib/services/leave.service'
import { logAction } from '@/lib/services/audit.service'

export async function POST(
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

    const year = Number(body.year) || new Date().getFullYear()
    const amount = Number(body.amount)
    const description = body.description || `Penambahan kuota cuti tahun ${year} oleh admin`

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Jumlah kuota cuti harus berupa angka positif.' },
        { status: 400 }
      )
    }

    const allocResult = await addLeaveAllocation(
      id,
      year,
      amount,
      admin.id,
      description
    )

    if (!allocResult.success || !allocResult.entry) {
      return NextResponse.json(
        { success: false, error: allocResult.error || 'Gagal menambahkan kuota cuti.' },
        { status: 400 }
      )
    }

    const ledgerEntry = allocResult.entry
    const updatedBalance = await getLeaveBalanceDetail(id, year)

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logAction({
      actorType: 'admin',
      actorId: admin.id,
      action: 'ADD_LEAVE_QUOTA',
      targetType: 'leave_balance_ledger',
      targetId: ledgerEntry.id,
      newValues: {
        employee_id: id,
        year,
        amount,
        description,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${amount} hari kuota cuti tahun ${year}.`,
      ledger_entry: ledgerEntry,
      balance: updatedBalance,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeeQuotaAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan kuota cuti.',
      },
      { status: 500 }
    )
  }
}
