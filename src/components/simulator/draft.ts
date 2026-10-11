import { formatINR } from '@/utils/format';
import { parseAmount, parseDay, parseLabel } from '@/utils/sanitize';
import type { Decision } from '@/engine/simulate';
import type { Category, FinanceState, Snapshot } from '@/types/finance';

/** Raw, unvalidated form values for the decision simulator. */
export interface DecisionDraft {
  type: Decision['type'];
  label: string;
  amount: string;
  category: Category;
  dueDay: string;
  scheduledId: string;
  goalId: string;
}

export type DraftErrors = Partial<Record<'label' | 'amount' | 'dueDay' | 'scheduledId' | 'goalId', string>>;

export type DraftResult = { decision: Decision; errors: null } | { decision: null; errors: DraftErrors };

export const EMPTY_DRAFT: DecisionDraft = {
  type: 'spend',
  label: '',
  amount: '',
  category: 'fun',
  dueDay: '',
  scheduledId: '',
  goalId: '',
};

/** Validates and sanitises a draft into a typed decision the engine can run. */
export function parseDraft(draft: DecisionDraft, state: FinanceState, snapshot: Snapshot): DraftResult {
  const errors: DraftErrors = {};

  if (draft.type === 'cancel') {
    const target = state.scheduled.find((p) => p.id === draft.scheduledId && p.cancelledDay === null);
    if (!target) return { decision: null, errors: { scheduledId: 'Choose a subscription to cancel.' } };
    return { decision: { type: 'cancel', scheduledId: target.id }, errors: null };
  }

  const amount = parseAmount(draft.amount);
  if (!amount.ok) errors.amount = amount.error;

  if (draft.type === 'save') {
    const goal = snapshot.goals.find((g) => g.id === draft.goalId);
    if (!goal) errors.goalId = 'Choose a goal to save towards.';
    else if (goal.remaining === 0) errors.goalId = 'That goal is already fully funded.';
    if (amount.ok && amount.value > Math.max(0, snapshot.balance)) {
      errors.amount = `You only have ${formatINR(Math.max(0, snapshot.balance))} to move.`;
    }
    if (!goal || !amount.ok || errors.goalId || errors.amount) return { decision: null, errors };
    return {
      decision: { type: 'save', goalId: goal.id, amount: Math.min(amount.value, goal.remaining) },
      errors: null,
    };
  }

  const label = parseLabel(draft.label, 'Description');
  if (!label.ok) errors.label = label.error;

  if (draft.type === 'subscribe') {
    const dueDay = parseDay(draft.dueDay);
    if (!dueDay.ok) errors.dueDay = dueDay.error;
    if (!amount.ok || !label.ok || !dueDay.ok) return { decision: null, errors };
    return {
      decision: { type: 'subscribe', label: label.value, amount: amount.value, dueDay: dueDay.value },
      errors: null,
    };
  }

  if (!amount.ok || !label.ok) return { decision: null, errors };
  if (draft.type === 'spend') {
    return {
      decision: { type: 'spend', label: label.value, amount: amount.value, category: draft.category },
      errors: null,
    };
  }
  return { decision: { type: draft.type, label: label.value, amount: amount.value }, errors: null };
}
