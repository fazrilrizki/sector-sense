import { Redis } from '@upstash/redis';
import { getComparisonMatrix } from './comparison.ts';
import type { ComparisonMetricRow } from './comparison.ts';
import { generateBullBearAnalysis } from '../llm/index.ts';
import type { AnalysisInput, BullBearAnalysisOutput } from '../llm/schemas.ts';

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
};

const redis = getRedisClient();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EventRiskInput {
  dividendTrapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedPriceDropPct: number;
  dividendYieldPct: number;
}

export interface GenerateResearchInput {
  targetTicker: string;
  competitorTickers: string[];
  eventRisk?: EventRiskInput;
}

export interface ResearchResult {
  analysis: BullBearAnalysisOutput;
  comparisonSnapshot: {
    targetTicker: string;
    rows: Pick<
      ComparisonMetricRow,
      'ticker' | 'companyName' | 'healthScore' | 'valuation' | 'margins' | 'dividendYield' | 'revenueGrowthYoY' | 'isTarget'
    >[];
    rankings: Record<string, string | null>;
  };
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function rowToFinancialScore(row: ComparisonMetricRow) {
  const bd = row.healthBreakdown;

  // Use raw metric values when available; normalize score (0-2) to (0-1) as fallback
  const normalize = (val: number | null, score: number) =>
    val != null && !isNaN(val) ? val : score / 2;

  return {
    healthScore: row.healthScore,
    profitability: normalize(bd.profitability.value, bd.profitability.score),
    solvency: normalize(bd.solvency.value, bd.solvency.score),
    liquidity: normalize(bd.liquidity.value, bd.liquidity.score),
    growth: normalize(bd.growth.value, bd.growth.score),
    dividendSustainability: normalize(bd.dividend.value, bd.dividend.score),
  };
}

function deriveEventRisk(targetRow: ComparisonMetricRow): EventRiskInput {
  const yieldPct = (targetRow.dividendYield ?? 0) * 100;
  // Conservative placeholder: assume price drop = 80% of dividend yield
  const estimatedDrop = yieldPct * 0.8;
  const netBenefit = yieldPct - estimatedDrop;

  let dividendTrapRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  if (netBenefit <= 0) {
    dividendTrapRisk = 'HIGH';
  } else if (estimatedDrop > yieldPct * 0.6) {
    dividendTrapRisk = 'MEDIUM';
  } else {
    dividendTrapRisk = 'LOW';
  }

  return {
    dividendTrapRisk,
    estimatedPriceDropPct: estimatedDrop,
    dividendYieldPct: yieldPct,
  };
}

function buildAnalysisInput(
  matrix: Awaited<ReturnType<typeof getComparisonMatrix>>,
  eventRisk?: EventRiskInput,
): AnalysisInput {
  const targetRow = matrix.rows.find((r) => r.isTarget);
  if (!targetRow) throw new Error(`Target ticker not found in comparison matrix rows`);

  const competitorRows = matrix.rows.filter((r) => !r.isTarget);

  return {
    targetTicker: matrix.targetTicker,
    competitorTickers: competitorRows.map((r) => r.ticker),
    financialScores: {
      target: rowToFinancialScore(targetRow),
      competitors: competitorRows.map((r) => ({
        ticker: r.ticker,
        ...rowToFinancialScore(r),
      })),
    },
    eventRisk: eventRisk ?? deriveEventRisk(targetRow),
  };
}

// ── Main Service ──────────────────────────────────────────────────────────────

export async function generateResearch(input: GenerateResearchInput): Promise<ResearchResult> {
  const target = input.targetTicker.toUpperCase().trim();
  const competitors = input.competitorTickers.map((t) => t.toUpperCase().trim()).slice(0, 3);

  const cacheKey = `sectors:research:v1:${target}:${[...competitors].sort().join(',')}`;

  if (redis && process.env.MOCK_API !== 'true') {
    const cached = await redis.get<ResearchResult>(cacheKey);
    if (cached) return cached;
  }

  // 1. Get comparison matrix (TASK-13)
  const matrix = await getComparisonMatrix(target, competitors);

  // 2. Map to LLM input (TASK-05 contract)
  const analysisInput = buildAnalysisInput(matrix, input.eventRisk);

  // 3. Generate Bull/Bear analysis (TASK-05)
  const analysis = await generateBullBearAnalysis(analysisInput);

  // 4. Build result with comparison snapshot for frontend use
  const result: ResearchResult = {
    analysis,
    comparisonSnapshot: {
      targetTicker: matrix.targetTicker,
      rows: matrix.rows.map((r) => ({
        ticker: r.ticker,
        companyName: r.companyName,
        healthScore: r.healthScore,
        valuation: r.valuation,
        margins: r.margins,
        dividendYield: r.dividendYield,
        revenueGrowthYoY: r.revenueGrowthYoY,
        isTarget: r.isTarget,
      })),
      rankings: matrix.rankings,
    },
  };

  if (redis && process.env.MOCK_API !== 'true') {
    await redis.set(cacheKey, result, { ex: 3600 }); // 1 hour
  }

  return result;
}
