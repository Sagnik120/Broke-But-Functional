import type { FinanceState, Transaction } from '@/types/finance';

export function createEmptyState(): FinanceState {
  return { version: 1, currentDay: 1, transactions: [], scheduled: [], goals: [] };
}

function expense(
  id: string,
  day: number,
  label: string,
  amount: number,
  category: Transaction['category'],
): Transaction {
  return { id, kind: 'expense', label, amount, category, day, unexpected: false, goalId: null };
}

/** A realistic first week so new users land on a living dashboard instead of zeros. */
export function createDemoState(): FinanceState {
  return {
    version: 1,
    currentDay: 6,
    transactions: [
      expense('demo-t1', 1, 'Groceries run', 420, 'food'),
      expense('demo-t2', 2, 'Metro card top-up', 200, 'transport'),
      expense('demo-t3', 3, 'Movie night', 300, 'fun'),
      {
        id: 'demo-t4',
        kind: 'saving',
        label: 'Saved for Emergency cushion',
        amount: 500,
        category: 'other',
        day: 3,
        unexpected: false,
        goalId: 'demo-g1',
      },
      expense('demo-t5', 4, 'Chai and snacks', 120, 'food'),
      expense('demo-t6', 5, 'Thrift store find', 160, 'shopping'),
      {
        id: 'demo-t7',
        kind: 'income',
        label: 'Freelance logo gig',
        amount: 1500,
        category: 'other',
        day: 6,
        unexpected: false,
        goalId: null,
      },
    ],
    scheduled: [
      {
        id: 'demo-s1',
        kind: 'subscription',
        label: 'Cloud storage',
        amount: 130,
        dueDay: 4,
        cancelledDay: null,
      },
      {
        id: 'demo-s2',
        kind: 'commitment',
        label: 'Hostel mess fee',
        amount: 2500,
        dueDay: 10,
        cancelledDay: null,
      },
      {
        id: 'demo-s3',
        kind: 'subscription',
        label: 'Music streaming',
        amount: 119,
        dueDay: 12,
        cancelledDay: null,
      },
      {
        id: 'demo-s4',
        kind: 'commitment',
        label: 'Phone recharge',
        amount: 299,
        dueDay: 15,
        cancelledDay: null,
      },
      {
        id: 'demo-s5',
        kind: 'subscription',
        label: 'Video streaming',
        amount: 199,
        dueDay: 20,
        cancelledDay: null,
      },
    ],
    goals: [
      { id: 'demo-g1', label: 'Emergency cushion', target: 1500 },
      { id: 'demo-g2', label: 'Concert ticket', target: 2000 },
    ],
  };
}
