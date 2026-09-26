import { getCorporateRadar, type CalendarEvent } from '@/lib/services/corporateRadar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Coins,
  Percent,
  History,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react'

export async function CorporateRadarWidget({ symbol }: { symbol: string }) {
  let radar;
  try {
    radar = await getCorporateRadar(symbol);
  } catch (err: any) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="size-5" />
            Corporate Radar
          </CardTitle>
          <CardDescription>Failed to load corporate action schedule for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{err.message}</p>
        </CardContent>
      </Card>
    );
  }

  const {
    companyName,
    sector,
    subSector,
    yieldTtm,
    avgYield5y,
    dividendTtm,
    payoutRatio,
    cashPayoutRatio,
    isHighYield,
    dividendSafetyLevel,
    dividendSafetyExplanation,
    consistencyYears,
    upcomingEvents,
    recentEvents,
    historicalDividends,
    calendar,
  } = radar;

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatRupiah = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const getSafetyBadge = () => {
    switch (dividendSafetyLevel) {
      case 'SAFE':
        return (
          <Badge variant="success" className="gap-1.5 px-3 py-1">
            <CheckCircle2 className="size-3.5" />
            Dividen Berkelanjutan (Aman)
          </Badge>
        );
      case 'MODERATE':
        return (
          <Badge variant="warning" className="gap-1.5 px-3 py-1">
            <AlertCircle className="size-3.5" />
            Dividen Moderat
          </Badge>
        );
      case 'AT_RISK':
        return (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1 animate-pulse">
            <AlertTriangle className="size-3.5" />
            Waspada Dividend Trap!
          </Badge>
        );
    }
  };

  const getEventBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'DIVIDEND':
        return <Badge variant="default" className="text-[10px]">Dividen Tunai</Badge>;
      case 'AGM':
        return <Badge variant="secondary" className="text-[10px]">RUPS / AGM</Badge>;
      case 'STOCK_SPLIT':
        return <Badge variant="info" className="text-[10px]">Stock Split</Badge>;
      case 'RIGHTS_ISSUE':
        return <Badge variant="warning" className="text-[10px]">Right Issue</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Overview & Radar Indicators */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  Corporate Radar & Dividend Engine
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {symbol}
                </Badge>
                {isHighYield && (
                  <Badge variant="info" className="gap-1">
                    <Sparkles className="size-3" />
                    High Yield (&gt;5%)
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                {companyName} {sector ? `• Sektor ${sector}` : ''} {subSector ? `(${subSector})` : ''}
              </CardDescription>
            </div>
            <div>{getSafetyBadge()}</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metric 1: Dividend Yield TTM */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Percent className="size-3.5 text-primary" />
                Yield Dividen (TTM)
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatPercent(yieldTtm)}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Rata-rata 5 Thn: {formatPercent(avgYield5y)}
                </p>
              </div>
            </div>

            {/* Metric 2: Payout Ratio */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" />
                Payout Ratio (Laba)
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatPercent(payoutRatio)}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cash Flow Payout: {formatPercent(cashPayoutRatio)}
                </p>
              </div>
            </div>

            {/* Metric 3: Total Dividend TTM */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Coins className="size-3.5 text-primary" />
                Total Dividen TTM
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatRupiah(dividendTtm)}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Per lembar saham
                </p>
              </div>
            </div>

            {/* Metric 4: Konsistensi Pembayaran */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <History className="size-3.5 text-primary" />
                Konsistensi Dividen
              </span>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {consistencyYears} Tahun
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Berturut-turut membagi dividen
                </p>
              </div>
            </div>
          </div>

          {/* Safety & Risk Explanation Banner */}
          <div
            className={`p-3.5 rounded-xl text-sm border flex items-start gap-3 ${
              dividendSafetyLevel === 'SAFE'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : dividendSafetyLevel === 'MODERATE'
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300'
                : 'bg-destructive/10 border-destructive/25 text-destructive'
            }`}
          >
            {dividendSafetyLevel === 'SAFE' ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">
                Radar Evaluasi Risiko Dividen (Epic 4 Mitigasi)
              </p>
              <p className="text-xs leading-relaxed opacity-90">{dividendSafetyExplanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Timeline Kalender Aksi Korporasi & Dividen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Kalender Aksi Korporasi Terkini (2 spans) */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Kalender Aksi Korporasi Terkini & Mendatang
            </CardTitle>
            <CardDescription>
              Cum Date, Ex Date, and Dividend Payment Schedule {symbol}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendar.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No corporate action data yet for this stock.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {calendar.slice(0, 6).map((event) => (
                  <div key={event.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEventBadge(event.type)}
                        <span className="font-semibold text-sm text-foreground">
                          {event.title}
                        </span>
                        {event.status === 'UPCOMING' && (
                          <Badge variant="warning" className="text-[10px] animate-pulse">
                            Mendatang
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{event.details}</p>
                    </div>

                    <div className="text-left sm:text-right text-xs space-y-0.5 bg-muted/40 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <div className="font-mono text-foreground font-medium">
                        <span className="text-muted-foreground">Ex-Date: </span>
                        {event.date}
                      </div>
                      {event.cumDate && (
                        <div className="font-mono text-muted-foreground text-[11px]">
                          <span>Cum-Date: </span>
                          <span className="text-primary font-medium">{event.cumDate}</span>
                        </div>
                      )}
                      {event.paymentDate && (
                        <div className="font-mono text-muted-foreground text-[11px]">
                          <span>Bayar: </span>
                          {event.paymentDate}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Histori Pembagian Dividen Tahunan (1 span) */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Histori Dividen Tahunan
            </CardTitle>
            <CardDescription>
              Rekam jejak total dividen per tahun
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historicalDividends.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Tidak ada data histori dividen.
              </p>
            ) : (
              <div className="space-y-3">
                {historicalDividends.slice(0, 5).map((h) => (
                  <div
                    key={h.year}
                    className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {h.year}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({h.payoutCount}x bagi)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Yield: {formatPercent(h.totalYield)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-foreground">
                        Rp {h.totalDividend.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
