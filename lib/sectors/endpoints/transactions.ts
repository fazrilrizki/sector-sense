import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  DailyTransactionParams,
  DailyTransactionRow,
  UniverseCloseRow,
  MarketCapHistoryRow,
  IndexDailyRow,
} from '../types.ts';
import { cleanSymbol } from './companies.ts';

export class TransactionsClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Daily close price, volume, and market cap for a given IDX ticker (up to 90 days range).
   * Endpoint: GET /v2/daily/{symbol}/
   */
  async getDaily(
    symbol: string,
    params?: DailyTransactionParams,
    options?: RequestOptions
  ): Promise<DailyTransactionRow[]> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<DailyTransactionRow[]>(
      `/daily/${clean}`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`company:${clean}`, `daily:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Daily closing prices and changes for the entire IDX universe on a single trading day.
   * Endpoint: GET /v2/close/
   * @param date Optional trading date (YYYY-MM-DD). Defaults to latest trading date.
   */
  async getUniverseClose(
    date?: string,
    options?: RequestOptions
  ): Promise<UniverseCloseRow[]> {
    const query = date ? { date } : undefined;
    return this.transport.request<UniverseCloseRow[]>('/close', query, {
      tier: 'market',
      tags: ['market:close'],
      ...options,
    });
  }

  /**
   * Historical total IDX market capitalization (up to 90 days).
   * Endpoint: GET /v2/idx-total/
   */
  async getIdxMarketCap(
    params?: DailyTransactionParams,
    options?: RequestOptions
  ): Promise<MarketCapHistoryRow[]> {
    return this.transport.request<MarketCapHistoryRow[]>(
      '/idx-total',
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: ['market:idx-total'],
        ...options,
      }
    );
  }

  /**
   * Daily closing transaction data for an index (e.g. 'LQ45', 'IDX30', 'KOMPAS100').
   * Endpoint: GET /v2/index-daily/{index_code}/
   */
  async getIndexDaily(
    indexCode: string,
    params?: DailyTransactionParams,
    options?: RequestOptions
  ): Promise<IndexDailyRow[]> {
    const cleanIndex = indexCode.toUpperCase().trim();
    return this.transport.request<IndexDailyRow[]>(
      `/index-daily/${cleanIndex}`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`index:${cleanIndex}`],
        ...options,
      }
    );
  }
}
