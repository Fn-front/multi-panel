import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { GlobalProvider } from '@/contexts/GlobalProvider';
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';
import { METADATA } from '@/constants';

import '@/styles/app.scss';

const noto = Noto_Sans_JP({
  weight: ['400', '700'],
  style: 'normal',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: METADATA.TITLE,
  description: METADATA.DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body className={noto.className}>
        <GlobalProvider>
          {children}
          <ConnectionStatusIndicator />
        </GlobalProvider>
      </body>
    </html>
  );
}
