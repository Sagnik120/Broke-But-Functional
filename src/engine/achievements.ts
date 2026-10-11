import { BASELINE_DAILY_SPEND } from '@/constants';
import type { FinanceState, Snapshot } from '@/types/finance';
import { formatINR } from '@/utils/format';

export type AchievementId =
  'streak' | 'saver' | 'goal-getter' | 'sub-slayer' | 'side-hustler' | 'shock-absorber';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  earned: boolean;
}

const STREAK_TARGET = 3;
const SAVER_TARGET = 500;

/**
 * Counts consecutive days, ending today, on which everyday spending stayed at
 * or under the amount that would exactly last the month.
 */
export function paceStreak(state: FinanceState): number {
  const spentByDay = new Map<number, number>();
  for (const t of state.transactions) {
    if (t.kind === 'expense' && !t.unexpected) {
      spentByDay.set(t.day, (spentByDay.get(t.day) ?? 0) + t.amount);
    }
  }
  let streak = 0;
  for (let day = state.currentDay; day >= 1; day -= 1) {
    if ((spentByDay.get(day) ?? 0) > BASELINE_DAILY_SPEND) break;
    streak += 1;
  }
  return streak;
}

/** Derives every badge from the ledger, so achievements can never drift from the real numbers. */
export function buildAchievements(state: FinanceState, snapshot: Snapshot): Achievement[] {
  const streak = paceStreak(state);
  return [
    {
      id: 'streak',
      title: `On-pace streak: ${streak} ${streak === 1 ? 'day' : 'days'}`,
      description: `Stay at or under ${formatINR(BASELINE_DAILY_SPEND)} of everyday spending for ${STREAK_TARGET} days running.`,
      earned: streak >= STREAK_TARGET,
    },
    {
      id: 'saver',
      title: `First ${formatINR(SAVER_TARGET)} saved`,
      description: `Move ${formatINR(SAVER_TARGET)} into any savings goal.`,
      earned: snapshot.saved >= SAVER_TARGET,
    },
    {
      id: 'goal-getter',
      title: 'Goal crusher',
      description: 'Fully fund a savings goal.',
      earned: snapshot.goals.some((goal) => goal.target > 0 && goal.remaining === 0),
    },
    {
      id: 'sub-slayer',
      title: 'Subscription slayer',
      description: 'Cancel a subscription before it bills.',
      earned: state.scheduled.some(
        (payment) =>
          payment.kind === 'subscription' &&
          payment.cancelledDay !== null &&
          payment.cancelledDay < payment.dueDay,
      ),
    },
    {
      id: 'side-hustler',
      title: 'Side hustler',
      description: 'Earn income beyond your ₹10,000.',
      earned: state.transactions.some((t) => t.kind === 'income'),
    },
    {
      id: 'shock-absorber',
      title: 'Shock absorber',
      description: 'Take an unexpected expense and still finish in the green.',
      earned: snapshot.unexpectedTotal > 0 && snapshot.projectedEnd >= 0,
    },
  ];
}
