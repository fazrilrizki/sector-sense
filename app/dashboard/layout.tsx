import { getAuthStatus } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = await getAuthStatus();
  const { user, profile, isGuest } = state;

  if (!user) redirect('/login');

  return (
    <DashboardShell
      userName={profile?.full_name ?? user.email ?? null}
      isGuest={isGuest}
    >
      {children}
    </DashboardShell>
  );
}
