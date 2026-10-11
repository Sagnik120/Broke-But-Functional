interface ProgressBarProps {
  label: string;
  /** 0–1 */
  value: number;
}

/** Native progress element: accessible by default and needs no inline styles. */
export function ProgressBar({ label, value }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <progress className="progress" max={100} value={percent} aria-label={label}>
      {percent}%
    </progress>
  );
}
