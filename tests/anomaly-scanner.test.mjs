import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateMean,
  calculateStdDev,
  calculateZScore,
  detectValuationAnomalies,
  detectDebtAnomalies,
  detectCashFlowAnomalies,
  scanIssuerAnomalies,
  scanUniverseAnomalies,
} from '../lib/services/anomalyDetector.ts';

// ==========================================
// 1. Quantitative Math Helper Tests
// ==========================================

test('calculateMean: returns accurate arithmetic mean and handles edge cases', () => {
  assert.strictEqual(calculateMean([]), 0);
  assert.strictEqual(calculateMean([10, 20, 30]), 20);
  assert.strictEqual(calculateMean([15.5, 14.5]), 15.0);
  assert.strictEqual(calculateMean([100]), 100);
});

test('calculateStdDev: computes sample standard deviation with Bessel correction', () => {
  assert.strictEqual(calculateStdDev([]), 0);
  assert.strictEqual(calculateStdDev([42]), 0);

  // For [10, 12, 23, 23, 16, 23, 21, 16]
  // Mean = 18, Variance = 26.5714, Sample StdDev = 5.1547...
  const sample = [10, 12, 23, 23, 16, 23, 21, 16];
  const std = calculateStdDev(sample);
  // Sum of squared deviations = 192, df = 7 -> sqrt(192/7) = 5.2372...
  assert.ok(Math.abs(std - 5.2372) < 0.001);

  // Constant array: std dev is 0
  assert.strictEqual(calculateStdDev([5, 5, 5, 5]), 0);
});

test('calculateZScore: calculates accurate Z-Scores and manages flat or empty series', () => {
  const history = [10, 12, 14, 16, 18]; // mean = 14, stdDev = 3.16227...
  
  // Test value at mean (Z = 0)
  const atMean = calculateZScore(14, history);
  assert.strictEqual(atMean.mean, 14);
  assert.strictEqual(atMean.zScore, 0);

  // Test value 2 std devs above mean
  const valAbove = 14 + 2 * atMean.stdDev;
  const zAbove = calculateZScore(valAbove, history);
  assert.ok(Math.abs((zAbove.zScore || 0) - 2.0) < 0.001);

  // Test value 2.5 std devs below mean
  const valBelow = 14 - 2.5 * atMean.stdDev;
  const zBelow = calculateZScore(valBelow, history);
  assert.ok(Math.abs((zBelow.zScore || 0) - (-2.5)) < 0.001);

  // Test empty history or null
  const emptyRes = calculateZScore(null, history);
  assert.strictEqual(emptyRes.zScore, null);

  const flatRes = calculateZScore(10, [10, 10, 10]);
  assert.strictEqual(flatRes.zScore, 0);
});

// ==========================================
// 2. Sub-Engine: Valuation Anomaly Tests
// ==========================================

test('detectValuationAnomalies: flags valuation crash (Z < -2) as OPPORTUNITY', () => {
  const alerts = detectValuationAnomalies({
    symbol: 'TEST',
    currentValuation: { pb: 1.5, pe: 10.0 },
    historicalValuation: {
      pb: [2.5, 2.6, 2.4, 2.7, 2.5, 2.6], // mean ~ 2.55, stdDev ~ 0.104 -> Z for 1.5 is ~ -10
      pe: [15.0, 16.0, 15.5, 14.5, 15.0],
    },
    reportDate: '2024-09-30',
  });

  assert.ok(alerts.length >= 1);
  const pbAlert = alerts.find((a) => a.metric === 'PBV');
  assert.ok(pbAlert);
  assert.strictEqual(pbAlert.type, 'VALUATION_CRASH');
  assert.strictEqual(pbAlert.severity, 'OPPORTUNITY');
  assert.ok(pbAlert.baseline.zScore < -2.0);
});

