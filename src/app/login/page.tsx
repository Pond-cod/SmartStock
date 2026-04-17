"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn, Factory } from 'lucide-react';
import { motion } from 'framer-motion';

function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.status === 'connected' ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  const cfg = {
    checking: { dot: 'bg-yellow-400', ping: true,  text: 'กำลังตรวจสอบการเชื่อมต่อ...', textCls: 'text-slate-400' },
    connected:{ dot: 'bg-emerald-500', ping: true, text: 'เชื่อมต่อฐานข้อมูลสำเร็จ', textCls: 'text-emerald-400 font-medium' },     
    error:    { dot: 'bg-red-500',    ping: false, text: 'ฐานข้อมูลไม่พร้อมใช้งาน', textCls: 'text-red-400' },
  };
  const current = cfg[status];

  return (
    <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
      <div className="relative flex h-2 w-2">
        {current.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </div>
      <span className={`text-[10px] uppercase tracking-widest ${current.textCls}`}>{current.text}</span>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorText('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }
    setErrorText('');
    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setErrorText(result.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setErrorText(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d2137]/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden"
      >
        <div className="pt-10 pb-6 px-8 text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl mb-2">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ระบบบริหารจัดเก็บวัสดุครุภัณฑ์</h1>
          <p className="text-slate-400 text-sm font-medium">เข้าสู่ระบบเพื่อจัดการข้อมูลของคุณ</p>
        </div>

        <form onSubmit={handleLogin} className="px-8 py-7 space-y-4">
          {errorText && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm text-center font-medium">
              {errorText}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">ชื่อผู้ใช้งาน</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (errorText) setErrorText(''); }}
                className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="Username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">รหัสผ่าน</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorText) setErrorText(''); }}
                className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        <div className="pb-8 px-8 flex justify-center">
          <DatabaseStatus />
        </div>
      </motion.div>
    </div>
  );
}
