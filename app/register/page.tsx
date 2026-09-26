'use client'

import React, { useState, useTransition, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { signUpWithEmail, upgradeGuestAccount } from '@/lib/auth/actions'
import { Shield, AlertCircle, Sparkles } from 'lucide-react'

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; upgrade?: string }>
}) {
  const resolvedParams = use(searchParams)
  const isUpgrade = resolvedParams.upgrade === 'true'
  const nextUrl = resolvedParams.next || '/dashboard'
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match the password.')
      return
    }

    startTransition(async () => {
      if (isUpgrade) {
        // Upgrade existing guest account
        const result = await upgradeGuestAccount(formData)
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to upgrade guest account.')
        } else {
          router.push(nextUrl)
          router.refresh()
        }
      } else {
        // Standard registration
        const result = await signUpWithEmail(formData)
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to register account.')
        } else {
          // Redirect to login page with clear instructions and pre-filled email
          router.push(`/login?registered=true&email=${encodeURIComponent(email)}`)
        }
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black font-sans">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-2">
            {isUpgrade ? <Sparkles className="size-6 text-amber-500" /> : <Shield className="size-6" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isUpgrade ? 'Save Permanent Account' : 'Register to Sector Sense'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isUpgrade
              ? 'Convert your guest session to a permanent account to secure your simulation data & watchlist.'
              : 'Register to access all stock simulation and analysis features.'}
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder="Repeat password"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-10 font-medium cursor-pointer">
            {isPending
              ? isUpgrade
                ? 'Securing Account...'
                : 'Registering Account...'
              : isUpgrade
                ? 'Save and Make Account Permanent'
                : 'Register Now'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
