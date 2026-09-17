import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Supabase Admin Client
 * DILINDUNGI SERVER-ONLY: Menggunakan Service Role Key yang mem-bypass Row Level Security (RLS).
 * JANGAN PERNAH gunakan di Client Components atau mengekspos datanya secara publik tanpa otorisasi!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL belum diset di environment variables.'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
