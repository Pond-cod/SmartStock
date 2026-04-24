"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Search, Package, Download, QrCode, Printer, Send, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import Tooltip from '@/components/Tooltip';
import * as XLSX from 'xlsx';
import QRCodeModal from '@/components/QRCodeModal';
import IssueModal from '@/components/IssueModal';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type EquipmentForm = {
  EquipmentCode: string;
  Name: string;
  CategoryName: string;
  Quantity: number;
  Unit: string;
  PricePerUnit: number;
  Location: string;
  Status: string;
  Notes: string;
  ImageURL?: string;
};

const inputCls = (hasError: boolean) =>
  `w-full p-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
    hasError
      ? 'border-red-400 focus:ring-red-200 dark:border-red-500'
      : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary'
  }`;

const EquipmentRow = React.memo(({ eq, i, canEdit, openQR, openModal, openIssue, openDetails, handleDelete }: any) => {
  const isOut = eq.Status === 'Issued' || Number(eq.Quantity) <= 0;
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{eq.EquipmentCode}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {eq.ImageURL ? (
            <img 
              src={eq.ImageURL} 
              alt={eq.Name} 
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={clsx("w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 fallback-icon", eq.ImageURL && "hidden")}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">{eq.Name}</div>
            {eq.Notes && <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5">{eq.Notes}</div>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{eq.CategoryName || 'ไม่ระบุหมวดหมู่'}</span>
      </td>
      <td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-slate-100 hidden md:table-cell">
        {Number(eq.Quantity).toLocaleString()} <span className="text-xs text-slate-400 font-normal">{eq.Unit}</span>
      </td>
      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{eq.Location || '-'}</td>
      <td className="px-6 py-4">
        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          eq.Status === 'Active'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
          eq.Status === 'Broken'   ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
          eq.Status === 'Issued'   ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
        )}>
          {eq.Status === 'Active' ? 'พร้อมใช้งาน' : eq.Status === 'Broken' ? 'ชำรุด' : eq.Status === 'Issued' ? 'ถูกเบิกไป' : 'จำหน่ายออก'}
        </span>
      </td>
      <td className="px-3 py-4 text-center">
        <div className="flex justify-center gap-1.5">
          <Tooltip text="ดูรายละเอียดพัสดุ">
            <button
              onClick={() => openDetails(eq)}
              className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text="ทำรายการเบิกพัสดุ">
            <button
              onClick={() => openIssue(eq)}
              disabled={isOut}
              className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text={`QR Code: ${eq.Name}`}>
            <button
              onClick={() => openQR(eq)}
              className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[var(--primary)] hover:text-white text-slate-500 flex items-center justify-center transition-all"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </td>
      {canEdit && (
        <td className="px-6 py-4">
          <div className="flex justify-end gap-2">
            <button onClick={() => openModal(eq)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-[var(--primary)] hover:bg-blue-50 flex items-center justify-center transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(eq)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

EquipmentRow.displayName = 'EquipmentRow';

export default function EquipmentsPage() {
  const { equipments, categories, isLoading, createRecord, updateRecord, deleteRecord, uploadImage, refreshData } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [qrEquipment, setQrEquipment] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrBatchMode, setQrBatchMode] = useState(false);
  const [issueEquipment, setIssueEquipment] = useState<any>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsEq, setDetailsEq] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipmentForm>();
  const canEdit = currentUser && ['Admin', 'admin_approve', 'super Admin'].includes(currentUser.Role);

  const searchParams = useSearchParams();
  const router = useRouter();

  const filteredEquipments = useMemo(() => {
    if (!searchQuery.trim()) return equipments;
    const lq = searchQuery.toLowerCase();
    return equipments.filter(eq =>
      (eq.EquipmentCode && String(eq.EquipmentCode).toLowerCase().includes(lq)) ||
      (eq.Name && String(eq.Name).toLowerCase().includes(lq)) ||
      (eq.CategoryName && String(eq.CategoryName).toLowerCase().includes(lq)) ||
      (eq.Location && String(eq.Location).toLowerCase().includes(lq)) ||
      (eq.Status && String(eq.Status).toLowerCase().includes(lq))
    );
  }, [equipments, searchQuery]);

  useEffect(() => {
    const code = searchParams.get('issue');
    if (code && equipments.length > 0) {
      const eq = equipments.find(e => e.EquipmentCode === code);
      if (eq) {
        setIssueEquipment(eq);
        setShowIssueModal(true);
        router.replace('/equipments', { scroll: false });
      }
    }
  }, [searchParams, equipments, router]);

  const openQR = (eq: any) => { setQrEquipment(eq); setQrBatchMode(false); setShowQRModal(true); };
  const openQRBatch = () => { setQrEquipment(filteredEquipments[0] ?? null); setQrBatchMode(true); setShowQRModal(true); };
  const closeQR = () => { setShowQRModal(false); setQrEquipment(null); };

  const openIssue = (eq: any) => { setIssueEquipment(eq); setShowIssueModal(true); };
  const closeIssue = () => { setIssueEquipment(null); setShowIssueModal(false); };
  
  const openDetails = (eq: any) => { setDetailsEq(eq); setIsDetailsModalOpen(true); };
  const closeDetails = () => { setDetailsEq(null); setIsDetailsModalOpen(false); };

  const openModal = (eq: any = null) => {
    if (!canEdit) return;
    setEditingEq(eq);
    setImageFile(null);
    setPreviewUrl(eq?.ImageURL || null);
    if (eq) {
      reset(eq);
    } else {
      reset({
        EquipmentCode: `EQ-${Date.now().toString().slice(-6)}`,
        Name: '', CategoryName: '', Quantity: 1, Unit: 'ชิ้น', PricePerUnit: 0, Location: '', Status: 'Active', Notes: '', ImageURL: ''
      });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingEq(null); setImageFile(null); setPreviewUrl(null); reset(); };

  const onSubmit = async (data: EquipmentForm) => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    // Check for duplicate EquipmentCode (only for NEW records)
    if (!editingEq) {
      const isDuplicate = equipments.some((eq: any) => eq.EquipmentCode === data.EquipmentCode);
      if (isDuplicate) {
        setErrorMsg(`รหัสพัสดุ "${data.EquipmentCode}" ถูกใช้ไปแล้วในระบบ กรุณาใช้รหัสอื่น`);
        setIsSubmitting(false);
        return;
      }
    }
    
    let finalImageUrl = data.ImageURL || '';
    let optimisticTimeout = false;
    
    if (imageFile) {
      try {
        const uploadRes = await uploadImage(imageFile, data.EquipmentCode);
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          // TOTAL OPTIMISTIC POLICY
          const errorMsg = (uploadRes.error || '').toLowerCase();
          if (errorMsg.includes('large') || errorMsg.includes('413')) {
            toast.error("ไฟล์รูปภาพใหญ่เกินไป (Payload Too Large) กรุณาลดขนาดภาพก่อนอัปโหลด");
            setIsSubmitting(false);
            return;
          }
          
          const now = new Date();
          now.setSeconds(now.getSeconds() + 25); // Estimated background sync time
          const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          toast.info(`📷 ระบบกำลังแอบผูกลิ้งค์ภาพให้เบื้องหลัง... จะเสร็จสมบูรณ์ประมาณ ${timeStr}`);

          // Secondary notification when sync is likely done
          setTimeout(() => {
            toast.success(`✅ การซิงค์ภาพพัสดุ ${data.EquipmentCode} ในพื้นหลังน่าจะเสร็จสิ้นแล้ว! (กรุณา Refresh หน้าจอเพื่อดูรูปภาพ)`);
            refreshData(); // Attempt to refresh local context
          }, 25000);
          
          optimisticTimeout = true;
        }
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปโหลดพัสดุ');
        setIsSubmitting(false);
        return;
      }
    }
    
    const finalData = { ...data, ImageURL: finalImageUrl };
    
    // Prevent race condition: if it timed out, the background GAS is linking it. 
    // If we send the old ImageURL now, it might overwrite the GAS linked one.
    if (imageFile && optimisticTimeout) {
      delete (finalData as any).ImageURL;
    }

    const res = editingEq ? await updateRecord('Equipments', finalData) : await createRecord('Equipments', finalData);
    
    if (res.success) {
      toast.success(editingEq ? `แก้ไขข้อมูล "${data.Name}" สำเร็จ` : `เพิ่มพัสดุ "${data.Name}" เข้าสู่ระบบแล้ว`);
      closeModal();
    } else {
      setErrorMsg(res.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (eq: any) => {
    if (!canEdit) return;
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพัสดุ "${eq.Name}" (${eq.EquipmentCode})?`)) {
      const res = await deleteRecord('Equipments', { EquipmentCode: eq.EquipmentCode });
      if (res.success) {
        toast.success('ลบข้อมูลพัสดุเรียบร้อยแล้ว');
      } else {
        toast.error(res.error || 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const exportExcel = () => {
    const rows = filteredEquipments.map(eq => ({
      'รหัสพัสดุ': eq.EquipmentCode || '',
      'ชื่อพัสดุ': eq.Name || '',
      'หมวดหมู่': eq.CategoryName || '',
      'จำนวน': eq.Quantity || 0,
      'หน่วย': eq.Unit || '',
      'ราคา/หน่วย': Number(eq.PricePerUnit) || 0,
      'ราคารวม': (Number(eq.Quantity) || 0) * (Number(eq.PricePerUnit) || 0),
      'สถานที่จัดเก็บ': eq.Location || '',
      'สถานะ': eq.Status === 'Active' ? 'พร้อมใช้งาน' : eq.Status === 'Broken' ? 'ชำรุด' : 'อื่นๆ',
      'วันที่เพิ่ม': eq.CreatedAt ? new Date(eq.CreatedAt).toLocaleString('th-TH') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipments');
    XLSX.writeFile(wb, `inventory_report_${Date.now()}.xlsx`);
    toast.success('ส่งออกข้อมูล Excel สำเร็จ');
  };

  const colSpan = canEdit ? 8 : 7;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> จัดการรายการพัสดุ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">จัดการข้อมูลวัสดุ ครุภัณฑ์ และทำรายการเบิก-จ่าย</p>
        </div>
        <div className="flex gap-2 h-fit">
          <Tooltip text="พิมพ์ QR Code ทั้งหมดที่แสดง">
            <button onClick={openQRBatch} disabled={filteredEquipments.length === 0}
              className="btn-secondary text-sm px-4 min-h-[44px] py-2.5 flex items-center gap-2 disabled:opacity-50">
              <Printer className="w-4 h-4" /> <span className="hidden md:inline">พิมพ์ QR</span>
            </button>
          </Tooltip>
          <Tooltip text="ส่งออกไฟล์ Excel (.xlsx)">
            <button onClick={exportExcel} className="btn-secondary text-sm px-4 min-h-[44px] py-2.5 flex items-center gap-2">
              <Download className="w-4 h-4" /> <span className="hidden md:inline">Excel</span>
            </button>
          </Tooltip>
          {canEdit && (
            <button onClick={() => openModal()} className="btn-primary text-sm shadow-blue-500/20 shadow-lg">
              <Plus className="w-4 h-4" /> เพิ่มพัสดุใหม่
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาด้วยรหัส, ชื่อพัสดุ, หรือหมวดหมู่..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">พบทั้งหมด {filteredEquipments.length} รายการ</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px] font-black">
              <tr>
                <th className="px-6 py-4">รหัสพัสดุ</th>
                <th className="px-6 py-4">ชื่อพัสดุ / รายละเอียด</th>
                <th className="px-6 py-4 hidden sm:table-cell">หมวดหมู่</th>
                <th className="px-6 py-4 text-right hidden md:table-cell">คงเหลือ</th>
                <th className="px-6 py-4 hidden lg:table-cell">ที่เก็บ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">ทำรายการ</th>
                {canEdit && <th className="px-6 py-4 text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={colSpan} className="text-center py-12 text-slate-500 italic">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredEquipments.length === 0 ? (
                <tr><td colSpan={colSpan} className="text-center py-12 text-slate-500 italic font-medium">ไม่พบข้อมูลที่ค้นหา</td></tr>
              ) : (
                filteredEquipments.map((eq, i) => (
                  <EquipmentRow
                    key={eq.EquipmentCode || i}
                    eq={eq} i={i} canEdit={canEdit}
                    openQR={openQR} openModal={openModal} openIssue={openIssue} openDetails={openDetails} handleDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showQRModal && <QRCodeModal equipment={qrEquipment} allEquipments={qrBatchMode ? filteredEquipments : [qrEquipment]} onClose={closeQR} />}
      {showIssueModal && <IssueModal equipment={issueEquipment} onClose={closeIssue} />}

      {isDetailsModalOpen && detailsEq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="relative h-64 sm:h-80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {detailsEq.ImageURL ? (
                <img 
                  src={detailsEq.ImageURL} 
                  alt={detailsEq.Name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.details-fallback')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={clsx("w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 details-fallback", detailsEq.ImageURL && "hidden")}>
                <Package className="w-24 h-24 text-slate-300 dark:text-slate-700" />
              </div>
              <div className="absolute top-4 right-4 group">
                <button 
                  onClick={closeDetails} 
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white transition-all shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white mb-2 shadow-lg">
                  {detailsEq.CategoryName || 'ไม่ระบุหมวดหมู่'}
                </div>
                <h2 className="text-3xl font-black text-white drop-shadow-md">{detailsEq.Name}</h2>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">รหัสพัสดุ (Equipment Code)</label>
                  <div className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{detailsEq.EquipmentCode}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">จำนวนคงเหลือ</label>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {Number(detailsEq.Quantity).toLocaleString()} <span className="text-sm font-normal text-slate-400">{detailsEq.Unit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">ราคาต่อหน่วย</label>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      ฿{Number(detailsEq.PricePerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">สถานที่จัดเก็บ</label>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    {detailsEq.Location || 'ไม่ระบุสถานที่'}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">สถานะปัจจุบัน</label>
                  <div className={clsx('inline-flex items-center px-4 py-1.5 rounded-xl font-bold border transition-all shadow-sm',
                    detailsEq.Status === 'Active'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                    detailsEq.Status === 'Broken'   ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                    detailsEq.Status === 'Issued'   ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  )}>
                    <div className={clsx('w-2 h-2 rounded-full mr-2 animate-pulse', 
                      detailsEq.Status === 'Active' ? 'bg-emerald-500' : 
                      detailsEq.Status === 'Broken' ? 'bg-red-500' : 'bg-blue-500'
                    )}/>
                    {detailsEq.Status === 'Active' ? 'พร้อมใช้งาน' : detailsEq.Status === 'Broken' ? 'ชำรุด' : detailsEq.Status === 'Issued' ? 'ถูกเบิกไป' : 'จำหน่ายออก'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">หมายเหตุ / ข้อมูลเพิ่มเติม</label>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {detailsEq.Notes || 'ไม่มีข้อมูลเพิ่มเติม'}
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <button 
                   onClick={() => { closeDetails(); openIssue(detailsEq); }}
                   disabled={detailsEq.Status === 'Issued' || Number(detailsEq.Quantity) <= 0}
                   className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 shadow-blue-500/20 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" /> ทำรายการเบิก
                  </button>
                  <button 
                   onClick={() => { closeDetails(); openQR(detailsEq); }}
                   className="btn-secondary w-14 h-full flex items-center justify-center"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingEq ? 'แก้ไขข้อมูลพัสดุ' : 'เพิ่มพัสดุใหม่เข้าสู่ระบบ'}</h2>
              <button disabled={isSubmitting} onClick={closeModal} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 transition-colors disabled:opacity-50"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start mb-6 border border-red-100"><AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />{errorMsg}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">รูปภาพพัสดุ (อัปโหลดขึ้น Google Drive)</label>
                  <div className="flex items-center gap-4">
                    {previewUrl ? (
                      <div className="relative w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden group">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                          onError={() => setPreviewUrl('')}
                        />
                        <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(''); }} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"><X className="w-6 h-6"/></button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-slate-500 w-full" 
                      />
                      <p className="text-[10px] text-slate-400 mt-2">รองรับไฟล์ JPG, PNG หรือถ่ายจากกล้องมือถือโดยตรง</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">รหัสพัสดุ <span className="text-red-500">*</span></label>
                  <input {...register('EquipmentCode', { required: 'กรุณาระบุรหัสพัสดุ' })} className={`${inputCls(!!errors.EquipmentCode)} ${editingEq ? 'opacity-60' : ''}`} readOnly={!!editingEq} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">ชื่อพัสดุ <span className="text-red-500">*</span></label>
                  <input {...register('Name', { required: 'กรุณาระบุชื่อพัสดุ' })} className={inputCls(!!errors.Name)} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">หมวดหมู่ <span className="text-red-500">*</span></label>
                  <select {...register('CategoryName', { required: 'กรุณาเลือกหมวดหมู่' })} className={inputCls(!!errors.CategoryName)}>
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((cat: any) => <option key={cat.CategoryID} value={cat.CategoryName}>{cat.CategoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">สถานะ</label>
                  <select {...register('Status')} className={inputCls(false)}>
                    <option value="Active">Active (ปกติ)</option>
                    <option value="Broken">Broken (ชำรุด)</option>
                    <option value="Disposed">Disposed (จำหน่ายออก)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">จำนวน</label>
                    <input type="number" {...register('Quantity')} className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">หน่วยนับ</label>
                    <input {...register('Unit')} placeholder="เช่น ชิ้น, ชุด" className={inputCls(false)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">ราคาต่อหน่วย (บาท)</label>
                  <input type="number" step="0.01" {...register('PricePerUnit')} className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">สถานที่เก็บ / ห้อง</label>
                  <input {...register('Location')} placeholder="เช่น ห้องพัสดุ, ชั้น 2, ตู้ A3" className={inputCls(false)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1 ml-1">หมายเหตุ</label>
                  <textarea {...register('Notes')} rows={2} className={inputCls(false)} placeholder="ข้อมูลเพิ่มเติม เช่น รุ่น, ยี่ห้อ, เลขซีเรียล"></textarea>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all text-sm">ยกเลิก</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm flex items-center gap-2">
                  {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Plus className="w-4 h-4" />}
                  {editingEq ? 'บันทึกการแก้ไข' : 'เพิ่มพัสดุใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
