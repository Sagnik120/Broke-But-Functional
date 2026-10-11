import { useSyncExternalStore } from 'react';
import { DEFAULT_ROUTE, ROUTES, type RouteId } from '@/constants/routes';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}

/** Maps the current URL hash (`#/simulate`) to a known view, falling back to the default. */
export function readRoute(): RouteId {
  const slug = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.find((route) => route.slug === slug)?.id ?? DEFAULT_ROUTE;
}

/** Changes view by pushing a history entry, so back and forward move between views. */
export function navigateTo(id: RouteId): void {
  const slug = ROUTES.find((route) => route.id === id)?.slug ?? '';
  const hash = `#/${slug}`;
  if (window.location.hash === hash) return;
  window.history.pushState(null, '', hash);
  listeners.forEach((listener) => listener());
}

/**
 * Dependency-free hash routing: each view has its own URL, deep links work on
 * any static host, and no server rewrite rules are needed.
 */
export function useHashRoute(): [RouteId, (id: RouteId) => void] {
  const route = useSyncExternalStore(subscribe, readRoute);
  return [route, navigateTo];
}
