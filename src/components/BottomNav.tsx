"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, QrCode, History, Layers } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const userRole = currentUser?.Role || 'user';

  const items = [
    { name: 'หน้าหลัก', href: '/', icon: LayoutDashboard, roles: ['Admin', 'admin_approve', 'user'] },
    { name: 'พัสดุ',   href: '/equipments', icon: Package, roles: ['Admin', 'admin_approve', 'user'] },
    { name: 'สแกน',   href: '/qr-scan', icon: QrCode, roles: ['Admin', 'admin_approve', 'user'] },
    { name: 'ประวัติ', href: '/transactions', icon: History, roles: ['Admin', 'admin_approve', 'user'] },
    { name: 'หมวดหมู่', href: '/categories', icon: Layers, roles: ['Admin', 'admin_approve'] },
  ];

  return (
    <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-[#0d2137]/95 backdrop-blur-lg border-t border-white/5 px-2 pb-safe z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]'>
      <div className='flex items-center justify-around h-16'>
        {items.filter(i => i.roles.includes(userRole)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative',
              pathname === item.href ? 'text-white' : 'text-slate-500'
            )}
          >
            {pathname === item.href && (
               <div className='absolute top-0 w-8 h-1 bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary)]' />
            )}
            <item.icon className={clsx('w-5 h-5', pathname === item.href ? 'scale-110' : '')} />
            <span className='text-[10px] font-bold tracking-tight'>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
