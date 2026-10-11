import { describe, expect, it } from 'vitest';
import { CURVEBALLS, drawCurveball } from './curveballs';
import { formatINR, formatPercent, formatSignedINR, formatSignedNumber } from './format';
import { createId } from './id';
import { computeSnapshot } from './ledger';
import { financeReducer } from './reducer';
import { createDemoState, createEmptyState } from './seed';
import { compareSnapshots, decisionToAction, simulate, type Decision } from './simulate';

const demo = createDemoState();

function impactOf(decision: Decision) {
  const simulation = simulate(demo, decision);
  return { simulation, byKey: Object.fromEntries(simulation.impact.map((row) => [row.key, row])) };
}

describe('simulate', () => {
  it('never changes the real ledger', () => {
    const frozen = JSON.stringify(demo);
    simulate(demo, { type: 'spend', label: 'Sneakers', amount: 3000, category: 'shopping' });
    expect(JSON.stringify(demo)).toBe(frozen);
  });

  it('shows a purchase rippling through balance, allowance, forecast, risk and health', () => {
    const { simulation, byKey } = impactOf({ type: 'spend', label: 'Sneakers', amount: 3000, category: 'shopping' });
    expect(byKey.balance?.delta).toBe(-3000);
    expect(byKey.allowance?.delta).toBeCloseTo(-3000 / 25);
    expect(byKey.forecast?.delta).toBeLessThan(-3000);
    expect(byKey.risk?.effect).toBe('worse');
    expect(byKey.health?.effect).toBe('worse');
    expect(simulation.verdict).toBe('risky');
  });

  it('approves a small affordable purchase', () => {
    const { simulation } = impactOf({ type: 'spend', label: 'Coffee', amount: 60, category: 'food' });
    expect(simulation.verdict).toBe('safe');
    expect(simulation.summary).toContain('afford');
  });

  it('blocks a purchase that would overdraw the balance', () => {
    const { simulation } = impactOf({ type: 'spend', label: 'Phone', amount: 20_000, category: 'shopping' });
    expect(simulation.verdict).toBe('risky');
    expect(simulation.summary).toContain('overdraw');
  });

  it('treats an unexpected expense as a one-off that leaves the burn rate alone', () => {
    const { simulation } = impactOf({ type: 'unexpected', label: 'Cracked screen', amount: 1800 });
    expect(simulation.after.burnRate).toBe(simulation.before.burnRate);
    expect(simulation.after.unexpectedTotal).toBe(1800);
    expect(simulation.after.balance).toBe(simulation.before.balance - 1800);
  });

  it('shows extra income improving the outlook', () => {
    const { simulation, byKey } = impactOf({ type: 'income', label: 'Tutoring', amount: 2000 });
    expect(byKey.balance?.effect).toBe('better');
    expect(byKey.allowance?.effect).toBe('better');
    expect(simulation.verdict).toBe('safe');
  });

  it('reserves a new subscription from the allowance without touching the balance yet', () => {
    const { byKey } = impactOf({ type: 'subscribe', label: 'Gym', amount: 800, dueDay: 25 });
    expect(byKey.balance?.delta).toBe(0);
    expect(byKey.balance?.effect).toBe('same');
    expect(byKey.allowance?.delta).toBeCloseTo(-800 / 25);
    expect(byKey.forecast?.delta).toBe(-800);
  });

  it('frees money when an upcoming subscription is cancelled', () => {
    const { byKey } = impactOf({ type: 'cancel', scheduledId: 'demo-s5' });
    expect(byKey.forecast?.delta).toBe(199);
    expect(byKey.allowance?.effect).toBe('better');
  });

  it('moves money to a goal: balance drops while goal progress rises', () => {
    const { simulation, byKey } = impactOf({ type: 'save', goalId: 'demo-g2', amount: 1000 });
    expect(byKey.balance?.delta).toBe(-1000);
    expect(byKey.goals?.effect).toBe('better');
    expect(simulation.after.goals.find((goal) => goal.id === 'demo-g2')?.saved).toBe(1000);
  });

  it('labels savings with a fallback when the goal is unknown', () => {
    const action = decisionToAction({ type: 'save', goalId: 'nope', amount: 10 }, demo, 'x');
    expect(action).toMatchObject({ transaction: { label: 'Savings', kind: 'saving' } });
  });

  it('applying the generated action matches the simulated outcome', () => {
    const decision: Decision = { type: 'spend', label: 'Books', amount: 700, category: 'other' };
    const applied = financeReducer(demo, decisionToAction(decision, demo, 'real-id'));
    expect(computeSnapshot(applied).balance).toBe(simulate(demo, decision).after.balance);
  });

  it('reports no change when snapshots are identical', () => {
    const snapshot = computeSnapshot(createEmptyState());
    expect(compareSnapshots(snapshot, snapshot).every((row) => row.effect === 'same')).toBe(true);
  });
});

describe('curveballs', () => {
  it('draws deterministically from the injected random source', () => {
    expect(drawCurveball(() => 0)).toBe(CURVEBALLS[0]);
    expect(drawCurveball(() => 0.999999)).toBe(CURVEBALLS[CURVEBALLS.length - 1]);
    expect(drawCurveball(() => 1)).toBe(CURVEBALLS[CURVEBALLS.length - 1]);
  });

  it('draws a valid curveball with the secure default source', () => {
    expect(CURVEBALLS).toContain(drawCurveball());
  });
});

describe('formatting and ids', () => {
  it('formats rupees in the Indian numbering system', () => {
    expect(formatINR(123456)).toBe('₹1,23,456');
    expect(formatINR(-0.2)).toBe('₹0');
  });

  it('formats signed changes', () => {
    expect(formatSignedINR(250)).toBe('+₹250');
    expect(formatSignedINR(-250)).toBe('−₹250');
    expect(formatSignedINR(0.2)).toBe('no change');
    expect(formatSignedNumber(4, ' pts')).toBe('+4 pts');
    expect(formatSignedNumber(-4)).toBe('−4');
    expect(formatSignedNumber(0)).toBe('no change');
    expect(formatPercent(0.256)).toBe('26%');
  });

  it('creates unique storage-safe ids', () => {
    const ids = new Set(Array.from({ length: 50 }, createId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[\w-]{1,64}$/);
  });
});
