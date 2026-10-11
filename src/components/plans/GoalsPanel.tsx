import { useState, type FormEvent } from 'react';
import { formatINR } from '../../domain/format';
import { createId } from '../../domain/id';
import { parseAmount, parseLabel } from '../../domain/sanitize';
import type { GoalStatus } from '../../domain/types';
import { useFinance } from '../../state/useFinance';
import { AmountField, Field } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';

function GoalCard({ goal }: { goal: GoalStatus }) {
  const { state, snapshot, dispatch, announce } = useFinance();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const available = Math.max(0, snapshot.balance);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed.ok) return setError(parsed.error);
    if (parsed.value > available) return setError(`You only have ${formatINR(available)} to move.`);
    const contribution = Math.min(parsed.value, goal.remaining);
    dispatch({
      type: 'transaction/added',
      transaction: {
        id: createId(),
        kind: 'saving',
        label: `Saved for ${goal.label}`,
        amount: contribution,
        category: 'other',
        day: state.currentDay,
        unexpected: false,
        goalId: goal.id,
      },
    });
    announce(`Moved ${formatINR(contribution)} to ${goal.label}.`);
    setAmount('');
    setError(undefined);
  }

  function remove() {
    dispatch({ type: 'goal/removed', id: goal.id });
    announce(`Removed ${goal.label}. ${formatINR(goal.saved)} returned to your balance.`);
  }

  return (
    <li className="plan">
      <div className="plan__head">
        <h3 className="list__label">{goal.label}</h3>
        <button type="button" className="button button--small" onClick={remove} aria-label={`Remove goal ${goal.label}`}>
          Remove
        </button>
      </div>
      <p className="list__meta">
        {formatINR(goal.saved)} of {formatINR(goal.target)} ·{' '}
        {goal.remaining === 0 ? 'Fully funded' : `${formatINR(goal.remaining)} to go`}
      </p>
      <ProgressBar label={`${goal.label} progress`} value={goal.progress} />
      {goal.remaining > 0 && (
        <form className="form form--inline" onSubmit={handleSubmit} noValidate>
          <AmountField
            label={`Add to ${goal.label}`}
            value={amount}
            error={error}
            onChange={(event) => setAmount(event.target.value)}
          />
          <button type="submit" className="button button--primary">
            Save
          </button>
        </form>
      )}
    </li>
  );
}

export function GoalsPanel() {
  const { snapshot, dispatch, announce } = useFinance();
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [errors, setErrors] = useState<{ label?: string; target?: string }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLabel = parseLabel(label, 'Goal name');
    const parsedTarget = parseAmount(target);
    if (!parsedLabel.ok || !parsedTarget.ok) {
      setErrors({
        label: parsedLabel.ok ? undefined : parsedLabel.error,
        target: parsedTarget.ok ? undefined : parsedTarget.error,
      });
      return;
    }
    dispatch({
      type: 'goal/added',
      goal: { id: createId(), label: parsedLabel.value, target: parsedTarget.value },
    });
    announce(`Goal added: ${parsedLabel.value}, ${formatINR(parsedTarget.value)}.`);
    setLabel('');
    setTarget('');
    setErrors({});
  }

  return (
    <section className="card" aria-labelledby="goals-panel-heading">
      <h2 id="goals-panel-heading" className="card__title">
        Savings goals
      </h2>
      <p>Money you move to a goal leaves your spendable balance, so your allowance adjusts instantly.</p>
      {snapshot.goals.length > 0 && (
        <ul className="list">
          {snapshot.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </ul>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h3 className="subheading">New goal</h3>
        <Field
          label="Goal name"
          value={label}
          error={errors.label}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setLabel(event.target.value)}
        />
        <AmountField
          label="Target in rupees"
          value={target}
          error={errors.target}
          onChange={(event) => setTarget(event.target.value)}
        />
        <div className="form__actions">
          <button type="submit" className="button button--primary">
            Add goal
          </button>
        </div>
      </form>
    </section>
  );
}
