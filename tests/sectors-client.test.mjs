import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MemoryCacheAdapter,
  resolveTtl,
  TIER_TTLS,
  normalizeParams,
  buildCacheKey,
  cleanSymbol,
  SectorsClient,
  SectorsAuthError,
  SectorsNotFoundError,
  SectorsRateLimitError,
  SectorsValidationError,
  SectorsError,
} from '../lib/sectors/index.ts';

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 1. MemoryCacheAdapter Tests
// ==========================================
test('MemoryCacheAdapter: store, retrieve, and delete item', async () => {
  const cache = new MemoryCacheAdapter(100);

  // Initially empty
  const missing = await cache.get('test:item1');
  assert.strictEqual(missing, null);

  // Store item
  await cache.set(
    'test:item1',
    { name: 'Bank Central Asia', ticker: 'BBCA' },
    60
  );

  // Retrieve item
  const retrieved = await cache.get('test:item1');
  assert.deepStrictEqual(retrieved, {
    name: 'Bank Central Asia',
    ticker: 'BBCA',
  });

  // Delete item
  await cache.delete('test:item1');
  const afterDelete = await cache.get('test:item1');
  assert.strictEqual(afterDelete, null);
});

test('MemoryCacheAdapter: respects TTL expiry', async () => {
  const cache = new MemoryCacheAdapter(100);

  // 100ms TTL
  await cache.set('test:expires', 'temp-val', 0.1);

  // Immediate check
  const valBefore = await cache.get('test:expires');
  assert.strictEqual(valBefore, 'temp-val');

  // Wait for expiry
  await sleep(150);

  const valAfter = await cache.get('test:expires');
  assert.strictEqual(valAfter, null);
});

test('MemoryCacheAdapter: tag invalidation removes all tagged keys', async () => {
  const cache = new MemoryCacheAdapter(100);

  await cache.set('report:BBCA', { symbol: 'BBCA' }, 60, ['company:BBCA']);
  await cache.set('daily:BBCA', [1, 2, 3], 60, ['company:BBCA']);
  await cache.set('report:BMRI', { symbol: 'BMRI' }, 60, ['company:BMRI']);

  assert.notStrictEqual(await cache.get('report:BBCA'), null);
  assert.notStrictEqual(await cache.get('daily:BBCA'), null);
  assert.notStrictEqual(await cache.get('report:BMRI'), null);

  // Invalidate company:BBCA
  await cache.invalidateTag('company:BBCA');

  assert.strictEqual(await cache.get('report:BBCA'), null);
  assert.strictEqual(await cache.get('daily:BBCA'), null);
  // BMRI remains intact
  assert.deepStrictEqual(await cache.get('report:BMRI'), { symbol: 'BMRI' });
});

test('MemoryCacheAdapter: clear with prefix', async () => {
  const cache = new MemoryCacheAdapter(100);

  await cache.set('sectors:report:1', 'val1', 60);
  await cache.set('sectors:daily:1', 'val2', 60);
  await cache.set('other:key:1', 'val3', 60);

  await cache.clear('sectors:');

  assert.strictEqual(await cache.get('sectors:report:1'), null);
  assert.strictEqual(await cache.get('sectors:daily:1'), null);
  assert.strictEqual(await cache.get('other:key:1'), 'val3');
});

// ==========================================
// 2. Cache Key Normalization & Tiers Tests
// ==========================================
test('normalizeParams: deterministic key generation regardless of parameter order', () => {
  const paramsA = { b: 2, a: 1, c: 'test' };
  const paramsB = { a: 1, c: 'test', b: 2 };

  const normA = normalizeParams(paramsA);
  const normB = normalizeParams(paramsB);

  assert.strictEqual(normA, 'a=1&b=2&c=test');
  assert.strictEqual(normA, normB);

  const keyA = buildCacheKey('/company/report/BBCA/', paramsA);
  const keyB = buildCacheKey('company/report/BBCA', paramsB);
  assert.strictEqual(keyA, keyB);
  assert.strictEqual(keyA, 'sectors:v2:company/report/BBCA?a=1&b=2&c=test');
});

test('resolveTtl: correctly maps tiers and respects custom TTL', () => {
  assert.strictEqual(resolveTtl('static'), TIER_TTLS.static); // 86400
  assert.strictEqual(resolveTtl('fundamental'), TIER_TTLS.fundamental); // 21600
  assert.strictEqual(resolveTtl('market'), TIER_TTLS.market); // 600
  assert.strictEqual(resolveTtl('realtime'), TIER_TTLS.realtime); // 180

  // Custom TTL overrides tier
  assert.strictEqual(resolveTtl('static', 120), 120);
  assert.strictEqual(resolveTtl(undefined, 45), 45);
});

test('cleanSymbol: normalizes IDX ticker representations', () => {
  assert.strictEqual(cleanSymbol('bbca.jk'), 'BBCA');
  assert.strictEqual(cleanSymbol('BBCA.JK'), 'BBCA');
  assert.strictEqual(cleanSymbol('  bmri  '), 'BMRI');
  assert.strictEqual(cleanSymbol('TLKM'), 'TLKM');
});

// ==========================================
// 3. SectorsClient Facade & Caching Behavior
// ==========================================
test('SectorsClient: initialized with all sub-clients', () => {
  const client = new SectorsClient({
    apiKey: 'test-key',
    cache: { adapter: 'memory' },
  });

  assert.ok(client.screener);
  assert.ok(client.companies);
  assert.ok(client.transactions);
  assert.ok(client.brokers);
  assert.ok(client.rankings);
  assert.ok(client.news);
  assert.ok(client.helpers);
  assert.ok(client.mcp);
  assert.ok(client.cache);
  assert.ok(client.transport);
});

