
import React from 'react';
import { Stat } from '../types';

interface StatsCardProps {
  stat: Stat;
}

const StatsCard: React.FC<StatsCardProps> = ({ stat }) => {
  const isPositive = stat.trendType === 'up';
  const isNegative = stat.trendType === 'down';

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full group hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
          <span className="material-symbols-outlined">{stat.icon}</span>
        </div>
        <span className={`flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
          isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 
          isNegative ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 
          'text-slate-500 bg-slate-100 dark:bg-slate-800'
        }`}>
          {isPositive && <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>}
          {isNegative && <span className="material-symbols-outlined text-[14px] mr-1">trending_down</span>}
          {stat.label === 'Maintenance Due' && isPositive && <span className="material-symbols-outlined text-[14px] mr-1">warning</span>}
          {stat.trend}
        </span>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
      </div>
    </div>
  );
};

export default StatsCard;
