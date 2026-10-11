import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineNotice } from '@/components/layout/OfflineNotice';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { THEME_STORAGE_KEY } from '@/constants';
import { ThemeProvider } from '@/context/ThemeProvider';
import { findA11yViolations, renderApp } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('switches theme, reflects it in aria-pressed and remembers the choice', async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole('button', { name: 'Dark mode' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.keyboard('{Enter}');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('restores a saved choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderToggle();
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('follows the system colour scheme until the user chooses', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

describe('OfflineNotice', () => {
  it('appears only while offline', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineNotice />);
    expect(screen.queryByText(/Offline/)).not.toBeInTheDocument();

    onLine.mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(screen.getByText('Offline. Changes are saved on this device.')).toBeInTheDocument();
  });
});

describe('AppShell', () => {
  it('exposes one primary navigation landmark containing the view tabs', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(
      within(nav)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Overview', 'What if?', 'Activity', 'Plans']);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  it('opens the view named in the URL and titles the tab after it', async () => {
    window.history.replaceState(null, '', '#/plans');
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Subscriptions and commitments' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Plans' })).toHaveAttribute('aria-selected', 'true');
    expect(document.title).toBe('Plans · Broke But Functional');
  });

  it('gives every view its own URL and follows the back button', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(window.location.hash).toBe('#/activity');
    expect(await screen.findByRole('heading', { name: 'Log money in or out' })).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, '', '#/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('stays accessible in the dark theme', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(await findA11yViolations(document.body)).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  });
});
