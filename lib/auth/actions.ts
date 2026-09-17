'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  GUEST_COOKIE_NAME,
  GUEST_SESSION_MAX_AGE,
  createGuestSession,
  encodeGuestSession,
  convertGuestAccount,
} from './guest'
import type { AuthActionResult, OAuthProvider } from './types'

/**
 * Server action to register a new user with Email and Password.
 */
export async function signUpWithEmail(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const fullName = (formData.get('fullName') as string)?.trim()

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password minimal harus 6 karakter.' }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          is_guest: false,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Clean up any guest cookie if registering a new permanent account
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_COOKIE_NAME)

    // If email confirmation is disabled or immediate session created
    if (data.session) {
      redirect('/dashboard')
    }

    return {
      success: true,
      data: {
        message: 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi jika diperlukan.',
      },
    }
  } catch (err: unknown) {
    // Next.js redirect throws a NEXT_REDIRECT error which should not be caught as failure
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat registrasi.'
    return { success: false, error: message }
  }
}

/**
 * Server action to sign in with Email and Password.
 */
export async function signInWithEmail(formData: FormData): Promise<AuthActionResult<{ redirectTo: string }>> {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const next = (formData.get('next') as string)?.trim() || '/dashboard'

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Clean up any guest cookie since user logged in as permanent
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_COOKIE_NAME)

    return { success: true, data: { redirectTo: next } }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Gagal login.'
    return { success: false, error: message }
  }
}

/**
 * Server action to initiate OAuth sign-in flow (Google, GitHub).
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  nextUrl: string = '/dashboard'
): Promise<AuthActionResult<{ url: string }>> {
  try {
    const supabase = await createClient()
    const headerList = await headers()
    const host = headerList.get('host') || 'localhost:3000'
    const protocol = headerList.get('x-forwarded-proto') || 'http'
    const origin = `${protocol}://${host}`

    const redirectCallback = `${origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectCallback,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data?.url) {
      return { success: false, error: 'URL otentikasi OAuth tidak ditemukan.' }
    }

    return { success: true, data: { url: data.url } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memulai login OAuth.'
    return { success: false, error: message }
  }
}

/**
 * Server action to sign in as a Guest User (Akses Pengguna Sementara).
 */
export async function signInAsGuest(nextUrl: string = '/dashboard'): Promise<AuthActionResult> {
  try {
    const supabase = await createClient()
    const { user, sessionData, error } = await createGuestSession(supabase)

    if (error || !user || !sessionData) {
      return { success: false, error: error || 'Gagal membuat sesi tamu.' }
    }

    // Set guest session cookie
    const cookieStore = await cookies()
    cookieStore.set(GUEST_COOKIE_NAME, encodeGuestSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: GUEST_SESSION_MAX_AGE,
    })

    redirect(nextUrl)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Gagal masuk sebagai tamu.'
    return { success: false, error: message }
  }
}

/**
 * Server action to upgrade an existing Guest account to a permanent account.
 */
export async function upgradeGuestAccount(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const fullName = (formData.get('fullName') as string)?.trim()

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi untuk upgrade akun.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password minimal harus 6 karakter.' }
  }

  try {
    const supabase = await createClient()
    const { success, error } = await convertGuestAccount(supabase, {
      email,
      password,
      fullName: fullName || 'Pengguna Terdaftar',
    })

    if (!success || error) {
      return { success: false, error: error || 'Gagal meng-upgrade akun tamu.' }
    }

    // Remove guest cookie on successful upgrade
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_COOKIE_NAME)

    redirect('/dashboard')
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Gagal meng-upgrade akun.'
    return { success: false, error: message }
  }
}

/**
 * Server action to sign out from the current session.
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete(GUEST_COOKIE_NAME)
  } catch {
    // Ignore sign out errors and proceed with redirect
  }

  redirect('/login')
}
