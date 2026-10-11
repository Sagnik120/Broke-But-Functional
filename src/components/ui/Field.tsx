import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

interface FieldMessages {
  label: string;
  hint?: string;
  error?: string;
}

function describedBy(...ids: Array<string | false | undefined>): string | undefined {
  const present = ids.filter(Boolean);
  return present.length > 0 ? present.join(' ') : undefined;
}

function Messages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

type FieldProps = FieldMessages & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

/** Labelled text input with wired-up hint and error descriptions. */
export function Field({ label, hint, error, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        {...input}
      />
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

/** Amount input tuned for whole rupees on mobile keyboards. */
export function AmountField(props: FieldProps) {
  return <Field inputMode="numeric" autoComplete="off" maxLength={12} placeholder="₹" {...props} />;
}

type SelectFieldProps = FieldMessages &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { children: ReactNode };

export function SelectField({ label, hint, error, children, ...select }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        {...select}
      >
        {children}
      </select>
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}
