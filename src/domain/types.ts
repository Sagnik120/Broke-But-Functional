export const CATEGORIES = ['food', 'transport', 'fun', 'shopping', 'bills', 'health', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export type TransactionKind = 'expense' | 'income' | 'saving';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  label: string;
  /** Whole rupees, always positive. */
  amount: number;
  category: Category;
  /** Day of the month (1–30) the money moved. */
  day: number;
  /** One-off shocks are tracked separately so they don't distort the daily burn rate. */
  unexpected: boolean;
  /** Set only for `saving` transactions. */
  goalId: string | null;
}

export type ScheduledKind = 'commitment' | 'subscription';

export interface ScheduledPayment {
  id: string;
  kind: ScheduledKind;
  label: string;
  amount: number;
  dueDay: number;
  /** Day the user cancelled it, or null while active. */
  cancelledDay: number | null;
}

export interface Goal {
  id: string;
  label: string;
  target: number;
}

export interface FinanceState {
  version: 1;
  currentDay: number;
  transactions: Transaction[];
  scheduled: ScheduledPayment[];
  goals: Goal[];
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type HealthGrade = 'thriving' | 'stable' | 'stretched' | 'critical';

export interface ForecastPoint {
  day: number;
  balance: number;
  projected: boolean;
}

export interface GoalStatus extends Goal {
  saved: number;
  remaining: number;
  /** 0–1 */
  progress: number;
}

export interface Snapshot {
  day: number;
  daysLeft: number;
  income: number;
  spent: number;
  unexpectedTotal: number;
  scheduledPaid: number;
  saved: number;
  balance: number;
  /** Scheduled payments still to come this month. */
  upcoming: number;
  /** Balance minus everything already promised. */
  safeToSpend: number;
  dailyAllowance: number;
  /** Average everyday (non-shock) spend per day so far. */
  burnRate: number;
  projectedEnd: number;
  /** First day the balance is forecast to drop below zero, if any. */
  shortfallDay: number | null;
  goals: GoalStatus[];
  goalsTarget: number;
  goalsRemaining: number;
  /** 0–1 */
  goalProgress: number;
  risk: { score: number; level: RiskLevel; reasons: string[] };
  health: { score: number; grade: HealthGrade };
  forecast: ForecastPoint[];
}
