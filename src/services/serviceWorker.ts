/**
 * Registers the offline cache in production builds. It is a no-op in
 * development, in tests and in browsers without service worker support.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is an enhancement; the app works without it.
    });
  });
}
