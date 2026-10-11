import type { ReactNode } from 'react';
import emptyLedger from '@/assets/empty-ledger.svg';

/** Friendly placeholder for a list with nothing in it yet. The illustration is decorative. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <img src={emptyLedger} alt="" width={160} height={120} loading="lazy" decoding="async" />
      {children}
    </div>
  );
}
