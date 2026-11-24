import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('all') === 'true'
    const admin = createAdminClient()

    let compQuery = admin.from('companies').select('*').order('name')
    let siteQuery = admin.from('sites').select('*').order('name')
    let deptQuery = admin.from('departments').select('*').order('name')
    let posQuery = admin.from('positions').select('*').order('name')
    let crewQuery = admin.from('crews').select('*').order('name')

    if (!includeInactive) {
      compQuery = compQuery.eq('is_active', true)
      siteQuery = siteQuery.eq('is_active', true)
      deptQuery = deptQuery.eq('is_active', true)
      posQuery = posQuery.eq('is_active', true)
      crewQuery = crewQuery.eq('is_active', true)
    }

    const [companiesRes, sitesRes, deptsRes, posRes, crewsRes] = await Promise.all([
      compQuery,
      siteQuery,
      deptQuery,
      posQuery,
      crewQuery,
    ])

    return NextResponse.json({
      success: true,
      companies: companiesRes.data || [],
      sites: sitesRes.data || [],
      departments: deptsRes.data || [],
      positions: posRes.data || [],
      crews: crewsRes.data || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil master data'
    return NextResponse.json({
      success: false,
      error: msg,
      companies: [],
      sites: [],
      departments: [],
      positions: [],
      crews: [],
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { entity, data } = await req.json()
    if (!entity || !data?.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama wajib diisi' }, { status: 400 })
    }

    const validEntities = ['companies', 'sites', 'departments', 'positions', 'crews']
    if (!validEntities.includes(entity)) {
      return NextResponse.json({ success: false, error: 'Entity master data tidak valid' }, { status: 400 })
    }

    const admin = createAdminClient()
    const insertPayload: Record<string, any> = {
      name: data.name.trim(),
      is_active: data.is_active ?? true,
    }

    if (entity === 'sites' && data.company_id) {
      insertPayload.company_id = data.company_id
    }

    const { data: inserted, error } = await admin.from(entity as any).insert(insertPayload).select().single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: inserted })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menambah master data'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { entity, id, data } = await req.json()
    if (!entity || !id) {
      return NextResponse.json({ success: false, error: 'Entity dan ID wajib diisi' }, { status: 400 })
    }

    const validEntities = ['companies', 'sites', 'departments', 'positions', 'crews']
    if (!validEntities.includes(entity)) {
      return NextResponse.json({ success: false, error: 'Entity master data tidak valid' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updatePayload: Record<string, any> = {}
    if (data.name !== undefined) updatePayload.name = data.name.trim()
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active
    if (data.company_id !== undefined) updatePayload.company_id = data.company_id

    const { data: updated, error } = await admin
      .from(entity as any)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengubah master data'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const entity = searchParams.get('entity')
    const id = searchParams.get('id')

    if (!entity || !id) {
      return NextResponse.json({ success: false, error: 'Entity dan ID wajib diisi' }, { status: 400 })
    }

    const validEntities = ['companies', 'sites', 'departments', 'positions', 'crews']
    if (!validEntities.includes(entity)) {
      return NextResponse.json({ success: false, error: 'Entity master data tidak valid' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from(entity as any).delete().eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus master data'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
