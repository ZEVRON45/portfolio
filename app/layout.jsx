import './globals.css';
import { Anton, Inter } from 'next/font/google';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'NIRAJAN ARYAL',
  description: 'An Electronics, Communication and Information Engineering student exploring frontend development, robotics, electronics, and computer hardware.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
