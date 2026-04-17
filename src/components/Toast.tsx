"use client"
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  expiresAt: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2, 11);
    const expiresAt = Date.now() + DURATION;

    setToasts(prev => [...prev.slice(-4), { id, type, title, message, expiresAt }]);

    const timer = setTimeout(() => dismiss(id), DURATION);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error   = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const info    = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  const value = React.useMemo(() => ({ showToast, success, error, warning, info }), [showToast, success, error, warning, info]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const bgStyle = {
    success: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-800/50',
    error: 'bg-red-50 border-red-100 dark:bg-red-900/40 dark:border-red-800/50',
    warning: 'bg-amber-50 border-amber-100 dark:bg-amber-900/40 dark:border-amber-800/50',
    info: 'bg-blue-50 border-blue-100 dark:bg-blue-900/40 dark:border-blue-800/50',
  };

  const iconStyle = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const titleStyle = {
    success: 'text-emerald-800 dark:text-emerald-300',
    error: 'text-red-800 dark:text-red-300',
    warning: 'text-amber-800 dark:text-amber-300',
    info: 'text-blue-800 dark:text-blue-300',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-sm min-w-[300px] max-w-sm animate-in slide-in-from-right-5 duration-300 ${bgStyle[toast.type]}`}>
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconStyle[toast.type]}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${titleStyle[toast.type]}`}>{toast.title}</p>
                {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
              </div>
              <button onClick={() => dismiss(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
