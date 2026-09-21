import { cn } from 'cn';
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DecisionMatrixResult } from '@/lib/services/decisionMatrix';

interface DecisionCardsProps {
  optionA: DecisionMatrixResult['optionA'];
  optionB: DecisionMatrixResult['optionB'];
  recommended: 'OPTION_A' | 'OPTION_B';
  confidence: DecisionMatrixResult['confidence'];
  decisionFactors: DecisionMatrixResult['decisionFactors'];
  allocatedCapital: number;
}

const IDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const CONFIDENCE_LABEL: Record<DecisionMatrixResult['confidence'], string> = {
  HIGH: 'Keyakinan Tinggi',
  MEDIUM: 'Keyakinan Sedang',
  LOW: 'Keyakinan Rendah',
};

const CONFIDENCE_COLOR: Record<DecisionMatrixResult['confidence'], string> = {
  HIGH: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
};

function OptionCard({
  option,
  isRecommended,
  capital,
  tag,
}: {
  option: DecisionMatrixResult['optionA'];
  isRecommended: boolean;
  capital: number;
  tag: 'A' | 'B';
}) {
  const localPnL = Math.round((capital * option.projectedReturnPct) / 100);
  const positive = option.projectedReturnPct >= 0;

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all',
        isRecommended
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card',
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
            <CheckCircle className="size-3" />
            Rekomendasi
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 size-8 rounded-full flex items-center justify-center text-sm font-bold',
            isRecommended
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {tag}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Opsi {tag}
          </p>
          <h3 className="font-semibold text-foreground leading-tight">{option.label}</h3>
        </div>
      </div>

      {/* Projected PnL */}
      <div className="rounded-xl bg-muted/50 p-4 space-y-1">
        <p className="text-xs text-muted-foreground">Proyeksi Keuntungan</p>
        <p
          className={cn(
            'text-2xl font-bold tabular-nums',
            positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
          )}
        >
          {positive ? '+' : ''}{IDR.format(localPnL)}
        </p>
        <p className="text-xs text-muted-foreground">
          {positive ? '+' : ''}{option.projectedReturnPct.toFixed(2)}% dari modal
        </p>
      </div>

      {/* Justification */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alasan</p>
        <ul className="space-y-1.5">
          {option.justification.map((j, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <TrendingUp className="size-3.5 mt-0.5 text-emerald-500 shrink-0" />
              {j}
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      {option.risks.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risiko</p>
          <ul className="space-y-1">
            {option.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="size-3.5 mt-0.5 text-amber-500 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DecisionCards({
  optionA,
  optionB,
  recommended,
  confidence,
  decisionFactors,
  allocatedCapital,
}: DecisionCardsProps) {
  return (
    <div className="space-y-4">
      {/* Confidence + override notice */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            CONFIDENCE_COLOR[confidence],
          )}
        >
          <CheckCircle className="size-3" />
          {CONFIDENCE_LABEL[confidence]}
        </span>

        {decisionFactors.overrideApplied && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3" />
            Override matematis diterapkan
          </span>
        )}

        {decisionFactors.overrideReason && (
          <p className="text-xs text-muted-foreground w-full">
            <span className="font-medium">Alasan override:</span> {decisionFactors.overrideReason}
          </p>
        )}
      </div>

      {/* Cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionCard
          option={optionA}
          isRecommended={recommended === 'OPTION_A'}
          capital={allocatedCapital}
          tag="A"
        />
        <OptionCard
          option={optionB}
          isRecommended={recommended === 'OPTION_B'}
          capital={allocatedCapital}
          tag="B"
        />
      </div>
    </div>
  );
}