test('detectValuationAnomalies: flags valuation surge (Z > +2) as WARNING', () => {
  const alerts = detectValuationAnomalies({
    symbol: 'BUBBLE',
    currentValuation: { pe: 65.0, pb: 2.0 },
    historicalValuation: {
      pe: [20.0, 22.0, 21.0, 23.0, 20.5], // mean ~ 21.3, stdDev ~ 1.2 -> 65 is huge Z > +20
      pb: [1.9, 2.0, 2.1, 2.0],
    },
    reportDate: '2024-09-30',
  });

  assert.ok(alerts.length >= 1);
  const peAlert = alerts.find((a) => a.metric === 'PE_RATIO');
  assert.ok(peAlert);
  assert.strictEqual(peAlert.type, 'VALUATION_SURGE');
  assert.strictEqual(peAlert.severity, 'WARNING');
  assert.ok(peAlert.baseline.zScore > 2.0);
});

test('detectValuationAnomalies: returns empty alerts for normal valuation (|Z| <= 1.5)', () => {
  const alerts = detectValuationAnomalies({
    symbol: 'STABLE',
    currentValuation: { pe: 15.2, pb: 2.05 },
    historicalValuation: {
      pe: [14.8, 15.5, 15.0, 15.3, 15.1],
      pb: [2.0, 2.1, 2.05, 1.95, 2.0],
    },
    reportDate: '2024-09-30',
  });

  assert.strictEqual(alerts.length, 0);
});

// ==========================================
// 3. Sub-Engine: Debt Spike Anomaly Tests
// ==========================================

test('detectDebtAnomalies: triggers DEBT_SPIKE when DER jumps >= 50% QoQ or delta >= 1.0x', () => {
  const currentQuarter = {
    report_date: '2024-09-30',
    total_liabilities: 30000000000,
    total_equity: 15000000000, // DER = 2.0x
  };
  const previousQuarter = {
    report_date: '2024-06-30',
    total_liabilities: 12000000000,
    total_equity: 15000000000, // DER = 0.8x (+150% jump, delta = +1.2x)
  };

  const alerts = detectDebtAnomalies({
    symbol: 'DEBT_TEST',
    currentQuarter,
    previousQuarter,
    isBank: false,
  });

  assert.ok(alerts.length >= 1);
  const spikeAlert = alerts.find((a) => a.type === 'DEBT_SPIKE');
  assert.ok(spikeAlert);
  assert.strictEqual(spikeAlert.metric, 'DER');
  assert.ok(spikeAlert.baseline.percentageChange >= 50);
});

test('detectDebtAnomalies: triggers EQUITY_EROSION when equity drops > 25% QoQ', () => {
  const currentQuarter = {
    report_date: '2024-09-30',
    total_liabilities: 10000000000,
    total_equity: 6000000000, // Dropped 40%
  };
  const previousQuarter = {
    report_date: '2024-06-30',
    total_liabilities: 10000000000,
    total_equity: 10000000000,
  };

  const alerts = detectDebtAnomalies({
    symbol: 'EROSION_TEST',
    currentQuarter,
    previousQuarter,
  });

  const erosionAlert = alerts.find((a) => a.type === 'EQUITY_EROSION');
  assert.ok(erosionAlert);
  assert.strictEqual(erosionAlert.severity, 'CRITICAL');
});

// ==========================================
// 4. Sub-Engine: Cash Flow Anomaly Tests
// ==========================================

test('detectCashFlowAnomalies: flags Sloan Accrual Red Flag (Net Income > 0 and OCF < 0) as CRITICAL', () => {
  const currentQuarter = {
    report_date: '2024-09-30',
    net_income: 500000000, // Positive paper profit
    operating_cash_flow: -750000000, // Negative operating cash flow
  };

  const alerts = detectCashFlowAnomalies({
    symbol: 'ACCRUAL_TEST',
    currentQuarter,
  });

  const divAlert = alerts.find((a) => a.type === 'EARNINGS_CASH_DIVERGENCE');
  assert.ok(divAlert);
  assert.strictEqual(divAlert.severity, 'CRITICAL');
  assert.strictEqual(divAlert.metric, 'OCF_VS_NET_INCOME');
});

