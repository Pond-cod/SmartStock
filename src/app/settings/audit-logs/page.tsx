"use client"
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { ShieldAlert, Clock, User, FileText, ChevronDown, ChevronUp, Database } from 'lucide-react';
import clsx from 'clsx';

function DiffVisualizer({ diffStr }: { diffStr: string }) {
  if (!diffStr) return <span className="text-sm text-slate-400 italic">ไม่มีข้อมูลการเปลี่ยนแปลง</span>;
  
  let diff: any;
  try {
    diff = JSON.parse(diffStr);
  } catch (e) {
    return <span className="text-sm text-slate-400">{diffStr}</span>;
  }

  const before = diff.before || {};
  const after = diff.after || {};
  
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-4 py-2 w-1/3">Field</th>
            <th className="px-4 py-2 w-1/3 text-red-600">Before</th>
            <th className="px-4 py-2 w-1/3 text-emerald-600">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {allKeys.map(key => {
            const valBefore = before[key];
            const valAfter = after[key];
            const isChanged = String(valBefore) !== String(valAfter);
            if (!isChanged) return null;
            
            return (
              <tr key={key} className={isChanged ? 'bg-amber-50/30' : ''}>
                <td className="px-4 py-2 font-mono font-bold text-slate-600">{key}</td>
                <td className="px-4 py-2 font-mono text-red-600 break-all">{valBefore !== undefined ? String(valBefore) : <span className="text-slate-300 italic">null</span>}</td>
                <td className="px-4 py-2 font-mono text-emerald-600 break-all">{valAfter !== undefined ? String(valAfter) : <span className="text-slate-300 italic">null</span>}</td>
              </tr>
            );
          }).filter(Boolean)}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogsPage() {
  const { systemLogs, isLoading } = useData();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const logs = [...(systemLogs || [])].sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Audit Log</h1>
            <p className="text-slate-500 text-sm">Immutable tracking system for all critical module activities.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">กำลังโหลดข้อมูล Audit Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">ยังไม่มีประวัติการทำงานในระบบ</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const isExpanded = expandedLog === log.LogID;
              let badgeColor = 'bg-slate-100 text-slate-600';
              if (log.ActionType?.includes('ADD')) badgeColor = 'bg-emerald-100 text-emerald-700';
              if (log.ActionType?.includes('EDIT') || log.ActionType?.includes('APPROVE')) badgeColor = 'bg-blue-100 text-blue-700';
              if (log.ActionType?.includes('DELETE') || log.ActionType?.includes('REJECT')) badgeColor = 'bg-red-100 text-red-700';

              return (
                <div key={log.LogID} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer gap-4"
                    onClick={() => setExpandedLog(isExpanded ? null : log.LogID)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={clsx("px-3 py-1 text-xs font-black uppercase rounded-lg shrink-0", badgeColor)}>
                        {log.ActionType}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{log.Description || 'No description'}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {log.Module}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.UserIdentity}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.Timestamp).toLocaleString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="mt-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Data Diff Tracker
                        </p>
                        <DiffVisualizer diffStr={log.DataDiff} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
