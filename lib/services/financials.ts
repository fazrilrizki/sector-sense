import { sectors } from '../sectors/client.ts';
import { Redis } from '@upstash/redis';
import type { QuarterlyFinancialRow } from '../sectors/types.ts';

// Load Upstash Redis client. Fallback gracefully if env vars are missing.
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

export class SectorsAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SectorsAPIError';
  }
}

export interface NormalizedFinancialData {
  symbol: string;
  quarterly: {
    year: number;
    quarter: number;
    date: string;
    balanceSheet: Record<string, unknown>;
    incomeStatement: Record<string, unknown>;
    cashFlow: Record<string, unknown>;
    metrics: Record<string, unknown>;
  }[];
}

/**
 * Mendapatkan data keuangan kuartalan emiten, dinormalisasi dan di-cache.
 * Data di-cache di Upstash Redis dengan key "sectors:financials:{symbol}"
 * TTL cache diatur selama 24 jam (86400 detik).
 */
export async function getNormalizedFinancials(symbol: string): Promise<NormalizedFinancialData> {
  const cleanSymbol = symbol.toUpperCase().trim();
  const cacheKey = `sectors:financials:${cleanSymbol}`;

  try {
    // 1. Coba ambil dari Cache (Upstash Redis)
    if (redis) {
      const cached = await redis.get<NormalizedFinancialData>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 2. Ambil dari Sectors API
    // getQuarterlyFinancials mereturn array dari QuarterlyFinancialRow
    const rawData = await sectors.companies.getQuarterlyFinancials(cleanSymbol);

    if (!rawData || rawData.length === 0) {
      throw new SectorsAPIError(`Data keuangan tidak ditemukan untuk emiten ${cleanSymbol}`);
    }

    // 3. Normalisasi Data
    const normalizedQuarterly = rawData.map((row: QuarterlyFinancialRow & { year?: number }) => {
      const balanceSheet: Record<string, unknown> = {};
      const incomeStatement: Record<string, unknown> = {};
      const cashFlow: Record<string, unknown> = {};
      const metrics: Record<string, unknown> = {};

      // Daftar key yang sudah diketahui pengelompokannya
      const bsKeys = ['total_assets', 'total_liabilities', 'total_equity', 'gross_loan', 'total_deposit'];
      const isKeys = ['revenue', 'gross_profit', 'operating_income', 'net_income', 'net_interest_income'];
      const cfKeys = ['operating_cash_flow', 'investing_cash_flow', 'financing_cash_flow'];
      const baseKeys = ['report_date', 'quarter', 'year'];

      // Kelompokkan secara logis tanpa membuang data
      for (const [key, value] of Object.entries(row)) {
        if (baseKeys.includes(key)) {
          continue; // Akan di-assign ke root level objek kuartal
        }

        if (bsKeys.includes(key) || key.includes('asset') || key.includes('liabilit') || key.includes('equity')) {
          balanceSheet[key] = value;
        } else if (isKeys.includes(key) || key.includes('revenue') || key.includes('income') || key.includes('profit')) {
          incomeStatement[key] = value;
        } else if (cfKeys.includes(key) || key.includes('cash_flow') || key.includes('cf')) {
          cashFlow[key] = value;
        } else {
          // Semua data lain yang tidak masuk kategori utama masuk ke metrics
          metrics[key] = value;
        }
      }

      // Pastikan year ada. Sectors API mereturn quarter dalam bentuk string (misal: "Q1")
      // atau mungkin memiliki field year secara terpisah tergantung response aktualnya.
      // Jika quarter format "Q1 2023", kita parse tahunnya.
      let parsedYear = row.year || (row.report_date ? new Date(row.report_date).getFullYear() : 0);
      let parsedQuarter = row.quarter ? parseInt(String(row.quarter).replace(/\D/g, ''), 10) : 0;
      
      // Jika tidak bisa di-parse dengan baik, fallback logis
      if (!parsedYear && row.report_date) {
         parsedYear = new Date(row.report_date).getFullYear();
      }

      return {
        year: parsedYear,
        quarter: parsedQuarter,
        date: row.report_date,
        balanceSheet,
        incomeStatement,
        cashFlow,
        metrics,
      };
    });

    const result: NormalizedFinancialData = {
      symbol: cleanSymbol,
      quarterly: normalizedQuarterly,
    };

    // 4. Simpan ke Cache (TTL 24 Jam)
    if (redis) {
      await redis.set(cacheKey, result, { ex: 86400 });
    }

    return result;
  } catch (error) {
    if (error instanceof SectorsAPIError) {
      throw error; // Re-throw custom error
    }
    throw new SectorsAPIError(`Gagal mengambil data finansial untuk ${cleanSymbol}: ${(error as Error).message}`);
  }
}
