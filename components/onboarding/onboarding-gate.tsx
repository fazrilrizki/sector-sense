'use client';

import { useState, useEffect } from 'react';
import { PreferenceWizard } from './preference-wizard';
import type { UserProfile } from '@/lib/auth/types';

function isDefaultProfile(profile: UserProfile): boolean {
  return (
    Number(profile.base_capital) === 10_000_000 &&
    profile.risk_tolerance === 'MODERATE' &&
    profile.investment_horizon === 'MEDIUM'
  );
}

export function OnboardingGate({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDefaultProfile(profile)) {
      // Small delay so layout renders first
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [profile]);

  return (
    <PreferenceWizard
      open={open}
      onOpenChange={setOpen}
      initialValues={{
        base_capital: Number(profile.base_capital),
        risk_tolerance: profile.risk_tolerance,
        investment_horizon: profile.investment_horizon,
      }}
    />
  );
}
