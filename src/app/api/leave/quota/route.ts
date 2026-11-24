import { NextRequest, NextResponse } from 'next/server'
import {
  addLeaveAllocation,
  getAllEmployeesWithLeaveBalances,
} from '@/lib/services/leave.service'
import { leaveQuotaSchema } from '@/lib/validators'
import { createAdminClient } from '@/lib/supabase/admin'

async function resolveAdmin(request: NextRequest) {
  const adminClient = createAdminClient()

  // 1. Check header
  const headerAdminId = request.headers.get('x-admin-id')
  if (headerAdminId) {
    const { data: admin } = await adminClient
      .from('admins')
      .select('id, name, email, role, is_active')
      .eq('id', headerAdminId)
      .eq('is_active', true)
      .maybeSingle()
    if (admin) return admin
  }

  // 2. Check cookies
  const cookieAdminId = request.cookies.get('admin_id')?.value
  if (cookieAdminId) {
    const { data: admin } = await adminClient
      .from('admins')
      .select('id, name, email, role, is_active')
      .eq('id', cookieAdminId)
      .eq('is_active', true)
      .maybeSingle()
    if (admin) return admin
  }

  // 3. Fallback for admin panel / development: resolve the default super admin
  const { data: defaultAdmin } = await adminClient
    .from('admins')
    .select('id, name, email, role, is_active')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  return defaultAdmin || null
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await resolveAdmin(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate with leaveQuotaSchema
    const validation = leaveQuotaSchema.safeParse(body)
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || 'Data kuota cuti tidak valid'
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const { employee_id, year, amount } = validation.data
    const description = typeof body.description === 'string' ? body.description : undefined

    const result = await addLeaveAllocation(
      employee_id,
      year,
      amount,
      adminUser.id,
      description
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Kuota cuti ${amount} hari untuk tahun ${year} berhasil ditambahkan`,
      entry: result.entry,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API POST /api/leave/quota] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await resolveAdmin(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    const list = await getAllEmployeesWithLeaveBalances(year)

    return NextResponse.json({
      year,
      total_employees: list.length,
      employees: list,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    console.error('[API GET /api/leave/quota] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
