import * as fs from 'fs';
import * as path from 'path';

// ==========================================
// Types & Interfaces
// ==========================================

export type AnomalySeverity = 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFO';

export type AnomalyType =
  | 'VALUATION_CRASH'
  | 'VALUATION_SURGE'
  | 'DEBT_SPIKE'
  | 'EQUITY_EROSION'
  | 'CASH_FLOW_SURGE'
  | 'CASH_FLOW_DROP'
  | 'EARNINGS_CASH_DIVERGENCE';

export type IssuerAnomalyStatus =
  | 'NORMAL'
  | 'OPPORTUNITY'
  | 'WARNING'
  | 'CRITICAL_RISK'
  | 'OVERVALUED_BUBBLE';

export interface AnomalyAlert {
  id: string;
  symbol: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  title: string;
  description: string;
  actionHint: string;
  currentValue: number;
  baseline: {
    mean?: number;
    stdDev?: number;
    zScore?: number;
    previousQuarterValue?: number;
    percentageChange?: number;
  };
  detectedAt: string;
}

export interface IssuerAnomalyReport {
  symbol: string;
  companyName: string;
  subSector: string;
  status: IssuerAnomalyStatus;
  anomalyScore: number; // 0 - 100
  headline: string;
  summary: string;
  metricsBreakdown: {
    valuation: {
      pe: {
        current: number | null;
        mean: number | null;
        stdDev: number | null;
        zScore: number | null;
        isAnomaly: boolean;
      };
      pb: {
        current: number | null;
        mean: number | null;
        stdDev: number | null;
        zScore: number | null;
        isAnomaly: boolean;
      };
    };
    debt: {
      currentDer: number | null;
      previousDer: number | null;
      qoqChangePercent: number | null;
      isSpike: boolean;
      equityErosionPercent: number | null;
    };
    cashFlow: {
      currentOcf: number | null;
      previousOcf: number | null;
      qoqChangePercent: number | null;
      ocfToNetIncomeRatio: number | null;
      isSurge: boolean;
      isDrop: boolean;
      isDivergent: boolean;
    };
  };
  alerts: AnomalyAlert[];
  scannedAt: string;
}

export interface UniverseAnomalyScanResult {
  scannedCount: number;
  anomaliesFound: number;
  issuers: Record<string, IssuerAnomalyReport>;
  highPriorityAlerts: AnomalyAlert[];
  marketOverview: {
    status: 'STABLE' | 'ELEVATED_VOLATILITY' | 'OPPORTUNITY_RICH' | 'ELEVATED_RISK';
    summary: string;
    totalAlerts: number;
  };
}

// ==========================================
// Quantitative Mathematical Helpers
// ==========================================

/**
 * Calculates arithmetic sample mean.
 * Formula: μ = (1 / N) * Σ x_i
 */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return sum / valid.length;
}

/**
 * Calculates sample standard deviation with Bessel's correction (N - 1).
 * Formula: σ = sqrt( (1 / (N - 1)) * Σ (x_i - μ)^2 )
 */
export function calculateStdDev(values: number[], meanValue?: number): number {
  if (!values || values.length < 2) return 0;
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length < 2) return 0;

  const mu = meanValue !== undefined ? meanValue : calculateMean(valid);
  const varianceSum = valid.reduce((acc, curr) => acc + Math.pow(curr - mu, 2), 0);
  const variance = varianceSum / (valid.length - 1);
  return Math.sqrt(variance);
}

/**
 * Computes Z-Score against historical series.
 * Formula: Z = (X - μ) / σ
 */
