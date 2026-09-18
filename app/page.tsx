import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { getAuthStatus } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const { role, state } = await getAuthStatus()
  const { isGuest, isAuthenticated } = state

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground font-black text-sm">
              SS
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Sector Sense</span>
          </div>

          <nav className="flex items-center gap-3">
            {isAuthenticated || isGuest ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="size-3.5" />
          <span>Sistem Otentikasi & Proteksi Rute Aktif</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
          Analisis Sektor & Simulasi Strategi Saham Berbasis AI
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          Didukung otentikasi aman Supabase Auth, proteksi Next.js Proxy, serta Guest Access Session untuk uji coba instan tanpa registrasi awal.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-sm transition-all"
            >
              <span>Akses Dashboard Saya</span>
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-sm transition-all"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-foreground"
              >
                <Sparkles className="size-4 text-amber-500" />
                <span>Coba Akses Tamu (Guest)</span>
              </Link>
            </>
          )}
        </div>

        {/* Status Box */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 w-full max-w-md text-left text-xs space-y-1.5 shadow-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status Sesi Anda:</span>
            <span className="font-semibold capitalize text-foreground">{role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Engine Otentikasi:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Supabase Auth SSR + Next.js 16 Proxy
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
