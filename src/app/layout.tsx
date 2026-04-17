import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ระบบบริหารจัดการพัสดุและครุภัณฑ์',
  description: 'ระบบจัดการพัสดุ วัสดุ และครุภัณฑ์ออนไลน์ ประสิทธิภาพสูง',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="dns-prefetch" href="https://api.qrserver.com" />
        <link rel="preconnect" href="https://api.qrserver.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-300`}>
        <ToastProvider>
          <DataProvider>
            <AuthProvider>
              <ThemeProvider>
                <AppShell>
                  {children}
                </AppShell>
              </ThemeProvider>
            </AuthProvider>
          </DataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
