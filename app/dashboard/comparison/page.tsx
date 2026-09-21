import { ComparisonPanel } from '@/components/comparison/comparison-panel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Komparasi Saham — Sector Sense',
  description: 'Head-to-head perbandingan metrik emiten dan rekomendasi keputusan investasi.',
};

export default function ComparisonPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Komparasi Saham</h1>
        <p className="text-muted-foreground mt-1">
          Bandingkan emiten target dengan kompetitor dan dapatkan rekomendasi keputusan berbasis AI.
        </p>
      </div>
      <ComparisonPanel />
    </div>
  );
}
