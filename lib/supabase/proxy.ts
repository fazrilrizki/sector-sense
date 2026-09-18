import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { isGuestUser, GUEST_COOKIE_NAME, decodeGuestSession } from '@/lib/auth/guest'

// Route configurations
const AUTH_ROUTES = ['/login', '/register']
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings', '/account', '/simulations']
const STRICT_PERMANENT_PREFIXES = ['/profile', '/settings']

/**
 * Updates the Supabase session and enforces route access controls.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname

  // Forward incoming headers to allow setting custom x-headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getUser() to validate auth token against Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check guest status from user object or guest session cookie
  const guestCookie = request.cookies.get(GUEST_COOKIE_NAME)?.value
  const validGuestCookie = decodeGuestSession(guestCookie)
  const isGuest = isGuestUser(user) || Boolean(validGuestCookie)
  const isPermanentUser = Boolean(user && !isGuest)

  // Pass user context headers downstream to Server Components
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-is-guest', isGuest ? '1' : '0')
    requestHeaders.set('x-auth-status', isGuest ? 'guest' : 'user')
  } else {
    requestHeaders.set('x-auth-status', 'unauthenticated')
  }

  // 1. Auth routes (/login, /register):
  // Permanent authenticated users shouldn't access login/register -> redirect to /dashboard
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (isAuthRoute && isPermanentUser) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return copyCookiesAndRedirect(supabaseResponse, redirectUrl)
  }

  // 2. Strict permanent routes (/settings, /profile):
  // Guest users must be prompted to upgrade/register to access permanent-only areas
  const isStrictPermanentRoute = STRICT_PERMANENT_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (isStrictPermanentRoute && isGuest) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/register'
    redirectUrl.searchParams.set('upgrade', 'true')
    redirectUrl.searchParams.set('next', pathname)
    return copyCookiesAndRedirect(supabaseResponse, redirectUrl)
  }

  // 3. Protected routes (/dashboard, /simulations, etc.):
  // If user is completely unauthenticated (neither permanent nor guest), redirect to /login
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (isProtectedRoute && !user && !validGuestCookie) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', pathname)
    return copyCookiesAndRedirect(supabaseResponse, redirectUrl)
  }

  return supabaseResponse
}

/**
 * Helper to preserve all refreshed session cookies when returning a redirect response.
 */
function copyCookiesAndRedirect(fromResponse: NextResponse, targetUrl: URL): NextResponse {
  const redirectResponse = NextResponse.redirect(targetUrl)
  fromResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
    })
  })
  return redirectResponse
}
