import { useState, type FormEvent } from 'react';
import { formatINR } from '../../domain/format';
import { createId } from '../../domain/id';
import { scheduledStatus, type ScheduledStatus } from '../../domain/ledger';
import { parseAmount, parseDay, parseLabel } from '../../domain/sanitize';
import type { ScheduledKind, ScheduledPayment } from '../../domain/types';
import { useFinance } from '../../state/useFinance';
import { AmountField, Field, SelectField } from '../ui/Field';

const STATUS_LABELS: Record<ScheduledStatus, string> = {
  paid: 'Paid',
  upcoming: 'Upcoming',
  cancelled: 'Cancelled',
};

function ScheduledRow({ payment }: { payment: ScheduledPayment }) {
  const { state, dispatch, announce } = useFinance();
  const status = scheduledStatus(payment, state.currentDay);
  const isSubscription = payment.kind === 'subscription';

  function act(type: 'scheduled/cancelled' | 'scheduled/resumed' | 'scheduled/removed', message: string) {
    dispatch({ type, id: payment.id });
    announce(message);
  }

  return (
    <li className="list__item">
      <span>
        <span className="list__label">{payment.label}</span>
        <span className="list__meta">
          Day {payment.dueDay} · {isSubscription ? 'Subscription' : 'Commitment'} ·{' '}
          <span className="status" data-status={status}>
            {STATUS_LABELS[status]}
          </span>
        </span>
      </span>
      <span className="list__end">
        <span className="list__amount">{formatINR(payment.amount)}</span>
        {isSubscription && payment.cancelledDay === null && (
          <button
            type="button"
            className="button button--small"
            aria-label={`Cancel ${payment.label}`}
            onClick={() =>
              act(
                'scheduled/cancelled',
                status === 'paid'
                  ? `${payment.label} cancelled. This month's charge was already paid.`
                  : `${payment.label} cancelled. ${formatINR(payment.amount)} freed up.`,
              )
            }
          >
            Cancel
          </button>
        )}
        {isSubscription && payment.cancelledDay !== null && (
          <button
            type="button"
            className="button button--small"
            aria-label={`Resume ${payment.label}`}
            onClick={() => act('scheduled/resumed', `${payment.label} resumed.`)}
          >
            Resume
          </button>
        )}
        {!isSubscription && (
          <button
            type="button"
            className="button button--small"
            aria-label={`Remove ${payment.label}`}
            onClick={() => act('scheduled/removed', `Removed ${payment.label}.`)}
          >
            Remove
          </button>
        )}
      </span>
    </li>
  );
}

export function ScheduledPanel() {
  const { state, dispatch, announce } = useFinance();
  const [kind, setKind] = useState<ScheduledKind>('subscription');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [errors, setErrors] = useState<{ label?: string; amount?: string; dueDay?: string }>({});
  const payments = [...state.scheduled].sort((a, b) => a.dueDay - b.dueDay);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLabel = parseLabel(label);
    const parsedAmount = parseAmount(amount);
    const parsedDay = parseDay(dueDay);
    if (!parsedLabel.ok || !parsedAmount.ok || !parsedDay.ok) {
      setErrors({
        label: parsedLabel.ok ? undefined : parsedLabel.error,
        amount: parsedAmount.ok ? undefined : parsedAmount.error,
        dueDay: parsedDay.ok ? undefined : parsedDay.error,
      });
      return;
    }
    dispatch({
      type: 'scheduled/added',
      payment: {
        id: createId(),
        kind,
        label: parsedLabel.value,
        amount: parsedAmount.value,
        dueDay: parsedDay.value,
        cancelledDay: null,
      },
    });
    announce(`${parsedLabel.value} scheduled for day ${parsedDay.value}.`);
    setLabel('');
    setAmount('');
    setDueDay('');
    setErrors({});
  }

  return (
    <section className="card" aria-labelledby="scheduled-heading">
      <h2 id="scheduled-heading" className="card__title">
        Subscriptions and commitments
      </h2>
      <p>These are set aside before your daily allowance is calculated, and charged when their day arrives.</p>
      {payments.length > 0 && (
        <ul className="list">
          {payments.map((payment) => (
            <ScheduledRow key={payment.id} payment={payment} />
          ))}
        </ul>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h3 className="subheading">New scheduled payment</h3>
        <SelectField label="Kind" value={kind} onChange={(event) => setKind(event.target.value as ScheduledKind)}>
          <option value="subscription">Subscription</option>
          <option value="commitment">Commitment (rent, fees, EMI)</option>
        </SelectField>
        <Field
          label="Name"
          value={label}
          error={errors.label}
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setLabel(event.target.value)}
        />
        <AmountField
          label="Amount in rupees"
          value={amount}
          error={errors.amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Field
          label="Due day"
          value={dueDay}
          error={errors.dueDay}
          hint={`Day 1 to 30. Today is day ${state.currentDay}; earlier days count as already paid.`}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          onChange={(event) => setDueDay(event.target.value)}
        />
        <div className="form__actions">
          <button type="submit" className="button button--primary">
            Add payment
          </button>
        </div>
      </form>
    </section>
  );
}
