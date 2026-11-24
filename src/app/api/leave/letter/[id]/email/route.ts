import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { generateLeaveLetter } from '@/lib/services/pdf.service'
import { sendEmail } from '@/lib/services/email.service'
import { formatDate } from '@/lib/utils'
import type { Employee, LeaveRequest } from '@/lib/types/database'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengajuan cuti tidak valid.' }, { status: 400 })
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

    const adminSessionCookie = request.cookies.get('admin_session')?.value
    const isAdmin = Boolean(adminSessionCookie || request.headers.get('x-admin-role'))

    // 2. Fetch leave request
    const { data: leaveRequest, error: leaveErr } = await adminClient
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .eq('id', id)
      .maybeSingle()

    if (leaveErr || !leaveRequest) {
      return NextResponse.json({ success: false, error: 'Pengajuan cuti tidak ditemukan.' }, { status: 404 })
    }

    // 3. Authorization check
    if (!isAdmin) {
      if (!currentEmployee || currentEmployee.id !== leaveRequest.employee_id) {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk dokumen ini.' },
          { status: 403 }
        )
      }
    }

    // 4. Validate approved status
    if (leaveRequest.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: `Surat cuti hanya dapat dikirim jika pengajuan telah disetujui (Status: ${leaveRequest.status}).`,
        },
        { status: 400 }
      )
    }

    // 5. Check recipient email
    const empRaw = leaveRequest.employee as unknown as Employee | null
    const targetEmail = empRaw?.email
    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Karyawan tidak memiliki alamat email yang terdaftar.' },
        { status: 400 }
      )
    }

    // 6. Fetch settings & relations
    const { data: appSettings } = await adminClient.from('app_settings').select('key, value')
    const settingsMap: Record<string, string> = {}
    if (appSettings) {
      for (const row of appSettings) {
        settingsMap[row.key] = typeof row.value === 'string' ? row.value : String(row.value ?? '')
      }
    }

    let companyName = '-'
    let siteName = '-'
    let deptName = '-'
    let posName = '-'

    if (empRaw?.company_id) {
      const { data: c } = await adminClient.from('companies').select('name').eq('id', empRaw.company_id).maybeSingle()
      if (c) companyName = c.name
    }
    if (empRaw?.site_id) {
      const { data: s } = await adminClient.from('sites').select('name').eq('id', empRaw.site_id).maybeSingle()
      if (s) siteName = s.name
    }
    if (empRaw?.department_id) {
      const { data: d } = await adminClient.from('departments').select('name').eq('id', empRaw.department_id).maybeSingle()
      if (d) deptName = d.name
    }
    if (empRaw?.position_id) {
      const { data: p } = await adminClient.from('positions').select('name').eq('id', empRaw.position_id).maybeSingle()
      if (p) posName = p.name
    }

    // 7. Get admin who approved
    let processedByName = 'Administrator HRD'
    if (leaveRequest.processed_by) {
      const { data: adminRecord } = await adminClient
        .from('admins')
        .select('name')
        .eq('id', leaveRequest.processed_by)
        .maybeSingle()
      if (adminRecord && 'name' in adminRecord) {
        processedByName = String(adminRecord.name || 'Administrator HRD')
      }
    }

    // 8. Generate letter HTML
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
        year: leaveRequest.year || new Date().getFullYear(),
        allocation: 12,
        usedThisRequest: leaveRequest.total_days || 0,
        totalUsed: leaveRequest.total_days || 0,
        remaining: Math.max(0, 12 - (leaveRequest.total_days || 0)),
      },
      processedByName,
    })

    // 9. Send email
    const subject = `[SURAT CUTI RESMI] Persetujuan Pengajuan Cuti #${leaveRequest.id.slice(0, 8).toUpperCase()} - ${empRaw?.full_name}`
    const emailResult = await sendEmail({
      to: targetEmail,
      subject,
      html: letter.html,
      attachments: [
        {
          filename: `Surat-Cuti-Resmi-${leaveRequest.id.slice(0, 8)}.html`,
          content: letter.html,
          contentType: 'text/html',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Surat cuti resmi berhasil dikirim ke alamat email: ${targetEmail}`,
      emailResult,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi gangguan saat mengirim surat cuti ke email.'
    console.error('[LeaveLetterEmail:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
