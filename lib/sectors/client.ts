import { CacheManager } from './cache/index.ts';
import { HttpTransport } from './core/transport.ts';
import type { SectorsClientConfig } from './core/types.ts';
import { ScreenerClient } from './endpoints/screener.ts';
import { CompaniesClient } from './endpoints/companies.ts';
import { TransactionsClient } from './endpoints/transactions.ts';
import { BrokersClient } from './endpoints/brokers.ts';
import { RankingsClient } from './endpoints/rankings.ts';
import { NewsClient } from './endpoints/news.ts';
import { HelpersClient } from './endpoints/helpers.ts';
import { SectorsMcpClient } from './mcp/client.ts';

export class SectorsClient {
  public readonly cache: CacheManager;
  public readonly transport: HttpTransport;

  // Domain Sub-Clients (Indonesia / IDX Focus)
  public readonly screener: ScreenerClient;
  public readonly companies: CompaniesClient;
  public readonly transactions: TransactionsClient;
  public readonly brokers: BrokersClient;
  public readonly rankings: RankingsClient;
  public readonly news: NewsClient;
  public readonly helpers: HelpersClient;

  // Model Context Protocol (MCP) Streamable HTTP Client
  public readonly mcp: SectorsMcpClient;

  constructor(config?: SectorsClientConfig) {
    this.cache = new CacheManager({
      adapter: config?.cache?.adapter,
      upstashUrl: config?.cache?.upstashUrl,
      upstashToken: config?.cache?.upstashToken,
      keyPrefix: config?.cache?.keyPrefix,
    });

    this.transport = new HttpTransport(config, this.cache);

    this.screener = new ScreenerClient(this.transport);
    this.companies = new CompaniesClient(this.transport);
    this.transactions = new TransactionsClient(this.transport);
    this.brokers = new BrokersClient(this.transport);
    this.rankings = new RankingsClient(this.transport);
    this.news = new NewsClient(this.transport);
    this.helpers = new HelpersClient(this.transport);

    const mcpUrl =
      config?.mcpUrl ||
      process.env.SECTORS_MCP_URL ||
      'https://sectors-mcp.supertype.ai/mcp';
    const apiKey = config?.apiKey || process.env.SECTORS_API_KEY || '';
    this.mcp = new SectorsMcpClient(mcpUrl, apiKey, this.cache);
  }

  /**
   * Invalidate all cached data associated with a specific tag.
   * e.g., sectors.invalidateTag('company:BBCA')
   */
  async invalidateTag(tag: string): Promise<void> {
    await this.cache.invalidateTag(tag);
  }

  /**
   * Clears the Sectors cache entries.
   */
  async clearCache(prefix?: string): Promise<void> {
    await this.cache.clear(prefix);
  }
}

/**
 * Default singleton instance preconfigured with environment variables.
 */
export const sectors = new SectorsClient();
