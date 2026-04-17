"use client"
import React, { useState, useEffect, memo } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const LayoutChrome = memo(({
  isMobileOpen,
  setMobileOpen,
  children,
}: {
  isMobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--background)' }}>
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[72px] lg:ml-[240px] transition-all duration-300 min-h-screen">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 md:pb-6 w-full max-w-full overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
});

LayoutChrome.displayName = 'LayoutChrome';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname   = usePathname();
  const router     = useRouter();
  const { currentUser, isLoadingAuth } = useAuth();

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isLoadingAuth && !currentUser && pathname !== '/login') {
      router.replace('/login');
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--background)' }}>
        <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-xl animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 font-medium italic">กำลังยืนยันตัวตน...</p>
      </div>
    );
  }

  if (pathname === '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1a3a5c 50%, #0d2137 100%)' }}>
        {children}
      </div>
    );
  }

  if (!currentUser) return null;

  if (currentUser.MustChangePassword && pathname === '/change-password') {
    return (
      <div className="min-h-screen w-full flex flex-col" style={{ background: 'var(--background)' }}>
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full max-w-full overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <LayoutChrome isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen}>
      {children}
    </LayoutChrome>
  );
}
