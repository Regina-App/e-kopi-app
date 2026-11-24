import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { logAction } from '@/lib/services/audit.service'
import { addLeaveAllocation } from '@/lib/services/leave.service'
import { DEFAULT_LEAVE_QUOTA } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    const search = searchParams.get('search')?.trim() || ''
    const companyId = searchParams.get('company_id')?.trim() || ''
    const siteId = searchParams.get('site_id')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const departmentId = searchParams.get('department_id')?.trim() || ''

    const offset = (page - 1) * limit
    const adminClient = createAdminClient()

    let query = adminClient
      .from('employees')
      .select(
        `
        *,
        company:companies(id, name),
        site:sites(id, name),
        department:departments(id, name),
        position:positions(id, name),
        crew:crews(id, name)
      `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)

    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    if (companyId && companyId !== 'all') {
      query = query.eq('company_id', companyId)
    }

    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }

    if (departmentId && departmentId !== 'all') {
      query = query.eq('department_id', departmentId)
    }

    if (search) {
      // Search by NIK, full_name, or email
      query = query.or(`nik.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: employees, count, error } = await query

    if (error) {
      console.error('[AdminEmployeesAPI] Query error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit) || 1

    return NextResponse.json({
      success: true,
      employees: employees || [],
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeesAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data karyawan.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate minimum required fields
    if (!body.nik || !body.full_name || !body.start_date) {
      return NextResponse.json(
        { success: false, error: 'NIK, Nama Lengkap, dan Tanggal Mulai Kerja wajib diisi.' },
        { status: 400 }
      )
    }

    const cleanNIK = String(body.nik).trim()
    if (!/^\d{16}$/.test(cleanNIK)) {
      return NextResponse.json(
        { success: false, error: 'NIK harus berupa 16 digit angka.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check uniqueness of NIK
    const { data: existing } = await adminClient
      .from('employees')
      .select('id, nik, is_deleted')
      .eq('nik', cleanNIK)
      .maybeSingle()

    if (existing && !existing.is_deleted) {
      return NextResponse.json(
        { success: false, error: `NIK ${cleanNIK} sudah terdaftar dalam sistem.` },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const employeeStatus = body.status || 'approved'
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : employeeStatus === 'approved'

    const insertPayload = {
      nik: cleanNIK,
      full_name: String(body.full_name).trim(),
      birth_place: body.birth_place ? String(body.birth_place).trim() : null,
      birth_date: body.birth_date || null,
      address: body.address ? String(body.address).trim() : null,
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      company_id: body.company_id || null,
      site_id: body.site_id || null,
      department_id: body.department_id || null,
      position_id: body.position_id || null,
      is_crew_member: Boolean(body.is_crew_member),
      crew_id: body.is_crew_member && body.crew_id ? body.crew_id : null,
      start_date: body.start_date,
      bank_name: body.bank_name || 'Mandiri',
      account_number: body.account_number ? String(body.account_number).trim() : null,
      account_holder: body.account_holder ? String(body.account_holder).trim() : null,
      status: employeeStatus,
      approved_by: employeeStatus === 'approved' ? admin.id : null,
      approved_at: employeeStatus === 'approved' ? nowIso : null,
      is_active: isActive,
      is_deleted: false,
      created_at: nowIso,
      updated_at: nowIso,
    }

    const { data: newEmployee, error } = await adminClient
      .from('employees')
      .insert(insertPayload)
      .select()
      .single()

    if (error || !newEmployee) {
      console.error('[AdminEmployeesAPI] Insert error:', error?.message)
      return NextResponse.json(
        { success: false, error: error?.message || 'Gagal menambahkan karyawan.' },
        { status: 500 }
      )
    }

    // If status is approved, allocate default initial leave quota
    if (employeeStatus === 'approved') {
      try {
        const currentYear = new Date().getFullYear()
        await addLeaveAllocation(
          newEmployee.id,
          currentYear,
          DEFAULT_LEAVE_QUOTA,
          admin.id,
          'Alokasi kuota cuti tahunan awal'
        )
      } catch (allocErr) {
        console.warn('[AdminEmployeesAPI] Allocation warning:', allocErr)
      }
    }

    // Audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logAction({
      actorType: 'admin',
      actorId: admin.id,
      action: 'ADMIN_CREATE_EMPLOYEE',
      targetType: 'employee',
      targetId: newEmployee.id,
      newValues: {
        nik: newEmployee.nik,
        full_name: newEmployee.full_name,
        company_id: newEmployee.company_id,
        status: newEmployee.status,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan.',
      employee: newEmployee,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeesAPI] POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat membuat karyawan.',
      },
      { status: 500 }
    )
  }
}
