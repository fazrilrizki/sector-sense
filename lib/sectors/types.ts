/**
 * Domain TypeScript interfaces for Sectors Financial API (Indonesia / IDX).
 */

// ==========================================
// Screener Types
// ==========================================
export interface ScreenerParams {
  /**
   * Natural language query (e.g. "banks with market cap over 50T and PE under 15").
   * Note: Successful NL screens cost 3 credits.
   */
  q?: string;

  /**
   * Structured SQL-like where clause (e.g. "sub_sector = 'banks' and pb < 2").
   */
  where?: string;

  /**
   * Order by field with optional minus for desc (e.g. "-market_cap" or "pe").
   */
  order_by?: string;

  /**
   * Number of companies to return (1-100).
   */
  limit?: number;

  /**
   * Page number for pagination.
   */
  page?: number;
}

export interface ScreenerCompany {
  symbol: string;
  company_name: string;
  sub_sector?: string;
  industry?: string;
  market_cap?: number;
  last_close_price?: number;
  pe?: number | null;
  pb?: number | null;
  dividend_yield?: number | null;
  [key: string]: unknown;
}

export interface FreeFloatParams {
  sector?: string;
  sub_sector?: string;
  industry?: string;
}

export interface FreeFloatItem {
  symbol: string;
  company_name: string;
  free_float: number; // percentage, e.g. 45.2
  sub_sector?: string;
  shares_outstanding?: number;
}

// ==========================================
// Company & Report Types
// ==========================================
export type CompanyReportSection =
  | 'overview'
  | 'valuation'
  | 'future'
  | 'peers'
  | 'financials'
  | 'dividend'
  | 'management'
  | 'ownership';

export interface CompanyReportParams {
  /**
   * Comma-separated or array of sections to fetch (e.g. ['overview', 'valuation']).
   * Omitting fetches all sections.
   */
  sections?: CompanyReportSection[] | string;
}

export interface CompanyOverview {
  sector: string;
  sub_sector: string;
  industry?: string;
  market_cap: number;
  market_cap_rank?: number;
  employee_num?: number;
  listing_date?: string;
  last_close_price?: number;
  indices?: string[];
  website?: string;
  description?: string;
}

export interface CompanyValuation {
  pe?: number | null;
  pb?: number | null;
  ps?: number | null;
  ev_ebitda?: number | null;
  forward_pe?: number | null;
  peg?: number | null;
}

