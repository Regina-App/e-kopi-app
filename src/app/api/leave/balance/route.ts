import { NextRequest, NextResponse } from 'next/server'
import { getLeaveBalanceDetail } from '@/lib/services/leave.service'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // 1. Resolve employee from session
    let employee = await getEmployeeFromSession(request)

    // Fallback: check headers or cookie for dev/test
    if (!employee) {
      const admin = createAdminClient()
      const headerEmpId = request.headers.get('x-employee-id')
      const cookieEmpId = request.cookies.get('employee_id')?.value

      const fallbackId = headerEmpId || cookieEmpId

      if (fallbackId) {
        const { data: emp } = await admin
          .from('employees')
          .select('id, nik, full_name, status, is_active, is_deleted, company_id, site_id, department_id, position_id, crew_id')
          .eq('id', fallbackId)
          .maybeSingle()
        if (emp) {
          employee = emp as unknown as typeof employee
        }
      } else {
        // Dev fallback: find the first approved active employee
        const { data: emp } = await admin
          .from('employees')
          .select('id, nik, full_name, status, is_active, is_deleted, company_id, site_id, department_id, position_id, crew_id')
          .eq('status', 'approved')
          .eq('is_active', true)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle()
        if (emp) {
          employee = emp as unknown as typeof employee
        }
      }
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi pegawai tidak ditemukan. Silakan login kembali.' },
        { status: 401 }
      )
    }

    // 2. Determine year
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    // 3. Get balance
    const detail = await getLeaveBalanceDetail(employee.id, year)

    return NextResponse.json({
      balance: {
        total: detail.total,
        used: detail.used,
        reserved: detail.reserved,
        available: detail.available,
      },
      employee: {
        id: employee.id,
        nik: employee.nik,
        full_name: employee.full_name,
      },
    })
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal server'
    console.error('[API /api/leave/balance] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
