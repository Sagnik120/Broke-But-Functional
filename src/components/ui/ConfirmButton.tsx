import { useState } from 'react';

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/** Two-step button for destructive actions, so nothing is lost to a stray click. */
export function ConfirmButton({ label, confirmLabel, onConfirm }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="button button--ghost" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="confirm" role="group" aria-label={label}>
      <button
        type="button"
        className="button button--danger"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- keeps keyboard focus on the step the user just opened
        autoFocus
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="button button--ghost" onClick={() => setConfirming(false)}>
        Keep my data
      </button>
    </span>
  );
}
