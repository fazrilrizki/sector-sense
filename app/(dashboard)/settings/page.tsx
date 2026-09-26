import type { Metadata } from 'next';
import { getAuthStatus } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, User, SlidersHorizontal } from 'lucide-react';
import { PreferenceWizardTrigger } from '@/components/onboarding/preference-wizard-trigger';

export const metadata: Metadata = {
  title: 'Settings — Sector Sense',
};

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const RISK_LABEL: Record<string, string> = {
  CONSERVATIVE: 'Conservative',
  ModerateE: 'Moderate',
  AGGRESSIVE: 'Aggressive',
};

const HORIZON_LABEL: Record<string, string> = {
  SHORT: 'Short Term (< 1 yrs)',
  MEDIUM: 'Medium Term (1–5 yrs)',
  LONG: 'Long Term (> 5 yrs)',
};

export default async function SettingsPage() {
  const { state } = await getAuthStatus();
  const { user, profile, isGuest } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and investment preferences.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Account Information
          </CardTitle>
          <CardDescription>Details of the active account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile?.full_name ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Account Type</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              {isGuest ? (
                <span className="text-amber-600 dark:text-amber-400">Guest</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  Registered User
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Investment Preferences */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4" />
              Investment Preferences
            </CardTitle>
            <CardDescription>
              {isGuest
                ? 'Daftar akun untuk menyimpan Investment Preferences secara permanen.'
                : 'These preferences are used as defaults across simulations.'}
            </CardDescription>
          </div>
          {!isGuest && profile && (
            <PreferenceWizardTrigger
              initialValues={{
                base_capital: Number(profile.base_capital),
                risk_tolerance: profile.risk_tolerance,
                investment_horizon: profile.investment_horizon,
              }}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isGuest ? (
            <p className="text-muted-foreground text-sm">
              Preferensi tidak tersedia untuk sesi Guest.
            </p>
          ) : profile ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Simulation Capital</span>
                <span className="font-medium font-mono">
                  {IDR.format(Number(profile.base_capital))}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Risk Tolerance</span>
                <span className="font-medium">
                  {RISK_LABEL[profile.risk_tolerance] ?? profile.risk_tolerance}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Investment Horizon</span>
                <span className="font-medium">
                  {HORIZON_LABEL[profile.investment_horizon] ??
                    profile.investment_horizon}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Profile data not available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
