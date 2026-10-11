import type { ReactNode } from 'react';

export type BadgeTone = 'good' | 'warn' | 'bad' | 'neutral';

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
}

/** Status pill. The text carries the meaning; the dot and colour only reinforce it. */
export function Badge({ tone, children }: BadgeProps) {
  return (
    <p className="badge" data-tone={tone}>
      <span className="badge__dot" aria-hidden="true" />
      {children}
    </p>
  );
}
