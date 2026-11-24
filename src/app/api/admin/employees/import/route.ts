import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { logAction } from '@/lib/services/audit.service'
import { addLeaveAllocation } from '@/lib/services/leave.service'
import { DEFAULT_LEAVE_QUOTA } from '@/lib/constants'

function getCellValue(cell: ExcelJS.Cell): string {
  if (!cell || cell.value === null || cell.value === undefined) return ''
  const val = cell.value
  if (typeof val === 'object') {
    if ('text' in val && typeof val.text === 'string') return val.text.trim()
    if ('result' in val && val.result !== undefined && val.result !== null) return String(val.result).trim()
    if (val instanceof Date) return val.toISOString().split('T')[0]
  }
  return String(val).trim()
}

function formatDateValue(val: string): string {
  if (!val) return ''
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  // If DD/MM/YYYY or DD-MM-YYYY
  const parts = val.split(/[/-]/)
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD-MM-YYYY
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }
  const parsed = new Date(val)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return val
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File Excel (.xlsx) wajib diunggah.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json(
        { success: false, error: 'File Excel tidak memiliki lembar kerja (worksheet).' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Preload master data maps (name -> uuid)
    const [companiesRes, sitesRes, deptsRes, posRes, crewsRes, existingEmpRes] = await Promise.all([
      adminClient.from('companies').select('id, name'),
      adminClient.from('sites').select('id, name'),
      adminClient.from('departments').select('id, name'),
      adminClient.from('positions').select('id, name'),
      adminClient.from('crews').select('id, name'),
      adminClient.from('employees').select('nik').eq('is_deleted', false),
    ])

    const companyMap = new Map<string, string>()
    companiesRes.data?.forEach((c) => {
      companyMap.set(c.name.toLowerCase().trim(), c.id)
      companyMap.set(c.id, c.id)
    })

    const siteMap = new Map<string, string>()
    sitesRes.data?.forEach((s) => {
      siteMap.set(s.name.toLowerCase().trim(), s.id)
      siteMap.set(s.id, s.id)
    })

    const deptMap = new Map<string, string>()
    deptsRes.data?.forEach((d) => {
      deptMap.set(d.name.toLowerCase().trim(), d.id)
      deptMap.set(d.id, d.id)
    })

    const posMap = new Map<string, string>()
    posRes.data?.forEach((p) => {
      posMap.set(p.name.toLowerCase().trim(), p.id)
      posMap.set(p.id, p.id)
    })

    const crewMap = new Map<string, string>()
    crewsRes.data?.forEach((cr) => {
      crewMap.set(cr.name.toLowerCase().trim(), cr.id)
      crewMap.set(cr.id, cr.id)
    })

    const dbExistingNiks = new Set<string>()
    existingEmpRes.data?.forEach((e) => {
      if (e.nik) dbExistingNiks.add(e.nik.trim())
    })

    // Track statistics
    let imported = 0
    let skipped = 0
    let failed = 0
    let duplicates = 0
    const errors: string[] = []
    const seenExcelNiks = new Set<string>()

    const rowsToInsert: any[] = []
    const nowIso = new Date().toISOString()
    const currentYear = new Date().getFullYear()

    // Iterate rows starting after header (row 2 onwards)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header

      const nikRaw = getCellValue(row.getCell(1)).replace(/\s+/g, '')
      const fullName = getCellValue(row.getCell(2))
      const birthPlace = getCellValue(row.getCell(3))
      const birthDateRaw = getCellValue(row.getCell(4))
      const address = getCellValue(row.getCell(5))
      const email = getCellValue(row.getCell(6)).toLowerCase()
      const phone = getCellValue(row.getCell(7))
      const companyVal = getCellValue(row.getCell(8))
      const siteVal = getCellValue(row.getCell(9))
      const deptVal = getCellValue(row.getCell(10))
      const posVal = getCellValue(row.getCell(11))
      const crewVal = getCellValue(row.getCell(12))
      const startDateRaw = getCellValue(row.getCell(13))
      const bankName = getCellValue(row.getCell(14)) || 'Mandiri'
      const accNum = getCellValue(row.getCell(15))
      const accHolder = getCellValue(row.getCell(16))

      // If empty row, ignore
      if (!nikRaw && !fullName) return

      // Validate NIK
      if (!nikRaw || !/^\d{16}$/.test(nikRaw)) {
        failed++
        errors.push(`Baris ${rowNumber}: NIK "${nikRaw}" tidak valid (harus 16 digit angka).`)
        return
      }

      // Check duplicates in current Excel
      if (seenExcelNiks.has(nikRaw)) {
        duplicates++
        errors.push(`Baris ${rowNumber}: NIK "${nikRaw}" duplikat dalam file Excel.`)
        return
      }
      seenExcelNiks.add(nikRaw)

      // Check existing NIK in DB
      if (dbExistingNiks.has(nikRaw)) {
        skipped++
        return // Skipped silently or note as existing
      }

      // Validate required fields
      if (!fullName) {
        failed++
        errors.push(`Baris ${rowNumber}: Nama lengkap wajib diisi untuk NIK ${nikRaw}.`)
        return
      }

      const startDate = formatDateValue(startDateRaw)
      if (!startDate) {
        failed++
        errors.push(`Baris ${rowNumber}: Tanggal mulai kerja wajib diisi untuk NIK ${nikRaw}.`)
        return
      }

      const birthDate = formatDateValue(birthDateRaw) || null

      // Resolve relations
      const companyId = companyMap.get(companyVal.toLowerCase().trim()) || null
      const siteId = siteMap.get(siteVal.toLowerCase().trim()) || null
      const departmentId = deptMap.get(deptVal.toLowerCase().trim()) || null
      const positionId = posMap.get(posVal.toLowerCase().trim()) || null
      const crewId = crewMap.get(crewVal.toLowerCase().trim()) || null
      const isCrewMember = Boolean(crewId || crewVal)

      rowsToInsert.push({
        nik: nikRaw,
        full_name: fullName,
        birth_place: birthPlace || null,
        birth_date: birthDate,
        address: address || null,
        email: email || null,
        phone: phone || null,
        company_id: companyId,
        site_id: siteId,
        department_id: departmentId,
        position_id: positionId,
        is_crew_member: isCrewMember,
        crew_id: crewId,
        start_date: startDate,
        bank_name: bankName,
        account_number: accNum || null,
        account_holder: accHolder || fullName,
        status: 'approved',
        approved_by: admin.id,
        approved_at: nowIso,
        is_active: true,
        is_deleted: false,
        created_at: nowIso,
        updated_at: nowIso,
      })
    })

    // Batch insert valid employees
    if (rowsToInsert.length > 0) {
      const { data: insertedList, error: insertError } = await adminClient
        .from('employees')
        .insert(rowsToInsert)
        .select()

      if (insertError) {
        console.error('[AdminImportAPI] Insert error:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: `Gagal menyimpan data ke database: ${insertError.message}`,
            imported: 0,
            skipped,
            failed: failed + rowsToInsert.length,
            duplicates,
            errors: [...errors, insertError.message],
          },
          { status: 500 }
        )
      }

      imported = insertedList ? insertedList.length : rowsToInsert.length

      // Add default leave quota for all inserted employees
      if (insertedList && insertedList.length > 0) {
        for (const emp of insertedList) {
          try {
            await addLeaveAllocation(
              emp.id,
              currentYear,
              DEFAULT_LEAVE_QUOTA,
              admin.id,
              'Alokasi kuota cuti tahunan awal (Import Excel)'
            )
          } catch (e) {
            console.warn('[AdminImportAPI] Quota alloc error for', emp.nik, e)
          }
        }
      }
    }

    // Audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logAction({
      actorType: 'admin',
      actorId: admin.id,
      action: 'IMPORT_EMPLOYEES',
      targetType: 'employees',
      newValues: {
        imported,
        skipped,
        failed,
        duplicates,
        total_in_file: seenExcelNiks.size,
      },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: `Import selesai. ${imported} berhasil diimpor, ${skipped} dilewati (sudah terdaftar), ${duplicates} duplikat, ${failed} gagal.`,
      imported,
      skipped,
      failed,
      duplicates,
      errors,
    })
  } catch (error: unknown) {
    console.error('[AdminImportAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat memproses file Excel.',
      },
      { status: 500 }
    )
  }
}
