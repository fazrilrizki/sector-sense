import type { BullBearAnalysisOutput } from '@/lib/llm/schemas';

export interface ComparisonMetricRowSnapshot {
  ticker: string;
  companyName: string;
  isTarget: boolean;
  healthScore: number;
  valuation: { pe: number | null; pb: number | null; ps: number | null; evEbitda: number | null };
  margins: { netProfitMargin: number | null; operatingMargin: number | null };
  dividendYield: number | null;
}

export interface DecisionOption {
  label: string;
  projectedReturnPct: number;
  justification: string[];
  risks: string[];
}

export interface DecisionMatrixResult {
  targetTicker: string;
  generatedAt: string;
  recommendedOption: 'OPTION_A' | 'OPTION_B';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  optionA: DecisionOption;
  optionB: DecisionOption;
  decisionFactors: {
    overrideApplied: boolean;
    overrideReason?: string;
    trapRisk?: 'HIGH' | 'MEDIUM' | 'LOW';
    netBenefitPct?: number;
  };
  analysis: BullBearAnalysisOutput;
  comparisonSnapshot: {
    targetTicker: string;
    rows: ComparisonMetricRowSnapshot[];
    rankings: {
      healthScore: string | null;
      pe: string | null;
      netMargin: string | null;
      revenueGrowth: string | null;
      dividendYield: string | null;
    };
  };
  simulationPayload?: Record<string, unknown>;
}
