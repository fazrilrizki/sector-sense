import { getAuthStatus } from '@/lib/auth/session';
import { GuestBanner } from '@/components/auth/guest-banner';
import { AnomalyScannerWidget } from '@/components/dashboard/anomaly-scanner-widget';
import { RankingList } from '@/components/dashboard/ranking-list';
import * as React from 'react';

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const symbol =
    typeof searchParams.symbol === 'string' ? searchParams.symbol : undefined;
  const { state } = await getAuthStatus();
  const { profile, isGuest } = state;

  return (
    <div className="space-y-6">
      <GuestBanner />

      {/* Welcome */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Selamat Datang,{' '}
            {profile?.full_name || (isGuest ? 'Pengguna Tamu' : 'Investor')}!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isGuest
              ? 'Anda saat ini berada di lingkungan uji coba dengan sesi sementara.'
              : 'Akun Anda aktif dan seluruh simulasi tersimpan secara permanen.'}
          </p>
        </div>
      </div>

      {/* Market Anomaly Scanner */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Market Anomaly Scanner & Radar
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pemindai otomatis dislokasi valuasi historis (Z-Score &gt;2σ),
            lonjakan rasio utang (DER), dan analisis forensik arus kas emiten.
          </p>
        </div>

        <React.Suspense
          key={`anomaly-${symbol ?? 'BBCA'}`}
          fallback={
            <div className="p-8 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
              Memindai anomali pasar dan emiten...
            </div>
          }
        >
          <AnomalyScannerWidget symbol={symbol ?? 'BBCA'} />
        </React.Suspense>
      </section>

      {/* Market Movers & Rankings */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Market Movers & Rankings
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daftar peringkat emiten terbaik berdasarkan skor fundamental
            Sectors API.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <React.Suspense
            fallback={
              <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Memuat Top 5 Fundamental Sehat...
              </div>
            }
          >
            <RankingList
              theme="health"
              subSector="banks"
              title="Top 5 Fundamental Paling Sehat (Perbankan)"
              description="Berdasarkan Skor Kesehatan Finansial tertinggi di sektor perbankan."
            />
          </React.Suspense>

          <React.Suspense
            fallback={
              <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Memuat Dividen Bintang Lima...
              </div>
            }
          >
            <RankingList
              theme="dividend"
              subSector="banks"
              title="Top Dividen Bintang Lima (Perbankan)"
              description="Kombinasi fundamental kuat & Dividen tinggi di sektor perbankan."
            />
          </React.Suspense>
        </div>
      </section>
    </div>
  );
}
