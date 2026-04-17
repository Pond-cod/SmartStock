"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { 
  CheckCircle2, XCircle, Clock, User, Layers, 
  ArrowRight, FileText, Check, X, RefreshCw, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApprovalCenterPage() {
  const { actionRequests, approveActionRequest, rejectActionRequest, isLoading, refreshData } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const canAccess = currentUser && ['Admin', 'admin_approve', 'super Admin'].includes(currentUser.Role);
  
  if (!canAccess) {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  const filteredRequests = actionRequests
    .filter(req => req.Status === activeTab)
    .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    const success = await approveActionRequest(id);
    if (success) {
      toast.success('อนุมัติการดำเนินการสำเร็จ ข้อมูลถูกอัปเดตแล้ว');
      await refreshData();
    } else {
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    }
    setIsProcessing(null);
  };

  const handleReject = async (id: string) => {
    setIsProcessing(id);
    const success = await rejectActionRequest(id);
    if (success) {
      toast.success('ปฏิเสธคำขอการดำเนินการแล้ว');
      await refreshData();
    } else {
      toast.error('เกิดข้อผิดพลาด');
    }
    setIsProcessing(null);
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'ADD': return { label: 'เพิ่มข้อมูล', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'EDIT': return { label: 'แก้ไขข้อมูล', cls: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'DELETE': return { label: 'ลบข้อมูล', cls: 'bg-red-50 text-red-600 border-red-100' };
      default: return { label: type, cls: 'bg-slate-50 text-slate-600' };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            ศูนย์การอนุมัติ (Approval Center)
          </h1>
          <p className="text-sm text-slate-500 font-medium">จัดการและตรวจสอบคำขอการเปลี่ยนแปลงข้อมูลพัสดุ</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('Pending')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'Pending' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Clock className="w-3 h-3" /> รออนุมัติ
            {actionRequests.filter(r => r.Status === 'Pending').length > 0 && (
              <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                {actionRequests.filter(r => r.Status === 'Pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('Approved')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'Approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว
          </button>
          <button 
            onClick={() => setActiveTab('Rejected')} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'Rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <XCircle className="w-3 h-3" /> ปฏิเสธแล้ว
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-10 h-10 animate-spin" />
            <p className="font-bold">กำลังโหลดคำขอ...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-400">ไม่พบรายการ{activeTab === 'Pending' ? 'ที่รออนุมัติ' : activeTab === 'Approved' ? 'ที่อนุมัติแล้ว' : 'ที่ปฏิเสธ'}</h3>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const act = getActionLabel(req.ActionType);
            const payload = JSON.parse(req.Payload);
            const itemName = payload.Name || payload.CategoryName || payload.PersonnelID || payload.DepartmentName || payload.Username || 'ข้อมูลทั่วไป';

            return (
              <div key={req.RequestID} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 md:w-2/3 border-r border-slate-50">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${act.cls}`}>
                        {act.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">ID: {req.RequestID}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Layers className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">โมดูล: {req.TargetSheet}</p>
                           <h3 className="font-bold text-slate-800 text-lg">{itemName}</h3>
                         </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                        <pre className="text-[10px] text-slate-500 overflow-auto max-h-32 scrollbar-none font-mono">
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/30 p-6 md:w-1/3 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ผู้ส่งคำขอ</p>
                          <p className="text-sm font-bold text-slate-700">{req.RequesterUser} ({req.RequesterRole})</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่ส่งคำขอ</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(req.CreatedAt).toLocaleString('th-TH')}</p>
                        </div>
                      </div>
                    </div>

                    {activeTab === 'Pending' ? (
                      <div className="flex gap-2 mt-6">
                        <button 
                          onClick={() => handleReject(req.RequestID)}
                          disabled={isProcessing === req.RequestID}
                          className="flex-1 py-3 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          {isProcessing === req.RequestID ? <RefreshCw className="w-3 h-3 animate-spin"/> : <X className="w-3 h-3" />}
                          ปฏิเสธ
                        </button>
                        <button 
                          onClick={() => handleApprove(req.RequestID)}
                          disabled={isProcessing === req.RequestID}
                          className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          {isProcessing === req.RequestID ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
                          อนุมัติ
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ดำเนินการโดย</p>
                        <p className="text-sm font-bold text-slate-700">{req.ApproverUser || 'ไม่ระบุ'}</p>
                        <p className="text-[10px] text-slate-400">{req.ApprovedAt ? new Date(req.ApprovedAt).toLocaleString('th-TH') : ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-amber-800 text-sm">หมายเหตุลำดับสิทธิ์การอนุมัติ</h4>
          <ul className="text-xs text-amber-700/80 mt-1 space-y-1 list-disc ml-4">
            <li>คำขอจากระดับ <strong>User</strong>: จะต้องได้รับอนุมัติจาก <strong>admin_approve</strong> หรื่อสูงกว่า</li>
            <li>คำขอ "ลบข้อมูล" จากระดับ <strong>admin_approve</strong>: จะต้องได้รับการอนุมัติจาก <strong>Admin</strong> เท่านั้น</li>
            <li>การอนุมัติจะส่งผลต่อฐานข้อมูลหลักทันที ไม่สามารถย้อนกลับได้</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