export function calculateZScore(
  current: number | null | undefined,
  history: number[]
): { zScore: number | null; mean: number; stdDev: number } {
  if (current === null || current === undefined || isNaN(current) || !history || history.length === 0) {
    return { zScore: null, mean: 0, stdDev: 0 };
  }

  const valid = history.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) {
    return { zScore: null, mean: 0, stdDev: 0 };
  }

  const mean = calculateMean(valid);
  const stdDev = calculateStdDev(valid, mean);

  // If standard deviation is 0 or extremely close to 0 (flat historical series)
  if (stdDev < 1e-4) {
    if (Math.abs(current - mean) < 1e-4) {
      return { zScore: 0, mean, stdDev: 0 };
    }
    // Fallback: percentage deviation relative to mean
    const pctDiff = mean !== 0 ? (current - mean) / Math.abs(mean) : 0;
    return { zScore: pctDiff * 2.0, mean, stdDev };
  }

  const zScore = (current - mean) / stdDev;
  return { zScore, mean, stdDev };
}

// ==========================================
// Mock Data Loader (Isolated, Zero-Quota)
// ==========================================

let mockDataCache: Record<string, any> | null = null;

export function loadMockAnomalyDatabase(): Record<string, any> {
  if (mockDataCache) return mockDataCache;

  const mockFilePath = path.join(process.cwd(), 'lib', 'data', 'mock-anomalies.json');
  try {
    if (fs.existsSync(mockFilePath)) {
      const raw = fs.readFileSync(mockFilePath, 'utf-8');
      mockDataCache = JSON.parse(raw);
      return mockDataCache!;
    }
  } catch (err) {
    console.warn('[AnomalyDetector] Could not read mock-anomalies.json, using synthetic fallback', err);
  }

  mockDataCache = {};
  return mockDataCache;
}

/**
 * Generates deterministic fallback mock data for symbols not yet recorded in the mock db.
 */
export function generateSyntheticFallbackData(symbol: string): any {
  const clean = symbol.toUpperCase().trim();
  const hash = clean.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  const basePe = 12 + (hash % 10);
  const basePb = 1.4 + ((hash % 15) / 10);
  const isSpike = clean.includes('SPIKE') || clean.includes('BUMI');
  const isOpp = clean.includes('OPP') || clean.includes('BBRI');

  const pe = isOpp ? basePe * 0.65 : basePe;
  const pb = isOpp ? basePb * 0.60 : basePb;

  return {
    symbol: clean,
    company_name: `PT ${clean} Indonesia Tbk`,
    report: {
      symbol: clean,
      company_name: `PT ${clean} Indonesia Tbk`,
      overview: {
        sector: 'Financials',
        sub_sector: 'banks',
        industry: 'Banking',
        market_cap: 50000000000000,
        last_close_price: 3500,
      },
      valuation: {
        pe,
        pb,
        ps: 3.2,
        ev_ebitda: 7.5,
      },
    },
    historical_valuation: {
      pe: [basePe - 1, basePe + 0.5, basePe - 0.2, basePe + 1, basePe - 0.5, basePe + 0.8, basePe, basePe + 0.2],
      pb: [basePb - 0.1, basePb + 0.15, basePb - 0.05, basePb + 0.2, basePb - 0.1, basePb + 0.1, basePb, basePb + 0.05],
    },
    quarterly: [
      {
        report_date: '2024-09-30',
        quarter: 'Q3',
        year: 2024,
        revenue: 15000000000000,
        net_income: 4500000000000,
        total_assets: 120000000000000,
        total_liabilities: isSpike ? 95000000000000 : 75000000000000,
        total_equity: 25000000000000,
        operating_cash_flow: 5200000000000,
        pe,
        pb,
      },
      {
        report_date: '2024-06-30',
        quarter: 'Q2',
        year: 2024,
        revenue: 14500000000000,
        net_income: 4200000000000,
        total_assets: 115000000000000,
        total_liabilities: 70000000000000,
        total_equity: 25000000000000,
        operating_cash_flow: 4800000000000,
        pe: basePe,
        pb: basePb,
      },
    ],
    daily: [
      { date: '2024-11-20', close: 3500, volume: 25000000, market_cap: 50000000000000 },
    ],
  };
}

// ==========================================
// Sub-Engine: Valuation Anomaly Detector
// ==========================================

