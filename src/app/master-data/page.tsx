"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Users, Building2, Save, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';

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

  if (!currentUser || currentUser.Role !== 'Admin') return null;

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
    const success = editingItem ? await updateRecord('Personnel', payload) : await createRecord('Personnel', payload);
    if (success) { toast.success('บันทึกข้อมูลบุคลากรสำเร็จ'); closeModal(); }
    else { toast.error('ไม่สามารถบันทึกข้อมูลได้'); }
    setIsSubmitting(false);
  };

  const onDeptSubmit = async (data: any) => {
    setIsSubmitting(true);
    const success = editingItem ? await updateRecord('Departments', data) : await createRecord('Departments', data);
    if (success) { toast.success('บันทึกข้อมูลแผนกสำเร็จ'); closeModal(); }
    else { toast.error('ไม่สามารถบันทึกข้อมูลได้'); }
    setIsSubmitting(false);
  };

  const handleDelete = async (item: any) => {
    const itemName = activeTab === 'personnel' ? `${item.name} ${item.Surname}` : item.DepartmentName;
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${itemName}"?`)) {
      const idField = activeTab === 'personnel' ? 'PersonnelID' : 'DepartmentID';
      const sheet = activeTab === 'personnel' ? 'Personnel' : 'Departments';
      const success = await deleteRecord(sheet, { [idField]: item[idField] });
      if (success) {
        toast.success('ลบข้อมูลสำเร็จ');
      } else {
        toast.error('ไม่สามารถลบข้อมูลได้');
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

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-100">
            {activeTab === 'personnel' ? (
              <tr><th className="px-6 py-4">รหัส</th><th className="px-6 py-4">ชื่อ-นามสกุล</th><th className="px-6 py-4">แผนก</th><th className="px-6 py-4 hidden md:table-cell">ตำแหน่ง / เบอร์โทร</th><th className="px-6 py-4 text-right">จัดการ</th></tr>
            ) : (
              <tr><th className="px-6 py-4">รหัสแผนก</th><th className="px-6 py-4">ชื่อแผนก/ฝ่าย</th><th className="px-6 py-4 text-right">จัดการ</th></tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
               <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic">กำลังโหลดข้อมูล...</td></tr>
            ) : activeTab === 'personnel' ? (
              personnel.map(p => (
                <tr key={p.PersonnelID} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400 text-xs">{p.PersonnelID}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{p.name} {p.Surname}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{departments.find(d => d.DepartmentID === p.department)?.DepartmentName || p.department}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="text-slate-600 font-bold text-xs">{p['ตำแหน่ง'] || '-'}</div>
                    <div className="text-slate-400 text-[10px]">{p['phone number'] || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            ) : (
              departments.map(d => (
                <tr key={d.DepartmentID} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400 text-xs">{d.DepartmentID}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{d.DepartmentName}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(d)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
}"w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none" /></div>
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
