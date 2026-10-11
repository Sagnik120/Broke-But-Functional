import { describe, expect, it } from 'vitest';
import { MONTH_DAYS, MONTHLY_BUDGET } from '@/constants';
import {
  computeSnapshot,
  earliestDay,
  healthGrade,
  isCharged,
  isUpcoming,
  riskLevel,
  scheduledStatus,
} from '@/engine/ledger';
import { createDemoState, createEmptyState } from '@/engine/seed';
import type { FinanceState, ScheduledPayment, Transaction } from '@/types/finance';

function expense(amount: number, day: number, unexpected = false): Transaction {
  return {
    id: `e-${day}-${amount}`,
    kind: 'expense',
    label: 'Test expense',
    amount,
    category: 'food',
    day,
    unexpected,
    goalId: null,
  };
}

function payment(overrides: Partial<ScheduledPayment> = {}): ScheduledPayment {
  return {
    id: 's1',
    kind: 'subscription',
    label: 'Stream',
    amount: 200,
    dueDay: 10,
    cancelledDay: null,
    ...overrides,
  };
}

function stateWith(overrides: Partial<FinanceState>): FinanceState {
  return { ...createEmptyState(), ...overrides };
}

describe('scheduled payment status', () => {
  it('charges an active payment once its due day arrives', () => {
    expect(isCharged(payment(), 9)).toBe(false);
    expect(isCharged(payment(), 10)).toBe(true);
    expect(scheduledStatus(payment(), 10)).toBe('paid');
  });

  it('never charges a payment cancelled before its due day', () => {
    const cancelled = payment({ cancelledDay: 5 });
    expect(isCharged(cancelled, 20)).toBe(false);
    expect(isUpcoming(cancelled, 6)).toBe(false);
    expect(scheduledStatus(cancelled, 20)).toBe('cancelled');
  });

  it('keeps the charge when cancelled on or after the due day', () => {
    expect(isCharged(payment({ cancelledDay: 10 }), 12)).toBe(true);
    expect(isCharged(payment({ cancelledDay: 15 }), 15)).toBe(true);
  });

  it('reports upcoming payments', () => {
    expect(isUpcoming(payment(), 3)).toBe(true);
    expect(scheduledStatus(payment(), 3)).toBe('upcoming');
  });
});

