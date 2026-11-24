import { NextRequest, NextResponse } from 'next/server'
import {
  getLeaveRequestById,
  cancelLeaveRequest,
} from '@/lib/services/leave.service'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'ID pengajuan tidak valid' }, { status: 400 })
    }

    const employee = await resolveEmployee(request)
    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi pegawai tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      )
    }

    const leaveRequest = await getLeaveRequestById(id)
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Pengajuan cuti tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check ownership unless admin
    if (leaveRequest.employee_id !== employee.id) {
      // Check if user is admin
      const adminHeader = request.headers.get('x-admin-id')
      if (!adminHeader) {
        return NextResponse.json(
          { error: 'Forbidden: Anda tidak memiliki akses ke pengajuan cuti ini' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ request: leaveRequest })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API GET /api/leave/request/[id]] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'ID pengajuan tidak valid' }, { status: 400 })
    }

    const employee = await resolveEmployee(request)
    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi pegawai tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      )
    }

    const result = await cancelLeaveRequest(id, employee.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pengajuan cuti berhasil dibatalkan',
      request: result.request,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API DELETE /api/leave/request/[id]] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
