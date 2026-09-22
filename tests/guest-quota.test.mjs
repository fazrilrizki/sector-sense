import test from 'node:test'
import assert from 'node:assert/strict'

// Mock browser storage for Node.js environment
class MockLocalStorage {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

// Logic under test adapted for mockable storage
const DEFAULT_LIMIT = 3
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

function createQuotaManager(storage = new MockLocalStorage(), maxSearches = DEFAULT_LIMIT, ttlMs = DEFAULT_TTL_MS) {
  const STORAGE_KEY = 'sector_guest_search_quota'

  function getQuota(currentTime = Date.now()) {
    const raw = storage.getItem(STORAGE_KEY)
    let parsedSearches = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) parsedSearches = parsed
      } catch {
        parsedSearches = []
      }
    }

    // Filter expired
    const validSearches = parsedSearches.filter(
      (item) => item && typeof item.symbol === 'string' && item.expiresAt > currentTime
    )

    if (validSearches.length !== parsedSearches.length) {
      storage.setItem(STORAGE_KEY, JSON.stringify(validSearches))
    }

    const count = validSearches.length
    const remaining = Math.max(0, maxSearches - count)
    const hasReachedLimit = remaining <= 0

    return {
      count,
      limit: maxSearches,
      remaining,
      hasReachedLimit,
      activeSearches: validSearches,
    }
  }

  function isSymbolCached(symbol, currentTime = Date.now()) {
    if (!symbol) return false
    const clean = symbol.toUpperCase().trim()
    const { activeSearches } = getQuota(currentTime)
    return activeSearches.some((s) => s.symbol === clean)
  }

  function recordSearch(symbol, currentTime = Date.now()) {
    const clean = (symbol || '').toUpperCase().trim()
    if (!clean) {
      return { success: false, isCached: false, quota: getQuota(currentTime), reason: 'INVALID_SYMBOL' }
    }

    const current = getQuota(currentTime)

    // Check cached
    const alreadyCached = current.activeSearches.some((s) => s.symbol === clean)
    if (alreadyCached) {
      return { success: true, isCached: true, quota: current, reason: 'CACHED' }
    }

    // Check limit
    if (current.hasReachedLimit) {
      return { success: false, isCached: false, quota: current, reason: 'LIMIT_REACHED' }
    }

    // Record
    const newItem = {
      symbol: clean,
      searchedAt: currentTime,
      expiresAt: currentTime + ttlMs,
    }
    const updated = [...current.activeSearches, newItem]
    storage.setItem(STORAGE_KEY, JSON.stringify(updated))

    const newCount = updated.length
    const remaining = Math.max(0, maxSearches - newCount)
    const updatedQuota = {
      count: newCount,
      limit: maxSearches,
      remaining,
      hasReachedLimit: remaining <= 0,
      activeSearches: updated,
    }

    return { success: true, isCached: false, quota: updatedQuota, reason: 'RECORDED' }
  }

  function resetQuota() {
    storage.removeItem(STORAGE_KEY)
  }

  return { getQuota, isSymbolCached, recordSearch, resetQuota }
}

test('Guest Quota: initial quota is clean with 3 remaining', () => {
  const manager = createQuotaManager()
  const quota = manager.getQuota()

  assert.equal(quota.count, 0)
  assert.equal(quota.limit, 3)
  assert.equal(quota.remaining, 3)
  assert.equal(quota.hasReachedLimit, false)
  assert.deepEqual(quota.activeSearches, [])
})

test('Guest Quota: records 1st search and decrements remaining quota', () => {
  const manager = createQuotaManager()
  const result = manager.recordSearch('BBCA')

  assert.equal(result.success, true)
  assert.equal(result.isCached, false)
  assert.equal(result.reason, 'RECORDED')
  assert.equal(result.quota.count, 1)
  assert.equal(result.quota.remaining, 2)
  assert.equal(result.quota.hasReachedLimit, false)
  assert.equal(result.quota.activeSearches[0].symbol, 'BBCA')
})

