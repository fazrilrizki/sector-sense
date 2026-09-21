import { cn } from 'cn';
import type { DecisionMatrixResult } from '@/lib/services/decisionMatrix';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Row = DecisionMatrixResult['comparisonSnapshot']['rows'][number];

interface ComparisonTableProps {
  rows: Row[];
  rankings: DecisionMatrixResult['comparisonSnapshot']['rankings'];
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

interface MetricRowDef {
  label: string;
  key: string;
  getValue: (row: Row) => string;
  rankingKey: keyof DecisionMatrixResult['comparisonSnapshot']['rankings'];
}

const METRICS: MetricRowDef[] = [
  {
    label: 'Health Score',
    key: 'healthScore',
    getValue: (r) => fmt.score(r.healthScore),
    rankingKey: 'healthScore',
  },
  {
    label: 'PE Ratio',
    key: 'pe',
    getValue: (r) => fmt.num(r.valuation.pe),
    rankingKey: 'pe',
  },
  {
    label: 'PB Ratio',
    key: 'pb',
    getValue: (r) => fmt.num(r.valuation.pb),
    rankingKey: 'pe', // use same "cheapest valuation" concept
  },
  {
    label: 'Net Profit Margin',
    key: 'netMargin',
    getValue: (r) => fmt.pct(r.margins.netProfitMargin),
    rankingKey: 'netMargin',
  },
  {
    label: 'Operating Margin',
    key: 'opMargin',
    getValue: (r) => fmt.pct(r.margins.operatingMargin),
    rankingKey: 'netMargin',
  },
  {
    label: 'Revenue Growth YoY',
    key: 'growth',
    getValue: (r) => fmt.pct(r.dividendYield != null ? null : null), // placeholder
    rankingKey: 'revenueGrowth',
  },
  {
    label: 'Dividend Yield',
    key: 'divYield',
    getValue: (r) => fmt.pct(r.dividendYield),
    rankingKey: 'dividendYield',
  },
];

export function ComparisonTable({ rows, rankings }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Metrik</th>
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
          {/* Health Score */}
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground font-medium">Health Score</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.score(r.healthScore)}
                isTarget={r.isTarget}
                isBest={rankings.healthScore === r.ticker}
              />
            ))}
          </tr>

          {/* Valuation */}
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground">PE Ratio</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.num(r.valuation.pe)}
                isTarget={r.isTarget}
                isBest={rankings.pe === r.ticker}
              />
            ))}
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground">PB Ratio</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.num(r.valuation.pb)}
                isTarget={r.isTarget}
                isBest={false}
              />
            ))}
          </tr>

          {/* Margins */}
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground">Net Profit Margin</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.pct(r.margins.netProfitMargin)}
                isTarget={r.isTarget}
                isBest={rankings.netMargin === r.ticker}
              />
            ))}
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground">Operating Margin</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.pct(r.margins.operatingMargin)}
                isTarget={r.isTarget}
                isBest={false}
              />
            ))}
          </tr>

          {/* Dividend */}
          <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-muted-foreground">Dividend Yield</td>
            {rows.map((r) => (
              <Cell
                key={r.ticker}
                value={fmt.pct(r.dividendYield)}
                isTarget={r.isTarget}
                isBest={rankings.dividendYield === r.ticker}
              />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
