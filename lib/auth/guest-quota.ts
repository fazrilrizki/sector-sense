/**
 * Manages guest search quota and cached emiten queries.
 * Enforces a configurable maximum number of unique searches for guest users,
 * with TTL-based deduplication (same symbol within TTL does not consume quota).
 */

export const DEFAULT_GUEST_MAX_SEARCHES = 3
export const DEFAULT_GUEST_SEARCH_TTL_SECONDS = 6 * 60 * 60 // 6 hours (21,600s)

export const GUEST_MAX_SEARCHES: number = (() => {
  const envVal = process.env.NEXT_PUBLIC_GUEST_MAX_SEARCHES
  const parsed = envVal ? parseInt(envVal, 10) : NaN
  return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_GUEST_MAX_SEARCHES
})()

export const GUEST_SEARCH_TTL_MS: number = (() => {
  const envVal = process.env.NEXT_PUBLIC_GUEST_SEARCH_TTL_SECONDS
  const parsed = envVal ? parseInt(envVal, 10) : NaN
  const seconds = !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_GUEST_SEARCH_TTL_SECONDS
  return seconds * 1000
})()

export const GUEST_QUOTA_STORAGE_KEY = 'sector_guest_search_quota'
export const GUEST_QUOTA_COOKIE_KEY = 'sector_guest_search_count'
export const GUEST_QUOTA_EVENT_NAME = 'sector_guest_quota_changed'

export interface GuestSearchItem {
  symbol: string
  searchedAt: number
  expiresAt: number
}

export interface GuestSearchQuota {
  count: number
  limit: number
  remaining: number
  hasReachedLimit: boolean
  activeSearches: GuestSearchItem[]
}

export interface RecordSearchResult {
  success: boolean
  isCached: boolean
  quota: GuestSearchQuota
  reason: 'CACHED' | 'RECORDED' | 'LIMIT_REACHED' | 'INVALID_SYMBOL'
}

/**
 * Reads the raw string from client cookie if available.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Sets client-accessible cookie for synchronization.
 */
function setCookie(name: string, value: string, maxAgeSeconds = 7 * 24 * 60 * 60) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

/**
 * Removes client cookie.
 */
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

/**
 * Broadcasts an update event so listening components update their state.
 */
function notifyQuotaChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GUEST_QUOTA_EVENT_NAME))
  }
}

/**
 * Retrieves the current guest search quota from localStorage and/or cookies.
 * Automatically purges expired cached symbols based on GUEST_SEARCH_TTL_MS.
 */
export function getGuestSearchQuota(): GuestSearchQuota {
  const limit = GUEST_MAX_SEARCHES
  const defaultQuota: GuestSearchQuota = {
    count: 0,
    limit,
    remaining: limit,
    hasReachedLimit: false,
    activeSearches: [],
  }

  if (typeof window === 'undefined') {
    return defaultQuota
  }

  try {
    const raw = window.localStorage.getItem(GUEST_QUOTA_STORAGE_KEY)
    let parsedSearches: GuestSearchItem[] = []

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          parsedSearches = parsed
        }
      } catch {
        parsedSearches = []
      }
    }

    const now = Date.now()
    // Filter out expired searches
    const validSearches = parsedSearches.filter(
      (item) => item && typeof item.symbol === 'string' && item.expiresAt > now
    )

    // If items were pruned, save updated list back to storage
    if (validSearches.length !== parsedSearches.length) {
      window.localStorage.setItem(GUEST_QUOTA_STORAGE_KEY, JSON.stringify(validSearches))
      setCookie(GUEST_QUOTA_COOKIE_KEY, String(validSearches.length))
    }

    const count = validSearches.length
    const remaining = Math.max(0, limit - count)
    const hasReachedLimit = remaining <= 0

    return {
      count,
      limit,
      remaining,
      hasReachedLimit,
      activeSearches: validSearches,
    }
  } catch {
    // Fallback to cookie if localStorage is restricted
    const cookieCount = parseInt(getCookie(GUEST_QUOTA_COOKIE_KEY) || '0', 10)
    const safeCount = isNaN(cookieCount) ? 0 : Math.min(cookieCount, limit)
    const remaining = Math.max(0, limit - safeCount)
    return {
      count: safeCount,
      limit,
      remaining,
      hasReachedLimit: remaining <= 0,
      activeSearches: [],
    }
  }
}

