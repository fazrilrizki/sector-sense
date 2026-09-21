import { sectors } from '../sectors/client.ts';
import { extractMetrics, getScore, HealthScoreResult } from './healthScore.ts';
import { getNormalizedFinancials } from './financials.ts';
import { Redis } from '@upstash/redis';

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
};

const redis = getRedisClient();

export interface RankedCompany extends HealthScoreResult {
  companyName: string;
  marketCap: number | null;
}

export type RankingTheme = 'health' | 'dividend';
export async function getTopRankedStocks(theme: RankingTheme, subSector: string = 'banks'): Promise<RankedCompany[]> {
  const cacheKey = `sectors:ranking:v10:${theme}:${subSector}`;
  
  if (redis) {
    const cached = await redis.get<RankedCompany[]>(cacheKey);
    if (cached) return cached;
  }

  // 1. Fetch top 15 companies in the sub-sector by market cap
  const response = await sectors.screener.companies({
    where: `sub_sector = '${subSector}'`,
    order_by: '-market_cap',
    limit: 15
  });

  let companies: any[] = [];
  if (Array.isArray(response)) {
    companies = response;
  } else if (response && typeof response === 'object') {
    companies = (response as any).data || (response as any).results || Object.values(response)[0] || [];
  }

  if (companies.length === 0) return [];

  // 2. Fetch raw data sequentially to avoid 429 Rate Limit (Max 15 iterations)
  const rawDataSet = [];
  for (const c of companies) {
    try {
      const [financials, report] = await Promise.all([
        getNormalizedFinancials(c.symbol),
        sectors.companies.getReport(c.symbol, { sections: 'overview,dividend' })
      ]);
      const metrics = extractMetrics(financials, report.dividend?.dividend_yield);
      rawDataSet.push({ symbol: c.symbol, companyName: c.company_name, marketCap: c.market_cap, metrics });
    } catch (err) {
      console.warn(`Failed to fetch data for ${c.symbol} in batch ranking`, err);
    }
  }

  const validDataSet = rawDataSet.filter((d): d is NonNullable<typeof d> => d !== null);

  // 3. Compute relative scores using the group itself as peers
  const results = validDataSet.map(data => {
    // Peers are simply the OTHER companies in this validDataSet
    const peers = validDataSet.filter(p => p.symbol !== data.symbol).map(p => p.metrics);
    
    const targetMetrics = data.metrics;
    
    const roeScore = getScore(targetMetrics.roe, peers.map(p => p.roe));
    const derScore = getScore(targetMetrics.der, peers.map(p => p.der), true);
    const crScore = getScore(targetMetrics.currentRatio, peers.map(p => p.currentRatio));
    const growthScore = getScore(targetMetrics.revenueGrowth, peers.map(p => p.revenueGrowth));
    const divScore = getScore(targetMetrics.dividendYield, peers.map(p => p.dividendYield));
    
    const totalScore = roeScore + derScore + crScore + growthScore + divScore;
    
    return {
      symbol: data.symbol,
      companyName: data.companyName,
      marketCap: data.marketCap || null,
      totalScore,
      breakdown: {
        profitability: { metricValue: targetMetrics.roe, score: roeScore, label: 'ROE' },
        solvency: { metricValue: targetMetrics.der, score: derScore, label: 'DER' },
        liquidity: { metricValue: targetMetrics.currentRatio, score: crScore, label: 'Current Ratio' },
        growth: { metricValue: targetMetrics.revenueGrowth, score: growthScore, label: 'Rev Growth YoY' },
        dividend: { metricValue: targetMetrics.dividendYield, score: divScore, label: 'Div Yield' }
      }
    } as RankedCompany;
  });

  // 4. Sort based on theme
  let ranked: RankedCompany[] = [];
  if (theme === 'health') {
    ranked = results.sort((a, b) => b.totalScore - a.totalScore);
  } else if (theme === 'dividend') {
    ranked = results
      .filter(r => r.totalScore >= 5)
      .sort((a, b) => {
        const aDivScore = a.breakdown.dividend.score;
        const bDivScore = b.breakdown.dividend.score;
        if (aDivScore !== bDivScore) return bDivScore - aDivScore;
        const aYield = a.breakdown.dividend.metricValue || 0;
        const bYield = b.breakdown.dividend.metricValue || 0;
        return bYield - aYield;
      });
  }

  const top5 = ranked.slice(0, 5);

  if (redis) {
    await redis.set(cacheKey, top5, { ex: 86400 });
  }

  return top5;
}
