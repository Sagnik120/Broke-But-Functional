import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { RISK_LABELS } from '@/constants';
import { useFinance } from '@/hooks/useFinance';
import type { RiskLevel } from '@/types/finance';
import { cn } from '@/utils/cn';

const RISK_TONES: Record<RiskLevel, BadgeTone> = { low: 'good', medium: 'warn', high: 'bad' };

/** The risk score, with the plain-language reasons behind it. */
export function RiskCard({ className }: { className?: string }) {
  const { risk } = useFinance().snapshot;
  return (
    <section className={cn('card', className)} aria-labelledby="risk-heading">
      <h2 id="risk-heading" className="card__title">
        Financial risk
      </h2>
      <Badge tone={RISK_TONES[risk.level]}>
        {RISK_LABELS[risk.level]} · {risk.score}/100
      </Badge>
      {risk.reasons.length > 0 ? (
        <ul className="reasons">
          {risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>Nothing worrying right now. Your bills are covered and your pace is sustainable.</p>
      )}
    </section>
  );
}
