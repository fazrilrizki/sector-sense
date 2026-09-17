import type { CacheAdapter, CacheEntry } from './types.ts';

export class MemoryCacheAdapter implements CacheAdapter {
  public readonly name = 'memory';
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly tagIndex = new Map<string, Set<string>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    tags: string[] = []
  ): Promise<void> {
    // Evict oldest if exceeding max entries
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        await this.delete(oldestKey);
      }
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      cachedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      tags,
    };

    this.store.set(key, entry as CacheEntry<unknown>);

    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)?.add(key);
    }
  }

  async delete(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry?.tags) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.store.delete(key);
  }

  async invalidateTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      for (const key of keys) {
        this.store.delete(key);
      }
      this.tagIndex.delete(tag);
    }
  }

  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      this.store.clear();
      this.tagIndex.clear();
      return;
    }

    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        await this.delete(key);
      }
    }
  }

  /**
   * Helper to inspect the current cache size (useful in tests).
   */
  get size(): number {
    return this.store.size;
  }
}
