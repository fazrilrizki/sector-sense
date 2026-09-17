import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  NewsParams,
  NewsArticle,
  FilingsParams,
  FilingItem,
  SuspensionParams,
  SuspensionItem,
} from '../types.ts';

export class NewsClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * News articles from the Indonesia Stock Exchange (IDX) and financial news sources.
   * Endpoint: GET /v2/news/
   */
  async getArticles(
    params?: NewsParams,
    options?: RequestOptions
  ): Promise<NewsArticle[]> {
    const query: Record<string, unknown> = { ...params };
    if (Array.isArray(params?.symbols))
      query.symbols = params.symbols.join(',');
    if (Array.isArray(params?.tags)) query.tags = params.tags.join(',');

    return this.transport.request<NewsArticle[]>('/news', query, {
      tier: 'realtime',
      tags: ['news:articles'],
      ...options,
    });
  }

  /**
   * Insider trading filings (buy/sell transactions by company insiders and major shareholders).
   * Endpoint: GET /v2/filings/
   */
  async getFilings(
    params?: FilingsParams,
    options?: RequestOptions
  ): Promise<FilingItem[]> {
    return this.transport.request<FilingItem[]>(
      '/filings',
      params as Record<string, unknown>,
      {
        tier: 'realtime',
        tags: ['news:filings'],
        ...options,
      }
    );
  }

  /**
   * Historical IDX-listed stock suspensions with dates and official reasons.
   * Endpoint: GET /v2/suspensions/
   */
  async getSuspensions(
    params?: SuspensionParams,
    options?: RequestOptions
  ): Promise<SuspensionItem[]> {
    return this.transport.request<SuspensionItem[]>(
      '/suspensions',
      params as Record<string, unknown>,
      {
        tier: 'realtime',
        tags: ['news:suspensions'],
        ...options,
      }
    );
  }
}
