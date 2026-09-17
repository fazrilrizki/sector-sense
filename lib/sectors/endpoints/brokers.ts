import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  BrokerItem,
  TopBrokersParams,
  BrokerSummaryParams,
  TopBrokersSummaryParams,
  BrokerActivityParams,
  DailyTransactionParams,
  NetForeignFlowRow,
} from '../types.ts';
import { cleanSymbol } from './companies.ts';

export class BrokersClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Curated registry of IDX exchange-member brokers.
   * Endpoint: GET /v2/brokers/
   */
  async getRegistry(
    params?: { origin?: 'foreign' | 'domestic'; cohort?: string },
    options?: RequestOptions
  ): Promise<BrokerItem[]> {
    return this.transport.request<BrokerItem[]>(
      '/brokers',
      params as Record<string, unknown>,
      {
        tier: 'static',
        tags: ['brokers:registry'],
        ...options,
      }
    );
  }

  /**
   * Brokers ranked by gross trade value or absolute net flow for a single date.
   * Endpoint: GET /v2/brokers/top/
   */
  async getTopBrokers(
    params?: TopBrokersParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    return this.transport.request<Record<string, unknown>>(
      '/brokers/top',
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: ['brokers:top'],
        ...options,
      }
    );
  }

  /**
   * Per-broker daily trading rows for one ticker over a date range up to 14 days.
   * Endpoint: GET /v2/broker-summary/{symbol}/
   */
  async getSummaryBySymbol(
    symbol: string,
    params?: BrokerSummaryParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<Record<string, unknown>>(
      `/broker-summary/${clean}`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`broker-summary:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Top accumulating (net buy) and distributing (net sell) brokers for a ticker.
   * Endpoint: GET /v2/broker-summary/{symbol}/top/
   */
  async getTopBrokersBySymbol(
    symbol: string,
    params?: TopBrokersSummaryParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<Record<string, unknown>>(
      `/broker-summary/${clean}/top`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`broker-summary:${clean}`],
        ...options,
      }
    );
  }

  /**
   * All trading activity for one broker over a date range up to 14 days.
   * Endpoint: GET /v2/broker-activity/{broker_code}/
   */
  async getActivityByCode(
    brokerCode: string,
    params?: BrokerActivityParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const cleanCode = brokerCode.toUpperCase().trim();
    return this.transport.request<Record<string, unknown>>(
      `/broker-activity/${cleanCode}`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`broker-activity:${cleanCode}`],
        ...options,
      }
    );
  }

  /**
   * Stocks a broker has been most actively accumulating and distributing over a date range.
   * Endpoint: GET /v2/broker-activity/{broker_code}/top/
   */
  async getTopActivityByCode(
    brokerCode: string,
    params?: BrokerActivityParams,
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const cleanCode = brokerCode.toUpperCase().trim();
    return this.transport.request<Record<string, unknown>>(
      `/broker-activity/${cleanCode}/top`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`broker-activity:${cleanCode}`],
        ...options,
      }
    );
  }

  /**
   * Daily net foreign-broker inflow (IDR) for an IDX ticker (up to 90 days).
   * Positive value = net foreign buy; negative = net foreign sell.
   * Endpoint: GET /v2/foreign-flow/{symbol}/
   */
  async getForeignFlow(
    symbol: string,
    params?: DailyTransactionParams,
    options?: RequestOptions
  ): Promise<NetForeignFlowRow[]> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<NetForeignFlowRow[]>(
      `/foreign-flow/${clean}`,
      params as Record<string, unknown>,
      {
        tier: 'market',
        tags: [`foreign-flow:${clean}`, `company:${clean}`],
        ...options,
      }
    );
  }
}
