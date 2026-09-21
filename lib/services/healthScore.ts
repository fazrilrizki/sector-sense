import { sectors } from '../sectors/client.ts';
import { getNormalizedFinancials, NormalizedFinancialData } from './financials.ts';
import { Redis } from '@upstash/redis';

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Redis cache will be bypassed.');
    return null;
  }
  return new Redis({ url, token });
};

const redis = getRedisClient();

export interface HealthScoreResult {
  symbol: string;
  totalScore: number; // 0-10
  breakdown: {
    profitability: { metricValue: number | null; score: number; label: string };
    solvency: { metricValue: number | null; score: number; label: string };
    liquidity: { metricValue: number | null; score: number; label: string };
    growth: { metricValue: number | null; score: number; label: string };
    dividend: { metricValue: number | null; score: number; label: string };
  };
}

interface ExtractedMetrics {
  roe: number | null;
  der: number | null;
  currentRatio: number | null;
  revenueGrowth: number | null;
  dividendYield: number | null;
}

/**
 * Extracts latest metrics from normalized financials and company report.
 */
function extractMetrics(
  financials: NormalizedFinancialData,
  dividendYieldFromReport?: number | null
): ExtractedMetrics {
  const qData = financials.quarterly;
  if (!qData || qData.length === 0) {
    return { roe: null, der: null, currentRatio: null, revenueGrowth: null, dividendYield: dividendYieldFromReport || null };
  }

  // Sort by date descending (latest first)
  const sortedQ = [...qData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sortedQ[0];
  const previousYear = sortedQ.find(q => q.year === latest.year - 1 && q.quarter === latest.quarter) || sortedQ[4]; // rough approx for YoY

  const bs = latest.balanceSheet as Record<string, number>;
  const is = latest.incomeStatement as Record<string, number>;

  const metrics = latest.metrics as Record<string, number>;

  // ROE = Net Income / Total Equity
  let roe: number | null = null;
  const netIncome = is.net_income ?? metrics.earnings;
  if (netIncome && bs.total_equity) {
    roe = netIncome / bs.total_equity;
  }

  // DER = Total Liabilities / Total Equity
  let der: number | null = null;
  if (bs.total_liabilities && bs.total_equity) {
    der = bs.total_liabilities / bs.total_equity;
  }

  // Current Ratio = Total Assets / Total Liabilities (Approximation since Sectors API might not split current/non-current assets)
  let currentRatio: number | null = null;
  if (bs.total_assets && bs.total_liabilities) {
    currentRatio = bs.total_assets / bs.total_liabilities;
  }

  // Revenue Growth YoY
  let revenueGrowth: number | null = null;
  if (is.revenue && previousYear) {
    const prevIs = previousYear.incomeStatement as Record<string, number>;
    if (prevIs.revenue && prevIs.revenue !== 0) {
      revenueGrowth = (is.revenue - prevIs.revenue) / Math.abs(prevIs.revenue);
    }
  }

  return {
    roe,
    der,
    currentRatio,
    revenueGrowth,
    dividendYield: dividendYieldFromReport || null,
  };
}

/**
 * Calculates score 0-2 based on percentile.
 * For DER, lower is better. For others, higher is better.
 */
function getScore(value: number | null, peerValues: (number | null)[], isLowerBetter: boolean = false): number {
  if (value === null) return 0; // Penalize missing data

  const validPeers = peerValues.filter((v): v is number => v !== null && !isNaN(v));
  if (validPeers.length === 0) {
    return 1; // Default middle if no peers
  }

  const allValues = [...validPeers, value].sort((a, b) => a - b);
  const rank = allValues.lastIndexOf(value); // use lastIndexOf in case of ties to give better rank
  const percentile = rank / (allValues.length - 1);

  let adjustedPercentile = isLowerBetter ? (1 - percentile) : percentile;

  if (adjustedPercentile >= 0.7) return 2; // Top 30%
  if (adjustedPercentile >= 0.3) return 1; // Middle 40%
  return 0; // Bottom 30%
}

export async function calculateHealthScore(symbol: string): Promise<HealthScoreResult> {
  const cleanSymbol = symbol.toUpperCase().trim();
  const cacheKey = `sectors:health:${cleanSymbol}`;

  if (redis) {
    const cached = await redis.get<HealthScoreResult>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // 1. Fetch Target Report & Financials
  const report = await sectors.companies.getReport(cleanSymbol, { sections: 'overview,dividend,peers' });
  const targetFinancials = await getNormalizedFinancials(cleanSymbol);
  
  const targetDivYield = report.dividend?.dividend_yield;
  const targetMetrics = extractMetrics(targetFinancials, targetDivYield);

  // 2. Fetch Peers Data
  let peers: any[] = [];
  if (report.peers && Array.isArray(report.peers)) {
    // Sometimes report.peers is an array of objects with { peers_data: { companies: [...] } }
    const firstGroup = report.peers[0] as any;
    if (firstGroup?.peers_data?.companies) {
      peers = firstGroup.peers_data.companies;
    } else {
      peers = report.peers; // fallback if they fix the structure
    }
  }
  
  const peerMetricsList: ExtractedMetrics[] = [];
  
  // Limit to 5 peers to avoid too many requests
  const peerSymbols = peers.slice(0, 5).map(p => p.symbol).filter(Boolean);
  
  await Promise.all(
    peerSymbols.map(async (peerSymbol) => {
      try {
        const peerFinancials = await getNormalizedFinancials(peerSymbol);
        // We don't fetch full report for peers to save API calls, so div yield might be missing unless we fetch it
        // To be accurate, we'll fetch just dividend section for peers
        const peerReport = await sectors.companies.getReport(peerSymbol, { sections: 'dividend' });
        peerMetricsList.push(extractMetrics(peerFinancials, peerReport.dividend?.dividend_yield));
      } catch (err) {
        console.warn(`Failed to fetch peer data for ${peerSymbol}`, err);
      }
    })
  );

  // 3. Calculate Scores
  const roeScore = getScore(targetMetrics.roe, peerMetricsList.map(p => p.roe));
  const derScore = getScore(targetMetrics.der, peerMetricsList.map(p => p.der), true); // lower is better
  const crScore = getScore(targetMetrics.currentRatio, peerMetricsList.map(p => p.currentRatio));
  const growthScore = getScore(targetMetrics.revenueGrowth, peerMetricsList.map(p => p.revenueGrowth));
  const divScore = getScore(targetMetrics.dividendYield, peerMetricsList.map(p => p.dividendYield));

  const totalScore = roeScore + derScore + crScore + growthScore + divScore;

  const result: HealthScoreResult = {
    symbol: cleanSymbol,
    totalScore,
    breakdown: {
      profitability: { metricValue: targetMetrics.roe, score: roeScore, label: 'ROE (Return on Equity)' },
      solvency: { metricValue: targetMetrics.der, score: derScore, label: 'DER (Debt to Equity)' },
      liquidity: { metricValue: targetMetrics.currentRatio, score: crScore, label: 'Current Ratio (Est)' },
      growth: { metricValue: targetMetrics.revenueGrowth, score: growthScore, label: 'Revenue Growth YoY' },
      dividend: { metricValue: targetMetrics.dividendYield, score: divScore, label: 'Dividend Yield' },
    }
  };

  if (redis) {
    await redis.set(cacheKey, result, { ex: 86400 }); // Cache 24 hours
  }

  return result;
}
