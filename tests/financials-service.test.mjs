import test from 'node:test';
import assert from 'node:assert/strict';

// Set up mock environment variables before importing anything
process.env.SECTORS_API_KEY = 'test-api-key';
// Do not set UPSTASH vars so it bypasses Redis caching for simplicity in unit tests

import { getNormalizedFinancials, SectorsAPIError } from '../lib/services/financials.ts';

test('getNormalizedFinancials: successfully normalizes raw data from Sectors API', async () => {
  const originalFetch = globalThis.fetch;
  
  // Mock Sectors API response
  const mockRawData = [
    {
      report_date: "2023-12-31",
      quarter: "Q4",
      year: 2023,
      revenue: 1000000,
      gross_profit: 500000,
      net_income: 200000,
      total_assets: 5000000,
      total_liabilities: 2500000,
      total_equity: 2500000,
      operating_cash_flow: 300000,
      some_other_metric: 42
    },
    {
      report_date: "2023-09-30",
      quarter: "Q3",
      year: 2023,
      revenue: 900000,
      net_income: 150000,
      total_assets: 4800000
    }
  ];

  globalThis.fetch = async (url, init) => {
    // Basic verification of the fetch call
    assert.ok(url.toString().includes('/financials/quarterly/BBCA'));
    return {
      ok: true,
      status: 200,
      json: async () => mockRawData,
    };
  };

  try {
    const result = await getNormalizedFinancials('BBCA');
    
    // Assert Symbol
    assert.strictEqual(result.symbol, 'BBCA');
    
    // Assert Quarterly Data Array Length
    assert.strictEqual(result.quarterly.length, 2);
    
    const q4 = result.quarterly[0];
    
    // Assert Base fields
    assert.strictEqual(q4.year, 2023);
    assert.strictEqual(q4.quarter, 4); // parsed from "Q4"
    assert.strictEqual(q4.date, "2023-12-31");
    
    // Assert Balance Sheet grouping
    assert.strictEqual(q4.balanceSheet.total_assets, 5000000);
    assert.strictEqual(q4.balanceSheet.total_liabilities, 2500000);
    assert.strictEqual(q4.balanceSheet.total_equity, 2500000);
    
    // Assert Income Statement grouping
    assert.strictEqual(q4.incomeStatement.revenue, 1000000);
    assert.strictEqual(q4.incomeStatement.gross_profit, 500000);
    assert.strictEqual(q4.incomeStatement.net_income, 200000);
    
    // Assert Cash Flow grouping
    assert.strictEqual(q4.cashFlow.operating_cash_flow, 300000);
    
    // Assert Metrics grouping (leftovers)
    assert.strictEqual(q4.metrics.some_other_metric, 42);
    
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getNormalizedFinancials: throws SectorsAPIError on failure', async () => {
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ detail: 'Not Found' }),
  });

  try {
    await assert.rejects(
      async () => await getNormalizedFinancials('UNKNOWN'),
      (err) => err instanceof SectorsAPIError
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