export function detectValuationAnomalies(params: {
  symbol: string;
  currentValuation: { pe?: number | null; pb?: number | null };
  historicalValuation?: { pe?: number[]; pb?: number[] };
  reportDate?: string;
}): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const { symbol, currentValuation, historicalValuation, reportDate } = params;
  const dateStr = reportDate || new Date().toISOString().split('T')[0];

  // 1. Check Price to Book Value (PBV)
  if (currentValuation?.pb !== null && currentValuation?.pb !== undefined && historicalValuation?.pb) {
    const { zScore, mean, stdDev } = calculateZScore(currentValuation.pb, historicalValuation.pb);

    if (zScore !== null) {
      if (zScore < -2.0) {
        alerts.push({
          id: `${symbol}-VAL-PB-CRASH-${dateStr}`,
          symbol,
          type: 'VALUATION_CRASH',
          severity: 'OPPORTUNITY',
          metric: 'PBV',
          title: `Dislokasi Valuasi PBV Ekstrem (Z-Score: ${zScore.toFixed(2)})`,
          description: `PBV saat ini (${currentValuation.pb.toFixed(2)}x) anjlok ekstrem ${Math.abs(zScore).toFixed(2)} standar deviasi di bawah rata-rata historis (${mean.toFixed(2)}x ± ${stdDev.toFixed(2)}).`,
          actionHint: 'Peluang akumulasi jika rasio utang terkendali dan arus kas tetap positif.',
          currentValue: currentValuation.pb,
          baseline: { mean, stdDev, zScore },
          detectedAt: dateStr,
        });
      } else if (zScore > 2.0) {
        alerts.push({
          id: `${symbol}-VAL-PB-SURGE-${dateStr}`,
          symbol,
          type: 'VALUATION_SURGE',
          severity: 'WARNING',
          metric: 'PBV',
          title: `Lonjakan Valuasi PBV Ekstrem (Z-Score: +${zScore.toFixed(2)})`,
          description: `PBV saat ini (${currentValuation.pb.toFixed(2)}x) melambung +${zScore.toFixed(2)} standar deviasi di atas rata-rata historis (${mean.toFixed(2)}x).`,
          actionHint: 'Waspada potensi koreksi pembalikan (mean-reversion) atau risiko bubble.',
          currentValue: currentValuation.pb,
          baseline: { mean, stdDev, zScore },
          detectedAt: dateStr,
        });
      }
    }
  }

  // 2. Check Price to Earnings (PE) - Only when positive (loss-making is handled separately)
  if (
    currentValuation?.pe !== null &&
    currentValuation?.pe !== undefined &&
    currentValuation.pe > 0 &&
    historicalValuation?.pe
  ) {
    const positiveHistory = historicalValuation.pe.filter((p) => p > 0);
    const { zScore, mean, stdDev } = calculateZScore(currentValuation.pe, positiveHistory);

    if (zScore !== null) {
      if (zScore < -2.0) {
        alerts.push({
          id: `${symbol}-VAL-PE-CRASH-${dateStr}`,
          symbol,
          type: 'VALUATION_CRASH',
          severity: 'OPPORTUNITY',
          metric: 'PE_RATIO',
          title: `Dislokasi Valuasi PE Ekstrem (Z-Score: ${zScore.toFixed(2)})`,
          description: `Rasio PE (${currentValuation.pe.toFixed(2)}x) anjlok ${Math.abs(zScore).toFixed(2)} standar deviasi di bawah rata-rata historis (${mean.toFixed(2)}x).`,
          actionHint: 'Emiten diperdagangkan pada level diskon historis yang signifikan.',
          currentValue: currentValuation.pe,
          baseline: { mean, stdDev, zScore },
          detectedAt: dateStr,
        });
      } else if (zScore > 2.0) {
        alerts.push({
          id: `${symbol}-VAL-PE-SURGE-${dateStr}`,
          symbol,
          type: 'VALUATION_SURGE',
          severity: 'WARNING',
          metric: 'PE_RATIO',
          title: `Lonjakan Valuasi PE Ekstrem (Z-Score: +${zScore.toFixed(2)})`,
          description: `Rasio PE (${currentValuation.pe.toFixed(2)}x) melampaui rata-rata historis (+${zScore.toFixed(2)} SD).`,
          actionHint: 'Ekspektasi pertumbuhan pasar sangat tinggi; rawan koreksi jika laba meleset.',
          currentValue: currentValuation.pe,
          baseline: { mean, stdDev, zScore },
          detectedAt: dateStr,
        });
      }
    }
  }

  return alerts;
}

