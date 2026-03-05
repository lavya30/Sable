import type { Metadata } from 'next';
import {
  Varela_Round,
  Nunito,
  Patrick_Hand,
  Fira_Code,
  Manrope,
} from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const varelaRound = Varela_Round({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-varela-round',
  display: 'swap',
});
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700'],
  display: 'swap',
});
const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-patrick-hand',
  display: 'swap',
});
const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  weight: ['400', '500'],
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

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
        <link
          href="/fonts/material-symbols.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${varelaRound.variable} ${nunito.variable} ${patrickHand.variable} ${firaCode.variable} ${manrope.variable} font-body bg-canvas text-ink antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
