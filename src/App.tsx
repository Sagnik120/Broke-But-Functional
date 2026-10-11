import { lazy, Suspense, useCallback, useState } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import type { DecisionDraft } from '@/components/simulator/draft';
import { PanelSkeleton } from '@/components/ui/PanelSkeleton';
import { tabId } from '@/components/ui/Tabs';
import { APP_NAME, ROUTES, type RouteId } from '@/constants/routes';
import { FinanceProvider } from '@/context/FinanceProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useHashRoute } from '@/hooks/useHashRoute';
import { usePrefetch } from '@/hooks/usePrefetch';
import DashboardPage from '@/pages/DashboardPage';
import type { FinanceState } from '@/types/finance';

// Route-level code splitting: the dashboard ships in the first bundle, every other view on demand.
const loadSimulator = () => import('@/pages/SimulatorPage');
const loadActivity = () => import('@/pages/ActivityPage');
const loadPlans = () => import('@/pages/PlansPage');

const SimulatorPage = lazy(loadSimulator);
const ActivityPage = lazy(loadActivity);
const PlansPage = lazy(loadPlans);

const LAZY_ROUTES = [loadSimulator, loadActivity, loadPlans] as const;

function Shell() {
  const [route, navigate] = useHashRoute();
  const [prefill, setPrefill] = useState<Partial<DecisionDraft> | null>(null);

  const title = ROUTES.find((entry) => entry.id === route)?.title ?? APP_NAME;
  useDocumentTitle(`${title} · ${APP_NAME}`);
  usePrefetch(LAZY_ROUTES);

  const handleNavigate = useCallback(
    (id: RouteId) => {
      setPrefill(null);
      navigate(id);
    },
    [navigate],
  );

  /** Opens the simulator, optionally with a decision already filled in. */
  const openSimulator = useCallback(
    (draft?: Partial<DecisionDraft>) => {
      setPrefill(draft ?? null);
      navigate('simulate');
      document.getElementById(tabId('simulate'))?.focus();
    },
    [navigate],
  );

  return (
    <AppShell route={route} onNavigate={handleNavigate}>
      <ErrorBoundary>
        <Suspense fallback={<PanelSkeleton />}>
          {route === 'overview' && <DashboardPage onSimulate={openSimulator} />}
          {route === 'simulate' && <SimulatorPage initialDraft={prefill} />}
          {route === 'activity' && <ActivityPage />}
          {route === 'plans' && <PlansPage />}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

interface AppProps {
  initialState?: FinanceState;
}

export default function App({ initialState }: AppProps) {
  return (
    <ThemeProvider>
      <FinanceProvider initialState={initialState}>
        <Shell />
      </FinanceProvider>
    </ThemeProvider>
  );
}
