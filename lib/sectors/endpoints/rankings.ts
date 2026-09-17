import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type { TopChangesParams, MostTradedParams } from '../types.ts';

export class RankingsClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Top gainers and losers across 1d, 7d, 14d, 30d, 365d periods.
   * Endpoint: GET /v2/companies/top-changes/
   */
  async getTopChanges(
    params?: TopChangesParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const query: Record<string, unknown> = {};
    if (params?.classifications) {
      query.classifications = Array.isArray(params.classifications)
        ? params.classifications.join(',')
        : params.classifications;
    }
    if (params?.periods) {
      query.periods = Array.isArray(params.periods)
        ? params.periods.join(',')
        : params.periods;
    }
    if (params?.sub_sector) query.sub_sector = params.sub_sector;
    if (params?.n_stock) query.n_stock = params.n_stock;

    return this.transport.request<Record<string, unknown>>(
      '/companies/top-changes',
      query,
      {
        tier: 'market',
        tags: ['rankings:top-changes'],
        ...options,
      }
    );
  }

  /**
   * Most traded IDX stocks by transaction volume over a date range up to 90 days.
   * Endpoint: GET /v2/most-traded/
   */
  async getMostTraded(
    params?: MostTradedParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    return this.transport.request<Record<string, unknown>>(
      '/most-traded',
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: ['rankings:most-traded'],
        ...options,
      }
    );
  }
}
