'use client';

import { DocumentsProvider } from '@/context/DocumentsContext';
import { SettingsProvider } from '@/context/SettingsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DocumentsProvider>{children}</DocumentsProvider>
    </SettingsProvider>
  );
}
