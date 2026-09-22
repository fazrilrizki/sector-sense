import { getAuthStatus } from '@/lib/auth/session';
import { GuestBanner } from '@/components/auth/guest-banner';
import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { HealthScoreWidget } from '@/components/dashboard/health-score';
import { SearchBar } from '@/components/dashboard/search-bar';
import { DividendTrapWidget } from '@/components/dashboard/dividend-trap-widget';
import { CorporateRadarWidget } from '@/components/dashboard/corporate-radar';

function EmptySymbolState({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 text-muted-foreground bg-muted/30">
      <Sparkles className="size-8 text-muted-foreground/50" />
      <p>{message}</p>
    </div>
  );
}

export default async function AnalyzerPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const symbol = typeof searchParams.symbol === 'string' ? searchParams.symbol : null;

  return (
    <div className="space-y-6">
      <GuestBanner />

      <section id="smart-analyzer" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Smart Analyzer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cari saham incaran Anda untuk melihat analisis fundamental dan perbandingannya dengan kompetitor.
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
                      Menarik data dan menghitung skor untuk {symbol}...
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
                      Menganalisis dividend trap...
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
                  Memuat Corporate Radar & Kalender Aksi Korporasi untuk {symbol}...
                </div>
              }
            >
              <CorporateRadarWidget symbol={symbol} />
            </React.Suspense>
          </div>
        ) : (
          <EmptySymbolState message="Mulai dengan mencari kode saham di atas." />
        )}
      </section>
    </div>
  );
}
