import { memo, useId } from 'react';
import { MONTH_DAYS } from '../../domain/constants';
import { formatINR } from '../../domain/format';
import type { ForecastPoint } from '../../domain/types';

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
export const ForecastChart = memo(function ForecastChart({ points, today, shortfallDay }: ForecastChartProps) {
  const titleId = useId();
  const descId = useId();

  const balances = points.map((point) => point.balance);
  const top = Math.max(1, ...balances);
  const bottom = Math.min(0, ...balances);
  const x = (day: number) => PAD.left + ((day - 1) / (MONTH_DAYS - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + ((top - value) / (top - bottom)) * (HEIGHT - PAD.top - PAD.bottom);

  const coordinates = points.map((point): [number, number] => [x(point.day), y(point.balance)]);
  const actual = coordinates.slice(0, today);
  // The projected line starts at today's point so the two segments join up.
  const projected = coordinates.slice(Math.max(0, today - 1));
  const todayPoint = points[today - 1];
  const end = points[points.length - 1];

  const description = [
    todayPoint ? `Balance today, day ${today}, is ${formatINR(todayPoint.balance)}.` : '',
    end ? `Forecast for day ${MONTH_DAYS} is ${formatINR(end.balance)}.` : '',
    shortfallDay === null ? 'Your money is forecast to last the month.' : `Money runs out on day ${shortfallDay}.`,
  ].join(' ');

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>Balance forecast for the 30-day month</title>
        <desc id={descId}>{description}</desc>
        <line className="chart__zero" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(0)} y2={y(0)} />
        <polyline className="chart__line" points={toPath(actual)} />
        <polyline className="chart__line chart__line--projected" points={toPath(projected)} />
        {todayPoint && (
          <>
            <line className="chart__today" x1={x(today)} x2={x(today)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            <circle className="chart__dot" cx={x(today)} cy={y(todayPoint.balance)} r="5" />
          </>
        )}
        <g className="chart__axis" aria-hidden="true">
          <text x={PAD.left} y={HEIGHT - 8}>Day 1</text>
          <text x={x(today)} y={HEIGHT - 8} textAnchor={today > 26 ? 'end' : today < 4 ? 'start' : 'middle'}>
            {today > 3 && today < 27 ? 'Today' : ''}
          </text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">
            Day {MONTH_DAYS}
          </text>
        </g>
      </svg>
      <figcaption className="chart__caption">
        <span className="chart__key">Actual</span>
        <span className="chart__key chart__key--projected">Forecast</span>
        <span>{description}</span>
      </figcaption>
    </figure>
  );
});
