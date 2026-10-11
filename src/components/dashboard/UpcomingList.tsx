import { isUpcoming } from '@/engine/ledger';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';
import { formatINR } from '@/utils/format';

/** Scheduled payments still to come this month, soonest first. */
export function UpcomingList({ className }: { className?: string }) {
  const { state } = useFinance();
  const upcoming = state.scheduled
    .filter((payment) => isUpcoming(payment, state.currentDay))
    .sort((a, b) => a.dueDay - b.dueDay);

  return (
    <section className={cn('card', className)} aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="card__title">
        Coming up
      </h2>
      {upcoming.length > 0 ? (
        <ul className="list">
          {upcoming.map((payment) => (
            <li key={payment.id} className="list__item">
              <span>
                <span className="list__label">{payment.label}</span>
                <span className="list__meta">
                  Day {payment.dueDay} · {payment.kind === 'subscription' ? 'Subscription' : 'Commitment'}
                </span>
              </span>
              <span className="list__amount">{formatINR(payment.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No more scheduled payments this month.</p>
      )}
    </section>
  );
}
