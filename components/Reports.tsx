
import React, { useState } from 'react';
import { REPORT_SUMMARY_STATS, RECENT_VEHICLE_ACTIVITY } from '../constants';

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Generate insights on fleet status, revenue, and vehicle locations.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Year to Date</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {REPORT_SUMMARY_STATS.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</h3>
               </div>
               <div className={`p-2.5 rounded-2xl ${stat.iconBg} ${stat.iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
                 <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
               </div>
            </div>
            
            <div className="space-y-3">
              {stat.percentage !== undefined && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${stat.iconColor === 'text-blue-600' ? 'bg-blue-600' : 'bg-primary'}`} style={{ width: `${stat.percentage}%` }}></div>
                </div>
              )}
              <div className="flex items-center gap-2">
                 {stat.trend && (
                   <span className={`text-xs font-black flex items-center ${stat.trendType === 'up' ? 'text-emerald-500' : 'text-slate-400'}`}>
                     <span className="material-symbols-outlined text-[14px] font-bold mr-0.5">{stat.trendType === 'up' ? 'arrow_upward' : 'arrow_downward'}</span>
                     {stat.trend}
                   </span>
                 )}
                 {stat.label === 'Maintenance' && (
                    <span className="material-symbols-outlined text-orange-500 text-[16px] font-bold">warning</span>
                 )}
                 <span className={`text-[11px] font-bold ${stat.label === 'Maintenance' && stat.subLabel?.includes('Urgent') ? 'text-orange-500' : 'text-slate-400'}`}>
                   {stat.subLabel}
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Cost Analysis Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue & Cost Analysis</h3>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          
          <div className="h-[300px] w-full relative">
            {/* Simple Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-slate-400"></div>)}
            </div>
            
            {/* Abstract Chart Path using SVG */}
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              {/* Revenue Area (Primary Blue) */}
              <path d="M0,40 L0,20 Q15,10 30,18 T60,10 T100,15 L100,40 Z" fill="#137fec15" />
              <path d="M0,20 Q15,10 30,18 T60,10 T100,15" fill="none" stroke="#137fec" strokeWidth="1" strokeLinecap="round" />
              {/* Cost Area (Light Blue) */}
              <path d="M0,30 Q20,25 40,32 T70,28 T100,35" fill="none" stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round" strokeDasharray="2,2" />
            </svg>
            
            {/* Chart X-Axis Labels */}
            <div className="absolute bottom-[-24px] left-0 w-full flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-primary"></span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-blue-200"></span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Cost</span>
            </div>
          </div>
        </div>

        {/* Fleet Status Chart Placeholder */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Fleet Status</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            {/* Simple Donut Chart Representation */}
            <div className="relative size-48">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#137fec" strokeWidth="4" strokeDasharray="70, 100" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-70" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-85" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">120</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total Cars</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-primary"></span>
                  <span className="text-slate-500">Rented (70%)</span>
                </div>
                <span className="text-slate-900 dark:text-white">84</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-500">Available (15%)</span>
                </div>
                <span className="text-slate-900 dark:text-white">18</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-500">Maintenance (15%)</span>
                </div>
                <span className="text-slate-900 dark:text-white">18</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vehicle Activity Table */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Vehicle Activity</h3>
          <div className="relative w-full sm:max-w-xs">
             <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
             <input 
               type="text" 
               placeholder="Filter list..."
               className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
             />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">Vehicle</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Location</th>
                <th className="px-8 py-6">Odometer</th>
                <th className="px-8 py-6">Revenue (MTD)</th>
                <th className="px-8 py-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {RECENT_VEHICLE_ACTIVITY.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        <img src={activity.image} alt="" className="size-full object-cover" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white leading-tight">{activity.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{activity.plate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-[10px] font-black uppercase tracking-tight rounded-full border border-emerald-100 dark:border-emerald-800">
                      <span className="size-1.5 rounded-full bg-emerald-600"></span>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {activity.location}
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-600 dark:text-slate-300">
                    {activity.odometer}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                    {activity.revenueMtd}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button className="p-2 text-slate-400 hover:text-primary transition-all">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
