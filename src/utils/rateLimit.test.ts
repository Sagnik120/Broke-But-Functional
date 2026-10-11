import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '@/utils/rateLimit';

describe('createRateLimiter', () => {
  it('allows attempts up to the limit, then blocks', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => time });
    expect([limiter.tryAcquire(), limiter.tryAcquire(), limiter.tryAcquire()]).toEqual([true, true, true]);
    expect(limiter.tryAcquire()).toBe(false);
    time = 999;
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('recovers as the window slides', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => time });
    limiter.tryAcquire();
    time = 600;
    limiter.tryAcquire();
    expect(limiter.tryAcquire()).toBe(false);
    time = 1000;
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    time = 1600;
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('does not count blocked attempts against the window', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 100, now: () => time });
    limiter.tryAcquire();
    for (let i = 0; i < 50; i += 1) limiter.tryAcquire();
    time = 100;
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('uses the real clock by default', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });
});
