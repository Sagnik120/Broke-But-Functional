import { ArrowRight } from 'lucide-react';
import { DayControl } from '@/components/dashboard/DayControl';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';
import { formatINR } from '@/utils/format';

interface HeroCardProps {
  className?: string;
  onSimulate: () => void;
}

/** The headline answer: how much is safe to spend today, and whether the current pace fits it. */
export function HeroCard({ className, onSimulate }: HeroCardProps) {
  const { snapshot } = useFinance();
  const onPace = snapshot.burnRate <= snapshot.dailyAllowance;

  return (
    <section className={cn('hero card ruled', className)} aria-labelledby="hero-heading">
      <div className="hero__copy">
        <h2 id="hero-heading" className="eyebrow">
          Safe to spend today
        </h2>
        <p className="hero__amount">
          <span className="highlight">
            <AnimatedNumber value={snapshot.dailyAllowance} />
          </span>
        </p>
        <p className="hand-note" data-tone={onPace ? 'good' : 'bad'}>
          {onPace
            ? `You spend about ${formatINR(snapshot.burnRate)} a day. Under the line, keep going.`
            : `You spend about ${formatINR(snapshot.burnRate)} a day. That's over the line.`}
        </p>
        <p className="hero__note">
          {formatINR(snapshot.balance)} balance − {formatINR(snapshot.upcoming)} already promised, spread over{' '}
          {snapshot.daysLeft} {snapshot.daysLeft === 1 ? 'day' : 'days'}.
        </p>
      </div>
      <div className="hero__actions">
        <DayControl />
        <button type="button" className="button button--primary" onClick={onSimulate}>
          Test a decision first
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
