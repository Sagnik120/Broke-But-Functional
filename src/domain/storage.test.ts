import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from './constants';
import { createDemoState, createEmptyState } from './seed';
import { loadState, parseState, saveState } from './storage';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('parseState', () => {
  it('round-trips a valid state', () => {
    const demo = createDemoState();
    expect(parseState(JSON.parse(JSON.stringify(demo)))).toEqual(demo);
  });

  it.each([null, undefined, 'text', 42, [], {}, { version: 2 }])('rejects %j', (raw) => {
    expect(parseState(raw)).toBeNull();
  });

  it('sanitises labels that were tampered with in storage', () => {
    const state = parseState({
      version: 1,
      currentDay: 3,
      goals: [{ id: 'g1', label: '<b>Trip</b>', target: 500 }],
      scheduled: [],
      transactions: [
        { id: 't1', kind: 'expense', label: '<img src=x onerror=alert(1)>', amount: 100, category: 'food', day: 2 },
      ],
    });
    expect(state?.goals[0]?.label).toBe('bTrip/b');
    expect(state?.transactions[0]?.label).not.toMatch(/[<>]/);
  });

  it('drops malformed entries instead of trusting them', () => {
    const state = parseState({
      version: 1,
      currentDay: 5,
      goals: [{ id: 'g1', label: 'Trip', target: 500 }, { id: 'bad id!', label: 'x', target: 5 }, 'junk'],
      scheduled: [
        { id: 's1', kind: 'subscription', label: 'Music', amount: 119, dueDay: 12, cancelledDay: null },
        { id: 's2', kind: 'loan-shark', label: 'Nope', amount: 1, dueDay: 1 },
        { id: 's3', kind: 'commitment', label: 'Rent', amount: 1, dueDay: 45 },
      ],
      transactions: [
        { id: 't1', kind: 'expense', label: 'Ok', amount: 100, category: 'made-up', day: 2, unexpected: true },
        { id: 't2', kind: 'expense', label: 'Negative', amount: -100, category: 'food', day: 2 },
        { id: 't3', kind: 'expense', label: 'Huge', amount: 1e12, category: 'food', day: 2 },
        { id: 't4', kind: 'saving', label: 'Orphan', amount: 50, category: 'other', day: 2, goalId: 'ghost' },
        { id: 't5', kind: 'saving', label: 'Linked', amount: 50, category: 'other', day: 2, goalId: 'g1' },
        { id: 't6', kind: 'steal', label: 'Bad kind', amount: 50, category: 'other', day: 2 },
        { id: 't7', kind: 'expense', label: '', amount: 50, category: 'other', day: 2 },
        null,
      ],
    });
    expect(state?.goals.map((goal) => goal.id)).toEqual(['g1']);
    expect(state?.scheduled.map((payment) => payment.id)).toEqual(['s1']);
    expect(state?.transactions.map((t) => t.id)).toEqual(['t1', 't5']);
    expect(state?.transactions[0]).toMatchObject({ category: 'other', unexpected: true, goalId: null });
  });

  it('repairs an out-of-range or rewound current day', () => {
    expect(parseState({ version: 1, currentDay: 400 })?.currentDay).toBe(1);
    const state = parseState({
      version: 1,
      currentDay: 2,
      transactions: [{ id: 't1', kind: 'income', label: 'Gig', amount: 100, category: 'other', day: 9 }],
    });
    expect(state?.currentDay).toBe(9);
  });

  it('tolerates missing collections', () => {
    expect(parseState({ version: 1, currentDay: 4 })).toEqual({ ...createEmptyState(), currentDay: 4 });
  });
});

describe('loadState and saveState', () => {
  it('saves and loads through storage', () => {
    const storage = memoryStorage();
    const demo = createDemoState();
    expect(saveState(demo, storage)).toBe(true);
    expect(loadState(storage)).toEqual(demo);
  });

  it('returns null when nothing is stored or the JSON is corrupt', () => {
    expect(loadState(memoryStorage())).toBeNull();
    expect(loadState(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toBeNull();
    expect(loadState(null)).toBeNull();
  });

  it('ignores oversized payloads without parsing them', () => {
    const huge = JSON.stringify({ version: 1, currentDay: 3, padding: 'x'.repeat(250_000) });
    expect(loadState(memoryStorage({ [STORAGE_KEY]: huge }))).toBeNull();
  });

  it('never lets stored keys pollute object prototypes', () => {
    const hostile = '{"version":1,"currentDay":2,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}';
    const state = loadState(memoryStorage({ [STORAGE_KEY]: hostile }));
    expect(state).toEqual({ ...createEmptyState(), currentDay: 2 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('fails soft when storage throws or is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(loadState(broken)).toBeNull();
    expect(saveState(createEmptyState(), broken)).toBe(false);
    expect(saveState(createEmptyState(), null)).toBe(false);
  });

  it('uses browser localStorage by default', () => {
    expect(saveState(createEmptyState())).toBe(true);
    expect(loadState()).toEqual(createEmptyState());
  });
});
