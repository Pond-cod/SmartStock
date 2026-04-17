"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Shield, Plus, Save, Trash2, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const MODULES = [
  { id: 'Dashboard', name: 'แดชบอร์ด' },
  { id: 'Categories', name: 'หมวดหมู่' },
  { id: 'Equipments', name: 'รายการพัสดุ' },
  { id: 'Requisition', name: 'ทำรายการเบิก' },
  { id: 'Transactions', name: 'ประวัติเบิก-คืน (รวมอนุมัติ)' },
  { id: 'Reports', name: 'รายงานสรุป' },
  { id: 'MasterData', name: 'ข้อมูลหลัก (บุคลากร/แผนก)' },
  { id: 'Users', name: 'จัดการผู้ใช้งาน' },
];

const ACTIONS = [
  { id: 'view', name: 'ดู', color: 'bg-blue-100 text-blue-700' },
  { id: 'create', name: 'เพิ่ม', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'edit', name: 'แก้', color: 'bg-amber-100 text-amber-700' },
  { id: 'delete', name: 'ลบ', color: 'bg-red-100 text-red-700' },
  { id: 'approve', name: 'อนุมัติ', color: 'bg-purple-100 text-purple-700' },
];

export default function RolesPermissionsPage() {
  const { rolePermissions, users, createRecord, updateRecord, deleteRecord, isLoading } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Local state for interactive toggling without immediate refetch
  const [localPermissions, setLocalPermissions] = useState<any[]>([]);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // Sync local state when remote data changes, but only if not currently editing
  React.useEffect(() => {
    if (!isLoading && rolePermissions) {
      setLocalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
    }
  }, [rolePermissions, isLoading]);

  if (!currentUser || currentUser.Role !== 'super Admin') return null;

  // Filter out roles in User list that are not in RolePermissions
  const systemRoles = Array.from(new Set(users.map((u: any) => u.Role)))
    .filter(Boolean)
    .filter(r => r !== 'super Admin'); // Super Admin is strictly isolated
  
  const existingPermRoles = rolePermissions.map((r: any) => r.RoleName);
  const suggestedRoles = systemRoles.filter(r => !existingPermRoles.includes(r));

  const handleToggleLocal = (roleName: string, moduleId: string, actionId: string) => {
    setLocalPermissions(prev => prev.map(role => {
      if (role.RoleName !== roleName) return role;

      const currentActions = (role[moduleId] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      let newActions;
      if (currentActions.includes(actionId)) {
        newActions = currentActions.filter((a: string) => a !== actionId);
      } else {
        newActions = [...currentActions, actionId];
      }
      return { ...role, [moduleId]: newActions.join(',') };
    }));
  };

  const handleGrantAllLocal = (roleName: string, moduleId: string) => {
    if (!confirm(`คุณต้องการเปิดสิทธิ์ "ทั้งหมด" สำหรับ module นี้ใช่หรือไม่?`)) return;

    setLocalPermissions(prev => prev.map(role => {
      if (role.RoleName !== roleName) return role;
      const allActions = ACTIONS.map(a => a.id).join(',');
      return { ...role, [moduleId]: allActions };
    }));
  };

  const handleSaveRole = async (roleName: string) => {
    const roleData = localPermissions.find(r => r.RoleName === roleName);
    if (!roleData) return;

    setSavingRole(roleName);
    const res = await updateRecord('RolePermissions', roleData);
    if (res.success) {
      toast.success(`บันทึกสิทธิ์สำหรับ "${roleName}" สำเร็จ`);
    } else {
      toast.error(res.error || 'ไม่สามารถบันทึกข้อมูลได้');
    }
    setSavingRole(null);
  };

  const handleCreateRole = async (name: string) => {
    if (!name) return;
    if (name === 'super Admin') {
      alert('ไม่สามารถสร้าง Role ที่ใช้ชื่อสงวน "super Admin" ได้');
      return;
    }
    if (rolePermissions.some((r: any) => r.RoleName === name)) {
      alert('มีชื่อ Role นี้อยู่แล้ว');
      return;
    }

    const newRole: any = { RoleName: name };
    MODULES.forEach(m => newRole[m.id] = 'view'); // Default permission
    const res = await createRecord('RolePermissions', newRole);
    if (res.success) toast.success(`สร้างสิทธิ์สำหรับ Role "${name}" สำเร็จ`);
    else toast.error(res.error || 'ไม่สามารถสร้าง Role ได้');
  };

  const handleAddRolePrompt = async () => {
    const name = prompt('กรุณาระบุชื่อ Role ใหม่:');
    if (name) handleCreateRole(name);
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === 'Admin' || roleName === 'super Admin') {
      alert('ไม่สามารถลบสิทธิ์นี้ได้');
      return;
    }
    if (confirm(`คุณต้องการลบ Role "${roleName}" ใช่หรือไม่?`)) {
      const res = await deleteRecord('RolePermissions', { RoleName: roleName });
      if (res.success) toast.success('ลบ Role สำเร็จ');
      else toast.error(res.error || 'ไม่สามารถลบ Role ได้');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
              <Shield className="w-6 h-6 text-white" />
            </div>
            กำหนดสิทธิ์การใช้งาน (Roles & Permissions)
          </h1>
          <p className="text-slate-500 font-medium mt-1">ตั้งค่าสิทธิ์แยกตาม Module สำหรับแต่ละกลุ่มผู้ใช้งาน</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={handleAddRolePrompt} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2">
             <Plus className="w-5 h-5" /> สร้าง Role กำหนดเอง
           </button>
        </div>
      </div>

      {suggestedRoles.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] animate-in zoom-in-95">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-indigo-900">พบ Role ในระบบที่ยังไม่ได้กำหนดสิทธิ์:</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedRoles.map(role => (
              <button 
                key={role} 
                onClick={() => handleCreateRole(role)}
                className="bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-black border border-indigo-200 shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> เพิ่มสิทธิ์สำหรับ &quot;{role}&quot;
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {isLoading && localPermissions.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic flex flex-col items-center gap-4">
             <RefreshCw className="w-10 h-10 animate-spin text-indigo-200" />
             กำลังโหลดข้อมูลสิทธิ์...
          </div>
        ) : localPermissions.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200 text-slate-400">
            ยังไม่มีการกำหนดสิทธิ์เสริม (Role Permissions) ในระบบ
          </div>
        ) : (
          localPermissions
            .filter((r: any) => r.RoleName !== 'super Admin') // Hide super Admin from UI
            .map((role: any) => {
              const isSaving = savingRole === role.RoleName;
              const hasChanges = JSON.stringify(role) !== JSON.stringify(rolePermissions.find((r: any) => r.RoleName === role.RoleName));

              return (
                <div key={role.RoleName} className={clsx(
                  "bg-white rounded-[2.5rem] border overflow-hidden shadow-sm transition-all duration-300",
                  hasChanges ? "border-indigo-400 ring-4 ring-indigo-50 shadow-xl" : "border-slate-200"
                )}>
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                        {role.RoleName[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{role.RoleName}</h3>
                        {hasChanges && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-full">มีการแก้ไข</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                          onClick={() => handleSaveRole(role.RoleName)}
                          disabled={!hasChanges || isSaving}
                          className={clsx(
                            "px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
                            hasChanges ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-slate-200 text-slate-400"
                          )}
                       >
                         {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                         {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                       </button>
                       <button 
                         onClick={() => handleDeleteRole(role.RoleName)}
                         className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         title="ลบ Role"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
    
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">Module / Page</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 text-center">Permissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {MODULES.map((mod) => {
                          const allowed = (role[mod.id] || '').split(',').map((s: string) => s.trim());
                          return (
                            <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-700">{mod.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap justify-center gap-2">
                                  {ACTIONS.map((action) => {
                                    const isActive = allowed.includes(action.id);
                                    return (
                                      <button
                                        key={action.id}
                                        onClick={() => handleToggleLocal(role.RoleName, mod.id, action.id)}
                                        className={clsx(
                                          "px-3 py-1.5 rounded-lg text-xs font-black transition-all border flex items-center gap-1.5",
                                          isActive 
                                            ? clsx(action.color, "border-transparent shadow-sm") 
                                            : "bg-slate-50 text-slate-300 border-slate-100 hover:border-slate-300"
                                        )}
                                      >
                                        {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        {action.name}
                                      </button>
                                    );
                                  })}
                                  
                                  <div className="w-px h-6 bg-slate-100 mx-1" />

                                  <button
                                    onClick={() => handleGrantAllLocal(role.RoleName, mod.id)}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-tight"
                                  >
                                    อนุมัติทั้งหมด
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
          })
        )}
      </div>

      <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1">
          <p className="font-black">💡 คำแนะนำ:</p>
          <p>1. สิทธิ์ **super Admin** และ **Admin** จะมีผลเหนือการตั้งค่าทั้งหมด (Full Access เสมอ)</p>
          <p>2. การระบุชื่อ Role ต้องตรงกับ Role ที่กำหนดในหน้า &quot;จัดการผู้ใช้งาน&quot; (Case-sensitive)</p>
          <p>3. คุณสามารถใช้ปุ่ม &quot;อนุมัติทั้งหมด&quot; เพื่อเปิดสิทธิ์ทุกอย่างใน Module นั้นๆ ได้ทันที</p>
        </div>
      </div>
    </div>
  );
}
