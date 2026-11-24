import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatRupiah } from '@/lib/utils'
import type { LeaveRequest, LoanRequest, Employee } from '@/lib/types/database'

export interface ReportFilters {
  period?: 'bulanan' | 'tahunan' | 'rentang' | 'all'
  year?: number
  month?: number // 1-12
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  companyId?: string
  siteId?: string
  status?: string
}

export interface LeaveReportItem {
  id: string
  nik: string
  fullName: string
  companyName: string
  siteName: string
  departmentName: string
  positionName: string
  selectedDates: string[]
  totalDays: number
  reason: string
  emergencyContact: string
  status: string
  verificationCode: string
  createdAt: string
  processedAt: string | null
}

export interface LoanReportItem {
  id: string
  nik: string
  fullName: string
  companyName: string
  siteName: string
  departmentName: string
  positionName: string
  loanAmount: number
  tenor: number
  principalPerMonth: number
  interestPerMonth: number
  installmentPerMonth: number
  totalObligation: number
  netDisbursement: number
  isTakeover: boolean
  firstTimeBorrower: boolean
  status: string
  createdAt: string
  processedAt: string | null
}

export interface ReportSettings {
  companyName?: string
  companyAddress?: string
  logoUrl?: string
  generatedBy?: string
}

/**
 * 1. generateLeaveReport: queries leave_requests with employee data & filters
 */
export async function generateLeaveReport(filters: ReportFilters = {}): Promise<LeaveReportItem[]> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('leave_requests')
    .select(
      `
      *,
      employee:employees(
        id,
        nik,
        full_name,
        company_id,
        site_id,
        department_id,
        position_id,
        company:companies(name),
        site:sites(name),
        department:departments(name),
        position:positions(name)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as any)
  }

  // Date filtering
  if (filters.period === 'tahunan' && filters.year) {
    query = query.eq('year', filters.year)
  } else if (filters.period === 'bulanan' && filters.year && filters.month) {
    const startMonth = String(filters.month).padStart(2, '0')
    const start = `${filters.year}-${startMonth}-01T00:00:00.000Z`
    const nextMonthYear = filters.month === 12 ? filters.year + 1 : filters.year
    const nextMonth = filters.month === 12 ? 1 : filters.month + 1
    const endMonth = String(nextMonth).padStart(2, '0')
    const end = `${nextMonthYear}-${endMonth}-01T00:00:00.000Z`
    query = query.gte('created_at', start).lt('created_at', end)
  } else if (filters.period === 'rentang' && filters.startDate && filters.endDate) {
    query = query
      .gte('created_at', `${filters.startDate}T00:00:00.000Z`)
      .lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ReportService] Error fetching leave report data:', error)
    throw new Error(`Gagal mengambil data laporan cuti: ${error.message}`)
  }

  let rows = (data || []).map((row: any) => {
    const emp = row.employee || {}
    const dates = Array.isArray(row.selected_dates) ? row.selected_dates : []

    return {
      id: row.id,
      nik: emp.nik || '-',
      fullName: emp.full_name || '-',
      companyName: emp.company?.name || '-',
      siteName: emp.site?.name || '-',
      departmentName: emp.department?.name || '-',
      positionName: emp.position?.name || '-',
      selectedDates: dates,
      totalDays: row.total_days || 0,
      reason: row.reason || '-',
      emergencyContact: row.emergency_contact || '-',
      status: row.status || 'pending',
      verificationCode: row.verification_code || '-',
      createdAt: row.created_at,
      processedAt: row.processed_at,
      _companyId: emp.company_id,
      _siteId: emp.site_id,
    }
  })

  // Post-filter by company or site if needed
  if (filters.companyId && filters.companyId !== 'all') {
    rows = rows.filter((r: any) => r._companyId === filters.companyId)
  }
  if (filters.siteId && filters.siteId !== 'all') {
    rows = rows.filter((r: any) => r._siteId === filters.siteId)
  }

  return rows
}

/**
 * 2. generateLoanReport: queries loan_requests with employee data & filters
 */
export async function generateLoanReport(filters: ReportFilters = {}): Promise<LoanReportItem[]> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('loan_requests')
    .select(
      `
      *,
      employee:employees(
        id,
        nik,
        full_name,
        company_id,
        site_id,
        department_id,
        position_id,
        company:companies(name),
        site:sites(name),
        department:departments(name),
        position:positions(name)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as any)
  }

  // Date filtering
  if (filters.period === 'tahunan' && filters.year) {
    const start = `${filters.year}-01-01T00:00:00.000Z`
    const end = `${filters.year + 1}-01-01T00:00:00.000Z`
    query = query.gte('created_at', start).lt('created_at', end)
  } else if (filters.period === 'bulanan' && filters.year && filters.month) {
    const startMonth = String(filters.month).padStart(2, '0')
    const start = `${filters.year}-${startMonth}-01T00:00:00.000Z`
    const nextMonthYear = filters.month === 12 ? filters.year + 1 : filters.year
    const nextMonth = filters.month === 12 ? 1 : filters.month + 1
    const endMonth = String(nextMonth).padStart(2, '0')
    const end = `${nextMonthYear}-${endMonth}-01T00:00:00.000Z`
    query = query.gte('created_at', start).lt('created_at', end)
  } else if (filters.period === 'rentang' && filters.startDate && filters.endDate) {
    query = query
      .gte('created_at', `${filters.startDate}T00:00:00.000Z`)
      .lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ReportService] Error fetching loan report data:', error)
    throw new Error(`Gagal mengambil data laporan pinjaman: ${error.message}`)
  }

  let rows = (data || []).map((row: any) => {
    const emp = row.employee || {}

    return {
      id: row.id,
      nik: emp.nik || '-',
      fullName: emp.full_name || '-',
      companyName: emp.company?.name || '-',
      siteName: emp.site?.name || '-',
      departmentName: emp.department?.name || '-',
      positionName: emp.position?.name || '-',
      loanAmount: row.loan_amount || 0,
      tenor: row.tenor || 0,
      principalPerMonth: row.principal_per_month || 0,
      interestPerMonth: row.interest_per_month || 0,
      installmentPerMonth: row.installment_per_month || 0,
      totalObligation: row.total_obligation || 0,
      netDisbursement: row.net_disbursement ?? row.loan_amount ?? 0,
      isTakeover: Boolean(row.is_takeover),
      firstTimeBorrower: Boolean(row.first_time_borrower),
      status: row.status || 'pending',
      createdAt: row.created_at,
      processedAt: row.processed_at,
      _companyId: emp.company_id,
      _siteId: emp.site_id,
    }
  })

  // Post-filter by company or site
  if (filters.companyId && filters.companyId !== 'all') {
    rows = rows.filter((r: any) => r._companyId === filters.companyId)
  }
  if (filters.siteId && filters.siteId !== 'all') {
    rows = rows.filter((r: any) => r._siteId === filters.siteId)
  }

  return rows
}

