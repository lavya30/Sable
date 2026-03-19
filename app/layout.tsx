import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Sable',
  description: 'A focused writing app',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols icon font (self-hosted for offline/Electron) */}
        <link href="/fonts/material-symbols.css" rel="stylesheet" />
      </head>
      <body className="font-body bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
