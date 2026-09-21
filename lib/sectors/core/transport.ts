import { CacheManager } from '../cache/index.ts';
import type { RequestOptions, SectorsClientConfig } from './types.ts';
import {
  SectorsError,
  SectorsAuthError,
  SectorsNotFoundError,
  SectorsRateLimitError,
  SectorsValidationError,
  SectorsServerError,
} from './errors.ts';

export class HttpTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialRetryDelayMs: number;
  public readonly cacheManager: CacheManager;

  constructor(config?: SectorsClientConfig, cacheManager?: CacheManager) {
    this.apiKey = config?.apiKey || process.env.SECTORS_API_KEY || '';
    this.baseUrl = (
      config?.baseUrl ||
      process.env.SECTORS_API_BASE_URL ||
      'https://api.sectors.app/v2'
    ).replace(/\/+$/, '');
    this.defaultTimeoutMs = config?.timeoutMs ?? 15_000;
    this.maxRetries = config?.maxRetries ?? 3;
    this.initialRetryDelayMs = config?.initialRetryDelayMs ?? 1_000;

    this.cacheManager =
      cacheManager ||
      new CacheManager({
        adapter: config?.cache?.adapter,
        upstashUrl: config?.cache?.upstashUrl,
        upstashToken: config?.cache?.upstashToken,
        keyPrefix: config?.cache?.keyPrefix,
      });
  }

  /**
   * Helper to sleep for a specified duration in milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Constructs a fully qualified URL for the given endpoint and query parameters.
   */
  buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    // Ensure leading slash and trailing slash per Sectors API convention
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (!cleanEndpoint.endsWith('/')) {
      cleanEndpoint = `${cleanEndpoint}/`;
    }

    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      }
    }

    return url.toString();
  }

  /**
   * Performs an authenticated HTTP request with automatic caching and retry resilience.
   */
  async request<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const { interceptRequest } = await import('./mockInterceptor.ts');
    
    return this.cacheManager.getOrSet<T>(
      endpoint,
      params,
      () => interceptRequest(
        this.buildUrl(endpoint, params),
        () => this.executeWithRetry<T>(endpoint, params, options)
      ),
      options
    );
  }

  /**
   * Executes fetch with exponential backoff for 429 and transient 5xx errors.
   */
  private async executeWithRetry<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const retries = options?.retries ?? this.maxRetries;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const url = this.buildUrl(endpoint, params);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...options?.headers,
        };

        if (this.apiKey) {
          headers['Authorization'] = this.apiKey;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Success response
        if (response.ok) {
          return (await response.json()) as T;
        }

        // Handle specific status codes
        const status = response.status;
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text();
        }

        if (status === 401 || status === 403) {
          throw new SectorsAuthError(
            'Unauthorized: Please provide a valid SECTORS_API_KEY.',
            endpoint
          );
        }

        if (status === 404) {
          throw new SectorsNotFoundError(
            `Resource not found for endpoint "${endpoint}".`,
            endpoint
          );
        }

        if (status === 400) {
          const message =
            typeof responseBody === 'object' &&
            responseBody !== null &&
            'detail' in responseBody
              ? String((responseBody as { detail: unknown }).detail)
              : typeof responseBody === 'string'
                ? responseBody
                : 'Bad Request to Sectors API';
          throw new SectorsValidationError(message, endpoint, responseBody);
        }

        // Rate Limit (429) or Transient Server Error (502, 503, 504)
        if (
          status === 429 ||
          status === 502 ||
          status === 503 ||
          status === 504
        ) {
          const retryAfterHeader = response.headers.get('Retry-After');
          let delayMs = this.initialRetryDelayMs * Math.pow(2, attempt);

          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
              delayMs = parsedSeconds * 1000;
            }
          }

          // Add jitter (+- 15%)
          const jitter = delayMs * 0.15 * (Math.random() * 2 - 1);
          const finalDelay = Math.max(100, Math.round(delayMs + jitter));

          if (attempt < retries) {
            console.warn(
              `[SectorsClient] Status ${status} on ${endpoint}. Retrying attempt ${attempt + 1}/${retries} in ${finalDelay}ms...`
            );
            await this.sleep(finalDelay);
            continue;
          }

          if (status === 429) {
            throw new SectorsRateLimitError(
              'Sectors API rate limit reached after retries.',
              endpoint,
              Math.round(finalDelay / 1000)
            );
          }

          throw new SectorsServerError(
            `Upstream Sectors API server error (${status}) after ${retries} retries.`,
            status,
            endpoint
          );
        }

        // Other unhandled errors
        throw new SectorsError(
          `Sectors API error (${status}): ${JSON.stringify(responseBody)}`,
          status,
          endpoint,
          responseBody
        );
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError = err as Error;

        if (lastError.name === 'AbortError') {
          lastError = new SectorsError(
            `Request to Sectors API timed out after ${timeoutMs}ms.`,
            408,
            endpoint
          );
        }

        // If it's a permanent error (Auth, NotFound, Validation), do not retry
        if (
          lastError instanceof SectorsAuthError ||
          lastError instanceof SectorsNotFoundError ||
          lastError instanceof SectorsValidationError
        ) {
          throw lastError;
        }

        // Network error retry
        if (attempt < retries) {
          const delay = this.initialRetryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw (
      lastError ||
      new SectorsError('Unknown error occurred during request execution.')
    );
  }
}
