import { computeSnapshot } from './ledger';
import { financeReducer, type FinanceAction } from './reducer';
import type { Category, FinanceState, Snapshot } from './types';

export type Decision =
  | { type: 'spend'; label: string; amount: number; category: Category }
  | { type: 'unexpected'; label: string; amount: number }
  | { type: 'income'; label: string; amount: number }
  | { type: 'subscribe'; label: string; amount: number; dueDay: number }
  | { type: 'cancel'; scheduledId: string }
  | { type: 'save'; goalId: string; amount: number };

export const DECISION_LABELS: Record<Decision['type'], string> = {
  spend: 'Buy something',
  subscribe: 'Start a subscription',
  cancel: 'Cancel a subscription',
  save: 'Move money to a goal',
  income: 'Earn extra income',
  unexpected: 'Unexpected expense',
};

/** Translates a decision into the same action the real app dispatches. */
export function decisionToAction(decision: Decision, state: FinanceState, id: string): FinanceAction {
  const day = state.currentDay;
  switch (decision.type) {
    case 'spend':
      return {
        type: 'transaction/added',
        transaction: {
          id,
          kind: 'expense',
          label: decision.label,
          amount: decision.amount,
          category: decision.category,
          day,
          unexpected: false,
          goalId: null,
        },
      };
    case 'unexpected':
      return {
        type: 'transaction/added',
        transaction: {
          id,
          kind: 'expense',
          label: decision.label,
          amount: decision.amount,
          category: 'other',
          day,
          unexpected: true,
          goalId: null,
        },
      };
    case 'income':
      return {
        type: 'transaction/added',
        transaction: {
          id,
          kind: 'income',
          label: decision.label,
          amount: decision.amount,
          category: 'other',
          day,
          unexpected: false,
          goalId: null,
        },
      };
    case 'subscribe':
      return {
        type: 'scheduled/added',
        payment: {
          id,
          kind: 'subscription',
          label: decision.label,
          amount: decision.amount,
          dueDay: decision.dueDay,
          cancelledDay: null,
        },
      };
    case 'cancel':
      return { type: 'scheduled/cancelled', id: decision.scheduledId };
    case 'save': {
      const goal = state.goals.find((g) => g.id === decision.goalId);
      return {
        type: 'transaction/added',
        transaction: {
          id,
          kind: 'saving',
          label: goal ? `Saved for ${goal.label}` : 'Savings',
          amount: decision.amount,
          category: 'other',
          day,
          unexpected: false,
          goalId: decision.goalId,
        },
      };
    }
  }
}

export type ImpactFormat = 'money' | 'score' | 'percent';

export interface ImpactRow {
  key: string;
  label: string;
  before: number;
  after: number;
  delta: number;
  format: ImpactFormat;
  /** Whether the change helps, hurts or does nothing for the user. */
  effect: 'better' | 'worse' | 'same';
}

export type Verdict = 'safe' | 'caution' | 'risky';

export interface Simulation {
  before: Snapshot;
  after: Snapshot;
  impact: ImpactRow[];
  verdict: Verdict;
  summary: string;
}

function row(
  key: string,
  label: string,
  before: number,
  after: number,
  format: ImpactFormat,
  higherIsBetter = true,
): ImpactRow {
  const delta = after - before;
  const changed = Math.round(format === 'percent' ? delta * 100 : delta) !== 0;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return {
    key,
    label,
    before,
    after,
    delta,
    format,
    effect: !changed ? 'same' : improved ? 'better' : 'worse',
  };
}

export function compareSnapshots(before: Snapshot, after: Snapshot): ImpactRow[] {
  return [
    row('balance', 'Remaining balance', before.balance, after.balance, 'money'),
    row('allowance', 'Daily allowance', before.dailyAllowance, after.dailyAllowance, 'money'),
    row('forecast', 'Month-end forecast', before.projectedEnd, after.projectedEnd, 'money'),
    row('goals', 'Savings goals funded', before.goalProgress, after.goalProgress, 'percent'),
    row('risk', 'Financial risk', before.risk.score, after.risk.score, 'score', false),
    row('health', 'Financial health', before.health.score, after.health.score, 'score'),
  ];
}

function judge(before: Snapshot, after: Snapshot): Pick<Simulation, 'verdict' | 'summary'> {
  if (after.balance < 0) {
    return {
      verdict: 'risky',
      summary: "You can't afford this right now — it would overdraw your balance.",
    };
  }
  if (after.projectedEnd < 0) {
    return {
      verdict: 'risky',
      summary:
        after.shortfallDay === null
          ? 'This leaves you short before the month ends.'
          : `Risky: with this, your money runs out on day ${after.shortfallDay}.`,
    };
  }
  const healthDrop = before.health.score - after.health.score;
  if (after.risk.level === 'high' || healthDrop >= 8 || after.safeToSpend < 0) {
    return {
      verdict: 'caution',
      summary: 'Doable, but it squeezes the rest of your month. Check the numbers below.',
    };
  }
  if (after.health.score > before.health.score) {
    return { verdict: 'safe', summary: 'Good move — this improves your financial health.' };
  }
  return { verdict: 'safe', summary: 'You can afford this without derailing your month.' };
}

/** Runs a decision against a copy of the ledger so nothing real changes. */
export function simulate(state: FinanceState, decision: Decision): Simulation {
  const before = computeSnapshot(state);
  const after = computeSnapshot(
    financeReducer(state, decisionToAction(decision, state, 'simulated-decision')),
  );
  return { before, after, impact: compareSnapshots(before, after), ...judge(before, after) };
}
