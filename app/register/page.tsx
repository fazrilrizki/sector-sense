'use client'

import React, { useState, useTransition, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { signUpWithEmail, upgradeGuestAccount } from '@/lib/auth/actions'
import { Shield, Lock, Mail, User, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password.')
      return
    }

    startTransition(async () => {
      if (isUpgrade) {
        // Upgrade existing guest account
        const result = await upgradeGuestAccount(formData)
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal meng-upgrade akun tamu.')
        } else {
          router.push(nextUrl)
          router.refresh()
        }
      } else {
        // Standard registration
        const result = await signUpWithEmail(formData)
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal mendaftar akun.')
        } else {
          setSuccessMessage(
            'Registrasi berhasil! Silakan periksa email Anda jika konfirmasi email diaktifkan, atau masuk menggunakan akun baru Anda.'
          )
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
            {isUpgrade ? 'Simpan Akun Permanen' : 'Daftar ke Sector Sense'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isUpgrade
              ? 'Konversi sesi tamu Anda menjadi akun permanen untuk mengamankan data simulasi & watchlist.'
              : 'Daftar untuk mengakses seluruh fitur simulasi dan analisis saham.'}
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5" htmlFor="fullName">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <User className="size-4" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Nama Anda"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

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
            <label className="block text-xs font-medium text-foreground mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5" htmlFor="confirmPassword">
              Konfirmasi Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Ulangi password"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-10 font-medium cursor-pointer">
            {isPending
              ? isUpgrade
                ? 'Mengamankan Akun...'
                : 'Mendaftarkan Akun...'
              : isUpgrade
                ? 'Simpan dan Jadikan Akun Permanen'
                : 'Daftar Sekarang'}
          </Button>
        </form>

        {!isUpgrade && (
          <>
            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
                  Atau daftar dengan
                </span>
              </div>
            </div>

            {/* OAuth */}
            <OAuthButtons nextUrl={nextUrl} />
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