// ==========================================
// Sub-Engine: Debt & Leverage Anomaly Detector
// ==========================================

export function detectDebtAnomalies(params: {
  symbol: string;
  currentQuarter: Record<string, any>;
  previousQuarter?: Record<string, any>;
  isBank?: boolean;
}): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const { symbol, currentQuarter, previousQuarter, isBank = false } = params;
  if (!currentQuarter) return alerts;

  const dateStr = currentQuarter.report_date || new Date().toISOString().split('T')[0];
  const curLiab = Number(currentQuarter.total_liabilities || 0);
  const curEq = Number(currentQuarter.total_equity || 0);

  if (curEq <= 0) {
    alerts.push({
      id: `${symbol}-DEBT-NEG-EQ-${dateStr}`,
      symbol,
      type: 'EQUITY_EROSION',
      severity: 'CRITICAL',
      metric: 'EQUITY',
      title: 'Krisis Modal: Ekuitas Negatif / Defisiensi Modal',
      description: `Ekuitas tercatat minus (Rp ${(curEq / 1e9).toFixed(1)} Miliar). Emiten berada dalam kondisi insolvensi buku.`,
      actionHint: 'Hindari instrumen ekuitas emiten sampai terdapat restrukturisasi modal tuntas.',
      currentValue: curEq,
      baseline: {},
      detectedAt: dateStr,
    });
    return alerts;
  }

  const currentDer = curLiab / curEq;

  if (previousQuarter) {
    const prevLiab = Number(previousQuarter.total_liabilities || 0);
    const prevEq = Number(previousQuarter.total_equity || 0);

    if (prevEq > 0) {
      const prevDer = prevLiab / prevEq;
      const derDelta = currentDer - prevDer;
      const qoqDerChangePct = ((currentDer - prevDer) / prevDer) * 100;
      const eqChangePct = ((curEq - prevEq) / prevEq) * 100;

      // 1. Check Equity Erosion
      if (eqChangePct <= -25) {
        alerts.push({
          id: `${symbol}-DEBT-EQ-EROSION-${dateStr}`,
          symbol,
          type: 'EQUITY_EROSION',
          severity: 'CRITICAL',
          metric: 'EQUITY',
          title: `Erosi Ekuitas Signifikan (${eqChangePct.toFixed(1)}% QoQ)`,
          description: `Total ekuitas tergerus drastis dari Rp ${(prevEq / 1e12).toFixed(2)} T menjadi Rp ${(curEq / 1e12).toFixed(2)} T dalam 1 kuartal.`,
          actionHint: 'Cek pos kerugian luar biasa atau pembagian dividen agresif yang menguras saldo laba.',
          currentValue: curEq,
          baseline: { previousQuarterValue: prevEq, percentageChange: eqChangePct },
          detectedAt: dateStr,
        });
      }

      // 2. Check Sudden Debt Spike
      const isBankDERSpike = isBank && (currentDer > 8.0 || (qoqDerChangePct >= 30 && eqChangePct < 0));
      const isNonBankDERSpike = !isBank && (
        (qoqDerChangePct >= 50 && currentDer >= 1.5) ||
        derDelta >= 1.0
      );

      if (isBankDERSpike || isNonBankDERSpike) {
        alerts.push({
          id: `${symbol}-DEBT-SPIKE-${dateStr}`,
          symbol,
          type: 'DEBT_SPIKE',
          severity: currentDer > 3.0 || isBankDERSpike ? 'CRITICAL' : 'WARNING',
          metric: 'DER',
          title: `Lonjakan Rasio Utang (DER) Mendadak (+${qoqDerChangePct.toFixed(1)}% QoQ)`,
          description: `Rasio utang melonjak dari ${prevDer.toFixed(2)}x menjadi ${currentDer.toFixed(2)}x (kenaikan delta +${derDelta.toFixed(2)}x).`,
          actionHint: 'Periksa profil jatuh tempo utang jangka pendek dan beban bunga terhadap laba operasi.',
          currentValue: currentDer,
          baseline: { previousQuarterValue: prevDer, percentageChange: qoqDerChangePct },
          detectedAt: dateStr,
        });
      }
    }
  }

  return alerts;
}

