import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { logAction } from '@/lib/services/audit.service'
import { getLeaveBalanceDetail, addLeaveAllocation } from '@/lib/services/leave.service'
import { loanService } from '@/lib/services/loan.service'
import { DEFAULT_LEAVE_QUOTA } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: employee, error } = await adminClient
      .from('employees')
      .select(`
        *,
        company:companies(id, name),
        site:sites(id, name),
        department:departments(id, name),
        position:positions(id, name),
        crew:crews(id, name)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle()

    if (error || !employee) {
      return NextResponse.json(
        { success: false, error: 'Karyawan tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Fetch leave balance detail
    const currentYear = new Date().getFullYear()
    let leaveBalance = null
    try {
      leaveBalance = await getLeaveBalanceDetail(id, currentYear)
    } catch (e) {
      console.warn('[AdminEmployeeDetail] Leave balance error:', e)
    }

    // Fetch active loan info
    let loanInfo = null
    try {
      const activeLoan = await loanService.getActiveLoan(id)
      const remaining = activeLoan ? await loanService.getRemainingObligation(id) : 0
      loanInfo = activeLoan ? { ...activeLoan, remaining_obligation: remaining } : null
    } catch (e) {
      console.warn('[AdminEmployeeDetail] Loan info error:', e)
    }

    return NextResponse.json({
      success: true,
      employee,
      leave_balance: leaveBalance,
      loan_info: loanInfo,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeeDetail] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat detail karyawan.',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const adminClient = createAdminClient()

    const { data: current, error: fetchErr } = await adminClient
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !current) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan.' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      updated_at: nowIso,
    }

    const allowedFields = [
      'full_name',
      'birth_place',
      'birth_date',
      'address',
      'email',
      'phone',
      'company_id',
      'site_id',
      'department_id',
      'position_id',
      'is_crew_member',
      'crew_id',
      'start_date',
      'bank_name',
      'account_number',
      'account_holder',
      'is_active',
      'status',
      'rejection_reason',
    ]

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key]
      }
    }

    // If approving a previously pending or rejected employee
    const isApproving = body.status === 'approved' && current.status !== 'approved'
    if (isApproving) {
      updatePayload.approved_by = admin.id
      updatePayload.approved_at = nowIso
      updatePayload.is_active = true
      updatePayload.rejection_reason = null
    }

    // If rejecting
    if (body.status === 'rejected') {
      updatePayload.is_active = false
      if (body.rejection_reason) {
        updatePayload.rejection_reason = body.rejection_reason
      }
    }

    const { data: updated, error: updateErr } = await adminClient
      .from('employees')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single()

    if (updateErr || !updated) {
      return NextResponse.json(
        { success: false, error: updateErr?.message || 'Gagal memperbarui data karyawan.' },
        { status: 500 }
      )
    }

    // If approved, ensure default leave quota allocation exists
    if (isApproving) {
      try {
        const currentYear = new Date().getFullYear()
        await addLeaveAllocation(
          id,
          currentYear,
          DEFAULT_LEAVE_QUOTA,
          admin.id,
          'Alokasi kuota cuti tahunan awal (Persetujuan Registrasi)'
        )
      } catch (allocErr) {
        console.warn('[AdminEmployeeDetail] Auto allocation on approve warning:', allocErr)
      }
    }

    // Audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logAction({
      actorType: 'admin',
      actorId: admin.id,
      action: isApproving ? 'APPROVE_REGISTRATION' : 'UPDATE_EMPLOYEE',
      targetType: 'employee',
      targetId: id,
      oldValues: current,
      newValues: updatePayload,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: isApproving ? 'Pendaftaran karyawan disetujui.' : 'Data karyawan berhasil diperbarui.',
      employee: updated,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeeDetail] PUT Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: current } = await adminClient
      .from('employees')
      .select('id, nik, full_name, is_deleted')
      .eq('id', id)
      .maybeSingle()

    if (!current) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan.' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    // Soft delete
    const { error: delErr } = await adminClient
      .from('employees')
      .update({
        is_deleted: true,
        is_active: false,
        updated_at: nowIso,
      })
      .eq('id', id)

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 })
    }

    // Revoke any active sessions
    await adminClient.from('sessions').update({ is_revoked: true }).eq('employee_id', id)

    // Audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logAction({
      actorType: 'admin',
      actorId: admin.id,
      action: 'SOFT_DELETE_EMPLOYEE',
      targetType: 'employee',
      targetId: id,
      oldValues: current,
      newValues: { is_deleted: true, is_active: false },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: `Karyawan ${current.full_name} (${current.nik}) berhasil dinonaktifkan / dihapus.`,
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeeDetail] DELETE Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus karyawan.',
      },
      { status: 500 }
    )
  }
}
