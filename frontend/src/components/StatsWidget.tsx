import React from 'react';
import { GlassCard } from './GlassCard';

interface StatsWidgetProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  accentColor?: string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  label,
  value,
  trend,
  trendType = 'neutral',
  icon,
  accentColor = 'indigo'
}) => {
  const trendColorMap = {
    positive: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5',
    negative: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/5',
    neutral: 'text-slate-400 bg-slate-500/10 dark:bg-slate-500/5',
  };

  const accentColorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <GlassCard hoverEffect={true} className="relative overflow-hidden">
      {/* Decorative accent orb */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-10 bg-${accentColor}-500`} />
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-slate-400 dark:text-slate-400">{label}</span>
          <h3 className="text-3xl font-bold font-sans tracking-tight mt-1 text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${accentColorMap[accentColor] || accentColorMap.indigo}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-1.5 mt-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendColorMap[trendType]}`}>
            {trend}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">vs past week</span>
        </div>
      )}
    </GlassCard>
  );
};
