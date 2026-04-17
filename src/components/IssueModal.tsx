"use client"
import React, { useState } from 'react';
import { X, Send, User, ChevronRight, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface IssueModalProps {
  equipment: any;
  onClose: () => void;
}

export default function IssueModal({ equipment, onClose }: IssueModalProps) {
  const { issueAsset, personnel, departments } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
  });

  const selectedPersonnelID = watch('ReceiverID');

  React.useEffect(() => {
    if (selectedPersonnelID) {
      const per = personnel.find(p => p.PersonnelID === selectedPersonnelID);
      if (per && per.DepartmentID) setValue('ReceiverDepartment', per.DepartmentID);
    }
  }, [selectedPersonnelID, personnel, setValue]);

  const onSubmit = async (data: any) => {
    if (!equipment) return;
    setIsSubmitting(true);
    const receiver = personnel.find(p => p.PersonnelID === data.ReceiverID);
    const success = await issueAsset({
      EquipmentCode: equipment.EquipmentCode,
      Quantity: Number(data.Quantity),
      ReceiverName: receiver ? receiver.Name : data.ReceiverID,
      
      IssuerName: currentUser?.Username || 'system',
      ReturnDate: data.ReturnDate,
    }, currentUser?.Role === 'Admin' || currentUser?.Role === 'super Admin');

    if (success) {
      const isAdminActor = currentUser?.Role === 'Admin' || currentUser?.Role === 'super Admin';
      toast.success('ทำรายการเบิกพัสดุสำเร็จ' + (isAdminActor ? '' : ' (รอการอนุมัติจากผู้ดูแล)'));
      onClose();
    } else {
      toast.error('ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary text-white shadow-lg"><Send className="w-5 h-5" /></div>
             <h2 className="text-xl font-black text-slate-800">ทำรายการเบิกพัสดุ</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary"><Package className="w-6 h-6" /></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">พัสดุที่เลือก</p>
                <p className="font-bold text-slate-700">{equipment?.Name}</p>
                <p className="text-xs text-slate-400">คงเหลือในสต็อก: {equipment?.Quantity} {equipment?.Unit}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">จำนวนที่เบิก</label>
               <input type="number" {...register('Quantity', { required: true, min: 1, max: Number(equipment?.Quantity) })} className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none font-bold" />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">กำหนดคืน (ถ้ามี)</label>
               <input type="date" {...register('ReturnDate')} className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none" />
             </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ผู้รับพัสดุ</label>
            <select {...register('ReceiverID', { required: true })} className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none appearance-none">
              <option value="">-- เลือกผู้รับพัสดุ --</option>
              {personnel.map(p => <option key={p.PersonnelID} value={p.PersonnelID}>{p.Name} ({p.Position})</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">หมายเหตุเพิ่มเติม</label>
            <textarea {...register('Notes')} rows={2} className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none resize-none" placeholder="ระบุวัตถุประสงค์ หรือ ข้อมูลเพิ่มเติม..."></textarea>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-[1.25rem] font-black text-slate-400 hover:bg-slate-50 transition-all">ยกเลิก</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              ยืนยันการเบิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
