"use client"
import React, { useState } from 'react';
import ResponsiveStatCard from '@/components/ResponsiveStatCard';
import AdaptiveTable, { ColumnDef } from '@/components/AdaptiveTable';
import ResponsiveModal from '@/components/ResponsiveModal';
import { Users, DollarSign, Activity, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

// MOCK DATA
const MOCK_STATS = [
  { title: 'Total Revenue', value: '$124,500', trend: 12, trendLabel: 'vs last month', icon: <DollarSign className="w-6 h-6" />, color: 'emerald' },
  { title: 'Active Users', value: '4,285', trend: -2, trendLabel: 'vs last week', icon: <Users className="w-6 h-6" />, color: 'blue' },
  { title: 'System Uptime', value: '99.9%', trend: 0, trendLabel: 'last 30 days', icon: <Activity className="w-6 h-6" />, color: 'purple' },
  { title: 'Open Issues', value: '14', trend: undefined, trendLabel: 'Requires attention', icon: <AlertCircle className="w-6 h-6" />, color: 'rose' },
];

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Offline' | 'Banned';
  lastLogin: string;
};

const MOCK_TABLE_DATA: UserData[] = [
  { id: '1', name: 'Alice Cooper', email: 'alice@example.com', role: 'Admin', status: 'Active', lastLogin: '2 mins ago' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Offline', lastLogin: '5 hrs ago' },
  { id: '3', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Viewer', status: 'Active', lastLogin: 'Just now' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Moderator', status: 'Banned', lastLogin: '3 days ago' },
];

export default function UIKitPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns: ColumnDef<UserData>[] = [
    { header: 'User ID', accessorKey: 'id', hiddenOnMobile: true },
    { header: 'Full Name', accessorKey: 'name' },
    { header: 'Email Address', accessorKey: 'email', hiddenOnMobile: true },
    { header: 'Role', accessorKey: 'role' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (row) => (
        <span className={clsx(
          "px-2.5 py-1 rounded-full text-xs font-medium border",
          row.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          row.status === 'Offline' ? 'bg-slate-100 text-slate-600 border-slate-300' :
          'bg-rose-50 text-rose-700 border-rose-200'
        )}>
          {row.status}
        </span>
      )
    },
    { header: 'Last Login', accessorKey: 'lastLogin' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       <div>
         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">UI Component Kit</h1>
         <p className="text-slate-500 mt-2 max-w-2xl">
           A showcase of the Universal Admin Dashboard Layout components. Resize your browser window to see how the architecture responds strictly to Mobile (&lt;640px), Tablet (768px), and Desktop (&gt;1024px) constraints.
         </p>
       </div>

       {/* ------------- STAT CARDS ------------- */}
       <section>
         <div className="mb-4">
           <h2 className="text-xl font-bold text-slate-800">1. Responsive Stat Cards</h2>
           <p className="text-sm text-slate-500 mt-1">Fluid layout: 1 col (Mobile) → 2 cols (Tablet) → 4 cols (Desktop).</p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
           {MOCK_STATS.map((stat, i) => (
             <ResponsiveStatCard key={i} {...stat} colorClass={stat.color} />
           ))}
         </div>
       </section>

       {/* ------------- ADAPTIVE DATA TABLE ------------- */}
       <section>
         <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
           <div>
             <h2 className="text-xl font-bold text-slate-800">2. Adaptive Data Table</h2>
             <p className="text-sm text-slate-500 mt-1">Desktop renders standard <code>&lt;table&gt;</code>. Mobile automatically converts to stacked flex cards to prevent horizontal scrolling.</p>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white min-h-[44px] px-6 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20 whitespace-nowrap"
           >
             Trigger Action Modal
           </button>
         </div>
         
         <AdaptiveTable 
           columns={columns} 
           data={MOCK_TABLE_DATA} 
           keyExtractor={(row) => row.id}
           mobileCardTitleAccessor="name"
           mobileCardSubtitleAccessor="email"
           onRowClick={(row) => alert(`Tapped on ${row.name}`)}
         />
       </section>

       {/* ------------- RESPONSIVE MODAL ------------- */}
       <ResponsiveModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)}
         title="System Configuration"
         footer={
           <>
             <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
               Cancel
             </button>
             <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm min-h-[44px]">
               Save Changes
             </button>
           </>
         }
       >
         <div className="space-y-4">
           <p className="text-slate-600">
             This modal behaves intelligently based on your device context:
           </p>
           <ul className="list-disc pl-5 text-slate-600 space-y-2">
             <li><strong>Over Mobile (&lt;640px):</strong> It snaps to the bottom of the screen like a native bottom sheet, featuring a subtle drag-handle hint.</li>
             <li><strong>Over Desktop:</strong> It elegantly centers on the screen with a spring scale animation.</li>
           </ul>
           <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-6">
             <p className="text-sm text-blue-800">
               Notice the touch targets! Buttons and touchable areas ensure a strict minimum height constraint (min 44px) for perfect mobile accessibility.
             </p>
           </div>
         </div>
       </ResponsiveModal>
    </div>
  );
}
