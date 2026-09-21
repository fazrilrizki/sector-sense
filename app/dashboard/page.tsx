import { getAuthStatus } from '@/lib/auth/session'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { GuestBanner } from '@/components/auth/guest-banner'
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Calendar,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { HealthScoreWidget } from '@/components/dashboard/health-score'
import { SearchBar } from '@/components/dashboard/search-bar'

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const symbol = typeof searchParams.symbol === 'string' ? searchParams.symbol : null
  const { role, state } = await getAuthStatus()
  const { user, profile, isGuest } = state

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col">
      {/* Guest Banner if active */}
      <GuestBanner />

      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground font-bold">
              SS
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">Sector Sense</h1>
              <p className="text-xs text-muted-foreground">Portfolio Simulation & AI Insights</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isGuest ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="size-3" />
                Pengguna Tamu
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="size-3" />
                Pengguna Terdaftar
              </span>
            )}

            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit" className="gap-1.5 cursor-pointer">
                <LogOut className="size-3.5" />
                <span>Keluar</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Welcome Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Selamat Datang, {profile?.full_name || (isGuest ? 'Pengguna Tamu' : 'Investor')}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isGuest
                ? 'Anda saat ini berada di lingkungan uji coba dengan sesi sementara.'
                : 'Akun Anda aktif dan seluruh simulasi tersimpan secara permanen.'}
            </p>
          </div>

          {isGuest && (
            <Link
              href="/register?upgrade=true"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 shadow-sm"
            >
              <Sparkles className="size-4" />
              <span>Simpan Akun Permanen</span>
            </Link>
          )}
        </div>

        {/* User Session Diagnostics Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              <User className="size-4" />
              <span>Identitas Pengguna</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ID Pengguna (UUID)</p>
              <p className="text-xs font-mono font-medium truncate" title={user?.id}>
                {user?.id || 'Tidak diketahui'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Role / Akses</p>
              <p className="text-sm font-semibold capitalize">{role}</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              <Mail className="size-4" />
              <span>Kontak & Kredensial</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Alamat Email</p>
              <p className="text-sm font-medium">
                {user?.email || (isGuest ? '(Akses Anonim / Tanpa Email)' : '-')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Provider Otentikasi</p>
              <p className="text-sm font-medium capitalize">
                {user?.app_metadata?.provider || (isGuest ? 'Anonymous' : 'Email/Password')}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              <Calendar className="size-4" />
              <span>Informasi Sesi</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dibuat Pada</p>
              <p className="text-sm font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status Proteksi Route</p>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="size-3.5" />
                Aktif via Next.js Proxy
              </span>
            </div>
          </div>
        </div>

        {/* Smart Analyzer Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight">Smart Analyzer</h2>
            <p className="text-sm text-muted-foreground">
              Cari saham incaran Anda untuk melihat analisis fundamental dan perbandingannya dengan kompetitor.
            </p>
          </div>
          
          <SearchBar />

          {symbol ? (
            <React.Suspense fallback={
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Menarik data dan menghitung skor untuk {symbol}...
              </div>
            } key={symbol}>
              <HealthScoreWidget symbol={symbol} />
            </React.Suspense>
          ) : (
            <div className="p-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground bg-zinc-50/50 dark:bg-zinc-950/50">
              <Sparkles className="size-8 text-zinc-400" />
              <p>Mulai dengan mencari kode saham di atas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
