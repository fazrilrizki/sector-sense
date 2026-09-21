import type { ComparisonMatrix } from './comparison.ts';

export function getMockComparisonMatrix(
  targetTicker: string,
  competitorTickers: string[],
): ComparisonMatrix {
  const allTickers = [targetTicker, ...competitorTickers];

  const mockData: Record<string, Omit<ComparisonMatrix['rows'][number], 'ticker' | 'isTarget'>> = {
    BBCA: {
      companyName: 'PT Bank Central Asia Tbk',
      subSector: 'Banks',
      healthScore: 9,
      healthBreakdown: {
        profitability: { value: 0.248, score: 2 },
        solvency: { value: 5.2, score: 2 },
        liquidity: { value: 1.19, score: 2 },
        growth: { value: 0.112, score: 2 },
        dividend: { value: 0.018, score: 1 },
      },
      valuation: { pe: 24.5, pb: 5.8, ps: null, evEbitda: null },
      margins: { netProfitMargin: 0.421, operatingMargin: 0.512 },
      revenueGrowthYoY: 0.112,
      dividendYield: 0.018,
      payoutRatio: 0.48,
    },
    BMRI: {
      companyName: 'PT Bank Mandiri (Persero) Tbk',
      subSector: 'Banks',
      healthScore: 8,
      healthBreakdown: {
        profitability: { value: 0.198, score: 2 },
        solvency: { value: 7.1, score: 1 },
        liquidity: { value: 1.14, score: 2 },
        growth: { value: 0.148, score: 2 },
        dividend: { value: 0.053, score: 1 },
      },
      valuation: { pe: 14.2, pb: 2.7, ps: null, evEbitda: null },
      margins: { netProfitMargin: 0.358, operatingMargin: 0.441 },
      revenueGrowthYoY: 0.148,
      dividendYield: 0.053,
      payoutRatio: 0.6,
    },
    BBNI: {
      companyName: 'PT Bank Negara Indonesia (Persero) Tbk',
      subSector: 'Banks',
      healthScore: 7,
      healthBreakdown: {
        profitability: { value: 0.154, score: 1 },
        solvency: { value: 8.3, score: 1 },
        liquidity: { value: 1.12, score: 1 },
        growth: { value: 0.092, score: 1 },
        dividend: { value: 0.047, score: 2 },
      },
      valuation: { pe: 9.8, pb: 1.5, ps: null, evEbitda: null },
      margins: { netProfitMargin: 0.287, operatingMargin: 0.368 },
      revenueGrowthYoY: 0.092,
      dividendYield: 0.047,
      payoutRatio: 0.55,
    },
    BBRI: {
      companyName: 'PT Bank Rakyat Indonesia (Persero) Tbk',
      subSector: 'Banks',
      healthScore: 8,
      healthBreakdown: {
        profitability: { value: 0.185, score: 2 },
        solvency: { value: 9.1, score: 0 },
        liquidity: { value: 1.11, score: 1 },
        growth: { value: 0.135, score: 2 },
        dividend: { value: 0.062, score: 2 },
      },
      valuation: { pe: 13.1, pb: 2.4, ps: null, evEbitda: null },
      margins: { netProfitMargin: 0.312, operatingMargin: 0.396 },
      revenueGrowthYoY: 0.135,
      dividendYield: 0.062,
      payoutRatio: 0.65,
    },
  };

  const fallback = (ticker: string, index: number): (typeof mockData)[string] => ({
    companyName: `PT ${ticker} Tbk`,
    subSector: 'Banks',
    healthScore: 6 + index,
    healthBreakdown: {
      profitability: { value: 0.12 + index * 0.02, score: 1 },
      solvency: { value: 7.0 - index, score: 1 },
      liquidity: { value: 1.1 + index * 0.05, score: 1 },
      growth: { value: 0.08 + index * 0.01, score: 1 },
      dividend: { value: 0.03 + index * 0.01, score: 1 },
    },
    valuation: { pe: 12.0 + index, pb: 2.0 + index * 0.3, ps: null, evEbitda: null },
    margins: { netProfitMargin: 0.28 + index * 0.02, operatingMargin: 0.36 + index * 0.02 },
    revenueGrowthYoY: 0.08 + index * 0.01,
    dividendYield: 0.03 + index * 0.01,
    payoutRatio: 0.5 + index * 0.05,
  });

  const rows: ComparisonMatrix['rows'] = allTickers.map((ticker, i) => ({
    ticker,
    isTarget: i === 0,
    ...(mockData[ticker] ?? fallback(ticker, i)),
  }));

  return {
    targetTicker,
    generatedAt: new Date().toISOString(),
    rows,
    rankings: computeRankings(rows),
  };
}

function computeRankings(rows: ComparisonMatrix['rows']): ComparisonMatrix['rankings'] {
  const best = <K extends keyof ComparisonMatrix['rows'][number]>(
    key: K,
    lowerBetter = false,
  ): string | null => {
    const valid = rows.filter((r) => r[key] != null) as typeof rows;
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => {
      const av = a[key] as number;
      const bv = b[key] as number;
      return lowerBetter ? (av < bv ? a : b) : av > bv ? a : b;
    }).ticker;
  };

  return {
    healthScore: best('healthScore') ?? rows[0].ticker,
    pe: best('valuation', true) === null
      ? null
      : rows
          .filter((r) => r.valuation.pe != null)
          .reduce((a, b) => ((a.valuation.pe ?? Infinity) < (b.valuation.pe ?? Infinity) ? a : b), rows[0])
          .ticker,
    netMargin: best('margins') === null
      ? null
      : rows
          .filter((r) => r.margins.netProfitMargin != null)
          .reduce((a, b) =>
            (a.margins.netProfitMargin ?? 0) > (b.margins.netProfitMargin ?? 0) ? a : b,
          )
          .ticker,
    revenueGrowth: rows
      .filter((r) => r.revenueGrowthYoY != null)
      .reduce<ComparisonMatrix['rows'][number] | null>((best, r) => {
        if (!best) return r;
        return (r.revenueGrowthYoY ?? 0) > (best.revenueGrowthYoY ?? 0) ? r : best;
      }, null)
      ?.ticker ?? null,
    dividendYield: rows
      .filter((r) => r.dividendYield != null)
      .reduce<ComparisonMatrix['rows'][number] | null>((best, r) => {
        if (!best) return r;
        return (r.dividendYield ?? 0) > (best.dividendYield ?? 0) ? r : best;
      }, null)
      ?.ticker ?? null,
  };
}
