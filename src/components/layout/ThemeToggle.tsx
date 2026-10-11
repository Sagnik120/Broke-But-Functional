import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/** Toggle button: the label stays "Dark mode" and `aria-pressed` carries the state. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className="icon-button" aria-pressed={dark} onClick={toggleTheme}>
      {dark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      <span className="sr-only lg:not-sr-only">Dark mode</span>
    </button>
  );
}
