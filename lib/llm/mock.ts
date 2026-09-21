import type { BullBearAnalysisOutput } from './schemas.ts';
import type { AnalysisInput } from './schemas.ts';

export function getMockAnalysis(input: AnalysisInput): BullBearAnalysisOutput {
  const strongestCompetitor = input.competitorTickers[0];

  return {
    targetTicker: input.targetTicker,
    analysisTimestamp: new Date().toISOString(),
    bullCase: {
      summary: `${input.targetTicker} demonstrates strong fundamentals with a health score of ${input.financialScores.target.healthScore.toFixed(1)}/10, supported by consistent dividend history and solid liquidity position.`,
      points: [
        {
          title: 'Strong Dividend Sustainability',
          description: `Dividend yield of ${input.eventRisk.dividendYieldPct.toFixed(2)}% is backed by healthy cash flow generation, indicating sustainable payout capacity.`,
          supportingMetric: `Dividend Sustainability Score: ${input.financialScores.target.dividendSustainability.toFixed(2)}`,
        },
        {
          title: 'Solid Profitability Metrics',
          description: `Above-average profitability score indicates efficient capital deployment and pricing power within its sector.`,
          supportingMetric: `Profitability Score: ${input.financialScores.target.profitability.toFixed(2)}`,
        },
        {
          title: 'Manageable Solvency Risk',
          description: `Debt structure remains within safe thresholds, reducing risk of financial distress even in adverse market conditions.`,
          supportingMetric: `Solvency Score: ${input.financialScores.target.solvency.toFixed(2)}`,
        },
      ],
      confidenceScore: 0.72,
    },
    bearCase: {
      summary: `Dividend trap risk rated ${input.eventRisk.dividendTrapRisk} — estimated ${input.eventRisk.estimatedPriceDropPct.toFixed(2)}% price decline at ex-date may offset ${input.eventRisk.dividendYieldPct.toFixed(2)}% yield, eroding net returns.`,
      points: [
        {
          title: 'Dividend Trap Risk',
          description: `Historical ex-date price behavior suggests the stock may drop by more than the dividend payout, resulting in a negative net position for short-term holders.`,
          supportingMetric: `Net Dividend Benefit: ${(input.eventRisk.dividendYieldPct - input.eventRisk.estimatedPriceDropPct).toFixed(2)}%`,
        },
        {
          title: 'Limited Growth Trajectory',
          description: `Growth score is below sector median, suggesting slower earnings expansion compared to peers.`,
          supportingMetric: `Growth Score: ${input.financialScores.target.growth.toFixed(2)}`,
        },
      ],
      confidenceScore: 0.58,
    },
    recommendation: {
      action: input.eventRisk.dividendTrapRisk === 'HIGH' ? 'SWITCH' : 'HOLD',
      targetOption: input.eventRisk.dividendTrapRisk === 'HIGH' ? 'OPTION_B' : 'OPTION_A',
      rationale:
        input.eventRisk.dividendTrapRisk === 'HIGH'
          ? `High dividend trap risk combined with a negative net dividend benefit of ${(input.eventRisk.dividendYieldPct - input.eventRisk.estimatedPriceDropPct).toFixed(2)}% warrants switching to a stronger peer.`
          : `Despite moderate risk, the overall financial health score of ${input.financialScores.target.healthScore.toFixed(1)} supports holding the position through the dividend cycle.`,
      riskLevel: input.eventRisk.dividendTrapRisk,
    },
    comparisonSummary: {
      targetRank: 1,
      strongestCompetitor,
      keyDifferentiator: `${input.targetTicker} leads on dividend sustainability while ${strongestCompetitor ?? 'competitors'} show stronger growth metrics.`,
    },
  };
}
