import {
  LayoutDashboard,
  Hammer,
  ShieldCheck,
  Rocket,
  History,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    description: 'System health & pipeline summaries',
  },
  {
    id: 'builds',
    label: 'Builds',
    path: '/builds',
    icon: Hammer,
    description: 'Commit exploration & build triggers',
  },
  {
    id: 'stable',
    label: 'Stable Builds',
    path: '/stable',
    icon: ShieldCheck,
    description: 'Validated artifacts & promotion history',
  },
  {
    id: 'releases',
    label: 'Releases',
    path: '/releases',
    icon: Rocket,
    description: 'Signing, repackaging & deployment stages',
  },
  {
    id: 'activity',
    label: 'Activity',
    path: '/activity',
    icon: History,
    description: 'Audit logs & workflow history',
  },
];

export const APP_CONFIG = {
  name: 'Atlas',
  subtitle: 'Build & Release Console',
  version: '26.4.1',
  gitlabHost: 'https://gitlab.internal.corp',
};
