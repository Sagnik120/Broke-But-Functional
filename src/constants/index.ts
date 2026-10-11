import type { Category, HealthGrade, RiskLevel } from '@/types/finance';

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

export const THEME_STORAGE_KEY = 'broke-but-functional:theme';

/** Viewport at which the bottom tab bar becomes a sidebar. Mirrors the CSS breakpoint. */
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

/** A one-line mood for each health grade, in the product's voice. */
export const HEALTH_VIBES: Record<HealthGrade, string> = {
  thriving: 'Main character energy.',
  stable: 'Holding it together.',
  stretched: 'Ramen week incoming.',
  critical: 'SOS mode. Time for a rescue plan.',
};

export const VERDICT_TITLES = {
  safe: 'Go for it',
  caution: 'Think twice',
  risky: 'Not a good idea',
} as const;

export const VERDICT_STAMPS = {
  safe: 'Approved',
  caution: 'Careful',
  risky: 'Denied',
} as const;

/** Everyday spend per day that would exactly use up the budget over the month. */
export const BASELINE_DAILY_SPEND = MONTHLY_BUDGET / MONTH_DAYS;
