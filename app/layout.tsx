import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Sable',
  description: 'A focused writing app for distraction-free creative writing.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Sable',
    description: 'A focused writing app for distraction-free creative writing.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Sable – A focused writing app' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sable',
    description: 'A focused writing app for distraction-free creative writing.',
    images: ['/og-image.png'],
  },
  other: {
    'author': 'Lavya Goel',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols icon font (self-hosted for offline/Electron) */}
        <link href="/fonts/material-symbols.css" rel="stylesheet" />
        <meta name="theme-color" content="#13ec75" />
      </head>
      <body className="font-body bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
