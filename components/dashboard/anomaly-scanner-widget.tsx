import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  scanIssuerAnomalies,
  scanUniverseAnomalies,
  IssuerAnomalyReport,
  AnomalyAlert,
} from '@/lib/services/anomalyDetector';
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingDown,
  Sparkles,
  AlertOctagon,
  Info,
  Scale,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface AnomalyScannerWidgetProps {
  symbol?: string | null;
}

export async function AnomalyScannerWidget({ symbol }: AnomalyScannerWidgetProps) {
  const activeSymbol = (symbol || 'BBCA').toUpperCase().trim();
  const issuerReport: IssuerAnomalyReport = await scanIssuerAnomalies(activeSymbol);
  const universeScan = await scanUniverseAnomalies();

  const getStatusBadge = (status: IssuerAnomalyReport['status']) => {
    switch (status) {
      case 'OPPORTUNITY':
        return (
          <Badge variant="success" className="gap-1.5 px-3 py-1 font-semibold text-xs uppercase tracking-wide">
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Opportunity (Undervalued Gem)</span>
          </Badge>
        );
      case 'CRITICAL_RISK':
        return (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1 font-semibold text-xs uppercase tracking-wide">
            <AlertOctagon className="size-3.5 text-red-600 dark:text-red-400" />
            <span>Critical Risk (Red Flag)</span>
          </Badge>
        );
      case 'OVERVALUED_BUBBLE':
        return (
          <Badge variant="warning" className="gap-1.5 px-3 py-1 font-semibold text-xs uppercase tracking-wide bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
            <Zap className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Overvalued Bubble</span>
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge variant="warning" className="gap-1.5 px-3 py-1 font-semibold text-xs uppercase tracking-wide">
            <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>Warning (Perhatian)</span>
          </Badge>
        );
      case 'NORMAL':
      default:
        return (
          <Badge variant="outline" className="gap-1.5 px-3 py-1 font-semibold text-xs uppercase tracking-wide border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-zinc-100/60 dark:bg-zinc-800/60">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Normal (Stabil)</span>
          </Badge>
        );
    }
  };

  const getAlertSeverityBadge = (severity: AnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">CRITICAL</Badge>;
      case 'OPPORTUNITY':
        return <Badge variant="success">OPPORTUNITY</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'INFO':
      default:
        return <Badge variant="info">INFO</Badge>;
    }
  };

  const pbVal = issuerReport.metricsBreakdown.valuation.pb;
  const peVal = issuerReport.metricsBreakdown.valuation.pe;
  const debt = issuerReport.metricsBreakdown.debt;
  const cf = issuerReport.metricsBreakdown.cashFlow;

  return (
    <div className="space-y-6">
      {/* 1. Market Radar Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-100 via-zinc-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
            <Scale className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-foreground">Market Anomaly Radar</h3>
              <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase">
                {universeScan.marketOverview.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {universeScan.marketOverview.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground mr-1">Emiten Dipantau:</span>
          {Object.keys(universeScan.issuers).map((sym) => {
            const isCurrent = sym === activeSymbol;
            const item = universeScan.issuers[sym];
            return (
              <Link
                key={sym}
                href={`/dashboard?symbol=${sym}`}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono font-medium transition-colors border ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-primary'
                    : item.status === 'CRITICAL_RISK'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-100'
                    : item.status === 'OPPORTUNITY'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {sym}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Active Issuer Anomaly Report Card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  Pemindai Anomali Emiten: {activeSymbol}
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                {issuerReport.companyName} • Sub-sektor: <span className="font-medium capitalize">{issuerReport.subSector}</span>
              </CardDescription>
            </div>
            <div>{getStatusBadge(issuerReport.status)}</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="size-4 text-primary" />
              {issuerReport.headline}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {issuerReport.summary}
            </p>
          </div>

          {/* 3 Quantitative Metric Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Valuation Z-Score */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Valuasi Historis (Z-Score)
                </span>
                {pbVal.isAnomaly ? (
                  <Badge variant={pbVal.zScore && pbVal.zScore < 0 ? 'success' : 'warning'}>
                    Anomali
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Normal</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">PBV Terkini:</span>
                    <span className="font-mono font-bold text-foreground">
                      {pbVal.current !== null ? `${pbVal.current.toFixed(2)}x` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Mean 8-Q: {pbVal.mean ? `${pbVal.mean.toFixed(2)}x` : '-'}</span>
                    <span className={`font-mono font-semibold ${
                      pbVal.zScore && Math.abs(pbVal.zScore) > 2.0
                        ? pbVal.zScore < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}>
                      Z = {pbVal.zScore !== null ? `${pbVal.zScore > 0 ? '+' : ''}${pbVal.zScore.toFixed(2)}σ` : '-'}
                    </span>
                  </div>
                </div>

                {peVal.current !== null && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">PE Terkini:</span>
                      <span className="font-mono font-bold text-foreground">
                        {peVal.current.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Mean 8-Q: {peVal.mean ? `${peVal.mean.toFixed(2)}x` : '-'}</span>
                      <span className={`font-mono font-semibold ${
                        peVal.zScore && Math.abs(peVal.zScore) > 2.0 ? 'text-amber-600' : 'text-zinc-500'
                      }`}>
                        Z = {peVal.zScore !== null ? `${peVal.zScore > 0 ? '+' : ''}${peVal.zScore.toFixed(2)}σ` : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 2: Debt & Solvency */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rasio Utang (DER)
                </span>
                {debt.isSpike ? (
                  <Badge variant="destructive">Spike!</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Terkendali</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">DER Terkini:</span>
                  <span className="font-mono font-bold text-foreground">
                    {debt.currentDer !== null ? `${debt.currentDer.toFixed(2)}x` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">DER Kuartal Lalu:</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    {debt.previousDer !== null ? `${debt.previousDer.toFixed(2)}x` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-muted-foreground">Perubahan QoQ:</span>
                  <span className={`font-mono font-semibold flex items-center ${
                    debt.qoqChangePercent !== null && debt.qoqChangePercent >= 50
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {debt.qoqChangePercent !== null ? (
                      <>
                        {debt.qoqChangePercent >= 0 ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                        {debt.qoqChangePercent > 0 ? '+' : ''}{debt.qoqChangePercent.toFixed(1)}%
                      </>
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Cash Flow Quality & Accrual */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Arus Kas Operasi (OCF)
                </span>
                {cf.isDivergent ? (
                  <Badge variant="destructive">Divergensi!</Badge>
                ) : cf.isSurge ? (
                  <Badge variant="info">Surge (+)</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Wajar</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">OCF Terkini:</span>
                  <span className={`font-mono font-bold ${
                    cf.currentOcf !== null && cf.currentOcf < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {cf.currentOcf !== null ? `Rp ${(cf.currentOcf / 1e12).toFixed(2)} T` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pertumbuhan OCF:</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    {cf.qoqChangePercent !== null ? `${cf.qoqChangePercent > 0 ? '+' : ''}${cf.qoqChangePercent.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-muted-foreground">Rasio OCF / Laba:</span>
                  <span className={`font-mono font-semibold ${
                    cf.ocfToNetIncomeRatio !== null && cf.ocfToNetIncomeRatio < 0.2
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {cf.ocfToNetIncomeRatio !== null ? `${(cf.ocfToNetIncomeRatio * 100).toFixed(0)}%` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Active Alerts List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Daftar Peringatan & Anomali Terdeteksi ({issuerReport.alerts.length})
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                Berdasarkan Formula Kuantitatif Campbell-Shiller & Sloan Accrual
              </span>
            </h4>

            {issuerReport.alerts.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/30">
                <ShieldCheck className="size-6 text-emerald-500 mx-auto mb-1.5" />
                Tidak ada alert anomali ekstrem yang terdeteksi untuk {activeSymbol}. Fundamental dalam rentang historis wajar.
              </div>
            ) : (
              <div className="space-y-2.5">
                {issuerReport.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                        : alert.severity === 'OPPORTUNITY'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getAlertSeverityBadge(alert.severity)}
                        <h5 className="text-xs font-bold text-foreground tracking-tight">
                          {alert.title}
                        </h5>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {alert.detectedAt}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {alert.description}
                    </p>
                    <div className="text-[11px] font-medium text-foreground/90 bg-white/70 dark:bg-zinc-900/70 p-2 rounded-lg border border-black/5 dark:border-white/5 flex items-start gap-1.5">
                      <span className="font-bold text-primary shrink-0">Saran Aksi:</span>
                      <span>{alert.actionHint}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
