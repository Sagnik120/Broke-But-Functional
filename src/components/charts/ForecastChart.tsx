import { memo, useId } from 'react';
import { MONTH_DAYS } from '@/constants';
import { formatINR } from '@/utils/format';
import type { ForecastPoint } from '@/types/finance';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };

interface ForecastChartProps {
  points: ForecastPoint[];
  today: number;
  shortfallDay: number | null;
}

function toPath(coordinates: Array<[number, number]>): string {
  return coordinates.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/** Balance so far (solid) and the forecast for the rest of the month (dashed). */
export const ForecastChart = memo(function ForecastChart({
  points,
  today,
  shortfallDay,
}: ForecastChartProps) {
  const titleId = useId();
  const descId = useId();

  const balances = points.map((point) => point.balance);
  const top = Math.max(1, ...balances);
  const bottom = Math.min(0, ...balances);
  const x = (day: number) => PAD.left + ((day - 1) / (MONTH_DAYS - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + ((top - value) / (top - bottom)) * (HEIGHT - PAD.top - PAD.bottom);

  const coordinates = points.map((point): [number, number] => [x(point.day), y(point.balance)]);
  const actual = coordinates.slice(0, today);
  // The projected line starts at today's point so the two segments join up.
  const projected = coordinates.slice(Math.max(0, today - 1));
  const todayPoint = points[today - 1];
  const end = points[points.length - 1];
  const nearEnd = today > 22;

  const description = [
    todayPoint ? `Balance today, day ${today}, is ${formatINR(todayPoint.balance)}.` : '',
    end ? `Forecast for day ${MONTH_DAYS} is ${formatINR(end.balance)}.` : '',
    shortfallDay === null
      ? 'Your money is forecast to last the month.'
      : `Money runs out on day ${shortfallDay}.`,
  ].join(' ');

  return (
    <figure className="chart">
      <div className="chart__plot dotted">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <title id={titleId}>Balance forecast for the 30-day month</title>
          <desc id={descId}>{description}</desc>
          <line className="chart__zero" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(0)} y2={y(0)} />
          <polyline className="chart__line chart__line--actual" pathLength={1} points={toPath(actual)} />
          <polyline className="chart__line chart__line--projected" points={toPath(projected)} />
          {todayPoint && (
            <g aria-hidden="true">
              <line
                className="chart__today"
                x1={x(today)}
                x2={x(today)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
              />
              <circle className="chart__dot" cx={x(today)} cy={y(todayPoint.balance)} r="6" />
              <text
                className="chart__note"
                x={x(today) + (nearEnd ? -10 : 10)}
                y={HEIGHT - PAD.bottom - 8}
                textAnchor={nearEnd ? 'end' : 'start'}
              >
                you are here
              </text>
            </g>
          )}
          <g className="chart__axis" aria-hidden="true">
            <text x={PAD.left} y={HEIGHT - 8}>
              Day 1
            </text>
            <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">
              Day {MONTH_DAYS}
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="chart__caption">
        <span className="chart__key">Actual</span>
        <span className="chart__key chart__key--projected">Forecast</span>
        <span>{description}</span>
      </figcaption>
    </figure>
  );
});
