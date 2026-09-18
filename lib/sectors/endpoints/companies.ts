import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  CompanyReport,
  CompanyReportParams,
  QuarterlyFinancialsParams,
  QuarterlyFinancialRow,
  CorporateActionItem,
  ShareholdersComposition,
  RevenueSegmentItem,
  ListingPerformance,
} from '../types.ts';

/**
 * Normalizes IDX symbol (e.g. "bbca.jk" -> "BBCA").
 */
export function cleanSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/\.JK$/i, '').trim();
}

export class CompaniesClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Comprehensive company report with selectable sections.
   * Endpoint: GET /v2/company/report/{symbol}/
   * Default sections: overview, valuation, future, peers, financials, dividend, management, ownership.
   */
  async getReport(
    symbol: string,
    params?: CompanyReportParams,
    options?: RequestOptions
  ): Promise<CompanyReport> {
    const clean = cleanSymbol(symbol);
    const query: Record<string, unknown> = {};

    if (params?.sections) {
      query.sections = Array.isArray(params.sections)
        ? params.sections.join(',')
        : params.sections;
    }

    return this.transport.request<CompanyReport>(
      `/company/report/${clean}`,
      query,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`, `report:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Quarterly income statement, balance sheet, and sector-specific financial metrics.
   * Endpoint: GET /v2/financials/quarterly/{symbol}/
   */
  async getQuarterlyFinancials(
    symbol: string,
    params?: QuarterlyFinancialsParams,
    options?: RequestOptions
  ): Promise<QuarterlyFinancialRow[]> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<QuarterlyFinancialRow[]>(
      `/financials/quarterly/${clean}`,
      params as Record<string, unknown>,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`, `financials:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Available quarterly report dates for a symbol.
   * Endpoint: GET /v2/company/get_quarterly_financial_dates/{symbol}/
   */
  async getQuarterlyDates(
    symbol: string,
    options?: RequestOptions
  ): Promise<string[] | Record<string, string[]>> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<string[] | Record<string, string[]>>(
      `/company/get_quarterly_financial_dates/${clean}`,
      undefined,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Corporate actions: dividends, stock splits, rights issues, warrants, AGM.
   * Endpoint: GET /v2/company/corporate-actions/{symbol}/
   */
  async getCorporateActions(
    symbol: string,
    options?: RequestOptions
  ): Promise<CorporateActionItem[]> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<CorporateActionItem[]>(
      `/company/corporate-actions/${clean}`,
      undefined,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`, `actions:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Monthly shareholder composition broken down by domestic and foreign categories.
   * Endpoint: GET /v2/company/shareholders-composition/{symbol}/
   */
  async getShareholders(
    symbol: string,
    year?: number,
    options?: RequestOptions
  ): Promise<ShareholdersComposition> {
    const clean = cleanSymbol(symbol);
    const query = year ? { year } : undefined;
    return this.transport.request<ShareholdersComposition>(
      `/company/shareholders-composition/${clean}`,
      query,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`, `shareholders:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Revenue and cost segment breakdown for a company.
   * Endpoint: GET /v2/company/get-segments/{symbol}/
   */
  async getSegments(
    symbol: string,
    year?: number,
    options?: RequestOptions
  ): Promise<RevenueSegmentItem[]> {
    const clean = cleanSymbol(symbol);
    const query = year ? { year } : undefined;
    return this.transport.request<RevenueSegmentItem[]>(
      `/company/get-segments/${clean}`,
      query,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`, `segments:${clean}`],
        ...options,
      }
    );
  }

  /**
   * Actual return percentages since listing date across 7d, 30d, 90d, and 365d windows.
   * Endpoint: GET /v2/listing-performance/{symbol}/
   */
  async getListingPerformance(
    symbol: string,
    options?: RequestOptions
  ): Promise<ListingPerformance> {
    const clean = cleanSymbol(symbol);
    return this.transport.request<ListingPerformance>(
      `/listing-performance/${clean}`,
      undefined,
      {
        tier: 'fundamental',
        tags: [`company:${clean}`],
        ...options,
      }
    );
  }
}
