import type { CacheTier } from './types.ts';

/**
 * Standard Time-To-Live (TTL) durations in seconds based on financial data volatility.
 */
export const TIER_TTLS: Record<CacheTier, number> = {
  /**
   * Static taxonomy, classification slugs, broker registry, and tags.
   * Changes rarely (weeks/months). Cached for 24 hours.
   */
  static: 24 * 60 * 60, // 86,400s (24 hours)

  /**
   * Fundamental financial data (quarterly financials, annual reports, shareholder breakdown, revenue segments).
   * Updated each quarter or end-of-day. Cached for 6 hours.
   */
  fundamental: 6 * 60 * 60, // 21,600s (6 hours)

  /**
   * Market movements, daily closes, top movers, traded volumes, broker summaries, foreign flows.
   * Changes throughout the trading day. Cached for 10 minutes.
   */
  market: 10 * 60, // 600s (10 minutes)

  /**
   * Fast-moving content: news articles, corporate filings, insider trading, suspensions.
   * Cached for 3 minutes.
   */
  realtime: 3 * 60, // 180s (3 minutes)
};

/**
 * Resolves effective TTL in seconds.
 * Priority: custom TTL > tier TTL > default market TTL (600s).
 */
export function resolveTtl(tier?: CacheTier, customTtl?: number): number {
  if (typeof customTtl === 'number' && customTtl >= 0) {
    return customTtl;
  }
  if (tier && tier in TIER_TTLS) {
    return TIER_TTLS[tier];
  }
  return TIER_TTLS.market;
}
