import { useMemo, useState, type FormEvent } from 'react';
import { CATEGORY_LABELS } from '@/constants';
import { formatINR, formatPercent } from '@/utils/format';
import { createId } from '@/utils/id';
import { spendingByCategory } from '@/engine/insights';
import { parseAmount, parseLabel } from '@/utils/sanitize';
import { CATEGORIES, type Category, type Transaction } from '@/types/finance';
import { useFinance } from '@/hooks/useFinance';
import { EmptyState } from '@/components/ui/EmptyState';
import { AmountField, Field, SelectField } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/ProgressBar';

type EntryKind = 'expense' | 'income';

function describe(transaction: Transaction): string {
  if (transaction.kind === 'income') return 'Income';
  if (transaction.kind === 'saving') return 'Savings';
  return transaction.unexpected ? 'Unexpected' : CATEGORY_LABELS[transaction.category];
}

function TransactionForm() {
  const { state, dispatch, announce } = useFinance();
  const [kind, setKind] = useState<EntryKind>('expense');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [unexpected, setUnexpected] = useState(false);
  const [errors, setErrors] = useState<{ label?: string; amount?: string }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLabel = parseLabel(label, 'Description');
    const parsedAmount = parseAmount(amount);
    if (!parsedLabel.ok || !parsedAmount.ok) {
      setErrors({
        label: parsedLabel.ok ? undefined : parsedLabel.error,
        amount: parsedAmount.ok ? undefined : parsedAmount.error,
      });
      return;
    }
    dispatch({
      type: 'transaction/added',
      transaction: {
        id: createId(),
        kind,
        label: parsedLabel.value,
        amount: parsedAmount.value,
        category: kind === 'expense' ? category : 'other',
        day: state.currentDay,
        unexpected: kind === 'expense' && unexpected,
        goalId: null,
      },
    });
    announce(
      `${kind === 'expense' ? 'Expense' : 'Income'} added: ${parsedLabel.value}, ${formatINR(parsedAmount.value)}.`,
    );
    setLabel('');
    setAmount('');
    setUnexpected(false);
    setErrors({});
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <SelectField label="Type" value={kind} onChange={(event) => setKind(event.target.value as EntryKind)}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </SelectField>
      <Field
        label="Description"
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
      {kind === 'expense' && (
        <>
          <SelectField
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value as Category)}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </SelectField>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={unexpected}
              onChange={(event) => setUnexpected(event.target.checked)}
            />
            This was unexpected
          </label>
        </>
      )}
      <div className="form__actions">
        <button type="submit" className="button button--primary">
          Add to day {state.currentDay}
        </button>
      </div>
    </form>
  );
}

export default function Activity() {
  const { state, dispatch, announce } = useFinance();
  const transactions = useMemo(
    () => [...state.transactions].reverse().sort((a, b) => b.day - a.day),
    [state.transactions],
  );

  const breakdown = useMemo(() => spendingByCategory(state), [state]);

  function remove(transaction: Transaction) {
    dispatch({ type: 'transaction/removed', id: transaction.id });
    announce(`Removed ${transaction.label}.`);
  }

  return (
    <div className="grid-2 grid-2--top">
      <div className="stack">
        <section className="card" aria-labelledby="add-heading">
          <h2 id="add-heading" className="card__title">
            Log money in or out
          </h2>
          <TransactionForm />
        </section>

        <section className="card" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="card__title">
            Where it went
          </h2>
          {breakdown.length > 0 ? (
            <ul className="list">
              {breakdown.map((entry) => (
                <li key={entry.category} className="goal">
                  <span className="list__label">{entry.label}</span>
                  <span className="list__meta">
                    {formatINR(entry.amount)} · {formatPercent(entry.share)} of spending
                  </span>
                  <ProgressBar label={`${entry.label} share of spending`} value={entry.share} />
                </li>
              ))}
            </ul>
          ) : (
            <p>Your spending by category will show up here.</p>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="history-heading">
        <h2 id="history-heading" className="card__title">
          This month's activity
        </h2>
        {transactions.length > 0 ? (
          <ul className="list">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="list__item">
                <span>
                  <span className="list__label">{transaction.label}</span>
                  <span className="list__meta">
                    Day {transaction.day} · {describe(transaction)}
                  </span>
                </span>
                <span className="list__end">
                  <span className="list__amount" data-kind={transaction.kind}>
                    {transaction.kind === 'income' ? '+' : '−'}
                    {formatINR(transaction.amount)}
                  </span>
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => remove(transaction)}
                    aria-label={`Remove ${transaction.label}`}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>
            <p>Nothing logged yet. Add your first expense to see your month react.</p>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