/**
 * 3. generateCombinedReport
 */
export async function generateCombinedReport(filters: ReportFilters = {}) {
  const [leaveData, loanData] = await Promise.all([
    generateLeaveReport(filters),
    generateLoanReport(filters),
  ])
  return { leaveData, loanData }
}

/**
 * Helper to build period label string
 */
function getPeriodLabel(filters: ReportFilters = {}): string {
  if (filters.period === 'tahunan' && filters.year) {
    return `Tahun ${filters.year}`
  }
  if (filters.period === 'bulanan' && filters.year && filters.month) {
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]
    return `Bulan ${monthNames[filters.month - 1]} ${filters.year}`
  }
  if (filters.period === 'rentang' && filters.startDate && filters.endDate) {
    return `${formatDate(filters.startDate, 'dd/MM/yyyy')} s.d ${formatDate(
      filters.endDate,
      'dd/MM/yyyy'
    )}`
  }
  return 'Semua Periode'
}

/**
 * 4. generateLeaveExcel using ExcelJS
 */
export async function generateLeaveExcel(
  data: LeaveReportItem[],
  settings: ReportSettings = {},
  filters: ReportFilters = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-KOPI Platform'
  workbook.lastModifiedBy = 'E-KOPI By Regina - App'
  workbook.created = new Date()

  const adminClient = createAdminClient()
  const currentYear = filters.year || new Date().getFullYear()
  const companyName = settings.companyName || 'E-KOPI BY REGINA - APP'
  const periodStr = getPeriodLabel(filters)

  // 1. Fetch employees & leave balances for Sheet 1
  let empQuery = adminClient
    .from('employees')
    .select(`
      id, nik, full_name, start_date, is_crew_member, is_active, status,
      company:companies(name),
      site:sites(name),
      department:departments(name),
      position:positions(name)
    `)
    .eq('is_deleted', false)
    .order('nik', { ascending: true })

  if (filters.companyId && filters.companyId !== 'all') {
    empQuery = empQuery.eq('company_id', filters.companyId)
  }
  if (filters.siteId && filters.siteId !== 'all') {
    empQuery = empQuery.eq('site_id', filters.siteId)
  }

  const { data: employees } = await empQuery

  const { data: ledgers } = await adminClient
    .from('leave_balance_ledger')
    .select('employee_id, type, amount')
    .eq('year', currentYear)

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

  // ==========================================
  // SHEET 1: REKAPITULASI KUOTA & SALDO CUTI
  // ==========================================
  const sheet1 = workbook.addWorksheet('Rekap Kuota & Saldo Cuti', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  })

  // Sheet 1 Titles
  sheet1.mergeCells('A1:L1')
  const title1A = sheet1.getCell('A1')
  title1A.value = companyName.toUpperCase()
  title1A.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  title1A.alignment = { vertical: 'middle', horizontal: 'center' }
  title1A.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
  sheet1.getRow(1).height = 30

  sheet1.mergeCells('A2:L2')
  const title1B = sheet1.getCell('A2')
  title1B.value = `REKAPITULASI KUOTA & SALDO CUTI KARYAWAN TAHUN ${currentYear}`
  title1B.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } }
  title1B.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet1.mergeCells('A3:L3')
  const title1C = sheet1.getCell('A3')
  title1C.value = `Periode: ${periodStr} | Total Pegawai Terdata: ${employees?.length || 0} | Dicetak: ${formatDate(new Date(), 'dd MMMM yyyy HH:mm')} WIB`
  title1C.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  title1C.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet1.getRow(4).height = 10

  // Sheet 1 Headers
  const headers1 = [
    'NO',
    'NIK',
    'NAMA KARYAWAN',
    'PERUSAHAAN',
    'SITE / LOKASI',
    'DEPARTEMEN',
    'JABATAN',
    'HAK KUOTA CUTI',
    'CUTI TERPAKAI',
    'SISA SALDO CUTI',
    'PERSENTASE PEMAKAIAN',
    'STATUS KARYAWAN',
  ]
  const headerRow1 = sheet1.getRow(5)
  headerRow1.values = headers1
  headerRow1.height = 26
  headerRow1.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  // Sheet 1 Data Rows
  const empList = employees || []
  empList.forEach((emp: any, idx: number) => {
    const rowNum = idx + 6
    const row = sheet1.getRow(rowNum)
    const empBalance = balanceMap[emp.id] || { total: 0, used: 0, available: 0 }
    const statusLabel = emp.status === 'approved' ? 'Aktif' : emp.status === 'pending' ? 'Pending' : 'Non-Aktif'

    row.values = [
      idx + 1,
      emp.nik || '-',
      emp.full_name || '-',
      emp.company?.name || '-',
      emp.site?.name || '-',
      emp.department?.name || '-',
      emp.position?.name || '-',
      empBalance.total,
      empBalance.used,
      { formula: `H${rowNum}-I${rowNum}`, result: empBalance.available },
      { formula: `IF(H${rowNum}>0, I${rowNum}/H${rowNum}, 0)`, result: empBalance.total > 0 ? empBalance.used / empBalance.total : 0 },
      statusLabel,
    ]

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle' }

      if (colNumber === 1 || colNumber === 2 || colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      }
      if (colNumber === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '0.0%'
      }
    })

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type !== 'pattern') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }
      })
    }
  })

  // Sheet 1 Summary Row with Formulas
  const summaryRow1Num = empList.length + 6
  const summaryRow1 = sheet1.getRow(summaryRow1Num)
  sheet1.mergeCells(`A${summaryRow1Num}:G${summaryRow1Num}`)
  const summaryLabel1 = sheet1.getCell(`A${summaryRow1Num}`)
  summaryLabel1.value = `TOTAL REKAPITULASI (${empList.length} PEGAWAI)`
  summaryLabel1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }
  summaryLabel1.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalQuotaCell = sheet1.getCell(`H${summaryRow1Num}`)
  totalQuotaCell.value = empList.length > 0 ? { formula: `SUM(H6:H${empList.length + 5})` } : 0
  totalQuotaCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  totalQuotaCell.numFmt = '#,##0'
  totalQuotaCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalUsedCell = sheet1.getCell(`I${summaryRow1Num}`)
  totalUsedCell.value = empList.length > 0 ? { formula: `SUM(I6:I${empList.length + 5})` } : 0
  totalUsedCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' } }
  totalUsedCell.numFmt = '#,##0'
  totalUsedCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalRemCell = sheet1.getCell(`J${summaryRow1Num}`)
  totalRemCell.value = empList.length > 0 ? { formula: `SUM(J6:J${empList.length + 5})` } : 0
  totalRemCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }
  totalRemCell.numFmt = '#,##0'
  totalRemCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const avgUsageCell = sheet1.getCell(`K${summaryRow1Num}`)
  avgUsageCell.value = empList.length > 0 ? { formula: `AVERAGE(K6:K${empList.length + 5})` } : 0
  avgUsageCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }
  avgUsageCell.numFmt = '0.0%'
  avgUsageCell.alignment = { vertical: 'middle', horizontal: 'right' }

  summaryRow1.height = 24
  summaryRow1.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  sheet1.columns = [
    { key: 'no', width: 6 },
    { key: 'nik', width: 14 },
    { key: 'name', width: 26 },
    { key: 'company', width: 22 },
    { key: 'site', width: 18 },
    { key: 'department', width: 20 },
    { key: 'position', width: 20 },
    { key: 'quota', width: 16 },
    { key: 'used', width: 15 },
    { key: 'available', width: 16 },
    { key: 'pct', width: 18 },
    { key: 'status', width: 16 },
  ]
  sheet1.autoFilter = `A5:L${empList.length + 5}`

  // ==========================================
  // SHEET 2: DETAIL PENGAJUAN CUTI KARYAWAN
  // ==========================================
  const sheet2 = workbook.addWorksheet('Detail Pengajuan Cuti', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  })

  // Sheet 2 Titles
  sheet2.mergeCells('A1:L1')
  const title2A = sheet2.getCell('A1')
  title2A.value = companyName.toUpperCase()
  title2A.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  title2A.alignment = { vertical: 'middle', horizontal: 'center' }
  title2A.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  sheet2.getRow(1).height = 30

  sheet2.mergeCells('A2:L2')
  const title2B = sheet2.getCell('A2')
  title2B.value = 'RINCIAN RIWAYAT PENGAJUAN CUTI KARYAWAN'
  title2B.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } }
  title2B.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet2.mergeCells('A3:L3')
  const title2C = sheet2.getCell('A3')
  title2C.value = `Periode: ${periodStr} | Total Pengajuan: ${data.length} | Dicetak: ${formatDate(new Date(), 'dd MMMM yyyy HH:mm')} WIB`
  title2C.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  title2C.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet2.getRow(4).height = 10

  const headers2 = [
    'NO',
    'ID PENGAJUAN',
    'NIK',
    'NAMA KARYAWAN',
    'PERUSAHAAN',
    'SITE',
    'DEPARTEMEN',
    'JABATAN',
    'TOTAL HARI',
    'TANGGAL CUTI',
    'ALASAN',
    'STATUS',
  ]

  const headerRow2 = sheet2.getRow(5)
  headerRow2.values = headers2
  headerRow2.height = 26
  headerRow2.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  let totalDaysSum = 0
  data.forEach((item, index) => {
    const rowNum = index + 6
    const row = sheet2.getRow(rowNum)
    totalDaysSum += item.totalDays

    const datesFormatted = item.selectedDates.map((d) => formatDate(d, 'dd/MM')).join(', ')

    row.values = [
      index + 1,
      item.id,
      item.nik,
      item.fullName,
      item.companyName,
      item.siteName,
      item.departmentName,
      item.positionName,
      item.totalDays,
      datesFormatted,
      item.reason,
      item.status.toUpperCase(),
    ]

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle' }

      if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      }
      if (colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (item.status === 'approved') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF15803D' } }
        } else if (item.status === 'rejected') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } }
        } else {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB45309' } }
        }
      }
    })

    if (index % 2 === 1) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type !== 'pattern') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }
      })
    }
  })

  // Sheet 2 Summary Row
  const summaryRow2Num = data.length + 6
  const summaryRow2 = sheet2.getRow(summaryRow2Num)
  sheet2.mergeCells(`A${summaryRow2Num}:H${summaryRow2Num}`)
  const summaryLabel2 = sheet2.getCell(`A${summaryRow2Num}`)
  summaryLabel2.value = `TOTAL KESELURUHAN (${data.length} PENGAJUAN)`
  summaryLabel2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }
  summaryLabel2.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalDaysCell = sheet2.getCell(`I${summaryRow2Num}`)
  totalDaysCell.value = data.length > 0 ? { formula: `SUM(I6:I${data.length + 5})`, result: totalDaysSum } : totalDaysSum
  totalDaysCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  totalDaysCell.alignment = { vertical: 'middle', horizontal: 'right' }
  totalDaysCell.numFmt = '#,##0'

  summaryRow2.height = 24
  summaryRow2.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  sheet2.columns = [
    { key: 'no', width: 6 },
    { key: 'id', width: 22 },
    { key: 'nik', width: 14 },
    { key: 'name', width: 26 },
    { key: 'company', width: 22 },
    { key: 'site', width: 18 },
    { key: 'department', width: 20 },
    { key: 'position', width: 20 },
    { key: 'totalDays', width: 14 },
    { key: 'dates', width: 26 },
    { key: 'reason', width: 30 },
    { key: 'status', width: 14 },
  ]
  sheet2.autoFilter = `A5:L${data.length + 5}`

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * 5. generateLoanExcel using ExcelJS
 */
