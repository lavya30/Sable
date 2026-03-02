'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface Settings {
  fontSize: number;    // px, range 16–32
  lineSpacing: number; // unitless, range 1.4–2.2
  theme: 'light' | 'dark';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

const STORAGE_KEY = 'sable_settings';

const defaultSettings: Settings = {
  fontSize: 20,
  lineSpacing: 1.8,
  theme: 'light',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) });
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  // Persist settings and apply dark mode class whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}
