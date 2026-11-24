import { NextRequest, NextResponse } from 'next/server'
import {
  generateLoanReport,
  generateLoanExcel,
  generateReportPDF,
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
    const status = searchParams.get('status') || undefined

    const filters: ReportFilters = {
      period,
      year,
      month,
      startDate,
      endDate,
      companyId,
      siteId,
      status,
    }

    const data = await generateLoanReport(filters)

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
      const buffer = await generateLoanExcel(data, reportSettings, filters)
      const filename = `Laporan-Pinjaman-${Date.now()}.xlsx`
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (format === 'pdf') {
      const html = generateReportPDF(data, 'loan', reportSettings, filters)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="Laporan-Pinjaman-${Date.now()}.html"`,
        },
      })
    }

    // Default JSON preview & summary stats
    const totalLoans = data.length
    const totalDisbursed = data.reduce((acc, curr) => acc + (curr.loanAmount || 0), 0)
    const totalInstallments = data.reduce((acc, curr) => acc + (curr.installmentPerMonth || 0), 0)
    const totalNetDisbursement = data.reduce((acc, curr) => acc + (curr.netDisbursement || 0), 0)
    const approvedCount = data.filter(
      (d) => d.status === 'approved' || d.status === 'completed'
    ).length
    const pendingCount = data.filter((d) => d.status === 'pending').length
    const rejectedCount = data.filter((d) => d.status === 'rejected').length

    return NextResponse.json({
      success: true,
      summary: {
        totalLoans,
        totalDisbursed,
        totalInstallments,
        totalNetDisbursement,
        approvedCount,
        pendingCount,
        rejectedCount,
      },
      data,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghasilkan laporan pinjaman'
    console.error('[AdminReportsLoan:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
