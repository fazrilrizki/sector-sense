'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from 'cn';
import { NAV_SECTIONS } from './sidebar-nav';

function isActive(href: string, pathname: string, searchParams: URLSearchParams): boolean {
  if (href === '/dashboard' && pathname === '/dashboard' && !searchParams.get('tab')) return true;
  if (href.includes('?tab=')) {
    const tab = new URL(href, 'http://x').searchParams.get('tab');
    return pathname === '/dashboard' && searchParams.get('tab') === tab;
  }
  return pathname === href;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-56 shrink-0',
        'border-r border-border bg-sidebar',
        'fixed left-0 top-14 bottom-0 z-30 overflow-y-auto',
      )}
    >
      <nav className="flex flex-col gap-6 p-3 pt-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {si > 0 && <div className="h-px bg-border mx-2 mb-3" />}
            {section.items.map((item) => {
              const active = isActive(item.href, pathname, searchParams);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
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
    </aside>
  );
}
