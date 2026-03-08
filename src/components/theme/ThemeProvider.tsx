'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContext } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Default to light mode (false = light)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) {
      setIsDarkMode(savedMode === 'dark');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // Update document class for Tailwind dark mode
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Save preference
      localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, mounted]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          background: {
            default: isDarkMode ? '#0a0a0a' : '#ffffff',
            paper: isDarkMode ? '#18181b' : '#ffffff',
          },
          text: {
            primary: isDarkMode ? '#ededed' : '#171717',
            secondary: isDarkMode ? '#a1a1aa' : '#52525b',
          },
        },
      }),
    [isDarkMode]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ isDarkMode: false, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
