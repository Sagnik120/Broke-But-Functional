import { MONTHLY_BUDGET, MONTH_DAYS } from './constants';
import { formatINR } from './format';
import { clamp } from './sanitize';
import type {
  FinanceState,
  ForecastPoint,
  GoalStatus,
  HealthGrade,
  RiskLevel,
  ScheduledPayment,
  Snapshot,
  Transaction,
} from './types';

/** A payment is charged once its due day arrives, unless it was cancelled before then. */
export function isCharged(payment: ScheduledPayment, day: number): boolean {
  if (payment.dueDay > day) return false;
  return payment.cancelledDay === null || payment.cancelledDay >= payment.dueDay;
}

export function isUpcoming(payment: ScheduledPayment, day: number): boolean {
  return payment.dueDay > day && payment.cancelledDay === null;
}

export type ScheduledStatus = 'paid' | 'upcoming' | 'cancelled';

export function scheduledStatus(payment: ScheduledPayment, day: number): ScheduledStatus {
  if (isCharged(payment, day)) return 'paid';
  return payment.cancelledDay === null ? 'upcoming' : 'cancelled';
}

function signedAmount(transaction: Transaction): number {
  return transaction.kind === 'income' ? transaction.amount : -transaction.amount;
}

/** Earliest day the calendar can show: you can't rewind past recorded activity. */
export function earliestDay(state: FinanceState): number {
  return state.transactions.reduce((latest, t) => Math.max(latest, t.day), 1);
}

function buildGoalStatuses(state: FinanceState): GoalStatus[] {
  const savedByGoal = new Map<string, number>();
  for (const t of state.transactions) {
    if (t.kind === 'saving' && t.goalId !== null) {
      savedByGoal.set(t.goalId, (savedByGoal.get(t.goalId) ?? 0) + t.amount);
    }
  }
  return state.goals.map((goal) => {
    const saved = Math.min(goal.target, savedByGoal.get(goal.id) ?? 0);
    return {
      ...goal,
      saved,
      remaining: goal.target - saved,
      progress: goal.target > 0 ? saved / goal.target : 0,
    };
  });
}

function buildForecast(state: FinanceState, burnRate: number): ForecastPoint[] {
  const day = state.currentDay;
  const netByDay = new Array<number>(MONTH_DAYS + 1).fill(0);
  for (const t of state.transactions) {
    const index = clamp(t.day, 1, MONTH_DAYS);
    netByDay[index] = (netByDay[index] ?? 0) + signedAmount(t);
  }
  const dueByDay = new Array<number>(MONTH_DAYS + 1).fill(0);
  for (const payment of state.scheduled) {
    if (isCharged(payment, day) || isUpcoming(payment, day)) {
      dueByDay[payment.dueDay] = (dueByDay[payment.dueDay] ?? 0) + payment.amount;
    }
  }

  const points: ForecastPoint[] = [];
  let balance = MONTHLY_BUDGET;
  for (let d = 1; d <= MONTH_DAYS; d += 1) {
    const projected = d > day;
    balance += (netByDay[d] ?? 0) - (dueByDay[d] ?? 0) - (projected ? burnRate : 0);
    points.push({ day: d, balance, projected });
  }
  return points;
}

interface RiskInputs {
  income: number;
  balance: number;
  upcoming: number;
  burnRate: number;
  dailyAllowance: number;
  projectedEnd: number;
  shortfallDay: number | null;
  goalsRemaining: number;
  unexpectedTotal: number;
}

