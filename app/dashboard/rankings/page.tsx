import * as React from 'react';
import { RankingList } from '@/components/dashboard/ranking-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Rankings — Sector Sense',
};

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Market Movers & Rankings
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daftar peringkat emiten terbaik berdasarkan skor fundamental Sectors API.
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
