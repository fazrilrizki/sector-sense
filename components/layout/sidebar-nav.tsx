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
        href: '/dashboard?tab=analyzer',
        icon: Search,
      },
      {
        label: 'Market Rankings',
        href: '/dashboard?tab=rankings',
        icon: TrendingUp,
      },
      {
        label: 'Corporate Radar',
        href: '/dashboard?tab=radar',
        icon: Calendar,
      },
      {
        label: 'Komparasi',
        href: '/dashboard?tab=comparison',
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
