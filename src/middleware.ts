import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/offline']
const AUTH_ROUTES = ['/login', '/register', '/verify-otp']
const EMPLOYEE_ROUTES = ['/dashboard', '/cuti', '/koperasi', '/profil', '/tentang']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update session cookies
  const response = await updateSession(request)

  // For now, allow all routes (auth check will be added in Phase 2)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|sw.js|manifest.json|offline.html|api).*)',
  ],
}
