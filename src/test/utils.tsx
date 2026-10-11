import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import App from '../App';
import type { FinanceState } from '../domain/types';

export function renderApp(initialState?: FinanceState) {
  const user = userEvent.setup();
  const view = render(<App initialState={initialState} />);
  return { user, ...view };
}

/** Opens a tab and waits for its lazily loaded panel to render the given heading. */
export async function openTab(user: ReturnType<typeof userEvent.setup>, tab: string, heading: string) {
  await user.click(screen.getByRole('tab', { name: tab }));
  await screen.findByRole('heading', { name: heading });
}

/** Runs axe against the rendered document; colour contrast needs a real layout engine. */
export async function findA11yViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}
