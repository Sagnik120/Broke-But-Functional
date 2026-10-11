import {
  MAX_AMOUNT,
  MAX_STORED_CHARACTERS,
  MAX_GOALS,
  MAX_SCHEDULED,
  MAX_TRANSACTIONS,
  MONTH_DAYS,
  STORAGE_KEY,
} from './constants';
import { sanitizeText, toBoundedInt } from './sanitize';
import {
  CATEGORIES,
  type Category,
  type FinanceState,
  type Goal,
  type ScheduledPayment,
  type Transaction,
} from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseId(raw: unknown): string | null {
  return typeof raw === 'string' && /^[\w-]{1,64}$/.test(raw) ? raw : null;
}

function parseCategory(raw: unknown): Category {
  return CATEGORIES.find((category) => category === raw) ?? 'other';
}

function parseGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null;
  const id = parseId(raw.id);
  const label = sanitizeText(raw.label);
  const target = toBoundedInt(raw.target, 1, MAX_AMOUNT);
  if (id === null || label === '' || target === null) return null;
  return { id, label, target };
}

function parseScheduled(raw: unknown): ScheduledPayment | null {
  if (!isRecord(raw)) return null;
  const id = parseId(raw.id);
  const label = sanitizeText(raw.label);
  const amount = toBoundedInt(raw.amount, 1, MAX_AMOUNT);
  const dueDay = toBoundedInt(raw.dueDay, 1, MONTH_DAYS);
  if (id === null || label === '' || amount === null || dueDay === null) return null;
  if (raw.kind !== 'commitment' && raw.kind !== 'subscription') return null;
  return {
    id,
    kind: raw.kind,
    label,
    amount,
    dueDay,
    cancelledDay: toBoundedInt(raw.cancelledDay, 1, MONTH_DAYS),
  };
}

function parseTransaction(raw: unknown, goalIds: ReadonlySet<string>): Transaction | null {
  if (!isRecord(raw)) return null;
  const id = parseId(raw.id);
  const label = sanitizeText(raw.label);
  const amount = toBoundedInt(raw.amount, 1, MAX_AMOUNT);
  const day = toBoundedInt(raw.day, 1, MONTH_DAYS);
  if (id === null || label === '' || amount === null || day === null) return null;
  if (raw.kind !== 'expense' && raw.kind !== 'income' && raw.kind !== 'saving') return null;

  const goalId = raw.kind === 'saving' ? parseId(raw.goalId) : null;
  if (raw.kind === 'saving' && (goalId === null || !goalIds.has(goalId))) return null;

  return {
    id,
    kind: raw.kind,
    label,
    amount,
    category: parseCategory(raw.category),
    day,
    unexpected: raw.kind === 'expense' && raw.unexpected === true,
    goalId,
  };
}

function parseList<T>(raw: unknown, limit: number, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const items: T[] = [];
  for (const item of raw.slice(0, limit)) {
    const parsed = parse(item);
    if (parsed !== null) items.push(parsed);
  }
  return items;
}

/**
 * Rebuilds a trusted state from untrusted data. Anything stored in the browser
 * can be edited by the user or another script, so every field is re-validated
 * and malformed entries are dropped rather than rendered.
 */
export function parseState(raw: unknown): FinanceState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const goals = parseList(raw.goals, MAX_GOALS, parseGoal);
  const goalIds = new Set(goals.map((goal) => goal.id));
  const transactions = parseList(raw.transactions, MAX_TRANSACTIONS, (item) =>
    parseTransaction(item, goalIds),
  );
  const latestActivity = transactions.reduce((latest, t) => Math.max(latest, t.day), 1);
  return {
    version: 1,
    currentDay: Math.max(latestActivity, toBoundedInt(raw.currentDay, 1, MONTH_DAYS) ?? 1),
    transactions,
    scheduled: parseList(raw.scheduled, MAX_SCHEDULED, parseScheduled),
    goals,
  };
}

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(storage: ReadableStorage | null = browserStorage()): FinanceState | null {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    // Refuse oversized payloads before parsing so a bloated entry can't stall startup.
    if (!stored || stored.length > MAX_STORED_CHARACTERS) return null;
    return parseState(JSON.parse(stored));
  } catch {
    return null;
  }
}

/** Returns false when persistence is unavailable (private mode, quota, disabled storage). */
export function saveState(
  state: FinanceState,
  storage: WritableStorage | null = browserStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
