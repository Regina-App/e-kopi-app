import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminFromSession } from '@/lib/services/admin.service'
import { formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromSession(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // 1. Fetch all non-deleted employees with relations
    const { data: employees, error } = await adminClient
      .from('employees')
      .select(`
        id,
        nik,
        full_name,
        email,
        phone,
        birth_place,
        birth_date,
        address,
        start_date,
        bank_name,
        account_number,
        account_holder,
        status,
        is_active,
        is_crew_member,
        created_at,
        company:companies(id, name),
        site:sites(id, name),
        department:departments(id, name),
        position:positions(id, name),
        crew:crews(id, name)
      `)
      .eq('is_deleted', false)
      .order('nik', { ascending: true })

    if (error) {
      console.error('[EmployeeExport] Supabase fetch error:', error)
      return NextResponse.json({ success: false, error: 'Gagal mengambil data karyawan.' }, { status: 500 })
    }

    // 2. Fetch current year leave balances for all employees
    const currentYear = new Date().getFullYear()
    const { data: ledgers } = await adminClient
      .from('leave_balance_ledger')
      .select('employee_id, type, amount')
      .eq('year', currentYear)

    // Calculate balance map
    const balanceMap: Record<string, { total: number; used: number; available: number }> = {}
    if (ledgers) {
      for (const entry of (ledgers as any[])) {
        if (!balanceMap[entry.employee_id]) {
          balanceMap[entry.employee_id] = { total: 0, used: 0, available: 0 }
        }
        if (entry.type === 'allocation' || entry.type === 'carry_forward' || entry.type === 'adjustment') {
          balanceMap[entry.employee_id].total += Number(entry.amount || 0)
        } else if (entry.type === 'usage') {
          balanceMap[entry.employee_id].used += Math.abs(Number(entry.amount || 0))
        }
      }
      for (const empId of Object.keys(balanceMap)) {
        balanceMap[empId].available = balanceMap[empId].total - balanceMap[empId].used
      }
    }

    // 3. Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'PT E-KOPI SUKSES MAKMUR'
    workbook.lastModifiedBy = admin.name || 'Admin System'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('Data Karyawan', {
      views: [{ showGridLines: true, state: 'frozen', ySplit: 5 }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    })

    // Title & Header info
    worksheet.mergeCells('A1:Q1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'PT E-KOPI SUKSES MAKMUR - MASTER DATABASE KARYAWAN'
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Deep Blue
    }
    worksheet.getRow(1).height = 36

    worksheet.mergeCells('A2:Q2')
    const subTitleCell = worksheet.getCell('A2')
    subTitleCell.value = `Tanggal Ekspor: ${formatDate(new Date(), 'dd MMMM yyyy, HH:mm')} WIB | Diekspor Oleh: ${admin.name} (${admin.email}) | Total Data: ${employees?.length || 0} Pegawai`
    subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } }
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getRow(2).height = 20

    // Row 3 blank separator
    worksheet.getRow(3).height = 10

    // Column Headers (Row 4)
    const headers = [
      'NO',
      'NIK',
      'NAMA LENGKAP',
      'PERUSAHAAN',
      'SITE / LOKASI',
      'DEPARTEMEN',
      'JABATAN',
      'STATUS REGU',
      'NAMA REGU',
      'TGL MASUK KERJA',
      'STATUS AKUN',
      'TOTAL KUOTA CUTI',
      'CUTI TERPAKAI',
      'SISA SALDO CUTI',
      'BANK',
      'NO REKENING',
      'EMAIL'
    ]

    const headerRow = worksheet.getRow(4)
    headerRow.values = headers
    headerRow.height = 26
    headerRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Slate 900
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF64748B' } },
        bottom: { style: 'medium', color: { argb: 'FF3B82F6' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      }
    })

    // Populate data
    let currentRowIndex = 5
    const rows = employees || []

    rows.forEach((emp: any, index: number) => {
      const empBalance = balanceMap[emp.id] || { total: 0, used: 0, available: 0 }
      const row = worksheet.getRow(currentRowIndex)

      const statusLabel = emp.status === 'approved' ? 'Disetujui' : emp.status === 'pending' ? 'Pending' : 'Ditolak'
      const crewStatus = emp.is_crew_member ? 'Anggota Regu' : 'Non-Regu'

      row.values = [
        index + 1,
        emp.nik || '-',
        emp.full_name || '-',
        emp.company?.name || '-',
        emp.site?.name || '-',
        emp.department?.name || '-',
        emp.position?.name || '-',
        crewStatus,
        emp.crew?.name || '-',
        emp.start_date || '-',
        statusLabel,
        empBalance.total,
        empBalance.used,
        { formula: `L${currentRowIndex}-M${currentRowIndex}`, result: empBalance.available },
        emp.bank_name || '-',
        emp.account_number || '-',
        emp.email || '-'
      ]

      row.height = 22
      row.font = { name: 'Calibri', size: 10 }
      row.alignment = { vertical: 'middle', horizontal: 'left' }

      // Alignments & formats
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'right' }
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'right' }

      // Number formatting for quotas
      row.getCell(12).numFmt = '#,##0'
      row.getCell(13).numFmt = '#,##0'
      row.getCell(14).numFmt = '#,##0'

      // Zebra striping
      const isEven = index % 2 === 0
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type !== 'pattern') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
          }
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
      })

      currentRowIndex++
    })

    // Summary Row with formulas
    const summaryRow = worksheet.getRow(currentRowIndex)
    summaryRow.values = [
      '',
      '',
      'TOTAL REKAPITULASI',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `Total Pegawai: ${rows.length}`,
      { formula: `SUM(L5:L${currentRowIndex - 1})` },
      { formula: `SUM(M5:M${currentRowIndex - 1})` },
      { formula: `SUM(N5:N${currentRowIndex - 1})` },
      '',
      '',
      ''
    ]

    summaryRow.height = 24
    summaryRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } }
    summaryRow.alignment = { vertical: 'middle', horizontal: 'right' }
    summaryRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }

    summaryRow.getCell(12).numFmt = '#,##0'
    summaryRow.getCell(13).numFmt = '#,##0'
    summaryRow.getCell(14).numFmt = '#,##0'

    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
      }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF1E293B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      }
    })

    // Auto-fit column widths
    const columnWidths = [6, 16, 26, 22, 18, 20, 20, 14, 16, 16, 14, 16, 14, 16, 14, 18, 26]
    worksheet.columns.forEach((col, idx) => {
      if (columnWidths[idx]) {
        col.width = columnWidths[idx]
      }
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `Database_Karyawan_PT_E-KOPI_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error: unknown) {
    console.error('[EmployeeExport] API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Terjadi gangguan ekspor database.' },
      { status: 500 }
    )
  }
}
