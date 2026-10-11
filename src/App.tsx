import { lazy, Suspense, useState } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { panelId, tabId, Tabs, type TabItem } from './components/ui/Tabs';
import { HEALTH_LABELS, MONTH_DAYS } from './domain/constants';
import { formatINR } from './domain/format';
import type { FinanceState } from './domain/types';
import { FinanceProvider } from './state/FinanceProvider';
import { useFinance } from './state/useFinance';

// Secondary views are split out so the dashboard paints with the smallest bundle.
const Simulator = lazy(() => import('./components/simulator/Simulator'));
const Activity = lazy(() => import('./components/activity/Activity'));
const Plans = lazy(() => import('./components/plans/Plans'));

type TabId = 'overview' | 'simulate' | 'activity' | 'plans';

const TABS: ReadonlyArray<TabItem<TabId>> = [
  { id: 'overview', label: 'Overview' },
  { id: 'simulate', label: 'What if?' },
  { id: 'activity', label: 'Activity' },
  { id: 'plans', label: 'Plans' },
];

function Shell() {
  const { snapshot } = useFinance();
  const [active, setActive] = useState<TabId>('overview');

  function openSimulator() {
    setActive('simulate');
    document.getElementById(tabId('simulate'))?.focus();
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="masthead">
        <div className="masthead__inner">
          <div>
            <h1 className="brand">Broke But Functional</h1>
            <p className="brand__tagline">₹10,000. 30 days. See the consequences before you spend.</p>
          </div>
          <p className="masthead__summary">
            <span>
              Day {snapshot.day}/{MONTH_DAYS}
            </span>
            <span>{formatINR(snapshot.balance)} left</span>
            <span data-grade={snapshot.health.grade}>{HEALTH_LABELS[snapshot.health.grade]}</span>
          </p>
        </div>
        <div className="masthead__inner">
          <Tabs label="Budget views" tabs={TABS} active={active} onChange={setActive} />
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div
          className="panel"
          role="tabpanel"
          id={panelId(active)}
          aria-labelledby={tabId(active)}
        >
          <ErrorBoundary>
            <Suspense fallback={<p className="card">Loading…</p>}>
              {active === 'overview' && <Dashboard onSimulate={openSimulator} />}
              {active === 'simulate' && <Simulator />}
              {active === 'activity' && <Activity />}
              {active === 'plans' && <Plans />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      <footer className="footer">
        <p>Your budget is stored only in this browser. No account, no tracking.</p>
      </footer>
    </>
  );
}

interface AppProps {
  initialState?: FinanceState;
}

export default function App({ initialState }: AppProps) {
  return (
    <FinanceProvider initialState={initialState}>
      <Shell />
    </FinanceProvider>
  );
}
