import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { getAllLeaveRequests, type LeaveFilters } from '@/lib/services/leave.service'
import type { LeaveStatus } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    const status = (searchParams.get('status') || 'all') as LeaveStatus | 'all'
    const search = searchParams.get('search')?.trim().toLowerCase() || ''
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : undefined

    const filters: LeaveFilters = {
      status,
      year,
      page,
      limit,
    }

    const result = await getAllLeaveRequests(filters)

    // Filter by search query if provided (matching NIK, name, or request ID)
    let filteredRequests = result.requests
    if (search) {
      filteredRequests = result.requests.filter((r) => {
        const idMatch = r.id.toLowerCase().includes(search)
        const nikMatch = r.employee?.nik?.toLowerCase().includes(search)
        const nameMatch = r.employee?.full_name?.toLowerCase().includes(search)
        return idMatch || nikMatch || nameMatch
      })
    }

    return NextResponse.json({
      success: true,
      requests: filteredRequests,
      total: search ? filteredRequests.length : result.total,
      page: result.page,
      limit: result.limit,
      totalPages: search ? Math.ceil(filteredRequests.length / limit) || 1 : result.totalPages,
    })
  } catch (error: unknown) {
    console.error('[AdminLeaveRequestsAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat permohonan cuti.',
      },
      { status: 500 }
    )
  }
}
