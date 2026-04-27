"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Users, Building2, Save, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import AdaptiveTable, { ColumnDef } from '@/components/AdaptiveTable';

export default function MasterDataPage() {
  const { personnel, departments, isLoading, createRecord, updateRecord, deleteRecord } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'personnel' | 'departments'>('personnel');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pForm = useForm();
  const dForm = useForm();

  if (!currentUser || (currentUser.Role !== 'Admin' && currentUser.Role !== 'super Admin')) return null;

  const openModal = (item: any = null) => {
    setEditingItem(item);
    if (activeTab === 'personnel') {
      if (item) {
        pForm.reset({ 
          PersonnelID: item.PersonnelID,
          name: item.name || '',
          Surname: item.Surname || '',
          department: item.department || '',
          'phone number': item['phone number'] || '',
          'ตำแหน่ง': item['ตำแหน่ง'] || ''
        });
      }
      else pForm.reset({ PersonnelID: `P-${Date.now()}`, name: '', Surname: '', department: '', 'phone number': '', 'ตำแหน่ง': '' });
    } else {
      if (item) dForm.reset(item);
      else dForm.reset({ DepartmentID: `D-${Date.now()}`, DepartmentName: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); pForm.reset(); dForm.reset(); };

  const onPersonnelSubmit = async (data: any) => {
    setIsSubmitting(true);
    // Sync 'Name' (legacy) if needed, but the sheet uses 'name'
    const payload = { ...data, Name: `${data.name} ${data.Surname}`.trim() };
    const res = editingItem ? await updateRecord('Personnel', payload) : await createRecord('Personnel', payload);
    if (res.success) { 
      toast.success(res.message || 'บันทึกข้อมูลบุคลากรสำเร็จ'); 
      closeModal(); 
    }
    else { toast.error(res.error || 'ไม่สามารถบันทึกข้อมูลได้'); }
    setIsSubmitting(false);
  };

  const onDeptSubmit = async (data: any) => {
    setIsSubmitting(true);
    const res = editingItem ? await updateRecord('Departments', data) : await createRecord('Departments', data);
    if (res.success) { 
      toast.success(res.message || 'บันทึกข้อมูลแผนกสำเร็จ'); 
      closeModal(); 
    }
    else { toast.error(res.error || 'ไม่สามารถบันทึกข้อมูลได้'); }
    setIsSubmitting(false);
  };

  const handleDelete = async (item: any) => {
    const itemName = activeTab === 'personnel' ? `${item.name} ${item.Surname}` : item.DepartmentName;
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${itemName}"?`)) {
      const idField = activeTab === 'personnel' ? 'PersonnelID' : 'DepartmentID';
      const sheet = activeTab === 'personnel' ? 'Personnel' : 'Departments';
      const res = await deleteRecord(sheet, { [idField]: item[idField] });
      if (res.success) {
        toast.success(res.message || 'ลบข้อมูลสำเร็จ');
      } else {
        toast.error(res.error || 'ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('personnel')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'personnel' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>บุคลากร</button>
          <button onClick={() => setActiveTab('departments')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'departments' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>แผนก/ฝ่าย</button>
        </div>
        <button onClick={() => openModal()} className="btn-primary px-6 rounded-xl"><Plus className="w-4 h-4 mr-2" /> เพิ่มข้อมูล</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-0">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 italic">กำลังโหลดข้อมูล...</div>
        ) : activeTab === 'personnel' ? (
          <AdaptiveTable<any>
            columns={[
              { header: 'รหัส', accessorKey: 'PersonnelID', cell: (row) => <span className="font-bold text-slate-400 text-xs">{row.PersonnelID}</span> },
              { header: 'ชื่อ-นามสกุล', accessorKey: 'name', cell: (row) => <span className="font-bold text-slate-700">{row.name} {row.Surname}</span> },
              { header: 'แผนก', accessorKey: 'department', cell: (row) => <span className="text-slate-500 font-medium">{departments.find(d => d.DepartmentID === row.department)?.DepartmentName || row.department}</span> },
              { 
                header: 'ตำแหน่ง / เบอร์โทร', 
                accessorKey: 'ตำแหน่ง', 
                hiddenOnMobile: true,
                cell: (row) => (
                  <div>
                    <div className="text-slate-600 font-bold text-xs">{row['ตำแหน่ง'] || '-'}</div>
                    <div className="text-slate-400 text-[10px]">{row['phone number'] || '-'}</div>
                  </div>
                )
              },
              {
                header: 'จัดการ',
                accessorKey: 'actions',
                cell: (row) => (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )
              }
            ]}
            data={personnel}
            keyExtractor={(row) => row.PersonnelID}
            mobileCardTitleAccessor="name"
            mobileCardSubtitleAccessor="PersonnelID"
            mobileActions={(row) => (
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-600 bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          />
        ) : (
          <AdaptiveTable<any>
            columns={[
              { header: 'รหัสแผนก', accessorKey: 'DepartmentID', cell: (row) => <span className="font-bold text-slate-400 text-xs">{row.DepartmentID}</span> },
              { header: 'ชื่อแผนก/ฝ่าย', accessorKey: 'DepartmentName', cell: (row) => <span className="font-bold text-slate-700">{row.DepartmentName}</span> },
              {
                header: 'จัดการ',
                accessorKey: 'actions',
                cell: (row) => (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )
              }
            ]}
            data={departments}
            keyExtractor={(row) => row.DepartmentID}
            mobileCardTitleAccessor="DepartmentName"
            mobileCardSubtitleAccessor="DepartmentID"
            mobileActions={(row) => (
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 text-red-600 bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h2 className="text-xl font-black text-slate-800">{editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h2><button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button></div>
            <div className="p-6">
              {activeTab === 'personnel' ? (
                <form onSubmit={pForm.handleSubmit(onPersonnelSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">ชื่อ</label><input {...pForm.register('name', { required: true })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" placeholder="สมชาย" /></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">นามสกุล</label><input {...pForm.register('Surname', { required: true })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" placeholder="ใจดี" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">ตำแหน่ง</label><input {...pForm.register('ตำแหน่ง')} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" placeholder="เจ้าหน้าที่พัสดุ" /></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">แผนก</label><select {...pForm.register('department', { required: true })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none appearance-none"><option value="">-- เลือกแผนก --</option>{departments.map(d => <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">เบอร์โทรศัพท์</label><input {...pForm.register('phone number')} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" placeholder="08x-xxxxxxx" /></div>
                  </div>
                  <div className="pt-4 flex gap-3"><button type="button" onClick={closeModal} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="flex-1 py-3 font-black text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">{isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}บันทึก</button></div>
                </form>
              ) : (
                <form onSubmit={dForm.handleSubmit(onDeptSubmit)} className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">ชื่อแผนก/ฝ่าย</label><input {...dForm.register('DepartmentName', { required: true })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" /></div>
                  <div className="pt-4 flex gap-3"><button type="button" onClick={closeModal} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="flex-1 py-3 font-black text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">{isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}บันทึก</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
