import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { createDemoState, createEmptyState } from '@/engine/seed';
import { useFinance } from '@/hooks/useFinance';
import type { FinanceState } from '@/types/finance';
import { cn } from '@/utils/cn';

/** Destructive month-level actions, each behind a two-step confirmation. */
export function MonthTools({ className }: { className?: string }) {
  const { dispatch, announce } = useFinance();

  function replaceState(next: FinanceState, message: string) {
    dispatch({ type: 'state/replaced', state: next });
    announce(message);
  }

  return (
    <section className={cn('card month-tools', className)} aria-labelledby="month-heading">
      <h2 id="month-heading" className="card__title">
        Start over
      </h2>
      <p>Your data stays on this device. Reset any time.</p>
      <div className="month-tools__actions">
        <ConfirmButton
          label="Start a fresh month"
          confirmLabel="Yes, wipe and start at ₹10,000"
          onConfirm={() => replaceState(createEmptyState(), 'Started a fresh month with ₹10,000.')}
        />
        <ConfirmButton
          label="Load the demo month"
          confirmLabel="Yes, replace with demo data"
          onConfirm={() => replaceState(createDemoState(), 'Loaded the demo month.')}
        />
      </div>
    </section>
  );
}
