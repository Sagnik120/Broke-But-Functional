import { MAX_GOALS, MAX_SCHEDULED, MAX_TRANSACTIONS, MONTH_DAYS } from './constants';
import { earliestDay } from './ledger';
import { clamp } from './sanitize';
import type { FinanceState, Goal, ScheduledPayment, Transaction } from './types';

export type FinanceAction =
  | { type: 'transaction/added'; transaction: Transaction }
  | { type: 'transaction/removed'; id: string }
  | { type: 'scheduled/added'; payment: ScheduledPayment }
  | { type: 'scheduled/removed'; id: string }
  | { type: 'scheduled/cancelled'; id: string }
  | { type: 'scheduled/resumed'; id: string }
  | { type: 'goal/added'; goal: Goal }
  | { type: 'goal/removed'; id: string }
  | { type: 'day/set'; day: number }
  | { type: 'state/replaced'; state: FinanceState };

function savedTowards(state: FinanceState, goalId: string): number {
  return state.transactions.reduce(
    (sum, t) => (t.kind === 'saving' && t.goalId === goalId ? sum + t.amount : sum),
    0,
  );
}

function addTransaction(state: FinanceState, transaction: Transaction): FinanceState {
  if (state.transactions.length >= MAX_TRANSACTIONS || transaction.amount <= 0) return state;
  let next = transaction;

  if (transaction.kind === 'saving') {
    const goal = state.goals.find((g) => g.id === transaction.goalId);
    if (!goal) return state;
    // Never save more than the goal still needs.
    const amount = Math.min(transaction.amount, goal.target - savedTowards(state, goal.id));
    if (amount <= 0) return state;
    next = { ...transaction, amount };
  }

  return { ...state, transactions: [...state.transactions, next] };
}

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'transaction/added':
      return addTransaction(state, action.transaction);

    case 'transaction/removed':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };

    case 'scheduled/added':
      if (state.scheduled.length >= MAX_SCHEDULED || action.payment.amount <= 0) return state;
      return { ...state, scheduled: [...state.scheduled, action.payment] };

    case 'scheduled/removed':
      return { ...state, scheduled: state.scheduled.filter((p) => p.id !== action.id) };

    case 'scheduled/cancelled':
      return {
        ...state,
        scheduled: state.scheduled.map((p) =>
          p.id === action.id && p.cancelledDay === null ? { ...p, cancelledDay: state.currentDay } : p,
        ),
      };

    case 'scheduled/resumed':
      return {
        ...state,
        scheduled: state.scheduled.map((p) => (p.id === action.id ? { ...p, cancelledDay: null } : p)),
      };

    case 'goal/added':
      if (state.goals.length >= MAX_GOALS || action.goal.target <= 0) return state;
      return { ...state, goals: [...state.goals, action.goal] };

    case 'goal/removed':
      // Releasing a goal returns its savings to the spendable balance.
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.id),
        transactions: state.transactions.filter((t) => t.goalId !== action.id),
      };

    case 'day/set': {
      const day = clamp(Math.round(action.day), earliestDay(state), MONTH_DAYS);
      return day === state.currentDay ? state : { ...state, currentDay: day };
    }

    case 'state/replaced':
      return action.state;
  }
}
