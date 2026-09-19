# Backend & Services Architecture Guidelines

## 1. Service Layer Structure (`lib/services/`)
- All business logic and external API aggregations MUST be written as pure server-side utility functions inside the `lib/services/` directory.
- Avoid placing heavy business logic directly inside React Server Components (RSC) or Route Handlers (`app/api/...`). Keep them thin and delegate to `lib/services/`.
- Only expose a service as an HTTP Route Handler (`app/api/`) if it is explicitly required to be called from the client-side browser or a webhook. 

## 2. Data Normalization & Resiliency
- Services that pull data from external APIs (like Sectors API) must process, clean, and normalize the data into well-typed interfaces before returning them.
- Do not blindly pass raw, deeply nested external payloads to the front-end components. Group fields logically (e.g., `balanceSheet`, `incomeStatement`).
- Always implement custom Error classes (e.g., `SectorsAPIError`, `ServiceError`) for predictable error handling and catching by the caller.

## 3. Caching Strategy
- Leverage Upstash Redis via the `@upstash/redis` client for caching computationally heavy or rate-limited API responses.
- Define a logical cache key structure (e.g., `namespace:entity:identifier`).
- Set appropriate TTLs based on data volatility (e.g., 24 hours for financial reports, 5 minutes for realtime data).
- Handle cache bypass gracefully in environments where Redis credentials are not provided (e.g., CI/CD or local tests).

## 4. Testing
- Every service must have a corresponding test file in the `tests/` directory (e.g., `tests/financials-service.test.mjs`).
- Use `node:test` and `node:assert/strict`.
- Mock external dependencies (like `globalThis.fetch`) to simulate both successful normalization and error/edge cases.
