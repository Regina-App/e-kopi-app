import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAction, AUDIT_ACTIONS } from '@/lib/services/audit.service'
import type { AppSetting, Json } from '@/lib/types/database'

const DEFAULT_SETTINGS: Record<string, any> = {
  // Identitas
  app_name: 'E-KOPI By Regina - App',
  app_description: 'Sistem Terpadu Pengajuan Cuti & Pinjaman Koperasi Karyawan',
  app_version: '1.0.0',
  app_developer: 'Regina - App',

  // Perusahaan
  company_name: 'PT REGINA PRIMA NUSANTARA',
  company_address: 'Kawasan Operasional E-KOPI, Jl. Industri Makmur No. 88, Indonesia',
  company_email: 'admin@ekopi.app',
  company_phone: '+62 21 8899 0011',

  // Cuti
  default_leave_quota: 12,
  min_work_duration_months: 12,
  leave_accumulation_enabled: true,

  // Koperasi
  interest_rate: 0.025, // 2.5%
  max_loan_amount: 10000000,
  max_tenor: 4,
  loan_period_start: 8,
  loan_period_end: 28,
  loan_deduction_day: 5,
  first_time_borrower_rule:
    'Peminjam baru untuk pertama kali wajib menyerahkan salinan KTP dan slip gaji asli ke kantor operasional.',

  // Aset
  logo_url: '/images/logo.png',
  letterhead_url: null,
  donation_qr_url: null,
}

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: dbSettings, error } = await adminClient.from('app_settings').select('*')

    if (error) {
      console.warn('[AdminSettingsAPI:Warn] Failed to query app_settings table, using defaults:', error.message)
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      })
    }

    const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS }

    if (dbSettings) {
      for (const row of dbSettings as AppSetting[]) {
        settingsMap[row.key] = row.value
      }
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat pengaturan'
    console.error('[AdminSettingsAPI:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const adminClient = createAdminClient()

    // Retrieve old settings for audit diff
    const { data: currentSettings } = await adminClient.from('app_settings').select('*')
    const oldValues: Record<string, any> = {}
    if (currentSettings) {
      for (const s of currentSettings as AppSetting[]) {
        oldValues[s.key] = s.value
      }
    }

    // Determine admin caller ID
    const { data: adminRecord } = await adminClient
      .from('admins')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    const adminId = adminRecord?.id || '00000000-0000-0000-0000-000000000000'
    const nowIso = new Date().toISOString()

    // Accept either a single key-value or an object with multiple key-value pairs
    const updates: Record<string, any> = {}
    if (body.key !== undefined && body.value !== undefined) {
      updates[body.key] = body.value
    } else if (typeof body === 'object') {
      Object.assign(updates, body)
      delete updates.key
      delete updates.value
    }

    const upsertRows = Object.entries(updates).map(([k, v]) => ({
      key: k,
      value: v as Json,
      updated_at: nowIso,
      updated_by: adminId,
    }))

    if (upsertRows.length > 0) {
      const { error: upsertErr } = await adminClient.from('app_settings').upsert(upsertRows, {
        onConflict: 'key',
      })

      if (upsertErr) {
        console.error('[AdminSettingsAPI:UpsertError]', upsertErr)
        return NextResponse.json({ success: false, error: upsertErr.message }, { status: 500 })
      }
    }

    // Audit log
    await logAction({
      actorType: 'admin',
      actorId: adminId,
      action: 'UPDATE_SETTINGS',
      targetType: 'app_settings',
      oldValues,
      newValues: updates,
    })

    // Return merged updated settings
    const mergedSettings = { ...DEFAULT_SETTINGS, ...oldValues, ...updates }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan',
      settings: mergedSettings,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan'
    console.error('[AdminSettingsAPI:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
