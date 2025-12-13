import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { GlobalProvider } from '@/contexts/GlobalProvider';

import '@/styles/app.scss';

const noto = Noto_Sans_JP({
  weight: ['400', '700'],
  style: 'normal',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Multi Panel - YouTube動画タイリング',
  description: 'ブラウザでYouTube動画をタイリング表示',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body className={noto.className} style={{ margin: 0, padding: 0 }}>
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
