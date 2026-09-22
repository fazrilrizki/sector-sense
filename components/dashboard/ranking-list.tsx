import * as React from 'react'
import { getTopRankedStocks, RankingTheme } from '@/lib/services/ranking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp, ShieldCheck, Activity } from 'lucide-react'

export async function RankingList({ theme, subSector, title, description }: { theme: RankingTheme, subSector: string, title: string, description: string }) {
  let rankedStocks = [];
  try {
    rankedStocks = await getTopRankedStocks(theme, subSector);
  } catch (err) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-red-500 text-base">Error Loading Ranking</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 4) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {theme === 'health' ? <ShieldCheck className="size-4" /> : <Trophy className="size-4" />}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        {rankedStocks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Tidak ada data tersedia.
          </div>
        ) : (
          <div className="space-y-3">
            {rankedStocks.map((stock, idx) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-muted-foreground">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{stock.symbol}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[120px] sm:max-w-[180px]">
                      {stock.companyName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {theme === 'dividend' && stock.breakdown.dividend.metricValue !== null && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-muted-foreground">Div. Yield</p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {(stock.breakdown.dividend.metricValue * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getScoreColor(stock.totalScore)}`}>
                    <Activity className="size-3" />
                    <span className="font-bold text-xs">{stock.totalScore}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
