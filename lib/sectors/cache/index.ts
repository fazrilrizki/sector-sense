import type { CacheAdapter, CacheOptions, CacheTier } from './types.ts';
import { resolveTtl } from './tiers.ts';
import { MemoryCacheAdapter } from './memory.ts';
import { UpstashRedisCacheAdapter } from './upstash.ts';

export type * from './types.ts';
export * from './tiers.ts';
export * from './memory.ts';
export * from './upstash.ts';
export * from './next-cache.ts';

export interface CacheManagerConfig {
  adapter?: 'auto' | 'upstash' | 'memory' | CacheAdapter;
  upstashUrl?: string;
  upstashToken?: string;
  keyPrefix?: string;
  defaultTier?: CacheTier;
}

/**
 * Normalizes query parameters into a deterministic sorted string.
 */
export function normalizeParams(params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return '';
  const sortedKeys = Object.keys(params).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val)) {
        pairs.push(`${key}=${val.slice().sort().join(',')}`);
      } else if (typeof val === 'object') {
        pairs.push(`${key}=${JSON.stringify(val)}`);
      } else {
        pairs.push(`${key}=${String(val)}`);
      }
    }
  }

  return pairs.join('&');
}

/**
 * Generates a consistent, namespaced cache key.
 */
export function buildCacheKey(
  endpoint: string,
  params?: Record<string, unknown>,
  prefix = 'sectors:v2:'
): string {
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  const queryString = normalizeParams(params);
  return queryString
    ? `${prefix}${cleanEndpoint}?${queryString}`
    : `${prefix}${cleanEndpoint}`;
}

export class CacheManager {
  private adapter: CacheAdapter;
  private readonly prefix: string;
  private readonly defaultTier: CacheTier;

  constructor(config?: CacheManagerConfig) {
    this.prefix = config?.keyPrefix || 'sectors:v2:';
    this.defaultTier = config?.defaultTier || 'market';
    this.adapter = this.resolveAdapter(config);
  }

  private resolveAdapter(config?: CacheManagerConfig): CacheAdapter {
    if (config?.adapter && typeof config.adapter === 'object') {
      return config.adapter;
    }

    const adapterType = config?.adapter || 'auto';

    if (adapterType === 'upstash') {
      return new UpstashRedisCacheAdapter({
        url: config?.upstashUrl,
        token: config?.upstashToken,
        keyPrefix: this.prefix,
      });
    }

    if (adapterType === 'memory') {
      return new MemoryCacheAdapter();
    }

    // 'auto' mode: check for Upstash credentials
    const upstashUrl = config?.upstashUrl || process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken =
      config?.upstashToken || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      try {
        return new UpstashRedisCacheAdapter({
          url: upstashUrl,
          token: upstashToken,
          keyPrefix: this.prefix,
        });
      } catch (err) {
        console.warn(
          '[SectorsCache] Failed to initialize Upstash Redis, falling back to MemoryCache:',
          (err as Error).message
        );
        return new MemoryCacheAdapter();
      }
    }

    return new MemoryCacheAdapter();
  }

  /**
   * Get the active cache adapter.
   */
  getAdapter(): CacheAdapter {
    return this.adapter;
  }

  /**
   * Override active adapter (useful in testing or runtime switching).
   */
  setAdapter(adapter: CacheAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Retrieve from cache or fetch fresh data and store with tiered TTL.
   */
  async getOrSet<T>(
    endpoint: string,
    params: Record<string, unknown> | undefined,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // If cache is explicitly skipped, call directly
    if (options?.skipCache) {
      return await fetcher();
    }

    const cacheKey = buildCacheKey(endpoint, params, this.prefix);

    // If not forcing refresh, attempt cache lookup
    if (!options?.forceRefresh) {
      const cached = await this.adapter.get<T>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    // Cache miss or force refresh: execute fetcher
    const freshData = await fetcher();

    // Store in cache
    const ttl = resolveTtl(options?.tier || this.defaultTier, options?.ttl);
    await this.adapter.set(cacheKey, freshData, ttl, options?.tags);

    return freshData;
  }

  /**
   * Invalidate a specific tag.
   */
  async invalidateTag(tag: string): Promise<void> {
    if (typeof this.adapter.invalidateTag === 'function') {
      await this.adapter.invalidateTag(tag);
    }
  }

  /**
   * Delete a specific cache key.
   */
  async delete(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<void> {
    const key = buildCacheKey(endpoint, params, this.prefix);
    await this.adapter.delete(key);
  }

  /**
   * Clear cache entries.
   */
  async clear(prefix?: string): Promise<void> {
    await this.adapter.clear(prefix || this.prefix);
  }
}
