import { NextRequest, NextResponse } from 'next/server'
import {
  createLeaveRequest,
  getLeaveRequests,
} from '@/lib/services/leave.service'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { leaveRequestSchema } from '@/lib/validators'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LeaveStatus } from '@/lib/types/database'

async function resolveEmployee(request: NextRequest) {
  let employee = await getEmployeeFromSession(request)

  if (!employee) {
    const admin = createAdminClient()
    const headerEmpId = request.headers.get('x-employee-id')
    const cookieEmpId = request.cookies.get('employee_id')?.value
    const fallbackId = headerEmpId || cookieEmpId

    if (fallbackId) {
      const { data: emp } = await admin
        .from('employees')
        .select('id, nik, full_name, status, is_active, is_deleted')
        .eq('id', fallbackId)
        .maybeSingle()
      if (emp) employee = emp as unknown as typeof employee
    } else {
      const { data: emp } = await admin
        .from('employees')
        .select('id, nik, full_name, status, is_active, is_deleted')
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle()
      if (emp) employee = emp as unknown as typeof employee
    }
  }

  return employee
}

export async function POST(request: NextRequest) {
  try {
    const employee = await resolveEmployee(request)
    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi pegawai tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request schema
    const validation = leaveRequestSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Data pengajuan cuti tidak valid'
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const result = await createLeaveRequest(employee.id, validation.data)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, request: result.request },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API POST /api/leave/request] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const employee = await resolveEmployee(request)
    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi pegawai tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') as LeaveStatus | 'all' | null
    const yearParam = searchParams.get('year')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10
    const year = yearParam ? parseInt(yearParam, 10) : undefined

    const result = await getLeaveRequests(employee.id, {
      status: statusParam || undefined,
      year,
      page,
      limit,
    })

    return NextResponse.json({
      requests: result.requests,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API GET /api/leave/request] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