test('detectCashFlowAnomalies: flags OCF surge >= 150% QoQ as INFO', () => {
  const currentQuarter = {
    report_date: '2024-09-30',
    operating_cash_flow: 3000000000, // +200% QoQ
  };
  const previousQuarter = {
    report_date: '2024-06-30',
    operating_cash_flow: 1000000000,
  };

  const alerts = detectCashFlowAnomalies({
    symbol: 'SURGE_TEST',
    currentQuarter,
    previousQuarter,
  });

  const surgeAlert = alerts.find((a) => a.type === 'CASH_FLOW_SURGE');
  assert.ok(surgeAlert);
  assert.strictEqual(surgeAlert.severity, 'INFO');
  assert.strictEqual(surgeAlert.baseline.percentageChange, 200);
});

// ==========================================
// 5. End-to-End Issuer Anomaly Scanner Tests
// ==========================================

test('scanIssuerAnomalies: classifies BBCA as NORMAL baseline', async () => {
  const report = await scanIssuerAnomalies('BBCA');
  assert.strictEqual(report.symbol, 'BBCA');
  assert.strictEqual(report.status, 'NORMAL');
  assert.ok(report.anomalyScore <= 30);
  assert.strictEqual(report.alerts.filter((a) => a.severity === 'CRITICAL').length, 0);
});

test('scanIssuerAnomalies: classifies BBRI as OPPORTUNITY (Valuation Crash with Strong Cash Flow)', async () => {
  const report = await scanIssuerAnomalies('BBRI');
  assert.strictEqual(report.symbol, 'BBRI');
  assert.strictEqual(report.status, 'OPPORTUNITY');
  assert.ok(report.alerts.some((a) => a.type === 'VALUATION_CRASH'));
});

test('scanIssuerAnomalies: classifies ARTO as OVERVALUED_BUBBLE (PE Z > +2.0)', async () => {
  const report = await scanIssuerAnomalies('ARTO');
  assert.strictEqual(report.symbol, 'ARTO');
  assert.strictEqual(report.status, 'OVERVALUED_BUBBLE');
  assert.ok(report.alerts.some((a) => a.type === 'VALUATION_SURGE'));
});

test('scanIssuerAnomalies: classifies BUMI with debt spike alert', async () => {
  const report = await scanIssuerAnomalies('BUMI');
  assert.strictEqual(report.symbol, 'BUMI');
  assert.ok(report.alerts.some((a) => a.type === 'DEBT_SPIKE'));
  assert.ok(['WARNING', 'CRITICAL_RISK'].includes(report.status));
});

test('scanIssuerAnomalies: classifies DIVERGE_TEST as CRITICAL_RISK (Accrual Divergence)', async () => {
  const report = await scanIssuerAnomalies('DIVERGE_TEST');
  assert.strictEqual(report.symbol, 'DIVERGE_TEST');
  assert.strictEqual(report.status, 'CRITICAL_RISK');
  assert.ok(report.alerts.some((a) => a.type === 'EARNINGS_CASH_DIVERGENCE' && a.severity === 'CRITICAL'));
});

// ==========================================
// 6. Universe Scanner Tests
// ==========================================

test('scanUniverseAnomalies: scans monitored universe and aggregates market health', async () => {
  const result = await scanUniverseAnomalies(['BBCA', 'BBRI', 'GOTO', 'ARTO', 'BUMI', 'DIVERGE_TEST']);

  assert.strictEqual(result.scannedCount, 6);
  assert.ok(result.anomaliesFound > 0);
  assert.ok(result.highPriorityAlerts.length > 0);
  assert.ok(result.marketOverview.totalAlerts > 0);
  assert.ok(['STABLE', 'OPPORTUNITY_RICH', 'ELEVATED_RISK', 'ELEVATED_VOLATILITY'].includes(result.marketOverview.status));
});
