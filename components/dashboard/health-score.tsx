import { calculateHealthScore } from '@/lib/services/healthScore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export async function HealthScoreWidget({ symbol }: { symbol: string }) {
  let result;
  try {
    result = await calculateHealthScore(symbol);
  } catch (err: any) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>Gagal memuat skor untuk {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{err.message}</p>
        </CardContent>
      </Card>
    );
  }

  const { totalScore, breakdown } = result;

  // Skor direpresentasikan dari 0-10, dibagi 5 pilar (masing-masing 0-2)
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-500';
    if (score >= 4) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (val: number) => {
    if (val === 2) return 'bg-emerald-500';
    if (val === 1) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Financial Health Score
            </CardTitle>
            <CardDescription>Analisis kesehatan fundamental {symbol} vs Kompetitor</CardDescription>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>
            {totalScore}<span className="text-lg text-muted-foreground">/10</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(breakdown).map(([key, data]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">{data.label}</span>
                <span className="text-muted-foreground font-mono">
                  {data.metricValue !== null 
                    ? typeof data.metricValue === 'number' && Math.abs(data.metricValue) < 10 
                      ? data.metricValue.toFixed(2)
                      : data.metricValue.toLocaleString('id-ID')
                    : 'N/A'}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                <div className={`h-full ${getBarColor(data.score)} transition-all`} style={{ width: `${(data.score / 2) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
