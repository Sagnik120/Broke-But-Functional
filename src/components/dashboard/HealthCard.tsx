import { HealthGauge } from '@/components/charts/HealthGauge';
import { HEALTH_LABELS, HEALTH_VIBES } from '@/constants';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';

/** Financial health as one score, a grade and a mood. */
export function HealthCard({ className }: { className?: string }) {
  const { health } = useFinance().snapshot;
  return (
    <section className={cn('card', className)} aria-labelledby="health-heading">
      <h2 id="health-heading" className="card__title">
        Financial health
      </h2>
      <div className="health">
        <HealthGauge score={health.score} grade={health.grade} />
        <p>
          You're <strong>{HEALTH_LABELS[health.grade].toLowerCase()}</strong>. The score blends your spending
          pace, month-end cushion, bill coverage and savings progress.
        </p>
      </div>
      <p className="hand-note">{HEALTH_VIBES[health.grade]}</p>
    </section>
  );
}
