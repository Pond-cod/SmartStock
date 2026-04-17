"use client"
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useData } from './DataContext';

type ThemeContextType = {
  themeColor: string;
  textColor: string;
  fontSize: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useData();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply primary ThemeColor to CSS variables
    if (settings.ThemeColor) {
      root.style.setProperty('--primary', settings.ThemeColor);
    }

    // Apply TextColor Mode (dark/light) via data attribute or class
    // We can toggle 'dark' class for tailwind
    if (settings.TextColor === 'light') {
       root.classList.add('dark'); // 'light' text means dark mode background
    } else {
       root.classList.remove('dark');
    }

    // Apply global FontSize
    if (settings.FontSize === 'small') {
       root.style.fontSize = '14px';
    } else if (settings.FontSize === 'large') {
       root.style.fontSize = '18px';
    } else {
       root.style.fontSize = '16px'; // medium
    }

  }, [settings]);

  return (
    <ThemeContext.Provider value={{ 
       themeColor: settings?.ThemeColor || '#3b82f6',
       textColor: settings?.TextColor || 'dark',
       fontSize: settings?.FontSize || 'medium'
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
