"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { QrCode, XCircle, Camera, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

export default function MobileScannerPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Initialize scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    scannerRef.current = new Html5QrcodeScanner("reader", config, false);
    
    scannerRef.current.render(
      (decodedText) => {
        // Stop scanning after first successful scan
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        setScanResult(decodedText);
        
        // Short delay before transferring to the equipment page
        setTimeout(() => {
          router.push(`/equipments?issue=${encodeURIComponent(decodedText)}`);
        }, 800);
      },
      (error) => {
        // continuously logging errors on every frame is noisy, so we ignore it
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [currentUser, router]);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">สแกนพัสดุ (QR / Barcode)</h1>
            <p className="text-sm text-slate-500">นำกล้องส่องไปที่โค้ดเพื่อทำรายการเบิก</p>
          </div>
        </div>

        {!scanResult ? (
          <div className="rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-50 relative">
             <div id="reader" className="w-full h-full min-h-[300px]"></div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-emerald-50 rounded-2xl border border-emerald-100">
             <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
             <h2 className="text-xl font-bold text-emerald-700">สแกนสำเร็จ!</h2>
             <p className="text-emerald-600/80 mt-2 font-mono bg-white px-4 py-2 rounded-lg border border-emerald-100">
               {scanResult}
             </p>
             <p className="text-xs text-emerald-500 font-bold mt-4 animate-pulse">กำลังเปลี่ยนหน้าไปทำรายการ...</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
        <p className="text-xs text-slate-500">ไม่สามารถสแกนได้? <button onClick={() => router.push('/equipments')} className="text-indigo-600 font-bold hover:underline">ทำรายการผ่านหน้ารายการพัสดุ</button></p>
      </div>
    </div>
  );
}
