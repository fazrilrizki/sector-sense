import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Calendar,
  GitCompare,
  Settings,
  Activity,
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
        label: 'Dasbor',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Analisis Pintar',
        href: '/analyzer',
        icon: Search,
      },
      {
        label: 'Peringkat Pasar',
        href: '/rankings',
        icon: TrendingUp,
      },
      {
        label: 'Radar Korporasi',
        href: '/radar',
        icon: Calendar,
      },
      {
        label: 'Komparasi',
        href: '/comparison',
        icon: GitCompare,
      },
      {
        label: 'Performa Model',
        href: '/performance',
        icon: Activity,
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
