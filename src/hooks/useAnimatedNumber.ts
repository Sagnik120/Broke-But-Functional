import { useEffect, useRef, useState } from 'react';

/** True when the browser can report motion preferences and the user hasn't asked for less motion. */
export function prefersMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Tweens towards `target` so a changed amount visibly travels from its old
 * value to its new one. Returns `target` immediately under reduced motion.
 */
export function useAnimatedNumber(target: number, duration = 300): number {
  const animate = prefersMotion();
  const [display, setDisplay] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (!animate || from === target) {
      current.current = target;
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const value = progress < 1 ? from + (target - from) * easeOutCubic(progress) : target;
      current.current = value;
      setDisplay(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate, target, duration]);

  return animate ? display : target;
}
