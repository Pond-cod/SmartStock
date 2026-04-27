"use client"
import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  Package, AlertTriangle, CheckCircle2, XCircle, BarChart3,
  ArrowUpRight, QrCode, ClipboardList, Activity, Layers, RefreshCw, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from 'next/link';
import clsx from 'clsx';
import AdaptiveTable, { ColumnDef } from '@/components/AdaptiveTable';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Active:   { label: 'ใช้งานปกติ', cls: 'status-active' },
    Broken:   { label: 'ชำรุด', cls: 'status-broken' },
    Disposed: { label: 'จำหน่ายออก', cls: 'status-disposed' },
  };
  const cfg = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.cls}`}>
      {status === 'Active'   && <CheckCircle2 className="w-3 h-3" />}
      {status === 'Broken'   && <XCircle      className="w-3 h-3" />}
      {status === 'Disposed' && <AlertTriangle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function KpiCard({
  title, value, sub, icon, accent, trend
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string; trend?: { label: string; up: boolean }
}) {
  return (
    <div className={`kpi-card relative overflow-hidden ${accent}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/20">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-0.5 leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {trend && (
          <div className={clsx('text-xs font-bold flex items-center gap-0.5', trend.up ? 'text-emerald-600' : 'text-red-500')}>
            <ArrowUpRight className={clsx('w-3.5 h-3.5', !trend.up && 'rotate-90')} />
            {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { equipments, categories, isLoading, error, refreshData } = useData();
  const { currentUser } = useAuth();

  const stats = useMemo(() => {
    const total = equipments.length;
    const active   = equipments.filter(e => e.Status === 'Active').length;
    const broken   = equipments.filter(e => e.Status === 'Broken').length;
    const disposed = equipments.filter(e => e.Status === 'Disposed').length;
    const lowStock = equipments.filter(e => Number(e.Quantity) <= 2 && e.Status === 'Active').length;
    const totalValue = equipments.reduce((s, e) => s + (Number(e.Quantity) || 0) * (Number(e.PricePerUnit) || 0), 0);
    return { total, active, broken, disposed, lowStock, totalValue };
  }, [equipments]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    equipments.forEach(e => {
      const cat = e.CategoryName || 'ไม่ระบุหมวดหมู่';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 8);
  }, [equipments]);

  const recent = useMemo(() => [...equipments].sort((a, b) => 
    new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime()
  ).slice(0, 6), [equipments]);

  const canEdit = currentUser?.Role === 'Admin' || currentUser?.Role === 'super Admin';

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-red-50 rounded-2xl border border-red-100">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={refreshData} className="mt-4 btn-primary text-sm px-5 py-2.5 min-h-0">
        <RefreshCw className="w-4 h-4" /> ลองใหมีกครั้ง
      </button>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
            ภาพรวมระบบบริหารจัดการพัสดุ
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            ข้อมูลประจำวันที่ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
          </p>
        </div>
        {canEdit && (
          <Link href="/qr-scan" className="btn-primary text-sm">
            <QrCode className="w-4 h-4" />
            <span>สแกน QR Code</span>
          </Link>
        )}
      </div>

      {canEdit && (
        <div className="md:hidden grid grid-cols-2 gap-3">
          <Link href="/qr-scan" className="btn-primary flex-col min-h-[72px] text-base rounded-2xl bg-[var(--primary)] shadow-xl">
            <QrCode className="w-8 h-8 mb-1" />
            <span className="text-sm font-bold">สแกน QR</span>
          </Link>
          <Link href="/equipments/new" className="btn-secondary flex-col min-h-[72px] text-base rounded-2xl bg-white border-2 border-slate-100 shadow-sm">
            <Package className="w-8 h-8 mb-1 text-slate-600" />
            <span className="text-sm font-bold text-slate-600">เพิ่มพัสดุ</span>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-12 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            title="พัสดุทั้งหมด"
            value={stats.total}
            sub={`${categories.length} หมวดหมู่`}
            icon={<Package className="w-6 h-6 text-blue-700" />}
            accent="bg-blue-600 border border-blue-100"
          />
          <KpiCard
            title="ใช้งานปกติ"
            value={stats.active}
            sub={`${stats.total ? Math.round(stats.active/stats.total*100) : 0}% ของทั้งหมด`}
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-700" />}
            accent="bg-emerald-600 border border-emerald-100"
          />
          <KpiCard
            title="ชำรุด/ซ่อม"
            value={stats.broken}
            sub={`${stats.disposed} รายการถูกจำหน่าย`}
            icon={<XCircle className="w-6 h-6 text-red-700" />}
            accent="bg-red-600"
            trend={stats.broken > 0 ? { label: 'ควรตรวจสอบ!', up: false } : undefined}
          />
          <KpiCard
            title="พัสดุใกล้หมด"
            value={stats.lowStock}
            sub="จำนวนคงเหลือ <= 2"
            icon={<AlertTriangle className="w-6 h-6 text-amber-700" />}
            accent="bg-amber-600"
            trend={stats.lowStock > 0 ? { label: 'สต็อกต่ำ', up: false } : undefined}
          />
          <KpiCard
            title="มูลค่าพัสดุรวม"
            value={`฿${stats.totalValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
            sub="มูลค่าสินทรัพย์ทั้งหมด"
            icon={<TrendingUp className="w-6 h-6 text-purple-700" />}
            accent="bg-purple-600 border border-purple-100"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              สถิติพัสดุแยกตามหมวดหมู่
            </h2>
            <Link href="/categories" className="text-xs font-semibold text-[var(--primary)] hover:underline">ดูหมวดหมู่ทั้งหมด</Link>
          </div>
          {isLoading ? (
            <div className="h-56 bg-slate-100 animate-pulse rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">ยังไม่มีข้อมูลสถิติ</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(45,110,168,0.06)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    formatter={(v) => [`${v} รายการ`, 'จำนวนพัสดุ']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--primary)]" />
              รายการพัสดุใหม่
            </h2>
            <Link href="/equipments" className="text-xs font-semibold text-[var(--primary)] hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto max-h-64 pr-1">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                    <div className="h-2 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
              ))
            ) : recent.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">ยังไม่มีข้อมูลพัสดุ</p>
            ) : (
              recent.map((eq, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    eq.Status === 'Active' ? 'bg-emerald-100' : eq.Status === 'Broken' ? 'bg-red-100' : 'bg-amber-100'
                  )}>
                    <Package className={clsx(
                      'w-4 h-4',
                      eq.Status === 'Active' ? 'text-emerald-600' : eq.Status === 'Broken' ? 'text-red-600' : 'text-amber-600'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{eq.Name}</p>
                    <p className="text-[10px] text-slate-400">{eq.EquipmentCode} • {eq.CategoryName || 'ไม่ระบุ'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600">{eq.Quantity} {eq.Unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'ใช้งานปกติ', count: stats.active, color: 'border-emerald-400 bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
            { label: 'ชำรุด', count: stats.broken, color: 'border-red-400 bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
            { label: 'จำหน่ายออก', count: stats.disposed, color: 'border-amber-400 bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border-2 p-4 flex items-center gap-3 ${s.color}`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
              <div>
                <p className={`text-2xl font-extrabold ${s.text}`}>{s.count}</p>
                <p className={`text-[11px] font-semibold ${s.text} opacity-80`}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--primary)]" />
            รายการพัสดุทั้งหมด
          </h2>
          <Link href="/equipments" className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline">
            ดูทั้งหมด <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-0">
          {isLoading ? (
             <div className="p-5 space-y-4">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="animate-pulse flex items-center justify-between">
                   <div className="h-4 w-1/3 bg-slate-100 rounded" />
                   <div className="h-4 w-1/4 bg-slate-100 rounded" />
                 </div>
               ))}
             </div>
          ) : (
            <AdaptiveTable<any>
              columns={[
                { header: 'รหัสพัสดุ', accessorKey: 'EquipmentCode', cell: (row) => <span className="font-bold text-slate-400 text-xs">{row.EquipmentCode}</span> },
                { header: 'ชื่อพัสดุ', accessorKey: 'Name', cell: (row) => <span className="font-bold text-slate-700">{row.Name}</span> },
                { header: 'หมวดหมู่', accessorKey: 'CategoryName', hiddenOnMobile: true },
                { header: 'จำนวนคงเหลือ', accessorKey: 'Quantity', cell: (row) => <span className="font-bold text-slate-600">{row.Quantity} {row.Unit}</span> },
                { header: 'สถานะ', accessorKey: 'Status', cell: (row) => <StatusBadge status={row.Status} /> }
              ]}
              data={equipments.slice(0, 10)}
              keyExtractor={(row) => row.EquipmentCode}
              mobileCardTitleAccessor="Name"
              mobileCardSubtitleAccessor="EquipmentCode"
            />
          )}
        </div>
      </div>
    </div>
  );
}
