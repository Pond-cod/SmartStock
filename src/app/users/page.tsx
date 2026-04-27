"use client"
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, AlertCircle, Users as UsersIcon, Eye, EyeOff, Key , LogIn, Shield} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AdaptiveTable, { ColumnDef } from '@/components/AdaptiveTable';

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
    const res = editingUser ? await updateRecord(currentSheet, payload) : await createRecord(currentSheet, payload);

    if (res.success) {
      toast.success(editingUser ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
      closeModal();
    } else {
      setErrorMsg(res.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
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
    const res = await deleteRecord(currentSheet, { Username: username });
    if (res.success) toast.success('ลบผู้ใช้งานสำเร็จ');
    else toast.error('ไม่สามารถลบผู้ใช้งานได้');
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const specials = "!@#$%^&*";
    let p = "";
    p += uppers[Math.floor(Math.random() * uppers.length)];
    p += chars[Math.floor(Math.random() * chars.length)];
    p += nums[Math.floor(Math.random() * nums.length)];
    p += specials[Math.floor(Math.random() * specials.length)];
    const all = chars + uppers + nums + specials;
    for(let i=0; i<4; i++) {
        p += all[Math.floor(Math.random() * all.length)];
    }
    return p.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleResetPassword = async (username: string) => {
    if (!confirm(`ยืนยันการตั้งรหัสผ่านใหม่ให้ ${username} ใช่หรือไม่?\nหลังจากล็อกอินครั้งถัดไป ระบบจะบังคับให้ตั้งรหัสใหม่ทันที`)) return;
    
    const np = generateStrongPassword();
    const payload = { Username: username, Password: np, MustChangePassword: 'TRUE' };
    
    const res = await updateRecord(currentSheet, payload);
    if (res.success) {
      window.prompt(`✅ รีเซ็ตรหัสผ่านสำเร็จ!\nให้คัดลอกรหัสผ่านใหม่ด้านล่างนี้ ส่งให้ ${username} เพื่อล็อกอินเข้าสู่ระบบ:`, np);
      toast.success(`ระบบได้ตั้งค่ายืนยันให้เปลี่ยนรหัสผ่านครั้งถัดไปสำหรับ ${username} แล้ว`);
    } else {
      toast.error('ไม่สามารถรีเซ็ตรหัสผ่านได้');
    }
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-0">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 italic">กำลังโหลดข้อมูล...</div>
        ) : (
          <AdaptiveTable<any>
            columns={[
              { header: 'Username', accessorKey: 'Username', cell: (row) => <span className="font-bold text-slate-700">{row.Username}</span> },
              { header: 'ชื่อ-นามสกุล', accessorKey: 'name', cell: (row) => <span className="text-slate-600">{row.name || row.FirstName} {row.Surname || row.LastName}</span> },
              { 
                header: 'สิทธิ์การใช้งาน', 
                accessorKey: 'Role', 
                cell: (row) => (
                  <span className={clsx(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                    row.Role === 'super Admin' ? 'bg-indigo-600 text-white' : 
                    row.Role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {row.Role}
                  </span>
                ) 
              },
              {
                header: 'จัดการ',
                accessorKey: 'actions',
                cell: (row) => (
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleResetPassword(row.Username); }} 
                      disabled={!isSuper && row.Role === 'Admin'}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30"
                      title="รีเซ็ตรหัสผ่าน"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(row); }} 
                      disabled={!isSuper && row.Role === 'Admin'}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                      title="แก้ไขผู้ใช้งาน"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(row.Username); }} 
                      disabled={(activeTab === 'standard' && row.Username === 'admin') || (activeTab === 'super' && row.Username === currentUser.Username) || (!isSuper && row.Role === 'Admin')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      title="ลบผู้ใช้งาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            ]}
            data={displayUsers}
            keyExtractor={(row) => row.Username}
            mobileCardTitleAccessor="Username"
            mobileCardSubtitleAccessor="Role"
            mobileActions={(row) => (
              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleResetPassword(row.Username); }} 
                  disabled={!isSuper && row.Role === 'Admin'}
                  className="p-2 text-emerald-600 bg-emerald-50 rounded-lg transition-colors disabled:opacity-30"
                  title="รีเซ็ตรหัสผ่าน"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal(row); }} 
                  disabled={!isSuper && row.Role === 'Admin'}
                  className="p-2 text-blue-600 bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                  title="แก้ไขผู้ใช้งาน"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(row.Username); }} 
                  disabled={(activeTab === 'standard' && row.Username === 'admin') || (activeTab === 'super' && row.Username === currentUser.Username) || (!isSuper && row.Role === 'Admin')}
                  className="p-2 text-red-600 bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  title="ลบผู้ใช้งาน"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        )}
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
