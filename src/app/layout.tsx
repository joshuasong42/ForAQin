import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Noto_Serif_SC } from 'next/font/google';
import './globals.css';
import StarfieldBg from '@/components/StarfieldBg';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-serif-cn',
});

export const metadata: Metadata = {
  title: '520 Our Galaxy · 宋金钊 ❤ 彭沁园',
  description: '只属于我们两个人的小宇宙',
  icons: {
    icon: '/icons/heart.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5efe9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${cormorant.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen text-text-primary">
        <StarfieldBg />
        <ToastProvider>
          <div className="page-enter">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
