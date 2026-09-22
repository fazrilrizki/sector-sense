import { GuestBanner } from '@/components/auth/guest-banner';
import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { SearchBar } from '@/components/dashboard/search-bar';
import { CorporateRadarWidget } from '@/components/dashboard/corporate-radar';

function EmptySymbolState({ message }: { message: string }) {
  return (
    <div className="p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 text-muted-foreground bg-muted/30">
      <Sparkles className="size-8 text-muted-foreground/50" />
      <p>{message}</p>
    </div>
  );
}

export default async function RadarPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const symbol = typeof searchParams.symbol === 'string' ? searchParams.symbol : null;

  return (
    <div className="space-y-6">
      <GuestBanner />

      <section id="corporate-radar" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Corporate Radar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau aksi korporasi dan kalender dividen berdasarkan emiten yang dipilih.
          </p>
        </div>

        <SearchBar />

        {symbol ? (
          <React.Suspense
            key={`radar-only-${symbol}`}
            fallback={
              <div className="p-6 rounded-2xl border border-border h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Memuat Corporate Radar & Kalender Aksi Korporasi untuk {symbol}...
              </div>
            }
          >
            <CorporateRadarWidget symbol={symbol} />
          </React.Suspense>
        ) : (
          <EmptySymbolState message="Pilih kode saham untuk membuka Corporate Radar." />
        )}
      </section>
    </div>
  );
}
