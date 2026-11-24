import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabaseUrl =
    rawUrl && rawUrl.startsWith('http')
      ? rawUrl
      : 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    rawKey && rawKey.length > 5 ? rawKey : 'placeholder-anon-key'

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
