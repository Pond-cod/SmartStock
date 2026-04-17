import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

type ResponsiveStatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // e.g., 5 for +5%, -3 for -3%, 0 for no change
  trendLabel?: string; // e.g., "vs last month"
  colorClass?: string; // e.g., "blue"
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function ResponsiveStatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  colorClass = 'blue'
}: ResponsiveStatCardProps) {
  
  const iconBgClass = colorMap[colorClass] || colorMap['blue'];

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
        <div className="w-24 h-24">{icon}</div>
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center border", iconBgClass)}>
          {icon}
        </div>
        
        {trend !== undefined && (
          <div className={clsx(
            "flex items-center px-2.5 py-1 rounded-full text-sm font-semibold border",
            trend > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
            trend < 0 ? "bg-rose-50 text-rose-600 border-rose-100" : 
            "bg-slate-50 text-slate-600 border-slate-100"
          )}>
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : 
             trend < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : 
             <Minus className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
        <p className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        
        {trendLabel && (
          <p className="text-xs text-slate-400 mt-2 font-medium">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
