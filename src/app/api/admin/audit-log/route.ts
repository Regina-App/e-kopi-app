import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditLog, ActorType } from '@/lib/types/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)))
    const offset = (page - 1) * limit

    const actorType = searchParams.get('actorType') as ActorType | 'all' | null
    const action = searchParams.get('action')
    const targetType = searchParams.get('targetType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')?.trim()

    const adminClient = createAdminClient()

    let query = adminClient
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (actorType && actorType !== 'all') {
      query = query.eq('actor_type', actorType)
    }

    if (action && action !== 'all') {
      query = query.eq('action', action)
    }

    if (targetType && targetType !== 'all') {
      query = query.eq('target_type', targetType)
    }

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    if (search) {
      // Filter by action or target_id
      query = query.or(`action.ilike.%${search}%,target_id.ilike.%${search}%,actor_id.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: logs, count, error } = await query

    if (error) {
      console.error('[AuditLogAPI:Error]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Enrich logs with actor names (employees and admins)
    const enrichedLogs = [...(logs || [])]
    const employeeIds = Array.from(
      new Set(
        enrichedLogs
          .filter((l) => l.actor_type === 'employee' && l.actor_id)
          .map((l) => l.actor_id as string)
      )
    )
    const adminIds = Array.from(
      new Set(
        enrichedLogs
          .filter((l) => l.actor_type === 'admin' && l.actor_id)
          .map((l) => l.actor_id as string)
      )
    )

    const actorMap: Record<string, { name: string; info?: string }> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await adminClient
        .from('employees')
        .select('id, full_name, nik')
        .in('id', employeeIds)
      if (emps) {
        emps.forEach((e) => {
          actorMap[e.id] = { name: e.full_name, info: `NIK: ${e.nik}` }
        })
      }
    }

    if (adminIds.length > 0) {
      const { data: admins } = await adminClient
        .from('admins')
        .select('id, name, email')
        .in('id', adminIds)
      if (admins) {
        admins.forEach((a) => {
          actorMap[a.id] = { name: a.name, info: a.email }
        })
      }
    }

    const items = enrichedLogs.map((log) => {
      let actorLabel = log.actor_id || '-'
      let actorDetail = ''
      if (log.actor_type === 'system') {
        actorLabel = 'SISTEM E-KOPI'
      } else if (log.actor_id && actorMap[log.actor_id]) {
        actorLabel = actorMap[log.actor_id].name
        actorDetail = actorMap[log.actor_id].info || ''
      }

      return {
        ...log,
        actorName: actorLabel,
        actorDetail,
      }
    })

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      logs: items,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat log audit'
    console.error('[AuditLogAPI:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
