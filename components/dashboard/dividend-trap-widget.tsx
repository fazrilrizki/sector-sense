import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import mockData from '@/lib/data/mock-forecasting.json';
import { AlertTriangle, ShieldCheck, TrendingDown, Info } from 'lucide-react';

export function DividendTrapWidget({ symbol }: { symbol: string }) {
  // Use mock data if available, else show a default "No upcoming dividend" state
  const data = (mockData as any)[symbol];

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
            Dividend Trap Detector
          </CardTitle>
          <CardDescription>Simulasi Jebakan Harga Jelang Ex-Date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
            <Info className="w-8 h-8 text-zinc-300" />
            <p className="text-sm text-muted-foreground">
              Tidak ada jadwal pembagian dividen dalam waktu dekat untuk <strong>{symbol}</strong>, atau data simulasi belum tersedia di *mockup*.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isTrap = data.verdict === 'DIVIDEND_TRAP';
  const isSafe = data.verdict === 'SAFE';

  return (
    <Card className={`h-full border-l-4 ${isTrap ? 'border-l-red-500' : isSafe ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTrap ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : isSafe ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-amber-500" />
            )}
            Dividend Trap Detector
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isTrap ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : isSafe ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
            {data.verdict}
          </span>
        </CardTitle>
        <CardDescription>Proyeksi pergerakan harga vs nilai dividen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Dividend Info */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900">
          <div>
            <p className="text-xs text-muted-foreground">Proyeksi Dividen</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{data.upcoming_dividend.yield_percent}%</p>
            <p className="text-xs">Rp {data.upcoming_dividend.amount_idr} / lembar</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Historis Drop Ex-Date</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{data.historical_analysis.avg_price_drop_ex_date_percent}%</p>
            <p className="text-xs">Peluang anjlok: {(data.historical_analysis.trap_probability * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* AI Synthesis */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Rekomendasi AI (Synthesized)
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
            {data.recommendation}
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
