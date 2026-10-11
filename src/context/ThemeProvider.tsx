import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/context/theme-context';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { loadThemePreference, saveThemePreference } from '@/services/preferences';
import type { Theme } from '@/types/ui';

/**
 * Follows the system colour scheme until the user picks a theme, then
 * remembers that choice on this device.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [preference, setPreference] = useState<Theme | null>(loadThemePreference);
  const theme: Theme = preference ?? (systemPrefersDark ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (preference !== null) saveThemePreference(preference);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
