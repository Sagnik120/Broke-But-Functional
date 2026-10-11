import { FlaskConical, LayoutDashboard, ReceiptText, Target, type LucideIcon } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { DESKTOP_MEDIA_QUERY } from '@/constants';
import { ROUTES, type RouteId } from '@/constants/routes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const ICONS: Record<RouteId, LucideIcon> = {
  overview: LayoutDashboard,
  simulate: FlaskConical,
  activity: ReceiptText,
  plans: Target,
};

const NAV_TABS: ReadonlyArray<TabItem<RouteId>> = ROUTES.map((route) => {
  const Icon = ICONS[route.id];
  return { id: route.id, label: route.label, icon: <Icon size={20} aria-hidden="true" /> };
});

interface PrimaryNavProps {
  active: RouteId;
  onNavigate: (id: RouteId) => void;
}

/**
 * The app's main navigation. CSS turns the same element into a bottom tab bar
 * on phones, a floating dock on tablets and a sidebar list on desktops.
 */
export function PrimaryNav({ active, onNavigate }: PrimaryNavProps) {
  const vertical = useMediaQuery(DESKTOP_MEDIA_QUERY);
  return (
    <nav className="shell__nav" aria-label="Primary">
      <Tabs
        label="Budget views"
        tabs={NAV_TABS}
        active={active}
        onChange={onNavigate}
        orientation={vertical ? 'vertical' : 'horizontal'}
      />
    </nav>
  );
}
