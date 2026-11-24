import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { loanService, type LoanFilterOptions } from '@/lib/services/loan.service'
import type { LoanStatus } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    const status = (searchParams.get('status') || 'all') as LoanStatus | 'all'
    const search = searchParams.get('search')?.trim().toLowerCase() || ''

    const filters: LoanFilterOptions = {
      status,
      page,
      limit,
    }

    const result = await loanService.getAllLoanRequests(filters)

    let filteredRequests = result.data
    if (search) {
      filteredRequests = result.data.filter((r) => {
        const idMatch = r.id.toLowerCase().includes(search)
        const nikMatch = r.employee?.nik?.toLowerCase().includes(search)
        const nameMatch = r.employee?.full_name?.toLowerCase().includes(search)
        return idMatch || nikMatch || nameMatch
      })
    }

    const total = search ? filteredRequests.length : result.total
    const totalPages = Math.ceil(total / limit) || 1

    return NextResponse.json({
      success: true,
      requests: filteredRequests,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error: unknown) {
    console.error('[AdminLoanRequestsAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat daftar pinjaman koperasi.',
      },
      { status: 500 }
    )
  }
}
