// ─── ThemeContext ─────────────────────────────────────────────────────────────
// Provides butter-smooth, reactive switching between Luxury Cream (light)
// and Titanium Obsidian (dark) modes throughout the app.

import React, { createContext, useContext, useState, useMemo } from 'react';
import { Colors, type ThemeColors, type ThemeMode } from '@/constants/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to light mode (the requested bespoke cream palette)
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<ThemeContextValue>(() => {
    return {
      mode,
      colors: Colors[mode],
      toggleTheme: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
      setMode,
      isDark: mode === 'dark',
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside of ThemeProvider
    return {
      mode: 'light',
      colors: Colors.light,
      toggleTheme: () => {},
      setMode: () => {},
      isDark: false,
    };
  }
  return context;
}
