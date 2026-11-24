import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loanService } from '@/lib/services/loan.service'

const calculateInputSchema = z.object({
  amount: z
    .number({
      message: 'Nominal pinjaman harus berupa angka',
    })
    .int('Nominal pinjaman harus berupa bilangan bulat')
    .min(100000, 'Nominal pinjaman minimal Rp 100.000'),
  tenor: z
    .number({
      message: 'Tenor harus berupa angka',
    })
    .int('Tenor harus berupa bilangan bulat')
    .min(1, 'Tenor minimal 1 bulan')
    .max(12, 'Tenor maksimal 12 bulan'),
  interestRate: z.number().optional().default(0.025),
})

/**
 * Public calculator endpoint for loan breakdown and schedule.
 * Does not require authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = calculateInputSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Input kalkulasi pinjaman tidak valid'
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const { amount, tenor, interestRate } = parsed.data
    const calculation = loanService.calculateLoan(amount, tenor, interestRate)

    return NextResponse.json({
      success: true,
      data: calculation,
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghitung simulasi'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