test('SectorsClient: automatic cache hit/miss and skipCache behavior', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;

  const mockResponseData = {
    symbol: 'BBCA.JK',
    company_name: 'PT Bank Central Asia Tbk.',
    overview: { sector: 'Financials' },
  };

  globalThis.fetch = async (url, init) => {
    fetchCallCount++;
    assert.strictEqual(init.headers['Authorization'], 'test-api-key');
    return {
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    };
  };

  try {
    const client = new SectorsClient({
      apiKey: 'test-api-key',
      cache: { adapter: 'memory' },
    });

    // 1st request: Cache Miss -> calls fetch
    const firstCall = await client.companies.getReport('BBCA');
    assert.deepStrictEqual(firstCall, mockResponseData);
    assert.strictEqual(fetchCallCount, 1);

    // 2nd request: Cache Hit -> returns from memory cache without calling fetch
    const secondCall = await client.companies.getReport('BBCA');
    assert.deepStrictEqual(secondCall, mockResponseData);
    assert.strictEqual(fetchCallCount, 1); // Not incremented!

    // 3rd request with skipCache: true -> bypasses cache and calls fetch
    const thirdCall = await client.companies.getReport('BBCA', undefined, {
      skipCache: true,
    });
    assert.deepStrictEqual(thirdCall, mockResponseData);
    assert.strictEqual(fetchCallCount, 2); // Incremented!

    // 4th request with forceRefresh: true -> calls fetch and updates cache
    const fourthCall = await client.companies.getReport('BBCA', undefined, {
      forceRefresh: true,
    });
    assert.deepStrictEqual(fourthCall, mockResponseData);
    assert.strictEqual(fetchCallCount, 3); // Incremented!
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 4. Resiliency, Rate Limit & Error Handling Tests
// ==========================================
test('SectorsClient: handles 401 Unauthorized with SectorsAuthError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Invalid API Key' }),
  });

  try {
    const client = new SectorsClient({
      apiKey: 'invalid-key',
      cache: { adapter: 'memory' },
    });

    await assert.rejects(
      async () =>
        await client.companies.getReport('BBCA', undefined, {
          skipCache: true,
        }),
      (err) => err instanceof SectorsAuthError && err.status === 401
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SectorsClient: handles 404 Not Found with SectorsNotFoundError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ detail: 'Not Found' }),
  });

  try {
    const client = new SectorsClient({
      apiKey: 'test-key',
      cache: { adapter: 'memory' },
    });

    await assert.rejects(
      async () =>
        await client.companies.getReport('NONEXISTENT', undefined, {
          skipCache: true,
        }),
      (err) => err instanceof SectorsNotFoundError && err.status === 404
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SectorsClient: handles 429 Too Many Requests with retries and exponential backoff', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts++;
    if (attempts < 3) {
      return {
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '0' }),
        json: async () => ({ detail: 'Too many requests' }),
      };
    }
    // 3rd attempt succeeds!
    return {
      ok: true,
      status: 200,
      json: async () => [{ symbol: 'BBCA', close: 9500 }],
    };
  };

  try {
    const client = new SectorsClient({
      apiKey: 'test-key',
      maxRetries: 3,
      initialRetryDelayMs: 20, // Fast for tests
      cache: { adapter: 'memory' },
    });

    const result = await client.transactions.getDaily('BBCA', undefined, {
      skipCache: true,
    });
    assert.strictEqual(attempts, 3);
    assert.deepStrictEqual(result, [{ symbol: 'BBCA', close: 9500 }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 5. Model Context Protocol (MCP) Client Tests
// ==========================================
test('SectorsMcpClient: JSON-RPC listTools and callTool formatting', async () => {
  const originalFetch = globalThis.fetch;
  const capturedRequests = [];

  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    capturedRequests.push({ url, headers: init.headers, body });

    if (body.method === 'tools/list') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            tools: [
              {
                name: 'fetch-company-report',
                description: 'Full company report',
                inputSchema: {
                  type: 'object',
                  properties: { ticker: { type: 'string' } },
                },
              },
            ],
          },
        }),
      };
    }

    if (body.method === 'tools/call') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  symbol: 'BBCA.JK',
                  overview: { sector: 'Financials' },
                }),
              },
            ],
            isError: false,
          },
        }),
      };
    }

    throw new Error(`Unexpected method ${body.method}`);
  };

  try {
    const client = new SectorsClient({
      apiKey: 'mcp-secret-key',
      cache: { adapter: 'memory' },
    });

    // Test listTools
    const tools = await client.mcp.listTools({ skipCache: true });
    assert.strictEqual(tools.length, 1);
    assert.strictEqual(tools[0].name, 'fetch-company-report');
    assert.strictEqual(
      capturedRequests[0].headers['Authorization'],
      'Bearer mcp-secret-key'
    );
    assert.strictEqual(capturedRequests[0].body.method, 'tools/list');

    // Test callToolAndParseJson
    const report = await client.mcp.callToolAndParseJson(
      'fetch-company-report',
      { ticker: 'BBCA' },
      { skipCache: true }
    );
    assert.strictEqual(report.symbol, 'BBCA.JK');
    assert.strictEqual(report.overview.sector, 'Financials');
    assert.strictEqual(capturedRequests[1].body.method, 'tools/call');
    assert.strictEqual(
      capturedRequests[1].body.params.name,
      'fetch-company-report'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
