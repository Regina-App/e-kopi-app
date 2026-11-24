import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminFromSession,
  getAdmins,
  createAdmin,
  type CreateAdminData,
} from '@/lib/services/admin.service'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya Super Admin yang berhak mengakses data ini.' },
        { status: 403 }
      )
    }

    const adminsList = await getAdmins()

    const formatted = adminsList.map((adm) => {
      const perms = adm.permissions || {}
      const permissionsCount = Object.values(perms).filter(Boolean).length
      return {
        id: adm.id,
        name: adm.name,
        email: adm.email,
        role: adm.role,
        is_active: adm.is_active,
        force_pin_change: adm.force_pin_change,
        permissions: perms,
        permissions_count: permissionsCount,
        created_at: adm.created_at,
        updated_at: adm.updated_at,
      }
    })

    return NextResponse.json({
      success: true,
      admins: formatted,
    })
  } catch (error: unknown) {
    console.error('[AdminAdminsAPI] GET Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat daftar administrator.',
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

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya Super Admin yang berhak menambah administrator.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, pin, role, permissions } = body

    if (!name || !email || !pin) {
      return NextResponse.json(
        { success: false, error: 'Nama, Email, dan PIN 4 digit wajib diisi.' },
        { status: 400 }
      )
    }

    const cleanPin = String(pin).trim()
    if (!/^\d{4}$/.test(cleanPin)) {
      return NextResponse.json(
        { success: false, error: 'PIN administrator harus tepat 4 digit angka.' },
        { status: 400 }
      )
    }

    const createData: CreateAdminData = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      pin: cleanPin,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      force_pin_change: true,
      permissions: permissions || undefined,
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await createAdmin(createData, admin.id, { ipAddress, userAgent })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator baru berhasil dibuat.',
      admin: result.admin,
    })
  } catch (error: unknown) {
    console.error('[AdminAdminsAPI] POST Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menambahkan administrator.',
      },
      { status: 500 }
    )
  }
}
