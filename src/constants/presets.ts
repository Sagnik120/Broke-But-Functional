import type { Category } from '@/types/finance';

/** A one-tap scenario for the simulator: values are raw form strings, validated like typed input. */
export interface ScenarioPreset {
  id: string;
  label: string;
  draft: {
    type: 'spend' | 'subscribe' | 'income';
    label: string;
    amount: string;
    category?: Category;
    dueDay?: string;
  };
}

export const SCENARIO_PRESETS: readonly ScenarioPreset[] = [
  {
    id: 'biryani',
    label: 'Biryani night ₹350',
    draft: { type: 'spend', label: 'Biryani night', amount: '350', category: 'food' },
  },
  {
    id: 'sneakers',
    label: 'Sneaker drop ₹2,999',
    draft: { type: 'spend', label: 'Sneaker drop', amount: '2999', category: 'shopping' },
  },
  {
    id: 'concert',
    label: 'Concert ticket ₹1,500',
    draft: { type: 'spend', label: 'Concert ticket', amount: '1500', category: 'fun' },
  },
  {
    id: 'gym',
    label: 'Gym membership ₹800/mo',
    draft: { type: 'subscribe', label: 'Gym membership', amount: '800', dueDay: '25' },
  },
  {
    id: 'gig',
    label: 'Freelance gig +₹2,000',
    draft: { type: 'income', label: 'Freelance gig', amount: '2000' },
  },
];
