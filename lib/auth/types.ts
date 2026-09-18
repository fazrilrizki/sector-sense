import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export type AuthRole = 'user' | 'guest' | 'unauthenticated'

export type AuthStatus = 'authenticated' | 'guest' | 'unauthenticated'

export type OAuthProvider = 'google' | 'github'

export interface GuestSessionData {
  isGuest: true
  guestId: string
  createdAt: number
  expiresAt: number
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isGuest: boolean
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface SignUpInput {
  email: string
  password: string
  fullName: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface UpgradeGuestInput {
  email: string
  password: string
  fullName: string
}
