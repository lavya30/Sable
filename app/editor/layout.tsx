import {
  Lora,
  Merriweather,
  Caveat,
  Kalam,
  Special_Elite,
} from 'next/font/google';

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

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${lora.variable} ${merriweather.variable} ${caveat.variable} ${kalam.variable} ${specialElite.variable}`}
    >
      {children}
    </div>
  );
}
