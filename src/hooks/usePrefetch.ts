import { useEffect } from 'react';

type Loader = () => Promise<unknown>;

const IDLE_FALLBACK_MS = 1500;

/**
 * Downloads lazily loaded views while the browser is idle, so the first tap on
 * a tab feels instant without those views delaying the initial render.
 */
export function usePrefetch(loaders: readonly Loader[]): void {
  useEffect(() => {
    const run = () => loaders.forEach((load) => void load().catch(() => undefined));
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(run, IDLE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [loaders]);
}
