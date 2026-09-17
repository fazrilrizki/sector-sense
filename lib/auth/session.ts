import { createClient } from '@/lib/supabase/server'
import { isGuestUser } from './guest'
import type { User } from '@supabase/supabase-js'
import type { AuthRole, AuthState, UserProfile } from './types'

/**
 * Retrieves the authenticated user on the server side using supabase.auth.getUser().
 * Always validates token integrity with the Supabase Auth server.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch {
    return null
  }
}

/**
 * Retrieves the current user's profile from the user_profiles table.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Retrieves comprehensive authentication status for Server Components and layouts.
 */
export async function getAuthStatus(): Promise<{
  role: AuthRole
  state: AuthState
}> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      role: 'unauthenticated',
      state: {
        user: null,
        profile: null,
        isGuest: false,
        isAuthenticated: false,
        isLoading: false,
      },
    }
  }

  const isGuest = isGuestUser(user)
  const profile = await getCurrentProfile()

  return {
    role: isGuest ? 'guest' : 'user',
    state: {
      user,
      profile,
      isGuest,
      isAuthenticated: !isGuest,
      isLoading: false,
    },
  }
}
