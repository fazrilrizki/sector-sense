'use client'

import React, { useState, useTransition, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { signInWithEmail, signInAsGuest } from '@/lib/auth/actions'
import { Shield, AlertCircle, Sparkles, CheckCircle2, Mail } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; registered?: string; email?: string }>
}) {
  const resolvedParams = use(searchParams)
  const nextUrl = resolvedParams.next || '/dashboard'
  const isRegisteredSuccess = resolvedParams.registered === 'true'
  const registeredEmail = resolvedParams.email || ''
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState<string | null>(
    resolvedParams.error === 'auth_callback_failed'
      ? 'Link verification or authentication failed. Please try logging in directly.'
      : null
  )
  const [isPending, startTransition] = useTransition()
  const [isGuestPending, startGuestTransition] = useTransition()

  const handleEmailSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    const formData = new FormData(e.currentTarget)
    formData.append('next', nextUrl)

    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to sign in. Check your email and password.')
      } else if (result.data?.redirectTo) {
        router.push(result.data.redirectTo)
        router.refresh()
      }
    })
  }

  const handleGuestSignIn = () => {
    setErrorMessage(null)
    startGuestTransition(async () => {
      const result = await signInAsGuest(nextUrl)
      if (result && !result.success) {
        setErrorMessage(result.error || 'Failed to create guest session.')
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black font-sans">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-2">
            <Shield className="size-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to Sector Sense
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-based stock strategy analysis & simulation platform
          </p>
        </div>

        {/* Registered Success Banner */}
        {isRegisteredSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Registration Successful!</span>
            </div>
            <p className="text-xs leading-relaxed">
              Tautan verifikasi akun telah dikirimkan ke{' '}
              <strong className="underline underline-offset-2">
                {registeredEmail || 'Your Email'}
              </strong>
              .
            </p>
            <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
              <Mail className="size-3.5 mt-0.5 shrink-0" />
              <span>
                Please open your inbox (or spam) and click the confirmation link to <strong>automatically sign in to the dashboard</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={registeredEmail}
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending || isGuestPending}
            className="w-full h-10 font-medium cursor-pointer"
          >
            {isPending ? 'Verifying...' : 'Sign in with Email'}
          </Button>
        </form>

        {/* Divider Guest Access */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
              Or Use Guest Access
            </span>
          </div>
        </div>

        {/* Guest Access Action */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || isGuestPending}
            onClick={handleGuestSignIn}
            className="w-full h-10 flex items-center justify-center gap-2 cursor-pointer border border-border"
          >
            <Sparkles className="size-4 text-amber-500" />
            <span>{isGuestPending ? 'Setting up Guest Access...' : 'Sign in as Guest'}</span>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Explore stock simulation features instantly without registration. Data can be saved anytime.
          </p>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Belum memiliki akun?{' '}
          <Link
            href={resolvedParams.next ? `/register?next=${encodeURIComponent(resolvedParams.next)}` : '/register'}
            className="font-medium text-primary hover:underline"
          >
            Register now
          </Link>
        </p>
      </div>
    </div>
  )
}
