import type { Metadata } from 'next';
import { getAuthStatus } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, User, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pengaturan — Sector Sense',
};

export default async function SettingsPage() {
  const { state } = await getAuthStatus();
  const { user, profile, isGuest } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Kelola akun dan preferensi Anda.
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

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" />
            Notifikasi
          </CardTitle>
          <CardDescription>Pengaturan notifikasi akan tersedia segera.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fitur ini sedang dalam pengembangan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
