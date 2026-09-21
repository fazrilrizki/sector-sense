import { Redis } from '@upstash/redis';
import { calculateHealthScore } from './healthScore.ts';
import { getNormalizedFinancials } from './financials.ts';
import { sectors } from '../sectors/client.ts';
import { getMockComparisonMatrix } from './mock-comparison.ts';

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
};

const redis = getRedisClient();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ComparisonMetricRow {
  ticker: string;
  companyName: string;
  subSector: string;
  isTarget: boolean;

  healthScore: number;
  healthBreakdown: {
    profitability: { value: number | null; score: number };
    solvency: { value: number | null; score: number };
    liquidity: { value: number | null; score: number };
    growth: { value: number | null; score: number };
    dividend: { value: number | null; score: number };
  };

  valuation: {
    pe: number | null;
    pb: number | null;
    ps: number | null;
    evEbitda: number | null;
  };

  margins: {
    netProfitMargin: number | null;
    operatingMargin: number | null;
  };

  revenueGrowthYoY: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
}

export interface ComparisonMatrix {
  targetTicker: string;
  generatedAt: string;
  rows: ComparisonMetricRow[];
  rankings: {
    healthScore: string | null;
    pe: string | null;
    netMargin: string | null;
    revenueGrowth: string | null;
    dividendYield: string | null;
  };
}

export class ComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComparisonError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveMargins(
  financials: Awaited<ReturnType<typeof getNormalizedFinancials>>,
): ComparisonMetricRow['margins'] {
  const sorted = [...financials.quarterly].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latest = sorted[0];
  if (!latest) return { netProfitMargin: null, operatingMargin: null };

  const is = latest.incomeStatement as Record<string, number>;
  const revenue = is.revenue || is.net_interest_income || null;

  const netIncome = is.net_income ?? null;
  const operatingIncome = is.operating_income ?? null;

  return {
    netProfitMargin: revenue && netIncome != null ? netIncome / Math.abs(revenue) : null,
    operatingMargin: revenue && operatingIncome != null ? operatingIncome / Math.abs(revenue) : null,
  };
}

function computeRankings(rows: ComparisonMetricRow[]): ComparisonMatrix['rankings'] {
  const topBy = (
    getter: (r: ComparisonMetricRow) => number | null,
    lowerBetter = false,
  ): string | null => {
    const valid = rows.filter((r) => getter(r) != null);
    if (valid.length === 0) return null;
    return valid.reduce((best, r) => {
      const bv = getter(best) ?? 0;
      const rv = getter(r) ?? 0;
      return lowerBetter ? (rv < bv ? r : best) : rv > bv ? r : best;
    }).ticker;
  };

  return {
    healthScore: topBy((r) => r.healthScore),
    pe: topBy((r) => r.valuation.pe, true),
    netMargin: topBy((r) => r.margins.netProfitMargin),
    revenueGrowth: topBy((r) => r.revenueGrowthYoY),
    dividendYield: topBy((r) => r.dividendYield),
  };
}

// ── Main Service ──────────────────────────────────────────────────────────────

export async function getComparisonMatrix(
  targetTicker: string,
  competitorTickers: string[],
): Promise<ComparisonMatrix> {
  const target = targetTicker.toUpperCase().trim();
  const competitors = competitorTickers.map((t) => t.toUpperCase().trim()).slice(0, 3);

  if (competitors.length === 0) {
    throw new ComparisonError('At least 1 competitor ticker is required');
  }

  if (process.env.MOCK_API === 'true') {
    return getMockComparisonMatrix(target, competitors);
  }

  const cacheKey = `sectors:comparison:v1:${target}:${[...competitors].sort().join(',')}`;

  if (redis) {
    const cached = await redis.get<ComparisonMatrix>(cacheKey);
    if (cached) return cached;
  }

  const allTickers = [target, ...competitors];

  // Fetch all tickers in parallel
  const results = await Promise.allSettled(
    allTickers.map(async (ticker) => {
      const [healthResult, report, financials] = await Promise.all([
        calculateHealthScore(ticker),
        sectors.companies.getReport(ticker, { sections: 'valuation,overview,dividend' }),
        getNormalizedFinancials(ticker),
      ]);
      return { ticker, healthResult, report, financials };
    }),
  );

  const rows: ComparisonMetricRow[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const ticker = allTickers[i];

    if (result.status === 'rejected') {
      console.warn(`[comparison] Failed to fetch data for ${ticker}:`, result.reason);
      continue;
    }

    const { healthResult, report, financials } = result.value;
    const margins = deriveMargins(financials);
    const val = report.valuation ?? {};
    const div = report.dividend ?? {};

    rows.push({
      ticker,
      companyName: report.company_name ?? ticker,
      subSector: report.overview?.sub_sector ?? '',
      isTarget: ticker === target,

      healthScore: healthResult.totalScore,
      healthBreakdown: {
        profitability: {
          value: healthResult.breakdown.profitability.metricValue,
          score: healthResult.breakdown.profitability.score,
        },
        solvency: {
          value: healthResult.breakdown.solvency.metricValue,
          score: healthResult.breakdown.solvency.score,
        },
        liquidity: {
          value: healthResult.breakdown.liquidity.metricValue,
          score: healthResult.breakdown.liquidity.score,
        },
        growth: {
          value: healthResult.breakdown.growth.metricValue,
          score: healthResult.breakdown.growth.score,
        },
        dividend: {
          value: healthResult.breakdown.dividend.metricValue,
          score: healthResult.breakdown.dividend.score,
        },
      },

      valuation: {
        pe: val.pe ?? null,
        pb: val.pb ?? null,
        ps: val.ps ?? null,
        evEbitda: val.ev_ebitda ?? null,
      },

      margins,

      revenueGrowthYoY: healthResult.breakdown.growth.metricValue,
      dividendYield: healthResult.breakdown.dividend.metricValue,
      payoutRatio: div.payout_ratio ?? null,
    });
  }

  if (rows.length === 0) {
    throw new ComparisonError(`Failed to fetch data for all tickers: ${allTickers.join(', ')}`);
  }

  // Ensure target is first
  rows.sort((a, b) => (a.isTarget ? -1 : b.isTarget ? 1 : 0));

  const matrix: ComparisonMatrix = {
    targetTicker: target,
    generatedAt: new Date().toISOString(),
    rows,
    rankings: computeRankings(rows),
  };

  if (redis) {
    await redis.set(cacheKey, matrix, { ex: 21600 }); // 6 hours
  }

  return matrix;
}
