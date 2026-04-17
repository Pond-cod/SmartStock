"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, text, position = 'right' }: { children: React.ReactNode, text: string, position?: 'top' | 'right' | 'bottom' | 'left' }) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  if (!text) return <>{children}</>;

  return (
    <div 
      className="relative flex items-center justify-center w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, 
               x: position === 'right' ? -10 : position === 'left' ? 10 : 0, 
               y: position === 'bottom' ? -10 : position === 'top' ? 10 : 0 
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, 
               x: position === 'right' ? -5 : position === 'left' ? 5 : 0, 
               y: position === 'bottom' ? -5 : position === 'top' ? 5 : 0
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-xl pointer-events-none whitespace-nowrap
              ${position === 'right' ? 'left-full ml-3' : ''}
              ${position === 'left' ? 'right-full mr-3' : ''}
              ${position === 'top' ? 'bottom-full mb-3' : ''}
              ${position === 'bottom' ? 'top-full mt-3' : ''}
            `}
          >
            {text}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45
              ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
              ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
              ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
            `} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
