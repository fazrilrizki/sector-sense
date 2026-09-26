'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sparkles, ShieldCheck, TrendingUp, Database, ArrowRight, Lock, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GuestSearchItem } from '@/lib/auth/guest-quota'

interface SearchLimitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limit: number
  activeSearches?: GuestSearchItem[]
}

export function SearchLimitModal({
  open,
  onOpenChange,
  limit = 3,
  activeSearches = [],
}: SearchLimitModalProps) {
  const cachedSymbols = activeSearches.map((s) => s.symbol)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:p-7">
        <DialogHeader className="gap-2 text-center items-center pb-2">
          {/* Visual Icon Badge */}
          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <Lock className="size-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Search Limit Reached
              </DialogTitle>
              <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
                {limit}/{limit} Kuota
              </Badge>
            </div>
            <DialogDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
              You have used all {limit} search quotas for new stocks in this guest session.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Cached symbols notice if available */}
        {cachedSymbols.length > 0 && (
          <div className="my-2 p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Check className="size-3.5 text-emerald-500 shrink-0" />
              <span>Stocks you have already searched (Active Cache):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {cachedSymbols.map((sym) => (
                <Link
                  key={sym}
                  href={`/dashboard?symbol=${sym}`}
                  onClick={() => onOpenChange(false)}
                  className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-mono font-semibold text-[11px] hover:border-primary hover:text-primary transition-colors"
                >
                  {sym}
                </Link>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/80 pt-0.5">
              You can reopen the stocks above for free without reducing your quota.
            </p>
          </div>
        )}

        {/* Value Proposition Box */}
        <div className="my-3 p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            Register a Free Account to Unlock Access:
          </p>
          <ul className="space-y-2.5 text-xs text-foreground/90">
            <li className="flex items-start gap-2">
              <Sparkles className="size-3.5 mt-0.5 text-amber-500 shrink-0" />
              <span>
                <strong>Unlimited Search</strong> — Analyze hundreds of IHSG stocks without limits.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="size-3.5 mt-0.5 text-blue-500 shrink-0" />
              <span>
                <strong>Market Anomaly Radar</strong> — Deteksi lonjakan rasio utang & anomali valuasi mendalam.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-3.5 mt-0.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Dividend Trap Detection</strong> — Sustainable dividend forensics & corporate health score.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Database className="size-3.5 mt-0.5 text-indigo-500 shrink-0" />
              <span>
                <strong>Save Data Permanently</strong> — Watchlists & simulations saved securely without loss.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-col gap-2 sm:flex-col pt-2">
          <Link
            href="/register?upgrade=true"
            onClick={() => onOpenChange(false)}
            className={buttonVariants({
              variant: 'default',
              size: 'lg',
              className: 'w-full font-semibold shadow-sm cursor-pointer justify-center',
            })}
          >
            <Sparkles className="size-4 text-amber-400" />
            <span>Register Free Account Now</span>
            <ArrowRight className="size-4 ml-auto" />
          </Link>

          <div className="flex items-center justify-between gap-2 pt-1 w-full">
            <Link
              href="/login"
              onClick={() => onOpenChange(false)}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'flex-1 text-xs cursor-pointer text-muted-foreground hover:text-foreground',
              })}
            >
              Already have an account? Sign in
            </Link>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'text-xs text-muted-foreground hover:text-foreground cursor-pointer px-3',
              })}
            >
              Close
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
