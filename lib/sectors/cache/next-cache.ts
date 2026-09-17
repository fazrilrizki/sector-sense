/**
 * Helper to integrate with Next.js Data Cache (unstable_cache)
 * when running inside Next.js App Router server runtime.
 */

export interface NextCacheOptions {
  tags?: string[];
  revalidate?: number | false;
}

/**
 * Conditionally executes an operation wrapped in Next.js unstable_cache if available.
 * If running outside Next.js runtime (e.g. Node tests, CLI scripts), executes the fetcher directly.
 */
export async function withNextDataCache<T>(
  fetcher: () => Promise<T>,
  keyParts: string[],
  options?: NextCacheOptions
): Promise<T> {
  try {
    // Dynamic import to prevent crashing in standalone Node environments
    const { unstable_cache } = await import('next/cache');
    if (typeof unstable_cache === 'function') {
      const cachedFn = unstable_cache(fetcher, keyParts, {
        tags: options?.tags,
        revalidate: options?.revalidate,
      });
      return await cachedFn();
    }
  } catch {
    // Fallback: outside Next.js server runtime
  }

  return await fetcher();
}
