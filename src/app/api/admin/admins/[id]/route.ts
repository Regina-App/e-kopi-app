import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminFromSession,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  updatePermissions,
} from '@/lib/services/admin.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (admin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 })
    }

    const { id } = await params
    const targetAdmin = await getAdminById(id)

    if (!targetAdmin) {
      return NextResponse.json({ success: false, error: 'Administrator tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      admin: targetAdmin,
    })
  } catch (error: unknown) {
    console.error('[AdminAdminDetailAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat administrator.',
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

    if (admin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // 1. Update basic fields if provided
    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.force_pin_change !== undefined) updateData.force_pin_change = body.force_pin_change

    // PIN reset
    if (body.pin) {
      const cleanPin = String(body.pin).trim()
      if (!/^\d{4}$/.test(cleanPin)) {
        return NextResponse.json(
          { success: false, error: 'PIN baru harus tepat 4 digit angka.' },
          { status: 400 }
        )
      }
      updateData.pin = cleanPin
      updateData.force_pin_change = true // Require change on next login
    }

    if (Object.keys(updateData).length > 0) {
      const result = await updateAdmin(id, updateData, admin.id, { ipAddress, userAgent })
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
    }

    // 2. Update permissions if provided
    if (body.permissions && typeof body.permissions === 'object') {
      await updatePermissions(id, body.permissions, admin.id, { ipAddress, userAgent })
    }

    const updated = await getAdminById(id)

    return NextResponse.json({
      success: true,
      message: 'Data administrator berhasil diperbarui.',
      admin: updated,
    })
  } catch (error: unknown) {
    console.error('[AdminAdminDetailAPI] PUT Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui administrator.',
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

    if (admin.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 })
    }

    const { id } = await params

    if (admin.id === id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await deleteAdmin(id, admin.id, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator berhasil dihapus / dinonaktifkan.',
    })
  } catch (error: unknown) {
    console.error('[AdminAdminDetailAPI] DELETE Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus administrator.',
      },
      { status: 500 }
    )
  }
}
