"use client"
import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Download, Printer, FileText, Package, BarChart3, AlertCircle } from 'lucide-react';
import * as xlsx from 'xlsx';
import AdaptiveTable, { ColumnDef } from '@/components/AdaptiveTable';

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

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> รายงานสรุปพัสดุ</h1>
          <p className="text-sm text-slate-500 font-medium print:hidden">สรุปข้อมูลภาพรวมและมูลค่าพัสดุทั้งหมดในระบบ</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={handlePrintPDF} className="btn-secondary rounded-2xl px-6"><Printer className="w-4 h-4 mr-2" /> พิมพ์ PDF</button>
          <button onClick={handleExportExcel} className="btn-primary rounded-2xl px-6 shadow-lg"><Download className="w-4 h-4 mr-2" /> ส่งออก Excel</button>
        </div>
      </div>

      <div className="hidden print:block mb-8 text-center">
        <h2 className="text-xl font-bold">เอกสารรายงานสรุปพัสดุ คงคลัง (Inventory Report)</h2>
        <p className="text-sm text-gray-500">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')} โดยระบบ SmartStock</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:mb-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between print:rounded-lg print:border-gray-300 print:shadow-none">
           <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest print:text-gray-600">จำนวนรวมทุกรายการ</p><h3 className="text-3xl font-black text-slate-800 mt-1 print:text-gray-900">{totals.qty.toLocaleString()}</h3></div>
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center print:hidden"><Package className="w-8 h-8" /></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between print:rounded-lg print:border-gray-300 print:shadow-none">
           <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest print:text-gray-600">มูลค่ารวมพัสดุทั้งหมด</p><h3 className="text-3xl font-black text-slate-800 mt-1 print:text-gray-900">฿{totals.val.toLocaleString()}</h3></div>
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center print:hidden"><FileText className="w-8 h-8" /></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-none print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible">
          <AdaptiveTable<any>
            columns={[
              { header: 'รหัส', accessorKey: 'EquipmentCode', cell: (row) => <span className="font-bold text-slate-400 text-xs print:text-gray-800">{row.EquipmentCode}</span> },
              { header: 'รายการ', accessorKey: 'Name', cell: (row) => <span className="font-bold text-slate-700 print:text-black">{row.Name}</span> },
              { 
                header: 'จำนวน', 
                accessorKey: 'Quantity', 
                cell: (row) => <span className="font-medium">{row.Quantity} <span className="text-[10px] text-slate-400 print:text-gray-600">{row.Unit}</span></span> 
              },
              { header: 'ราคา/หน่วย', accessorKey: 'PricePerUnit', cell: (row) => <span>฿{Number(row.PricePerUnit).toLocaleString()}</span> },
              { header: 'ราคารวม', accessorKey: 'TotalValue', cell: (row) => <span className="font-black text-slate-800 print:text-black">฿{row.TotalValue.toLocaleString()}</span> },
              { 
                header: 'สถานะ', 
                accessorKey: 'Status', 
                cell: (row) => (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black print:bg-transparent print:text-black print:p-0 print:font-normal ${row.Status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {row.Status}
                  </span>
                )
              }
            ]}
            data={reportData}
            keyExtractor={(row) => row.EquipmentCode}
            mobileCardTitleAccessor="Name"
            mobileCardSubtitleAccessor="EquipmentCode"
          />
          
          <div className="hidden print:flex justify-end mt-20 gap-32 pr-10">
             <div className="text-center">
                <div className="w-32 border-b border-black mb-2 mx-auto"></div>
                <p className="text-sm font-bold">(........................................................)</p>
                <p className="text-xs text-gray-600 mt-1">ผู้จัดทำรายงาน</p>
             </div>
             <div className="text-center">
                <div className="w-32 border-b border-black mb-2 mx-auto"></div>
                <p className="text-sm font-bold">(........................................................)</p>
                <p className="text-xs text-gray-600 mt-1">ผู้อนุมัติ / ผู้ตรวจสอบ</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
