import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import type { Employee, LeaveRequest, Json } from '@/lib/types/database'

export interface LeaveLetterEmployee extends Partial<Employee> {
  company_name?: string | null
  site_name?: string | null
  department_name?: string | null
  position_name?: string | null
}

export interface LeaveLetterSettings {
  company_name?: string
  company_address?: string
  company_phone?: string
  letterhead_url?: string | null
  logo_url?: string | null
  app_version?: string
}

export interface LeaveLetterQuotaSummary {
  year: number
  allocation: number
  usedThisRequest: number
  totalUsed: number
  remaining: number
}

export interface GenerateLeaveLetterParams {
  leaveRequest: LeaveRequest
  employee: LeaveLetterEmployee
  settings?: LeaveLetterSettings
  quota?: LeaveLetterQuotaSummary
  processedByName?: string
}

export interface GenerateLeaveLetterResult {
  html: string
  buffer: Buffer
  filePath: string
  snapshotData: Json
}

/**
 * Builds the HTML template matching templates/surat-cuti.html
 */
export function buildLeaveLetterHtml(params: GenerateLeaveLetterParams): string {
  const { leaveRequest, employee, settings = {}, quota, processedByName } = params

  const appVersion = settings.app_version || '1.0.0'
  const companyName = settings.company_name || 'PT REGINA PRIMA NUSANTARA'
  const companyAddress =
    settings.company_address || 'Kawasan Operasional E-KOPI, Jl. Industri Makmur No. 88, Indonesia'
  const letterheadUrl = settings.letterhead_url || settings.logo_url || null

  const year = leaveRequest.year || new Date().getFullYear()
  const verificationCode = leaveRequest.verification_code || 'VERIF-OK'
  const approvedAtFormatted = formatDate(
    leaveRequest.processed_at || leaveRequest.created_at,
    'dd MMMM yyyy'
  )

  const selectedDates: string[] = Array.isArray(leaveRequest.selected_dates)
    ? (leaveRequest.selected_dates as string[])
    : []

  const datePillsHtml = selectedDates
    .map((dateStr) => {
      const formatted = formatDate(dateStr, 'dd/MM/yyyy')
      return `<span class="pill">🗓️ ${formatted}</span>`
    })
    .join('\n      ')

  const quotaYear = quota?.year || year
  const quotaAllocation = quota?.allocation ?? 12
  const quotaUsedThis = quota?.usedThisRequest ?? leaveRequest.total_days ?? 0
  const quotaTotalUsed = quota?.totalUsed ?? quotaUsedThis
  const quotaRemaining = quota?.remaining ?? Math.max(0, quotaAllocation - quotaTotalUsed)

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Surat Cuti - ${leaveRequest.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:9mm 11mm}
  html,body{background:#fff}
  body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:740px;margin:0 auto;padding:10px 16px 6px;position:relative}
  .konten{position:relative;z-index:1}
  /* WATERMARK */
  .wm{position:fixed;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-24deg);z-index:0;
    font-weight:900;font-size:80px;letter-spacing:8px;color:#15803d;opacity:.07;white-space:nowrap;
    pointer-events:none;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wm .kcl{display:block;font-size:15px;letter-spacing:5px;margin-top:4px}
  /* KOP */
  .kop{padding-bottom:7px}
  .kop-full{display:block;width:100%;height:auto;max-height:112px;object-fit:contain;margin:0 auto}
  .kop .kt{text-align:center}
  .kop .kt .n{font-size:19px;font-weight:bold;letter-spacing:.4px;color:#0f172a}
  .kop .kt .a{font-size:11px;color:#334155;margin-top:3px}
  .garis{height:4px;background:linear-gradient(90deg,#b45309,#f59e0b,#b45309);border-radius:2px}
  .garis2{height:1.5px;background:#1e3a8a;margin-top:2.5px}
  /* JUDUL */
  .judul{text-align:center;margin:11px 0 1px}
  .judul h2{font-family:Georgia,'Times New Roman',serif;font-size:17px;letter-spacing:2.6px;font-weight:bold;color:#0f172a}
  .judul .rule{width:120px;height:2px;background:#b45309;margin:5px auto 0}
  .judul .no{font-size:11px;color:#475569;margin-top:5px;letter-spacing:.8px}
  /* META */
  .meta{display:flex;gap:7px;margin:9px 0 2px}
  .meta .m{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:4px 9px}
  .meta .l{font-size:8.5px;letter-spacing:1.2px;color:#64748b;font-weight:bold}
  .meta .v{font-size:11.5px;font-weight:bold;margin-top:1px;color:#0f172a}
  /* LABEL SEKSI */
  .seksi{display:flex;align-items:center;gap:8px;margin:11px 0 6px}
  .seksi .bar{width:4px;height:15px;background:linear-gradient(180deg,#f59e0b,#b45309);border-radius:2px}
  .seksi .tx{font-size:11px;font-weight:bold;letter-spacing:1.6px;color:#1e3a8a}
  .seksi .ln{flex:1;height:1px;background:#e2e8f0}
  /* KARTU DATA PEMOHON */
  .kartu{border:1px solid #cbd5e1;border-radius:9px;overflow:hidden}
  .kartu table{width:100%;border-collapse:collapse}
  .kartu td{padding:5px 10px;font-size:12.3px;vertical-align:top;border-bottom:1px solid #eef2f7}
  .kartu tr:last-child td{border-bottom:none}
  .kartu td.lb{width:14%;background:#f1f5f9;color:#334155;font-size:10.3px;font-weight:bold;letter-spacing:.6px;padding-top:6.5px;white-space:nowrap}
  .kartu td.vl{width:36%}
  /* ISI & TANGGAL */
  .isi{font-size:12.4px;line-height:1.55;text-align:justify}
  .tgl-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:8px 10px;margin:6px 0}
  .tgl-box .pill{display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:14px;padding:3px 11px;font-size:11.6px;font-weight:600;color:#1e3a8a;margin:2.5px 3px}
  .mini{border-collapse:collapse;margin-top:4px}
  .mini td{padding:2px 8px 2px 0;font-size:12.4px;vertical-align:top}
  .mini td.lb{color:#334155;width:150px}
  /* KUOTA */
  .kuota{width:100%;border-collapse:collapse;margin:4px 0 6px;font-size:11.8px}
  .kuota th{background:#1e3a8a;color:#fff;text-align:left;padding:5px 9px;font-size:11px;letter-spacing:.6px}
  .kuota td{border:1px solid #cbd5e1;padding:4.5px 9px}
  .kuota tr:nth-child(even) td{background:#f8fafc}
  .kuota tr.sisa td{background:#dcfce7;font-weight:bold;border-color:#86efac;color:#14532d}
  /* TTD */
  .ttd-head{font-size:12.2px;margin-top:10px;color:#334155}
  .ttd{display:flex;justify-content:space-between;margin-top:6px;text-align:center;font-size:12.2px}
  .ttd .kol{width:31%}
  .ttd .jb{color:#334155}
  .ttd .sp{height:40px}
  .ttd .nm{font-weight:bold;text-decoration:underline}
  /* STRIP VERIFIKASI */
  .verif{display:flex;align-items:center;gap:10px;margin-top:11px;background:#f0fdf4;border:1.5px solid #86efac;border-left:6px solid #16a34a;border-radius:8px;padding:7px 11px}
  .verif .vi{flex:none;width:30px;height:30px;border-radius:50%;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold}
  .verif .vt{flex:1}
  .verif .vt1{font-size:11.5px;font-weight:bold;letter-spacing:1px;color:#14532d}
  .verif .vt2{font-size:10.3px;color:#334155;margin-top:1px;line-height:1.45}
  .verif .vk{flex:none;text-align:center;border-left:1px dashed #86efac;padding-left:10px;font-size:9px;color:#14532d;line-height:1.4}
  .verif .vk b{font-size:11px;letter-spacing:.5px}
  /* FOOTER */
  .foot{margin-top:10px;border-top:3px solid #b45309;padding-top:6px;font-size:9.7px;color:#475569;line-height:1.5}
  .foot .brand{font-size:11px;color:#0f172a}
  .foot .brand b{color:#b45309}
  .btnbar{position:fixed;top:14px;right:14px;z-index:5}
  .btnbar button{background:#1d4ed8;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 6px 16px rgba(29,78,216,.35)}
  @media print{.btnbar{display:none}.page{padding:0;max-width:none}}
</style>
</head>
<body>
<div class="btnbar"><button onclick="window.print()">🖨️ Cetak / Simpan Dokumen (A4)</button></div>

<div class="wm">DISETUJUI<span class="kcl">E-KOPI • KODE ${verificationCode}</span></div>

<div class="page">
 <div class="konten">
  <!-- KOP SURAT -->
  <div class="kop">
    ${
      letterheadUrl
        ? `<img class="kop-full" src="${letterheadUrl}" alt="Kop Surat Perusahaan">`
        : `<div class="kt">
            <div class="n">${companyName}</div>
            <div class="a">${companyAddress}</div>
          </div>`
    }
  </div>
  <div class="garis"></div><div class="garis2"></div>

  <!-- JUDUL SURAT -->
  <div class="judul">
    <h2>SURAT PENGAJUAN CUTI</h2>
    <div class="rule"></div>
    <div class="no">Nomor: ${leaveRequest.id}/E-KOPI/${year}</div>
  </div>

  <!-- META BOXES -->
  <div class="meta">
    <div class="m"><div class="l">ID PENGAJUAN</div><div class="v">${leaveRequest.id}</div></div>
    <div class="m"><div class="l">DISETUJUI PADA</div><div class="v">${approvedAtFormatted}</div></div>
    <div class="m"><div class="l">KODE VERIFIKASI</div><div class="v">${verificationCode}</div></div>
  </div>

  <!-- DATA PEMOHON -->
  <div class="seksi"><div class="bar"></div><div class="tx">DATA PEMOHON</div><div class="ln"></div></div>
  <div class="kartu">
    <table>
      <tr>
        <td class="lb">NAMA</td><td class="vl"><b>${employee.full_name || '-'}</b></td>
        <td class="lb">NIK</td><td class="vl">${employee.nik || '-'}</td>
      </tr>
      <tr>
        <td class="lb">JABATAN</td><td class="vl">${employee.position_name || '-'}</td>
        <td class="lb">DEPARTEMEN</td><td class="vl">${employee.department_name || '-'}</td>
      </tr>
      <tr>
        <td class="lb">PERUSAHAAN</td><td class="vl">${employee.company_name || '-'}</td>
        <td class="lb">SITE</td><td class="vl">${employee.site_name || '-'}</td>
      </tr>
    </table>
  </div>

  <!-- RINCIAN CUTI -->
  <div class="seksi"><div class="bar"></div><div class="tx">RINCIAN CUTI</div><div class="ln"></div></div>
  <div class="isi">
    <p>Dengan ini mengajukan cuti tahunan selama <b>${leaveRequest.total_days || 0} hari kerja</b> pada tanggal-tanggal berikut:</p>
    <div class="tgl-box">
      ${datePillsHtml || '<span class="pill">-</span>'}
    </div>
    <table class="mini">
      <tr><td class="lb">Alasan cuti</td><td>:</td><td>${leaveRequest.reason || '-'}</td></tr>
      <tr><td class="lb">No. telp darurat</td><td>:</td><td>${leaveRequest.emergency_contact || '-'}</td></tr>
    </table>
  </div>

  <!-- RINGKASAN KUOTA CUTI -->
  <div class="seksi"><div class="bar"></div><div class="tx">RINGKASAN KUOTA CUTI TAHUN ${quotaYear}</div><div class="ln"></div></div>
  <table class="kuota">
    <tr><th style="width:62%">URAIAN</th><th>JUMLAH</th></tr>
    <tr><td>Jatah cuti tahun ${quotaYear}</td><td>${quotaAllocation} hari</td></tr>
    <tr><td>Cuti diambil pada pengajuan ini</td><td>${quotaUsedThis} hari</td></tr>
    <tr><td>Total cuti terpakai tahun ${quotaYear} (termasuk pengajuan ini)</td><td>${quotaTotalUsed} hari</td></tr>
    <tr class="sisa"><td>Sisa cuti setelah pengajuan ini</td><td>${quotaRemaining} hari</td></tr>
  </table>

  <p class="isi" style="margin-top:6px;">Demikian surat pengajuan cuti ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya. Atas perhatian dan persetujuannya, saya ucapkan terima kasih.</p>

  <!-- TANDA TANGAN -->
  <div class="ttd-head">Diterbitkan pada ${approvedAtFormatted},</div>
  <div class="ttd">
    <div class="kol"><div class="jb">Pengaju,</div><div class="sp"></div><div class="nm">${employee.full_name || 'Pemohon'}</div></div>
    <div class="kol"><div class="jb">Mengetahui, Danru</div><div class="sp"></div><div class="nm">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div></div>
    <div class="kol"><div class="jb">Menyetujui, PJ Operasional / Kasatgas</div><div class="sp"></div><div class="nm">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div></div>
  </div>

  <!-- STRIP VERIFIKASI -->
  <div class="verif">
    <div class="vi">✓</div>
    <div class="vt">
      <div class="vt1">TERVERIFIKASI SISTEM E-KOPI</div>
      <div class="vt2">Kode verifikasi: <b>${verificationCode}</b> • Disetujui: ${approvedAtFormatted}${
        processedByName ? ` • Diproses oleh: ${processedByName}` : ''
      } • Keaslian dokumen ini dapat diverifikasi melalui admin E-KOPI.</div>
    </div>
    <div class="vk"><b>E-KOPI</b><br>By Regina-App</div>
  </div>

  <!-- FOOTER -->
  <div class="foot">
    <div class="brand">Diterbitkan secara elektronik oleh <b>E-KOPI By Regina-App</b> — Elektronik Koperasi dan Cuti</div>
    Persetujuan pada surat ini telah divalidasi oleh sistem E-KOPI dan sah secara elektronik. Tanda tangan basah dari ketiga pihak di atas tetap diperlukan. <span style="color:#94a3b8">E-KOPI v${appVersion} • Regina-App</span>
  </div>
 </div>
</div>
</body>
</html>`
}

/**
 * PDF Service: generates leave letter, saves snapshot in leave_letters, returns HTML / buffer
 */
export async function generateLeaveLetter(
  params: GenerateLeaveLetterParams
): Promise<GenerateLeaveLetterResult> {
  const { leaveRequest, employee, settings, quota, processedByName } = params
  const adminClient = createAdminClient()

  // Build the complete HTML
  const html = buildLeaveLetterHtml(params)
  const buffer = Buffer.from(html, 'utf-8')
  const filePath = `leave-letters/${leaveRequest.id}.html`

  const snapshotData = {
    leaveRequestId: leaveRequest.id,
    employee: {
      id: employee.id,
      nik: employee.nik,
      name: employee.full_name,
      company: employee.company_name,
      department: employee.department_name,
      position: employee.position_name,
      site: employee.site_name,
    },
    dates: leaveRequest.selected_dates,
    totalDays: leaveRequest.total_days,
    reason: leaveRequest.reason,
    emergencyContact: leaveRequest.emergency_contact,
    verificationCode: leaveRequest.verification_code,
    approvedAt: leaveRequest.processed_at || leaveRequest.created_at,
    quota: quota || null,
    generatedAt: new Date().toISOString(),
  } as unknown as Json

  // Store or update leave_letters table
  try {
    const { data: existingLetter } = await adminClient
      .from('leave_letters')
      .select('id')
      .eq('leave_request_id', leaveRequest.id)
      .maybeSingle()

    if (existingLetter) {
      await adminClient
        .from('leave_letters')
        .update({
          file_path: filePath,
          snapshot_data: snapshotData,
          generated_at: new Date().toISOString(),
        })
        .eq('id', existingLetter.id)
    } else {
      await adminClient.from('leave_letters').insert({
        leave_request_id: leaveRequest.id,
        file_path: filePath,
        snapshot_data: snapshotData,
        generated_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn('[PDFService] Failed to upsert leave_letters record:', err)
  }

  return {
    html,
    buffer,
    filePath,
    snapshotData,
  }
}
