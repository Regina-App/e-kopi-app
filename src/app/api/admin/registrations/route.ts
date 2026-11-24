import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()

    const adminClient = createAdminClient()

    let query = adminClient
      .from('employees')
      .select(
        `
        *,
        company:companies(name),
        site:sites(name),
        department:departments(name),
        position:positions(name),
        crew:crews(name)
      `
      )
      .eq('status', 'pending')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: registrations, error } = await query

    if (error) {
      console.error('[AdminRegistrationsAPI:Error]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: registrations?.length || 0,
      registrations: registrations || [],
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat pendaftaran pending'
    console.error('[AdminRegistrationsAPI:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
