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
 * GET /api/loan/settings
 * Retrieves loan settings, employee profile, active loan, and application eligibility state.
 */
export async function GET(request: NextRequest) {
  try {
    const employeeId = getEmployeeIdFromRequest(request)
    const settings = await loanService.getLoanSettings()
    const employee = await loanService.getEmployeeProfile(employeeId)
    const activeLoan = await loanService.getActiveLoan(employeeId)
    const remainingObligation = activeLoan
      ? await loanService.getRemainingObligation(employeeId)
      : 0

    // Check for pending request
    const requests = await loanService.getLoanRequests(employeeId, { status: 'pending' })
    const pendingRequest = requests.length > 0 ? requests[0] : null

    // Check first-time borrower
    const allHistory = await loanService.getLoanRequests(employeeId)
    const isFirstTimeBorrower = allHistory.filter(
      (r) => r.status === 'approved' || r.status === 'completed'
    ).length === 0

    return NextResponse.json({
      success: true,
      data: {
        settings,
        employee,
        active_loan: activeLoan,
        remaining_obligation: remainingObligation,
        pending_request: pendingRequest,
        is_first_time_borrower: isFirstTimeBorrower,
      },
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memuat pengaturan pinjaman'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}
