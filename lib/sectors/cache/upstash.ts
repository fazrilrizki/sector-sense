import { Redis } from '@upstash/redis';
import type { CacheAdapter, CacheEntry } from './types.ts';

export interface UpstashAdapterConfig {
  url?: string;
  token?: string;
  keyPrefix?: string;
}

export class UpstashRedisCacheAdapter implements CacheAdapter {
  public readonly name = 'upstash-redis';
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(config?: UpstashAdapterConfig) {
    const url = config?.url || process.env.UPSTASH_REDIS_REST_URL;
    const token = config?.token || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'UpstashRedisCacheAdapter requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      );
    }

    this.prefix = config?.keyPrefix || 'sectors:';
    this.redis = new Redis({ url, token });
  }

  private formatKey(key: string): string {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  private tagKey(tag: string): string {
    return `${this.prefix}tag:${tag}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.formatKey(key);
      const raw = await this.redis.get<string | CacheEntry<T>>(fullKey);

      if (!raw) return null;

      const entry: CacheEntry<T> =
        typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn(
        '[SectorsCache:Upstash] get error (bypassing):',
        (error as Error).message
      );
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    tags: string[] = []
  ): Promise<void> {
    try {
      const fullKey = this.formatKey(key);
      const now = Date.now();
      const entry: CacheEntry<T> = {
        value,
        cachedAt: now,
        expiresAt: now + ttlSeconds * 1000,
        tags,
      };

      // Set key with TTL in seconds
      await this.redis.set(fullKey, JSON.stringify(entry), {
        ex: Math.max(1, ttlSeconds),
      });

      // Track tags
      if (tags.length > 0) {
        for (const tag of tags) {
          const tKey = this.tagKey(tag);
          await this.redis.sadd(tKey, fullKey);
          // Set tag set expiry slightly longer than the key
          await this.redis.expire(tKey, Math.max(1, ttlSeconds) + 3600);
        }
      }
    } catch (error) {
      console.warn(
        '[SectorsCache:Upstash] set error (bypassing):',
        (error as Error).message
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.formatKey(key);
      await this.redis.del(fullKey);
    } catch (error) {
      console.warn(
        '[SectorsCache:Upstash] delete error:',
        (error as Error).message
      );
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    try {
      const tKey = this.tagKey(tag);
      const members = await this.redis.smembers<string[]>(tKey);
      if (members && members.length > 0) {
        await this.redis.del(...members);
      }
      await this.redis.del(tKey);
    } catch (error) {
      console.warn(
        '[SectorsCache:Upstash] invalidateTag error:',
        (error as Error).message
      );
    }
  }

  async clear(prefix?: string): Promise<void> {
    try {
      const searchPattern = prefix
        ? `${this.formatKey(prefix)}*`
        : `${this.prefix}*`;
      let cursor = 0;
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, {
          match: searchPattern,
          count: 100,
        });
        cursor =
          typeof nextCursor === 'number'
            ? nextCursor
            : parseInt(nextCursor, 10);
        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      console.warn(
        '[SectorsCache:Upstash] clear error:',
        (error as Error).message
      );
    }
  }
}
