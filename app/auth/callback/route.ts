import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GUEST_COOKIE_NAME } from '@/lib/auth/guest'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Clear any guest session cookie if the user just signed in via OAuth
      const cookieStore = await cookies()
      cookieStore.delete(GUEST_COOKIE_NAME)

      // Ensure next path is safe (prevent open redirect)
      const isRelative = next.startsWith('/') && !next.startsWith('//')
      const targetUrl = isRelative ? `${origin}${next}` : `${origin}/dashboard`

      return NextResponse.redirect(targetUrl)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
