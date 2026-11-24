import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Tables to snapshot
    const tables = [
      'companies',
      'sites',
      'departments',
      'positions',
      'crews',
      'employees',
      'leave_requests',
      'leave_balance_ledger',
      'loan_requests',
      'loan_installments',
      'app_settings',
      'admins',
      'audit_logs',
    ] as const

    const backupData: Record<string, any[]> = {}
    const stats: Record<string, number> = {}

    for (const table of tables) {
      const { data, error } = await adminClient.from(table).select('*')
      if (error) {
        console.warn(`[BackupAPI] Failed to fetch table ${table}:`, error.message)
        backupData[table] = []
        stats[table] = 0
      } else {
        backupData[table] = data || []
        stats[table] = (data || []).length
      }
    }

    const now = new Date()
    const timestampStr = now.toISOString().replace(/[:.]/g, '-')
    const dateFormatted = now.toISOString().split('T')[0]

    const fullArchive = {
      app: 'E-KOPI By Regina - App',
      version: '1.0.0',
      backup_timestamp: now.toISOString(),
      backup_date: dateFormatted,
      created_by: {
        admin_id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      statistics: stats,
      total_records: Object.values(stats).reduce((a, b) => a + b, 0),
      data: backupData,
    }

    const filename = `E-KOPI_FULL_BACKUP_${dateFormatted}_${timestampStr.slice(11, 19)}.json`
    const jsonString = JSON.stringify(fullArchive, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghasilkan backup database'
    console.error('[AdminBackupAPI:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
