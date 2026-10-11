import { MAX_AMOUNT, MAX_LABEL_LENGTH, MONTH_DAYS } from './constants';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

// Control characters, zero-width/bidi overrides and markup delimiters never belong in a label.
const UNSAFE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x1f], // C0 controls
  [0x7f, 0x9f], // DEL and C1 controls
  [0x200b, 0x200f], // zero-width and direction marks
  [0x202a, 0x202e], // bidi embeddings/overrides
  [0x2066, 0x2069], // bidi isolates
];
const MARKUP_DELIMITERS = new Set(['<', '>', '`']);

function isSafeCharacter(character: string): boolean {
  if (MARKUP_DELIMITERS.has(character)) return false;
  const code = character.codePointAt(0) ?? 0;
  return !UNSAFE_RANGES.some(([from, to]) => code >= from && code <= to);
}

/** Normalises free text so it is safe to store, render and announce. */
export function sanitizeText(raw: unknown, maxLength = MAX_LABEL_LENGTH): string {
  if (typeof raw !== 'string') return '';
  return Array.from(raw.normalize('NFKC').replace(/\s+/g, ' '))
    .filter(isSafeCharacter)
    .join('')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function parseLabel(raw: unknown, fieldName = 'Name'): Parsed<string> {
  const value = sanitizeText(raw);
  if (value.length === 0) return { ok: false, error: `${fieldName} is required.` };
  return { ok: true, value };
}

/** Accepts whole-rupee amounts such as "450", "1,200" or "₹ 999". */
export function parseAmount(raw: unknown, max = MAX_AMOUNT): Parsed<number> {
  if (typeof raw !== 'string') return { ok: false, error: 'Enter an amount.' };
  const cleaned = raw.replace(/[₹,\s]/g, '');
  if (cleaned.length === 0) return { ok: false, error: 'Enter an amount.' };
  if (!/^\d{1,9}$/.test(cleaned)) {
    return { ok: false, error: 'Use whole rupees only, like 450.' };
  }
  const value = Number(cleaned);
  if (value < 1) return { ok: false, error: 'Amount must be at least ₹1.' };
  if (value > max) {
    return { ok: false, error: `Amount can't be more than ₹${max.toLocaleString('en-IN')}.` };
  }
  return { ok: true, value };
}

export function parseDay(raw: unknown, min = 1): Parsed<number> {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{1,2}$/.test(text)) {
    return { ok: false, error: `Enter a day between ${min} and ${MONTH_DAYS}.` };
  }
  const value = Number(text);
  if (value < min || value > MONTH_DAYS) {
    return { ok: false, error: `Enter a day between ${min} and ${MONTH_DAYS}.` };
  }
  return { ok: true, value };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Coerces untrusted numbers (e.g. from storage) to a bounded integer, or null if unusable. */
export function toBoundedInt(raw: unknown, min: number, max: number): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const value = Math.round(raw);
  return value >= min && value <= max ? value : null;
}
