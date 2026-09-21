import { Redis } from '@upstash/redis';
import { sectors } from '../sectors/client.ts';
import mockForecasting from '../data/mock-forecasting.json' assert { type: 'json' };

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
};

const redis = getRedisClient();

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DividendTrapResult {
  symbol: string;
  analysisDate: string;

  dividendYieldPct: number;
  dividendAmountIdr: number | null;
  payoutRatio: number | null;

  estimatedPriceDropPct: number;
  netBenefitPct: number;
  trapProbability: number;

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  verdict: 'SAFE' | 'MODERATE' | 'DIVIDEND_TRAP';

  adjustmentFactors: {
    sectorFactor: number;
    payoutFactor: number;
    yieldMagnitudeFactor: number;
    finalMultiplier: number;
  };

  nextEvent: {
    exDate: string | null;
    cumDate: string | null;
    amountIdr: number | null;
  } | null;
}

// ── Sector factor lookup ──────────────────────────────────────────────────────

const SECTOR_FACTORS: Record<string, number> = {
  banks: 0.85,
  'financing service': 0.90,
  insurance: 0.90,
  'investment service': 0.90,
  'coal mining': 1.25,
  'oil, gas & coal': 1.25,
  'metal mining': 1.20,
  mining: 1.20,
  'basic materials': 1.10,
  property: 1.10,
  construction: 1.05,
  'consumer cyclicals': 1.00,
  'consumer non-cyclicals': 0.95,
  'healthcare equipment & providers': 0.95,
  technology: 0.90,
  utilities: 1.05,
  transportation: 1.05,
  'industrial goods': 1.00,
};

function getSectorFactor(subSector: string): number {
  const key = subSector.toLowerCase();
  for (const [pattern, factor] of Object.entries(SECTOR_FACTORS)) {
    if (key.includes(pattern)) return factor;
  }
  return 1.0;
}

// ── Mathematical model ────────────────────────────────────────────────────────

interface ModelInput {
  dividendYieldPct: number;
  payoutRatio: number | null;
  subSector: string;
}

interface ModelOutput {
  estimatedPriceDropPct: number;
  netBenefitPct: number;
  trapProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  verdict: 'SAFE' | 'MODERATE' | 'DIVIDEND_TRAP';
  adjustmentFactors: DividendTrapResult['adjustmentFactors'];
}

function runModel(input: ModelInput): ModelOutput {
  const { dividendYieldPct, payoutRatio, subSector } = input;

  // Guard: zero dividend = no trap risk
  if (dividendYieldPct <= 0) {
    return {
      estimatedPriceDropPct: 0,
      netBenefitPct: 0,
      trapProbability: 0,
      riskLevel: 'LOW',
      verdict: 'SAFE',
      adjustmentFactors: { sectorFactor: 1, payoutFactor: 0, yieldMagnitudeFactor: 0, finalMultiplier: 1 },
    };
  }

  const sectorFactor = getSectorFactor(subSector);

  const payoutFactor =
    payoutRatio == null ? 0.05
    : payoutRatio > 0.8 ? 0.15
    : payoutRatio > 0.6 ? 0.05
    : 0;

  const yieldMagnitudeFactor =
    dividendYieldPct > 8 ? 0.20
    : dividendYieldPct > 5 ? 0.10
    : 0;

  const finalMultiplier = sectorFactor + payoutFactor + yieldMagnitudeFactor;
  const estimatedPriceDropPct = Math.min(dividendYieldPct * finalMultiplier, dividendYieldPct * 1.5);
  const netBenefitPct = dividendYieldPct - estimatedPriceDropPct;
  const trapProbability = Math.min(estimatedPriceDropPct / dividendYieldPct, 1);

  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    trapProbability > 0.85 ? 'HIGH'
    : trapProbability > 0.60 ? 'MEDIUM'
    : 'LOW';

  const verdict =
    riskLevel === 'HIGH' ? 'DIVIDEND_TRAP'
    : riskLevel === 'MEDIUM' ? 'MODERATE'
    : 'SAFE';

  return {
    estimatedPriceDropPct: Math.round(estimatedPriceDropPct * 100) / 100,
    netBenefitPct: Math.round(netBenefitPct * 100) / 100,
    trapProbability: Math.round(trapProbability * 1000) / 1000,
    riskLevel,
    verdict,
    adjustmentFactors: {
      sectorFactor,
      payoutFactor,
      yieldMagnitudeFactor,
      finalMultiplier: Math.round(finalMultiplier * 1000) / 1000,
    },
  };
}

