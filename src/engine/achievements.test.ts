import { describe, expect, it } from 'vitest';
import { buildAchievements, paceStreak } from '@/engine/achievements';
import { computeSnapshot } from '@/engine/ledger';
import { financeReducer } from '@/engine/reducer';
import { createDemoState, createEmptyState } from '@/engine/seed';
import type { FinanceState, Transaction } from '@/types/finance';

function expense(day: number, amount: number, unexpected = false): Transaction {
  return {
    id: `e${day}-${amount}`,
    kind: 'expense',
    label: 'Test',
    amount,
    category: 'food',
    day,
    unexpected,
    goalId: null,
  };
}

const earnedIds = (state: FinanceState) =>
  buildAchievements(state, computeSnapshot(state))
    .filter((achievement) => achievement.earned)
    .map((achievement) => achievement.id);

describe('paceStreak', () => {
  it('counts back from today until a day went over the sustainable amount', () => {
    // Demo: day 1 cost ₹420 (over ₹333); days 2 to 6 stayed under.
    expect(paceStreak(createDemoState())).toBe(5);
  });

  it('starts at one on a fresh month and resets on a heavy day', () => {
    expect(paceStreak(createEmptyState())).toBe(1);
    const heavyToday: FinanceState = {
      ...createEmptyState(),
      currentDay: 4,
      transactions: [expense(4, 900)],
    };
    expect(paceStreak(heavyToday)).toBe(0);
  });

  it('ignores unexpected expenses, which are not part of everyday pace', () => {
    const state: FinanceState = {
      ...createEmptyState(),
      currentDay: 3,
      transactions: [expense(2, 2000, true)],
    };
    expect(paceStreak(state)).toBe(3);
  });
});

describe('buildAchievements', () => {
  it('awards the demo month its streak, saver and side-hustle badges', () => {
    expect(earnedIds(createDemoState())).toEqual(['streak', 'saver', 'side-hustler']);
  });

  it('awards nothing on an untouched month', () => {
    expect(earnedIds(createEmptyState())).toEqual([]);
  });

  it('states the streak length in the badge title', () => {
    const [streak] = buildAchievements(createDemoState(), computeSnapshot(createDemoState()));
    expect(streak?.title).toBe('On-pace streak: 5 days');
    const [fresh] = buildAchievements(createEmptyState(), computeSnapshot(createEmptyState()));
    expect(fresh?.title).toBe('On-pace streak: 1 day');
  });

  it('awards subscription slayer only for cancelling before the bill', () => {
    const demo = createDemoState();
    const early = financeReducer(demo, { type: 'scheduled/cancelled', id: 'demo-s5' });
    expect(earnedIds(early)).toContain('sub-slayer');
    // Cloud storage already billed on day 4, so cancelling it on day 6 does not count.
    const late = financeReducer(demo, { type: 'scheduled/cancelled', id: 'demo-s1' });
    expect(earnedIds(late)).not.toContain('sub-slayer');
  });

  it('awards goal crusher when a goal is fully funded', () => {
    const funded = financeReducer(createDemoState(), {
      type: 'transaction/added',
      transaction: { ...expense(6, 1000), id: 'top-up', kind: 'saving', goalId: 'demo-g1' },
    });
    expect(earnedIds(funded)).toContain('goal-getter');
  });

  it('awards shock absorber only while the forecast stays positive', () => {
    const absorbed: FinanceState = { ...createEmptyState(), transactions: [expense(1, 800, true)] };
    expect(earnedIds(absorbed)).toContain('shock-absorber');
    const sunk: FinanceState = { ...createEmptyState(), transactions: [expense(1, 12_000, true)] };
    expect(earnedIds(sunk)).not.toContain('shock-absorber');
  });
});
