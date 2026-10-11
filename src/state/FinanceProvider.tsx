import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ACTION_RATE_LIMIT } from '../domain/constants';
import { computeSnapshot } from '../domain/ledger';
import { createRateLimiter, type RateLimiter } from '../domain/rateLimit';
import { financeReducer, type FinanceAction } from '../domain/reducer';
import { createDemoState } from '../domain/seed';
import { loadState, saveState } from '../domain/storage';
import type { FinanceState } from '../domain/types';
import { FinanceContext, type FinanceContextValue } from './finance-context';

interface FinanceProviderProps {
  children: ReactNode;
  /** Overrides stored data; used by tests and embedded previews. */
  initialState?: FinanceState;
  /** Overrides the default action rate limiter; used by tests. */
  rateLimiter?: RateLimiter;
}

function initialise(provided: FinanceState | undefined): FinanceState {
  return provided ?? loadState() ?? createDemoState();
}

export function FinanceProvider({ children, initialState, rateLimiter }: FinanceProviderProps) {
  const [state, rawDispatch] = useReducer(financeReducer, initialState, initialise);
  const [announcement, setAnnouncement] = useState('');
  const [throttled, setThrottled] = useState(false);
  const [limiter] = useState(() => rateLimiter ?? createRateLimiter(ACTION_RATE_LIMIT));
  // Remembers whether the latest action was rejected, so its success message is not announced.
  const lastActionBlocked = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  /** Every ledger change passes through the rate limiter before reaching the reducer. */
  const dispatch = useCallback(
    (action: FinanceAction) => {
      const allowed = limiter.tryAcquire();
      lastActionBlocked.current = !allowed;
      setThrottled(!allowed);
      if (allowed) rawDispatch(action);
    },
    [limiter],
  );

  const announce = useCallback((message: string) => {
    if (!lastActionBlocked.current) setAnnouncement(message);
  }, []);

  const snapshot = useMemo(() => computeSnapshot(state), [state]);
  const value = useMemo<FinanceContextValue>(
    () => ({ state, snapshot, dispatch, announce }),
    [state, snapshot, dispatch, announce],
  );

  return (
    <FinanceContext.Provider value={value}>
      {children}
      {throttled && (
        <p className="toast" role="alert">
          You're going too fast. Wait a few seconds and try again; nothing was changed.
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </FinanceContext.Provider>
  );
}
