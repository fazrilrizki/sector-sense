'use client';

import { useState } from 'react';
import { ComparisonForm } from './comparison-form';
import { ComparisonTable } from './comparison-table';
import { DecisionCards } from './decision-cards';
import { BullBearTabs } from './bull-bear-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import type { DecisionMatrixResult } from '@/lib/services/decisionMatrix';

const IDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const DEFAULT_CAPITAL = 10_000_000;

export function ComparisonPanel({ initialCapital }: { initialCapital?: number }) {
  const defaultCap = initialCapital ?? DEFAULT_CAPITAL;
  const [result, setResult] = useState<DecisionMatrixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formatRupiah = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(raw, 10));
  };

  const [capital, setCapital] = useState(defaultCap);
  const [rawCapital, setRawCapital] = useState(formatRupiah(String(defaultCap)));

  const handleSubmit = async (targetTicker: string, competitorTickers: string[]) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/decision-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTicker, competitorTickers, allocatedCapital: capital }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Terjadi kesalahan. Coba lagi.');
        return;
      }

      setResult(data as DecisionMatrixResult);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setRawCapital(formatRupiah(raw));
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) setCapital(num);
    else setCapital(0);
  };

  return (
    <div className="space-y-8">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Head-to-Head Analyzer</CardTitle>
          <CardDescription>
            Bandingkan saham target dengan 1–3 kompetitor untuk mendapatkan rekomendasi keputusan berbasis data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Capital simulator input */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="capital">Modal Simulasi (IDR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  id="capital"
                  value={rawCapital}
                  onChange={handleCapitalChange}
                  placeholder="10.000.000"
                  className="font-mono pl-9"
                />
              </div>
            </div>
          </div>

          <ComparisonForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Section: Comparison Table */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">
                Komparasi: {result.targetTicker} vs Kompetitor
              </h2>
              <p className="text-sm text-muted-foreground">
                Metrik berwarna hijau = terbaik dalam grup ini.
              </p>
            </div>
            <ComparisonTable
              rows={result.comparisonSnapshot.rows}
              rankings={result.comparisonSnapshot.rankings}
            />
          </section>

          {/* Section: Decision Cards */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Rekomendasi Keputusan</h2>
              <p className="text-sm text-muted-foreground">
                Proyeksi berdasarkan modal {IDR.format(capital)}.
              </p>
            </div>
            <DecisionCards
              optionA={result.optionA}
              optionB={result.optionB}
              recommended={result.recommendedOption}
              confidence={result.confidence}
              decisionFactors={result.decisionFactors}
              allocatedCapital={capital}
            />
          </section>

          {/* Section: Bull/Bear Thesis */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Tesis Investasi</h2>
              <p className="text-sm text-muted-foreground">
                Sintesis AI skenario optimis dan pesimis untuk {result.targetTicker}.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <BullBearTabs
                  bullCase={result.analysis.bullCase}
                  bearCase={result.analysis.bearCase}
                  targetTicker={result.targetTicker}
                />
              </CardContent>
            </Card>
          </section>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground text-right">
            Analisis dihasilkan:{' '}
            {new Date(result.generatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      )}
    </div>
  );
}
