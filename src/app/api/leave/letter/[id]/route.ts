import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { generateLeaveLetter } from '@/lib/services/pdf.service'
import type { Employee, LeaveBalanceLedger, LeaveRequest } from '@/lib/types/database'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'ID pengajuan cuti tidak valid' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Check authentication (Employee or Admin)
    let currentEmployee = await getEmployeeFromSession(request)
    const headerEmpId = request.headers.get('x-employee-id')
    const cookieEmpId = request.cookies.get('employee_id')?.value
    const fallbackEmpId = headerEmpId || cookieEmpId

    if (!currentEmployee && fallbackEmpId) {
      const { data: emp } = await adminClient
        .from('employees')
        .select('*')
        .eq('id', fallbackEmpId)
        .maybeSingle()
      if (emp) currentEmployee = emp
    }

    // Check if caller is admin
    const adminSessionCookie = request.cookies.get('admin_session')?.value
    const isAdmin = Boolean(adminSessionCookie || request.headers.get('x-admin-role'))

    // 2. Fetch leave request
    const { data: leaveRequest, error: leaveErr } = await adminClient
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .eq('id', id)
      .maybeSingle()

    if (leaveErr || !leaveRequest) {
      return NextResponse.json({ error: 'Pengajuan cuti tidak ditemukan' }, { status: 404 })
    }

    // 3. Authorization check
    if (!isAdmin) {
      if (!currentEmployee || currentEmployee.id !== leaveRequest.employee_id) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat dokumen ini' },
          { status: 403 }
        )
      }
    }

    // 4. Validate approved status
    if (leaveRequest.status !== 'approved') {
      return NextResponse.json(
        {
          error: `Surat cuti hanya dapat diunduh untuk pengajuan yang telah disetujui (Status saat ini: ${leaveRequest.status})`,
        },
        { status: 400 }
      )
    }

    // 5. Fetch employee relations (company, site, department, position)
    const empRaw = leaveRequest.employee as unknown as Employee | null
    let companyName = '-'
    let siteName = '-'
    let deptName = '-'
    let posName = '-'

    if (empRaw?.company_id) {
      const { data: c } = await adminClient
        .from('companies')
        .select('name')
        .eq('id', empRaw.company_id)
        .maybeSingle()
      if (c) companyName = c.name
    }
    if (empRaw?.site_id) {
      const { data: s } = await adminClient
        .from('sites')
        .select('name')
        .eq('id', empRaw.site_id)
        .maybeSingle()
      if (s) siteName = s.name
    }
    if (empRaw?.department_id) {
      const { data: d } = await adminClient
        .from('departments')
        .select('name')
        .eq('id', empRaw.department_id)
        .maybeSingle()
      if (d) deptName = d.name
    }
    if (empRaw?.position_id) {
      const { data: p } = await adminClient
        .from('positions')
        .select('name')
        .eq('id', empRaw.position_id)
        .maybeSingle()
      if (p) posName = p.name
    }

    // 6. Fetch quota summary for the year
    const year = leaveRequest.year || new Date().getFullYear()
    const { data: ledgerEntries } = await adminClient
      .from('leave_balance_ledger')
      .select('*')
      .eq('employee_id', leaveRequest.employee_id)
      .eq('year', year)

    let allocation = 12
    let totalUsed = 0

    if (ledgerEntries && ledgerEntries.length > 0) {
      for (const entry of ledgerEntries as LeaveBalanceLedger[]) {
        if (entry.type === 'allocation' || entry.type === 'accumulation') {
          allocation += entry.amount
        } else if (entry.type === 'usage') {
          totalUsed += entry.amount
        }
      }
    } else {
      totalUsed = leaveRequest.total_days || 0
    }

    const remaining = Math.max(0, allocation - totalUsed)

    // 7. Fetch app settings for letterhead/company info
    const { data: settingsData } = await adminClient.from('app_settings').select('*')
    const settingsMap: Record<string, any> = {}
    if (settingsData) {
      for (const row of settingsData) {
        settingsMap[row.key] = row.value
      }
    }

    // 8. Fetch admin name who processed
    let processedByName = ''
    if (leaveRequest.processed_by) {
      const { data: adminRecord } = await adminClient
        .from('admins')
        .select('name')
        .eq('id', leaveRequest.processed_by)
        .maybeSingle()
      if (adminRecord) processedByName = adminRecord.name
    }

    // 9. Generate letter
    const letter = await generateLeaveLetter({
      leaveRequest: leaveRequest as LeaveRequest,
      employee: {
        ...(empRaw || {}),
        company_name: companyName,
        site_name: siteName,
        department_name: deptName,
        position_name: posName,
      },
      settings: {
        company_name: settingsMap['company_name'] || companyName,
        company_address: settingsMap['company_address'] || undefined,
        company_phone: settingsMap['company_phone'] || undefined,
        letterhead_url: settingsMap['letterhead_url'] || null,
        logo_url: settingsMap['logo_url'] || null,
        app_version: settingsMap['app_version'] || '1.0.0',
      },
      quota: {
        year,
        allocation,
        usedThisRequest: leaveRequest.total_days || 0,
        totalUsed,
        remaining,
      },
      processedByName,
    })

    return new NextResponse(letter.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Surat-Cuti-${leaveRequest.id}.html"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghasilkan surat cuti'
    console.error('[LeaveLetterRoute:Error]', err)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
