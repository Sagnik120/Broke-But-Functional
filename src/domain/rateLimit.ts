export interface RateLimiter {
  /** Records an attempt and reports whether it is allowed. */
  tryAcquire: () => boolean;
}

interface RateLimitOptions {
  /** Maximum attempts allowed inside one window. */
  limit: number;
  windowMs: number;
  /** Injectable clock so tests stay deterministic. */
  now?: () => number;
}

/**
 * Sliding-window rate limiter. It caps how fast the ledger can be changed, so a
 * stuck key, a runaway script or an automated flood cannot freeze the page or
 * fill storage. Memory is bounded by `limit`.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions): RateLimiter {
  let attempts: number[] = [];
  return {
    tryAcquire() {
      const time = now();
      attempts = attempts.filter((attempt) => time - attempt < windowMs);
      if (attempts.length >= limit) return false;
      attempts.push(time);
      return true;
    },
  };
}
