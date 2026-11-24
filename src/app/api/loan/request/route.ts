import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loanService } from '@/lib/services/loan.service'

const DEMO_EMPLOYEE_ID = 'e1000000-0000-0000-0000-000000000001'

function getEmployeeIdFromRequest(request: NextRequest, bodyEmployeeId?: string): string {
  // 1. Header
  const headerId = request.headers.get('x-employee-id')
  if (headerId) return headerId

  // 2. Query param
  const url = new URL(request.url)
  const queryId = url.searchParams.get('employee_id')
  if (queryId) return queryId

  // 3. Body
  if (bodyEmployeeId) return bodyEmployeeId

  // 4. Cookie
  const cookieId = request.cookies.get('employee_id')?.value
  if (cookieId) return cookieId

  // 5. Default fallback for testing/demo
  return DEMO_EMPLOYEE_ID
}

const createLoanSchema = z.object({
  loan_amount: z
    .number({
      message: 'Nominal pinjaman harus berupa angka',
    })
    .int('Nominal pinjaman harus berupa bilangan bulat')
    .min(500000, 'Nominal pinjaman minimal Rp 500.000'),
  tenor: z
    .number({
      message: 'Tenor harus berupa angka',
    })
    .int('Tenor pinjaman harus berupa bilangan bulat')
    .min(1, 'Tenor pinjaman minimal 1 bulan')
    .max(12, 'Tenor pinjaman maksimal 12 bulan'),
  is_takeover: z.boolean().optional().default(false),
  employee_id: z.string().optional(),
})

/**
 * POST /api/loan/request
 * Creates a new loan request.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createLoanSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Data pengajuan tidak valid'
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const employeeId = getEmployeeIdFromRequest(request, parsed.data.employee_id)
    const result = await loanService.createLoanRequest(employeeId, {
      loan_amount: parsed.data.loan_amount,
      tenor: parsed.data.tenor,
      is_takeover: parsed.data.is_takeover,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan pinjaman berhasil diajukan dan sedang menunggu persetujuan.',
        data: result,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memproses pengajuan pinjaman'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 400 }
    )
  }
}

/**
 * GET /api/loan/request
 * Retrieves loan requests for an employee.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined
    const employeeId = getEmployeeIdFromRequest(request)

    const requests = await loanService.getLoanRequests(employeeId, { status })

    return NextResponse.json({
      success: true,
      data: requests,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memuat riwayat pengajuan pinjaman'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
