import { describe, expect, it } from 'vitest';
import { buildSuggestions, spendingByCategory } from './insights';
import { computeSnapshot } from './ledger';
import { financeReducer } from './reducer';
import { createDemoState, createEmptyState } from './seed';
import type { FinanceState, Transaction } from './types';

function expense(id: string, amount: number, category: Transaction['category']): Transaction {
  return { id, kind: 'expense', label: id, amount, category, day: 1, unexpected: false, goalId: null };
}

const suggest = (state: FinanceState) => buildSuggestions(state, computeSnapshot(state));

describe('spendingByCategory', () => {
  it('totals expenses per category, largest first, ignoring income and savings', () => {
    const breakdown = spendingByCategory(createDemoState());
    expect(breakdown.map((entry) => [entry.category, entry.amount])).toEqual([
      ['food', 540],
      ['fun', 300],
      ['transport', 200],
      ['shopping', 160],
    ]);
    expect(breakdown[0]).toMatchObject({ label: 'Food', share: 0.45 });
    expect(breakdown.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1);
  });

  it('returns nothing when there are no expenses', () => {
    expect(spendingByCategory(createEmptyState())).toEqual([]);
  });
});

describe('buildSuggestions', () => {
  it('has nothing to suggest on an untouched month', () => {
    expect(suggest(createEmptyState())).toEqual([]);
  });

  it('quotes simulator-backed numbers for the demo month', () => {
    const suggestions = suggest(createDemoState());
    expect(suggestions.map((s) => s.id)).toEqual(['cancel', 'save', 'category']);
    expect(suggestions[0]?.text).toBe(
      'Cancelling Video streaming before day 20 frees ₹199 and lifts your daily allowance by ₹8.',
    );
    expect(suggestions[1]?.text).toContain('move ₹850 to Emergency cushion');
    expect(suggestions[2]?.text).toContain('Food is 45% of your spending (₹540)');
  });

  it('following the savings suggestion keeps the forecast positive', () => {
    const state = createDemoState();
    const saved = financeReducer(state, {
      type: 'transaction/added',
      transaction: { ...expense('s', 850, 'other'), kind: 'saving', goalId: 'demo-g1', day: 6 },
    });
    expect(computeSnapshot(saved).projectedEnd).toBeGreaterThan(0);
  });

  it('warns about pace when spending outruns the allowance', () => {
    const state: FinanceState = { ...createEmptyState(), transactions: [expense('a', 4000, 'fun')] };
    const [first] = suggest(state);
    expect(first).toMatchObject({ id: 'pace', tone: 'warn' });
    expect(first?.text).toContain('Bring everyday spending down from ₹4,000 to ₹200 a day');
  });

  it('tells the user to pause when everything left is promised', () => {
    const state: FinanceState = {
      ...createEmptyState(),
      transactions: [expense('a', 9000, 'fun')],
      scheduled: [{ id: 'r', kind: 'commitment', label: 'Rent', amount: 3000, dueDay: 20, cancelledDay: null }],
    };
    expect(suggest(state)[0]?.text).toContain('Pause non-essential spending');
  });

  it('never suggests cancelling commitments or already-charged subscriptions', () => {
    const state: FinanceState = {
      ...createEmptyState(),
      currentDay: 10,
      scheduled: [
        { id: 'r', kind: 'commitment', label: 'Rent', amount: 3000, dueDay: 20, cancelledDay: null },
        { id: 's', kind: 'subscription', label: 'Old sub', amount: 300, dueDay: 5, cancelledDay: null },
      ],
    };
    expect(suggest(state).some((s) => s.id === 'cancel')).toBe(false);
  });

  it('skips the savings nudge when there is too little to spare', () => {
    const state: FinanceState = {
      ...createEmptyState(),
      goals: [{ id: 'g', label: 'Trip', target: 5000 }],
      transactions: [expense('a', 9900, 'bills')],
    };
    expect(suggest(state).some((s) => s.id === 'save')).toBe(false);
  });
});
