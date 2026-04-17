"use client"
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type ResponsiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function ResponsiveModal({ isOpen, onClose, title, children, footer }: ResponsiveModalProps) {
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Wrapper - Centers on desktop, anchors bottom on mobile */}
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-none">
            
            <motion.div
               layoutId="responsive-modal"
               initial={{ y: "100%", scale: 1 }}
               animate={{ y: 0, scale: 1 }}
               exit={{ y: "100%", scale: 1 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="bg-white w-full sm:w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden"
            >
               {/* Mobile Drag Handle */}
               <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing" onClick={onClose} aria-hidden="true">
                 <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
               </div>

               {/* Header */}
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                 <button 
                   onClick={onClose}
                   className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
                   aria-label="Close modal"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* Body */}
               <div className="p-6 overflow-y-auto overscroll-contain">
                 {children}
               </div>

               {/* Footer */}
               {footer && (
                 <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                   {footer}
                 </div>
               )}
            </motion.div>

          </div>
        </>
      )}
    </AnimatePresence>
  );
}
