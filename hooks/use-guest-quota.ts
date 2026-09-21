'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getGuestSearchQuota,
  recordGuestSearch,
  resetGuestSearchQuota,
  subscribeGuestQuota,
  isSymbolCachedForGuest,
  type GuestSearchQuota,
  type RecordSearchResult,
} from '@/lib/auth/guest-quota'

export function useGuestSearchQuota() {
  const [quota, setQuota] = useState<GuestSearchQuota>(() => getGuestSearchQuota())
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)

  const refreshQuota = useCallback(() => {
    setQuota(getGuestSearchQuota())
  }, [])

  useEffect(() => {
    // Initial sync on mount
    refreshQuota()
    // Subscribe to cross-component and cross-tab storage changes
    return subscribeGuestQuota(refreshQuota)
  }, [refreshQuota])

  const recordSearch = useCallback((symbol: string): RecordSearchResult => {
    const result = recordGuestSearch(symbol)
    setQuota(result.quota)
    if (result.reason === 'LIMIT_REACHED') {
      setIsLimitModalOpen(true)
    }
    return result
  }, [])

  const isCached = useCallback((symbol: string) => {
    return isSymbolCachedForGuest(symbol)
  }, [])

  const resetQuota = useCallback(() => {
    resetGuestSearchQuota()
    refreshQuota()
  }, [refreshQuota])

  return {
    ...quota,
    isLimitModalOpen,
    setIsLimitModalOpen,
    recordSearch,
    isCached,
    resetQuota,
    refreshQuota,
  }
}
