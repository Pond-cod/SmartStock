"use client"
import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Search, Package, Send, Hash, MapPin, Layers, RefreshCw } from 'lucide-react';
import IssueModal from '@/components/IssueModal';
import clsx from 'clsx';

export default function RequisitionPage() {
  const { equipments, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);

  const availableEquipments = useMemo(() => {
    return equipments
      .filter(eq => eq.Status === 'Active' && Number(eq.Quantity) > 0)
      .filter(eq => {
        const lq = searchQuery.toLowerCase();
        return (eq.EquipmentCode?.toLowerCase().includes(lq) || eq.Name?.toLowerCase().includes(lq));
      });
  }, [equipments, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="text-center space-y-2 py-6">
        <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
            <Send className="w-6 h-6 text-white" />
          </div>
          ทำรายการเบิกพัสดุ
        </h1>
        <p className="text-slate-500 font-medium">ค้นหาพัสดุที่ต้องการเบิกจากสต็อกและระบุข้อมูลผู้รับ</p>
      </div>

      <div className="max-w-2xl mx-auto relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="พิมพ์ชื่อพัสดุ หรือ รหัสเพื่อค้นหา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 outline-none focus:border-primary transition-all text-lg font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-slate-100" />)
        ) : availableEquipments.map((eq) => (
          <div key={eq.EquipmentCode} className="group bg-white rounded-[2.5rem] border border-slate-200 p-6 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">คงเหลือ</p>
                <p className="text-2xl font-black text-slate-800">{eq.Quantity} <span className="text-xs font-bold text-slate-400">{eq.Unit}</span></p>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{eq.Name}</h3>
            <p className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1"><Hash className="w-3 h-3" /> {eq.EquipmentCode}</p>
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">สถานที่</span>
                <span className="text-xs font-bold text-slate-600">{eq.Location || 'ไม่ระบุ'}</span>
              </div>
              <button
                onClick={() => { setSelectedEquipment(eq); setShowIssueModal(true); }}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                เลือกพัสดุ
              </button>
            </div>
          </div>
        ))}
      </div>

      {showIssueModal && <IssueModal equipment={selectedEquipment} onClose={() => setShowIssueModal(false)} />}
    </div>
  );
}
