"use client"
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Settings, Palette, Sun, Moon, AlertCircle, Save, RefreshCw, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const THEME_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Emerald', value: '#10b981' }
];

export default function SettingsPage() {
  const { settings, updateRecord, createRecord, refreshData } = useData();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [themeColor, setThemeColor] = useState('#3b82f6');
  const [textColor, setTextColor] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [requisitionEnabled, setRequisitionEnabled] = useState(true);
  const [makerCheckerStrict, setMakerCheckerStrict] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const canEdit = currentUser?.Role === 'Admin' || currentUser?.Role === 'super Admin';
    if (currentUser && !canEdit) router.push('/');
  }, [currentUser, router]);

  useEffect(() => {
    if (settings) {
      setThemeColor(settings.ThemeColor || '#3b82f6');
      setTextColor(settings.TextColor || 'dark');
      setFontSize(settings.FontSize || 'medium');
      setRequisitionEnabled(settings.RequisitionEnabled !== 'false' && settings.RequisitionEnabled !== false);
      setMakerCheckerStrict(settings.MakerCheckerStrict !== 'false' && settings.MakerCheckerStrict !== false);
    }
  }, [settings]);

  if (!currentUser || (currentUser.Role !== 'Admin' && currentUser.Role !== 'super Admin')) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    const payload = { 
       ID: 1, ThemeColor: themeColor, TextColor: textColor, FontSize: fontSize,
       RequisitionEnabled: requisitionEnabled, MakerCheckerStrict: makerCheckerStrict 
    };
    let res = (settings && settings.ID) ? await updateRecord("Settings", { ...payload, ID: settings.ID }) : await createRecord("Settings", payload);

    if (res.success) {
      setMessage({ text: 'บันทึกการตั้งค่าสำเร็จ ข้อมูลจะถูกนำไปใช้โดยอัตโนมัติ', type: 'success' });
      await refreshData();
    } else {
      setMessage({ text: res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">ตั้งค่าระบบ</h1>
          <p className="text-sm text-slate-500 font-medium">ปรับแต่งหน้าตาและคุณสมบัติของแอปพลิเคชัน</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 space-y-8">
          {message.text && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-sm">{message.text}</span>
            </div>
          )}

          <div>
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Palette className="w-4 h-4" /> โทนสีหลักของระบบ
             </h2>
             <div className="flex flex-wrap gap-3">
               {THEME_COLORS.map(c => (
                 <button
                   key={c.value}
                   onClick={() => setThemeColor(c.value)}
                   className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${themeColor === c.value ? 'ring-4 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                   style={{ backgroundColor: c.value }}
                 >
                   {themeColor === c.value && <div className="w-3 h-3 bg-white rounded-full"></div>}
                 </button>
               ))}
               <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-10 h-10 cursor-pointer rounded-xl overflow-hidden border-none" />
             </div>
          </div>

          <div>
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Sun className="w-4 h-4" /> โหมดการแสดงผล
             </h2>
             <div className="flex gap-4">
               <button onClick={() => setTextColor('dark')} className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${textColor === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-500'}`}>
                 <Sun className="w-6 h-6" /> <span className="text-xs font-bold">โหมดสว่าง</span>
               </button>
               <button onClick={() => setTextColor('light')} className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${textColor === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-500'}`}>
                 <Moon className="w-6 h-6" /> <span className="text-xs font-bold">โหมดมืด</span>
               </button>
             </div>
          </div>

          <div>
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">ขนาดตัวอักษร</h2>
             <div className="flex gap-3">
               {['small', 'medium', 'large'].map(size => (
                 <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${fontSize === size ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-500'}`}>
                   {size === 'small' ? 'เล็ก' : size === 'medium' ? 'ปกติ' : 'ใหญ่'}
                 </button>
               ))}
             </div>
          </div>

          {currentUser.Role === 'super Admin' && (
             <div className="pt-6 border-t border-slate-100 mt-2">
                <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> System Governance (Super Admin)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">การเบิกพัสดุ (Requisition)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">เปิดหรือปิดการใช้งานระบบเบิก</p>
                    </div>
                    <button onClick={() => setRequisitionEnabled(!requisitionEnabled)} className={`p-1 rounded-full transition-colors ${requisitionEnabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {requisitionEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Maker-Checker Strict Mode</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">บังคับใช้คิวอนุมัติการเปลี่ยนแปลงข้อมูล</p>
                    </div>
                    <button onClick={() => setMakerCheckerStrict(!makerCheckerStrict)} className={`p-1 rounded-full transition-colors ${makerCheckerStrict ? 'text-indigo-500' : 'text-slate-300'}`}>
                      {makerCheckerStrict ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>
             </div>
          )}

        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 rounded-2xl shadow-lg">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
}
