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
 * GET /api/loan/active
 * Retrieves the currently active/approved loan for the employee along with its installment schedule.
 */
export async function GET(request: NextRequest) {
  try {
    const employeeId = getEmployeeIdFromRequest(request)
    const activeLoan = await loanService.getActiveLoan(employeeId)

    return NextResponse.json({
      success: true,
      data: activeLoan,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memuat pinjaman aktif'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
