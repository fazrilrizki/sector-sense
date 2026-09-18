import test from 'node:test'
import assert from 'node:assert/strict'

// 1. Test Guest Token Serialization & Deserialization Logic
function encodeGuestSession(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

function decodeGuestSession(token) {
  if (!token) return null
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8')
    const parsed = JSON.parse(jsonStr)
    if (!parsed || !parsed.isGuest || !parsed.guestId || !parsed.expiresAt) {
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function isGuestUser(user) {
  if (!user) return false
  return Boolean(
    user.is_anonymous ||
    user.user_metadata?.is_guest === true ||
    user.app_metadata?.provider === 'anonymous'
  )
}

// 2. Route classification rules for proxy
const AUTH_ROUTES = ['/login', '/register']
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings', '/account', '/simulations']
const STRICT_PERMANENT_PREFIXES = ['/profile', '/settings']

function evaluateRouteAccess(pathname, user, validGuestCookie) {
  const isGuest = isGuestUser(user) || Boolean(validGuestCookie)
  const isPermanentUser = Boolean(user && !isGuest)

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (isAuthRoute && isPermanentUser) {
    return { action: 'redirect', to: '/dashboard' }
  }

  const isStrictPermanentRoute = STRICT_PERMANENT_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (isStrictPermanentRoute && isGuest) {
    return { action: 'redirect', to: `/register?upgrade=true&next=${encodeURIComponent(pathname)}` }
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (isProtectedRoute && !user && !validGuestCookie) {
    return { action: 'redirect', to: `/login?next=${encodeURIComponent(pathname)}` }
  }

  return { action: 'allow' }
}

// Test Suite
test('Guest Session: encode and decode valid token', () => {
  const now = Date.now()
  const sessionData = {
    isGuest: true,
    guestId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: now,
    expiresAt: now + 1000 * 60 * 60 * 24, // 24 hours later
  }

  const token = encodeGuestSession(sessionData)
  assert.ok(typeof token === 'string' && token.length > 0)

  const decoded = decodeGuestSession(token)
  assert.deepEqual(decoded, sessionData)
})

test('Guest Session: reject expired token', () => {
  const past = Date.now() - 5000 // Expired 5 seconds ago
  const expiredData = {
    isGuest: true,
    guestId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: past - 10000,
    expiresAt: past,
  }

  const token = encodeGuestSession(expiredData)
  const decoded = decodeGuestSession(token)
  assert.equal(decoded, null)
})

test('Guest Session: reject invalid or malformed tokens', () => {
  assert.equal(decodeGuestSession(''), null)
  assert.equal(decodeGuestSession('invalid-base64-random-text'), null)
  assert.equal(decodeGuestSession(null), null)
  assert.equal(decodeGuestSession(undefined), null)
})

test('isGuestUser: identifies guest and permanent users correctly', () => {
  assert.equal(isGuestUser(null), false)
  assert.equal(isGuestUser(undefined), false)
  
  // Anonymous user via Supabase
  assert.equal(isGuestUser({ id: 'u1', is_anonymous: true }), true)
  assert.equal(isGuestUser({ id: 'u2', user_metadata: { is_guest: true } }), true)
  assert.equal(isGuestUser({ id: 'u3', app_metadata: { provider: 'anonymous' } }), true)

  // Permanent user
  assert.equal(
    isGuestUser({ id: 'u4', email: 'investor@example.com', is_anonymous: false }),
    false
  )
})

test('Route Protection: Unauthenticated user trying to access protected routes', () => {
  const result = evaluateRouteAccess('/dashboard', null, null)
  assert.equal(result.action, 'redirect')
  assert.equal(result.to, '/login?next=%2Fdashboard')

  const profileResult = evaluateRouteAccess('/profile', null, null)
  assert.equal(profileResult.action, 'redirect')
  assert.equal(profileResult.to, '/login?next=%2Fprofile')
})

test('Route Protection: Unauthenticated user accessing public routes', () => {
  assert.equal(evaluateRouteAccess('/', null, null).action, 'allow')
  assert.equal(evaluateRouteAccess('/login', null, null).action, 'allow')
  assert.equal(evaluateRouteAccess('/register', null, null).action, 'allow')
})

test('Route Protection: Permanent user accessing auth pages is redirected to /dashboard', () => {
  const permanentUser = { id: 'user-1', email: 'user@example.com', is_anonymous: false }
  
  const loginResult = evaluateRouteAccess('/login', permanentUser, null)
  assert.equal(loginResult.action, 'redirect')
  assert.equal(loginResult.to, '/dashboard')

  const registerResult = evaluateRouteAccess('/register', permanentUser, null)
  assert.equal(registerResult.action, 'redirect')
  assert.equal(registerResult.to, '/dashboard')
})

test('Route Protection: Guest user accessing dashboard vs strict permanent routes', () => {
  const guestUser = { id: 'guest-1', is_anonymous: true }
  
  // Dashboard is accessible to guests (hybrid)
  const dashboardResult = evaluateRouteAccess('/dashboard', guestUser, null)
  assert.equal(dashboardResult.action, 'allow')

  // Strict permanent routes prompt upgrade
  const profileResult = evaluateRouteAccess('/profile', guestUser, null)
  assert.equal(profileResult.action, 'redirect')
  assert.equal(profileResult.to, '/register?upgrade=true&next=%2Fprofile')

  const settingsResult = evaluateRouteAccess('/settings', guestUser, null)
  assert.equal(settingsResult.action, 'redirect')
  assert.equal(settingsResult.to, '/register?upgrade=true&next=%2Fsettings')
})
