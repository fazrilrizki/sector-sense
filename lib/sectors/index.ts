/**
 * Sectors Financial API Client Module for Sector Sense.
 *
 * Provides an isolated, type-safe client for consuming the Sectors REST v2 API
 * and Sectors MCP Streamable HTTP server, integrated with multi-tier caching
 * (Upstash Redis, Next.js Data Cache, and In-Memory fallback).
 */

export type * from './types.ts';
export type * from './core/types.ts';
export * from './core/errors.ts';
export type * from './cache/types.ts';
export * from './cache/tiers.ts';
export * from './cache/memory.ts';
export * from './cache/upstash.ts';
export * from './cache/next-cache.ts';
export { buildCacheKey, normalizeParams, CacheManager } from './cache/index.ts';

export { ScreenerClient } from './endpoints/screener.ts';
export { CompaniesClient, cleanSymbol } from './endpoints/companies.ts';
export { TransactionsClient } from './endpoints/transactions.ts';
export { BrokersClient } from './endpoints/brokers.ts';
export { RankingsClient } from './endpoints/rankings.ts';
export { NewsClient } from './endpoints/news.ts';
export { HelpersClient } from './endpoints/helpers.ts';
export type * from './mcp/types.ts';
export { SectorsMcpClient } from './mcp/client.ts';

export { SectorsClient, sectors } from './client.ts';
