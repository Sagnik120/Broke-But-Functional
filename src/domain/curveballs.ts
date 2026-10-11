export interface Curveball {
  label: string;
  amount: number;
}

export const CURVEBALLS: readonly Curveball[] = [
  { label: 'Cracked phone screen', amount: 1800 },
  { label: 'Friend’s birthday gift', amount: 600 },
  { label: 'Doctor visit and medicines', amount: 950 },
  { label: 'Laptop charger died', amount: 1400 },
  { label: 'Last-minute train ticket home', amount: 1100 },
  { label: 'Bike puncture and service', amount: 450 },
  { label: 'Exam form late fee', amount: 500 },
  { label: 'Group trip you can’t skip', amount: 2200 },
];

function secureRandom(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return (buffer[0] ?? 0) / 2 ** 32;
}

/** Picks a surprise expense. `random` is injectable so tests stay deterministic. */
export function drawCurveball(random: () => number = secureRandom): Curveball {
  const index = Math.min(CURVEBALLS.length - 1, Math.floor(random() * CURVEBALLS.length));
  return CURVEBALLS[index] ?? { label: 'Surprise expense', amount: 500 };
}
