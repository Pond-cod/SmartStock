"use client"
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';

interface RequisitionPDFProps {
  transaction: any;
  equipment: any;
}

export default function RequisitionPDF({ transaction, equipment }: RequisitionPDFProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Requisition_Form_${transaction?.TransactionID || 'New'}`,
  });

  if (!transaction) return null;

  return (
    <div>
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        <Printer size={18} />
        พิมพ์ใบเบิกพัสดุ / PDF
      </button>

      {/* Hidden printable area */}
      <div className="hidden">
        <div ref={componentRef} className="p-10 font-sans max-w-2xl mx-auto bg-white text-black">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">ใบเบิกพัสดุและครุภัณฑ์</h1>
            <p className="text-sm">ระบบบริหารจัดการพัสดุและครุภัณฑ์</p>
          </div>

          <table className="w-full mb-6">
            <tbody>
              <tr>
                <td className="py-2 font-semibold w-1/3">รหัสรายการ (Transaction ID):</td>
                <td className="py-2">{transaction.TransactionID}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">วันที่ดำเนินการ:</td>
                <td className="py-2">{new Date(transaction.TransactionDate || transaction.Date).toLocaleString('th-TH')}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">ผู้เบิก (Receiver):</td>
                <td className="py-2">{transaction.ReceiverName || transaction.User}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">ผู้จ่าย (Issuer):</td>
                <td className="py-2">{transaction.IssuerName || '-'}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">รายละเอียดพัสดุ</h2>
          <table className="w-full border-collapse border border-gray-400 mb-8 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left">รหัสครุภัณฑ์</th>
                <th className="border border-gray-400 p-2 text-left">ชื่อพัสดุ</th>
                <th className="border border-gray-400 p-2 text-center">จำนวนที่เบิก</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2">{transaction.EquipmentCode}</td>
                <td className="border border-gray-400 p-2">{equipment?.Name || transaction.EquipmentName || 'Unknown'}</td>
                <td className="border border-gray-400 p-2 text-center">{transaction.Quantity}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between mt-20 px-8">
            <div className="text-center">
              <p className="mb-8">ลงชื่อ.......................................................(ผู้เบิก)</p>
              <p>({transaction.ReceiverName || transaction.User || '...........................................'})</p>
            </div>
            <div className="text-center">
              <p className="mb-8">ลงชื่อ.......................................................(ผู้อนุมัติ/ผู้จ่าย)</p>
              <p>({transaction.IssuerName || '...........................................'})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
