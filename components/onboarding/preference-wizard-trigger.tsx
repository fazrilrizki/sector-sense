'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PreferenceWizard } from './preference-wizard';
import { Settings2 } from 'lucide-react';
import type { RiskTolerance, InvestmentHorizon } from '@/types/database.types';

interface PreferenceWizardTriggerProps {
  initialValues: {
    base_capital: number;
    risk_tolerance: RiskTolerance;
    investment_horizon: InvestmentHorizon;
  };
}

export function PreferenceWizardTrigger({
  initialValues,
}: PreferenceWizardTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Settings2 className="size-3.5" />
        Ubah Preferensi
      </Button>

      <PreferenceWizard
        open={open}
        onOpenChange={setOpen}
        initialValues={initialValues}
      />
    </>
  );
}
