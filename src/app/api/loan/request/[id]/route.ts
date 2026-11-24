import { NextRequest, NextResponse } from 'next/server'
import { loanService } from '@/lib/services/loan.service'

const DEMO_EMPLOYEE_ID = 'e1000000-0000-0000-0000-000000000001'

function getEmployeeIdFromRequest(request: NextRequest): string {
  const headerId = request.headers.get('x-employee-id')
  if (headerId) return headerId

  const url = new URL(request.url)
  const queryId = url.searchParams.get('employee_id')
  if (queryId) return queryId

  const cookieId = request.cookies.get('employee_id')?.value
  if (cookieId) return cookieId

  return DEMO_EMPLOYEE_ID
}

/**
 * GET /api/loan/request/[id]
 * Retrieves details of a specific loan request with installment schedule.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan pinjaman wajib disertakan' },
        { status: 400 }
      )
    }

    const loan = await loanService.getLoanRequestById(id)
    if (!loan) {
      return NextResponse.json(
        { success: false, error: `Pengajuan pinjaman dengan ID ${id} tidak ditemukan` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: loan,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memuat detail pengajuan pinjaman'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/loan/request/[id]
 * Cancels a pending loan request by the employee.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan pinjaman wajib disertakan' },
        { status: 400 }
      )
    }

    const employeeId = getEmployeeIdFromRequest(request)
    const cancelled = await loanService.cancelLoanRequest(id, employeeId)

    return NextResponse.json({
      success: true,
      message: `Pengajuan pinjaman ${id} berhasil dibatalkan.`,
      data: cancelled,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal membatalkan pengajuan pinjaman'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    )
  }
}
