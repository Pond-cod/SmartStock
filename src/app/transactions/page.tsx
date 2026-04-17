"use client"
import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { History, ArrowUpRight, ArrowDownLeft, Calendar, User as UserIcon, Search, Filter, RefreshCcw, CheckCircle2, Clock, Package, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '@/components/Tooltip';

export default function TransactionsPage() {
  const { transactions, equipments, returnAsset, approveTransaction, rejectTransaction, isLoading } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ISSUE' | 'RETURN' | 'PENDING'>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdmin = currentUser?.Role === 'Admin' || currentUser?.Role === 'admin_approve' || currentUser?.Role === 'super Admin';

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        const matchesQuery =
          tx.EquipmentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.ReceiverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.IssuerName?.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesType = filterType === 'ALL' || tx.Type === filterType;
        if (filterType === 'PENDING') matchesType = tx.Status === 'Pending-Approve';
        return matchesQuery && matchesType;
      })
      .sort((a, b) => new Date(b.TransactionDate).getTime() - new Date(a.TransactionDate).getTime());
  }, [transactions, searchQuery, filterType]);

  const handleReturn = async (txId: string) => {
    if (confirm('ยืนยันการรับคืนพัสดุชิ้นนี้เข้าสู่สต็อก?')) {
      setIsProcessing(txId);
      const success = await returnAsset(txId);
      if (success) toast.success('รับคืนพัสดุและอัปเดตสต็อกเรียบร้อยแล้ว');
      else toast.error('เกิดข้อผิดพลาดในการรับคืน');
      setIsProcessing(null);
    }
  };

  const handleApprove = async (txId: string) => {
    if (confirm('อนุมัติรายการเบิกพัสดุนี้? ระบบจะหักจำนวนออกจากสต็อกทันที')) {
      setIsProcessing(txId);
      const success = await approveTransaction(txId);
      if (success) toast.success('อนุมัติรายการเบิกพัสดุสำเร็จ');
      else toast.error('ไม่สามารถอนุมัติได้ กรุณาลองใหม่อีกครั้ง');
      setIsProcessing(null);
    }
  };

  const handleReject = async (txId: string) => {
    if (confirm('ปฏิเสธรายการเบิกนี้? รายการจะถูกลบออกจากระบบ')) {
      setIsProcessing(txId);
      const success = await rejectTransaction(txId);
      if (success) toast.success('ยกเลิกรายการเบิกเรียบร้อยแล้ว');
      setIsProcessing(null);
    }
  };

  const activeLoans = transactions.filter(t => t.Type === 'ISSUE' && t.Status === 'Active').length;
  const pendingRequests = transactions.filter(t => t.Status === 'Pending-Approve').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><History className="w-6 h-6 text-blue-600" /> ประวัติเบิก-คืน</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ติดตามการเคลื่อนไหวของพัสดุในระบบ</p>
          </div>
        </div>
        <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center">
          <div><p className="text-blue-100 text-xs font-black uppercase">รายการที่ยังไม่คืน</p><h3 className="text-3xl font-bold mt-1">{activeLoans}</h3></div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><Clock className="w-6 h-6" /></div>
        </div>
        <div className={clsx("p-6 rounded-2xl shadow-lg flex justify-between items-center transition-all", pendingRequests > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400")}>
          <div><p className="text-xs font-black uppercase">รออนุมัติเบิก</p><h3 className="text-3xl font-bold mt-1">{pendingRequests}</h3></div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm"><AlertCircle className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="ค้นหาด้วยรหัส, ชื่อผู้เบิก, หรือผู้อนุมัติ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'ISSUE', 'RETURN'].map((type) => (
            <button key={type} onClick={() => setFilterType(type as any)} className={clsx("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", filterType === type ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
              {type === 'ALL' ? 'ทั้งหมด' : type === 'PENDING' ? 'รออนุมัติ' : type === 'ISSUE' ? 'การเบิก' : 'การคืน'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-black">
              <tr>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">พัสดุ / รหัส</th>
                <th className="px-6 py-4">ผู้ทำรายการ</th>
                <th className="px-6 py-4">จำนวน</th>
                <th className="px-6 py-4">วันที่</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-20 text-slate-400 italic">กำลังโหลดประวัติ...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-20 text-slate-400 italic">ไม่พบประวัติการทำรายการ</td></tr>
              ) : filteredTransactions.map((tx) => {
                const eq = equipments.find(e => e.EquipmentCode === tx.EquipmentCode);
                const isPending = tx.Status === 'Pending-Approve';
                const isActive = tx.Status === 'Active';
                const isIssue = tx.Type === 'ISSUE';
                return (
                  <tr key={tx.TransactionID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", isPending ? "bg-amber-100 text-amber-600" : isIssue ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>{isPending ? <Clock className="w-5 h-5" /> : isIssue ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}</div></td>
                    <td className="px-6 py-4"><div className="font-bold text-slate-700">{eq?.Name || 'ไม่พบข้อมูลพัสดุ'}</div><div className="text-xs text-slate-400">{tx.EquipmentCode}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">{tx.ReceiverName?.slice(0,2)}</div><span className="font-medium">{tx.ReceiverName}</span></div></td>
                    <td className="px-6 py-4 font-bold">{tx.Quantity} <span className="text-[10px] text-slate-400 font-normal">{eq?.Unit || 'หน่วย'}</span></td>
                    <td className="px-6 py-4 text-slate-500">{new Date(tx.TransactionDate).toLocaleDateString('th-TH')}</td>
                    <td className="px-6 py-4">
                      {isPending ? <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">รออนุมัติ</span> :
                       isActive ? <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">กำลังเบิก</span> :
                       <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">คืนแล้ว</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isPending && isAdmin && (
                          <>
                            <button onClick={() => handleApprove(tx.TransactionID)} disabled={!!isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">อนุมัติ</button>
                            <button onClick={() => handleReject(tx.TransactionID)} disabled={!!isProcessing} className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">ปฏิเสธ</button>
                          </>
                        )}
                        {isActive && isAdmin && (
                          <button onClick={() => handleReturn(tx.TransactionID)} disabled={!!isProcessing} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                            <RefreshCcw className={clsx("w-3 h-3", isProcessing === tx.TransactionID && "animate-spin")} /> รับคืน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
