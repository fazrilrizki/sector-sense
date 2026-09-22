'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from 'cn';
import type { BullBearAnalysisOutput } from '@/lib/llm/schemas';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BullBearTabsProps {
  bullCase: BullBearAnalysisOutput['bullCase'];
  bearCase: BullBearAnalysisOutput['bearCase'];
  targetTicker: string;
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Keyakinan</span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CasePanel({
  data,
  variant,
}: {
  data: BullBearAnalysisOutput['bullCase'] | BullBearAnalysisOutput['bearCase'];
  variant: 'bull' | 'bear';
}) {
  const isBull = variant === 'bull';

  return (
    <div className="space-y-4">
      <ConfidenceBar score={data.confidenceScore} />

      <p
        className={cn(
          'text-sm leading-relaxed p-4 rounded-xl border',
          isBull
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-200',
        )}
      >
        {data.summary}
      </p>

      <ul className="space-y-3">
        {data.points.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 shrink-0 size-5 rounded-full flex items-center justify-center',
                isBull
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400',
              )}
            >
              {isBull ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{point.title}</p>
              <p className="text-xs text-muted-foreground">{point.description}</p>
              {point.supportingMetric && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {point.supportingMetric}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BullBearTabs({ bullCase, bearCase, targetTicker }: BullBearTabsProps) {
  return (
    <Tabs defaultValue="bull">
      <TabsList>
        <TabsTrigger value="bull" className="gap-1.5">
          <TrendingUp className="size-3.5 text-emerald-500" />
          Bull Case
        </TabsTrigger>
        <TabsTrigger value="bear" className="gap-1.5">
          <TrendingDown className="size-3.5 text-red-500" />
          Bear Case
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bull">
        <CasePanel data={bullCase} variant="bull" />
      </TabsContent>
      <TabsContent value="bear">
        <CasePanel data={bearCase} variant="bear" />
      </TabsContent>
    </Tabs>
  );
}
