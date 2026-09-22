'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string | null;
  isGuest: boolean;
}

export function DashboardShell({ children, userName, isGuest }: DashboardShellProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} isGuest={isGuest} onSignOut={handleSignOut} />
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <main
        className={cn(
          'pt-14 md:pl-56',
          'min-h-screen',
        )}
      >
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
