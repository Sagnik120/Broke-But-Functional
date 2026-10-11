import { CATEGORY_LABELS } from './constants';
import { formatINR, formatPercent } from './format';
import { isUpcoming } from './ledger';
import { simulate } from './simulate';
import type { Category, FinanceState, Snapshot } from './types';

export interface CategorySpend {
  category: Category;
  label: string;
  amount: number;
  /** Share of all expenses, 0–1. */
  share: number;
}

/** Totals expenses per category, largest first. */
export function spendingByCategory(state: FinanceState): CategorySpend[] {
  const totals = new Map<Category, number>();
  let total = 0;
  for (const t of state.transactions) {
    if (t.kind !== 'expense') continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    total += t.amount;
  }
  return Array.from(totals, ([category, amount]) => ({
    category,
    label: CATEGORY_LABELS[category],
    amount,
    share: amount / total,
  })).sort((a, b) => b.amount - a.amount);
}

export interface Suggestion {
  id: string;
  tone: 'good' | 'warn';
  text: string;
}

const MIN_TRANSFER = 100;
const TRANSFER_STEP = 50;

/**
 * Turns the current picture into concrete next moves. Each suggestion is
 * backed by the simulator, so the numbers it quotes are what would happen.
 */
export function buildSuggestions(state: FinanceState, snapshot: Snapshot): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (snapshot.burnRate > snapshot.dailyAllowance) {
    suggestions.push({
      id: 'pace',
      tone: 'warn',
      text:
        snapshot.dailyAllowance > 0
          ? `Bring everyday spending down from ${formatINR(snapshot.burnRate)} to ${formatINR(snapshot.dailyAllowance)} a day to reach day 30.`
          : 'Pause non-essential spending: everything left is already promised to upcoming payments.',
    });
  }

  const priciest = state.scheduled
    .filter((payment) => payment.kind === 'subscription' && isUpcoming(payment, state.currentDay))
    .sort((a, b) => b.amount - a.amount)[0];
  if (priciest) {
    const { before, after } = simulate(state, { type: 'cancel', scheduledId: priciest.id });
    suggestions.push({
      id: 'cancel',
      tone: 'good',
      text: `Cancelling ${priciest.label} before day ${priciest.dueDay} frees ${formatINR(priciest.amount)} and lifts your daily allowance by ${formatINR(after.dailyAllowance - before.dailyAllowance)}.`,
    });
  }

  const goal = snapshot.goals.find((candidate) => candidate.remaining > 0);
  if (goal) {
    const spare = Math.floor(Math.min(snapshot.projectedEnd / 2, snapshot.balance) / TRANSFER_STEP) * TRANSFER_STEP;
    const transfer = Math.min(goal.remaining, spare);
    if (transfer >= MIN_TRANSFER) {
      suggestions.push({
        id: 'save',
        tone: 'good',
        text: `You can move ${formatINR(transfer)} to ${goal.label} today and still be forecast to finish the month in the green.`,
      });
    }
  }

  const top = spendingByCategory(state)[0];
  if (top && top.share >= 0.4 && snapshot.spent >= 500) {
    suggestions.push({
      id: 'category',
      tone: 'warn',
      text: `${top.label} is ${formatPercent(top.share)} of your spending (${formatINR(top.amount)}). It's the first place to look for savings.`,
    });
  }

  return suggestions;
}