test('Guest Quota: deduplicates repeat searches for the same symbol within active cache TTL', () => {
  const manager = createQuotaManager()
  const t0 = 1000000

  // 1st search
  manager.recordSearch('BBCA', t0)

  // 2nd search for BBCA (with spaces / lowercase) within TTL
  const repeatResult = manager.recordSearch('  bbca  ', t0 + 60000)

  assert.equal(repeatResult.success, true)
  assert.equal(repeatResult.isCached, true)
  assert.equal(repeatResult.reason, 'CACHED')
  // Quota must NOT decrement again
  assert.equal(repeatResult.quota.count, 1)
  assert.equal(repeatResult.quota.remaining, 2)
})

test('Guest Quota: reaches limit on 3rd unique search', () => {
  const manager = createQuotaManager()
  const t0 = 1000000

  manager.recordSearch('BBCA', t0)
  manager.recordSearch('TLKM', t0 + 1000)
  const thirdResult = manager.recordSearch('BMRI', t0 + 2000)

  assert.equal(thirdResult.success, true)
  assert.equal(thirdResult.isCached, false)
  assert.equal(thirdResult.quota.count, 3)
  assert.equal(thirdResult.quota.remaining, 0)
  assert.equal(thirdResult.quota.hasReachedLimit, true)
})

test('Guest Quota: permits viewing cached symbols even after limit is reached', () => {
  const manager = createQuotaManager()
  const t0 = 1000000

  manager.recordSearch('BBCA', t0)
  manager.recordSearch('TLKM', t0 + 1000)
  manager.recordSearch('BMRI', t0 + 2000)

  // Now quota is exhausted (0 remaining), but user re-searches 'BBCA'
  const cachedAccess = manager.recordSearch('BBCA', t0 + 3000)
  assert.equal(cachedAccess.success, true)
  assert.equal(cachedAccess.isCached, true)
  assert.equal(cachedAccess.reason, 'CACHED')
})

test('Guest Quota: blocks 4th new symbol when quota is exhausted', () => {
  const manager = createQuotaManager()
  const t0 = 1000000

  manager.recordSearch('BBCA', t0)
  manager.recordSearch('TLKM', t0 + 1000)
  manager.recordSearch('BMRI', t0 + 2000)

  // Attempt 4th unique symbol
  const fourthResult = manager.recordSearch('ASII', t0 + 3000)
  assert.equal(fourthResult.success, false)
  assert.equal(fourthResult.isCached, false)
  assert.equal(fourthResult.reason, 'LIMIT_REACHED')
  assert.equal(fourthResult.quota.remaining, 0)
  assert.equal(fourthResult.quota.hasReachedLimit, true)
})

test('Guest Quota: automatically frees up quota when cache TTL expires', () => {
  const manager = createQuotaManager(new MockLocalStorage(), 3, 3600000) // 1 hour TTL
  const t0 = 1000000

  manager.recordSearch('BBCA', t0)
  manager.recordSearch('TLKM', t0 + 1000)
  manager.recordSearch('BMRI', t0 + 2000)

  // Advance time past 1 hour (TTL expired)
  const tAfterExpiry = t0 + 4000000
  const quotaAfterExpiry = manager.getQuota(tAfterExpiry)

  assert.equal(quotaAfterExpiry.count, 0)
  assert.equal(quotaAfterExpiry.remaining, 3)
  assert.equal(quotaAfterExpiry.hasReachedLimit, false)

  // Now a new search is permitted again
  const newSearchResult = manager.recordSearch('ASII', tAfterExpiry)
  assert.equal(newSearchResult.success, true)
  assert.equal(newSearchResult.quota.count, 1)
})

test('Guest Quota: reset clears storage completely', () => {
  const manager = createQuotaManager()
  manager.recordSearch('BBCA')
  manager.recordSearch('TLKM')

  manager.resetQuota()
  const quota = manager.getQuota()

  assert.equal(quota.count, 0)
  assert.equal(quota.remaining, 3)
  assert.equal(quota.hasReachedLimit, false)
})
