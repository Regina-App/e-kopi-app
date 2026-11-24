import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveLeaveRequest, rejectLeaveRequest } from '@/lib/services/leave.service'
import { loanService } from '@/lib/services/loan.service'
import { logAction, AUDIT_ACTIONS } from '@/lib/services/audit.service'
import {
  sendLeaveApproved,
  sendLeaveRejected,
  sendLoanApproved,
  sendLoanRejected,
} from '@/lib/services/email.service'
import { formatDate, formatRupiah } from '@/lib/utils'
import type { EmailApprovalToken, Employee, LeaveRequest, LoanRequest } from '@/lib/types/database'

function renderPage(title: string, bodyContent: string, isError = false) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - E-KOPI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 520px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: #ffffff;
      padding: 24px 28px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      font-size: 12px;
      color: #93c5fd;
      margin-top: 4px;
    }
    .accent {
      height: 4px;
      background: linear-gradient(90deg, #b45309, #f59e0b, #b45309);
    }
    .body {
      padding: 28px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .badge-approve { background: #dcfce7; color: #15803d; }
    .badge-reject { background: #fee2e2; color: #b91c1c; }
    .badge-error { background: #fef2f2; color: #991b1b; }
    .badge-success { background: #dcfce7; color: #166534; }
    .table-detail {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .table-detail td {
      padding: 9px 12px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-detail tr:last-child td {
      border-bottom: none;
    }
    .table-detail td.label {
      width: 40%;
      color: #64748b;
    }
    .table-detail td.value {
      width: 60%;
      font-weight: 600;
      color: #0f172a;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .btn-green { background: #16a34a; color: #ffffff; }
    .btn-green:hover { background: #15803d; }
    .btn-red { background: #dc2626; color: #ffffff; }
    .btn-red:hover { background: #b91c1c; }
    .btn-blue { background: #1e3a8a; color: #ffffff; }
    .btn-blue:hover { background: #1e40af; }
    .form-group {
      margin-top: 16px;
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 9px 12px;
      font-size: 13px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: inherit;
    }
    .footer {
      padding: 16px 28px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>E-KOPI By Regina - App</h1>
      <p>Sistem Persetujuan Cepat Email</p>
    </div>
    <div class="accent"></div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} E-KOPI Platform. Keamanan &amp; Verifikasi Token Terjamin.
    </div>
  </div>
</body>
</html>`
}

/**
 * GET Handler: Validates token and displays confirmation form
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const action = searchParams.get('action') as 'approve' | 'reject' | null

  if (!token) {
    return new NextResponse(
      renderPage(
        'Token Tidak Valid',
        `
        <span class="badge badge-error">ERROR 400</span>
        <h2 style="font-size: 17px; margin-bottom: 8px;">Tautan Tidak Lengkap</h2>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Tautan persetujuan tidak memiliki parameter token yang valid. Pastikan Anda membuka tautan langsung dari email resmi E-KOPI.
        </p>
      `,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Find token
  const { data: tokenRecord, error: tokenErr } = await adminClient
    .from('email_approval_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (tokenErr || !tokenRecord) {
    return new NextResponse(
      renderPage(
        'Token Tidak Ditemukan',
        `
        <span class="badge badge-error">TOKEN TIDAK DITEMUKAN</span>
        <h2 style="font-size: 17px; margin-bottom: 8px;">Tautan Tidak Dikenali</h2>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Token persetujuan tidak terdaftar pada sistem atau telah dihapus.
        </p>
      `,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 404 }
    )
  }

  // Check if used
  if (tokenRecord.is_used) {
    return new NextResponse(
      renderPage(
        'Tautan Telah Digunakan',
        `
        <span class="badge badge-error">SUDAH DIGUNAKAN</span>
        <h2 style="font-size: 17px; margin-bottom: 8px;">Tautan Ini Sudah Pernah Diproses</h2>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Tindakan untuk pengajuan ini telah diproses sebelumnya pada: 
          <strong>${formatDate(tokenRecord.used_at, 'dd MMM yyyy, HH:mm')}</strong>.
        </p>
      `,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  // Check expiration
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return new NextResponse(
      renderPage(
        'Tautan Kedaluwarsa',
        `
        <span class="badge badge-error">KEDALUWARSA</span>
        <h2 style="font-size: 17px; margin-bottom: 8px;">Tautan Telah Berakhir</h2>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Masa berlaku token persetujuan ini telah habis. Silakan buka aplikasi langsung melalui panel admin untuk memproses pengajuan ini.
        </p>
      `,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  const effectiveAction = action || tokenRecord.action

  // Fetch Request & Employee info
  let employeeName = '-'
  let employeeNik = '-'
  let detailRows = ''

  if (tokenRecord.request_type === 'leave') {
    const { data: leave } = await adminClient
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .eq('id', tokenRecord.request_id)
      .maybeSingle()

    if (leave) {
      const emp = leave.employee as unknown as Employee | null
      employeeName = emp?.full_name || '-'
      employeeNik = emp?.nik || '-'
      const dates = Array.isArray(leave.selected_dates)
        ? (leave.selected_dates as string[]).map((d) => formatDate(d, 'dd/MM/yyyy')).join(', ')
        : '-'

      detailRows = `
        <tr><td class="label">Jenis</td><td class="value">Pengajuan Cuti</td></tr>
        <tr><td class="label">Nama Pemohon</td><td class="value">${employeeName}</td></tr>
        <tr><td class="label">NIK</td><td class="value">${employeeNik}</td></tr>
        <tr><td class="label">Durasi Cuti</td><td class="value">${leave.total_days} Hari</td></tr>
        <tr><td class="label">Tanggal Cuti</td><td class="value">${dates}</td></tr>
        <tr><td class="label">Alasan</td><td class="value">${leave.reason || '-'}</td></tr>
        <tr><td class="label">Status Saat Ini</td><td class="value">${leave.status.toUpperCase()}</td></tr>
      `
    }
  } else {
    // loan
    const { data: loan } = await adminClient
      .from('loan_requests')
      .select('*, employee:employees(*)')
      .eq('id', tokenRecord.request_id)
      .maybeSingle()

    if (loan) {
      const emp = loan.employee as unknown as Employee | null
      employeeName = emp?.full_name || '-'
      employeeNik = emp?.nik || '-'

      detailRows = `
        <tr><td class="label">Jenis</td><td class="value">Pinjaman Koperasi</td></tr>
        <tr><td class="label">Nama Pemohon</td><td class="value">${employeeName}</td></tr>
        <tr><td class="label">NIK</td><td class="value">${employeeNik}</td></tr>
        <tr><td class="label">Jumlah Pinjaman</td><td class="value">${formatRupiah(loan.loan_amount)}</td></tr>
        <tr><td class="label">Tenor</td><td class="value">${loan.tenor} Bulan</td></tr>
        <tr><td class="label">Angsuran / Bln</td><td class="value">${formatRupiah(loan.installment_per_month)}</td></tr>
        <tr><td class="label">Net Cair</td><td class="value">${formatRupiah(loan.net_disbursement ?? loan.loan_amount)}</td></tr>
        <tr><td class="label">Status Saat Ini</td><td class="value">${loan.status.toUpperCase()}</td></tr>
      `
    }
  }

  const isApprove = effectiveAction === 'approve'

  const bodyContent = `
    <span class="badge ${isApprove ? 'badge-approve' : 'badge-reject'}">
      ${isApprove ? 'KONFIRMASI PERSETUJUAN' : 'KONFIRMASI PENOLAKAN'}
    </span>
    <h2 style="font-size: 18px; margin-bottom: 6px;">
      ${isApprove ? 'Setujui Pengajuan Ini?' : 'Tolak Pengajuan Ini?'}
    </h2>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      Mohon periksa ringkasan data di bawah ini sebelum mengonfirmasi tindakan Anda:
    </p>

    <table class="table-detail">
      ${detailRows}
    </table>

    <form method="POST" action="/api/email-approval">
      <input type="hidden" name="token" value="${token}" />
      <input type="hidden" name="action" value="${effectiveAction}" />

      <div class="form-group">
        <label class="form-label" for="notes">Catatan Tambahan (Opsional):</label>
        <input class="form-input" type="text" id="notes" name="notes" placeholder="${
          isApprove ? 'Catatan persetujuan (opsional)' : 'Masukkan alasan penolakan...'
        }" ${!isApprove ? 'required' : ''} />
      </div>

      <button type="submit" class="btn ${isApprove ? 'btn-green' : 'btn-red'}">
        ${isApprove ? '✓ Ya, Konfirmasi Setujui' : '✕ Ya, Konfirmasi Tolak'}
      </button>
    </form>
  `

  return new NextResponse(renderPage('Konfirmasi Persetujuan', bodyContent), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/**
 * POST Handler: Executes approval/rejection and renders confirmation result
 */
export async function POST(req: NextRequest) {
  let token = ''
  let action = ''
  let notes = ''

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = await req.json().catch(() => ({}))
    token = json.token || ''
    action = json.action || ''
    notes = json.notes || ''
  } else {
    const formData = await req.formData().catch(() => new FormData())
    token = (formData.get('token') as string) || ''
    action = (formData.get('action') as string) || ''
    notes = (formData.get('notes') as string) || ''
  }

  if (!token) {
    return new NextResponse(
      renderPage(
        'Gagal',
        `<span class="badge badge-error">GAGAL</span><h2>Token tidak disertakan</h2>`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Validate token
  const { data: tokenRecord, error: tokenErr } = await adminClient
    .from('email_approval_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (tokenErr || !tokenRecord) {
    return new NextResponse(
      renderPage(
        'Token Tidak Ditemukan',
        `<span class="badge badge-error">GAGAL</span><h2>Token tidak valid atau tidak ditemukan</h2>`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 404 }
    )
  }

  if (tokenRecord.is_used) {
    return new NextResponse(
      renderPage(
        'Sudah Digunakan',
        `<span class="badge badge-error">KEDALUWARSA</span><h2>Token ini sudah digunakan sebelumnya</h2>`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return new NextResponse(
      renderPage(
        'Kedaluwarsa',
        `<span class="badge badge-error">KEDALUWARSA</span><h2>Token persetujuan telah kedaluwarsa</h2>`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    )
  }

  const effectiveAction = action || tokenRecord.action

  // Fetch active admin ID to associate with the action
  const { data: adminUser } = await adminClient
    .from('admins')
    .select('id, name, email')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const adminId = adminUser?.id || '00000000-0000-0000-0000-000000000000'

  try {
    if (tokenRecord.request_type === 'leave') {
      let result
      if (effectiveAction === 'approve') {
        result = await approveLeaveRequest(tokenRecord.request_id, adminId, notes, 'email')
      } else {
        result = await rejectLeaveRequest(tokenRecord.request_id, adminId, notes, 'email')
      }

      if (!result.success) {
        return new NextResponse(
          renderPage(
            'Proses Gagal',
            `
            <span class="badge badge-error">GAGAL MEMPROSES</span>
            <h2 style="font-size: 18px; margin-bottom: 8px;">Gagal Memproses Permohonan Cuti</h2>
            <p style="font-size: 13px; color: #b91c1c;">${result.error || 'Terjadi kesalahan sistem'}</p>
          `,
            true
          ),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
        )
      }

      // Send status email to employee
      const { data: fullLeave } = await adminClient
        .from('leave_requests')
        .select('*, employee:employees(*)')
        .eq('id', tokenRecord.request_id)
        .maybeSingle()

      if (fullLeave && fullLeave.employee) {
        const emp = fullLeave.employee as unknown as Employee
        if (effectiveAction === 'approve') {
          await sendLeaveApproved(emp, fullLeave)
        } else {
          await sendLeaveRejected(emp, fullLeave, notes)
        }
      }
    } else {
      // loan
      if (effectiveAction === 'approve') {
        await loanService.approveLoanRequest(tokenRecord.request_id, adminId, notes, 'email')
      } else {
        await loanService.rejectLoanRequest(tokenRecord.request_id, adminId, notes, 'email')
      }

      // Send email to employee
      const { data: fullLoan } = await adminClient
        .from('loan_requests')
        .select('*, employee:employees(*)')
        .eq('id', tokenRecord.request_id)
        .maybeSingle()

      if (fullLoan && fullLoan.employee) {
        const emp = fullLoan.employee as unknown as Employee
        if (effectiveAction === 'approve') {
          await sendLoanApproved(emp, fullLoan)
        } else {
          await sendLoanRejected(emp, fullLoan, notes)
        }
      }
    }

    // Mark current token and all tokens for this request as used
    const nowIso = new Date().toISOString()
    await adminClient
      .from('email_approval_tokens')
      .update({
        is_used: true,
        used_at: nowIso,
        used_by: 'email-link',
      })
      .eq('request_id', tokenRecord.request_id)

    // Log action to audit
    await logAction({
      actorType: 'admin',
      actorId: adminId,
      action:
        tokenRecord.request_type === 'leave'
          ? effectiveAction === 'approve'
            ? AUDIT_ACTIONS.APPROVE_LEAVE
            : AUDIT_ACTIONS.REJECT_LEAVE
          : effectiveAction === 'approve'
          ? AUDIT_ACTIONS.APPROVE_LOAN
          : AUDIT_ACTIONS.REJECT_LOAN,
      targetType: tokenRecord.request_type,
      targetId: tokenRecord.request_id,
      newValues: {
        action: effectiveAction,
        source: 'email',
        notes: notes || null,
        used_at: nowIso,
      },
    })

    const isApprove = effectiveAction === 'approve'
    const successHtml = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: ${
          isApprove ? '#dcfce7' : '#fee2e2'
        }; color: ${isApprove ? '#15803d' : '#b91c1c'}; font-size: 28px; font-weight: bold;">
          ${isApprove ? '✓' : '✕'}
        </div>
      </div>
      <span class="badge ${isApprove ? 'badge-success' : 'badge-reject'}" style="display: block; width: fit-content; margin: 0 auto 12px;">
        ${isApprove ? 'BERHASIL DISETUJUI' : 'BERHASIL DITOLAK'}
      </span>
      <h2 style="font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 8px;">
        Tindakan Telah Diproses
      </h2>
      <p style="font-size: 14px; color: #475569; text-align: center; line-height: 1.6; margin-bottom: 24px;">
        Permohonan <strong>${
          tokenRecord.request_type === 'leave' ? 'Cuti' : 'Pinjaman Koperasi'
        }</strong> (ID: <code>${tokenRecord.request_id}</code>) telah 
        <strong>${isApprove ? 'disetujui' : 'ditolak'}</strong> melalui verifikasi email. Karyawan yang bersangkutan telah menerima pemberitahuan resmi.
      </p>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard" class="btn btn-blue">
          Masuk ke Panel Admin &rarr;
        </a>
      </div>
    `

    return new NextResponse(renderPage('Berhasil Diproses', successHtml), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return new NextResponse(
      renderPage(
        'Gagal Memproses',
        `
        <span class="badge badge-error">KESALAHAN</span>
        <h2 style="font-size: 18px; margin-bottom: 8px;">Gagal Memproses Tindakan</h2>
        <p style="font-size: 13px; color: #b91c1c; line-height: 1.5;">${errorMsg}</p>
      `,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
    )
  }
}
