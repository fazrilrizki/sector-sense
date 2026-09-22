import { getDividendTrapAnalysis } from './dividendTrap.ts';
import { generateResearch } from './research.ts';
import type { EventRiskInput } from './research.ts';
import type { ComparisonMetricRow } from './comparison.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export interface DecisionMatrixInput {
  targetTicker: string;
  competitorTickers: string[];
  allocatedCapital: number;
  riskTolerance?: RiskTolerance;
  eventRisk?: EventRiskInput;
}

interface OptionDetail {
  label: string;
  targetTicker: string;
  justification: string[];
  projectedPnL: number;
  projectedReturnPct: number;
  risks: string[];
}

export interface DecisionMatrixResult {
  targetTicker: string;
  generatedAt: string;

  recommendedOption: 'OPTION_A' | 'OPTION_B';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  optionA: OptionDetail;
  optionB: OptionDetail;

  decisionFactors: {
    trapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    netDividendBenefit: number;
    targetHealthScore: number;
    bestCompetitorHealthScore: number;
    llmRecommendation: 'OPTION_A' | 'OPTION_B';
    overrideApplied: boolean;
    overrideReason: string | null;
  };

  simulationPayload: {
    targetSymbol: string;
    competitorSymbol: string;
    chosenOption: 'OPTION_A' | 'OPTION_B';
    allocatedCapital: number;
    projectedPnl: number;
  };
}

// ── Decision rules ────────────────────────────────────────────────────────────

interface OverrideResult {
  forced: 'OPTION_A' | 'OPTION_B' | null;
  reason: string | null;
}

function applyDecisionRules(params: {
  llmOption: 'OPTION_A' | 'OPTION_B';
  trapProbability: number;
  netBenefitPct: number;
  trapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  targetHealthScore: number;
  bestCompetitorHealthScore: number;
  riskTolerance: RiskTolerance;
}): OverrideResult {
  const {
    trapProbability,
    netBenefitPct,
    trapRisk,
    targetHealthScore,
    bestCompetitorHealthScore,
    riskTolerance,
  } = params;

  // Hard overrides to OPTION_B
  if (netBenefitPct < 0) {
    return {
      forced: 'OPTION_B',
      reason: `Net dividend benefit is negative (${netBenefitPct.toFixed(2)}%) — collecting this dividend results in a net loss after ex-date price drop.`,
    };
  }

  if (trapProbability >= 0.85 && bestCompetitorHealthScore > targetHealthScore) {
    return {
      forced: 'OPTION_B',
      reason: `Trap probability ${(trapProbability * 100).toFixed(0)}% exceeds 85% threshold and a healthier competitor is available.`,
    };
  }

  if (riskTolerance === 'CONSERVATIVE' && trapRisk === 'HIGH') {
    return {
      forced: 'OPTION_B',
      reason: `Conservative risk profile is incompatible with HIGH dividend trap risk.`,
    };
  }

  // Soft override to OPTION_A
  if (trapRisk === 'LOW' && targetHealthScore >= bestCompetitorHealthScore) {
    return {
      forced: 'OPTION_A',
      reason: `Low trap risk combined with target health score (${targetHealthScore}) meeting or exceeding best competitor (${bestCompetitorHealthScore}).`,
    };
  }

  return { forced: null, reason: null };
}

// ── Confidence scoring ────────────────────────────────────────────────────────

function computeConfidence(
  finalOption: 'OPTION_A' | 'OPTION_B',
  llmOption: 'OPTION_A' | 'OPTION_B',
  overrideApplied: boolean,
  trapRisk: 'LOW' | 'MEDIUM' | 'HIGH',
): 'HIGH' | 'MEDIUM' | 'LOW' {
  const llmAgrees = finalOption === llmOption;

  if (!overrideApplied && llmAgrees && trapRisk !== 'MEDIUM') return 'HIGH';
  if (overrideApplied && !llmAgrees) return 'LOW';
  return 'MEDIUM';
}

// ── Option builders ───────────────────────────────────────────────────────────

