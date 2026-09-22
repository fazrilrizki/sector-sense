import type { DecisionMatrixResult } from '@/lib/services/decisionMatrix';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = DecisionMatrixResult['comparisonSnapshot']['rows'][number];

interface ComparisonTableProps {
  rows: Row[];
  rankings: Record<string, string | null>;
}

const fmt = {
  pct: (v: number | null) => (v == null ? '–' : `${(v * 100).toFixed(1)}%`),
  num: (v: number | null, dp = 1) => (v == null ? '–' : v.toFixed(dp)),
  score: (v: number) => `${v}/10`,
};

function Cell({
  value,
  isTarget,
  isBest,
}: {
  value: string;
  isTarget: boolean;
  isBest: boolean;
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-sm text-right tabular-nums',
        isTarget && 'font-semibold',
        isBest && 'text-emerald-600 dark:text-emerald-400',
      )}
    >
      <span className="flex items-center justify-end gap-1">
        {isBest && <TrendingUp className="size-3 shrink-0" />}
        {value}
      </span>
    </td>
  );
}

interface MetricDef {
  label: string;
  getValue: (r: Row) => string;
  bestKey: string;
  isLast?: boolean;
}

const METRICS: MetricDef[] = [
  { label: 'Health Score',        getValue: (r) => fmt.score(r.healthScore),              bestKey: 'healthScore' },
  { label: 'PE Ratio',            getValue: (r) => fmt.num(r.valuation.pe),               bestKey: 'pe' },
  { label: 'PB Ratio',            getValue: (r) => fmt.num(r.valuation.pb),               bestKey: 'pe' },
  { label: 'Net Profit Margin',   getValue: (r) => fmt.pct(r.margins.netProfitMargin),    bestKey: 'netMargin' },
  { label: 'Operating Margin',    getValue: (r) => fmt.pct(r.margins.operatingMargin),    bestKey: 'netMargin' },
  { label: 'Revenue Growth YoY',  getValue: (r) => fmt.pct(r.revenueGrowthYoY),          bestKey: 'revenueGrowth' },
  { label: 'Dividend Yield',      getValue: (r) => fmt.pct(r.dividendYield),              bestKey: 'dividendYield', isLast: true },
];

export function ComparisonTable({ rows, rankings }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-44">Metrik</th>
            {rows.map((r) => (
              <th
                key={r.ticker}
                className={cn(
                  'px-4 py-3 text-right font-semibold',
                  r.isTarget ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <div className="flex flex-col items-end gap-0.5">
                  <span>{r.ticker}</span>
                  {r.isTarget && (
                    <span className="text-[10px] font-normal text-primary">Target</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => (
            <tr
              key={metric.label}
              className={cn(
                'hover:bg-muted/30 transition-colors',
                !metric.isLast && 'border-b border-border',
              )}
            >
              <td className="px-4 py-3 text-muted-foreground">{metric.label}</td>
              {rows.map((r) => (
                <Cell
                  key={r.ticker}
                  value={metric.getValue(r)}
                  isTarget={r.isTarget}
                  isBest={rankings[metric.bestKey] === r.ticker}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
