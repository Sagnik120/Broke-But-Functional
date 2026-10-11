import { useDeferredValue, useId, useMemo, useState } from 'react';
import type { DecisionDraft } from '@/components/simulator/draft';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { VERDICT_TITLES } from '@/constants';
import { simulate, type Verdict } from '@/engine/simulate';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';
import { formatINR } from '@/utils/format';

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 5000;
const STEP = 50;
const DEFAULT_AMOUNT = 500;
const ONE_OFF_LABEL = 'One-off treat';

const VERDICT_TONES: Record<Verdict, BadgeTone> = { safe: 'good', caution: 'warn', risky: 'bad' };

interface QuickCheckProps {
  className?: string;
  onOpenSimulator: (draft: Partial<DecisionDraft>) => void;
}

/**
 * A slider that answers "what if I spend this today?" as it moves. The purchase
 * is modelled as a one-off, so it does not change the everyday spending pace.
 * The simulation runs on a deferred value, so dragging never blocks on the maths.
 */
export function QuickCheck({ className, onOpenSimulator }: QuickCheckProps) {
  const { state } = useFinance();
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const deferredAmount = useDeferredValue(amount);
  const sliderId = useId();

  const { after, verdict, summary } = useMemo(
    () => simulate(state, { type: 'unexpected', label: ONE_OFF_LABEL, amount: deferredAmount }),
    [state, deferredAmount],
  );

  return (
    <section className={cn('card cq', className)} aria-labelledby="quick-heading">
      <h2 id="quick-heading" className="card__title">
        Impulse check
      </h2>
      <p>Drag to see what a one-off treat today does to the rest of your month.</p>

      <div className="grid gap-1">
        <label htmlFor={sliderId} className="font-semibold">
          If I spend <span className="text-pen-strong tabular-nums">{formatINR(amount)}</span> today
        </label>
        <input
          id={sliderId}
          className="slider"
          type="range"
          min={MIN_AMOUNT}
          max={MAX_AMOUNT}
          step={STEP}
          value={amount}
          aria-valuetext={`${formatINR(amount)}. ${summary}`}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </div>

      <dl className="quick__stats">
        <div className="quick__stat">
          <dt>Daily allowance after</dt>
          <dd data-effect="worse">{formatINR(after.dailyAllowance)}</dd>
        </div>
        <div className="quick__stat">
          <dt>Forecast after</dt>
          <dd data-effect={after.projectedEnd < 0 ? 'worse' : undefined}>{formatINR(after.projectedEnd)}</dd>
        </div>
        <div className="quick__stat">
          <dt>Health after</dt>
          <dd>{after.health.score}/100</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={VERDICT_TONES[verdict]}>{VERDICT_TITLES[verdict]}</Badge>
        <button
          type="button"
          className="button button--ghost"
          onClick={() =>
            onOpenSimulator({ type: 'unexpected', label: ONE_OFF_LABEL, amount: String(amount) })
          }
        >
          Open in simulator
        </button>
      </div>
      <p className="text-sm text-ink-2">{summary}</p>
    </section>
  );
}
