import { describe, expect, it } from 'vitest';
import { clamp, parseAmount, parseDay, parseLabel, sanitizeText, toBoundedInt } from './sanitize';

describe('sanitizeText', () => {
  it('strips markup delimiters so labels can never form tags', () => {
    expect(sanitizeText('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('img src=x onerror=alert(1)');
  });

  it('removes control, zero-width and bidi override characters', () => {
    expect(sanitizeText('Piz\u0000za​ ‮evil')).toBe('Pizza evil');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeText('   chai \n\t and   samosa  ')).toBe('chai and samosa');
  });

  it('enforces the maximum length', () => {
    expect(sanitizeText('a'.repeat(200))).toHaveLength(40);
    expect(sanitizeText('abcdef', 3)).toBe('abc');
  });

  it('returns an empty string for non-string input', () => {
    expect(sanitizeText(42)).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText({ toString: () => 'x' })).toBe('');
  });
});

describe('parseLabel', () => {
  it('accepts a clean label', () => {
    expect(parseLabel(' Movie night ')).toEqual({ ok: true, value: 'Movie night' });
  });

  it('rejects labels that are empty after sanitising', () => {
    expect(parseLabel('  <> ', 'Description')).toEqual({ ok: false, error: 'Description is required.' });
  });
});

describe('parseAmount', () => {
  it.each([
    ['450', 450],
    ['1,200', 1200],
    ['₹ 999', 999],
    [' 10 ', 10],
  ])('parses %s', (raw, expected) => {
    expect(parseAmount(raw)).toEqual({ ok: true, value: expected });
  });

  it.each(['', '   ', '-50', '12.5', '1e5', 'abc', '0x10', '५००'])('rejects %j', (raw) => {
    expect(parseAmount(raw).ok).toBe(false);
  });

  it('rejects zero and values above the maximum', () => {
    expect(parseAmount('0')).toEqual({ ok: false, error: 'Amount must be at least ₹1.' });
    expect(parseAmount('100001').ok).toBe(false);
    expect(parseAmount('501', 500).ok).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(parseAmount(500).ok).toBe(false);
    expect(parseAmount(undefined).ok).toBe(false);
  });
});

describe('parseDay', () => {
  it('accepts days within the month', () => {
    expect(parseDay('1')).toEqual({ ok: true, value: 1 });
    expect(parseDay(' 30 ')).toEqual({ ok: true, value: 30 });
  });

  it.each(['0', '31', '', 'x', '1.5', '-3'])('rejects %j', (raw) => {
    expect(parseDay(raw).ok).toBe(false);
  });

  it('respects a custom minimum', () => {
    expect(parseDay('4', 5).ok).toBe(false);
    expect(parseDay('5', 5).ok).toBe(true);
  });
});

describe('number helpers', () => {
  it('clamps values into a range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('coerces untrusted numbers to bounded integers', () => {
    expect(toBoundedInt(12.4, 1, 30)).toBe(12);
    expect(toBoundedInt(99, 1, 30)).toBeNull();
    expect(toBoundedInt('12', 1, 30)).toBeNull();
    expect(toBoundedInt(Number.NaN, 1, 30)).toBeNull();
    expect(toBoundedInt(Number.POSITIVE_INFINITY, 1, 30)).toBeNull();
  });
});
