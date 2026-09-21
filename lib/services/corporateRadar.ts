import { sectors } from '../sectors/client.ts';
import { Redis } from '@upstash/redis';
import type { CorporateActionsResponse, RawDividendAction } from '../sectors/types.ts';

// Upstash Redis client with graceful fallback
const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
};

const redis = getRedisClient();

export class CorporateRadarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorporateRadarError';
  }
}

export type EventType =
  | 'DIVIDEND'
  | 'STOCK_SPLIT'
  | 'RIGHTS_ISSUE'
  | 'AGM'
  | 'BONUS'
  | 'WARRANT';

export type EventStatus = 'UPCOMING' | 'RECENT' | 'HISTORICAL';

export interface CalendarEvent {
  id: string;
  symbol: string;
  type: EventType;
  title: string;
  date: string; // Ex-date for dividend, event date for others (YYYY-MM-DD)
  cumDate: string | null; // Calculated trading day before ex-date
  paymentDate: string | null;
  amount: number | null; // Cash amount per share (IDR)
  yield: number | null; // Yield percentage (e.g., 0.045 for 4.5%)
  ratio: string | null;
  details: string | null;
  status: EventStatus;
}

export interface HistoricalDividendYear {
  year: string;
  totalDividend: number;
  totalYield: number;
  payoutCount: number;
  breakdown: Array<{
    date: string;
    total: number;
    yield: number;
  }>;
}

export type DividendSafetyLevel = 'SAFE' | 'MODERATE' | 'AT_RISK';

export interface CorporateRadarData {
  symbol: string;
  companyName: string;
  sector?: string;
  subSector?: string;
  marketCap?: number;
  lastClosePrice?: number;
  // Dividend Metrics
  yieldTtm: number | null;
  avgYield5y: number | null;
  dividendTtm: number | null;
  payoutRatio: number | null;
  cashPayoutRatio: number | null;
  lastExDividendDate: string | null;
  isHighYield: boolean; // TTM Yield > 5%
  dividendSafetyLevel: DividendSafetyLevel;
  dividendSafetyExplanation: string;
  consistencyYears: number; // Consecutive dividend years
  // Calendar & Action events
  upcomingEvents: CalendarEvent[];
  recentEvents: CalendarEvent[];
  historicalDividends: HistoricalDividendYear[];
  calendar: CalendarEvent[];
}

/**
 * Calculates estimated IDX Cum-Date (1 business day before Ex-Date).
 * Accounts for weekends (Sat/Sun).
 */
