import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { GuestSessionData, UpgradeGuestInput } from './types'

export const GUEST_COOKIE_NAME = 'sector_guest_session'
export const GUEST_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Serializes guest session data into a secure cookie value.
 */
export function encodeGuestSession(data: GuestSessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

/**
 * Deserializes and validates guest session data from cookie.
 */
export function decodeGuestSession(token: string | undefined | null): GuestSessionData | null {
  if (!token) return null
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8')
    const parsed = JSON.parse(jsonStr) as GuestSessionData
    if (!parsed || !parsed.isGuest || !parsed.guestId || !parsed.expiresAt) {
      return null
    }
    // Check expiration
    if (Date.now() > parsed.expiresAt) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Determines whether a user is an anonymous guest user.
 */
export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false
  return Boolean(
    user.is_anonymous ||
    user.user_metadata?.is_guest === true ||
    user.app_metadata?.provider === 'anonymous'
  )
}

/**
 * Initializes a Supabase anonymous guest session.
 */
export async function createGuestSession(supabase: SupabaseClient<Database>): Promise<{
  user: User | null
  sessionData: GuestSessionData | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          full_name: 'Tamu (Guest)',
          is_guest: true,
        },
      },
    })

    if (error) {
      return { user: null, sessionData: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, sessionData: null, error: 'Gagal membuat pengguna tamu' }
    }

    const now = Date.now()
    const sessionData: GuestSessionData = {
      isGuest: true,
      guestId: data.user.id,
      createdAt: now,
      expiresAt: now + GUEST_SESSION_MAX_AGE * 1000,
    }

    return { user: data.user, sessionData, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kesalahan internal saat membuat sesi tamu'
    return { user: null, sessionData: null, error: message }
  }
}

/**
 * Converts an existing anonymous guest account to a permanent user account.
 * Supabase converts the user in-place, retaining user.id and all associated relations.
 */
export async function convertGuestAccount(
  supabase: SupabaseClient<Database>,
  input: UpgradeGuestInput
): Promise<{ success: boolean; user: User | null; error: string | null }> {
  try {
    const { email, password, fullName } = input

    // 1. Update user credentials in Supabase Auth
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: {
        full_name: fullName,
        is_guest: false,
      },
    })

    if (error) {
      return { success: false, user: null, error: error.message }
    }

    // 2. Update user_profiles table directly
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          is_guest: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id)
    }

    return { success: true, user: data.user, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal meng-upgrade akun tamu'
    return { success: false, user: null, error: message }
  }
}
