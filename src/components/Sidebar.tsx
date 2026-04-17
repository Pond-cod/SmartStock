"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Layers, Users, QrCode, Factory, X, Settings, History, Send, Building2, BarChart3, Shield, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

const navItems = [
  { name: 'แดชบอร์ด', href: '/', icon: LayoutDashboard, module: 'Dashboard' },
  { name: 'หมวดหมู่', href: '/categories', icon: Layers, module: 'Categories' },
  { name: 'รายการพัสดุ', href: '/equipments', icon: Package, module: 'Equipments' },
  { name: 'ทำรายการเบิก', href: '/requisition', icon: Send, module: 'Requisition' },
  { name: 'ประวัติเบิก-คืน', href: '/transactions', icon: History, module: 'Transactions' },
  { name: 'รายงานสรุป', href: '/reports', icon: BarChart3, module: 'Reports' },
  { name: 'สแกน QR Code', href: '/qr-scan', icon: QrCode, module: 'Equipments' },
  { name: 'ข้อมูลหลัก', href: '/master-data', icon: Users, module: 'MasterData' },
  { name: 'ผู้ใช้งานระบบ', href: '/users', icon: Factory, module: 'Users' },
  { name: 'ศูนย์การอนุมัติ', href: '/settings/approvals', icon: CheckCircle2, module: 'Approvals' },
];

export default function Sidebar({ isMobileOpen, setMobileOpen }: { isMobileOpen: boolean, setMobileOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const dataContext = useData();
  const { hasPermission, actionRequests } = dataContext;
  const userRole = currentUser?.Role || 'user';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d2137] text-slate-300 border-r border-white/5 shadow-2xl">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group px-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="md:hidden lg:block">
            <p className="text-sm font-black text-white tracking-tight">ระบบบริหารพัสดุ</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">smart-stock</p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-5 pb-2 md:hidden lg:block">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">เมนูหลัก</p>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.filter(item => {
          if (item.module === 'Approvals') return ['Admin', 'admin_approve', 'super Admin'].includes(userRole);
          return hasPermission(userRole, item.module, 'view');
        }).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group',
              pathname === item.href ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={clsx('w-5 h-5 flex-shrink-0', pathname === item.href ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              <span className="text-sm font-semibold md:hidden lg:block truncate">{item.name}</span>
            </div>

            {item.module === 'Approvals' && actionRequests.filter((r: any) => r.Status === 'Pending').length > 0 && (
              <div className="md:hidden lg:flex w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-[10px] font-black animate-pulse">
                {actionRequests.filter((r: any) => r.Status === 'Pending').length}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-3 py-4 rounded-2xl bg-white/5 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-black text-white shadow-inner flex-shrink-0">
            {currentUser?.Username?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="min-w-0 md:hidden lg:block leading-tight">
            <p className="text-xs font-bold text-white truncate">{currentUser?.Username}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase truncate tracking-wider">{currentUser?.Role}</p>
          </div>
        </div>

        {userRole === 'super Admin' && (
          <>
            <Link
              href="/settings/roles"
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                pathname === '/settings/roles' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'
              )}
            >
              <Shield className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-white" />
              <span className="text-sm font-semibold md:hidden lg:block truncate">จัดการสิทธิ์</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                pathname === '/settings' ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-white/5 hover:text-white'
              )}
            >
              <Settings className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-white" />
              <span className="text-sm font-semibold md:hidden lg:block truncate">ตั้งค่าระบบ</span>
            </Link>
          </>
        )}

        <div className="pt-4 px-3 md:hidden lg:block">
          <p className="text-[9px] text-slate-600 font-bold text-center tracking-tighter">Powered by DeeDevIOT.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:block fixed top-0 left-0 bottom-0 z-30 md:w-[72px] lg:w-[240px] transition-all duration-300">
        <SidebarContent />
      </aside>
    </>
  );
}
