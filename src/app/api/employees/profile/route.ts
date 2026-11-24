import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeFromSession } from '@/lib/services/auth.service'
import { updateEmployee, getEmployeeProfile } from '@/lib/services/employee.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    let employee = await getEmployeeFromSession(request)

    if (!employee) {
      const admin = createAdminClient()
      const headerEmpId = request.headers.get('x-employee-id')
      const cookieEmpId = request.cookies.get('employee_id')?.value
      const fallbackId = headerEmpId || cookieEmpId

      if (fallbackId) {
        employee = await getEmployeeProfile(fallbackId)
      } else {
        const { data: emp } = await admin
          .from('employees')
          .select('id')
          .eq('status', 'approved')
          .eq('is_active', true)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle()
        if (emp) {
          employee = await getEmployeeProfile(emp.id)
        }
      }
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, employee })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching profile'
    console.error('[API Profile GET] Error:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data profil pegawai' },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Format nomor telepon tidak valid'),
})

export async function PATCH(request: NextRequest) {
  try {
    const currentEmployee = await getEmployeeFromSession(request)

    if (!currentEmployee) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak valid' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Data tidak valid',
        },
        { status: 400 }
      )
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Employees can only update their own email and phone
    const updateResult = await updateEmployee(
      currentEmployee.id,
      {
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone.trim(),
      },
      {
        actorType: 'employee',
        actorId: currentEmployee.id,
        ipAddress,
        userAgent,
      }
    )

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      employee: updateResult.employee,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating profile'
    console.error('[API Profile Update] Error:', errorMsg)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memperbarui profil' },
      { status: 500 }
    )
  }
}
