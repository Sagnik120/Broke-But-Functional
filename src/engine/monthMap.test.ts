import { describe, expect, it } from 'vitest';
import { computeSnapshot } from '@/engine/ledger';
import { buildMonthMap, describeDay, spendLevel } from '@/engine/monthMap';
import { createDemoState, createEmptyState } from '@/engine/seed';
import type { FinanceState } from '@/types/finance';

const mapOf = (state: FinanceState) => buildMonthMap(state, computeSnapshot(state));

describe('spendLevel', () => {
  it('grades a day against a sustainable daily spend of about ₹333', () => {
    expect(spendLevel(0)).toBe(0);
    expect(spendLevel(120)).toBe(1);
    expect(spendLevel(300)).toBe(2);
    expect(spendLevel(420)).toBe(3);
    expect(spendLevel(900)).toBe(4);
  });
});

describe('buildMonthMap', () => {
  it('returns one cell per day and marks past, today and future', () => {
    const cells = mapOf(createDemoState());
    expect(cells).toHaveLength(30);
    expect(cells[0]).toMatchObject({ day: 1, status: 'past', spent: 420, level: 3 });
    expect(cells[5]).toMatchObject({ day: 6, status: 'today', spent: 0, level: 0, balance: 9670 });
    expect(cells[6]?.status).toBe('future');
  });

  it('places bills on their due day, whether already charged or still to come', () => {
    const cells = mapOf(createDemoState());
    expect(cells[3]).toMatchObject({ day: 4, due: 130, spent: 120, level: 1 });
    expect(cells[9]).toMatchObject({ day: 10, due: 2500, status: 'future', level: 0 });
    expect(cells[19]?.due).toBe(199);
  });

  it('leaves cancelled subscriptions off the map', () => {
    const state = createDemoState();
    const cancelled = {
      ...state,
      scheduled: state.scheduled.map((p) => (p.id === 'demo-s5' ? { ...p, cancelledDay: 6 } : p)),
    };
    expect(mapOf(cancelled)[19]?.due).toBe(0);
  });

  it('flags the days after money is forecast to run out', () => {
    const state: FinanceState = {
      ...createEmptyState(),
      currentDay: 5,
      transactions: [
        {
          id: 'a',
          kind: 'expense',
          label: 'Splurge',
          amount: 6000,
          category: 'fun',
          day: 1,
          unexpected: false,
          goalId: null,
        },
      ],
    };
    const cells = mapOf(state);
    expect(cells[4]?.shortfall).toBe(false);
    expect(cells[29]?.shortfall).toBe(true);
  });
});

describe('describeDay', () => {
  it('writes a full sentence for each kind of day', () => {
    const cells = mapOf(createDemoState());
    expect(describeDay(cells[3]!)).toBe('Day 4, spent ₹120, ₹130 in bills due.');
    expect(describeDay(cells[5]!)).toBe('Day 6, today, nothing spent.');
    expect(describeDay(cells[9]!)).toMatch(/^Day 10, forecast balance ₹[\d,]+, ₹2,500 in bills due\.$/);
  });

  it('says when money has run out', () => {
    const cell = {
      day: 28,
      status: 'future',
      spent: 0,
      due: 0,
      balance: -400,
      level: 0,
      shortfall: true,
    } as const;
    expect(describeDay(cell)).toBe('Day 28, forecast balance -₹400, money has run out.');
  });
});
