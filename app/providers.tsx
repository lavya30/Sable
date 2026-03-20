'use client';

import { DocumentsProvider } from '@/context/DocumentsContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { useLenis } from '@/hooks/useLenis';
import { CommandPalette } from '@/components/CommandPalette';

function SmoothScroll({ children }: { children: React.ReactNode }) {
  useLenis();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DocumentsProvider>
        <SmoothScroll>
          {children}
          <CommandPalette />
        </SmoothScroll>
      </DocumentsProvider>
    </SettingsProvider>
  );
}
