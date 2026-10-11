import { useMemo } from 'react';
import { buildMonthMap, describeDay } from '@/engine/monthMap';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/utils/cn';

/**
 * The month as a calendar heatmap: past days shaded by spending, future days
 * dashed, bills dotted and any shortfall flagged. Each cell also carries a
 * sentence for screen readers.
 */
export function MonthMap({ className }: { className?: string }) {
  const { state, snapshot } = useFinance();
  const cells = useMemo(() => buildMonthMap(state, snapshot), [state, snapshot]);

  return (
    <section className={cn('card cq', className)} aria-labelledby="month-map-heading">
      <h2 id="month-map-heading" className="card__title">
        Month map
      </h2>
      <p>Darker days cost more. A dot marks a bill.</p>
      <ol className="month-map">
        {cells.map((cell) => (
          <li
            key={cell.day}
            className="month-cell"
            data-status={cell.status}
            data-level={cell.level}
            data-due={cell.due > 0}
            data-shortfall={cell.shortfall}
          >
            <span aria-hidden="true">{cell.day}</span>
            <span className="sr-only">{describeDay(cell)}</span>
          </li>
        ))}
      </ol>
      <p className="month-legend" aria-hidden="true">
        <span>
          <span className="month-legend__swatch bg-pen/15" />
          Light spend
        </span>
        <span>
          <span className="month-legend__swatch bg-pen" />
          Heavy spend
        </span>
        <span>
          <span className="month-legend__swatch rounded-full border-0 bg-margin" />
          Bill due
        </span>
        <span>
          <span className="month-legend__swatch border-bad bg-bad-bg" />
          Shortfall
        </span>
      </p>
    </section>
  );
}
