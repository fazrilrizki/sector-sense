import type { CacheOptions } from '../cache/types.ts';

export interface RequestOptions extends CacheOptions {
  /**
   * Override timeout for this specific request (in milliseconds).
   */
  timeoutMs?: number;

  /**
   * Additional custom HTTP headers.
   */
  headers?: Record<string, string>;

  /**
   * Maximum retry attempts for transient errors (429, 503). Default: 3.
   */
  retries?: number;
}

export interface SectorsClientConfig {
  /**
   * Sectors Financial API key. Defaults to process.env.SECTORS_API_KEY.
   */
  apiKey?: string;

  /**
   * Base REST API URL. Defaults to 'https://api.sectors.app/v2'.
   */
  baseUrl?: string;

  /**
   * Sectors MCP server URL. Defaults to 'https://sectors-mcp.supertype.ai/mcp'.
   */
  mcpUrl?: string;

  /**
   * Default timeout in milliseconds for requests. Defaults to 15,000 (15s).
   */
  timeoutMs?: number;

  /**
   * Maximum automatic retries on rate limit (429) or transient 5xx. Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Initial backoff delay in milliseconds for retries. Defaults to 1,000 (1s).
   */
  initialRetryDelayMs?: number;

  /**
   * Cache adapter or configuration.
   */
  cache?: {
    adapter?: 'auto' | 'upstash' | 'memory';
    upstashUrl?: string;
    upstashToken?: string;
    keyPrefix?: string;
  };
}

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  data?: T[];
}

export interface DateRangeParams {
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
}