export async function generateLoanExcel(
  data: LoanReportItem[],
  settings: ReportSettings = {},
  filters: ReportFilters = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-KOPI Platform'
  workbook.lastModifiedBy = 'E-KOPI By Regina - App'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Laporan Pinjaman', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  })

  const companyName = settings.companyName || 'E-KOPI BY REGINA - APP'
  const periodStr = getPeriodLabel(filters)

  // Header Titles
  sheet.mergeCells('A1:N1')
  const title1 = sheet.getCell('A1')
  title1.value = companyName.toUpperCase()
  title1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  title1.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet.mergeCells('A2:N2')
  const title2 = sheet.getCell('A2')
  title2.value = 'LAPORAN REKAPITULASI PINJAMAN KOPERASI KARYAWAN'
  title2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } }
  title2.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet.mergeCells('A3:N3')
  const title3 = sheet.getCell('A3')
  title3.value = `Periode: ${periodStr} | Dicetak: ${formatDate(
    new Date(),
    'dd MMMM yyyy HH:mm'
  )} WIB`
  title3.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  title3.alignment = { vertical: 'middle', horizontal: 'center' }

  sheet.getRow(4).height = 10

  const headers = [
    'NO',
    'ID PINJAMAN',
    'NIK',
    'NAMA KARYAWAN',
    'PERUSAHAAN',
    'SITE',
    'DEPARTEMEN',
    'JUMLAH PINJAMAN',
    'TENOR (BLN)',
    'ANGSURAN / BLN',
    'TOTAL KEWAJIBAN',
    'NET PENCAIRAN',
    'JENIS',
    'STATUS',
  ]

  const headerRow = sheet.getRow(5)
  headerRow.values = headers
  headerRow.height = 26

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  let totalLoanSum = 0
  let totalInstallmentSum = 0
  let totalObligationSum = 0
  let totalNetSum = 0

  data.forEach((item, index) => {
    const rowNum = index + 6
    const row = sheet.getRow(rowNum)

    totalLoanSum += item.loanAmount
    totalInstallmentSum += item.installmentPerMonth
    totalObligationSum += item.totalObligation
    totalNetSum += item.netDisbursement

    row.values = [
      index + 1,
      item.id,
      item.nik,
      item.fullName,
      item.companyName,
      item.siteName,
      item.departmentName,
      item.loanAmount,
      item.tenor,
      item.installmentPerMonth,
      item.totalObligation,
      item.netDisbursement,
      item.isTakeover ? 'Takeover' : 'Baru',
      item.status.toUpperCase(),
    ]

    row.height = 20

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle' }

      if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 9 || colNumber === 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      if (colNumber === 8 || colNumber === 10 || colNumber === 11 || colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '"Rp "#,##0'
      }
      if (colNumber === 14) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        if (item.status === 'approved' || item.status === 'completed') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF15803D' } }
        } else if (item.status === 'rejected') {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } }
        } else {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB45309' } }
        }
      }
    })

    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      })
    }
  })

  // Summary Row
  const summaryRowNum = data.length + 6
  const summaryRow = sheet.getRow(summaryRowNum)
  sheet.mergeCells(`A${summaryRowNum}:G${summaryRowNum}`)
  const summaryLabel = sheet.getCell(`A${summaryRowNum}`)
  summaryLabel.value = `TOTAL KESELURUHAN (${data.length} PINJAMAN)`
  summaryLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }
  summaryLabel.alignment = { vertical: 'middle', horizontal: 'right' }

  const loanSumCell = sheet.getCell(`H${summaryRowNum}`)
  loanSumCell.value = data.length > 0 ? { formula: `SUM(H6:H${data.length + 5})`, result: totalLoanSum } : totalLoanSum
  loanSumCell.numFmt = '"Rp "#,##0'
  loanSumCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  loanSumCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const instSumCell = sheet.getCell(`J${summaryRowNum}`)
  instSumCell.value = data.length > 0 ? { formula: `SUM(J6:J${data.length + 5})`, result: totalInstallmentSum } : totalInstallmentSum
  instSumCell.numFmt = '"Rp "#,##0'
  instSumCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  instSumCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const obligSumCell = sheet.getCell(`K${summaryRowNum}`)
  obligSumCell.value = data.length > 0 ? { formula: `SUM(K6:K${data.length + 5})`, result: totalObligationSum } : totalObligationSum
  obligSumCell.numFmt = '"Rp "#,##0'
  obligSumCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } }
  obligSumCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const netSumCell = sheet.getCell(`L${summaryRowNum}`)
  netSumCell.value = data.length > 0 ? { formula: `SUM(L6:L${data.length + 5})`, result: totalNetSum } : totalNetSum
  netSumCell.numFmt = '"Rp "#,##0'
  netSumCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }
  netSumCell.alignment = { vertical: 'middle', horizontal: 'right' }

  summaryRow.height = 24
  summaryRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'id', width: 22 },
    { key: 'nik', width: 14 },
    { key: 'name', width: 26 },
    { key: 'company', width: 22 },
    { key: 'site', width: 18 },
    { key: 'department', width: 20 },
    { key: 'loanAmount', width: 20 },
    { key: 'tenor', width: 13 },
    { key: 'installment', width: 18 },
    { key: 'totalObligation', width: 20 },
    { key: 'netDisbursement', width: 20 },
    { key: 'type', width: 12 },
    { key: 'status', width: 14 },
  ]

  sheet.autoFilter = `A5:N${data.length + 5}`

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * 6. generateCombinedExcel: Both in separate sheets
 */
