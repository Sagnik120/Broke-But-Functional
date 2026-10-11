import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDemoState, createEmptyState } from '../domain/seed';
import { FinanceProvider } from '../state/FinanceProvider';
import { useFinance } from '../state/useFinance';
import { findA11yViolations, openTab, renderApp } from '../test/utils';
import { ErrorBoundary } from './ErrorBoundary';
import Simulator from './simulator/Simulator';

const masthead = () => screen.getByRole('banner');

describe('Activity view', () => {
  it('logs an expense and updates the balance everywhere', async () => {
    const { user } = renderApp();
    await openTab(user, 'Activity', 'Log money in or out');

    await user.type(screen.getByLabelText('Description'), 'Pizza night');
    await user.type(screen.getByLabelText('Amount in rupees'), '500');
    await user.selectOptions(screen.getByLabelText('Category'), 'fun');
    await user.click(screen.getByRole('button', { name: 'Add to day 6' }));

    expect(screen.getByText('Pizza night')).toBeInTheDocument();
    expect(within(masthead()).getByText('₹9,170 left')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Expense added: Pizza night, ₹500.');
  });

  it('logs income and unexpected expenses', async () => {
    const { user } = renderApp(createEmptyState());
    await openTab(user, 'Activity', 'Log money in or out');
    expect(screen.getByText(/Nothing logged yet/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Type'), 'income');
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Description'), 'Tutoring');
    await user.type(screen.getByLabelText('Amount in rupees'), '1,000');
    await user.click(screen.getByRole('button', { name: 'Add to day 1' }));
    expect(within(masthead()).getByText('₹11,000 left')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Type'), 'expense');
    await user.type(screen.getByLabelText('Description'), 'Flat tyre');
    await user.type(screen.getByLabelText('Amount in rupees'), '400');
    await user.click(screen.getByLabelText('This was unexpected'));
    await user.click(screen.getByRole('button', { name: 'Add to day 1' }));
    expect(screen.getByText('Day 1 · Unexpected')).toBeInTheDocument();
    expect(screen.getByText('Day 1 · Income')).toBeInTheDocument();
  });

  it('shows accessible validation errors and blocks bad input', async () => {
    const { user } = renderApp();
    await openTab(user, 'Activity', 'Log money in or out');
    await user.click(screen.getByRole('button', { name: 'Add to day 6' }));

    const description = screen.getByLabelText('Description');
    expect(description).toBeInvalid();
    expect(description).toHaveAccessibleDescription('Description is required.');
    expect(screen.getByLabelText('Amount in rupees')).toHaveAccessibleDescription('Enter an amount.');

    await user.type(description, 'Hack');
    await user.type(screen.getByLabelText('Amount in rupees'), '-99.5');
    await user.click(screen.getByRole('button', { name: 'Add to day 6' }));
    expect(screen.getByText('Use whole rupees only, like 450.')).toBeInTheDocument();
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();
  });

  it('renders hostile input as inert text', async () => {
    const { user, container } = renderApp();
    await openTab(user, 'Activity', 'Log money in or out');
    await user.type(screen.getByLabelText('Description'), '<img src=x onerror=alert(1)>');
    await user.type(screen.getByLabelText('Amount in rupees'), '10');
    await user.click(screen.getByRole('button', { name: 'Add to day 6' }));

    expect(screen.getByText('img src=x onerror=alert(1)')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('removes a transaction and restores the balance', async () => {
    const { user } = renderApp();
    await openTab(user, 'Activity', 'Log money in or out');
    await user.click(screen.getByRole('button', { name: 'Remove Movie night' }));
    expect(screen.queryByText('Movie night')).not.toBeInTheDocument();
    expect(within(masthead()).getByText('₹9,970 left')).toBeInTheDocument();
  });
});

describe('Simulator view', () => {
  it('previews a decision without changing real money, then applies it', async () => {
    const { user } = renderApp();
    await openTab(user, 'What if?', 'What if I…');
    expect(screen.getByText(/Fill in the decision/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Description'), 'Sneakers');
    await user.type(screen.getByLabelText('Amount in rupees'), '3000');

    expect(screen.getByText('Not a good idea')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'How this decision changes your month' });
    const balanceRow = within(table).getByRole('row', { name: /Remaining balance/ });
    expect(balanceRow).toHaveTextContent('₹9,670');
    expect(balanceRow).toHaveTextContent('₹6,670');
    expect(balanceRow).toHaveTextContent('−₹3,000 · Worse');
    for (const metric of ['Daily allowance', 'Month-end forecast', 'Savings goals funded', 'Financial risk', 'Financial health']) {
      expect(within(table).getByRole('row', { name: new RegExp(metric) })).toBeInTheDocument();
    }
    // Still a preview: the real balance is untouched.
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));
    expect(within(masthead()).getByText('₹6,670 left')).toBeInTheDocument();
    expect(screen.getByText(/Your dashboard is updated\./)).toHaveTextContent('Decision applied: buy something.');
  });

  it('validates before applying', async () => {
    const { user } = renderApp();
    await openTab(user, 'What if?', 'What if I…');
    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter an amount.')).toBeInTheDocument();
  });

  it('simulates starting and cancelling a subscription', async () => {
    const { user } = renderApp();
    await openTab(user, 'What if?', 'What if I…');

    await user.selectOptions(screen.getByLabelText('Decision'), 'subscribe');
    await user.type(screen.getByLabelText('Description'), 'Gym');
    await user.type(screen.getByLabelText('Amount in rupees'), '800');
    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));
    expect(screen.getByText('Enter a day between 1 and 30.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Billing day'), '25');
    expect(screen.getByRole('row', { name: /Month-end forecast/ })).toHaveTextContent('−₹800');

    await user.selectOptions(screen.getByLabelText('Decision'), 'cancel');
    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));
    expect(screen.getByText('Choose a subscription to cancel.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Subscription'), 'demo-s5');
    expect(screen.getByRole('row', { name: /Month-end forecast/ })).toHaveTextContent('+₹199 · Better');
    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));

    await openTab(user, 'Plans', 'Subscriptions and commitments');
    expect(screen.getByRole('button', { name: 'Resume Video streaming' })).toBeInTheDocument();
  });

  it('simulates saving towards a goal and extra income', async () => {
    const { user } = renderApp();
    await openTab(user, 'What if?', 'What if I…');

    await user.selectOptions(screen.getByLabelText('Decision'), 'save');
    await user.type(screen.getByLabelText('Amount in rupees'), '99999');
    await user.click(screen.getByRole('button', { name: 'Apply this decision' }));
    expect(screen.getByText('Choose a goal to save towards.')).toBeInTheDocument();
    expect(screen.getByText('You only have ₹9,670 to move.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Goal'), 'demo-g2');
    await user.clear(screen.getByLabelText('Amount in rupees'));
    await user.type(screen.getByLabelText('Amount in rupees'), '1000');
    expect(screen.getByRole('row', { name: /Savings goals funded/ })).toHaveTextContent('Better');

    await user.selectOptions(screen.getByLabelText('Decision'), 'income');
    await user.type(screen.getByLabelText('Description'), 'Tutoring');
    expect(screen.getByText('Go for it')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Remaining balance/ })).toHaveTextContent('+₹1,000 · Better');
  });

  it('throws a curveball as an unexpected expense to review', async () => {
    const user = userEvent.setup();
    render(
      <FinanceProvider initialState={createDemoState()}>
        <Simulator random={() => 0} />
      </FinanceProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Throw me a curveball/ }));

    expect(screen.getByLabelText('Decision')).toHaveValue('unexpected');
    expect(screen.getByLabelText('Description')).toHaveValue('Cracked phone screen');
    expect(screen.getByLabelText('Amount in rupees')).toHaveValue('1800');
    expect(screen.getByRole('row', { name: /Remaining balance/ })).toHaveTextContent('−₹1,800');
    expect(screen.getByRole('heading', { name: 'Watch out for' })).toBeInTheDocument();
  });

  it('explains when there is nothing to cancel or save towards', async () => {
    const { user } = renderApp(createEmptyState());
    await openTab(user, 'What if?', 'What if I…');
    await user.selectOptions(screen.getByLabelText('Decision'), 'cancel');
    expect(screen.getByLabelText('Subscription')).toHaveAccessibleDescription('You have no active subscriptions.');
    await user.selectOptions(screen.getByLabelText('Decision'), 'save');
    expect(screen.getByLabelText('Goal')).toHaveAccessibleDescription('Create a goal in Plans first.');
  });
});

