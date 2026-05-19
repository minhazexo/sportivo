import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'sportivo_theme';
const TRANSITION_DURATION = 300; // ms for smooth transition

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [mounted, setMounted] = useState(false);

  // Apply theme class to html element and persist
  useEffect(() => {
    const root = document.documentElement;

    // Disable transitions during initial load to avoid flash
    if (!mounted) {
      root.classList.add('theme-transitioning');
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem(STORAGE_KEY, theme);
      // Re-enable transitions after paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('theme-transitioning');
          setMounted(true);
        });
      });
    } else {
      // Smooth transition
      root.classList.add('theme-transitioning');
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem(STORAGE_KEY, theme);

      // Remove transition lock after animation completes
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, TRANSITION_DURATION);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
