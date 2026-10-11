import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { STORAGE_KEY } from '@/constants';
import { createEmptyState } from '@/engine/seed';
import { findA11yViolations, openTab, renderApp } from '@/test/utils';

const masthead = () => screen.getByRole('banner');

describe('App shell', () => {
  it('opens on the demo month with connected headline numbers', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: 'Broke But Functional' })).toBeInTheDocument();
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();
    expect(screen.getByText('₹262')).toBeInTheDocument();
    expect(screen.getByText(/Low risk/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Financial health score 82 out of 100: Thriving/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Balance forecast/ })).toBeInTheDocument();
  });

  it('exposes a skip link and labelled landmarks', () => {
    renderApp();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Overview');
    // The panel itself is a tab stop, so keyboard users can reach non-interactive content.
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
  });

  it('supports keyboard navigation across tabs with arrows, Home and End', async () => {
    const { user } = renderApp();
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();

    await user.keyboard('{ArrowRight}');
    const simulate = screen.getByRole('tab', { name: 'What if?' });
    expect(simulate).toHaveFocus();
    expect(simulate).toHaveAttribute('aria-selected', 'true');
    expect(overview).toHaveAttribute('tabindex', '-1');
    expect(await screen.findByRole('heading', { name: 'What if I…' })).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Plans' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(overview).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Plans' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(overview).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps from the dashboard to the simulator', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Test a decision first' }));
    expect(await screen.findByRole('heading', { name: 'What if I…' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'What if?' })).toHaveFocus();
  });

  it('advances the day, charging payments that fall due', async () => {
    const { user } = renderApp();
    const next = screen.getByRole('button', { name: 'Advance to the next day' });
    for (let day = 7; day <= 10; day += 1) await user.click(next);

    expect(within(masthead()).getByText('Day 10/30')).toBeInTheDocument();
    // Hostel mess fee (₹2,500) is charged on day 10.
    expect(within(masthead()).getByText('₹7,170 left')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Now on day 10 of 30.');
  });

  it('cannot rewind before recorded activity', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'Go back one day' })).toBeDisabled();
  });

  it('resets to a fresh month only after confirmation', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Start a fresh month' }));
    await user.click(screen.getByRole('button', { name: 'Keep my data' }));
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start a fresh month' }));
    await user.click(screen.getByRole('button', { name: 'Yes, wipe and start at ₹10,000' }));
    expect(within(masthead()).getByText('₹10,000 left')).toBeInTheDocument();
    expect(screen.getByText('No more scheduled payments this month.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Load the demo month' }));
    await user.click(screen.getByRole('button', { name: 'Yes, replace with demo data' }));
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();
  });

  it('persists changes and restores them on the next visit', async () => {
    const { user, unmount } = renderApp(createEmptyState());
    await user.click(screen.getByRole('button', { name: 'Advance to the next day' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ currentDay: 2 });

    unmount();
    render(<App />);
    expect(within(masthead()).getByText('Day 2/30')).toBeInTheDocument();
  });

  it('falls back to the demo month when stored data is corrupt', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"version":1,"currentDay":"<script>"');
    render(<App />);
    expect(within(masthead()).getByText('₹9,670 left')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations on any view', async () => {
    const { user } = renderApp();
    expect(await findA11yViolations(document.body)).toEqual([]);

    await openTab(user, 'What if?', 'What if I…');
    expect(await findA11yViolations(document.body)).toEqual([]);

    await openTab(user, 'Activity', 'Log money in or out');
    expect(await findA11yViolations(document.body)).toEqual([]);

    await openTab(user, 'Plans', 'Subscriptions and commitments');
    expect(await findA11yViolations(document.body)).toEqual([]);
  });
});
