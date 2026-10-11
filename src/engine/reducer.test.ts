import { describe, expect, it } from 'vitest';
import { MAX_GOALS, MAX_SCHEDULED, MAX_TRANSACTIONS } from '@/constants';
import { financeReducer } from '@/engine/reducer';
import { createDemoState, createEmptyState } from '@/engine/seed';
import type { FinanceState, Transaction } from '@/types/finance';

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    kind: 'expense',
    label: 'Lunch',
    amount: 150,
    category: 'food',
    day: 1,
    unexpected: false,
    goalId: null,
    ...overrides,
  };
}

const withGoal: FinanceState = {
  ...createEmptyState(),
  goals: [{ id: 'g1', label: 'Trip', target: 1000 }],
};

describe('financeReducer', () => {
  it('adds and removes transactions without mutating the previous state', () => {
    const start = createEmptyState();
    const added = financeReducer(start, { type: 'transaction/added', transaction: transaction() });
    expect(added.transactions).toHaveLength(1);
    expect(start.transactions).toHaveLength(0);

    const removed = financeReducer(added, { type: 'transaction/removed', id: 't1' });
    expect(removed.transactions).toHaveLength(0);
  });

  it('ignores non-positive amounts', () => {
    const start = createEmptyState();
    expect(
      financeReducer(start, { type: 'transaction/added', transaction: transaction({ amount: 0 }) }),
    ).toBe(start);
    expect(
      financeReducer(start, { type: 'transaction/added', transaction: transaction({ amount: -5 }) }),
    ).toBe(start);
  });

  it('caps the number of stored transactions', () => {
    const full: FinanceState = {
      ...createEmptyState(),
      transactions: Array.from({ length: MAX_TRANSACTIONS }, (_, i) => transaction({ id: `t${i}` })),
    };
    expect(
      financeReducer(full, { type: 'transaction/added', transaction: transaction({ id: 'extra' }) }),
    ).toBe(full);
  });

  it('clamps savings to what the goal still needs', () => {
    const saving = transaction({ id: 's1', kind: 'saving', amount: 1500, goalId: 'g1' });
    const once = financeReducer(withGoal, { type: 'transaction/added', transaction: saving });
    expect(once.transactions[0]?.amount).toBe(1000);

    const twice = financeReducer(once, { type: 'transaction/added', transaction: { ...saving, id: 's2' } });
    expect(twice).toBe(once);
  });

  it('rejects savings for a goal that does not exist', () => {
    const saving = transaction({ kind: 'saving', goalId: 'missing' });
    expect(financeReducer(withGoal, { type: 'transaction/added', transaction: saving })).toBe(withGoal);
  });

  it('returns saved money when a goal is removed', () => {
    const saved = financeReducer(withGoal, {
      type: 'transaction/added',
      transaction: transaction({ id: 's1', kind: 'saving', amount: 400, goalId: 'g1' }),
    });
    const removed = financeReducer(saved, { type: 'goal/removed', id: 'g1' });
    expect(removed.goals).toHaveLength(0);
    expect(removed.transactions).toHaveLength(0);
  });

  it('adds goals up to the limit and rejects empty targets', () => {
    const start = createEmptyState();
    const goal = { id: 'g1', label: 'Trip', target: 500 };
    expect(financeReducer(start, { type: 'goal/added', goal }).goals).toEqual([goal]);
    expect(financeReducer(start, { type: 'goal/added', goal: { ...goal, target: 0 } })).toBe(start);

    const full = { ...start, goals: Array.from({ length: MAX_GOALS }, (_, i) => ({ ...goal, id: `g${i}` })) };
    expect(financeReducer(full, { type: 'goal/added', goal })).toBe(full);
  });

  it('adds, cancels, resumes and removes scheduled payments', () => {
    const start = { ...createEmptyState(), currentDay: 4 };
    const payment = {
      id: 'p1',
      kind: 'subscription' as const,
      label: 'Music',
      amount: 119,
      dueDay: 12,
      cancelledDay: null,
    };

    const added = financeReducer(start, { type: 'scheduled/added', payment });
    expect(added.scheduled).toEqual([payment]);

    const cancelled = financeReducer(added, { type: 'scheduled/cancelled', id: 'p1' });
    expect(cancelled.scheduled[0]?.cancelledDay).toBe(4);

    // Cancelling again must not move the cancellation date.
    const later = financeReducer({ ...cancelled, currentDay: 9 }, { type: 'scheduled/cancelled', id: 'p1' });
    expect(later.scheduled[0]?.cancelledDay).toBe(4);

    const resumed = financeReducer(cancelled, { type: 'scheduled/resumed', id: 'p1' });
    expect(resumed.scheduled[0]?.cancelledDay).toBeNull();

    expect(financeReducer(resumed, { type: 'scheduled/removed', id: 'p1' }).scheduled).toHaveLength(0);
  });

  it('caps scheduled payments and rejects empty amounts', () => {
    const payment = {
      id: 'p',
      kind: 'commitment' as const,
      label: 'Rent',
      amount: 100,
      dueDay: 3,
      cancelledDay: null,
    };
    const start = createEmptyState();
    expect(financeReducer(start, { type: 'scheduled/added', payment: { ...payment, amount: 0 } })).toBe(
      start,
    );

    const full = {
      ...start,
      scheduled: Array.from({ length: MAX_SCHEDULED }, (_, i) => ({ ...payment, id: `p${i}` })),
    };
    expect(financeReducer(full, { type: 'scheduled/added', payment })).toBe(full);
  });

  it('keeps the day within the month and after recorded activity', () => {
    const demo = createDemoState();
    expect(financeReducer(demo, { type: 'day/set', day: 12 }).currentDay).toBe(12);
    expect(financeReducer(demo, { type: 'day/set', day: 99 }).currentDay).toBe(30);
    expect(financeReducer(demo, { type: 'day/set', day: 1 })).toBe(demo);
    expect(financeReducer(createEmptyState(), { type: 'day/set', day: -4 }).currentDay).toBe(1);
  });

  it('replaces the whole state', () => {
    const next = createEmptyState();
    expect(financeReducer(createDemoState(), { type: 'state/replaced', state: next })).toBe(next);
  });
});
