"use client"
import React, { useState } from 'react';
import { X, Printer, QrCode, Package, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QRCodeModal({ equipment, allEquipments = [], onClose }: any) {
  const [currentIndex, setCurrentIndex] = useState(allEquipments.indexOf(equipment) || 0);
  const currentEq = allEquipments[currentIndex] || equipment;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentEq.EquipmentCode}`;
    
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title><style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
          .card { border: 2px solid #000; padding: 20px; border-radius: 10px; text-align: center; width: 250px; }
          .code { font-weight: bold; font-size: 20px; margin-top: 10px; }
          .name { font-size: 14px; margin-bottom: 10px; }
        </style></head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <div class="name">${currentEq.Name}</div>
            <img src="${qrUrl}" />
            <div class="code">${currentEq.EquipmentCode}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" /> QR Code</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-10 flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-white rounded-3xl border-4 border-slate-100 shadow-inner">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentEq.EquipmentCode}`} alt="QR" className="w-48 h-48" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{currentEq.Name}</h3>
            <p className="text-sm font-bold text-slate-400 font-mono mt-1">{currentEq.EquipmentCode}</p>
          </div>
          
          {allEquipments.length > 1 && (
            <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-full">
              <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((i: number) => i - 1)} className="p-2 bg-white rounded-xl shadow-sm disabled:opacity-30"><ChevronLeft className="w-5 h-5"/></button>
              <div className="flex-1 text-xs font-black text-slate-500 uppercase tracking-widest">{currentIndex + 1} / {allEquipments.length}</div>
              <button disabled={currentIndex === allEquipments.length - 1} onClick={() => setCurrentIndex((i: number) => i + 1)} className="p-2 bg-white rounded-xl shadow-sm disabled:opacity-30"><ChevronRight className="w-5 h-5"/></button>
            </div>
          )}

          <button onClick={handlePrint} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95">
            <Printer className="w-5 h-5" /> พิมพ์รหัสพัสดุ
          </button>
        </div>
      </div>
    </div>
  );
}
