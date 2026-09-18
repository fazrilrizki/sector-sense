/**
 * Types and interfaces for the Sectors caching layer.
 */

export type CacheTier = 'static' | 'fundamental' | 'market' | 'realtime';

export interface CacheOptions {
  /**
   * Custom TTL in seconds. Overrides the tier's default TTL if specified.
   */
  ttl?: number;

  /**
   * Caching tier determining the default TTL based on data volatility.
   * - static: 24h (86,400s) - Subsectors, industries, tags, registries
   * - fundamental: 6h (21,600s) - Financial statements, reports, shareholders
   * - market: 10m (600s) - Daily prices, broker flows, top movers, market caps
   * - realtime: 3m (180s) - News, filings, suspensions
   */
  tier?: CacheTier;

  /**
   * Cache tags for on-demand invalidation (e.g., ['ticker:BBCA', 'subsector:banks']).
   */
  tags?: string[];

  /**
   * If true, skips reading from cache and bypasses saving to cache.
   */
  skipCache?: boolean;

  /**
   * If true, bypasses reading from cache, fetches fresh data, and updates the cache.
   */
  forceRefresh?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  expiresAt: number;
  tags?: string[];
}

export interface CacheAdapter {
  readonly name: string;

  /**
   * Retrieve a cached item by key.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store an item in the cache with a TTL in seconds.
   */
  set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    tags?: string[]
  ): Promise<void>;

  /**
   * Delete a specific cache key.
   */
  delete(key: string): Promise<void>;

  /**
   * Invalidate all keys associated with a specific tag (if supported).
   */
  invalidateTag?(tag: string): Promise<void>;

  /**
   * Clear all cached items under a specific prefix or all keys.
   */
  clear(prefix?: string): Promise<void>;
}
