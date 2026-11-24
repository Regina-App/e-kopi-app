import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  format,
  formatDistanceToNow,
  differenceInMonths,
  differenceInYears,
  differenceInDays,
} from "date-fns"
import { id as idLocale } from "date-fns/locale/id"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number to Indonesian Rupiah (e.g., Rp 1.500.000)
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount || 0)
  return `Rp ${formatted}`
}

/**
 * Alias for formatRupiah
 */
export function formatCurrency(amount: number): string {
  return formatRupiah(amount)
}

/**
 * Formats a date using Indonesian locale with default format 'dd MMMM yyyy'
 */
export function formatDate(
  date: Date | string | null | undefined,
  fmt: string = "dd MMMM yyyy"
): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return format(d, fmt, { locale: idLocale })
}

/**
 * Formats a date and time to 'dd MMM yyyy, HH:mm'
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return format(d, "dd MMM yyyy, HH:mm", { locale: idLocale })
}

/**
 * Formats NIK by adding a space every 4 digits (e.g., 3201 1234 5678 0001)
 */
export function formatNIK(nik: string): string {
  if (!nik) return ""
  const cleaned = nik.replace(/\s+/g, "")
  return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
}

/**
 * Generates formatted ID: prefix-YYYYMMDD-XXXX (4 random alphanumeric characters)
 */
export function generateId(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const dateStr = `${year}${month}${day}`
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomPart = ""
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${dateStr}-${randomPart}`
}

/**
 * Generates an 8-character random alphanumeric verification code in uppercase
 */
export function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calculates work duration from start date and determines cooperative loan eligibility (>= 12 months)
 */
export function calculateWorkDuration(startDate: Date | string): {
  years: number
  months: number
  days: number
  totalMonths: number
  eligible: boolean
} {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate
  const now = new Date()

  if (isNaN(start.getTime()) || start > now) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      eligible: false,
    }
  }

  const years = differenceInYears(now, start)
  const totalMonths = differenceInMonths(now, start)
  const months = totalMonths % 12
  const anchorDate = new Date(start)
  anchorDate.setFullYear(start.getFullYear() + years)
  anchorDate.setMonth(start.getMonth() + months)
  const days = Math.max(0, differenceInDays(now, anchorDate))
  const eligible = totalMonths >= 12

  return {
    years,
    months,
    days,
    totalMonths,
    eligible,
  }
}

/**
 * Calculates monthly loan installment breakdown and schedule using integer math
 */
export function calculateLoanInstallment(
  amount: number,
  tenor: number,
  interestRate: number = 0.025
): {
  principalPerMonth: number
  interestPerMonth: number
  installmentPerMonth: number
  totalObligation: number
  schedule: Array<{
    number: number
    principal: number
    interest: number
    total: number
  }>
} {
  if (tenor <= 0 || amount <= 0) {
    return {
      principalPerMonth: 0,
      interestPerMonth: 0,
      installmentPerMonth: 0,
      totalObligation: 0,
      schedule: [],
    }
  }

  const principalPerMonth = Math.floor(amount / tenor)
  const remainder = amount - principalPerMonth * tenor
  const interestPerMonth = Math.floor(amount * interestRate)
  const installmentPerMonth = principalPerMonth + interestPerMonth

  const schedule: Array<{
    number: number
    principal: number
    interest: number
    total: number
  }> = []

  let totalObligation = 0

  for (let i = 1; i <= tenor; i++) {
    const isLast = i === tenor
    const principal = isLast ? principalPerMonth + remainder : principalPerMonth
    const interest = interestPerMonth
    const total = principal + interest
    totalObligation += total
    schedule.push({
      number: i,
      principal,
      interest,
      total,
    })
  }

  return {
    principalPerMonth,
    interestPerMonth,
    installmentPerMonth,
    totalObligation,
    schedule,
  }
}

/**
 * Truncates text with ellipsis if length exceeds limit
 */
export function truncateText(text: string, length: number): string {
  if (!text) return ""
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

/**
 * Async delay helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Standard debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Checks if NIK is exactly 16 numeric digits
 */
export function isValidNIK(nik: string): boolean {
  return /^\d{16}$/.test(nik)
}

/**
 * Checks if string is a valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Extracts initials from the first two words in uppercase
 */
export function getInitials(name: string): string {
  if (!name) return ""
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Formats an Indonesian phone number with hyphens
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ""
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("62")) {
    cleaned = `0${cleaned.slice(2)}`
  }
  if (cleaned.length < 9) return phone
  if (cleaned.length <= 11) {
    return cleaned.replace(/(\d{4})(\d{3,4})(\d+)/, "$1-$2-$3")
  }
  return cleaned.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3")
}

/**
 * Generates a 6-digit numeric OTP string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Returns Tailwind badge classes based on status string
 */
export function getStatusColor(status: string): string {
  const s = status?.toLowerCase()
  switch (s) {
    case "approved":
    case "confirmed":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
    case "pending":
    case "scheduled":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
    case "rejected":
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
    case "skipped":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
  }
}

/**
 * Calculates net cash disbursement after deducting existing unpaid obligations
 */
export function calculateNetDisbursement(
  newLoanAmount: number,
  remainingObligation: number
): number {
  return Math.max(0, newLoanAmount - remainingObligation)
}