// ==========================================
// Sub-Engine: Cash Flow & Forensic Accrual Detector
// ==========================================

export function detectCashFlowAnomalies(params: {
  symbol: string;
  currentQuarter: Record<string, any>;
  previousQuarter?: Record<string, any>;
}): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const { symbol, currentQuarter, previousQuarter } = params;
  if (!currentQuarter) return alerts;

  const dateStr = currentQuarter.report_date || new Date().toISOString().split('T')[0];
  const curOcf = Number(currentQuarter.operating_cash_flow || 0);
  const curNetIncome = Number(currentQuarter.net_income || 0);

  // 1. Sloan Accrual Anomaly / Forensic Red Flag: Net Income > 0 but OCF < 0
  if (curNetIncome > 0 && curOcf < 0) {
    alerts.push({
      id: `${symbol}-CF-DIVERGENCE-${dateStr}`,
      symbol,
      type: 'EARNINGS_CASH_DIVERGENCE',
      severity: 'CRITICAL',
      metric: 'OCF_VS_NET_INCOME',
      title: 'Divergensi Arus Kas vs Laba Bersih (Forensic Accrual Red Flag)',
      description: `Perusahaan membukukan laba bersih positif (Rp ${(curNetIncome / 1e9).toFixed(1)} Miliar), namun Arus Kas Operasi negatif (minus Rp ${(Math.abs(curOcf) / 1e9).toFixed(1)} Miliar). Laba didominasi piutang/akrual tanpa realisasi kas riil.`,
      actionHint: 'Waspada potensi manipulasi laba akuntansi atau keterlambatan penagihan piutang besar.',
      currentValue: curOcf,
      baseline: { previousQuarterValue: curNetIncome, percentageChange: -100 },
      detectedAt: dateStr,
    });
  } else if (curNetIncome > 0 && curOcf > 0) {
    const ocfToNiRatio = curOcf / curNetIncome;
    if (ocfToNiRatio < 0.2) {
      alerts.push({
        id: `${symbol}-CF-LOW-QUALITY-${dateStr}`,
        symbol,
        type: 'EARNINGS_CASH_DIVERGENCE',
        severity: 'WARNING',
        metric: 'CASH_CONVERSION',
        title: `Kualitas Konversi Kas Rendah (Rasio: ${(ocfToNiRatio * 100).toFixed(1)}%)`,
        description: `Arus kas operasi hanya mengonversi ${(ocfToNiRatio * 100).toFixed(1)}% dari laba bersih (< 20%). Terdapat penumpukan modal kerja yang perlu diperhatikan.`,
        actionHint: 'Evaluasi perputaran modal kerja dan piutang usaha.',
        currentValue: ocfToNiRatio,
        baseline: {},
        detectedAt: dateStr,
      });
    }
  }

  // 2. Sequential QoQ Cash Flow Dynamics
  if (previousQuarter) {
    const prevOcf = Number(previousQuarter.operating_cash_flow || 0);

    // Sudden OCF Surge (e.g. Turnaround or One-off Cash Flow Influx)
    if (prevOcf !== 0) {
      const qoqOcfChangePct = ((curOcf - prevOcf) / Math.abs(prevOcf)) * 100;

      if (qoqOcfChangePct >= 150) {
        alerts.push({
          id: `${symbol}-CF-SURGE-${dateStr}`,
          symbol,
          type: 'CASH_FLOW_SURGE',
          severity: 'INFO',
          metric: 'OPERATING_CASH_FLOW',
          title: `Lonjakan Arus Kas Operasi Mendadak (+${qoqOcfChangePct.toFixed(0)}% QoQ)`,
          description: `Arus kas operasi melonjak dari Rp ${(prevOcf / 1e9).toFixed(1)} M menjadi Rp ${(curOcf / 1e9).toFixed(1)} M.`,
          actionHint: 'Verifikasi apakah lonjakan kas berasal dari efisiensi operasional murni atau peristiwa non-rutin.',
          currentValue: curOcf,
          baseline: { previousQuarterValue: prevOcf, percentageChange: qoqOcfChangePct },
          detectedAt: dateStr,
        });
      } else if (qoqOcfChangePct <= -80 && prevOcf > 0) {
        alerts.push({
          id: `${symbol}-CF-DROP-${dateStr}`,
          symbol,
          type: 'CASH_FLOW_DROP',
          severity: 'WARNING',
          metric: 'OPERATING_CASH_FLOW',
          title: `Penurunan Tajam Arus Kas Operasi (${qoqOcfChangePct.toFixed(0)}% QoQ)`,
          description: `Arus kas operasi anjlok drastis ${Math.abs(qoqOcfChangePct).toFixed(0)}% dibanding kuartal sebelumnya.`,
          actionHint: 'Waspada potensi defisit likuiditas jangka pendek.',
          currentValue: curOcf,
          baseline: { previousQuarterValue: prevOcf, percentageChange: qoqOcfChangePct },
          detectedAt: dateStr,
        });
      }
    }
  }

  return alerts;
}

