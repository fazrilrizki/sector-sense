'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from 'cn';

const POPULAR_STOCKS = [
  { value: 'BBCA', label: 'BBCA - Bank Central Asia' },
  { value: 'BBRI', label: 'BBRI - Bank Rakyat Indonesia' },
  { value: 'BMRI', label: 'BMRI - Bank Mandiri' },
  { value: 'BBNI', label: 'BBNI - Bank Negara Indonesia' },
  { value: 'ASII', label: 'ASII - Astra International' },
  { value: 'TLKM', label: 'TLKM - Telkom Indonesia' },
  { value: 'AMMN', label: 'AMMN - Amman Mineral' },
  { value: 'BREN', label: 'BREN - Barito Renewables' },
  { value: 'GOTO', label: 'GOTO - GoTo Gojek Tokopedia' },
  { value: 'ADRO', label: 'ADRO - Adaro Energy' },
  { value: 'PTBA', label: 'PTBA - Bukit Asam' },
  { value: 'ITMG', label: 'ITMG - Indo Tambangraya' },
  { value: 'ICBP', label: 'ICBP - Indofood CBP' },
  { value: 'INDF', label: 'INDF - Indofood Sukses Makmur' },
];

interface ComparisonFormProps {
  onSubmit: (targetTicker: string, competitorTickers: string[]) => void;
  loading: boolean;
}

function StockCombobox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const displayValue = value ? value.toUpperCase() : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-mono font-normal uppercase"
          >
            {displayValue || <span className="text-muted-foreground normal-case font-sans">{placeholder}</span>}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Cari kode saham..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.length > 0 ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    onChange(search.toUpperCase());
                    setOpen(false);
                  }}
                >
                  Gunakan &quot;{search.toUpperCase()}&quot;
                </Button>
              ) : (
                "Ketik kode saham..."
              )}
            </CommandEmpty>
            <CommandGroup>
              {POPULAR_STOCKS.map((stock) => (
                <CommandItem
                  key={stock.value}
                  value={stock.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      displayValue === stock.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {stock.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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
          <Label>Saham Target</Label>
          <StockCombobox
            value={target}
            onChange={setTarget}
            placeholder="e.g. BBCA"
          />
        </div>

        {/* Competitors */}
        <div className="space-y-1.5">
          <Label>Kompetitor (1–3 saham)</Label>
          <div className="space-y-2">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <StockCombobox
                    value={c}
                    onChange={(val) => setCompetitor(i, val)}
                    placeholder={`Kompetitor ${i + 1}, e.g. BMRI`}
                  />
                </div>
                {competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus kompetitor ${i + 1}`}
                    onClick={() => removeCompetitor(i)}
                    className="shrink-0"
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
                className="gap-1.5 text-muted-foreground w-full justify-start"
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
