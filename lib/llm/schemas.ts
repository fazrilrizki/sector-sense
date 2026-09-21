import { z } from 'zod';

// ── Input ────────────────────────────────────────────────────────────────────

const FinancialScoreSchema = z.object({
  healthScore: z.number().min(0).max(10),
  profitability: z.number(),
  solvency: z.number(),
  liquidity: z.number(),
  growth: z.number(),
  dividendSustainability: z.number(),
});

export const AnalysisInputSchema = z.object({
  targetTicker: z.string().min(1).toUpperCase(),
  competitorTickers: z.array(z.string().min(1).toUpperCase()).min(1).max(3),
  financialScores: z.object({
    target: FinancialScoreSchema,
    competitors: z.array(FinancialScoreSchema.extend({ ticker: z.string().min(1) })),
  }),
  eventRisk: z.object({
    dividendTrapRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    estimatedPriceDropPct: z.number(),
    dividendYieldPct: z.number(),
  }),
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

// ── Output ───────────────────────────────────────────────────────────────────

const ThesisPointSchema = z.object({
  title: z.string(),
  description: z.string(),
  supportingMetric: z.string().optional(),
});

const CaseSchema = z.object({
  summary: z.string(),
  points: z.array(ThesisPointSchema).min(2).max(5),
  confidenceScore: z.number().min(0).max(1),
});

export const BullBearAnalysisOutputSchema = z.object({
  targetTicker: z.string(),
  analysisTimestamp: z.string().datetime(),
  bullCase: CaseSchema,
  bearCase: CaseSchema,
  recommendation: z.object({
    action: z.enum(['BUY', 'HOLD', 'SWITCH']),
    // OPTION_A = tetap ambil dividen target, OPTION_B = beralih ke kompetitor
    // Aligned dengan chosen_option_type enum di Supabase
    targetOption: z.enum(['OPTION_A', 'OPTION_B']),
    rationale: z.string(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  }),
  comparisonSummary: z.object({
    targetRank: z.number().int().min(1),
    strongestCompetitor: z.string().optional(),
    keyDifferentiator: z.string(),
  }),
});

export type BullBearAnalysisOutput = z.infer<typeof BullBearAnalysisOutputSchema>;