// ── Mock handler ──────────────────────────────────────────────────────────────

function buildFromMock(symbol: string): DividendTrapResult | null {
  const data = (mockForecasting as Record<string, unknown>)[symbol];
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;
  const upcoming = d.upcoming_dividend as Record<string, unknown> | undefined;
  const historical = d.historical_analysis as Record<string, unknown> | undefined;
  const trapProb = Number(historical?.trap_probability ?? 0);
  const avgDrop = Math.abs(Number(historical?.avg_price_drop_ex_date_percent ?? 0));
  const yieldPct = Number(upcoming?.yield_percent ?? 0);

  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    trapProb > 0.85 ? 'HIGH' : trapProb > 0.60 ? 'MEDIUM' : 'LOW';

  return {
    symbol,
    analysisDate: new Date().toISOString(),
    dividendYieldPct: yieldPct,
    dividendAmountIdr: Number(upcoming?.amount_idr ?? null) || null,
    payoutRatio: null,
    estimatedPriceDropPct: avgDrop,
    netBenefitPct: Math.round((yieldPct - avgDrop) * 100) / 100,
    trapProbability: trapProb,
    riskLevel,
    verdict: riskLevel === 'HIGH' ? 'DIVIDEND_TRAP' : riskLevel === 'MEDIUM' ? 'MODERATE' : 'SAFE',
    adjustmentFactors: { sectorFactor: 1, payoutFactor: 0, yieldMagnitudeFactor: 0, finalMultiplier: 1 },
    nextEvent: upcoming
      ? {
          exDate: String(upcoming.ex_date ?? ''),
          cumDate: String(upcoming.cum_date ?? ''),
          amountIdr: Number(upcoming.amount_idr ?? null) || null,
        }
      : null,
  };
}

// ── Next dividend event extraction ────────────────────────────────────────────

function extractNextEvent(
  actions: Awaited<ReturnType<typeof sectors.companies.getCorporateActions>>,
): DividendTrapResult['nextEvent'] {
  const today = new Date();

  const upcoming = actions
    .filter((a) => a.action_type === 'dividend' && a.date && new Date(a.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcoming.length === 0) {
    // Fallback: latest past dividend
    const past = actions
      .filter((a) => a.action_type === 'dividend' && a.amount)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (past.length === 0) return null;
    const latest = past[0];
    return {
      exDate: latest.date,
      cumDate: subtractOneDay(latest.date),
      amountIdr: latest.amount ?? null,
    };
  }

  const next = upcoming[0];
  return {
    exDate: next.date,
    cumDate: subtractOneDay(next.date),
    amountIdr: next.amount ?? null,
  };
}

function subtractOneDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── Main service ──────────────────────────────────────────────────────────────

export async function getDividendTrapAnalysis(symbol: string): Promise<DividendTrapResult> {
  const clean = symbol.toUpperCase().trim();
  const cacheKey = `sectors:dividend-trap:v1:${clean}`;

  if (process.env.MOCK_API === 'true') {
    const mock = buildFromMock(clean);
    if (mock) return mock;
    // Unknown ticker in mock mode: fall through to model with API data
    // (mockInterceptor handles the API calls transparently)
  }

  if (redis) {
    const cached = await redis.get<DividendTrapResult>(cacheKey);
    if (cached) return cached;
  }

  const [report, actions] = await Promise.all([
    sectors.companies.getReport(clean, { sections: 'dividend,overview' }),
    sectors.companies.getCorporateActions(clean),
  ]);

  const dividendYieldPct = (report.dividend?.dividend_yield ?? 0) * 100;
  const payoutRatio = report.dividend?.payout_ratio ?? null;
  const subSector = report.overview?.sub_sector ?? '';

  // Latest dividend amount from corporate actions
  const dividendActions = actions.filter((a) => a.action_type === 'dividend' && a.amount);
  const latestDividend = dividendActions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  const modelOutput = runModel({ dividendYieldPct, payoutRatio, subSector });
  const nextEvent = extractNextEvent(actions);

  const result: DividendTrapResult = {
    symbol: clean,
    analysisDate: new Date().toISOString(),
    dividendYieldPct,
    dividendAmountIdr: latestDividend?.amount ?? null,
    payoutRatio,
    ...modelOutput,
    nextEvent,
  };

  if (redis) {
    await redis.set(cacheKey, result, { ex: 43200 }); // 12 hours
  }

  return result;
}
