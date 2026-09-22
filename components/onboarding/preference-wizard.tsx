'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { updateUserProfile } from '@/lib/auth/profile-actions';
import type { RiskTolerance, InvestmentHorizon } from '@/types/database.types';
import { ShieldAlert, ShieldCheck, Zap, Clock, CalendarDays, TrendingUp, AlertTriangle } from 'lucide-react';

const TOTAL_STEPS = 3;

interface WizardState {
  base_capital: number;
  rawCapital: string;
  risk_tolerance: RiskTolerance;
  investment_horizon: InvestmentHorizon;
}

interface PreferenceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    base_capital: number;
    risk_tolerance: RiskTolerance;
    investment_horizon: InvestmentHorizon;
  };
  onSuccess?: () => void;
}

function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
}

const RISK_OPTIONS: {
  value: RiskTolerance;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: 'CONSERVATIVE',
    label: 'Konservatif',
    description: 'Prioritas keamanan modal. Volatilitas rendah, return stabil.',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'MODERATE',
    label: 'Moderat',
    description: 'Seimbang antara risiko dan potensi keuntungan jangka menengah.',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'AGGRESSIVE',
    label: 'Agresif',
    description: 'Toleransi tinggi terhadap volatilitas demi potensi return maksimal.',
    icon: Zap,
    color: 'text-rose-600 dark:text-rose-400',
  },
];

const HORIZON_OPTIONS: {
  value: InvestmentHorizon;
  label: string;
  sublabel: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'SHORT',
    label: 'Jangka Pendek',
    sublabel: '< 1 tahun',
    description: 'Fokus likuiditas dan peluang dividen jangka dekat.',
    icon: Clock,
  },
  {
    value: 'MEDIUM',
    label: 'Jangka Menengah',
    sublabel: '1 – 5 tahun',
    description: 'Pertumbuhan fundamental dengan eksposur risiko terkontrol.',
    icon: CalendarDays,
  },
  {
    value: 'LONG',
    label: 'Jangka Panjang',
    sublabel: '> 5 tahun',
    description: 'Akumulasi kekayaan jangka panjang melalui compounding.',
    icon: TrendingUp,
  },
];

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 pb-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < step
              ? 'w-6 bg-primary'
              : i === step - 1
                ? 'w-8 bg-primary'
                : 'w-4 bg-muted',
          )}
        />
      ))}
    </div>
  );
}

export function PreferenceWizard({
  open,
  onOpenChange,
  initialValues,
  onSuccess,
}: PreferenceWizardProps) {
  const defaultCapital = initialValues?.base_capital ?? 10_000_000;

  const [step, setStep] = useState(1);
  const [values, setValues] = useState<WizardState>({
    base_capital: defaultCapital,
    rawCapital: formatRupiah(String(defaultCapital)),
    risk_tolerance: initialValues?.risk_tolerance ?? 'MODERATE',
    investment_horizon: initialValues?.investment_horizon ?? 'MEDIUM',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCapitalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    setValues((v) => ({
      ...v,
      rawCapital: formatRupiah(raw),
      base_capital: raw ? parseInt(raw, 10) : 0,
    }));
  }

  function handleNext() {
    if (step === 1 && values.base_capital < 1_000_000) {
      setError('Modal minimal Rp 1.000.000.');
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserProfile({
        base_capital: values.base_capital,
        risk_tolerance: values.risk_tolerance,
        investment_horizon: values.investment_horizon,
      });

      if (!result.success) {
        setError(result.error ?? 'Gagal menyimpan.');
        return;
      }

      onOpenChange(false);
      onSuccess?.();
      setStep(1);
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep(1);
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2">
            <StepDots step={step} />
          </div>
          <DialogTitle>
            {step === 1 && 'Modal Awal Simulasi'}
            {step === 2 && 'Toleransi Risiko'}
            {step === 3 && 'Horizon Investasi'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Berapa modal yang ingin Anda gunakan untuk simulasi investasi?'}
            {step === 2 && 'Seberapa besar risiko yang dapat Anda terima?'}
            {step === 3 && 'Berapa lama Anda berencana memegang investasi?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Step 1: Capital */}
          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="wiz-capital">Jumlah Modal (IDR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  id="wiz-capital"
                  value={values.rawCapital}
                  onChange={handleCapitalChange}
                  placeholder="10.000.000"
                  className="pl-9 font-mono"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimal Rp 1.000.000
              </p>
            </div>
          )}

          {/* Step 2: Risk tolerance */}
          {step === 2 && (
            <div className="space-y-2">
              {RISK_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = values.risk_tolerance === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({ ...v, risk_tolerance: opt.value }))
                    }
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
                    )}
                  >
                    <Icon className={cn('size-5 mt-0.5 shrink-0', opt.color)} />
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                    {selected && (
                      <div className="ml-auto size-4 rounded-full bg-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Horizon */}
          {step === 3 && (
            <div className="space-y-2">
              {HORIZON_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = values.investment_horizon === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        investment_horizon: opt.value,
                      }))
                    }
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
                    )}
                  >
                    <Icon className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">
                        {opt.label}{' '}
                        <span className="font-normal text-muted-foreground">
                          ({opt.sublabel})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                    {selected && (
                      <div className="ml-auto size-4 rounded-full bg-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
              <AlertTriangle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
            >
              Kembali
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext}>
              Lanjut →
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan Preferensi'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