export async function generateCombinedExcel(
  leaveData: LeaveReportItem[],
  loanData: LoanReportItem[],
  settings: ReportSettings = {},
  filters: ReportFilters = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'E-KOPI Platform'
  workbook.lastModifiedBy = 'E-KOPI By Regina - App'
  workbook.created = new Date()

  const companyName = settings.companyName || 'E-KOPI BY REGINA - APP'
  const periodStr = getPeriodLabel(filters)

  // SHEET 1: CUTI
  const sheetLeave = workbook.addWorksheet('Laporan Cuti', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  })

  sheetLeave.mergeCells('A1:L1')
  sheetLeave.getCell('A1').value = companyName.toUpperCase()
  sheetLeave.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  sheetLeave.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLeave.mergeCells('A2:L2')
  sheetLeave.getCell('A2').value = 'LAPORAN REKAPITULASI PENGAJUAN CUTI KARYAWAN'
  sheetLeave.getCell('A2').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } }
  sheetLeave.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLeave.mergeCells('A3:L3')
  sheetLeave.getCell('A3').value = `Periode: ${periodStr} | Dicetak: ${formatDate(new Date(), 'dd MMMM yyyy HH:mm')} WIB`
  sheetLeave.getCell('A3').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  sheetLeave.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLeave.getRow(4).height = 10

  const leaveHeaders = [
    'NO',
    'ID PENGAJUAN',
    'NIK',
    'NAMA KARYAWAN',
    'PERUSAHAAN',
    'SITE',
    'DEPARTEMEN',
    'JABATAN',
    'TOTAL HARI',
    'TANGGAL CUTI',
    'ALASAN',
    'STATUS',
  ]
  const lHeaderRow = sheetLeave.getRow(5)
  lHeaderRow.values = leaveHeaders
  lHeaderRow.height = 26
  lHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  let totalLeaveDays = 0
  leaveData.forEach((item, index) => {
    const row = sheetLeave.getRow(index + 6)
    totalLeaveDays += item.totalDays
    row.values = [
      index + 1,
      item.id,
      item.nik,
      item.fullName,
      item.companyName,
      item.siteName,
      item.departmentName,
      item.positionName,
      item.totalDays,
      item.selectedDates.map((d) => formatDate(d, 'dd/MM')).join(', '),
      item.reason,
      item.status.toUpperCase(),
    ]
    row.height = 20
    row.eachCell((cell, col) => {
      cell.font = { name: 'Arial', size: 9.5 }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      if (col === 9) {
        cell.alignment = { horizontal: 'right' }
        cell.numFmt = '#,##0'
      }
    })
  })

  sheetLeave.columns = [
    { key: 'no', width: 6 },
    { key: 'id', width: 22 },
    { key: 'nik', width: 14 },
    { key: 'name', width: 26 },
    { key: 'company', width: 22 },
    { key: 'site', width: 18 },
    { key: 'department', width: 20 },
    { key: 'position', width: 20 },
    { key: 'totalDays', width: 14 },
    { key: 'dates', width: 26 },
    { key: 'reason', width: 30 },
    { key: 'status', width: 14 },
  ]

  // SHEET 2: PINJAMAN
  const sheetLoan = workbook.addWorksheet('Laporan Pinjaman', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  })

  sheetLoan.mergeCells('A1:N1')
  sheetLoan.getCell('A1').value = companyName.toUpperCase()
  sheetLoan.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  sheetLoan.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLoan.mergeCells('A2:N2')
  sheetLoan.getCell('A2').value = 'LAPORAN REKAPITULASI PINJAMAN KOPERASI KARYAWAN'
  sheetLoan.getCell('A2').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } }
  sheetLoan.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLoan.mergeCells('A3:N3')
  sheetLoan.getCell('A3').value = `Periode: ${periodStr} | Dicetak: ${formatDate(new Date(), 'dd MMMM yyyy HH:mm')} WIB`
  sheetLoan.getCell('A3').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }
  sheetLoan.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' }

  sheetLoan.getRow(4).height = 10

  const loanHeaders = [
    'NO',
    'ID PINJAMAN',
    'NIK',
    'NAMA KARYAWAN',
    'PERUSAHAAN',
    'SITE',
    'DEPARTEMEN',
    'JUMLAH PINJAMAN',
    'TENOR (BLN)',
    'ANGSURAN / BLN',
    'TOTAL KEWAJIBAN',
    'NET PENCAIRAN',
    'JENIS',
    'STATUS',
  ]
  const loanHeaderRow = sheetLoan.getRow(5)
  loanHeaderRow.values = loanHeaders
  loanHeaderRow.height = 26
  loanHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  loanData.forEach((item, index) => {
    const row = sheetLoan.getRow(index + 6)
    row.values = [
      index + 1,
      item.id,
      item.nik,
      item.fullName,
      item.companyName,
      item.siteName,
      item.departmentName,
      item.loanAmount,
      item.tenor,
      item.installmentPerMonth,
      item.totalObligation,
      item.netDisbursement,
      item.isTakeover ? 'Takeover' : 'Baru',
      item.status.toUpperCase(),
    ]
    row.height = 20
    row.eachCell((cell, col) => {
      cell.font = { name: 'Arial', size: 9.5 }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      if (col === 8 || col === 10 || col === 11 || col === 12) {
        cell.alignment = { horizontal: 'right' }
        cell.numFmt = '"Rp "#,##0'
      }
    })
  })

  sheetLoan.columns = [
    { key: 'no', width: 6 },
    { key: 'id', width: 22 },
    { key: 'nik', width: 14 },
    { key: 'name', width: 26 },
    { key: 'company', width: 22 },
    { key: 'site', width: 18 },
    { key: 'department', width: 20 },
    { key: 'loanAmount', width: 20 },
    { key: 'tenor', width: 13 },
    { key: 'installment', width: 18 },
    { key: 'totalObligation', width: 20 },
    { key: 'netDisbursement', width: 20 },
    { key: 'type', width: 12 },
    { key: 'status', width: 14 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * 7. generateReportPDF: HTML-based printable PDF report
 */
export function generateReportPDF(
  data: any[],
  type: 'leave' | 'loan' | 'combined',
  settings: ReportSettings = {},
  filters: ReportFilters = {}
): string {
  const companyName = settings.companyName || 'PT REGINA PRIMA NUSANTARA'
  const companyAddress = settings.companyAddress || 'Kawasan Operasional E-KOPI, Jl. Industri Makmur No. 88, Indonesia'
  const generatedBy = settings.generatedBy || 'Administrator Sistem'
  const periodStr = getPeriodLabel(filters)
  const printDate = formatDate(new Date(), 'dd MMMM yyyy, HH:mm')

  let title = 'LAPORAN REKAPITULASI CUTI KARYAWAN'
  let summaryHtml = ''
  let tableHeaderHtml = ''
  let tableRowsHtml = ''

  if (type === 'leave') {
    title = 'LAPORAN REKAPITULASI CUTI KARYAWAN'
    const totalRequests = data.length
    const totalDays = data.reduce((acc, curr) => acc + (curr.totalDays || 0), 0)
    const approvedCount = data.filter((d) => d.status === 'approved').length
    const pendingCount = data.filter((d) => d.status === 'pending').length

    summaryHtml = `
      <div class="summary-cards">
        <div class="card"><div class="val">${totalRequests}</div><div class="lbl">Total Pengajuan</div></div>
        <div class="card"><div class="val">${totalDays}</div><div class="lbl">Total Hari Cuti</div></div>
        <div class="card"><div class="val" style="color:#16a34a;">${approvedCount}</div><div class="lbl">Disetujui</div></div>
        <div class="card"><div class="val" style="color:#d97706;">${pendingCount}</div><div class="lbl">Menunggu</div></div>
      </div>
    `

    tableHeaderHtml = `
      <tr>
        <th style="width:4%;">NO</th>
        <th style="width:14%;">ID PENGAJUAN</th>
        <th style="width:10%;">NIK</th>
        <th style="width:18%;">NAMA KARYAWAN</th>
        <th style="width:14%;">PERUSAHAAN</th>
        <th style="width:10%;">TOTAL HARI</th>
        <th style="width:18%;">ALASAN</th>
        <th style="width:12%;">STATUS</th>
      </tr>
    `

    tableRowsHtml = data
      .map(
        (row, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-family:monospace;font-size:11px;">${row.id}</td>
        <td>${row.nik}</td>
        <td><strong>${row.fullName}</strong></td>
        <td>${row.companyName}</td>
        <td style="text-align:center;"><strong>${row.totalDays} Hari</strong></td>
        <td>${row.reason}</td>
        <td style="text-align:center;"><span class="badge badge-${row.status}">${row.status.toUpperCase()}</span></td>
      </tr>
    `
      )
      .join('')
  } else if (type === 'loan') {
    title = 'LAPORAN REKAPITULASI PINJAMAN KOPERASI'
    const totalLoans = data.length
    const totalDisbursed = data.reduce((acc, curr) => acc + (curr.loanAmount || 0), 0)
    const totalInstallments = data.reduce((acc, curr) => acc + (curr.installmentPerMonth || 0), 0)
    const approvedCount = data.filter((d) => d.status === 'approved' || d.status === 'completed').length

    summaryHtml = `
      <div class="summary-cards">
        <div class="card"><div class="val">${totalLoans}</div><div class="lbl">Total Pengajuan</div></div>
        <div class="card"><div class="val">${formatRupiah(totalDisbursed)}</div><div class="lbl">Total Nominal Pinjaman</div></div>
        <div class="card"><div class="val">${formatRupiah(totalInstallments)}</div><div class="lbl">Total Angsuran / Bln</div></div>
        <div class="card"><div class="val" style="color:#16a34a;">${approvedCount}</div><div class="lbl">Disetujui / Selesai</div></div>
      </div>
    `

    tableHeaderHtml = `
      <tr>
        <th style="width:4%;">NO</th>
        <th style="width:13%;">ID PINJAMAN</th>
        <th style="width:10%;">NIK</th>
        <th style="width:17%;">NAMA KARYAWAN</th>
        <th style="width:14%;">JUMLAH PINJAMAN</th>
        <th style="width:8%;">TENOR</th>
        <th style="width:12%;">ANGSURAN/BLN</th>
        <th style="width:12%;">NET CAIR</th>
        <th style="width:10%;">STATUS</th>
      </tr>
    `

    tableRowsHtml = data
      .map(
        (row, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-family:monospace;font-size:11px;">${row.id}</td>
        <td>${row.nik}</td>
        <td><strong>${row.fullName}</strong></td>
        <td style="text-align:right;"><strong>${formatRupiah(row.loanAmount)}</strong></td>
        <td style="text-align:center;">${row.tenor} Bln</td>
        <td style="text-align:right;">${formatRupiah(row.installmentPerMonth)}</td>
        <td style="text-align:right;color:#15803d;"><strong>${formatRupiah(row.netDisbursement)}</strong></td>
        <td style="text-align:center;"><span class="badge badge-${row.status}">${row.status.toUpperCase()}</span></td>
      </tr>
    `
      )
      .join('')
  } else if (type === 'combined') {
    title = 'LAPORAN GABUNGAN PENGAJUAN CUTI & PINJAMAN KOPERASI'
    const leaveData: LeaveReportItem[] = Array.isArray(data) ? data : ((data as any).leaveData || [])
    const loanData: LoanReportItem[] = Array.isArray(data) ? [] : ((data as any).loanData || [])

    const totalLeaveRequests = leaveData.length
    const totalLeaveDays = leaveData.reduce((acc, curr) => acc + (curr.totalDays || 0), 0)
    const totalLoans = loanData.length
    const totalDisbursed = loanData.reduce((acc, curr) => acc + (curr.loanAmount || 0), 0)

    summaryHtml = `
      <div class="summary-cards">
        <div class="card"><div class="val">${totalLeaveRequests}</div><div class="lbl">Pengajuan Cuti</div></div>
        <div class="card"><div class="val">${totalLeaveDays}</div><div class="lbl">Total Hari Cuti</div></div>
        <div class="card"><div class="val">${totalLoans}</div><div class="lbl">Pinjaman Koperasi</div></div>
        <div class="card"><div class="val" style="color:#15803d;">${formatRupiah(totalDisbursed)}</div><div class="lbl">Total Pinjaman Dicairkan</div></div>
      </div>
    `

    const leaveRows =
      leaveData.length > 0
        ? leaveData
            .map(
              (row, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-family:monospace;font-size:11px;">${row.id}</td>
        <td>${row.nik}</td>
        <td><strong>${row.fullName}</strong></td>
        <td>${row.companyName || '-'}</td>
        <td style="text-align:center;"><strong>${row.totalDays} Hari</strong></td>
        <td>${row.reason || '-'}</td>
        <td style="text-align:center;"><span class="badge badge-${row.status}">${row.status.toUpperCase()}</span></td>
      </tr>
    `
            )
            .join('')
        : '<tr><td colspan="8" style="text-align:center;padding:12px;color:#94a3b8;">Tidak ada data cuti untuk periode ini</td></tr>'

    const loanRows =
      loanData.length > 0
        ? loanData
            .map(
              (row, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-family:monospace;font-size:11px;">${row.id}</td>
        <td>${row.nik}</td>
        <td><strong>${row.fullName}</strong></td>
        <td style="text-align:right;"><strong>${formatRupiah(row.loanAmount)}</strong></td>
        <td style="text-align:center;">${row.tenor} Bln</td>
        <td style="text-align:right;">${formatRupiah(row.installmentPerMonth)}</td>
        <td style="text-align:right;color:#15803d;"><strong>${formatRupiah(row.netDisbursement)}</strong></td>
        <td style="text-align:center;"><span class="badge badge-${row.status}">${row.status.toUpperCase()}</span></td>
      </tr>
    `
            )
            .join('')
        : '<tr><td colspan="9" style="text-align:center;padding:12px;color:#94a3b8;">Tidak ada data pinjaman untuk periode ini</td></tr>'

    tableRowsHtml = `
      <div style="margin-top:16px;">
        <h3 style="margin:12px 0 6px;color:#1e3a8a;font-size:13px;text-transform:uppercase;border-bottom:2px solid #93c5fd;padding-bottom:4px;">A. Rekapitulasi Pengajuan Cuti</h3>
        <table>
          <thead>
            <tr>
              <th style="width:4%;">NO</th>
              <th style="width:14%;">ID PENGAJUAN</th>
              <th style="width:10%;">NIK</th>
              <th style="width:18%;">NAMA KARYAWAN</th>
              <th style="width:14%;">PERUSAHAAN</th>
              <th style="width:10%;">TOTAL HARI</th>
              <th style="width:18%;">ALASAN</th>
              <th style="width:12%;">STATUS</th>
            </tr>
          </thead>
          <tbody>${leaveRows}</tbody>
        </table>

        <h3 style="margin:20px 0 6px;color:#1e3a8a;font-size:13px;text-transform:uppercase;border-bottom:2px solid #93c5fd;padding-bottom:4px;">B. Rekapitulasi Pinjaman Koperasi</h3>
        <table>
          <thead>
            <tr>
              <th style="width:4%;">NO</th>
              <th style="width:13%;">ID PINJAMAN</th>
              <th style="width:10%;">NIK</th>
              <th style="width:17%;">NAMA KARYAWAN</th>
              <th style="width:14%;">JUMLAH PINJAMAN</th>
              <th style="width:8%;">TENOR</th>
              <th style="width:12%;">ANGSURAN/BLN</th>
              <th style="width:12%;">NET CAIR</th>
              <th style="width:10%;">STATUS</th>
            </tr>
          </thead>
          <tbody>${loanRows}</tbody>
        </table>
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 landscape;margin:10mm}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;padding:16px;}
  .header-kop{text-align:center;padding-bottom:8px;border-bottom:3px solid #1e3a8a;}
  .header-kop h1{font-size:18px;color:#0f172a;letter-spacing:1px;}
  .header-kop p{font-size:11px;color:#475569;margin-top:2px;}
  .report-title{text-align:center;margin:16px 0 12px;}
  .report-title h2{font-size:16px;color:#1e3a8a;letter-spacing:1.5px;}
  .report-title .period{font-size:11px;color:#475569;margin-top:4px;}
  .summary-cards{display:flex;gap:12px;margin-bottom:16px;}
  .summary-cards .card{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;text-align:center;}
  .summary-cards .card .val{font-size:16px;font-weight:bold;color:#0f172a;}
  .summary-cards .card .lbl{font-size:10px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;}
  table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;}
  th{background:#1e3a8a;color:#fff;padding:8px;text-align:left;font-size:10px;letter-spacing:0.6px;}
  td{border:1px solid #cbd5e1;padding:6px 8px;vertical-align:middle;}
  tr:nth-child(even) td{background:#f8fafc;}
  .badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9.5px;font-weight:bold;letter-spacing:0.5px;}
  .badge-approved,.badge-completed{background:#dcfce7;color:#15803d;}
  .badge-pending{background:#fef3c7;color:#b45309;}
  .badge-rejected{background:#fee2e2;color:#b91c1c;}
  .badge-cancelled{background:#f1f5f9;color:#64748b;}
  .meta-footer{margin-top:16px;display:flex;justify-content:space-between;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;}
  .btnbar{position:fixed;top:14px;right:14px;z-index:99;}
  .btnbar button{background:#1d4ed8;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(29,78,216,0.35);}
  @media print{.btnbar{display:none;}body{padding:0;}}
</style>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 400);
  };
</script>
</head>
<body>
  <div class="btnbar"><button onclick="window.print()">🖨️ Cetak / Simpan PDF (A4 Landscape)</button></div>
  <div class="header-kop">
    <h1>${companyName.toUpperCase()}</h1>
    <p>${companyAddress}</p>
  </div>
  <div class="report-title">
    <h2>${title}</h2>
    <div class="period">Periode: ${periodStr}</div>
  </div>
  ${summaryHtml}
  ${
    type === 'combined'
      ? tableRowsHtml
      : `
  <table>
    <thead>${tableHeaderHtml}</thead>
    <tbody>${tableRowsHtml}</tbody>
  </table>
  `
  }
  <div class="meta-footer">
    <div>Dicetak oleh: <strong>${generatedBy}</strong> pada ${printDate} WIB</div>
    <div>Sistem E-KOPI By Regina - App &copy; ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`
}
