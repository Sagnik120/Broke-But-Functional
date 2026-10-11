import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { prefersMotion } from './useAnimatedNumber';

function stubMotionPreference(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced, media: query }));
}

describe('AnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the value immediately when motion preferences are unknown', () => {
    expect(prefersMotion()).toBe(false);
    const { rerender } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={900} />);
    expect(screen.getByText('₹900')).toBeInTheDocument();
  });

  it('shows the value immediately when the user prefers reduced motion', () => {
    stubMotionPreference(true);
    expect(prefersMotion()).toBe(false);
    const { rerender } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={900} />);
    expect(screen.getByText('₹900')).toBeInTheDocument();
  });

  it('counts from the old value to the new one and lands exactly on it', () => {
    stubMotionPreference(false);
    const { rerender, container } = render(<AnimatedNumber value={100} />);
    expect(container).toHaveTextContent('₹100');

    rerender(<AnimatedNumber value={900} />);
    expect(container).toHaveTextContent('₹100');

    act(() => void vi.advanceTimersByTime(120));
    const midway = Number(container.textContent?.replace(/\D/g, ''));
    expect(midway).toBeGreaterThan(100);
    expect(midway).toBeLessThan(900);

    act(() => void vi.advanceTimersByTime(400));
    expect(container).toHaveTextContent('₹900');
  });

  it('retargets smoothly when the value changes mid-animation', () => {
    stubMotionPreference(false);
    const { rerender, container } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={1000} />);
    act(() => void vi.advanceTimersByTime(100));
    rerender(<AnimatedNumber value={200} />);
    act(() => void vi.advanceTimersByTime(500));
    expect(container).toHaveTextContent('₹200');
  });

  it('supports a custom formatter and cancels cleanly on unmount', () => {
    stubMotionPreference(false);
    const { rerender, unmount, container } = render(
      <AnimatedNumber value={1} format={(value) => `${Math.round(value)} pts`} />,
    );
    expect(container).toHaveTextContent('1 pts');
    rerender(<AnimatedNumber value={50} format={(value) => `${Math.round(value)} pts`} />);
    unmount();
    expect(() => vi.advanceTimersByTime(500)).not.toThrow();
  });
});
