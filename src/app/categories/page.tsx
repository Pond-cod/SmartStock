"use client"
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type CategoryForm = {
  CategoryID: string;
  CategoryName: string;
  Description: string;
};

const inputCls = (hasError: boolean) =>
  `w-full p-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
    hasError
      ? 'border-red-400 focus:ring-red-200 dark:border-red-500'
      : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary'
  }`;

export default function CategoriesPage() {
  const { categories, equipments, isLoading, createRecord, updateRecord, deleteRecord } = useData();
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>();

  useEffect(() => {
    if (currentUser && !['Admin', 'admin_approve', 'super Admin'].includes(currentUser.Role)) router.push('/');
  }, [currentUser, router]);

  if (!currentUser || !['Admin', 'admin_approve', 'super Admin'].includes(currentUser.Role)) return null;

  const openModal = (cat: any = null) => {
    setEditingCat(cat);
    if (cat) reset(cat);
    else reset({ CategoryID: `CAT-${Date.now()}`, CategoryName: '', Description: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingCat(null); reset(); };

  const onSubmit = async (data: CategoryForm) => {
    setIsSubmitting(true);
    setErrorMsg('');

    const isDuplicate = categories.some((c: any) =>
      c.CategoryName.toLowerCase() === data.CategoryName.toLowerCase() &&
      (!editingCat || c.CategoryID !== editingCat.CategoryID)
    );

    if (isDuplicate) {
      setErrorMsg('ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว');
      setIsSubmitting(false);
      return;
    }

    const success = editingCat ? await updateRecord("Categories", data) : await createRecord("Categories", data);

    if (success) {
      toast.success(editingCat ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่ใหม่สำเร็จ');
      closeModal();
    } else {
      setErrorMsg('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const isUsed = equipments.some(e => e.CategoryName === name);
    if (isUsed) {
      toast.error('ไม่สามารถลบหมวดหมู่ที่มีพัสดุใช้งานอยู่ได้');
      return;
    }

    if (!confirm(`คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`)) return;
    const success = await deleteRecord("Categories", { CategoryID: id });
    if (success) toast.success('ลบหมวดหมู่สำเร็จ');
    else toast.error('ไม่สามารถลบหมวดหมู่ได้');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            จัดการหมวดหมู่พัสดุ
          </h1>
          <p className="text-slate-500">จัดการประเภทและหมวดหมู่ของวัสดุครุภัณฑ์ในระบบ</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32" />
          ))
        ) : categories.map((cat) => (
          <div key={cat.CategoryID} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.CategoryID, cat.CategoryName)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{cat.CategoryName}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{cat.Description || 'ไม่มีคำอธิบาย'}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-400">
               <span>รหัส: {cat.CategoryID}</span>
               <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                 {equipments.filter(e => e.CategoryName === cat.CategoryName).length} รายการ
               </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {editingCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อหมวดหมู่</label>
                <input {...register('CategoryName', { required: true })} className={inputCls(!!errors.CategoryName)} placeholder="เช่น อุปกรณ์ไอที, เฟอร์นิเจอร์" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">คำอธิบาย</label>
                <textarea {...register('Description')} className={inputCls(false)} rows={3} placeholder="รายละเอียดเพิ่มเติมของหมวดหมู่..." />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">ยกเลิก</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                  {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {editingCat ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
