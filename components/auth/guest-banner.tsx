'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useGuestSearchQuota } from '@/hooks/use-guest-quota'
import { Badge } from '@/components/ui/badge'

export function GuestBanner() {
  const { isGuest, isLoading } = useAuth()
  const { remaining, limit, hasReachedLimit } = useGuestSearchQuota()

  if (isLoading || !isGuest) {
    return null
  }

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Active Guest Access:</strong> Temporary session with free exploration quota.
          </span>
          <Badge
            variant={hasReachedLimit ? 'destructive' : 'warning'}
            className="text-[10px] py-0 px-2 font-medium"
          >
            {hasReachedLimit ? (
              'Limit 3/3 Tercapai'
            ) : (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-2.5" />
                Sisa Kuota: {remaining}/{limit}
              </span>
            )}
          </Badge>
        </div>

        <Link
          href="/register?upgrade=true"
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
        >
          <span>Save Permanent Account</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
