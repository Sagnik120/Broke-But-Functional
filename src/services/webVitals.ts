import type { Metric } from 'web-vitals';

/** One Core Web Vitals reading taken in the user's own browser. */
export interface VitalSample {
  name: Metric['name'];
  value: number;
  rating: Metric['rating'];
}

/** Fired on `window` whenever a metric is measured or updated. */
export const WEB_VITAL_EVENT = 'bbf:web-vital';

const samples = new Map<string, VitalSample>();

/** Keeps the latest reading per metric and broadcasts it for any listener (dev tools, a debug panel). */
export function recordVital(metric: Pick<Metric, 'name' | 'value' | 'rating'>): void {
  const sample: VitalSample = { name: metric.name, value: metric.value, rating: metric.rating };
  samples.set(sample.name, sample);
  window.dispatchEvent(new CustomEvent<VitalSample>(WEB_VITAL_EVENT, { detail: sample }));
}

export function getWebVitals(): VitalSample[] {
  return Array.from(samples.values());
}

/**
 * Starts field measurement of LCP, INP, CLS, FCP and TTFB. The library loads
 * in its own chunk after first paint, so measuring never delays rendering.
 */
export function reportWebVitals(onReport: (metric: Metric) => void = recordVital): void {
  void import('web-vitals')
    .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS(onReport);
      onFCP(onReport);
      onINP(onReport);
      onLCP(onReport);
      onTTFB(onReport);
    })
    .catch(() => {
      // Measurement is best-effort and must never break the app.
    });
}
