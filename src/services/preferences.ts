import { THEME_STORAGE_KEY } from '@/constants';
import type { Theme } from '@/types/ui';

/** Reads the saved theme, ignoring anything that is not a known value. */
export function loadThemePreference(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Returns false when storage is unavailable; the choice then lasts for this visit only. */
export function saveThemePreference(theme: Theme): boolean {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