/**
 * Checks if a specific stock ticker is already in the guest's active cache.
 */
export function isSymbolCachedForGuest(symbol: string): boolean {
  if (!symbol) return false
  const cleanSymbol = symbol.toUpperCase().trim()
  const { activeSearches } = getGuestSearchQuota()
  return activeSearches.some((item) => item.symbol === cleanSymbol)
}

/**
 * Records a search action for a guest user.
 * - If the symbol is already active in the cache, does NOT decrement quota (returns isCached: true).
 * - If the symbol is new and quota is available, records it with a TTL.
 * - If the symbol is new and quota is exhausted, rejects the search and returns hasReachedLimit: true.
 */
export function recordGuestSearch(symbol: string): RecordSearchResult {
  const cleanSymbol = (symbol || '').toUpperCase().trim()
  if (!cleanSymbol) {
    const quota = getGuestSearchQuota()
    return { success: false, isCached: false, quota, reason: 'INVALID_SYMBOL' }
  }

  const currentQuota = getGuestSearchQuota()

  // 1. Check if already active in cache
  const isCached = currentQuota.activeSearches.some((item) => item.symbol === cleanSymbol)
  if (isCached) {
    return {
      success: true,
      isCached: true,
      quota: currentQuota,
      reason: 'CACHED',
    }
  }

  // 2. Check if quota limit reached
  if (currentQuota.hasReachedLimit) {
    return {
      success: false,
      isCached: false,
      quota: currentQuota,
      reason: 'LIMIT_REACHED',
    }
  }

  // 3. Record new search item
  const now = Date.now()
  const newItem: GuestSearchItem = {
    symbol: cleanSymbol,
    searchedAt: now,
    expiresAt: now + GUEST_SEARCH_TTL_MS,
  }

  const updatedSearches = [...currentQuota.activeSearches, newItem]

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUEST_QUOTA_STORAGE_KEY, JSON.stringify(updatedSearches))
      setCookie(GUEST_QUOTA_COOKIE_KEY, String(updatedSearches.length))
    }
  } catch (err) {
    console.warn('Unable to persist guest search quota to localStorage:', err)
  }

  const newCount = updatedSearches.length
  const remaining = Math.max(0, currentQuota.limit - newCount)
  const updatedQuota: GuestSearchQuota = {
    count: newCount,
    limit: currentQuota.limit,
    remaining,
    hasReachedLimit: remaining <= 0,
    activeSearches: updatedSearches,
  }

  notifyQuotaChange()

  return {
    success: true,
    isCached: false,
    quota: updatedQuota,
    reason: 'RECORDED',
  }
}

/**
 * Resets the guest search quota. Typically called when a guest account
 * is successfully converted to a permanent account or on logout.
 */
export function resetGuestSearchQuota(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(GUEST_QUOTA_STORAGE_KEY)
      deleteCookie(GUEST_QUOTA_COOKIE_KEY)
      notifyQuotaChange()
    }
  } catch (err) {
    console.warn('Failed to reset guest search quota:', err)
  }
}

/**
 * Subscribes to quota changes across tabs (storage event) and within the current tab (custom event).
 */
export function subscribeGuestQuota(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === GUEST_QUOTA_STORAGE_KEY) {
      callback()
    }
  }

  const handleCustom = () => {
    callback()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(GUEST_QUOTA_EVENT_NAME, handleCustom)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(GUEST_QUOTA_EVENT_NAME, handleCustom)
  }
}