export interface CompanyReport {
  symbol: string;
  company_name: string;
  overview?: CompanyOverview;
  valuation?: CompanyValuation;
  future?: Record<string, unknown>;
  peers?: Array<{ symbol: string; company_name: string; market_cap?: number }>;
  financials?: Record<string, unknown>;
  dividend?: {
    historical_dividends?: Record<string, unknown>;
    dividend_ttm?: number;
    payout_ratio?: number;
    dividend_yield?: number;
  };
  management?: Record<string, unknown>;
  ownership?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface QuarterlyFinancialsParams {
  n_quarters?: number;
  report_date?: string; // YYYY-MM-DD
}

export interface QuarterlyFinancialRow {
  report_date: string;
  quarter: string;
  revenue?: number;
  gross_profit?: number;
  operating_income?: number;
  net_income?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
  operating_cash_flow?: number;
  net_interest_income?: number; // for banking sector
  gross_loan?: number; // for banking sector
  total_deposit?: number; // for banking sector
  [key: string]: unknown;
}

export interface CorporateActionItem {
  action_type: string; // 'dividend' | 'split' | 'rights' | 'warrant' | 'agm'
  date: string;
  description?: string;
  ratio?: string;
  amount?: number;
}

export interface ShareholderCategory {
  category: string;
  shares: number;
  percentage: number;
  holder_type?: 'domestic' | 'foreign';
}

export interface ShareholdersComposition {
  symbol: string;
  year: number;
  month?: number;
  data: ShareholderCategory[];
}

export interface RevenueSegmentItem {
  segment_name: string;
  revenue: number;
  percentage?: number;
  financial_year: number;
}

export interface ListingPerformance {
  symbol: string;
  listing_date: string;
  ipo_price: number;
  changes: {
    '7d'?: number;
    '30d'?: number;
    '90d'?: number;
    '365d'?: number;
    since_ipo?: number;
  };
}

// ==========================================
// Transaction & Market Types
// ==========================================
export interface DailyTransactionParams {
  start?: string; // YYYY-MM-DD (up to 90 days range)
  end?: string; // YYYY-MM-DD
}

export interface DailyTransactionRow {
  date: string;
  close: number;
  volume: number;
  market_cap?: number;
}

export interface UniverseCloseRow {
  symbol: string;
  company_name?: string;
  close: number;
  volume?: number;
  market_cap?: number;
  change?: number;
  change_percentage?: number;
}

export interface MarketCapHistoryRow {
  date: string;
  market_cap: number;
}

export interface IndexDailyRow {
  date: string;
  index_code: string;
  close: number;
  change?: number;
  change_percentage?: number;
}

// ==========================================
// Broker Types
// ==========================================
export interface BrokerItem {
  code: string;
  name: string;
  origin: 'foreign' | 'domestic';
  cohort: 'retail' | 'mixed' | 'institutional' | 'unknown';
  license_type?: string;
}

export interface TopBrokersParams {
  date?: string; // YYYY-MM-DD
  metric?: 'gross' | 'net';
  n_brokers?: number;
  origin?: 'foreign' | 'domestic';
  cohort?: 'retail' | 'mixed' | 'institutional' | 'unknown';
}

export interface BrokerSummaryParams {
  broker_code?: string;
  start?: string; // YYYY-MM-DD (up to 14 days)
  end?: string;
}

export interface TopBrokersSummaryParams {
  start?: string; // YYYY-MM-DD (up to 14 days)
  end?: string;
  n_brokers?: number;
}

export interface BrokerActivityParams {
  symbol?: string;
  start?: string; // YYYY-MM-DD (up to 14 days)
  end?: string;
}

export interface NetForeignFlowRow {
  date: string;
  net_foreign_inflow: number; // positive = net buy, negative = net sell
  foreign_buy?: number;
  foreign_sell?: number;
}

// ==========================================
// Rankings & Movers Types
// ==========================================
export type ClassificationType = 'top_gainers' | 'top_losers';
export type PeriodType = '1d' | '7d' | '14d' | '30d' | '365d';

export interface TopChangesParams {
  classifications?: ClassificationType | ClassificationType[];
  periods?: PeriodType | PeriodType[];
  sub_sector?: string;
  n_stock?: number;
}

export interface MostTradedParams {
  start?: string; // YYYY-MM-DD (up to 90 days)
  end?: string;
  sub_sector?: string;
  n_stock?: number;
}

// ==========================================
// News & Filings Types
// ==========================================
export interface NewsParams {
  symbols?: string | string[];
  sector?: string;
  sub_sector?: string;
  tags?: string | string[];
  keyword?: string;
  start?: string;
  end?: string;
  page?: number;
}

export interface NewsArticle {
  id: string | number;
  title: string;
  url: string;
  source: string;
  publish_date: string;
  summary?: string;
  tags?: string[];
  symbols?: string[];
}

export interface FilingsParams {
  symbol?: string;
  sector?: string;
  sub_sector?: string;
  transaction_type?: 'buy' | 'sell';
  holder_type?: 'insider' | 'major_shareholder';
  start?: string;
  end?: string;
  page?: number;
}

export interface FilingItem {
  symbol: string;
  holder_name: string;
  holder_type: string;
  transaction_type: 'buy' | 'sell';
  shares_traded: number;
  price_per_share: number;
  date: string;
  percentage_after?: number;
}

export interface SuspensionParams {
  symbol?: string;
  start?: string;
  end?: string;
  page?: number;
}

export interface SuspensionItem {
  symbol: string;
  date: string;
  reason: string;
  pdf_url?: string;
  status?: string;
}

// ==========================================
// Helper Lists Types
// ==========================================
export interface SectorSubsectorPair {
  sector: string;
  sub_sector: string;
}

export interface SubsectorIndustryPair {
  sub_sector: string;
  industry: string;
}

export interface IndustrySubindustryPair {
  industry: string;
  sub_industry: string;
}

export interface CompanyQuarterlyDateItem {
  symbol: string;
  report_date: string;
  quarter: string;
  year: number;
}
