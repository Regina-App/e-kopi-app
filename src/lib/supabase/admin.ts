import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabaseUrl =
    rawUrl && rawUrl.startsWith('http')
      ? rawUrl
      : 'https://placeholder.supabase.co'
  const supabaseServiceRoleKey =
    rawKey && rawKey.length > 5 ? rawKey : 'placeholder-service-key'

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const adminClient = createAdminClient()
