import { getAuthStatus } from '@/lib/auth/session';
import { GuestBanner } from '@/components/auth/guest-banner';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SearchBar } from '@/components/dashboard/search-bar';
import { AnomalyScannerWidget } from '@/components/dashboard/anomaly-scanner-widget';

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

      {/* Market Anomaly Scanner */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Market Anomaly Scanner & Radar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated scanner for historical valuation dislocation (Z-Score &gt;2σ), debt ratio (DER) spikes, and cash flow forensic analysis.
          </p>
        </div>

        <SearchBar />

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
    </div>
  );
}
