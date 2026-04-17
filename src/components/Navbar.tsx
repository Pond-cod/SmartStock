"use client"
import React, { useState } from 'react';
import { Menu, Bell, LogOut, Wifi, WifiOff, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';
import Tooltip from './Tooltip';

type ConnStatus = 'idle' | 'connected' | 'error';

function ConnectionBadge() {
  const { connStatus, lastConnectedAt, isLoading, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const displayStatus: ConnStatus = (isLoading && connStatus === 'idle') ? 'idle' : connStatus;

  const fmt = (d: Date) =>
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const cfg: Record<ConnStatus, { dot: string; pulse: string; Icon: any; label: string; iconColor: string }> = {
    idle: {
      dot: 'bg-yellow-400', pulse: 'bg-yellow-300',
      label: 'กำลังเชื่อมต่อฐานข้อมูล...',
      iconColor: 'text-yellow-500', Icon: Database,
    },
    connected: {
      dot: 'bg-emerald-500', pulse: 'bg-emerald-400',
      label: 'เชื่อมต่อฐานข้อมูลแล้ว' + (lastConnectedAt ? ' เมื่อ ' + fmt(lastConnectedAt) : ''),
      iconColor: 'text-emerald-500', Icon: Wifi,
    },
    error: {
      dot: 'bg-red-500', pulse: '',
      label: 'การเชื่อมต่อฐานข้อมูลล้มเหลว',
      iconColor: 'text-red-500', Icon: WifiOff,
    },
  };
  const currentCfg = cfg[displayStatus];

  return (
    <Tooltip text={currentCfg.label}>
      <button
        onClick={handleRefresh} disabled={isRefreshing || isLoading}
        className='flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer select-none disabled:cursor-not-allowed'
      >
        <div className='relative flex h-2.5 w-2.5 flex-shrink-0'>
          {(displayStatus === 'idle' || displayStatus === 'connected') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${currentCfg.pulse}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentCfg.dot}`} />
        </div>
        {isRefreshing
          ? <RefreshCw className='w-3.5 h-3.5 animate-spin text-slate-300' />
          : <currentCfg.Icon className={`w-3.5 h-3.5 ${currentCfg.iconColor}`} />
        }
      </button>
    </Tooltip>
  );
}

export default function Navbar({ setMobileOpen }: { setMobileOpen: (v: boolean) => void }) {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header
      className='h-14 flex items-center justify-between px-4 sm:px-5 sticky top-0 z-20 transition-colors border-b'
      style={{ background: 'var(--sidebar-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className='flex items-center gap-3'>
        <button
          onClick={() => setMobileOpen(true)}
          className='md:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors'
        >
          <Menu className='w-5 h-5' />
        </button>
      </div>

      <div className='flex items-center gap-4'>
        <ConnectionBadge />
        
        <div className='relative'>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className='flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10'
          >
            <div className='w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-inner'>
               {currentUser?.Username?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className='hidden lg:block text-left pr-1'>
              <p className='text-xs font-bold text-white leading-tight'>
                {currentUser?.Username || 'User'}
              </p>
              <p className='text-[9px] text-slate-400 font-medium uppercase tracking-wider'>{currentUser?.Role}</p>
            </div>
          </button>

          {showDropdown && (
            <>
              <div className='fixed inset-0 z-10' onClick={() => setShowDropdown(false)} />
              <div className='absolute right-0 mt-2 w-48 bg-[#1a3a5c] border border-white/10 rounded-xl shadow-2xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100'>
                <div className='px-3 py-2 border-b border-white/5 mb-1'>
                  <p className='text-xs font-bold text-white truncate'>{currentUser?.Username}</p>
                  <p className='text-[10px] text-slate-400 uppercase tracking-widest'>{currentUser?.Role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className='w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors'
                >
                  <LogOut className='w-4 h-4' /> ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