// ==========================================
// Comprehensive Issuer Anomaly Scanner
// ==========================================

export async function scanIssuerAnomalies(symbol: string): Promise<IssuerAnomalyReport> {
  const cleanSymbol = symbol.toUpperCase().trim();
  const db = loadMockAnomalyDatabase();
  const data = db[cleanSymbol] || generateSyntheticFallbackData(cleanSymbol);

  const report = data.report || {};
  const overview = report.overview || {};
  const valuation = report.valuation || {};
  const quarterly = Array.isArray(data.quarterly) ? data.quarterly : [];
  const historicalValuation = data.historical_valuation || {};

  const isBank = (overview.sub_sector || '').toLowerCase().includes('bank');
  const currentQuarter = quarterly[0] || {};
  const previousQuarter = quarterly[1];

  // 1. Run Sub-Engines
  const valAlerts = detectValuationAnomalies({
    symbol: cleanSymbol,
    currentValuation: valuation,
    historicalValuation,
    reportDate: currentQuarter.report_date,
  });

  const debtAlerts = detectDebtAnomalies({
    symbol: cleanSymbol,
    currentQuarter,
    previousQuarter,
    isBank,
  });

  const cfAlerts = detectCashFlowAnomalies({
    symbol: cleanSymbol,
    currentQuarter,
    previousQuarter,
  });

  const allAlerts = [...valAlerts, ...debtAlerts, ...cfAlerts];

  // 2. Compute Metric Snapshots
  const peZ = valuation.pe ? calculateZScore(valuation.pe, historicalValuation.pe || []).zScore : null;
  const pbZ = valuation.pb ? calculateZScore(valuation.pb, historicalValuation.pb || []).zScore : null;

  const curDer = currentQuarter.total_equity && currentQuarter.total_equity > 0
    ? Number(currentQuarter.total_liabilities) / Number(currentQuarter.total_equity)
    : null;
  const prevDer = previousQuarter && previousQuarter.total_equity > 0
    ? Number(previousQuarter.total_liabilities) / Number(previousQuarter.total_equity)
    : null;
  const qoqDerChange = curDer !== null && prevDer !== null && prevDer > 0
    ? ((curDer - prevDer) / prevDer) * 100
    : null;
  const eqErosionPct = currentQuarter.total_equity && previousQuarter?.total_equity
    ? ((Number(currentQuarter.total_equity) - Number(previousQuarter.total_equity)) / Number(previousQuarter.total_equity)) * 100
    : null;

  const curOcf = currentQuarter.operating_cash_flow !== undefined ? Number(currentQuarter.operating_cash_flow) : null;
  const prevOcf = previousQuarter?.operating_cash_flow !== undefined ? Number(previousQuarter.operating_cash_flow) : null;
  const qoqOcfChange = curOcf !== null && prevOcf !== null && prevOcf !== 0
    ? ((curOcf - prevOcf) / Math.abs(prevOcf)) * 100
    : null;
  const curNi = currentQuarter.net_income !== undefined ? Number(currentQuarter.net_income) : null;
  const ocfNiRatio = curOcf !== null && curNi !== null && curNi !== 0
    ? curOcf / curNi
    : null;

  // 3. Classify Overall Issuer Status
  const hasCritical = allAlerts.some((a) => a.severity === 'CRITICAL');
  const hasValuationCrash = allAlerts.some((a) => a.type === 'VALUATION_CRASH');
  const hasValuationSurge = allAlerts.some((a) => a.type === 'VALUATION_SURGE');
  const hasDebtSpike = allAlerts.some((a) => a.type === 'DEBT_SPIKE');
  const hasWarning = allAlerts.some((a) => a.severity === 'WARNING');

  let status: IssuerAnomalyStatus = 'NORMAL';
  let headline = 'Fundamental Stabil';
  let summary = 'Seluruh parameter valuasi, rasio utang, dan arus kas berada di dalam rentang normal historis.';
  let anomalyScore = 15; // default low baseline

  if (hasCritical) {
    status = 'CRITICAL_RISK';
    headline = 'Anomali Berisiko Tinggi: Peringatan Kritis Kualitas Laba / Solvabilitas';
    summary = 'Terdeteksi anomali kritis berupa divergensi arus kas operasi terhadap laba bersih atau lonjakan utang signifikan yang membahayakan struktur permodalan.';
    anomalyScore = 90;
  } else if (hasValuationCrash && !hasDebtSpike && (curOcf === null || curOcf >= 0)) {
    status = 'OPPORTUNITY';
    headline = 'Peluang Dislokasi Valuasi: Saham Berfundamental Sehat Berada di Diskon Ekstrem';
    summary = `Valuasi pasar anjlok melebihi 2 standar deviasi di bawah rata-rata historis (${pbZ ? `PBV Z: ${pbZ.toFixed(2)}` : ''}), sementara rasio utang dan arus kas tetap berada dalam batas aman.`;
    anomalyScore = 75;
  } else if (hasValuationSurge) {
    status = 'OVERVALUED_BUBBLE';
    headline = 'Valuasi Ekstrem: Kelipatan Harga Melambung Jauh di Atas Historis';
    summary = `Valuasi melompat lebih dari 2 standar deviasi di atas rata-rata historis (${peZ ? `PE Z: +${peZ.toFixed(2)}` : ''}). Pasar membebankan premi tinggi yang rentan terhadap aksi ambil untung.`;
    anomalyScore = 80;
  } else if (hasWarning) {
    status = 'WARNING';
    headline = 'Peringatan Volatilitas: Terdeteksi Anomali Finansial Moderat';
    summary = 'Terdapat perubahan yang melampaui batas kewajaran pada struktur utang atau arus kas yang memerlukan pemantauan berkala.';
    anomalyScore = 55;
  }

  return {
    symbol: cleanSymbol,
    companyName: data.company_name || report.company_name || `PT ${cleanSymbol} Tbk`,
    subSector: overview.sub_sector || 'banks',
    status,
    anomalyScore,
    headline,
    summary,
    metricsBreakdown: {
      valuation: {
        pe: {
          current: valuation.pe ?? null,
          mean: valuation.pe ? calculateZScore(valuation.pe, historicalValuation.pe || []).mean : null,
          stdDev: valuation.pe ? calculateZScore(valuation.pe, historicalValuation.pe || []).stdDev : null,
          zScore: peZ,
          isAnomaly: peZ !== null && Math.abs(peZ) > 2.0,
        },
        pb: {
          current: valuation.pb ?? null,
          mean: valuation.pb ? calculateZScore(valuation.pb, historicalValuation.pb || []).mean : null,
          stdDev: valuation.pb ? calculateZScore(valuation.pb, historicalValuation.pb || []).stdDev : null,
          zScore: pbZ,
          isAnomaly: pbZ !== null && Math.abs(pbZ) > 2.0,
        },
      },
      debt: {
        currentDer: curDer,
        previousDer: prevDer,
        qoqChangePercent: qoqDerChange,
        isSpike: hasDebtSpike,
        equityErosionPercent: eqErosionPct,
      },
      cashFlow: {
        currentOcf: curOcf,
        previousOcf: prevOcf,
        qoqChangePercent: qoqOcfChange,
        ocfToNetIncomeRatio: ocfNiRatio,
        isSurge: allAlerts.some((a) => a.type === 'CASH_FLOW_SURGE'),
        isDrop: allAlerts.some((a) => a.type === 'CASH_FLOW_DROP'),
        isDivergent: allAlerts.some((a) => a.type === 'EARNINGS_CASH_DIVERGENCE'),
      },
    },
    alerts: allAlerts,
    scannedAt: new Date().toISOString(),
  };
}

