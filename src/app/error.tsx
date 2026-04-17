"use client"
import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">อ๊ะ! เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="text-gray-500 mb-6">
          ระบบไม่สามารถทำงานได้อย่างถูกต้องในขณะนี้ อาจเกิดจากการเชื่อมต่อเซิร์ฟเวอร์หรือฐานข้อมูล GAS
        </p>
        
        <div className="bg-gray-100 p-3 rounded-md w-full mb-6 overflow-x-auto">
          <p className="text-xs text-red-500 font-mono text-left break-words">
            {error.message || "Unknown Application Error"}
          </p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={18} />
            ลองใหม่อีกครั้ง
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}