function buildOptionA(params: {
  targetTicker: string;
  dividendYieldPct: number;
  estimatedPriceDropPct: number;
  netBenefitPct: number;
  allocatedCapital: number;
  trapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  nextExDate: string | null;
}): OptionDetail {
  const { targetTicker, dividendYieldPct, netBenefitPct, allocatedCapital, trapRisk, nextExDate } = params;

  const projectedReturnPct = netBenefitPct;
  const projectedPnL = Math.round((allocatedCapital * projectedReturnPct) / 100);

  const justification: string[] = [
    `Dividend yield of ${dividendYieldPct.toFixed(2)}% provides immediate income`,
    `Net benefit after estimated ex-date price drop: ${netBenefitPct.toFixed(2)}%`,
  ];

  if (nextExDate) {
    justification.push(`Upcoming ex-date: ${nextExDate} — position must be held before this date`);
  }

  if (trapRisk === 'LOW') {
    justification.push('Low dividend trap risk — historical ex-date behavior is favorable');
  }

  const risks: string[] = [
    `Estimated ${params.estimatedPriceDropPct.toFixed(2)}% price drop at ex-date`,
  ];

  if (trapRisk === 'HIGH') risks.push('High trap probability — actual drop may exceed dividend received');
  if (trapRisk === 'MEDIUM') risks.push('Moderate trap risk — monitor price action around ex-date');

  return {
    label: `Tetap Ambil Dividen ${targetTicker}`,
    targetTicker,
    justification,
    projectedPnL,
    projectedReturnPct: Math.round(projectedReturnPct * 100) / 100,
    risks,
  };
}

function buildOptionB(params: {
  bestCompetitor: ComparisonMetricRow;
  allocatedCapital: number;
  targetHealthScore: number;
}): OptionDetail {
  const { bestCompetitor, allocatedCapital, targetHealthScore } = params;
  const competitorYieldPct = (bestCompetitor.dividendYield ?? 0) * 100;
  const projectedReturnPct = competitorYieldPct;
  const projectedPnL = Math.round((allocatedCapital * projectedReturnPct) / 100);
  const healthDiff = bestCompetitor.healthScore - targetHealthScore;

  const justification: string[] = [
    `${bestCompetitor.companyName} (${bestCompetitor.ticker}) has a higher health score: ${bestCompetitor.healthScore}/10`,
    `Dividend yield: ${competitorYieldPct.toFixed(2)}% with lower estimated trap risk`,
  ];

  if (healthDiff > 0) {
    justification.push(
      `Health score advantage of +${healthDiff} point${healthDiff !== 1 ? 's' : ''} over target stock`,
    );
  }

  if (bestCompetitor.valuation.pe != null) {
    justification.push(`Potentially cheaper valuation: PE ${bestCompetitor.valuation.pe.toFixed(1)}x`);
  }

  const risks: string[] = [
    'Switching involves transaction costs and potential capital gains tax',
    'Competitor stock also subject to general market risk',
  ];

  if (competitorYieldPct < 1) {
    risks.push(`${bestCompetitor.ticker} has low or no dividend yield — return depends on capital appreciation`);
  }

  return {
    label: `Beralih ke ${bestCompetitor.ticker} (${bestCompetitor.companyName})`,
    targetTicker: bestCompetitor.ticker,
    justification,
    projectedPnL,
    projectedReturnPct: Math.round(projectedReturnPct * 100) / 100,
    risks,
  };
}

// ── Main service ──────────────────────────────────────────────────────────────

