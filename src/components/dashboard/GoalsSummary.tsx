import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';
import { formatINR } from '@/utils/format';

/** Progress towards each savings goal. */
export function GoalsSummary({ className }: { className?: string }) {
  const { goals } = useFinance().snapshot;
  return (
    <section className={cn('card', className)} aria-labelledby="goals-heading">
      <h2 id="goals-heading" className="card__title">
        Savings goals
      </h2>
      {goals.length > 0 ? (
        <ul className="list">
          {goals.map((goal) => (
            <li key={goal.id} className="goal">
              <span className="list__label">{goal.label}</span>
              <span className="list__meta">
                {formatINR(goal.saved)} of {formatINR(goal.target)}
              </span>
              <ProgressBar label={`${goal.label} progress`} value={goal.progress} />
            </li>
          ))}
        </ul>
      ) : (
        <p>Add a goal in Plans to start saving with purpose.</p>
      )}
    </section>
  );
}
