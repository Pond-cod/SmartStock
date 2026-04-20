"use client"
import React, { useEffect, useRef, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QrCode, Camera, X, CheckCircle2, XCircle, AlertTriangle,
  Package, Layers, MapPin, Hash, RefreshCw, Search, Send
} from 'lucide-react';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';

type ScanState = 'idle' | 'scanning' | 'found' | 'not_found' | 'error';

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  Active:   { label: 'พร้อมใช้งาน', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  Broken:   { label: 'ชำรุด/ซ่อม', cls: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
};

export default function QRScanPage() {
  const { equipments } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [foundEquipment, setFoundEquipment] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const lookupCode = React.useCallback((rawCode: string) => {
    let code = rawCode.trim();
    const eq = equipments.find(e => String(e.EquipmentCode).toLowerCase() === code.toLowerCase());
    if (eq) {
      setFoundEquipment(eq);
      setScanState('found');
    } else {
      setScanState('not_found');
    }
  }, [equipments]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && equipments.length > 0) {
      lookupCode(code);
    }
  }, [searchParams, equipments, lookupCode]);

  const startCamera = React.useCallback(async () => {
    setIsStarting(true);
    setCameraError('');
    try {
      setScanState('scanning');
      setIsCameraActive(true);

      const qrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          qrCode.stop().catch(() => {});
          setIsCameraActive(false);
          lookupCode(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setCameraError(`ไม่สามารถเข้าถึงกล้องได้: ${err?.message || 'Unknown error'}`);
      setScanState('error');
    } finally {
      setIsStarting(false);
    }
  }, [lookupCode]);

  const stopCamera = React.useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn("Scanner stop issue:", err);
      } finally {
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      }
    } else {
      setIsCameraActive(false);
    }
    if (scanState === 'scanning') setScanState('idle');
  }, [scanState]);

  const reset = () => {
    stopCamera();
    setScanState('idle');
    setFoundEquipment(null);
    setManualCode('');
    setCameraError('');
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        const qrCode = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        if (qrCode.isScanning) {
          qrCode.stop().catch(console.warn);
        }
      }
    };
  }, []);

  const eq = foundEquipment;
  const statusCfg = eq ? (STATUS_CFG[eq.Status] ?? { label: eq.Status, cls: 'bg-slate-100', icon: null }) : null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">สแกนรหัสพัสดุ</h1>
          <p className="text-xs text-slate-500 font-medium">ใช้กล้องสแกน QR Code เพื่อดูข้อมูลหรือเบิกจ่าย</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <Camera className="w-4 h-4" /> ระบบสแกนผ่านกล้อง
            </h2>
            {isCameraActive && (
              <button onClick={stopCamera} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg">ปิดกล้อง</button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 aspect-square relative flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <QrCode className="w-10 h-10 text-white/50" />
              </div>
              <button onClick={startCamera} disabled={isStarting} className="btn-primary min-h-[50px] px-8 rounded-2xl">
                {isStarting ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'เริ่มการสแกน'}
              </button>
              <p className="text-xs text-white/40 font-medium">รองรับการสแกนผ่านกล้องมือถือและเว็บแคม</p>
            </div>
          )}
          {scanState === 'scanning' && (
            <div className="absolute top-4 left-4 right-4 flex justify-center">
               <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                 <p className="text-[10px] text-white font-bold uppercase tracking-widest animate-pulse">กำลังสแกน...</p>
               </div>
            </div>
          )}
        </div>
        {cameraError && <div className="p-4 bg-red-50 text-red-600 text-sm font-medium border-t border-red-100">{cameraError}</div>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" /> ระบุรหัสด้วยตัวเอง
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && manualCode.trim() && lookupCode(manualCode)}
            placeholder="เช่น EQ-123456"
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all font-mono text-sm"
          />
          <button onClick={() => manualCode.trim() && lookupCode(manualCode)} className="btn-primary px-5 rounded-xl">ค้นหา</button>
        </div>
      </div>

      {scanState === 'found' && eq && statusCfg && (
        <div className="bg-white rounded-2xl border-2 border-emerald-400 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-emerald-50 px-5 py-3 flex items-center gap-2 border-b border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="font-bold text-emerald-700">พบข้อมูลพัสดุ</p>
            <button onClick={reset} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${statusCfg.cls}`}>
              {statusCfg.icon} {statusCfg.label}
            </span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { icon: <Hash className="w-3.5 h-3.5" />, label: 'รหัสพัสดุ', value: eq.EquipmentCode },
                { icon: <Package className="w-3.5 h-3.5" />, label: 'ชื่อพัสดุ', value: eq.Name },
                { icon: <Layers className="w-3.5 h-3.5" />, label: 'หมวดหมู่', value: eq.CategoryName || 'ทั่วไป' },
                { icon: <MapPin className="w-3.5 h-3.5" />, label: 'สถานที่', value: eq.Location || '-' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                     {item.icon} <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                   </div>
                   <p className="text-sm font-bold text-slate-700 truncate">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 flex gap-3">
              <Link
                href={`/equipments?issue=${eq.EquipmentCode}`}
                className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> ทำรายการเบิก
              </Link>
              <Link
                href="/equipments"
                className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 text-slate-600"
              >
                <Package className="w-4 h-4" /> ดูรายการทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      )}

      {scanState === 'not_found' && (
        <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6 text-center space-y-3 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-red-800">ไม่พบข้อมูลพัสดุ</p>
            <p className="text-xs text-red-600 font-medium">รหัสที่ระบุอาจไม่ถูกต้องหรือไม่มีในระบบ</p>
          </div>
          <button onClick={reset} className="text-xs font-bold text-red-700 hover:underline">ลองใหม่อีกครั้ง</button>
        </div>
      )}
    </div>
  );
}
