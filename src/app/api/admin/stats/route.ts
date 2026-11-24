import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id') || ''
    const siteId = searchParams.get('site_id') || ''
    const targetYear = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    const adminClient = createAdminClient()

    // 1. Employee counts
    let empQuery = adminClient
      .from('employees')
      .select('id, status, is_active, company_id, site_id, created_at')
      .eq('is_deleted', false)

    if (companyId && companyId !== 'all') {
      empQuery = empQuery.eq('company_id', companyId)
    }
    if (siteId && siteId !== 'all') {
      empQuery = empQuery.eq('site_id', siteId)
    }

    const { data: employees } = await empQuery
    const empList = employees || []

    const totalEmployees = empList.filter((e) => e.status === 'approved' && e.is_active).length
    const pendingRegistrations = empList.filter((e) => e.status === 'pending').length

    // 2. Leave requests
    const { data: leaves } = await adminClient
      .from('leave_requests')
      .select('id, status, total_days, created_at, year, employee_id')

    const leaveList = leaves || []
    const pendingLeave = leaveList.filter((l) => l.status === 'pending').length
    const approvedLeave = leaveList.filter((l) => l.status === 'approved').length
    const rejectedLeave = leaveList.filter((l) => l.status === 'rejected').length

    // Compute leaves in current month
    const currentMonth = new Date().getMonth()
    const currentYearNum = new Date().getFullYear()
    let thisMonthLeaveDays = 0
    leaveList.forEach((l) => {
      if (l.status === 'approved') {
        const d = new Date(l.created_at)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYearNum) {
          thisMonthLeaveDays += Number(l.total_days || 0)
        }
      }
    })

    // 3. Loan requests
    const { data: loans } = await adminClient
      .from('loan_requests')
      .select('id, status, loan_amount, installment_per_month, total_obligation, created_at')

    const loanList = loans || []
    const pendingLoan = loanList.filter((l) => l.status === 'pending').length
    const activeLoans = loanList.filter((l) => l.status === 'approved')
    const activeLoansCount = activeLoans.length
    const completedLoansCount = loanList.filter((l) => l.status === 'completed').length
    const totalActiveLoanAmount = activeLoans.reduce((sum, l) => sum + Number(l.loan_amount || 0), 0)

    // Total Pending
    const totalPending = pendingRegistrations + pendingLeave + pendingLoan

    // 4. Monthly trends (Jan - Des) for targetYear based on REAL data
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ]

    const monthlyTrends = monthNames.map((name, idx) => {
      let cutiCount = 0
      let cutiDays = 0
      leaveList.forEach((l) => {
        const d = new Date(l.created_at)
        if (d.getFullYear() === targetYear && d.getMonth() === idx) {
          cutiCount++
          if (l.status === 'approved') cutiDays += Number(l.total_days || 0)
        }
      })

      let loanCount = 0
      let totalLoan = 0
      loanList.forEach((l) => {
        const d = new Date(l.created_at)
        if (d.getFullYear() === targetYear && d.getMonth() === idx) {
          loanCount++
          totalLoan += Number(l.loan_amount || 0)
        }
      })

      return {
        month: name,
        cuti: cutiCount,
        koperasi: loanCount,
        cutiDays,
        totalLoan,
      }
    })

    // 5. Real Status breakdown (Pie Chart)
    const totalApproved = approvedLeave + activeLoansCount + completedLoansCount
    const totalRejected = rejectedLeave + loanList.filter((l) => l.status === 'rejected').length
    const totalPendingAll = pendingLeave + pendingLoan + pendingRegistrations

    const statusBreakdown = [
      { name: 'Disetujui', value: totalApproved, color: '#10b981' },
      { name: 'Menunggu', value: totalPendingAll, color: '#f59e0b' },
      { name: 'Ditolak', value: totalRejected, color: '#ef4444' },
    ]

    // 6. Recent activity from audit_logs
    const { data: auditLogs } = await adminClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)

    const recentActivity = (auditLogs || []).map((log) => ({
      id: log.id,
      action: log.action,
      actor_type: log.actor_type,
      target_type: log.target_type,
      target_id: log.target_id,
      created_at: log.created_at,
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees: totalEmployees,
        pendingRegistrations,
        pendingLeaveRequests: pendingLeave,
        pendingLoanRequests: pendingLoan,
        totalPendingRequests: totalPending,
        thisMonthLeaveDays: thisMonthLeaveDays,
        activeLoansCount: activeLoansCount,
        totalActiveLoanAmount: totalActiveLoanAmount,
        approvedLeaveCount: approvedLeave,
        completedLoansCount,
      },
      monthlyTrends,
      statusBreakdown,
      recentActivity,
    })
  } catch (error: unknown) {
    console.error('[AdminStatsAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat statistik admin.',
      },
      { status: 500 }
    )
  }
}
