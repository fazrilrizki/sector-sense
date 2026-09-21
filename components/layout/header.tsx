'use client';

import Link from 'next/link';
import { LogOut, ShieldCheck, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { getNavHref, NAV_SECTIONS } from './sidebar-nav';
import { usePathname, useSearchParams } from 'next/navigation';

interface HeaderProps {
  userName?: string | null;
  isGuest: boolean;
  onSignOut: () => void;
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-64 bg-sidebar border-r border-border',
          'transition-transform duration-200 ease-in-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="p-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold">
            SS
          </div>
          <span className="font-semibold text-sm text-foreground">
            Sector Sense
          </span>
        </div>
        <nav className="flex flex-col gap-6 p-3 pt-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="flex flex-col gap-0.5">
              {si > 0 && <div className="h-px bg-border mx-2 mb-3" />}
              {section.items.map((item) => {
                const isCurrentTab = item.href.includes('?tab=')
                  ? new URL(item.href, 'http://x').searchParams.get('tab') ===
                    searchParams.get('tab')
                  : pathname === item.href && !searchParams.get('tab');
                const href = getNavHref(item.href, searchParams);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isCurrentTab
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}

export function Header({ userName, isGuest, onSignOut }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 h-14',
          'border-b border-border bg-background/80 backdrop-blur-md',
          'flex items-center px-4 gap-3'
        )}
      >
        {/* Mobile hamburger */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-4" />
        </Button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold leading-none">
            SS
          </div>
          <span className="hidden sm:block font-semibold text-sm text-foreground">
            Sector Sense
          </span>
        </Link>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isGuest ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="size-3" />
                Pengguna Tamu
              </span>
              <Link
                href="/register?upgrade=true"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Daftar Gratis
              </Link>
            </>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="size-3" />
              {userName ?? 'Pengguna'}
            </span>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            title="Keluar"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