export function assessRisk(inputs: RiskInputs): Snapshot['risk'] {
  const reasons: string[] = [];
  let score = 0;

  // Pace: how fast you're spending compared with what the rest of the month can afford.
  const paceRatio =
    inputs.dailyAllowance > 0 ? inputs.burnRate / inputs.dailyAllowance : inputs.burnRate > 0 ? 2 : 0;
  const paceRisk = clamp((paceRatio - 0.8) / 0.7, 0, 1) * 35;
  if (paceRisk > 0) {
    score += paceRisk;
    reasons.push(
      `You spend about ${formatINR(inputs.burnRate)} a day but can only afford ${formatINR(inputs.dailyAllowance)}.`,
    );
  }

  // Shortfall: running out before day 30, or ending with a paper-thin cushion.
  if (inputs.projectedEnd < 0) {
    score += 40;
    reasons.push(
      inputs.shortfallDay === null
        ? `You're on track to end the month ${formatINR(-inputs.projectedEnd)} short.`
        : `At this pace your money runs out on day ${inputs.shortfallDay}.`,
    );
  } else {
    const cushionTarget = inputs.income * 0.1;
    const cushionRisk = clamp(1 - inputs.projectedEnd / cushionTarget, 0, 1) * 10;
    if (cushionRisk > 0) {
      score += cushionRisk;
      reasons.push(`Your month-end cushion is only ${formatINR(inputs.projectedEnd)}.`);
    }
  }

  // Coverage: can today's balance pay for what's already promised?
  if (inputs.balance < 0 || inputs.balance < inputs.upcoming) {
    score += 20;
    reasons.push(
      inputs.balance < 0
        ? `Your balance is ${formatINR(-inputs.balance)} overdrawn.`
        : `Upcoming payments (${formatINR(inputs.upcoming)}) are more than your balance.`,
    );
  }

  if (inputs.goalsRemaining > Math.max(0, inputs.projectedEnd)) {
    score += 10;
    reasons.push(
      `Your forecast leaves ${formatINR(inputs.goalsRemaining - Math.max(0, inputs.projectedEnd))} of savings goals unfunded.`,
    );
  }

  const shockRisk = clamp(inputs.unexpectedTotal / (inputs.income * 0.15), 0, 1) * 5;
  if (shockRisk > 0) {
    score += shockRisk;
    reasons.push(`Unexpected expenses have cost you ${formatINR(inputs.unexpectedTotal)} this month.`);
  }

  const rounded = Math.round(clamp(score, 0, 100));
  return { score: rounded, level: riskLevel(rounded), reasons };
}

export function riskLevel(score: number): RiskLevel {
  if (score < 34) return 'low';
  if (score < 67) return 'medium';
  return 'high';
}

export function healthGrade(score: number): HealthGrade {
  if (score >= 80) return 'thriving';
  if (score >= 60) return 'stable';
  if (score >= 40) return 'stretched';
  return 'critical';
}

/**
 * Derives every number the UI shows from the raw ledger. Because the whole
 * picture is recomputed from one state object, every decision is reflected in
 * balance, allowance, forecast, goals, risk and health at the same time.
 */
export function computeSnapshot(state: FinanceState): Snapshot {
  const day = state.currentDay;
  const daysLeft = MONTH_DAYS - day + 1;

  let extraIncome = 0;
  let spent = 0;
  let everydaySpend = 0;
  let unexpectedTotal = 0;
  for (const t of state.transactions) {
    if (t.kind === 'income') extraIncome += t.amount;
    if (t.kind === 'expense') {
      spent += t.amount;
      if (t.unexpected) unexpectedTotal += t.amount;
      else everydaySpend += t.amount;
    }
  }

  let scheduledPaid = 0;
  let upcoming = 0;
  for (const payment of state.scheduled) {
    if (isCharged(payment, day)) scheduledPaid += payment.amount;
    else if (isUpcoming(payment, day)) upcoming += payment.amount;
  }

  const goals = buildGoalStatuses(state);
  const saved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const goalsTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const goalsRemaining = goalsTarget - saved;

  const income = MONTHLY_BUDGET + extraIncome;
  const balance = income - spent - saved - scheduledPaid;
  const safeToSpend = balance - upcoming;
  const dailyAllowance = Math.max(0, safeToSpend / daysLeft);
  const burnRate = everydaySpend / day;

  const forecast = buildForecast(state, burnRate);
  const projectedEnd = forecast[forecast.length - 1]?.balance ?? balance;
  const shortfallDay = forecast.find((point) => point.day >= day && point.balance < 0)?.day ?? null;

  const risk = assessRisk({
    income,
    balance,
    upcoming,
    burnRate,
    dailyAllowance,
    projectedEnd,
    shortfallDay,
    goalsRemaining,
    unexpectedTotal,
  });

  const goalProgress = goalsTarget > 0 ? saved / goalsTarget : 0;
  const healthScore = Math.round(clamp((100 - risk.score) * 0.9 + goalProgress * 10, 0, 100));

  return {
    day,
    daysLeft,
    income,
    spent,
    unexpectedTotal,
    scheduledPaid,
    saved,
    balance,
    upcoming,
    safeToSpend,
    dailyAllowance,
    burnRate,
    projectedEnd,
    shortfallDay,
    goals,
    goalsTarget,
    goalsRemaining,
    goalProgress,
    risk,
    health: { score: healthScore, grade: healthGrade(healthScore) },
    forecast,
  };
}
