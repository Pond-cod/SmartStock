import React from 'react';
import clsx from 'clsx';
import { MoreVertical } from 'lucide-react';

export type ColumnDef<T> = {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  hiddenOnMobile?: boolean;
};

type AdaptiveTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  mobileCardTitleAccessor: keyof T;
  mobileCardSubtitleAccessor?: keyof T;
  onRowClick?: (row: T) => void;
  mobileActions?: (row: T) => React.ReactNode;
};

export default function AdaptiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  mobileCardTitleAccessor,
  mobileCardSubtitleAccessor,
  onRowClick,
  mobileActions
}: AdaptiveTableProps<T>) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">ไม่มีข้อมูลแสดงในขณะนี้</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="hidden md:block print:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4 font-semibold shrink-0">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    "transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-blue-50/50" : "hover:bg-slate-50/50"
                  )}
                >
                  {columns.map((col, i) => (
                    <td key={i} className="px-6 py-4 text-slate-700">
                      {col.cell ? col.cell(row) : (row[col.accessorKey as string] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden print:hidden space-y-4">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick && onRowClick(row)}
            className={clsx(
              "bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative",
              onRowClick ? "active:bg-slate-50" : ""
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {row[mobileCardTitleAccessor as string] as React.ReactNode}
                </h3>
                {mobileCardSubtitleAccessor && (
                  <p className="text-sm text-slate-500">
                    {row[mobileCardSubtitleAccessor as string] as React.ReactNode}
                  </p>
                )}
              </div>
                {mobileActions && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {mobileActions(row)}
                  </div>
                )}
              </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-slate-100 text-sm">
              {columns
                .filter(col => !col.hiddenOnMobile
                  && col.accessorKey !== mobileCardTitleAccessor
                  && col.accessorKey !== mobileCardSubtitleAccessor
                )
                .map((col, i) => (
                  <div key={i} className="flex flex-col">
                    <dt className="text-xs font-medium text-slate-500 mb-0.5">{col.header}</dt>
                    <dd className="font-medium text-slate-800 truncate">
                      {col.cell ? col.cell(row) : (row[col.accessorKey as string] as React.ReactNode)}
                    </dd>
                  </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
