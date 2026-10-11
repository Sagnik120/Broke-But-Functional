import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { computeSnapshot } from '@/engine/ledger';
import { createDemoState, createEmptyState } from '@/engine/seed';
import { compareSnapshots } from '@/engine/simulate';
import { renderApp } from '@/test/utils';
import { ImpactTable } from '@/components/simulator/ImpactTable';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { HealthGauge } from '@/components/charts/HealthGauge';

describe('HealthGauge', () => {
  it.each([
    [92, 'thriving', 'Thriving'],
    [65, 'stable', 'Stable'],
    [45, 'stretched', 'Stretched'],
    [12, 'critical', 'Critical'],
  ] as const)('describes a score of %i as %s', (score, grade, label) => {
    const { container } = render(<HealthGauge score={score} grade={grade} />);
    expect(
      screen.getByRole('img', { name: `Financial health score ${score} out of 100: ${label}` }),
    ).toBeInTheDocument();
    expect(container.querySelector('.gauge')).toHaveAttribute('data-grade', grade);
  });

  it('fills the ring in proportion to the score', () => {
    const { container } = render(<HealthGauge score={50} grade="stretched" />);
    const [filled, total] = (container.querySelector('.gauge__value')?.getAttribute('stroke-dasharray') ?? '')
      .split(' ')
      .map(Number);
    expect((filled ?? 0) / (total ?? 1)).toBeCloseTo(0.5);
  });
});

describe('ForecastChart', () => {
  it('describes a healthy forecast in text', () => {
    const snapshot = computeSnapshot(createDemoState());
    render(
      <ForecastChart points={snapshot.forecast} today={snapshot.day} shortfallDay={snapshot.shortfallDay} />,
    );
    const chart = screen.getByRole('img', { name: /Balance forecast for the 30-day month/ });
    expect(chart).toHaveAccessibleDescription(
      /Balance today, day 6, is ₹9,670\..*Forecast for day 30 is ₹1,753\..*last the month/,
    );
  });

  it('calls out the day money runs out', () => {
    const state = createEmptyState();
    state.transactions.push({
      id: 'x',
      kind: 'expense',
      label: 'Splurge',
      amount: 12_000,
      category: 'fun',
      day: 1,
      unexpected: false,
      goalId: null,
    });
    const snapshot = computeSnapshot(state);
    const { container } = render(
      <ForecastChart points={snapshot.forecast} today={snapshot.day} shortfallDay={snapshot.shortfallDay} />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleDescription(/Money runs out on day 1\./);
    expect(container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('plots one point per day up to today and the rest as projection', () => {
    const state = { ...createEmptyState(), currentDay: 28 };
    const snapshot = computeSnapshot(state);
    const { container } = render(<ForecastChart points={snapshot.forecast} today={28} shortfallDay={null} />);
    const [actual, projected] = Array.from(container.querySelectorAll('polyline'));
    expect(actual?.getAttribute('points')?.split(' ')).toHaveLength(28);
    expect(projected?.getAttribute('points')?.split(' ')).toHaveLength(3);
    expect(container.querySelector('.chart__note')).toHaveAttribute('text-anchor', 'end');
  });
});

describe('ImpactTable', () => {
  it('labels each change as better or worse in text, not only colour', () => {
    const before = computeSnapshot(createDemoState());
    const state = createDemoState();
    state.transactions.push({
      id: 'x',
      kind: 'income',
      label: 'Gig',
      amount: 2000,
      category: 'other',
      day: 6,
      unexpected: false,
      goalId: null,
    });
    render(<ImpactTable rows={compareSnapshots(before, computeSnapshot(state))} />);
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Metric',
      'Now',
      'After',
      'Change',
    ]);
    expect(screen.getByRole('row', { name: /Remaining balance/ })).toHaveTextContent('+₹2,000 · Better');
    expect(screen.getByRole('row', { name: /Savings goals funded/ })).toHaveTextContent('no change');
  });
});

describe('Dashboard', () => {
  it('tells the user whether their pace is under or over the line', () => {
    renderApp();
    expect(screen.getByText(/You spend about ₹200 a day\. Under the line/)).toBeInTheDocument();
  });

  it('warns when the pace is unsustainable', () => {
    const state = createDemoState();
    state.transactions.push({
      id: 'big',
      kind: 'expense',
      label: 'New phone',
      amount: 6000,
      category: 'shopping',
      day: 6,
      unexpected: false,
      goalId: null,
    });
    renderApp(state);
    expect(screen.getByText(/That's over the line\./)).toBeInTheDocument();
    expect(screen.getByText(/High risk/)).toHaveAttribute('data-tone', 'bad');
  });

  it('shows empty states on a fresh month', () => {
    renderApp(createEmptyState());
    expect(screen.getByText('No more scheduled payments this month.')).toBeInTheDocument();
    expect(screen.getByText(/Add a goal in Plans/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing worrying right now/)).toBeInTheDocument();
    expect(screen.getByText('No goals yet')).toBeInTheDocument();
  });
});
