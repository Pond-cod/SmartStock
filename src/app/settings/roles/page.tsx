"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Shield, Plus, Save, Trash2, Check, X, AlertCircle } from 'lucide-react';
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
  const { rolePermissions, createRecord, updateRecord, deleteRecord, isLoading } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || currentUser.Role !== 'Admin') return null;

  const handleToggle = (roleName: string, moduleId: string, actionId: string) => {
    const role = rolePermissions.find((r: any) => r.RoleName === roleName);
    if (!role) return;

    const currentActions = (role[moduleId] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    let newActions;
    if (currentActions.includes(actionId)) {
      newActions = currentActions.filter((a: string) => a !== actionId);
    } else {
      newActions = [...currentActions, actionId];
    }

    const updatedRole = { ...role, [moduleId]: newActions.join(',') };
    updateRecord('RolePermissions', updatedRole);
  };

  const handleAddRole = async () => {
    const name = prompt('กรุณาระบุชื่อ Role ใหม่:');
    if (!name) return;
    if (rolePermissions.some((r: any) => r.RoleName === name)) {
      alert('มีชื่อ Role นี้อยู่แล้ว');
      return;
    }

    const newRole: any = { RoleName: name };
    MODULES.forEach(m => newRole[m.id] = 'view'); // Default permission
    const success = await createRecord('RolePermissions', newRole);
    if (success) toast.success('สร้าง Role ใหม่สำเร็จ');
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === 'Admin') {
      alert('ไม่สามารถลบสิทธิ์ Admin ได้');
      return;
    }
    if (confirm(`คุณต้องการลบ Role "${roleName}" ใช่หรือไม่?`)) {
      const success = await deleteRecord('RolePermissions', { RoleName: roleName });
      if (success) toast.success('ลบ Role สำเร็จ');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
              <Shield className="w-6 h-6 text-white" />
            </div>
            กำหนดสิทธิ์การใช้งาน (Roles & Permissions)
          </h1>
          <p className="text-slate-500 font-medium mt-1">ตั้งค่าสิทธิ์แยกตาม Module สำหรับแต่ละกลุ่มผู้ใช้งาน</p>
        </div>
        <button onClick={handleAddRole} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95">
          <Plus className="w-5 h-5" /> เพิ่ม Role ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 italic">กำลังโหลดข้อมูลสิทธิ์...</div>
        ) : rolePermissions.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200 text-slate-400">
            ยังไม่มีการกำหนดสิทธิ์เสริม (Role Permissions) ในระบบ
          </div>
        ) : (
          rolePermissions.map((role: any) => (
            <div key={role.RoleName} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                    {role.RoleName[0].toUpperCase()}
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{role.RoleName}</h3>
                </div>
                <div className="flex items-center gap-2">
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
                                    onClick={() => handleToggle(role.RoleName, mod.id, action.id)}
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1">
          <p className="font-black">💡 คำแนะนำ:</p>
          <p>1. สิทธิ์ **Admin** จะมีผลเหนือการตั้งค่าทั้งหมด (Full Access เสมอ)</p>
          <p>2. การระบุชื่อ Role ต้องตรงกับ Role ที่กำหนดในหน้า "จัดการผู้ใช้งาน" (Case-sensitive)</p>
          <p>3. ระบบจะบันทึกการเปลี่ยนแปลงทันทีเมื่อกดปุ่มสิทธิ์</p>
        </div>
      </div>
    </div>
  );
}
