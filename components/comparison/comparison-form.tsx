'use client';

import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from 'cn';

interface ComparisonFormProps {
  onSubmit: (targetTicker: string, competitorTickers: string[]) => void;
  loading: boolean;
}

export function ComparisonForm({ onSubmit, loading }: ComparisonFormProps) {
  const [target, setTarget] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['', '']);

  const setCompetitor = (i: number, value: string) => {
    setCompetitors((prev) => prev.map((c, idx) => (idx === i ? value.toUpperCase() : c)));
  };

  const addCompetitor = () => {
    if (competitors.length < 3) setCompetitors((prev) => [...prev, '']);
  };

  const removeCompetitor = (i: number) => {
    setCompetitors((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCompetitors = competitors.filter((c) => c.trim().length > 0);
    if (!target.trim() || validCompetitors.length === 0) return;
    onSubmit(target.trim().toUpperCase(), validCompetitors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Target */}
        <div className="space-y-1.5">
          <Label htmlFor="target-ticker">Saham Target</Label>
          <Input
            id="target-ticker"
            placeholder="e.g. BBCA"
            value={target}
            onChange={(e) => setTarget(e.target.value.toUpperCase())}
            maxLength={10}
            required
            className="font-mono uppercase"
          />
        </div>

        {/* Competitors */}
        <div className="space-y-1.5">
          <Label>Kompetitor (1–3 saham)</Label>
          <div className="space-y-2">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Kompetitor ${i + 1}, e.g. BMRI`}
                  value={c}
                  onChange={(e) => setCompetitor(i, e.target.value)}
                  maxLength={10}
                  className="font-mono uppercase"
                />
                {competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus kompetitor ${i + 1}`}
                    onClick={() => removeCompetitor(i)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {competitors.length < 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={addCompetitor}
              >
                <Plus className="size-3.5" />
                Tambah kompetitor
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="gap-2">
        <Search className={cn('size-4', loading && 'animate-pulse')} />
        {loading ? 'Menganalisis...' : 'Analisis Head-to-Head'}
      </Button>
    </form>
  );
}
