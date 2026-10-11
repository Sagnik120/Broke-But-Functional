import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { computeSnapshot } from '../domain/ledger';
import { financeReducer } from '../domain/reducer';
import { createDemoState } from '../domain/seed';
import { loadState, saveState } from '../domain/storage';
import type { FinanceState } from '../domain/types';
import { FinanceContext, type FinanceContextValue } from './finance-context';

interface FinanceProviderProps {
  children: ReactNode;
  /** Overrides stored data; used by tests and embedded previews. */
  initialState?: FinanceState;
}

function initialise(provided: FinanceState | undefined): FinanceState {
  return provided ?? loadState() ?? createDemoState();
}

export function FinanceProvider({ children, initialState }: FinanceProviderProps) {
  const [state, dispatch] = useReducer(financeReducer, initialState, initialise);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const snapshot = useMemo(() => computeSnapshot(state), [state]);
  const value = useMemo<FinanceContextValue>(
    () => ({ state, snapshot, dispatch, announce: setAnnouncement }),
    [state, snapshot],
  );

  return (
    <FinanceContext.Provider value={value}>
      {children}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </FinanceContext.Provider>
  );
}
