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
  title: 'Pengaturan — Sector Sense',
};

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const RISK_LABEL: Record<string, string> = {
  CONSERVATIVE: 'Konservatif',
  MODERATE: 'Moderat',
  AGGRESSIVE: 'Agresif',
};

const HORIZON_LABEL: Record<string, string> = {
  SHORT: 'Jangka Pendek (< 1 thn)',
  MEDIUM: 'Jangka Menengah (1–5 thn)',
  LONG: 'Jangka Panjang (> 5 thn)',
};

export default async function SettingsPage() {
  const { state } = await getAuthStatus();
  const { user, profile, isGuest } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Kelola akun dan preferensi investasi Anda.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Detail akun yang sedang aktif.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{profile?.full_name ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Tipe Akun</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              {isGuest ? (
                <span className="text-amber-600 dark:text-amber-400">Tamu</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  Pengguna Terdaftar
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
              Preferensi Investasi
            </CardTitle>
            <CardDescription>
              {isGuest
                ? 'Daftar akun untuk menyimpan preferensi investasi secara permanen.'
                : 'Preferensi ini digunakan sebagai default di seluruh simulasi.'}
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
              Preferensi tidak tersedia untuk sesi tamu.
            </p>
          ) : profile ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Modal Simulasi</span>
                <span className="font-medium font-mono">
                  {IDR.format(Number(profile.base_capital))}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Toleransi Risiko</span>
                <span className="font-medium">
                  {RISK_LABEL[profile.risk_tolerance] ?? profile.risk_tolerance}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Horizon Investasi</span>
                <span className="font-medium">
                  {HORIZON_LABEL[profile.investment_horizon] ??
                    profile.investment_horizon}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Data profil tidak tersedia.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
