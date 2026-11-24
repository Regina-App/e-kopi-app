import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRegistrationApproved, sendRegistrationRejected } from '@/lib/services/email.service'
import { logAction, AUDIT_ACTIONS } from '@/lib/services/audit.service'
import type { Employee } from '@/lib/types/database'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID karyawan tidak valid' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { action, reason } = body

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { success: false, error: "Aksi tidak valid. Nilai yang diperbolehkan: 'approve' atau 'reject'." },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Fetch employee
    const { data: employee, error: empErr } = await adminClient
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (empErr || !employee) {
      return NextResponse.json(
        { success: false, error: 'Data karyawan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (employee.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Pendaftaran tidak dapat diproses karena saat ini berstatus '${employee.status}'`,
        },
        { status: 400 }
      )
    }

    // 2. Fetch active admin ID
    const { data: adminRecord } = await adminClient
      .from('admins')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    const adminId = adminRecord?.id || '00000000-0000-0000-0000-000000000000'
    const nowIso = new Date().toISOString()

    // 3. Update employee status
    let updatePayload: Record<string, any> = {}
    if (action === 'approve') {
      updatePayload = {
        status: 'approved',
        approved_by: adminId,
        approved_at: nowIso,
        rejection_reason: null,
        is_active: true,
        updated_at: nowIso,
      }
    } else {
      updatePayload = {
        status: 'rejected',
        approved_by: adminId,
        approved_at: nowIso,
        rejection_reason: reason || 'Pendaftaran tidak memenuhi kualifikasi perusahaan',
        is_active: false,
        updated_at: nowIso,
      }
    }

    const { data: updatedEmployee, error: updateErr } = await adminClient
      .from('employees')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      console.error('[AdminRegistrationsApprove:Error]', updateErr)
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 4. Send email notification
    if (action === 'approve') {
      await sendRegistrationApproved(updatedEmployee as Employee)
    } else {
      await sendRegistrationRejected(updatedEmployee as Employee, reason)
    }

    // 5. Audit log
    await logAction({
      actorType: 'admin',
      actorId: adminId,
      action:
        action === 'approve'
          ? AUDIT_ACTIONS.APPROVE_REGISTRATION
          : AUDIT_ACTIONS.REJECT_REGISTRATION,
      targetType: 'employees',
      targetId: id,
      oldValues: {
        status: employee.status,
      },
      newValues: {
        status: updatePayload.status,
        reason: reason || null,
        processed_at: nowIso,
      },
    })

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Pendaftaran karyawan berhasil disetujui'
          : 'Pendaftaran karyawan telah ditolak',
      employee: updatedEmployee,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses pendaftaran'
    console.error('[AdminRegistrationsApprove:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
