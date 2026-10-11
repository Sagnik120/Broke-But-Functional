import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { HEALTH_LABELS, MONTH_DAYS } from '@/constants';
import { useFinance } from '@/hooks/useFinance';

/** The month at a glance: where you are, what is left and how healthy it looks. */
export function MonthStatus() {
  const { snapshot } = useFinance();
  return (
    <p className="status-chips order-3 w-full lg:order-none">
      <span>
        Day {snapshot.day}/{MONTH_DAYS}
      </span>
      <span>
        <AnimatedNumber value={snapshot.balance} /> left
      </span>
      <span data-grade={snapshot.health.grade}>{HEALTH_LABELS[snapshot.health.grade]}</span>
    </p>
  );
}
