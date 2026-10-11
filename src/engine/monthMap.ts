import { BASELINE_DAILY_SPEND } from '@/constants';
import { isCharged, isUpcoming } from '@/engine/ledger';
import type { FinanceState, Snapshot } from '@/types/finance';
import { formatINR } from '@/utils/format';

export type SpendLevel = 0 | 1 | 2 | 3 | 4;

/** One day of the month, ready to draw as a calendar cell. */
export interface DayCell {
  day: number;
  status: 'past' | 'today' | 'future';
  /** Money spent that day (actual days only). */
  spent: number;
  /** Scheduled payments falling due that day. */
  due: number;
  /** Actual balance for past days and today; forecast balance for future days. */
  balance: number;
  /** 0 = nothing spent … 4 = more than double a sustainable day. */
  level: SpendLevel;
  /** The balance is, or is forecast to be, below zero. */
  shortfall: boolean;
}

/** Grades a day's spending against the amount that would exactly last the month. */
export function spendLevel(spent: number): SpendLevel {
  if (spent <= 0) return 0;
  const ratio = spent / BASELINE_DAILY_SPEND;
  if (ratio <= 0.5) return 1;
  if (ratio <= 1) return 2;
  if (ratio <= 2) return 3;
  return 4;
}

/** Builds the 30-day map: what happened on past days and what is scheduled or forecast for the rest. */
export function buildMonthMap(state: FinanceState, snapshot: Snapshot): DayCell[] {
  const today = state.currentDay;

  const spentByDay = new Map<number, number>();
  for (const t of state.transactions) {
    if (t.kind === 'expense') spentByDay.set(t.day, (spentByDay.get(t.day) ?? 0) + t.amount);
  }

  const dueByDay = new Map<number, number>();
  for (const payment of state.scheduled) {
    if (isCharged(payment, today) || isUpcoming(payment, today)) {
      dueByDay.set(payment.dueDay, (dueByDay.get(payment.dueDay) ?? 0) + payment.amount);
    }
  }

  return snapshot.forecast.map((point) => {
    const status = point.day < today ? 'past' : point.day === today ? 'today' : 'future';
    const spent = spentByDay.get(point.day) ?? 0;
    return {
      day: point.day,
      status,
      spent,
      due: dueByDay.get(point.day) ?? 0,
      balance: point.balance,
      level: status === 'future' ? 0 : spendLevel(spent),
      shortfall: point.balance < 0,
    };
  });
}

/** A full sentence for screen readers, so the map never relies on colour alone. */
export function describeDay(cell: DayCell): string {
  const parts = [cell.status === 'today' ? `Day ${cell.day}, today` : `Day ${cell.day}`];
  if (cell.status === 'future') parts.push(`forecast balance ${formatINR(cell.balance)}`);
  else parts.push(cell.spent > 0 ? `spent ${formatINR(cell.spent)}` : 'nothing spent');
  if (cell.due > 0) parts.push(`${formatINR(cell.due)} in bills due`);
  if (cell.shortfall) parts.push('money has run out');
  return `${parts.join(', ')}.`;
}
