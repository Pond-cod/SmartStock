"use client"
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/components/Toast';
import { ShieldAlert, Key, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function ChangePasswordPage() {
  const { currentUser, logout } = useAuth();
  const { updateRecord } = useData();
  const toast = useToast();
  const router = useRouter();

  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data: any) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await updateRecord("Users", {
        Username: currentUser.Username,
        Password: data.newPassword,
        MustChangePassword: 'FALSE'
      });

      if (res.success) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        setTimeout(async () => {
          await logout();
          window.location.href = '/login';
        }, 2000);
      } else {
        setErrorMsg('ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-xl shadow-amber-500/10">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">เปลี่ยนรหัสผ่านใหม่</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">เพื่อความปลอดภัยในการเข้าถึงข้อมูล</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">รหัสผ่านใหม่</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    {...register('newPassword', {
                      required: 'กรุณาระบุรหัสผ่านใหม่',
                      minLength: { value: 6, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }
                    })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="ขั้นต่ำ 6 ตัวอักษร"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                    <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3"/> {(errors.newPassword as any).message}
                    </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'กรุณายืนยันรหัสผ่านใหม่อีกครั้ง',
                      validate: (val: string) => val === newPassword || 'รหัสผ่านไม่ตรงกัน'
                    })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่านเดิมอีกครั้ง"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                  />
                </div>
                {errors.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3"/> {(errors.confirmPassword as any).message}
                    </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> ยืนยันการเปลี่ยนรหัสผ่าน
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
