import { createContext } from 'react';
import type { Theme } from '@/types/ui';

export interface ThemeContextValue {
  /** The theme currently applied. */
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
