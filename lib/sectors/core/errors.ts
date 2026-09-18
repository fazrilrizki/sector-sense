/**
 * Custom error classes for Sectors Financial API client.
 */

export class SectorsError extends Error {
  public readonly status?: number;
  public readonly endpoint?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status?: number,
    endpoint?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'SectorsError';
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 401 Unauthorized or 403 Forbidden - Missing or invalid API key.
 */
export class SectorsAuthError extends SectorsError {
  constructor(
    message = 'Invalid or missing Sectors Financial API key.',
    endpoint?: string
  ) {
    super(message, 401, endpoint);
    this.name = 'SectorsAuthError';
  }
}

/**
 * 404 Not Found - Ticker symbol or resource does not exist on IDX.
 */
export class SectorsNotFoundError extends SectorsError {
  constructor(
    message = 'Requested IDX resource or symbol not found.',
    endpoint?: string
  ) {
    super(message, 404, endpoint);
    this.name = 'SectorsNotFoundError';
  }
}

/**
 * 429 Too Many Requests - Rate limit or quota exhausted.
 */
export class SectorsRateLimitError extends SectorsError {
  public readonly retryAfterSeconds?: number;

  constructor(
    message = 'Sectors API rate limit exceeded. Please retry later.',
    endpoint?: string,
    retryAfterSeconds?: number
  ) {
    super(message, 429, endpoint);
    this.name = 'SectorsRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * 400 Bad Request - Malformed parameters or invalid filter query.
 */
export class SectorsValidationError extends SectorsError {
  constructor(message: string, endpoint?: string, details?: unknown) {
    super(message, 400, endpoint, details);
    this.name = 'SectorsValidationError';
  }
}

/**
 * 5xx Server Error - Upstream Sectors API server issue.
 */
export class SectorsServerError extends SectorsError {
  constructor(
    message = 'Upstream Sectors API server error.',
    status = 500,
    endpoint?: string
  ) {
    super(message, status, endpoint);
    this.name = 'SectorsServerError';
  }
}