// ==========================================
// Universe Anomaly Scanner
// ==========================================

export async function scanUniverseAnomalies(
  symbols: string[] = ['BBCA', 'BBRI', 'GOTO', 'ARTO', 'BUMI', 'DIVERGE_TEST']
): Promise<UniverseAnomalyScanResult> {
  const reports: Record<string, IssuerAnomalyReport> = {};
  const allAlerts: AnomalyAlert[] = [];

  for (const sym of symbols) {
    try {
      const rep = await scanIssuerAnomalies(sym);
      reports[sym] = rep;
      allAlerts.push(...rep.alerts);
    } catch (err) {
      console.warn(`[scanUniverseAnomalies] Failed for ${sym}:`, err);
    }
  }

  const highPriorityAlerts = allAlerts
    .filter((a) => a.severity === 'CRITICAL' || a.severity === 'OPPORTUNITY')
    .sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1));

  const criticalCount = allAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const oppCount = allAlerts.filter((a) => a.severity === 'OPPORTUNITY').length;

  let marketStatus: UniverseAnomalyScanResult['marketOverview']['status'] = 'STABLE';
  let marketSummary = 'Kondisi pasar secara umum stabil tanpa anomali sistemik.';

  if (criticalCount >= 2) {
    marketStatus = 'ELEVATED_RISK';
    marketSummary = `Terdeteksi ${criticalCount} anomali kritis risiko solvabilitas/kualitas laba di beberapa emiten pantauan.`;
  } else if (oppCount >= 1) {
    marketStatus = 'OPPORTUNITY_RICH';
    marketSummary = `Ditemukan peluang dislokasi valuasi ekstrem di mana emiten sehat terdiskon lebih dari 2 standar deviasi.`;
  }

  return {
    scannedCount: Object.keys(reports).length,
    anomaliesFound: allAlerts.length,
    issuers: reports,
    highPriorityAlerts,
    marketOverview: {
      status: marketStatus,
      summary: marketSummary,
      totalAlerts: allAlerts.length,
    },
  };
}
