import { GuestBanner } from '@/components/auth/guest-banner';
import * as React from 'react';
import { RankingList } from '@/components/dashboard/ranking-list';

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <GuestBanner />

      <section id="rankings" className="space-y-4">
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
              title="Top 5 Healthiest Fundamentals (Banking)"
              description="Based on the highest Financial Health Score in the banking sector."
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
              title="Top Five-Star Dividends (Banking)"
              description="Combination of strong fundamentals & high dividends in the banking sector."
            />
          </React.Suspense>
        </div>
      </section>
    </div>
  );
}
