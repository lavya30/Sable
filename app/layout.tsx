import type { Metadata } from 'next';
import {
  Varela_Round,
  Nunito,
  Patrick_Hand,
  Fira_Code,
  Manrope,
  Lora,
  Merriweather,
  Caveat,
  Kalam,
  Special_Elite,
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
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '500', '700'],
  display: 'swap',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
  weight: ['300', '400', '700'],
  display: 'swap',
});
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '600', '700'],
  display: 'swap',
});
const kalam = Kalam({
  subsets: ['latin'],
  variable: '--font-kalam',
  weight: ['300', '400', '700'],
  display: 'swap',
});
const specialElite = Special_Elite({
  subsets: ['latin'],
  variable: '--font-special-elite',
  weight: '400',
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
        {/* Material Symbols icon font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${varelaRound.variable} ${nunito.variable} ${patrickHand.variable} ${firaCode.variable} ${manrope.variable} ${lora.variable} ${merriweather.variable} ${caveat.variable} ${kalam.variable} ${specialElite.variable} font-body bg-canvas text-ink antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
