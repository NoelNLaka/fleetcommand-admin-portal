import React, { useState, useEffect } from 'react';
import { MAINTENANCE_STATS as STATIC_STATS, MAINTENANCE_TASKS as STATIC_TASKS } from '../constants';
import { MaintenanceStatus, MaintenanceTask } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Maintenance: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchTasks = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_records')
        .select(`
  *,
  vehicle: vehicles(name, vin, image_url)
        `)
        .eq('org_id', profile.org_id);

      if (error) throw error;

      const mappedTasks: MaintenanceTask[] = (data || []).map((t: any) => ({
        id: t.id,
        vehicleName: t.vehicle?.name || 'Unknown Vehicle',
        vehicleVin: t.vehicle?.vin || 'N/A',
        vehicleImage: t.vehicle?.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=300',
        serviceType: t.service_type || 'General Maintenance',
        status: t.status as MaintenanceStatus,
        assigneeName: 'Service Dept', // Defaulting since not in schema
        assigneeAvatar: 'https://i.pravatar.cc/150?u=service',
        costEstimate: t.cost_estimate ? `$${t.cost_estimate.toFixed(2)} ` : '$0.00',
        currentStep: t.current_step || 'Scheduled',
        estCompletion: t.completion_date || 'N/A'
      }));

      setTasks(mappedTasks);
      if (mappedTasks.length > 0 && !expandedTaskId) {
        setExpandedTaskId(mappedTasks[0].id);
      }
    } catch (error) {
      console.error('Error fetching maintenance tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [profile?.org_id]);

  const stats = [
    {
      label: 'In Shop',
      value: tasks.filter(t => t.status === MaintenanceStatus.IN_SHOP).length.toString(),
      trend: '+2',
      trendType: 'up',
      icon: 'precision_manufacturing',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Scheduled',
      value: tasks.filter(t => t.status === MaintenanceStatus.SCHEDULED).length.toString(),
      icon: 'event',
      iconBg: 'bg-slate-50 dark:bg-slate-800',
      iconColor: 'text-slate-600'
    },
    {
      label: 'Critical / Overdue',
      value: tasks.filter(t => t.status === MaintenanceStatus.OVERDUE).length.toString(),
      subLabel: tasks.filter(t => t.status === MaintenanceStatus.OVERDUE).length > 0 ? 'Action Required' : '',
      icon: 'warning',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    }
  ];

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
      case MaintenanceStatus.DONE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600"></span>
            Done
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

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'All Tasks') return true;
    if (activeTab === 'Upcoming') return task.status === MaintenanceStatus.SCHEDULED;
    if (activeTab === 'In Progress') return task.status === MaintenanceStatus.IN_SHOP;
    if (activeTab === 'History') return task.status === MaintenanceStatus.DONE;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Maintenance Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Track service history, schedule repairs, and manage fleet health.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Maintenance Task
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="space-y-4 relative z-10">
              <p className="text-xs uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</h3>
                {stat.trend && (
                  <span className={`text - sm font - bold flex items - center ${stat.trendType === 'up' ? 'text-emerald-500' : 'text-slate-400'} `}>
                    <span className="material-symbols-outlined text-[16px]">{stat.trendType === 'up' ? 'arrow_upward' : 'trending_down'}</span>
                    {stat.trend}
                  </span>
                )}
                {stat.subLabel && (
                  <span className="text-xs font-bold text-red-500">{stat.subLabel}</span>
                )}
              </div>
            </div>
            <div className={`size - 14 rounded - 2xl ${stat.iconBg} flex items - center justify - center ${stat.iconColor} shadow - sm`}>
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
              className={`whitespace - nowrap px - 6 py - 2 text - sm font - bold rounded - lg transition - all ${activeTab === tab ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'} `}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by vehicle or VIN..."
              className="w-full lg:w-64 pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Task List (Accordion Style) */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">build_circle</span>
            <p className="text-xl font-bold">No maintenance tasks found</p>
            <p>All vehicles are currently in top shape!</p>
          </div>
        ) : filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg - white dark: bg - surface - dark border transition - all overflow - hidden ${expandedTaskId === task.id ? 'border-primary ring-1 ring-primary/10 rounded-[32px] shadow-xl shadow-primary/5' : 'border-slate-200 dark:border-slate-800 rounded-[24px] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'} `}
          >
            {/* Task Header (Always visible) */}
            <div
              onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                  <img src={task.vehicleImage} alt="" className="size-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{task.vehicleName}</h4>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="text-slate-400 font-bold text-sm tracking-tight mb-2 uppercase">{task.vehicleVin}</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                      <span className="material-symbols-outlined text-[16px] text-primary">service_toolbox</span>
                      {task.serviceType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 pl-20 md:pl-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Est. Completion</p>
                  <p className="font-black text-slate-900 dark:text-white">{task.estCompletion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Cost Estimate</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{task.costEstimate}</p>
                </div>
                <div className={`p - 2 rounded - xl border border - slate - 100 dark: border - slate - 800 transition - transform ${expandedTaskId === task.id ? 'rotate-180 bg-primary/5 text-primary border-primary/20' : 'text-slate-400'} `}>
                  <span className="material-symbols-outlined text-[24px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Task Detail (Visible when expanded) */}
            {expandedTaskId === task.id && (
              <div className="px-6 md:px-8 pb-8 pt-4 border-t border-slate-50 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="max-w-4xl mx-auto">
                  {/* Progress Tracker */}
                  <div className="mb-12">
                    <p className="text-sm font-black text-slate-900 dark:text-white mb-8">Work Progress</p>
                    <div className="relative flex justify-between items-center px-4">
                      {/* Progress Line */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{
                            width: task.currentStep === 'Scheduled' ? '0%' :
                              task.currentStep === 'In Shop' ? '33%' :
                                task.currentStep === 'QC Check' ? '66%' : '100%'
                          }}
                        ></div>
                      </div>

                      {steps.map((step, idx) => {
                        const isCompleted = steps.findIndex(s => s.id === task.currentStep) >= idx;
                        const isActive = task.currentStep === step.id;

                        return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`size - 12 rounded - 2xl flex items - center justify - center transition - all duration - 500 border - 4 dark: border - surface - dark ${isCompleted ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 text-slate-300'} `}>
                              <span className="material-symbols-outlined text-[20px]">{isCompleted ? step.activeIcon : step.icon}</span>
                            </div>
                            <p className={`text - [10px] uppercase font - black tracking - widest ${isActive ? 'text-primary' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'} `}>
                              {step.id}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white mb-3">Service Details</p>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                              Oil filter & synthetic engine oil change
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                              Full vehicle health check & diagnostic
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <span className="material-symbols-outlined text-slate-300 text-[18px]">panorama_fish_eye</span>
                              Brake pad inspection & cleaning
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-900 dark:text-white">Assigned Specialist</p>
                        <button className="text-primary text-xs font-bold hover:underline">Change</button>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <img src={task.assigneeAvatar} alt="" className="size-12 rounded-xl bg-slate-200" />
                        <div>
                          <p className="font-black text-slate-900 dark:text-white leading-none">{task.assigneeName}</p>
                          <p className="text-xs text-slate-400 font-bold mt-1">Lead Maintenance Tech</p>
                        </div>
                        <button className="ml-auto size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 bg-primary text-white font-black text-xs rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all">
                          AUTHORIZE ADDITIONAL WORK
                        </button>
                        <button className="px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all">
                          VIEW PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Add Maintenance Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          ></div>

          <div className="relative bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Maintenance Task</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a new service or repair task.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vehicle & Service Info */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Task Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle</label>
                        <input type="text" placeholder="e.g. Ford Transit - VIN 8392" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Service Type</label>
                        <input type="text" placeholder="e.g. Oil Change" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Status</label>
                        <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none">
                          <option value={MaintenanceStatus.SCHEDULED}>Scheduled</option>
                          <option value={MaintenanceStatus.IN_SHOP}>In Shop</option>
                          <option value={MaintenanceStatus.OVERDUE}>Overdue</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Logistics & Cost</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Assignee</label>
                        <input type="text" placeholder="e.g. John Mechanic" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Cost Estimate ($)</label>
                        <input type="text" placeholder="150.00" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Scheduled Date</label>
                        <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