describe('Plans view', () => {
  it('creates a goal and funds it from the balance', async () => {
    const { user } = renderApp(createEmptyState());
    await openTab(user, 'Plans', 'Subscriptions and commitments');

    await user.click(screen.getByRole('button', { name: 'Add goal' }));
    expect(screen.getByText('Goal name is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Goal name'), 'Goa trip');
    await user.type(screen.getByLabelText('Target in rupees'), '3000');
    await user.click(screen.getByRole('button', { name: 'Add goal' }));
    expect(screen.getByRole('heading', { name: 'Goa trip' })).toBeInTheDocument();

    const add = screen.getByLabelText('Add to Goa trip');
    await user.type(add, '20000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('You only have ₹10,000 to move.')).toBeInTheDocument();

    await user.clear(add);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter an amount.')).toBeInTheDocument();

    await user.type(add, '1200');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(within(masthead()).getByText('₹8,800 left')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Goa trip progress' })).toHaveValue(40);

    // Over-contributing only takes what the goal still needs.
    await user.type(screen.getByLabelText('Add to Goa trip'), '5000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/Fully funded/)).toBeInTheDocument();
    expect(within(masthead()).getByText('₹7,000 left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove goal Goa trip' }));
    expect(within(masthead()).getByText('₹10,000 left')).toBeInTheDocument();
  });

  it('schedules, cancels, resumes and removes payments', async () => {
    const { user } = renderApp();
    await openTab(user, 'Plans', 'Subscriptions and commitments');

    await user.click(screen.getByRole('button', { name: 'Add payment' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a day between 1 and 30.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Kind'), 'commitment');
    await user.type(screen.getByLabelText('Name'), 'Library fine');
    await user.type(screen.getByLabelText('Amount in rupees'), '250');
    await user.type(screen.getByLabelText('Due day'), '3');
    await user.click(screen.getByRole('button', { name: 'Add payment' }));
    // Due day 3 is already in the past on day 6, so it is charged straight away.
    expect(within(masthead()).getByText('₹9,420 left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Library fine' }));
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel Music streaming' }));
    expect(screen.getByRole('status')).toHaveTextContent('Music streaming cancelled. ₹119 freed up.');
    await user.click(screen.getByRole('button', { name: 'Resume Music streaming' }));
    expect(screen.getByRole('button', { name: 'Cancel Music streaming' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel Cloud storage' }));
    expect(screen.getByRole('status')).toHaveTextContent("This month's charge was already paid.");
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();
  });
});

describe('resilience', () => {
  it('requires the provider for useFinance', () => {
    function Orphan() {
      useFinance();
      return null;
    }
    // React logs the caught error; silence it so the test output stays readable.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Orphan />
      </ErrorBoundary>,
    );
    consoleError.mockRestore();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('keeps the high-risk dashboard accessible', async () => {
    const state = createDemoState();
    state.transactions.push({
      id: 'big',
      kind: 'expense',
      label: 'New phone',
      amount: 9000,
      category: 'shopping',
      day: 6,
      unexpected: false,
      goalId: null,
    });
    renderApp(state);
    expect(screen.getByText(/High risk/)).toBeInTheDocument();
    expect(screen.getAllByText(/runs out on day/).length).toBeGreaterThan(0);
    expect(await findA11yViolations(document.body)).toEqual([]);
  });
});
