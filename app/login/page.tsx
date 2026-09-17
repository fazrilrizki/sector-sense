'use client'

import React, { useState, useTransition, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { signInWithEmail, signInAsGuest } from '@/lib/auth/actions'
import { UserCheck, Shield, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const resolvedParams = use(searchParams)
  const nextUrl = resolvedParams.next || '/dashboard'
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState<string | null>(
    resolvedParams.error === 'auth_callback_failed'
      ? 'Otentikasi pihak ketiga gagal. Silakan coba lagi.'
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
        setErrorMessage(result.error || 'Gagal masuk. Periksa email dan password Anda.')
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
        setErrorMessage(result.error || 'Gagal membuat sesi tamu.')
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
            Masuk ke Sector Sense
          </h2>
          <p className="text-sm text-muted-foreground">
            Platform analisis & simulasi strategi saham berbasis AI
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-foreground" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending || isGuestPending}
            className="w-full h-10 font-medium cursor-pointer"
          >
            {isPending ? 'Sedang Memverifikasi...' : 'Masuk dengan Email'}
          </Button>
        </form>

        {/* Divider OAuth */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons nextUrl={nextUrl} />

        {/* Divider Guest Access */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
              Akses Sementara
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
            <span>{isGuestPending ? 'Menyiapkan Akses Tamu...' : 'Masuk sebagai Pengguna Tamu'}</span>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground">
            Eksplorasi fitur simulasi saham langsung tanpa registrasi. Data dapat disimpan kapan saja.
          </p>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Belum memiliki akun?{' '}
          <Link
            href={resolvedParams.next ? `/register?next=${encodeURIComponent(resolvedParams.next)}` : '/register'}
            className="font-medium text-primary hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
