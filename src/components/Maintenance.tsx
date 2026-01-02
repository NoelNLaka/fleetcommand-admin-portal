
import React, { useState } from 'react';
import { MAINTENANCE_STATS, MAINTENANCE_TASKS } from '../constants';
import { MaintenanceStatus } from '../types';

const Maintenance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>('2'); // Default expand Ford Transit as in design

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.OVERDUE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 text-xs font-bold rounded-full border border-red-100 dark:border-red-800">
            <span className="size-1.5 rounded-full bg-red-600"></span>
            Overdue
          </span>
        );
      case MaintenanceStatus.IN_SHOP:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-600"></span>
            In Shop
          </span>
        );
      case MaintenanceStatus.SCHEDULED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 dark:bg-slate-800 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700">
            <span className="size-1.5 rounded-full bg-slate-400"></span>
            Scheduled
          </span>
        );
      default:
        return null;
    }
  };

  const steps = [
    { id: 'Scheduled', icon: 'check', activeIcon: 'check' },
    { id: 'In Shop', icon: 'build', activeIcon: 'build' },
    { id: 'QC Check', icon: 'assignment_turned_in', activeIcon: 'assignment_turned_in' },
    { id: 'Done', icon: 'flag', activeIcon: 'flag' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Maintenance Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Track service history, schedule repairs, and manage fleet health.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start md:self-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Maintenance Task
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MAINTENANCE_STATS.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-4 relative z-10">
              <p className="text-xs uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
                {stat.trend && (
                  <span className={`text-sm font-bold flex items-center ${stat.trendType === 'up' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[16px]">{stat.trendType === 'up' ? 'arrow_upward' : 'trending_down'}</span>
                    {stat.trend}
                  </span>
                )}
                {stat.subLabel && (
                  <span className="text-xs font-bold text-red-500">{stat.subLabel}</span>
                )}
              </div>
            </div>
            <div className={`size-14 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} shadow-sm`}>
               <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/20 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full lg:w-auto overflow-x-auto scrollbar-hide">
          {['All Tasks', 'Upcoming', 'In Progress', 'History'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-md">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
           <input 
             type="text" 
             placeholder="Search vehicle ID, VIN or service type..."
             className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
           />
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">Vehicle</th>
                <th className="px-8 py-6">Service Type</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Assignee</th>
                <th className="px-8 py-6">Cost Estimate</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {MAINTENANCE_TASKS.map((task) => (
                <React.Fragment key={task.id}>
                  <tr 
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all ${expandedTaskId === task.id ? 'bg-slate-50/80 dark:bg-slate-800/50' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                          <img src={task.vehicleImage} alt="" className="size-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-base leading-tight">{task.vehicleName}</p>
                          <p className="text-xs font-bold text-primary mt-1">{task.vehicleVin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{task.serviceType}</p>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <img src={task.assigneeAvatar} alt="" className="size-8 rounded-xl" />
                        <span className="font-bold text-slate-600 dark:text-slate-400">{task.assigneeName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                      {task.costEstimate}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button className="p-2 text-slate-400 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail View */}
                  {expandedTaskId === task.id && (
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-8 py-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                          <div className="lg:col-span-3 space-y-8">
                             <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Service Progress</p>
                             <div className="relative flex justify-between items-center max-w-2xl">
                               {/* Connecting line */}
                               <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 -z-10"></div>
                               <div 
                                 className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 transition-all duration-500" 
                                 style={{ width: task.currentStep === 'In Shop' ? '33%' : task.currentStep === 'QC Check' ? '66%' : task.currentStep === 'Done' ? '100%' : '0%' }}
                               ></div>

                               {steps.map((step, idx) => {
                                 const isCompleted = steps.findIndex(s => s.id === task.currentStep) >= idx;
                                 const isActive = step.id === task.currentStep;
                                 return (
                                   <div key={step.id} className="flex flex-col items-center gap-4">
                                     <div className={`size-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                       isCompleted 
                                       ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' 
                                       : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'
                                     }`}>
                                       <span className={`material-symbols-outlined filled text-xl`}>{step.icon}</span>
                                     </div>
                                     <span className={`text-[11px] font-black uppercase tracking-widest ${isCompleted ? 'text-primary' : 'text-slate-400'}`}>
                                       {step.id}
                                     </span>
                                   </div>
                                 );
                               })}
                             </div>
                             
                             {task.estCompletion && (
                               <div className="pt-4 flex items-center gap-2 text-sm text-slate-500 font-bold">
                                 <span className="font-black text-slate-900 dark:text-white">Est. Completion:</span>
                                 <span>{task.estCompletion}</span>
                               </div>
                             )}
                          </div>
                          
                          <div className="space-y-4 border-l border-slate-200 dark:border-slate-700 pl-12 flex flex-col justify-center">
                            <button className="flex items-center gap-3 text-sm font-bold text-primary hover:underline group">
                               <span className="material-symbols-outlined text-xl">description</span>
                               View Invoice
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-primary hover:underline group">
                               <span className="material-symbols-outlined text-xl">event_repeat</span>
                               Reschedule
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-red-500 hover:underline group">
                               <span className="material-symbols-outlined text-xl">cancel</span>
                               Cancel Task
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">Showing <span className="text-slate-900 dark:text-white">1</span> to <span className="text-slate-900 dark:text-white">4</span> of <span className="text-slate-900 dark:text-white">12</span> results</p>
          <div className="flex gap-4">
            <button className="px-6 py-2.5 text-sm font-black text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">Previous</button>
            <button className="px-6 py-2.5 text-sm font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
