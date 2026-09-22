import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Calendar,
  GitCompare,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export interface NavSection {
  items: NavItem[];
}

type SearchParamReader = {
  get(name: string): string | null;
};

export function getNavHref(
  href: string,
  searchParams: SearchParamReader
): string {
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return href;
  }

  const url = new URL(href, 'http://sector-sense.local');
  url.searchParams.set('symbol', symbol);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Smart Analyzer',
        href: '/dashboard/analyzer',
        icon: Search,
      },
      {
        label: 'Market Rankings',
        href: '/dashboard/rankings',
        icon: TrendingUp,
      },
      {
        label: 'Corporate Radar',
        href: '/dashboard/radar',
        icon: Calendar,
      },
      {
        label: 'Komparasi',
        href: '/dashboard/comparison',
        icon: GitCompare,
        badge: 'Baru',
      },
    ],
  },
  {
    items: [
      {
        label: 'Pengaturan',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
];
