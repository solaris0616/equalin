import type { Metadata } from 'next';
import { DotGothic16 } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-dot-gothic',
  display: 'swap',
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Equalin',
  description: 'Retro style split bill app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dotGothic.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
