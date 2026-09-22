import test from 'node:test';
import assert from 'node:assert/strict';

// Set mock environment variables
process.env.SECTORS_API_KEY = 'test-api-key';

import {
  calculateCumDate,
  evaluateDividendSafety,
  normalizeCorporateRadar,
} from '../lib/services/corporateRadar.ts';

test('calculateCumDate: computes Friday for Monday Ex-Date', () => {
  // 2026-08-31 is Monday -> Cum date should be 2026-08-28 (Friday)
  const cumDate = calculateCumDate('2026-08-31');
  assert.strictEqual(cumDate, '2026-08-28');
});

test('calculateCumDate: computes 1 business day prior for midweek Ex-Date', () => {
  // 2026-03-25 is Wednesday -> Cum date should be 2026-03-24 (Tuesday)
  const cumDate = calculateCumDate('2026-03-25');
  assert.strictEqual(cumDate, '2026-03-24');
});

test('evaluateDividendSafety: classifies safety levels correctly', () => {
  // Safe: payout ratio < 70%
  const safe = evaluateDividendSafety(0.5, 0.55);
  assert.strictEqual(safe.level, 'SAFE');

  // Moderate: payout ratio 70% - 100%
  const moderate = evaluateDividendSafety(0.85, 0.80);
  assert.strictEqual(moderate.level, 'MODERATE');

  // At risk: payout ratio > 100% (trap danger)
  const atRiskHigh = evaluateDividendSafety(1.25, 1.10);
  assert.strictEqual(atRiskHigh.level, 'AT_RISK');

  // At risk: payout ratio < 0 (company lost money)
  const atRiskNegative = evaluateDividendSafety(-0.2, null);
  assert.strictEqual(atRiskNegative.level, 'AT_RISK');
});

test('normalizeCorporateRadar: normalizes raw data into structured radar', () => {
  const mockRawActions = {
    symbol: 'BBCA.JK',
    corporate_actions: {
      dividend: [
        {
          ex_date: '2026-08-31',
          payment_date: '2026-09-16',
          dividend_yield: 0.025,
          dividend_amount: 25,
        },
      ],
      stock_split: [
        {
          date: '2021-10-13',
          split_ratio: 5,
        },
      ],
      agm: [
        {
          agm_date: '2024-03-14',
          agm_place: 'Grand Indonesia',
        },
      ],
    },
  };

  const mockReport = {
    overview: {
      company_name: 'Bank Central Asia Tbk',
      sector: 'Financials',
      sub_sector: 'Banks',
      market_cap: 1200000000000,
    },
    dividend: {
      yield_ttm: 0.055,
      dividend_yield_avg: { avg_yield: 0.045 },
      dividend_ttm: 300,
      payout_ratio: 0.65,
      cash_payout_ratio: 0.70,
      last_ex_dividend_date: '2026-08-31',
      historical_dividends: {
        '2024': {
          total_dividend: 270,
          total_yield: 0.048,
          breakdown: [{ date: '2024-03-25', total: 227.5, yield: 0.03 }],
        },
        '2023': {
          total_dividend: 212.5,
          total_yield: 0.042,
          breakdown: [{ date: '2023-03-29', total: 170, yield: 0.025 }],
        },
      },
    },
  };

  const result = normalizeCorporateRadar('BBCA', mockRawActions, mockReport);

  assert.strictEqual(result.symbol, 'BBCA');
  assert.strictEqual(result.companyName, 'Bank Central Asia Tbk');
  assert.strictEqual(result.isHighYield, true); // 0.055 >= 0.05
  assert.strictEqual(result.dividendSafetyLevel, 'SAFE'); // 0.65 <= 0.70
  assert.strictEqual(result.consistencyYears, 2);
  assert.strictEqual(result.historicalDividends.length, 2);

  // Assert Calendar Events contains dividend, stock split, and agm
  assert.strictEqual(result.calendar.length, 3);
  const divEvent = result.calendar.find((c) => c.type === 'DIVIDEND');
  assert.ok(divEvent);
  assert.strictEqual(divEvent.cumDate, '2026-08-28');
  assert.strictEqual(divEvent.amount, 25);

  const splitEvent = result.calendar.find((c) => c.type === 'STOCK_SPLIT');
  assert.ok(splitEvent);
  assert.strictEqual(splitEvent.ratio, '1:5');

  const agmEvent = result.calendar.find((c) => c.type === 'AGM');
  assert.ok(agmEvent);
});
