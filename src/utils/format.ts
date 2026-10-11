const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  // Avoid "-₹0" for tiny negative fractions.
  const rounded = Math.round(amount);
  return rupees.format(rounded === 0 ? 0 : rounded);
}

export function formatSignedINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'no change';
  return `${rounded > 0 ? '+' : '−'}${rupees.format(Math.abs(rounded))}`;
}

export function formatSignedNumber(value: number, suffix = ''): string {
  const rounded = Math.round(value);
  if (rounded === 0) return 'no change';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}${suffix}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
