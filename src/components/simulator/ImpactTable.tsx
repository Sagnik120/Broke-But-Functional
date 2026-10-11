import { formatINR, formatPercent, formatSignedINR, formatSignedNumber } from '../../domain/format';
import type { ImpactFormat, ImpactRow } from '../../domain/simulate';

function formatValue(value: number, format: ImpactFormat): string {
  if (format === 'money') return formatINR(value);
  if (format === 'percent') return formatPercent(value);
  return `${Math.round(value)}/100`;
}

function formatDelta(delta: number, format: ImpactFormat): string {
  if (format === 'money') return formatSignedINR(delta);
  if (format === 'percent') return formatSignedNumber(delta * 100, ' pts');
  return formatSignedNumber(delta, ' pts');
}

const EFFECT_TEXT: Record<ImpactRow['effect'], string> = {
  better: 'Better',
  worse: 'Worse',
  same: '',
};

/** Before/after comparison for every connected metric a decision touches. */
export function ImpactTable({ rows }: { rows: ImpactRow[] }) {
  return (
    <div className="table-wrap">
      <table className="impact">
        <caption className="sr-only">How this decision changes your month</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Now</th>
            <th scope="col">After</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{formatValue(row.before, row.format)}</td>
              <td>{formatValue(row.after, row.format)}</td>
              <td className="impact__delta" data-effect={row.effect}>
                {formatDelta(row.delta, row.format)}
                {row.effect !== 'same' && <span className="impact__effect"> · {EFFECT_TEXT[row.effect]}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
