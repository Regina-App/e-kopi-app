import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'E-KOPI Admin System'
    workbook.created = new Date()

    // Sheet 1: Template Data
    const sheet = workbook.addWorksheet('Data Karyawan', {
      views: [{ showGridLines: true }],
    })

    const columns = [
      { header: 'NIK (16 Digit)*', key: 'nik', width: 22 },
      { header: 'Nama Lengkap*', key: 'full_name', width: 26 },
      { header: 'Tempat Lahir', key: 'birth_place', width: 18 },
      { header: 'Tanggal Lahir (YYYY-MM-DD)', key: 'birth_date', width: 26 },
      { header: 'Alamat Lengkap', key: 'address', width: 32 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Nomor HP', key: 'phone', width: 18 },
      { header: 'Perusahaan', key: 'company', width: 24 },
      { header: 'Site / Lokasi', key: 'site', width: 24 },
      { header: 'Departemen', key: 'department', width: 24 },
      { header: 'Jabatan', key: 'position', width: 22 },
      { header: 'Regu Kerja (Opsional)', key: 'crew', width: 22 },
      { header: 'Tanggal Mulai Kerja (YYYY-MM-DD)*', key: 'start_date', width: 30 },
      { header: 'Nama Bank', key: 'bank_name', width: 18 },
      { header: 'Nomor Rekening', key: 'account_number', width: 22 },
      { header: 'Atas Nama Rekening', key: 'account_holder', width: 26 },
    ]

    sheet.columns = columns

    // Header styling: Dark blue #1E293B, white text, bold
    const headerRow = sheet.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      }
      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      }
    })

    // Sample data rows
    const sampleRows = [
      {
        nik: '3201012304900001',
        full_name: 'Budi Santoso',
        birth_place: 'Malang',
        birth_date: '1990-04-23',
        address: 'Jl. Raya Kebun Kopi No. 12, Dampit, Malang',
        email: 'budi.santoso@example.com',
        phone: '081234567890',
        company: 'PT E-KOPI Nusantara',
        site: 'Site Kebun A (Malang)',
        department: 'Operasional & Produksi',
        position: 'Operator Lapangan',
        crew: 'Regu 1',
        start_date: '2022-01-15',
        bank_name: 'Mandiri',
        account_number: '1440012345678',
        account_holder: 'Budi Santoso',
      },
      {
        nik: '3201012304900002',
        full_name: 'Siti Aminah',
        birth_place: 'Surabaya',
        birth_date: '1993-08-14',
        address: 'Jl. Melati Blok C4, Klojen, Malang',
        email: 'siti.aminah@example.com',
        phone: '081398765432',
        company: 'PT E-KOPI Nusantara',
        site: 'Head Office (Jakarta)',
        department: 'Sumber Daya Manusia (HRD)',
        position: 'Staff Administrasi',
        crew: 'Non-Regu',
        start_date: '2023-03-01',
        bank_name: 'Mandiri',
        account_number: '1440098765432',
        account_holder: 'Siti Aminah',
      },
    ]

    sampleRows.forEach((item, idx) => {
      const row = sheet.addRow(item)
      row.height = 24
      row.eachCell((cell, colNumber) => {
        // Enforce text format for NIK and Account Number to prevent scientific notation
        if (colNumber === 1 || colNumber === 15) {
          cell.numFmt = '@'
        }
        cell.font = { name: 'Arial', size: 10 }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      })
    })

    // Sheet 2: Petunjuk Pengisian
    const guideSheet = workbook.addWorksheet('Petunjuk Pengisian')
    guideSheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Kolom', key: 'column', width: 28 },
      { header: 'Wajib/Opsional', key: 'required', width: 16 },
      { header: 'Keterangan & Format', key: 'description', width: 50 },
    ]

    const guideHeader = guideSheet.getRow(1)
    guideHeader.height = 26
    guideHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    const guides = [
      { no: 1, column: 'NIK', required: 'Wajib', description: 'Harus 16 digit angka unik. Tidak boleh sama dengan data yang sudah ada.' },
      { no: 2, column: 'Nama Lengkap', required: 'Wajib', description: 'Nama lengkap pegawai sesuai KTP.' },
      { no: 3, column: 'Tempat & Tanggal Lahir', required: 'Opsional', description: 'Format tanggal lahir: YYYY-MM-DD (Contoh: 1990-04-23).' },
      { no: 4, column: 'Perusahaan / Site', required: 'Opsional', description: 'Bisa diisi nama perusahaan / site atau dibiarkan kosong.' },
      { no: 5, column: 'Departemen / Jabatan', required: 'Opsional', description: 'Sesuai dengan nama unit kerja yang berlaku.' },
      { no: 6, column: 'Regu Kerja', required: 'Opsional', description: 'Pilihan: Regu 1, Regu 2, Regu 3, Non-Regu, Secwan.' },
      { no: 7, column: 'Tanggal Mulai Kerja', required: 'Wajib', description: 'Format: YYYY-MM-DD (Contoh: 2022-01-15). Digunakan untuk menghitung hak cuti.' },
      { no: 8, column: 'Rekening Bank', required: 'Opsional', description: 'Default: Mandiri. Masukkan nomor rekening dan nama pemilik.' },
      { no: 9, column: 'Alokasi Cuti Otomatis', required: 'Sistem', description: 'Pegawai yang diimpor otomatis berstatus Aktif dan mendapatkan 12 kuota cuti tahun berjalan.' },
    ]

    guides.forEach((g) => {
      const row = guideSheet.addRow(g)
      row.height = 22
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9.5 }
        cell.alignment = { vertical: 'middle' }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_import_karyawan_ekopi.xlsx"',
      },
    })
  } catch (error: unknown) {
    console.error('[AdminEmployeeTemplateAPI] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengunduh template.',
      },
      { status: 500 }
    )
  }
}
