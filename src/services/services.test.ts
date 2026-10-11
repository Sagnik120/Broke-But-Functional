import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '@/constants';
import { loadThemePreference, saveThemePreference } from '@/services/preferences';
import { registerServiceWorker } from '@/services/serviceWorker';
import { getWebVitals, recordVital, reportWebVitals, WEB_VITAL_EVENT } from '@/services/webVitals';

vi.mock('web-vitals', () => {
  const emit = (name: string) => (report: (metric: unknown) => void) =>
    report({ name, value: 1, rating: 'good' });
  return {
    onCLS: emit('CLS'),
    onFCP: emit('FCP'),
    onINP: emit('INP'),
    onLCP: emit('LCP'),
    onTTFB: emit('TTFB'),
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('theme preference', () => {
  it('round-trips a valid theme', () => {
    expect(loadThemePreference()).toBeNull();
    expect(saveThemePreference('dark')).toBe(true);
    expect(loadThemePreference()).toBe('dark');
  });

  it('ignores values it does not recognise', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, '<script>alert(1)</script>');
    expect(loadThemePreference()).toBeNull();
  });

  it('fails soft when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadThemePreference()).toBeNull();
    expect(saveThemePreference('light')).toBe(false);
  });
});

describe('web vitals', () => {
  it('keeps the latest reading per metric and broadcasts it', () => {
    const heard: unknown[] = [];
    const listener = (event: Event) => heard.push((event as CustomEvent).detail);
    window.addEventListener(WEB_VITAL_EVENT, listener);

    recordVital({ name: 'LCP', value: 2100, rating: 'good' });
    recordVital({ name: 'LCP', value: 1800, rating: 'good' });
    window.removeEventListener(WEB_VITAL_EVENT, listener);

    expect(getWebVitals().find((sample) => sample.name === 'LCP')?.value).toBe(1800);
    expect(heard).toHaveLength(2);
  });

  it('subscribes to all five metrics once the library has loaded', async () => {
    const report = vi.fn();
    reportWebVitals(report);
    await vi.waitFor(() => expect(report).toHaveBeenCalledTimes(5));
    expect(report.mock.calls.map(([metric]) => (metric as { name: string }).name).sort()).toEqual([
      'CLS',
      'FCP',
      'INP',
      'LCP',
      'TTFB',
    ]);
  });

  it('records into the built-in store by default', async () => {
    reportWebVitals();
    await vi.waitFor(() => expect(getWebVitals().map((sample) => sample.name)).toContain('TTFB'));
  });
});

describe('service worker registration', () => {
  function stubServiceWorker(register: () => Promise<unknown>) {
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } });
  }

  it('does nothing outside production builds', () => {
    const register = vi.fn(() => Promise.resolve());
    stubServiceWorker(register);
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the worker after load in production, and survives a failure', () => {
    vi.stubEnv('PROD', true);
    const register = vi.fn(() => Promise.reject(new Error('insecure context')));
    stubServiceWorker(register);
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});
