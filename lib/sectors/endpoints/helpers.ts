import { HttpTransport } from '../core/transport.ts';
import type { RequestOptions } from '../core/types.ts';
import type {
  SectorSubsectorPair,
  SubsectorIndustryPair,
  IndustrySubindustryPair,
  CompanyQuarterlyDateItem,
} from '../types.ts';

export class HelpersClient {
  private readonly transport: HttpTransport;

  constructor(transport: HttpTransport) {
    this.transport = transport;
  }

  /**
   * Returns all available sector/subsector pairs as kebab-case slugs.
   * Endpoint: GET /v2/subsectors/
   */
  async getSubsectors(
    options?: RequestOptions
  ): Promise<SectorSubsectorPair[]> {
    return this.transport.request<SectorSubsectorPair[]>(
      '/subsectors',
      undefined,
      {
        tier: 'static',
        tags: ['helpers:subsectors'],
        ...options,
      }
    );
  }

  /**
   * Returns all available subsector/industry pairs as kebab-case slugs.
   * Endpoint: GET /v2/industries/
   */
  async getIndustries(
    options?: RequestOptions
  ): Promise<SubsectorIndustryPair[]> {
    return this.transport.request<SubsectorIndustryPair[]>(
      '/industries',
      undefined,
      {
        tier: 'static',
        tags: ['helpers:industries'],
        ...options,
      }
    );
  }

  /**
   * Returns all available industry/sub-industry pairs as kebab-case slugs.
   * Endpoint: GET /v2/subindustries/
   */
  async getSubindustries(
    options?: RequestOptions
  ): Promise<IndustrySubindustryPair[]> {
    return this.transport.request<IndustrySubindustryPair[]>(
      '/subindustries',
      undefined,
      {
        tier: 'static',
        tags: ['helpers:subindustries'],
        ...options,
      }
    );
  }

  /**
   * Returns all available tag slugs used across news and company filings.
   * Endpoint: GET /v2/tags/
   */
  async getTags(options?: RequestOptions): Promise<string[]> {
    return this.transport.request<string[]>('/tags', undefined, {
      tier: 'static',
      tags: ['helpers:tags'],
      ...options,
    });
  }

  /**
   * Returns dictionary of all companies having revenue and cost segment data available.
   * Endpoint: GET /v2/companies/list_companies_with_segments/
   */
  async getCompaniesWithSegments(
    options?: RequestOptions
  ): Promise<Record<string, number[]>> {
    return this.transport.request<Record<string, number[]>>(
      '/companies/list_companies_with_segments',
      undefined,
      {
        tier: 'static',
        tags: ['helpers:segments-list'],
        ...options,
      }
    );
  }

  /**
   * Returns latest available quarterly report date for every IDX company in one feed.
   * Endpoint: GET /v2/companies/quarterly-financial-dates/
   */
  async getLatestQuarterlyDates(
    params?: { since?: string; year?: number },
    options?: RequestOptions
  ): Promise<CompanyQuarterlyDateItem[]> {
    return this.transport.request<CompanyQuarterlyDateItem[]>(
      '/companies/quarterly-financial-dates',
      params as Record<string, unknown>,
      {
        tier: 'fundamental',
        tags: ['helpers:latest-quarterly-dates'],
        ...options,
      }
    );
  }

  /**
   * Comprehensive subsector report organized into distinct sections.
   * Endpoint: GET /v2/subsector/report/{sub_sector}/
   */
  async getSubsectorReport(
    subsector: string,
    params?: { sections?: string[] | string },
    options?: RequestOptions
  ): Promise<Record<string, unknown>> {
    const cleanSlug = subsector.toLowerCase().trim();
    const query: Record<string, unknown> = {};
    if (params?.sections) {
      query.sections = Array.isArray(params.sections)
        ? params.sections.join(',')
        : params.sections;
    }

    return this.transport.request<Record<string, unknown>>(
      `/subsector/report/${cleanSlug}`,
      query,
      {
        tier: 'fundamental',
        tags: [`subsector:${cleanSlug}`],
        ...options,
      }
    );
  }
}