export async function getDecisionMatrix(input: DecisionMatrixInput): Promise<DecisionMatrixResult> {
  const target = input.targetTicker.toUpperCase().trim();
  const competitors = input.competitorTickers.map((t) => t.toUpperCase().trim()).slice(0, 3);
  const riskTolerance = input.riskTolerance ?? 'MODERATE';
  const allocatedCapital = input.allocatedCapital;

  // 1. Fetch TASK-11 (dividend trap) — use provided eventRisk if caller already has it
  const trapResult = await getDividendTrapAnalysis(target);

  const eventRisk: EventRiskInput = input.eventRisk ?? {
    dividendTrapRisk: trapResult.riskLevel,
    estimatedPriceDropPct: trapResult.estimatedPriceDropPct,
    dividendYieldPct: trapResult.dividendYieldPct,
  };

  // 2. Fetch TASK-14 (research = TASK-13 + TASK-05)
  const research = await generateResearch({ targetTicker: target, competitorTickers: competitors, eventRisk });

  const { analysis, comparisonSnapshot } = research;
  const llmOption = analysis.recommendation.targetOption;

  // 3. Find target and best competitor from snapshot
  const targetRow = comparisonSnapshot.rows.find((r) => r.isTarget);
  const competitorRows = comparisonSnapshot.rows.filter((r) => !r.isTarget);

  if (!targetRow || competitorRows.length === 0) {
    throw new Error('Comparison snapshot missing target or competitor rows');
  }

  // Best competitor = highest healthScore; tiebreak = highest dividendYield
  const bestCompetitor = competitorRows.reduce((best, r) => {
    if (r.healthScore > best.healthScore) return r;
    if (r.healthScore === best.healthScore && (r.dividendYield ?? 0) > (best.dividendYield ?? 0)) return r;
    return best;
  });

  // 4. Apply deterministic decision rules
  const override = applyDecisionRules({
    llmOption,
    trapProbability: trapResult.trapProbability,
    netBenefitPct: trapResult.netBenefitPct,
    trapRisk: trapResult.riskLevel,
    targetHealthScore: targetRow.healthScore,
    bestCompetitorHealthScore: bestCompetitor.healthScore,
    riskTolerance,
  });

  const recommendedOption = override.forced ?? llmOption;
  const overrideApplied = override.forced !== null;

  // 5. Build option details
  const optionA = buildOptionA({
    targetTicker: target,
    dividendYieldPct: trapResult.dividendYieldPct,
    estimatedPriceDropPct: trapResult.estimatedPriceDropPct,
    netBenefitPct: trapResult.netBenefitPct,
    allocatedCapital,
    trapRisk: trapResult.riskLevel,
    nextExDate: trapResult.nextEvent?.exDate ?? null,
  });

  // Build a full ComparisonMetricRow-compatible object for bestCompetitor
  const bestCompetitorRow: ComparisonMetricRow = {
    ticker: bestCompetitor.ticker,
    companyName: bestCompetitor.companyName,
    subSector: '',
    isTarget: false,
    healthScore: bestCompetitor.healthScore,
    healthBreakdown: {
      profitability: { value: null, score: 0 },
      solvency: { value: null, score: 0 },
      liquidity: { value: null, score: 0 },
      growth: { value: null, score: 0 },
      dividend: { value: bestCompetitor.dividendYield, score: 0 },
    },
    valuation: bestCompetitor.valuation,
    margins: bestCompetitor.margins,
    revenueGrowthYoY: null,
    dividendYield: bestCompetitor.dividendYield,
    payoutRatio: null,
  };

  const optionB = buildOptionB({
    bestCompetitor: bestCompetitorRow,
    allocatedCapital,
    targetHealthScore: targetRow.healthScore,
  });

  // 6. Confidence
  const confidence = computeConfidence(recommendedOption, llmOption, overrideApplied, trapResult.riskLevel);

  // 7. Projected PnL for chosen option (for simulationPayload)
  const chosenPnL = recommendedOption === 'OPTION_A' ? optionA.projectedPnL : optionB.projectedPnL;

  return {
    targetTicker: target,
    generatedAt: new Date().toISOString(),
    recommendedOption,
    confidence,
    optionA,
    optionB,
    decisionFactors: {
      trapRisk: trapResult.riskLevel,
      netDividendBenefit: trapResult.netBenefitPct,
      targetHealthScore: targetRow.healthScore,
      bestCompetitorHealthScore: bestCompetitor.healthScore,
      llmRecommendation: llmOption,
      overrideApplied,
      overrideReason: override.reason,
    },
    simulationPayload: {
      targetSymbol: target,
      competitorSymbol: bestCompetitor.ticker,
      chosenOption: recommendedOption,
      allocatedCapital,
      projectedPnl: chosenPnL,
    },
  };
}
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
