import { getAuthStatus } from '@/lib/auth/session';
import { GuestBanner } from '@/components/auth/guest-banner';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { HealthScoreWidget } from '@/components/dashboard/health-score';
import { SearchBar } from '@/components/dashboard/search-bar';
import { DividendTrapWidget } from '@/components/dashboard/dividend-trap-widget';
import { CorporateRadarWidget } from '@/components/dashboard/corporate-radar';
import { AnomalyScannerWidget } from '@/components/dashboard/anomaly-scanner-widget';
import { RankingList } from '@/components/dashboard/ranking-list';

function EmptySymbolState({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 text-muted-foreground bg-muted/30">
      <Sparkles className="size-8 text-muted-foreground/50" />
      <p>{message}</p>
    </div>
  );
}

export default async function OverviewDashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const symbol = typeof searchParams.symbol === 'string' ? searchParams.symbol : null;
  const { state } = await getAuthStatus();
  const { profile, isGuest } = state;

  return (
    <div className="space-y-6">
      <GuestBanner />

      {/* Welcome */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {profile?.full_name || (isGuest ? 'Guest User' : 'Investor')}!
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

      {/* Smart Analyzer */}
      <section id="smart-analyzer" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Smart Analyzer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search for your target stock to view fundamental analysis and compare with competitors.
          </p>
        </div>

        <SearchBar />

        {symbol ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <React.Suspense
                  key={`health-${symbol}`}
                  fallback={
                    <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                      Fetching data and calculating score for {symbol}...
                    </div>
                  }
                >
                  <HealthScoreWidget symbol={symbol} />
                </React.Suspense>
              </div>
              <div className="xl:col-span-1">
                <React.Suspense
                  key={`trap-${symbol}`}
                  fallback={
                    <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                      Analyzing dividend trap...
                    </div>
                  }
                >
                  <DividendTrapWidget symbol={symbol} />
                </React.Suspense>
              </div>
            </div>

            {/* Corporate Radar & Dividend Calendar Engine */}
            <React.Suspense
              key={`radar-${symbol}`}
              fallback={
                <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                  Memuat Corporate Radar & Dividend Calendar Aksi Korporasi untuk {symbol}...
                </div>
              }
            >
              <CorporateRadarWidget symbol={symbol} />
            </React.Suspense>
          </div>
        ) : (
          <EmptySymbolState message="Start by searching for a stock ticker above." />
        )}
      </section>

      {/* Market Anomaly Scanner */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Market Anomaly Scanner & Radar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pemindai otomatis dislokasi valuasi historis (Z-Score &gt;2σ), lonjakan rasio utang (DER), dan analisis forensik arus kas emiten.
          </p>
        </div>

        <React.Suspense
          key={`anomaly-${symbol || 'BBCA'}`}
          fallback={
            <div className="p-8 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
              Scanning market and corporate anomalies...
            </div>
          }
        >
          <AnomalyScannerWidget symbol={symbol} />
        </React.Suspense>
      </section>

      {/* Rankings */}
      <section id="rankings" className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Market Movers & Rankings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            List of top companies based on Sectors API fundamental scores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <React.Suspense
            fallback={
              <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Loading Top 5 Healthy Fundamentals...
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
                Loading Five-Star Dividends...
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
