import { createContext, type Dispatch } from 'react';
import type { FinanceAction } from '@/engine/reducer';
import type { FinanceState, Snapshot } from '@/types/finance';

export interface FinanceContextValue {
  state: FinanceState;
  /** Everything derived from the ledger; recomputed whenever state changes. */
  snapshot: Snapshot;
  dispatch: Dispatch<FinanceAction>;
  /** Sends a message to screen-reader users through a polite live region. */
  announce: (message: string) => void;
}

export const FinanceContext = createContext<FinanceContextValue | null>(null);
