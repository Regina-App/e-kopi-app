import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromSession } from '@/lib/services/admin.service'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ authenticated: false, admin: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        force_pin_change: admin.force_pin_change,
        permissions: admin.permissions,
      },
    })
  } catch (error: unknown) {
    console.error('[AdminSessionRoute] Error:', error)
    return NextResponse.json({ authenticated: false, admin: null }, { status: 500 })
  }
}
