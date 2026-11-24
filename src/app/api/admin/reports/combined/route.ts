import { NextRequest, NextResponse } from 'next/server'
import {
  generateCombinedReport,
  generateCombinedExcel,
  type ReportFilters,
} from '@/lib/services/report.service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const format = (searchParams.get('format') || 'json').toLowerCase()
    const period = (searchParams.get('period') as ReportFilters['period']) || 'all'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const companyId = searchParams.get('companyId') || undefined
    const siteId = searchParams.get('siteId') || undefined

    const filters: ReportFilters = {
      period,
      year,
      month,
      startDate,
      endDate,
      companyId,
      siteId,
    }

    const { leaveData, loanData } = await generateCombinedReport(filters)

    // Fetch company settings
    const adminClient = createAdminClient()
    const { data: settingsData } = await adminClient.from('app_settings').select('*')
    const settingsMap: Record<string, any> = {}
    if (settingsData) {
      for (const row of settingsData) {
        settingsMap[row.key] = row.value
      }
    }

    const reportSettings = {
      companyName: settingsMap['company_name'] || 'PT REGINA PRIMA NUSANTARA',
      companyAddress: settingsMap['company_address'] || undefined,
      logoUrl: settingsMap['logo_url'] || undefined,
      generatedBy: 'Admin E-KOPI',
    }

    if (format === 'excel') {
      const buffer = await generateCombinedExcel(leaveData, loanData, reportSettings, filters)
      const filename = `Laporan-Gabungan-Cuti-Pinjaman-${Date.now()}.xlsx`
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Default JSON preview with stats from both
    const totalLeaveRequests = leaveData.length
    const totalLeaveDays = leaveData.reduce((acc, curr) => acc + (curr.totalDays || 0), 0)
    const totalLoans = loanData.length
    const totalLoanDisbursed = loanData.reduce((acc, curr) => acc + (curr.loanAmount || 0), 0)
    const totalLoanNetDisbursement = loanData.reduce(
      (acc, curr) => acc + (curr.netDisbursement || 0),
      0
    )

    return NextResponse.json({
      success: true,
      summary: {
        totalLeaveRequests,
        totalLeaveDays,
        totalLoans,
        totalLoanDisbursed,
        totalLoanNetDisbursement,
      },
      leaveData,
      loanData,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghasilkan laporan gabungan'
    console.error('[AdminReportsCombined:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
