import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { findA11yViolations } from '@/test/utils';
import { Badge } from '@/components/ui/Badge';
import { BrandMark } from '@/components/ui/BrandMark';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { AmountField, Field, SelectField } from '@/components/ui/Field';
import { PanelSkeleton } from '@/components/ui/PanelSkeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs } from '@/components/ui/Tabs';

describe('Field', () => {
  it('links its label, hint and error to the input', () => {
    render(<Field label="Name" hint="Up to 40 characters." error="Name is required." defaultValue="" />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Up to 40 characters. Name is required.');
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');
  });

  it('is valid and undescribed when there is nothing to say', () => {
    render(<Field label="Name" defaultValue="Rent" />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives amount fields a numeric keyboard', () => {
    render(<AmountField label="Amount" defaultValue="" />);
    expect(screen.getByLabelText('Amount')).toHaveAttribute('inputmode', 'numeric');
  });

  it('labels selects and reports their errors', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectField label="Kind" error="Pick one." defaultValue="" onChange={onChange}>
        <option value="">Choose</option>
        <option value="a">A</option>
      </SelectField>,
    );
    const select = screen.getByLabelText('Kind');
    expect(select).toHaveAccessibleDescription('Pick one.');
    await user.selectOptions(select, 'a');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('ProgressBar', () => {
  it('exposes a labelled percentage', () => {
    render(<ProgressBar label="Trip progress" value={0.4} />);
    expect(screen.getByRole('progressbar', { name: 'Trip progress' })).toHaveValue(40);
  });

  it('clamps out-of-range values', () => {
    const { rerender } = render(<ProgressBar label="Goal" value={7} />);
    expect(screen.getByRole('progressbar')).toHaveValue(100);
    rerender(<ProgressBar label="Goal" value={-2} />);
    expect(screen.getByRole('progressbar')).toHaveValue(0);
  });
});

describe('Badge and BrandMark', () => {
  it('conveys status in text, with a decorative dot', () => {
    const { container } = render(<Badge tone="bad">High risk · 80/100</Badge>);
    expect(screen.getByText('High risk · 80/100')).toHaveAttribute('data-tone', 'bad');
    expect(container.querySelector('.badge__dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hides the decorative logo from assistive technology', () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('PanelSkeleton', () => {
  it('marks the region busy and names the loading state for screen readers', () => {
    const { container } = render(<PanelSkeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading view…')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});

describe('ConfirmButton', () => {
  it('asks before running a destructive action', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Reset" confirmLabel="Yes, reset" onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Yes, reset' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Keep my data' }));
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  const TABS = [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three' },
  ] as const;

  function Harness() {
    const [active, setActive] = useState<(typeof TABS)[number]['id']>('one');
    return (
      <>
        <Tabs label="Demo" tabs={TABS} active={active} onChange={setActive} />
        <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
          Panel {active}
        </div>
      </>
    );
  }

  it('follows the WAI-ARIA tabs pattern', async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-controls', 'panel-one');
    expect(screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    expect(await findA11yViolations(container)).toEqual([]);
  });

  it('adds Up and Down arrows when the list is vertical', async () => {
    const user = userEvent.setup();
    function Vertical() {
      const [active, setActive] = useState<(typeof TABS)[number]['id']>('one');
      return <Tabs label="Side" tabs={TABS} active={active} onChange={setActive} orientation="vertical" />;
    }
    render(<Vertical />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores Up and Down arrows when the list is horizontal', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders decorative icons without changing the tab name', () => {
    render(
      <Tabs
        label="Icons"
        tabs={[{ id: 'a', label: 'Alpha', icon: <svg data-testid="icon" /> }]}
        active="a"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('moves selection and focus with the keyboard and mouse', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel three');

    await user.keyboard('{Home}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');

    // Unrelated keys are left alone.
    await user.keyboard('a');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'One' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel one');
  });
});
