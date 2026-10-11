import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/ui/EmptyState';
import { createEmptyState } from '@/engine/seed';
import { openTab, renderApp } from '@/test/utils';

describe('Impulse check', () => {
  it('recalculates the month as the slider moves', () => {
    renderApp();
    const slider = screen.getByRole('slider', { name: /If I spend/ });
    expect(slider).toHaveValue('500');
    const card = screen.getByRole('region', { name: 'Impulse check' });
    // ₹500 one-off: (₹6,553 − ₹500) ÷ 25 days.
    expect(within(card).getByText('₹242')).toBeInTheDocument();
    expect(within(card).getByText('Go for it')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '5000' } });
    expect(within(card).getByText('₹62')).toBeInTheDocument();
    expect(within(card).getByText('Not a good idea')).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringContaining('₹5,000.'));
  });

  it('never changes the real balance', () => {
    renderApp();
    fireEvent.change(screen.getByRole('slider', { name: /If I spend/ }), { target: { value: '3000' } });
    expect(within(screen.getByRole('banner')).getByText('₹9,670 left')).toBeInTheDocument();
  });

  it('hands the amount to the simulator', async () => {
    const { user } = renderApp();
    fireEvent.change(screen.getByRole('slider', { name: /If I spend/ }), { target: { value: '1200' } });
    await user.click(screen.getByRole('button', { name: 'Open in simulator' }));

    expect(await screen.findByRole('heading', { name: 'What if I…' })).toBeInTheDocument();
    expect(screen.getByLabelText('Decision')).toHaveValue('unexpected');
    expect(screen.getByLabelText('Amount in rupees')).toHaveValue('1200');
    expect(screen.getByRole('row', { name: /Remaining balance/ })).toHaveTextContent('−₹1,200');
  });
});

describe('Month map', () => {
  it('shows thirty days, marks today and describes each day in words', () => {
    renderApp();
    const card = screen.getByRole('region', { name: 'Month map' });
    const days = within(card).getAllByRole('listitem');
    expect(days).toHaveLength(30);
    expect(days[5]).toHaveAttribute('data-status', 'today');
    expect(days[3]).toHaveAttribute('data-due', 'true');
    expect(within(card).getByText('Day 4, spent ₹120, ₹130 in bills due.')).toBeInTheDocument();
  });
});

describe('Achievements', () => {
  it('counts the badges earned from the ledger', () => {
    renderApp();
    const card = screen.getByRole('region', { name: 'Achievements' });
    expect(within(card).getByText('3 of 6 unlocked this month.')).toBeInTheDocument();
    expect(within(card).getByText('On-pace streak: 5 days').closest('li')).toHaveAttribute(
      'data-earned',
      'true',
    );
    expect(within(card).getByText('Goal crusher').closest('li')).toHaveAttribute('data-earned', 'false');
  });

  it('starts locked on a fresh month', () => {
    renderApp(createEmptyState());
    expect(screen.getByText('0 of 6 unlocked this month.')).toBeInTheDocument();
  });
});

describe('Simulator presets', () => {
  it('fills the form in one tap and previews the result', async () => {
    const { user } = renderApp();
    await openTab(user, 'What if?', 'What if I…');
    const presets = screen.getByRole('group', { name: 'Quick scenarios' });

    await user.click(within(presets).getByRole('button', { name: 'Biryani night ₹350' }));
    expect(screen.getByLabelText('Description')).toHaveValue('Biryani night');
    expect(screen.getByLabelText('Category')).toHaveValue('food');
    expect(screen.getByRole('row', { name: /Remaining balance/ })).toHaveTextContent('−₹350');

    await user.click(within(presets).getByRole('button', { name: 'Gym membership ₹800/mo' }));
    expect(screen.getByLabelText('Decision')).toHaveValue('subscribe');
    expect(screen.getByLabelText('Billing day')).toHaveValue('25');

    await user.click(within(presets).getByRole('button', { name: 'Freelance gig +₹2,000' }));
    expect(screen.getByText('Go for it')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('shows a decorative, lazily loaded illustration with its message', () => {
    const { container } = render(
      <EmptyState>
        <p>Nothing here yet.</p>
      </EmptyState>,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('width', '160');
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });
});
