'use client';

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/auth-provider'
import { useGuestSearchQuota } from '@/hooks/use-guest-quota'
import { SearchLimitModal } from '@/components/auth/search-limit-modal'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultSymbol = searchParams.get('symbol') || ''

  const { isGuest, isLoading: isAuthLoading } = useAuth()
  const {
    count,
    limit,
    remaining,
    hasReachedLimit,
    activeSearches,
    isLimitModalOpen,
    setIsLimitModalOpen,
    recordSearch,
    isCached,
  } = useGuestSearchQuota()

  const [symbol, setSymbol] = React.useState(defaultSymbol)

  // Sync state if searchParams change externally
  React.useEffect(() => {
    if (defaultSymbol) {
      setSymbol(defaultSymbol)
    }
  }, [defaultSymbol])

  const cleanSymbol = symbol.toUpperCase().trim()
  const isCurrentSymbolCached = isGuest && cleanSymbol ? isCached(cleanSymbol) : false

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cleanSymbol) return

    // 1. Permanent authenticated users have unlimited search
    if (!isGuest) {
      router.push(`/dashboard?symbol=${cleanSymbol}`)
      return
    }

    // 2. If the symbol is already active in guest cache, permit search without consuming quota
    if (isCurrentSymbolCached) {
      router.push(`/dashboard?symbol=${cleanSymbol}`)
      return
    }

    // 3. New symbol search for guest
    if (hasReachedLimit) {
      setIsLimitModalOpen(true)
      return
    }

    const result = recordSearch(cleanSymbol)
    if (result.success) {
      router.push(`/dashboard?symbol=${cleanSymbol}`)
    } else {
      setIsLimitModalOpen(true)
    }
  }

  return (
    <>
      <Card className="p-2 sm:p-2.5 border-primary/20 bg-primary/5 shadow-sm space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Ketik kode saham incaran (Misal: BBCA, TLKM, BMRI)..."
              className="pl-9 pr-3 border-none bg-white dark:bg-zinc-950 focus-visible:ring-1 uppercase font-medium placeholder:normal-case"
              maxLength={6}
            />
          </div>
          <Button
            type="submit"
            className="px-5 font-semibold cursor-pointer shrink-0 shadow-sm"
          >
            Analisis
          </Button>
        </form>

        {/* Guest Quota Indicator Bar */}
        {!isAuthLoading && isGuest && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 text-xs border-t border-primary/10">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status Kuota Tamu:</span>
              <Badge
                variant={
                  hasReachedLimit
                    ? 'destructive'
                    : remaining === 1
                      ? 'warning'
                      : 'success'
                }
                className="text-[11px] font-medium"
              >
                {hasReachedLimit ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    Limit Tercapai (0/{limit} emiten tersisa)
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3" />
                    {remaining} dari {limit} new stock searches remaining
                  </span>
                )}
              </Badge>
            </div>

            {/* Hint when typing an already cached symbol */}
            {isCurrentSymbolCached && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle className="size-3" />
                {cleanSymbol} tersimpan di cache (bebas kuota)
              </span>
            )}

            {/* Quick action to trigger modal or upgrade */}
            {hasReachedLimit && (
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Buka Limit Sekarang &rarr;
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Limit Modal */}
      {isGuest && (
        <SearchLimitModal
          open={isLimitModalOpen}
          onOpenChange={setIsLimitModalOpen}
          limit={limit}
          activeSearches={activeSearches}
        />
      )}
    </>
  )
}
