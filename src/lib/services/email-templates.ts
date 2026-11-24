import { formatRupiah, formatDate } from '@/lib/utils'
import type { Employee, LeaveRequest, LoanRequest } from '@/lib/types/database'

/**
 * Base template wrapper with responsive HTML table structure and E-KOPI branding
 */
export function baseTemplate(content: string, preheader: string = ''): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>E-KOPI By Regina - App</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content-padding { padding: 20px 16px !important; }
      .button-cell { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  ${
    preheader
      ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #f1f5f9; opacity: 0;">
          ${preheader}
        </div>`
      : ''
  }
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                      E-KOPI <span style="font-size: 13px; font-weight: 400; color: #93c5fd; letter-spacing: 1.5px; text-transform: uppercase;">By Regina - App</span>
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                      Sistem Elektronik Cuti &amp; Koperasi Karyawan
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: #bfdbfe;">
                      NOTIFIKASI RESMI
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GOLD ACCENT STRIP -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%);"></td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td class="content-padding" style="padding: 32px 32px 28px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-top: 1px solid #1e293b;">
              <div style="font-size: 12px; font-weight: 700; color: #f8fafc; letter-spacing: 0.5px;">
                E-KOPI BY REGINA - APP
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; line-height: 1.5;">
                Pemberitahuan otomatis ini dikirimkan oleh sistem terpadu E-KOPI.<br>
                Mohon tidak membalas email ini secara langsung.
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 12px; padding-top: 12px; border-top: 1px solid #1e293b;">
                &copy; ${year} E-KOPI Platform. Hak Cipta Dilindungi Undang-Undang.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * OTP Code Email Template
 */
export function otpTemplate(otp: string, name?: string): string {
  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      Verifikasi Masuk Akun
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Halo <strong>${name || 'Karyawan E-KOPI'}</strong>,<br>
      Kami menerima permintaan kode One-Time Password (OTP) untuk masuk ke akun E-KOPI Anda. Masukkan kode berikut pada halaman verifikasi:
    </p>

    <!-- OTP DISPLAY BOX -->
    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">
        KODE VERIFIKASI (OTP)
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; text-indent: 10px;">
        ${otp}
      </div>
      <div style="font-size: 12px; color: #b45309; font-weight: 600; margin-top: 10px;">
        ⏱️ Berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!
      </div>
    </div>

    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
      Jika Anda tidak merasa melakukan permintaan masuk akun ini, abaikan email ini atau segera laporkan kepada administrator sistem untuk keamanan akun Anda.
    </p>
  `
  return baseTemplate(content, `Kode OTP E-KOPI Anda: ${otp}`)
}

/**
 * Registration Notification/Approval/Rejection Email Template
 */
export function registrationTemplate(
  employee: Partial<Employee>,
  type: 'notification' | 'approved' | 'rejected',
  reason?: string
): string {
  const name = employee.full_name || 'Karyawan'
  const nik = employee.nik || '-'
  const email = employee.email || '-'
  const phone = employee.phone || '-'

  if (type === 'notification') {
    const content = `
      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
        Pendaftaran Akun Baru Menunggu Verifikasi
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Pemberitahuan untuk Administrator: Seorang karyawan baru telah melakukan pendaftaran akun mandiri pada sistem E-KOPI dan memerlukan peninjauan serta persetujuan Anda.
      </p>

      <!-- EMPLOYEE DETAILS CARD -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">Nama Lengkap</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">: ${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">NIK Karyawan</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">: ${nik}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Alamat Email</td>
                <td style="padding: 6px 0; color: #0f172a;">: ${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">No. Telepon</td>
                <td style="padding: 6px 0; color: #0f172a;">: ${phone}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/karyawan" 
           style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">
          Buka Panel Admin &rarr;
        </a>
      </div>
    `
    return baseTemplate(content, `Pendaftaran Akun Baru: ${name} (${nik})`)
  }

  if (type === 'approved') {
    const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 50%; background-color: #dcfce7; color: #15803d; font-size: 26px; font-weight: bold;">
          ✓
        </div>
      </div>
      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">
        Selamat, Akun Anda Telah Disetujui!
      </h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Halo <strong>${name}</strong>,<br>
        Pendaftaran akun Anda pada <strong>E-KOPI By Regina - App</strong> telah diverifikasi dan disetujui oleh administrator. Sekarang Anda dapat menggunakan seluruh layanan permohonan cuti dan pinjaman koperasi secara mandiri.
      </p>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <tr>
          <td>
            <div style="font-size: 13px; color: #166534; font-weight: 600;">Data Akun Aktif:</div>
            <div style="font-size: 13px; color: #14532d; margin-top: 4px;">NIK: <strong>${nik}</strong></div>
            <div style="font-size: 13px; color: #14532d; margin-top: 2px;">Email: <strong>${email}</strong></div>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
           style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">
          Masuk ke Aplikasi &rarr;
        </a>
      </div>
    `
    return baseTemplate(content, 'Akun E-KOPI Anda telah disetujui')
  }

  // REJECTED
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 50%; background-color: #fee2e2; color: #b91c1c; font-size: 26px; font-weight: bold;">
        ✕
      </div>
    </div>
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">
      Pemberitahuan Pendaftaran Akun
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Halo <strong>${name}</strong>,<br>
      Mohon maaf, permohonan pendaftaran akun Anda untuk NIK <strong>${nik}</strong> belum dapat disetujui oleh administrator dengan pertimbangan berikut:
    </p>

    <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase;">Alasan Penolakan:</div>
      <div style="font-size: 13px; color: #881337; margin-top: 4px; line-height: 1.5;">
        ${reason || 'Data pendaftaran tidak sesuai dengan catatan kepegawaian perusahaan.'}
      </div>
    </div>

    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
      Apabila Anda memerlukan klarifikasi lebih lanjut atau ingin memperbarui data pendaftaran, silakan hubungi bagian HRD / Administrator E-KOPI di kantor operasional.
    </p>
  `
  return baseTemplate(content, 'Pemberitahuan Status Pendaftaran E-KOPI')
}

/**
 * Leave Approval Request Email Template (Sent to Admin with Action Buttons)
 */
export function leaveApprovalEmailTemplate(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>,
  approveUrl: string,
  rejectUrl: string
): string {
  const datesArray = Array.isArray(leaveRequest.selected_dates)
    ? (leaveRequest.selected_dates as string[])
    : []

  const datePills = datesArray
    .map(
      (d) =>
        `<span style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 600; margin: 2px;">🗓️ ${formatDate(
          d,
          'dd/MM/yyyy'
        )}</span>`
    )
    .join(' ')

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      Permohonan Persetujuan Cuti Karyawan
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Terdapat pengajuan cuti baru yang membutuhkan persetujuan Anda:
    </p>

    <!-- EMPLOYEE & REQUEST SUMMARY -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 140px;">Nama Karyawan</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">: ${employee.full_name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">NIK Karyawan</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${employee.nik || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">ID Pengajuan</td>
              <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-weight: 600;">: ${leaveRequest.id || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Durasi Cuti</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">: ${leaveRequest.total_days || 0} Hari Kerja</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; vertical-align: top;">Tanggal Cuti</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${datePills || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b; vertical-align: top;">Alasan Cuti</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${leaveRequest.reason || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Kontak Darurat</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${leaveRequest.emergency_contact || '-'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 12px; text-align: center;">
      Tindakan Cepat (Klik salah satu tombol di bawah):
    </div>

    <!-- ACTION BUTTONS -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="button-cell" align="center" style="padding: 6px;">
          <a href="${approveUrl}" 
             style="display: block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">
            ✓ SETUJUI CUTI
          </a>
        </td>
        <td class="button-cell" align="center" style="padding: 6px;">
          <a href="${rejectUrl}" 
             style="display: block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
            ✕ TOLAK CUTI
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
      Tautan di atas aman dan hanya dapat digunakan sekali. Anda akan diarahkan ke halaman konfirmasi sebelum keputusan dicatat.
    </p>
  `
  return baseTemplate(content, `Persetujuan Cuti: ${employee.full_name || 'Karyawan'} (${leaveRequest.total_days || 0} Hari)`)
}

/**
 * Leave Status Notification Email Template (Submitted, Approved, Rejected, Cancelled)
 */
export function leaveStatusTemplate(
  employee: Partial<Employee>,
  leaveRequest: Partial<LeaveRequest>,
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled',
  reason?: string
): string {
  const datesArray = Array.isArray(leaveRequest.selected_dates)
    ? (leaveRequest.selected_dates as string[])
    : []

  const formattedDates = datesArray.map((d) => formatDate(d, 'dd/MM/yyyy')).join(', ')

  let title = 'Status Pengajuan Cuti'
  let badgeColor = '#1e3a8a'
  let badgeText = 'DIKIRIM'
  let message = ''

  if (status === 'submitted') {
    title = 'Pengajuan Cuti Berhasil Dikirim'
    badgeColor = '#d97706'
    badgeText = 'MENUNGGU PERSETUJUAN'
    message = 'Pengajuan cuti Anda telah kami terima dan saat ini sedang menunggu persetujuan dari atasan / administrator.'
  } else if (status === 'approved') {
    title = 'Pengajuan Cuti Anda Telah Disetujui'
    badgeColor = '#16a34a'
    badgeText = 'DISETUJUI'
    message = `Selamat! Permohonan cuti Anda telah disetujui. Surat cuti resmi terlampir pada email ini dengan kode verifikasi <strong>${leaveRequest.verification_code || '-'}</strong>.`
  } else if (status === 'rejected') {
    title = 'Pengajuan Cuti Belum Disetujui'
    badgeColor = '#dc2626'
    badgeText = 'DITOLAK'
    message = `Mohon maaf, permohonan cuti Anda belum dapat disetujui.`
  } else if (status === 'cancelled') {
    title = 'Pengajuan Cuti Telah Dibatalkan'
    badgeColor = '#64748b'
    badgeText = 'DIBATALKAN'
    message = 'Pengajuan cuti Anda telah berhasil dibatalkan dan kuota cuti telah dikembalikan ke saldo aktif Anda.'
  }

  const content = `
    <div style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
      ${badgeText}
    </div>
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      ${title}
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Halo <strong>${employee.full_name || 'Karyawan'}</strong>,<br>
      ${message}
    </p>

    <!-- SUMMARY TABLE -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 140px;">ID Pengajuan</td>
              <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-weight: 600;">: ${leaveRequest.id || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Jumlah Hari</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">: ${leaveRequest.total_days || 0} Hari</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Tanggal Cuti</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${formattedDates || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Alasan</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${leaveRequest.reason || '-'}</td>
            </tr>
            ${
              status === 'approved' && leaveRequest.verification_code
                ? `<tr>
                    <td style="padding: 5px 0; color: #64748b;">Kode Verifikasi</td>
                    <td style="padding: 5px 0; color: #16a34a; font-weight: 700; letter-spacing: 1px;">: ${leaveRequest.verification_code}</td>
                  </tr>`
                : ''
            }
          </table>
        </td>
      </tr>
    </table>

    ${
      status === 'rejected' && reason
        ? `<div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase;">Catatan / Alasan Penolakan:</div>
            <div style="font-size: 13px; color: #881337; margin-top: 4px; line-height: 1.5;">${reason}</div>
          </div>`
        : ''
    }

    <div style="text-align: center; margin: 28px 0 10px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cuti" 
         style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">
        Lihat Riwayat Cuti &rarr;
      </a>
    </div>
  `
  return baseTemplate(content, `${title}: ${leaveRequest.id || ''}`)
}

/**
 * Loan Approval Request Email Template (Sent to Admin with Action Buttons)
 */
export function loanApprovalEmailTemplate(
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>,
  approveUrl: string,
  rejectUrl: string
): string {
  const loanAmount = loanRequest.loan_amount || 0
  const tenor = loanRequest.tenor || 0
  const installment = loanRequest.installment_per_month || 0
  const totalObligation = loanRequest.total_obligation || 0
  const isTakeover = loanRequest.is_takeover
  const netDisbursement = loanRequest.net_disbursement ?? loanAmount

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      Permohonan Pinjaman Koperasi Menunggu Persetujuan
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Terdapat pengajuan pinjaman koperasi baru yang memerlukan persetujuan administrator:
    </p>

    <!-- EMPLOYEE & LOAN DETAILS -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 160px;">Nama Peminjam</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">: ${employee.full_name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">NIK Karyawan</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${employee.nik || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">ID Pinjaman</td>
              <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-weight: 600;">: ${loanRequest.id || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Jumlah Pinjaman</td>
              <td style="padding: 5px 0; color: #1e3a8a; font-weight: 700;">: ${formatRupiah(loanAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Jangka Waktu (Tenor)</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">: ${tenor} Bulan</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Angsuran per Bulan</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">: ${formatRupiah(installment)} / bln</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Total Kewajiban</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${formatRupiah(totalObligation)}</td>
            </tr>
            ${
              isTakeover
                ? `<tr>
                    <td style="padding: 5px 0; color: #b45309; font-weight: 600;">Jenis Pinjaman</td>
                    <td style="padding: 5px 0; color: #b45309; font-weight: 600;">: Takeover (Net Cair: ${formatRupiah(
                      netDisbursement
                    )})</td>
                  </tr>`
                : ''
            }
          </table>
        </td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 12px; text-align: center;">
      Tindakan Persetujuan Cepat:
    </div>

    <!-- ACTION BUTTONS -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="button-cell" align="center" style="padding: 6px;">
          <a href="${approveUrl}" 
             style="display: block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">
            ✓ SETUJUI PINJAMAN
          </a>
        </td>
        <td class="button-cell" align="center" style="padding: 6px;">
          <a href="${rejectUrl}" 
             style="display: block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
            ✕ TOLAK PINJAMAN
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
      Tautan approval di atas aman dan hanya dapat digunakan satu kali.
    </p>
  `
  return baseTemplate(
    content,
    `Persetujuan Pinjaman: ${employee.full_name || 'Karyawan'} (${formatRupiah(loanAmount)})`
  )
}

/**
 * Loan Status Notification Email Template (Submitted, Approved, Rejected)
 */
export function loanStatusTemplate(
  employee: Partial<Employee>,
  loanRequest: Partial<LoanRequest>,
  status: 'submitted' | 'approved' | 'rejected',
  netDisbursement?: number,
  reason?: string
): string {
  const loanAmount = loanRequest.loan_amount || 0
  const tenor = loanRequest.tenor || 0
  const installment = loanRequest.installment_per_month || 0
  const totalObligation = loanRequest.total_obligation || 0
  const netCair = netDisbursement ?? loanRequest.net_disbursement ?? loanAmount

  let title = 'Status Pengajuan Pinjaman Koperasi'
  let badgeColor = '#1e3a8a'
  let badgeText = 'DIKIRIM'

  if (status === 'submitted') {
    title = 'Pengajuan Pinjaman Sedang Diproses'
    badgeColor = '#d97706'
    badgeText = 'MENUNGGU VERIFIKASI'
  } else if (status === 'approved') {
    title = 'Selamat, Pengajuan Pinjaman Anda Disetujui!'
    badgeColor = '#16a34a'
    badgeText = 'DISETUJUI'
  } else if (status === 'rejected') {
    title = 'Pengajuan Pinjaman Belum Disetujui'
    badgeColor = '#dc2626'
    badgeText = 'DITOLAK'
  }

  const content = `
    <div style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
      ${badgeText}
    </div>
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      ${title}
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Halo <strong>${employee.full_name || 'Karyawan'}</strong>,<br>
      ${
        status === 'approved'
          ? 'Kabar baik! Pengajuan pinjaman koperasi Anda telah disetujui oleh pengurus koperasi.'
          : status === 'submitted'
          ? 'Pengajuan pinjaman Anda telah berhasil dikirim dan sedang dalam proses verifikasi administrasi.'
          : 'Mohon maaf, pengajuan pinjaman Anda belum dapat disetujui.'
      }
    </p>

    <!-- LOAN TABLE -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 160px;">ID Pinjaman</td>
              <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-weight: 600;">: ${loanRequest.id || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Jumlah Pinjaman</td>
              <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">: ${formatRupiah(loanAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Jangka Waktu</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${tenor} Bulan</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Angsuran per Bulan</td>
              <td style="padding: 5px 0; color: #1e3a8a; font-weight: 700;">: ${formatRupiah(installment)} / bln</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Total Pengembalian</td>
              <td style="padding: 5px 0; color: #0f172a;">: ${formatRupiah(totalObligation)}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 8px 0 5px 0; color: #15803d; font-weight: 700;">Dana Diterima (Net)</td>
              <td style="padding: 8px 0 5px 0; color: #15803d; font-weight: 800; font-size: 15px;">: ${formatRupiah(netCair)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      status === 'approved'
        ? `<!-- PICKUP INSTRUCTIONS -->
          <div style="background-color: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #065f46; display: flex; align-items: center; gap: 6px;">
              🏢 Petunjuk Pengambilan Dana Pinjaman:
            </div>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #047857; line-height: 1.6;">
              <li>Pengambilan dana dilakukan di <strong>Kantor Pusat Operasional (HQ)</strong> pada jam kerja (Senin - Jumat, 09.00 - 16.00 WIB).</li>
              <li>Harap membawa kartu identitas asli (KTP / ID Card Karyawan) dan buku tabungan aktif.</li>
              <li>Pencairan dapat juga dilakukan melalui transfer bank jika data rekening telah terverifikasi.</li>
            </ul>
          </div>`
        : ''
    }

    ${
      status === 'rejected' && reason
        ? `<div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase;">Alasan Penolakan:</div>
            <div style="font-size: 13px; color: #881337; margin-top: 4px; line-height: 1.5;">${reason}</div>
          </div>`
        : ''
    }

    <div style="text-align: center; margin: 28px 0 10px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/koperasi" 
         style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">
        Buka Menu Koperasi &rarr;
      </a>
    </div>
  `
  return baseTemplate(content, `${title}: ${formatRupiah(loanAmount)}`)
}