export function calculateCumDate(exDateStr: string): string | null {
  try {
    const exDate = new Date(exDateStr);
    if (isNaN(exDate.getTime())) return null;

    const cumDate = new Date(exDate);
    const dayOfWeek = cumDate.getUTCDay(); // 0: Sun, 1: Mon, ... 6: Sat

    if (dayOfWeek === 1) {
      // Monday -> Cum Date is Friday (3 days prior)
      cumDate.setUTCDate(cumDate.getUTCDate() - 3);
    } else if (dayOfWeek === 0) {
      // Sunday -> Friday (2 days prior)
      cumDate.setUTCDate(cumDate.getUTCDate() - 2);
    } else if (dayOfWeek === 6) {
      // Saturday -> Friday (1 day prior)
      cumDate.setUTCDate(cumDate.getUTCDate() - 1);
    } else {
      // Tuesday to Friday -> 1 day prior
      cumDate.setUTCDate(cumDate.getUTCDate() - 1);
    }

    return cumDate.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Computes dividend safety score & explanation.
 * Mitigates dividend trap risks (Epic 4 / Task-11 dependency).
 */
export function evaluateDividendSafety(
  payoutRatio: number | null,
  cashPayoutRatio: number | null
): { level: DividendSafetyLevel; explanation: string } {
  if (payoutRatio === null && cashPayoutRatio === null) {
    return {
      level: 'MODERATE',
      explanation: 'Data rasio payout historis tidak lengkap untuk analisis komprehensif.',
    };
  }

  const effectivePayout = payoutRatio ?? cashPayoutRatio ?? 0;

  if (effectivePayout < 0) {
    return {
      level: 'AT_RISK',
      explanation: 'Perusahaan mencatat laba negatif (merugi) saat membagikan dividen. Sangat rawan jebakan dividen (Dividend Trap).',
    };
  }

  if (effectivePayout > 1.0) {
    return {
      level: 'AT_RISK',
      explanation: `Payout ratio (${(effectivePayout * 100).toFixed(1)}%) melebihi 100% dari laba bersih. Pembayaran dividen menggerus modal atau utang.`,
    };
  }

  if (effectivePayout > 0.7) {
    return {
      level: 'MODERATE',
      explanation: `Payout ratio (${(effectivePayout * 100).toFixed(1)}%) tergolong tinggi (70%-100%). Dividen menarik namun rentan terpangkas jika laba operasional menurun.`,
    };
  }

  return {
    level: 'SAFE',
    explanation: `Payout ratio (${(effectivePayout * 100).toFixed(1)}%) sehat dan proporsional (< 70%). Emiten memiliki bantalan arus kas yang kuat untuk menjaga kesinambungan dividen.`,
  };
}

/**
 * Determines whether a date is upcoming (today or in future) or recent (within past 90 days).
 */
function classifyEventStatus(dateStr: string, now: Date = new Date()): EventStatus {
  try {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return 'HISTORICAL';

    const diffDays = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      return 'UPCOMING';
    } else if (diffDays >= -120) {
      return 'RECENT';
    } else {
      return 'HISTORICAL';
    }
  } catch {
    return 'HISTORICAL';
  }
}

/**
 * Normalizes raw corporate actions & report data into CorporateRadarData.
 */
export function normalizeCorporateRadar(
  symbol: string,
  rawActions: CorporateActionsResponse | null,
  report: Record<string, any> | null
): CorporateRadarData {
  const clean = symbol.toUpperCase().replace(/\.JK$/i, '').trim();
  const now = new Date();

  const overview = report?.overview || {};
  const dividend = report?.dividend || {};

  const yieldTtm = typeof dividend.yield_ttm === 'number' ? dividend.yield_ttm : null;
  const avgYield5y = dividend.dividend_yield_avg?.avg_yield ?? null;
  const dividendTtm = typeof dividend.dividend_ttm === 'number' ? dividend.dividend_ttm : null;
  const payoutRatio = typeof dividend.payout_ratio === 'number' ? dividend.payout_ratio : null;
  const cashPayoutRatio = typeof dividend.cash_payout_ratio === 'number' ? dividend.cash_payout_ratio : null;
  const lastExDividendDate = dividend.last_ex_dividend_date || null;

  const safety = evaluateDividendSafety(payoutRatio, cashPayoutRatio);
  const isHighYield = (yieldTtm ?? 0) >= 0.05;

  // 1. Process Historical Dividends from Report
  const historicalYears: HistoricalDividendYear[] = [];
  if (dividend.historical_dividends && typeof dividend.historical_dividends === 'object') {
    const years = Object.keys(dividend.historical_dividends).sort((a, b) => Number(b) - Number(a));
    for (const y of years) {
      const item = dividend.historical_dividends[y];
      historicalYears.push({
        year: y,
        totalDividend: Number(item.total_dividend) || 0,
        totalYield: Number(item.total_yield) || 0,
        payoutCount: Array.isArray(item.breakdown) ? item.breakdown.length : 0,
        breakdown: Array.isArray(item.breakdown)
          ? item.breakdown.map((b: any) => ({
              date: b.date || '',
              total: Number(b.total) || 0,
              yield: Number(b.yield) || 0,
            }))
          : [],
      });
    }
  }

  // Count consecutive dividend paying years
  let consistencyYears = 0;
  for (const hy of historicalYears) {
    if (hy.totalDividend > 0) {
      consistencyYears++;
    } else {
      break;
    }
  }

  // 2. Parse Corporate Actions into unified calendar events
  const calendar: CalendarEvent[] = [];
  const actionsObj = rawActions?.corporate_actions || {};

  // A. Cash Dividends (Histori & Terjadwal)
  const divActions: RawDividendAction[] = Array.isArray(actionsObj.dividend) ? actionsObj.dividend : [];
  divActions.forEach((div, idx) => {
    if (!div.ex_date) return;
    const status = classifyEventStatus(div.ex_date, now);
    const cumDate = calculateCumDate(div.ex_date);

    calendar.push({
      id: `${clean}-DIV-${div.ex_date}-${idx}`,
      symbol: clean,
      type: 'DIVIDEND',
      title: 'Dividen Tunai',
      date: div.ex_date,
      cumDate,
      paymentDate: div.payment_date || null,
      amount: div.dividend_amount ?? null,
      yield: div.dividend_yield ?? null,
      ratio: null,
      details: div.dividend_amount
        ? `Dividen tunai Rp ${div.dividend_amount.toLocaleString('id-ID')} per lembar`
        : 'Pembagian dividen tunai',
      status,
    });
  });

  // B. Upcoming Dividend explicitly listed
  if (actionsObj.upcoming_dividend) {
    const upcomingList = Array.isArray(actionsObj.upcoming_dividend)
      ? actionsObj.upcoming_dividend
      : [actionsObj.upcoming_dividend];

    upcomingList.forEach((up: any, idx: number) => {
      const exDate = up.ex_date || up.date;
      if (!exDate) return;
      // Avoid duplicate if already in calendar
      const exists = calendar.some((c) => c.type === 'DIVIDEND' && c.date === exDate);
      if (!exists) {
        calendar.push({
          id: `${clean}-UPCOMING-DIV-${exDate}-${idx}`,
          symbol: clean,
          type: 'DIVIDEND',
          title: 'Dividen Mendatang',
          date: exDate,
          cumDate: calculateCumDate(exDate),
          paymentDate: up.payment_date || null,
          amount: up.dividend_amount ?? null,
          yield: up.dividend_yield ?? null,
          ratio: null,
          details: 'Jadwal pembagian dividen mendatang',
          status: 'UPCOMING',
        });
      }
    });
  }

  // C. Stock Splits
  const splits = Array.isArray(actionsObj.stock_split) ? actionsObj.stock_split : [];
  splits.forEach((split, idx) => {
    if (!split.date) return;
    const status = classifyEventStatus(split.date, now);
    calendar.push({
      id: `${clean}-SPLIT-${split.date}-${idx}`,
      symbol: clean,
      type: 'STOCK_SPLIT',
      title: 'Stock Split',
      date: split.date,
      cumDate: null,
      paymentDate: null,
      amount: null,
      yield: null,
      ratio: split.split_ratio ? `1:${split.split_ratio}` : null,
      details: split.split_ratio ? `Pemecahan nilai nominal saham (rasio 1:${split.split_ratio})` : 'Stock Split',
      status,
    });
  });

  // D. RUPS / AGM
  const agms = Array.isArray(actionsObj.agm) ? actionsObj.agm : [];
  agms.forEach((agm, idx) => {
    if (!agm.agm_date) return;
    const status = classifyEventStatus(agm.agm_date, now);
    calendar.push({
      id: `${clean}-AGM-${agm.agm_date}-${idx}`,
      symbol: clean,
      type: 'AGM',
      title: 'RUPS / AGM',
      date: agm.agm_date,
      cumDate: null,
      paymentDate: null,
      amount: null,
      yield: null,
      ratio: null,
      details: agm.agm_place ? `Lokasi: ${agm.agm_place}` : 'Rapat Umum Pemegang Saham',
      status,
    });
  });

  // E. Right Issues
  const rights = Array.isArray(actionsObj.right_issue) ? actionsObj.right_issue : [];
  rights.forEach((ri, idx) => {
    if (!ri.date) return;
    const status = classifyEventStatus(ri.date, now);
    calendar.push({
      id: `${clean}-RIGHTS-${ri.date}-${idx}`,
      symbol: clean,
      type: 'RIGHTS_ISSUE',
      title: 'Hak Memesan Efek Terlebih Dahulu (Right Issue)',
      date: ri.date,
      cumDate: null,
      paymentDate: null,
      amount: ri.price ?? null,
      yield: null,
      ratio: ri.ratio ?? null,
      details: ri.ratio ? `Right issue rasio ${ri.ratio}` : 'Aksi korporasi Right Issue',
      status,
    });
  });

  // Sort all events by date descending
  calendar.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingEvents = calendar.filter((e) => e.status === 'UPCOMING');
  const recentEvents = calendar.filter((e) => e.status === 'RECENT');

  return {
    symbol: clean,
    companyName: overview.company_name || overview.name || `${clean} Tbk`,
    sector: overview.sector || undefined,
    subSector: overview.sub_sector || undefined,
    marketCap: overview.market_cap || undefined,
    lastClosePrice: overview.last_close_price || undefined,
    yieldTtm,
    avgYield5y,
    dividendTtm,
    payoutRatio,
    cashPayoutRatio,
    lastExDividendDate,
    isHighYield,
    dividendSafetyLevel: safety.level,
    dividendSafetyExplanation: safety.explanation,
    consistencyYears,
    upcomingEvents,
    recentEvents,
    historicalDividends: historicalYears,
    calendar,
  };
}

/**
 * Fetch and aggregate Corporate Radar & Dividend Calendar for a stock symbol.
 * Caches in Upstash Redis (TTL 24 hours).
 */
export async function getCorporateRadar(symbol: string): Promise<CorporateRadarData> {
  const clean = symbol.toUpperCase().replace(/\.JK$/i, '').trim();
  const cacheKey = `sectors:corporate_radar:${clean}`;

  // 1. Try Upstash Redis Cache
  if (redis) {
    try {
      const cached = await redis.get<CorporateRadarData>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.warn(`[CorporateRadar] Redis cache get failed for ${clean}:`, err);
    }
  }

  // 2. Fetch from Sectors API (Protected by MockInterceptor)
  try {
    const [rawActions, report] = await Promise.all([
      sectors.companies.getCorporateActions(clean).catch((err) => {
        console.warn(`[CorporateRadar] Failed to get corporate actions for ${clean}:`, err.message);
        return null;
      }),
      sectors.companies.getReport(clean, { sections: 'overview,dividend,valuation' }).catch((err) => {
        console.warn(`[CorporateRadar] Failed to get report for ${clean}:`, err.message);
        return null;
      }),
    ]);

    if (!rawActions && !report) {
      throw new CorporateRadarError(`Data radar dan aksi korporasi untuk emiten ${clean} tidak ditemukan.`);
    }

    const radarData = normalizeCorporateRadar(clean, rawActions, report);

    // 3. Save to Upstash Redis Cache (TTL: 24h = 86400s)
    if (redis) {
      try {
        await redis.set(cacheKey, radarData, { ex: 86400 });
      } catch (err) {
        console.warn(`[CorporateRadar] Redis cache set failed for ${clean}:`, err);
      }
    }

    return radarData;
  } catch (err: any) {
    if (err instanceof CorporateRadarError) throw err;
    throw new CorporateRadarError(`Gagal mengambil data Corporate Radar untuk ${clean}: ${err?.message || err}`);
  }
}

/**
 * Aggregates corporate actions and dividend calendar across a list of symbols.
 */
export async function getDividendCalendar(
  symbols: string[] = ['BBCA', 'BBRI', 'BMRI', 'ASII', 'TLKM', 'PTBA', 'ADRO']
): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];

  const results = await Promise.allSettled(symbols.map((sym) => getCorporateRadar(sym)));

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value?.calendar) {
      allEvents.push(...res.value.calendar);
    }
  }

  // Sort overall calendar: upcoming first, then recent
  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return allEvents;
}
