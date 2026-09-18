import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  ScreenerParams,
  ScreenerCompany,
  FreeFloatParams,
  FreeFloatItem,
} from '../types.ts';

export class ScreenerClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Filter and sort IDX-listed companies via structured query (where/order_by) or natural language (q).
   * Endpoint: GET /v2/companies/
   * Credit: 1 credit (structured) or 3 credits (natural language q)
   */
  async companies(
    params?: ScreenerParams,
    options?: RequestOptions
  ): Promise<ScreenerCompany[] | Record<string, ScreenerCompany[]>> {
    return this.transport.request<
      ScreenerCompany[] | Record<string, ScreenerCompany[]>
    >('/companies', params as Record<string, unknown>, {
      tier: 'market',
      tags: ['screener:companies'],
      ...options,
    });
  }

  /**
   * Returns the free float percentage for IDX-listed companies.
   * Endpoint: GET /v2/free-float/
   * Credit: 1 credit
   */
  async freeFloat(
    params?: FreeFloatParams,
    options?: RequestOptions
  ): Promise<FreeFloatItem[]> {
    return this.transport.request<FreeFloatItem[]>(
      '/free-float',
      params as Record<string, unknown>,
      { tier: 'fundamental', tags: ['screener:free-float'], ...options }
    );
  }
}