describe('computeSnapshot', () => {
  it('starts a fresh month with the full budget spread across 30 days', () => {
    const snapshot = computeSnapshot(createEmptyState());
    expect(snapshot.balance).toBe(MONTHLY_BUDGET);
    expect(snapshot.daysLeft).toBe(MONTH_DAYS);
    expect(snapshot.dailyAllowance).toBeCloseTo(MONTHLY_BUDGET / MONTH_DAYS);
    expect(snapshot.projectedEnd).toBe(MONTHLY_BUDGET);
    expect(snapshot.shortfallDay).toBeNull();
    expect(snapshot.risk).toEqual({ score: 0, level: 'low', reasons: [] });
    expect(snapshot.health).toEqual({ score: 90, grade: 'thriving' });
  });

  it('connects every part of the demo month', () => {
    const snapshot = computeSnapshot(createDemoState());
    expect(snapshot.income).toBe(11_500);
    expect(snapshot.spent).toBe(1200);
    expect(snapshot.scheduledPaid).toBe(130);
    expect(snapshot.saved).toBe(500);
    expect(snapshot.balance).toBe(9670);
    expect(snapshot.upcoming).toBe(3117);
    expect(snapshot.safeToSpend).toBe(6553);
    expect(snapshot.dailyAllowance).toBeCloseTo(6553 / 25);
    expect(snapshot.burnRate).toBe(200);
    expect(snapshot.projectedEnd).toBeCloseTo(6553 - 200 * 24);
    expect(snapshot.goalsRemaining).toBe(3000);
    expect(snapshot.risk.level).toBe('low');
  });

  it('subtracts upcoming commitments before working out the daily allowance', () => {
    const snapshot = computeSnapshot(stateWith({ scheduled: [payment({ amount: 4000, dueDay: 20 })] }));
    expect(snapshot.balance).toBe(10_000);
    expect(snapshot.upcoming).toBe(4000);
    expect(snapshot.dailyAllowance).toBeCloseTo(6000 / 30);
  });

  it('moves a payment from upcoming to paid when its day arrives', () => {
    const snapshot = computeSnapshot(
      stateWith({ currentDay: 20, scheduled: [payment({ amount: 4000, dueDay: 20 })] }),
    );
    expect(snapshot.balance).toBe(6000);
    expect(snapshot.upcoming).toBe(0);
    expect(snapshot.scheduledPaid).toBe(4000);
  });

  it('keeps unexpected expenses out of the everyday burn rate', () => {
    const snapshot = computeSnapshot(
      stateWith({ currentDay: 2, transactions: [expense(400, 1), expense(2000, 2, true)] }),
    );
    expect(snapshot.burnRate).toBe(200);
    expect(snapshot.unexpectedTotal).toBe(2000);
    expect(snapshot.balance).toBe(7600);
  });

  it('flags the day money runs out when overspending', () => {
    const snapshot = computeSnapshot(
      stateWith({ currentDay: 5, transactions: [expense(5000, 1), expense(1000, 5)] }),
    );
    expect(snapshot.projectedEnd).toBeLessThan(0);
    expect(snapshot.shortfallDay).toBeGreaterThan(5);
    expect(snapshot.risk.level).toBe('high');
    expect(snapshot.risk.reasons.join(' ')).toContain('runs out on day');
    expect(snapshot.health.grade).toBe('critical');
  });

  it('raises risk when the balance cannot cover promised payments', () => {
    const snapshot = computeSnapshot(
      stateWith({ transactions: [expense(9000, 1)], scheduled: [payment({ amount: 2000, dueDay: 15 })] }),
    );
    expect(snapshot.safeToSpend).toBe(-1000);
    expect(snapshot.dailyAllowance).toBe(0);
    expect(snapshot.risk.reasons.some((reason) => reason.includes('more than your balance'))).toBe(true);
  });

  it('reports an overdrawn balance', () => {
    const snapshot = computeSnapshot(stateWith({ transactions: [expense(12_000, 1)] }));
    expect(snapshot.balance).toBe(-2000);
    expect(snapshot.shortfallDay).toBe(1);
    expect(snapshot.risk.reasons.some((reason) => reason.includes('overdrawn'))).toBe(true);
  });

  it('caps goal savings at the target and tracks progress', () => {
    const saving: Transaction = { ...expense(900, 1), id: 'sv', kind: 'saving', goalId: 'g1' };
    const snapshot = computeSnapshot(
      stateWith({ goals: [{ id: 'g1', label: 'Trip', target: 600 }], transactions: [saving] }),
    );
    expect(snapshot.goals[0]).toMatchObject({ saved: 600, remaining: 0, progress: 1 });
    expect(snapshot.goalProgress).toBe(1);
  });

  it('produces a 30-point forecast that switches to projection after today', () => {
    const { forecast, balance, projectedEnd } = computeSnapshot(createDemoState());
    expect(forecast).toHaveLength(MONTH_DAYS);
    expect(forecast[5]).toEqual({ day: 6, balance, projected: false });
    expect(forecast[6]?.projected).toBe(true);
    expect(forecast[29]?.balance).toBe(projectedEnd);
  });

  it('improves health as savings goals are funded', () => {
    const goals = [{ id: 'g1', label: 'Trip', target: 1000 }];
    const saving: Transaction = { ...expense(1000, 1), id: 'sv', kind: 'saving', goalId: 'g1' };
    const before = computeSnapshot(stateWith({ goals }));
    const after = computeSnapshot(stateWith({ goals, transactions: [saving] }));
    expect(after.health.score).toBeGreaterThan(before.health.score);
  });
});

describe('grading helpers', () => {
  it('maps scores to risk levels', () => {
    expect(riskLevel(0)).toBe('low');
    expect(riskLevel(34)).toBe('medium');
    expect(riskLevel(67)).toBe('high');
  });

  it('maps scores to health grades', () => {
    expect(healthGrade(80)).toBe('thriving');
    expect(healthGrade(60)).toBe('stable');
    expect(healthGrade(40)).toBe('stretched');
    expect(healthGrade(39)).toBe('critical');
  });

  it('finds the earliest day the calendar may show', () => {
    expect(earliestDay(createEmptyState())).toBe(1);
    expect(earliestDay(createDemoState())).toBe(6);
  });
});
