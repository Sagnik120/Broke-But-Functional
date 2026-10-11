import { useMemo } from 'react';
import { HEALTH_LABELS, RISK_LABELS } from '../../domain/constants';
import { formatINR, formatPercent } from '../../domain/format';
import { buildSuggestions } from '../../domain/insights';
import { isUpcoming } from '../../domain/ledger';
import { createDemoState, createEmptyState } from '../../domain/seed';
import type { RiskLevel } from '../../domain/types';
import { useFinance } from '../../state/useFinance';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Badge, type BadgeTone } from '../ui/Badge';
import { ConfirmButton } from '../ui/ConfirmButton';
import { ProgressBar } from '../ui/ProgressBar';
import { DayControl } from './DayControl';
import { ForecastChart } from './ForecastChart';
import { HealthGauge } from './HealthGauge';

const RISK_TONES: Record<RiskLevel, BadgeTone> = { low: 'good', medium: 'warn', high: 'bad' };

interface StatProps {
  label: string;
  value: number;
  note: string;
  tone?: 'good' | 'warn' | 'bad';
}

function Stat({ label, value, note, tone }: StatProps) {
  return (
    <div className="stat" data-tone={tone}>
      <dt>{label}</dt>
      <dd className="stat__value">
        <AnimatedNumber value={value} />
      </dd>
      <dd className="stat__note">{note}</dd>
    </div>
  );
}

interface DashboardProps {
  onSimulate: () => void;
}

export default function Dashboard({ onSimulate }: DashboardProps) {
  const { state, snapshot, dispatch, announce } = useFinance();
  const upcoming = state.scheduled
    .filter((payment) => isUpcoming(payment, state.currentDay))
    .sort((a, b) => a.dueDay - b.dueDay);

  const suggestions = useMemo(() => buildSuggestions(state, snapshot), [state, snapshot]);
  const onPace = snapshot.burnRate <= snapshot.dailyAllowance;

  function replaceState(next: ReturnType<typeof createEmptyState>, message: string) {
    dispatch({ type: 'state/replaced', state: next });
    announce(message);
  }

  return (
    <>
      <section className="hero card ruled" aria-labelledby="hero-heading">
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
            {formatINR(snapshot.balance)} balance − {formatINR(snapshot.upcoming)} already promised, spread
            over {snapshot.daysLeft} {snapshot.daysLeft === 1 ? 'day' : 'days'}.
          </p>
        </div>
        <div className="hero__actions">
          <DayControl />
          <button type="button" className="button button--primary" onClick={onSimulate}>
            Test a decision first
          </button>
        </div>
      </section>

      <section aria-labelledby="numbers-heading">
        <h2 id="numbers-heading" className="section-title">
          Your month in numbers
        </h2>
        <dl className="stats">
          <Stat
            label="Remaining balance"
            value={snapshot.balance}
            note={`of ${formatINR(snapshot.income)} income`}
            tone={snapshot.balance < 0 ? 'bad' : undefined}
          />
          <Stat
            label="Spent so far"
            value={snapshot.spent + snapshot.scheduledPaid}
            note={`about ${formatINR(snapshot.burnRate)} a day on everyday stuff`}
          />
          <Stat
            label="Upcoming commitments"
            value={snapshot.upcoming}
            note={`${upcoming.length} ${upcoming.length === 1 ? 'payment' : 'payments'} still to come`}
            tone={snapshot.upcoming > snapshot.balance ? 'bad' : undefined}
          />
          <Stat
            label="Saved for goals"
            value={snapshot.saved}
            note={
              snapshot.goalsTarget > 0
                ? `${formatPercent(snapshot.goalProgress)} of ${formatINR(snapshot.goalsTarget)}`
                : 'No goals yet'
            }
            tone={snapshot.saved > 0 ? 'good' : undefined}
          />
          <Stat
            label="Month-end forecast"
            value={snapshot.projectedEnd}
            note={
              snapshot.shortfallDay === null
                ? 'left on day 30 at this pace'
                : `money runs out on day ${snapshot.shortfallDay}`
            }
            tone={snapshot.projectedEnd < 0 ? 'bad' : 'good'}
          />
        </dl>
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="health-heading">
          <h2 id="health-heading" className="card__title">
            Financial health
          </h2>
          <div className="health">
            <HealthGauge score={snapshot.health.score} grade={snapshot.health.grade} />
            <p>
              You're <strong>{HEALTH_LABELS[snapshot.health.grade].toLowerCase()}</strong>. The score blends
              your spending pace, month-end cushion, bill coverage and savings progress.
            </p>
          </div>
        </section>

        <section className="card" aria-labelledby="risk-heading">
          <h2 id="risk-heading" className="card__title">
            Financial risk
          </h2>
          <Badge tone={RISK_TONES[snapshot.risk.level]}>
            {RISK_LABELS[snapshot.risk.level]} · {snapshot.risk.score}/100
          </Badge>
          {snapshot.risk.reasons.length > 0 ? (
            <ul className="reasons">
              {snapshot.risk.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing worrying right now. Your bills are covered and your pace is sustainable.</p>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="moves-heading">
        <h2 id="moves-heading" className="card__title">
          Smart moves
        </h2>
        {suggestions.length > 0 ? (
          <ul className="moves">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="moves__item" data-tone={suggestion.tone}>
                {suggestion.text}
              </li>
            ))}
          </ul>
        ) : (
          <p>You're on track. Nothing needs fixing today.</p>
        )}
        <p>
          <button type="button" className="button button--ghost" onClick={onSimulate}>
            Try one in the simulator
          </button>
        </p>
      </section>

      <section className="card" aria-labelledby="forecast-heading">
        <h2 id="forecast-heading" className="card__title">
          Monthly forecast
        </h2>
        <ForecastChart points={snapshot.forecast} today={snapshot.day} shortfallDay={snapshot.shortfallDay} />
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="card__title">
            Coming up
          </h2>
          {upcoming.length > 0 ? (
            <ul className="list">
              {upcoming.map((payment) => (
                <li key={payment.id} className="list__item">
                  <span>
                    <span className="list__label">{payment.label}</span>
                    <span className="list__meta">
                      Day {payment.dueDay} · {payment.kind === 'subscription' ? 'Subscription' : 'Commitment'}
                    </span>
                  </span>
                  <span className="list__amount">{formatINR(payment.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No more scheduled payments this month.</p>
          )}
        </section>

        <section className="card" aria-labelledby="goals-heading">
          <h2 id="goals-heading" className="card__title">
            Savings goals
          </h2>
          {snapshot.goals.length > 0 ? (
            <ul className="list">
              {snapshot.goals.map((goal) => (
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
      </div>

      <section className="card month-tools" aria-labelledby="month-heading">
        <h2 id="month-heading" className="card__title">
          Start over
        </h2>
        <p>Your data stays on this device. Reset any time.</p>
        <div className="month-tools__actions">
          <ConfirmButton
            label="Start a fresh month"
            confirmLabel="Yes, wipe and start at ₹10,000"
            onConfirm={() => replaceState(createEmptyState(), 'Started a fresh month with ₹10,000.')}
          />
          <ConfirmButton
            label="Load the demo month"
            confirmLabel="Yes, replace with demo data"
            onConfirm={() => replaceState(createDemoState(), 'Loaded the demo month.')}
          />
        </div>
      </section>
    </>
  );
}
