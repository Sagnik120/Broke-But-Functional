import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { navigateTo, readRoute, useHashRoute } from '@/hooks/useHashRoute';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTheme } from '@/hooks/useTheme';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useHashRoute', () => {
  it('starts on the overview and falls back to it for unknown hashes', () => {
    expect(readRoute()).toBe('overview');
    window.history.replaceState(null, '', '#/does-not-exist');
    expect(readRoute()).toBe('overview');
  });

  it('navigates by pushing history entries, so each view has a URL', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => result.current[1]('plans'));
    expect(result.current[0]).toBe('plans');
    expect(window.location.hash).toBe('#/plans');

    const entries = window.history.length;
    act(() => navigateTo('plans'));
    expect(window.history.length).toBe(entries);

    act(() => navigateTo('overview'));
    expect(window.location.hash).toBe('#/');
    expect(result.current[0]).toBe('overview');
  });

  it('follows the browser back and forward buttons', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      window.history.replaceState(null, '', '#/activity');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current[0]).toBe('activity');
  });
});

describe('useMediaQuery', () => {
  it('is false where matchMedia is unavailable', () => {
    expect(renderHook(() => useMediaQuery('(min-width: 1024px)')).result.current).toBe(false);
  });

  it('reports and tracks the query', () => {
    let listener: (() => void) | undefined;
    const media = {
      matches: true,
      addEventListener: (_: string, next: () => void) => void (listener = next),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => media);
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);

    media.matches = false;
    act(() => listener?.());
    expect(result.current).toBe(false);

    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});

describe('useOnlineStatus', () => {
  it('follows online and offline events', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    onLine.mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
  });
});

describe('useDocumentTitle', () => {
  it('keeps the tab title in step', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'One' },
    });
    expect(document.title).toBe('One');
    rerender({ title: 'Two' });
    expect(document.title).toBe('Two');
  });
});

describe('usePrefetch', () => {
  it('loads lazily after a delay where idle callbacks are unavailable', () => {
    vi.useFakeTimers();
    const loaders = [vi.fn(() => Promise.resolve()), vi.fn(() => Promise.reject(new Error('offline')))];
    renderHook(() => usePrefetch(loaders));
    expect(loaders[0]).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(loaders[0]).toHaveBeenCalledTimes(1);
    expect(loaders[1]).toHaveBeenCalledTimes(1);
  });

  it('cancels when unmounted first', () => {
    vi.useFakeTimers();
    const loaders = [vi.fn(() => Promise.resolve())];
    renderHook(() => usePrefetch(loaders)).unmount();
    vi.advanceTimersByTime(2000);
    expect(loaders[0]).not.toHaveBeenCalled();
  });

  it('uses the idle callback when the browser has one', () => {
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', (run: () => void) => {
      run();
      return 7;
    });
    vi.stubGlobal('cancelIdleCallback', cancel);
    const loaders = [vi.fn(() => Promise.resolve())];
    renderHook(() => usePrefetch(loaders)).unmount();
    expect(loaders[0]).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(7);
  });
});

describe('useTheme', () => {
  it('requires the provider', () => {
    function Orphan() {
      useTheme();
      return null;
    }
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Orphan />)).toThrow('useTheme must be used inside <ThemeProvider>.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
