"use client"
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Users as UsersIcon, Eye, EyeOff, Key , LogIn, Shield} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type UserForm = {
  Username: string;
  Password?: string;
  Role: string;
  name: string;
  Surname: string;
};

const inputCls = (hasError: boolean) =>
  `w-full p-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
    hasError
      ? 'border-red-400 focus:ring-red-200 dark:border-red-500'
      : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary'
  }`;

export default function UsersPage() {
  const { users, superAdmins, personnel, isLoading, createRecord, updateRecord, deleteRecord, rolePermissions } = useData();
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'standard' | 'super'>('standard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>();

  // Authorized if Admin or super Admin
  const isAuthorized = currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'super Admin');
  const isSuper = currentUser?.Role === 'super Admin';

  useEffect(() => {
    if (currentUser && !isAuthorized) router.push('/');
  }, [currentUser, isAuthorized, router]);

  if (!currentUser || !isAuthorized) return null;

  const currentSheet = activeTab === 'standard' ? 'Users' : 'super Admin';
  const displayUsers = activeTab === 'standard' ? users : superAdmins;

  const openModal = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      reset({ 
        Username: user.Username, 
        Password: '', 
        Role: user.Role, 
        name: user.name || user.FirstName || '', 
        Surname: user.Surname || user.LastName || '' 
      });
    }
    else {
      reset({ 
        Username: '', 
        Password: '', 
        Role: activeTab === 'super' ? 'super Admin' : 'user', 
        name: '', 
        Surname: '' 
      });
    }
    setErrorMsg('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSelectPersonnel = (pId: string) => {
    const person = personnel.find(p => p.PersonnelID === pId);
    if (person) {
      const fn = person.name || '';
      const ln = person.Surname || '';
      
      setValue('name', fn);
      setValue('Surname', ln);
      if (!editingUser) {
        const generatedUsername = fn.toLowerCase().replace(/\s/g, '') + '.' + (ln[0] || '').toLowerCase();
        setValue('Username', generatedUsername);
      }
    }
  };

  const closeModal = () => { setIsModalOpen(false); setEditingUser(null); reset(); };


  const onSubmit = async (data: UserForm) => {
    setIsSubmitting(true);
    setErrorMsg('');

    const isDuplicate = displayUsers.some((u: any) =>
      String(u.Username).toLowerCase() === String(data.Username).toLowerCase() &&
      (!editingUser || u.Username !== editingUser.Username)
    );

    if (isDuplicate) {
      setErrorMsg('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      setIsSubmitting(false);
      return;
    }

    const payload: any = {
      Username: data.Username,
      Role: data.Role,
      name: data.name,
      Surname: data.Surname,
      FirstName: data.name,
      LastName: data.Surname
    };
    if (data.Password) {
      payload.Password = data.Password;
    }

    // Target the appropriate sheet
    const success = editingUser ? await updateRecord(currentSheet, payload) : await createRecord(currentSheet, payload);

    if (success) {
      toast.success(editingUser ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
      closeModal();
    } else {
      setErrorMsg('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (username: string) => {
    if (activeTab === 'standard' && username === 'admin') {
      alert('ไม่สามารถลบบัญชี Admin หลักได้');
      return;
    }
    if (activeTab === 'super' && username === currentUser.Username) {
       alert('ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้');
       return;
    }

    if (!confirm(`คุณต้องการลบผู้ใช้งาน "${username}" ใช่หรือไม่?`)) return;
    const success = await deleteRecord(currentSheet, { Username: username });
    if (success) toast.success('ลบผู้ใช้งานสำเร็จ');
    else toast.error('ไม่สามารถลบผู้ใช้งานได้');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600" />
            จัดการผู้ใช้งานระบบ
          </h1>
          <p className="text-slate-500">จัดการข้อมูลและกำหนดสิทธิ์การใช้งานของผู้ใช้งานในระบบ</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> {activeTab === 'super' ? 'เพิ่ม Super Admin' : 'เพิ่มผู้ใช้งาน'}
        </button>
      </div>

      {isSuper && (
        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('standard')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-black transition-all",
              activeTab === 'standard' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            ผู้ใช้งานทั่วไป
          </button>
          <button 
            onClick={() => setActiveTab('super')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'super' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Shield className="w-4 h-4" /> ทีม Super Admin
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">ชื่อ-นามสกุล</th>
              <th className="px-6 py-4 text-center">สิทธิ์การใช้งาน</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               [...Array(3)].map((_, i) => (
                 <tr key={i} className="animate-pulse">
                   <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                   <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                   <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 mx-auto rounded-full" /></td>
                   <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-100 ml-auto rounded" /></td>
                 </tr>
               ))
            ) : displayUsers.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">ไม่พบข้อมูลในกลุ่มนี้</td>
               </tr>
            ) : displayUsers.map((user) => (
              <tr key={user.Username} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700">{user.Username}</td>
                <td className="px-6 py-4 text-slate-600">{user.name || user.FirstName} {user.Surname || user.LastName}</td>
                <td className="px-6 py-4 text-center">
                  <span className={clsx(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                    user.Role === 'super Admin' ? 'bg-indigo-600 text-white' : 
                    user.Role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {user.Role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => openModal(user)} 
                    disabled={!isSuper && user.Role === 'Admin'}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.Username)} 
                    disabled={(activeTab === 'standard' && user.Username === 'admin') || (activeTab === 'super' && user.Username === currentUser.Username) || (!isSuper && user.Role === 'Admin')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {editingUser ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                {editingUser ? 'แก้ไขผู้ใช้งาน' : activeTab === 'super' ? 'เพิ่ม Super Admin' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">ดึงข้อมูลจากรายชื่อพนักงาน</label>
                <select 
                  className={inputCls(false)}
                  onChange={(e) => handleSelectPersonnel(e.target.value)}
                >
                  <option value="">-- เลือกพนักงาน (เพื่อระบุข้อมูลอัตโนมัติ) --</option>
                  {personnel.map(p => (
                    <option key={p.PersonnelID} value={p.PersonnelID}>{p.name} {p.Surname}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อ</label>
                  <input {...register('name', { required: true })} className={inputCls(!!errors.name)} placeholder="สมชาย" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">นามสกุล</label>
                  <input {...register('Surname', { required: true })} className={inputCls(!!errors.Surname)} placeholder="ใจดี" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อผู้ใช้งาน (Username)</label>
                <input 
                  {...register('Username', { required: true })} 
                  className={inputCls(!!errors.Username)} 
                  placeholder="username" 
                  disabled={!!editingUser} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    {...register('Password', { required: !editingUser })} 
                    className={inputCls(!!errors.Password)} 
                    placeholder={editingUser ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "********"} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">สิทธิ์การใช้งาน (Role)</label>
                <select {...register('Role', { required: true })} className={inputCls(false)} disabled={activeTab === 'super'}>
                  {activeTab === 'super' ? (
                    <option value="super Admin">super Admin (สูงสุด)</option>
                  ) : (
                    <>
                      <option value="user">User (ดูข้อมูล)</option>
                      <option value="admin_approve">Admin Approve (เบิก-จ่าย)</option>
                      <option value="Admin">Admin (จัดการระบบ)</option>
                      {/* Dynamically show other roles from permissions if any */}
                      {rolePermissions
                        .filter((rp: any) => !['Admin', 'super Admin', 'user', 'admin_approve'].includes(rp.RoleName))
                        .map((rp: any) => (
                          <option key={rp.RoleName} value={rp.RoleName}>{rp.RoleName}</option>
                        ))}
                    </>
                  )}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">ยกเลิก</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                  {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
