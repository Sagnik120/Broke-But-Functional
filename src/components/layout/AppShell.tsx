import type { ReactNode } from 'react';
import { MonthStatus } from '@/components/layout/MonthStatus';
import { OfflineNotice } from '@/components/layout/OfflineNotice';
import { PrimaryNav } from '@/components/layout/PrimaryNav';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { BrandMark } from '@/components/ui/BrandMark';
import { panelId, tabId } from '@/components/ui/Tabs';
import type { RouteId } from '@/constants/routes';

interface AppShellProps {
  route: RouteId;
  onNavigate: (id: RouteId) => void;
  children: ReactNode;
}

/** Page frame: brand, navigation, month status and the active view's panel. */
export function AppShell({ route, onNavigate, children }: AppShellProps) {
  return (
    <div className="shell">
      <SkipLink />
      <header className="shell__side">
        <div className="brand-block">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="brand lg:text-[1.75rem]">
              Broke But <em>Functional</em>
            </h1>
            <p className="brand__tagline hidden sm:block lg:text-[0.95rem]">
              ₹10,000. 30 days. See the consequences before you spend.
            </p>
          </div>
        </div>
        <PrimaryNav active={route} onNavigate={onNavigate} />
        <MonthStatus />
        <div className="shell__tools order-2 lg:order-none">
          <ThemeToggle />
          <OfflineNotice />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="shell__main">
        <div
          className="panel"
          role="tabpanel"
          id={panelId(route)}
          aria-labelledby={tabId(route)}
          tabIndex={0}
        >
          {children}
        </div>
      </main>

      <footer className="footer shell__footer">
        <p>Your budget is stored only in this browser. No account, no tracking.</p>
      </footer>
    </div>
  );
}
