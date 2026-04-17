"use client"
import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Download, Printer, FileText, Package, BarChart3, AlertCircle } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function ReportsPage() {
  const { equipments, isLoading } = useData();

  const reportData = useMemo(() => {
    return equipments.map(eq => ({
      ...eq,
      TotalValue: (Number(eq.Quantity) || 0) * (Number(eq.PricePerUnit) || 0)
    }));
  }, [equipments]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => {
      acc.qty += (Number(curr.Quantity) || 0);
      acc.val += curr.TotalValue;
      return acc;
    }, { qty: 0, val: 0 });
  }, [reportData]);

  const handleExportExcel = () => {
    const excelData = reportData.map(eq => ({
      'รหัสพัสดุ': eq.EquipmentCode,
      'ชื่อพัสดุ': eq.Name,
      'หมวดหมู่': eq.CategoryName,
      'สถานะ': eq.Status,
      'สถานที่เก็บ': eq.Location,
      'จำนวน': eq.Quantity,
      'หน่วย': eq.Unit,
      'ราคาต่อหน่วย': eq.PricePerUnit,
      'ราคารวม': eq.TotalValue,
      'หมายเหตุ': eq.Notes,
      'วันที่เพิ่ม': eq.CreatedAt ? new Date(eq.CreatedAt).toLocaleDateString('th-TH') : ''
    }));
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    xlsx.writeFile(workbook, `report_inventory_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> รายงานสรุปพัสดุ</h1>
          <p className="text-sm text-slate-500 font-medium">สรุปข้อมูลภาพรวมและมูลค่าพัสดุทั้งหมดในระบบ</p>
        </div>
        <button onClick={handleExportExcel} className="btn-primary rounded-2xl px-6 shadow-lg"><Download className="w-4 h-4 mr-2" /> ส่งออก Excel (.xlsx)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
           <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">จำนวนรวมทุกรายการ</p><h3 className="text-3xl font-black text-slate-800 mt-1">{totals.qty.toLocaleString()}</h3></div>
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Package className="w-8 h-8" /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
           <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">มูลค่ารวมพัสดุทั้งหมด</p><h3 className="text-3xl font-black text-slate-800 mt-1">฿{totals.val.toLocaleString()}</h3></div>
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FileText className="w-8 h-8" /></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] font-black">
              <tr>
                <th className="px-6 py-4">รหัส</th>
                <th className="px-6 py-4">รายการ</th>
                <th className="px-6 py-4 text-right">จำนวน</th>
                <th className="px-6 py-4 text-right">ราคา/หน่วย</th>
                <th className="px-6 py-4 text-right">ราคารวม</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.map(eq => (
                <tr key={eq.EquipmentCode} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400 text-xs">{eq.EquipmentCode}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{eq.Name}</td>
                  <td className="px-6 py-4 text-right font-medium">{eq.Quantity} <span className="text-[10px] text-slate-400">{eq.Unit}</span></td>
                  <td className="px-6 py-4 text-right">฿{Number(eq.PricePerUnit).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">฿{eq.TotalValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${eq.Status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{eq.Status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
