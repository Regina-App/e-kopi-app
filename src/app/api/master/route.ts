import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Fallback seed master data if database tables haven't been seeded yet
const DEFAULT_COMPANIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'PT E-KOPI Nusantara', is_active: true },
  { id: '11111111-1111-1111-1111-111111111112', name: 'PT Agro Industri Kopi', is_active: true },
]

const DEFAULT_SITES = [
  { id: '22222222-2222-2222-2222-222222222221', name: 'Head Office (Jakarta)', company_id: '11111111-1111-1111-1111-111111111111', is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Site Kebun A (Malang)', company_id: '11111111-1111-1111-1111-111111111111', is_active: true },
  { id: '22222222-2222-2222-2222-222222222223', name: 'Site Kebun B (Gayo)', company_id: '11111111-1111-1111-1111-111111111112', is_active: true },
]

const DEFAULT_DEPARTMENTS = [
  { id: '33333333-3333-3333-3333-333333333331', name: 'Operasional & Produksi', is_active: true },
  { id: '33333333-3333-3333-3333-333333333332', name: 'Keuangan & Akuntansi', is_active: true },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sumber Daya Manusia (HRD)', is_active: true },
  { id: '33333333-3333-3333-3333-333333333334', name: 'Keamanan (Security)', is_active: true },
  { id: '33333333-3333-3333-3333-333333333335', name: 'Logistik & Gudang', is_active: true },
]

const DEFAULT_POSITIONS = [
  { id: '44444444-4444-4444-4444-444444444441', name: 'Operator Lapangan', is_active: true },
  { id: '44444444-4444-4444-4444-444444444442', name: 'Staff Administrasi', is_active: true },
  { id: '44444444-4444-4444-4444-444444444443', name: 'Supervisor', is_active: true },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Security Guard', is_active: true },
  { id: '44444444-4444-4444-4444-444444444445', name: 'Teknisi & Maintenance', is_active: true },
]

const DEFAULT_CREWS = [
  { id: '55555555-5555-5555-5555-555555555551', name: 'Regu 1', is_active: true },
  { id: '55555555-5555-5555-5555-555555555552', name: 'Regu 2', is_active: true },
  { id: '55555555-5555-5555-5555-555555555553', name: 'Regu 3', is_active: true },
  { id: '55555555-5555-5555-5555-555555555554', name: 'Non-Regu', is_active: true },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Secwan', is_active: true },
]

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

    const companies = companiesRes.data && companiesRes.data.length > 0 ? companiesRes.data : DEFAULT_COMPANIES
    const sites = sitesRes.data && sitesRes.data.length > 0 ? sitesRes.data : DEFAULT_SITES
    const departments = deptsRes.data && deptsRes.data.length > 0 ? deptsRes.data : DEFAULT_DEPARTMENTS
    const positions = posRes.data && posRes.data.length > 0 ? posRes.data : DEFAULT_POSITIONS
    const crews = crewsRes.data && crewsRes.data.length > 0 ? crewsRes.data : DEFAULT_CREWS

    return NextResponse.json({
      success: true,
      companies,
      sites,
      departments,
      positions,
      crews,
    })
  } catch {
    // If db fails to connect, fallback to defaults
    return NextResponse.json({
      success: true,
      companies: DEFAULT_COMPANIES,
      sites: DEFAULT_SITES,
      departments: DEFAULT_DEPARTMENTS,
      positions: DEFAULT_POSITIONS,
      crews: DEFAULT_CREWS,
    })
  }
}

export async function POST(req: Request) {
  try {
    const { entity, data } = await req.json()
    if (!entity || !data?.name) {
      return NextResponse.json({ success: false, error: 'Entity dan nama wajib diisi' }, { status: 400 })
    }

    const validEntities = ['companies', 'sites', 'departments', 'positions', 'crews']
    if (!validEntities.includes(entity)) {
      return NextResponse.json({ success: false, error: 'Entity master data tidak valid' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: inserted, error } = await admin.from(entity as any).insert({
      name: data.name,
      company_id: data.company_id || null,
      is_active: data.is_active ?? true,
    }).select().single()

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
    if (data.name !== undefined) updatePayload.name = data.name
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
