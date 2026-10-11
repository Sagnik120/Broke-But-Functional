import type { Category, HealthGrade, RiskLevel } from './types';

export const MONTHLY_BUDGET = 10_000;
export const MONTH_DAYS = 30;

export const MAX_AMOUNT = 100_000;
export const MAX_LABEL_LENGTH = 40;
export const MAX_TRANSACTIONS = 500;
export const MAX_SCHEDULED = 50;
export const MAX_GOALS = 20;

/** Stored payloads larger than this are ignored rather than parsed. */
export const MAX_STORED_CHARACTERS = 200_000;

/** Ledger changes allowed per window before the UI asks the user to slow down. */
export const ACTION_RATE_LIMIT = { limit: 30, windowMs: 10_000 } as const;

export const STORAGE_KEY = 'broke-but-functional:v1';

export const CATEGORY_LABELS: Record<Category, string> = {
  food: 'Food',
  transport: 'Transport',
  fun: 'Fun',
  shopping: 'Shopping',
  bills: 'Bills',
  health: 'Health',
  other: 'Other',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

export const HEALTH_LABELS: Record<HealthGrade, string> = {
  thriving: 'Thriving',
  stable: 'Stable',
  stretched: 'Stretched',
  critical: 'Critical',
};
