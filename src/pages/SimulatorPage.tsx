import { Dices } from 'lucide-react';
import { useDeferredValue, useMemo, useState, type FormEvent } from 'react';
import { CATEGORY_LABELS, VERDICT_STAMPS, VERDICT_TITLES } from '@/constants';
import { SCENARIO_PRESETS } from '@/constants/presets';
import { drawCurveball } from '@/engine/curveballs';
import { formatINR } from '@/utils/format';
import { createId } from '@/utils/id';
import { DECISION_LABELS, decisionToAction, simulate, type Decision } from '@/engine/simulate';
import { CATEGORIES, type Category } from '@/types/finance';
import { useFinance } from '@/hooks/useFinance';
import { AmountField, Field, SelectField } from '@/components/ui/Field';
import { EMPTY_DRAFT, parseDraft, type DecisionDraft } from '@/components/simulator/draft';
import { ImpactTable } from '@/components/simulator/ImpactTable';

const DECISION_TYPES = Object.keys(DECISION_LABELS) as Array<Decision['type']>;

interface SimulatorProps {
  /** Injectable randomness for deterministic curveballs in tests. */
  random?: () => number;
  /** Values to start the form with, for example from the dashboard's impulse check. */
  initialDraft?: Partial<DecisionDraft> | null;
}

export default function SimulatorPage({ random, initialDraft }: SimulatorProps) {
  const { state, snapshot, dispatch, announce } = useFinance();
  const [draft, setDraft] = useState<DecisionDraft>(() => ({ ...EMPTY_DRAFT, ...initialDraft }));
  const [showErrors, setShowErrors] = useState(false);
  const [committed, setCommitted] = useState('');

  const activeSubscriptions = state.scheduled.filter(
    (payment) => payment.kind === 'subscription' && payment.cancelledDay === null,
  );

  const result = useMemo(() => parseDraft(draft, state, snapshot), [draft, state, snapshot]);
  // The preview is deferred so typing stays responsive while the month is recalculated.
  const previewDecision = useDeferredValue(result.decision);
  const simulation = useMemo(
    () => (previewDecision ? simulate(state, previewDecision) : null),
    [previewDecision, state],
  );
  const errors = showErrors && result.errors ? result.errors : {};

  function update(patch: Partial<DecisionDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setCommitted('');
  }

  function throwCurveball() {
    const curveball = drawCurveball(random);
    update({ type: 'unexpected', label: curveball.label, amount: String(curveball.amount) });
    setShowErrors(false);
    announce(`Curveball: ${curveball.label}, ${formatINR(curveball.amount)}. Review the impact below.`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result.decision) {
      setShowErrors(true);
      return;
    }
    dispatch(decisionToAction(result.decision, state, createId()));
    const message = `Decision applied: ${DECISION_LABELS[result.decision.type].toLowerCase()}.`;
    setCommitted(message);
    announce(message);
    setDraft({ ...EMPTY_DRAFT, type: draft.type, category: draft.category });
    setShowErrors(false);
  }

  const needsDetails = draft.type !== 'cancel' && draft.type !== 'save';

  return (
    <div className="grid-2 grid-2--top">
      <section className="card" aria-labelledby="simulator-heading">
        <h2 id="simulator-heading" className="card__title">
          What if I…
        </h2>
        <p>Try a decision here first. Nothing changes until you apply it.</p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick scenarios">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="chip"
              onClick={() => {
                update(preset.draft);
                setShowErrors(false);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <SelectField
            label="Decision"
            value={draft.type}
            onChange={(event) => {
              update({ type: event.target.value as Decision['type'] });
              setShowErrors(false);
            }}
          >
            {DECISION_TYPES.map((type) => (
              <option key={type} value={type}>
                {DECISION_LABELS[type]}
              </option>
            ))}
          </SelectField>

          {draft.type === 'cancel' && (
            <SelectField
              label="Subscription"
              value={draft.scheduledId}
              error={errors.scheduledId}
              hint={activeSubscriptions.length === 0 ? 'You have no active subscriptions.' : undefined}
              onChange={(event) => update({ scheduledId: event.target.value })}
            >
              <option value="">Choose a subscription</option>
              {activeSubscriptions.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {payment.label} — {formatINR(payment.amount)} on day {payment.dueDay}
                </option>
              ))}
            </SelectField>
          )}

          {draft.type === 'save' && (
            <SelectField
              label="Goal"
              value={draft.goalId}
              error={errors.goalId}
              hint={snapshot.goals.length === 0 ? 'Create a goal in Plans first.' : undefined}
              onChange={(event) => update({ goalId: event.target.value })}
            >
              <option value="">Choose a goal</option>
              {snapshot.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.label} — {formatINR(goal.remaining)} to go
                </option>
              ))}
            </SelectField>
          )}

          {needsDetails && (
            <Field
              label="Description"
              value={draft.label}
              error={errors.label}
              maxLength={40}
              autoComplete="off"
              onChange={(event) => update({ label: event.target.value })}
            />
          )}

          {draft.type !== 'cancel' && (
            <AmountField
              label="Amount in rupees"
              value={draft.amount}
              error={errors.amount}
              onChange={(event) => update({ amount: event.target.value })}
            />
          )}

          {draft.type === 'spend' && (
            <SelectField
              label="Category"
              value={draft.category}
              onChange={(event) => update({ category: event.target.value as Category })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </SelectField>
          )}

          {draft.type === 'subscribe' && (
            <Field
              label="Billing day"
              value={draft.dueDay}
              error={errors.dueDay}
              hint="Day of the month, 1 to 30."
              inputMode="numeric"
              maxLength={2}
              autoComplete="off"
              onChange={(event) => update({ dueDay: event.target.value })}
            />
          )}

          <div className="form__actions">
            <button type="submit" className="button button--primary">
              Apply this decision
            </button>
            <button type="button" className="button button--ghost" onClick={throwCurveball}>
              <Dices size={18} aria-hidden="true" />
              Throw me a curveball
            </button>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="card__title">
          The consequences
        </h2>
        {committed && <p className="notice">{committed} Your dashboard is updated.</p>}
        {simulation ? (
          <>
            <div className="verdict" role="status" data-verdict={simulation.verdict}>
              <span key={simulation.verdict} className="verdict__stamp" aria-hidden="true">
                {VERDICT_STAMPS[simulation.verdict]}
              </span>
              <p className="verdict__title">{VERDICT_TITLES[simulation.verdict]}</p>
              <p>{simulation.summary}</p>
            </div>
            <ImpactTable rows={simulation.impact} />
            {simulation.after.risk.reasons.length > 0 && (
              <>
                <h3 className="subheading">Watch out for</h3>
                <ul className="reasons">
                  {simulation.after.risk.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          !committed && <p>Fill in the decision to preview its impact on your whole month.</p>
        )}
      </section>
    </div>
  );
}
