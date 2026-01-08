import React, { useState, useEffect } from 'react';
import { MaintenanceStatus, MaintenanceTask } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Maintenance: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const emptyTask = {
    vehicle_id: '',
    staff_id: '',
    service_type: '',
    status: MaintenanceStatus.SCHEDULED,
    cost_estimate: '',
    scheduled_date: '',
    work_order_number: ''
  };

  const [newTask, setNewTask] = useState(emptyTask);

  const fetchTasks = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicle: vehicles(name, vin, image_url),
          assigned_staff: staff(id, first_name, last_name)
        `)
        .eq('org_id', profile.org_id);

      if (error) throw error;

      const mappedTasks: MaintenanceTask[] = (data || []).map((t: any) => {
        let normalizedStatus: MaintenanceStatus = MaintenanceStatus.SCHEDULED;
        const dbStatus = (t.status || '').toLowerCase();

        if (dbStatus === 'overdue') normalizedStatus = MaintenanceStatus.OVERDUE;
        else if (dbStatus === 'in_shop' || dbStatus === 'in-shop' || dbStatus === 'in progress') normalizedStatus = MaintenanceStatus.IN_SHOP;
        else if (dbStatus === 'done' || dbStatus === 'completed') normalizedStatus = MaintenanceStatus.DONE;
        else normalizedStatus = MaintenanceStatus.SCHEDULED;

        const staffName = t.assigned_staff ? `${t.assigned_staff.first_name} ${t.assigned_staff.last_name}` : (t.assignee_name || 'Service Dept');

        return {
          id: t.id,
          workOrderNumber: t.work_order_number || 'N/A',
          staffId: t.staff_id,
          vehicleName: t.vehicle?.name || 'Unknown Vehicle',
          vehicleVin: t.vehicle?.vin || 'N/A',
          vehicleImage: t.vehicle?.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=300',
          serviceType: t.service_type || 'General Maintenance',
          status: normalizedStatus,
          assigneeName: staffName,
          assigneeAvatar: `https://i.pravatar.cc/150?u=${staffName}`,
          costEstimate: t.cost_estimate ? (t.cost_estimate.startsWith('$') ? t.cost_estimate : `$${parseFloat(t.cost_estimate).toFixed(2)}`) : '$0.00',
          currentStep: t.current_step || (normalizedStatus === MaintenanceStatus.DONE ? 'Done' : normalizedStatus === MaintenanceStatus.IN_SHOP ? 'In Shop' : 'Scheduled'),
          estCompletion: t.scheduled_date || 'N/A'
        };
      });

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching maintenance tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (!profile?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, name, plate')
        .eq('org_id', profile.org_id);
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchStaff = async () => {
    if (!profile?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, department, job_title')
        .eq('org_id', profile.org_id)
        .in('department', ['Workshop', 'Maintenance']);

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchVehicles();
    fetchStaff();
  }, [profile?.org_id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('maintenance_records')
        .insert([{
          vehicle_id: newTask.vehicle_id,
          staff_id: newTask.staff_id,
          service_type: newTask.service_type,
          status: newTask.status,
          cost_estimate: newTask.cost_estimate,
          scheduled_date: newTask.scheduled_date,
          work_order_number: newTask.work_order_number,
          org_id: profile.org_id
        }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setNewTask(emptyTask);
      fetchTasks();
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      alert('Failed to add maintenance task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id || !editingTaskId) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('maintenance_records')
        .update({
          vehicle_id: newTask.vehicle_id,
          staff_id: newTask.staff_id,
          service_type: newTask.service_type,
          status: newTask.status,
          cost_estimate: newTask.cost_estimate,
          scheduled_date: newTask.scheduled_date,
          work_order_number: newTask.work_order_number,
        })
        .eq('id', editingTaskId)
        .eq('org_id', profile.org_id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingTaskId(null);
      setNewTask(emptyTask);
      fetchTasks();
    } catch (error) {
      console.error('Error updating maintenance task:', error);
      alert('Failed to update maintenance task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!profile?.org_id) return;
    if (!window.confirm('Are you sure you want to delete this maintenance task?')) return;

    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id)
        .eq('org_id', profile.org_id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting maintenance task:', error);
      alert('Failed to delete maintenance task.');
    }
  };

  const openEditModal = (task: MaintenanceTask) => {
    // Find the original record to get the staff_id and vehicle_id
    const originalRecord = tasks.find(t => t.id === task.id);
    if (!originalRecord) return;

    // We need to fetch the actual DB record to get foreign keys if they aren't in the mapped task
    // OR we could ensure they are in the mapped task. Let's assume we can get them or fetch them.
    // For now, let's just use what we have if we update the fetch logic to include them.

    // Actually, let's just use the task.id and fetch the single record from DB for full accuracy
    fetchSingleRecord(task.id);
  };

  const fetchSingleRecord = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setNewTask({
        vehicle_id: data.vehicle_id || '',
        staff_id: data.staff_id || '',
        service_type: data.service_type || '',
        status: data.status as MaintenanceStatus,
        cost_estimate: data.cost_estimate || '',
        scheduled_date: data.scheduled_date || '',
        work_order_number: data.work_order_number || ''
      });
      setEditingTaskId(id);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching single record:', error);
    }
  };

  const stats = [
    {
      label: 'In Shop',
      value: tasks.filter(t => t.status === MaintenanceStatus.IN_SHOP).length.toString(),
      icon: 'precision_manufacturing',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Upcoming',
      value: tasks.filter(t => t.status === MaintenanceStatus.SCHEDULED).length.toString(),
      icon: 'calendar_today',
      iconBg: 'bg-slate-50 dark:bg-slate-800',
      iconColor: 'text-slate-600'
    },
    {
      label: 'Overdue',
      value: tasks.filter(t => t.status === MaintenanceStatus.OVERDUE).length.toString(),
      icon: 'warning',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicleVin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'All Tasks') return true;
    if (activeTab === 'Upcoming') return task.status === MaintenanceStatus.SCHEDULED;
    if (activeTab === 'In Progress') return task.status === MaintenanceStatus.IN_SHOP;
    if (activeTab === 'History') return task.status === MaintenanceStatus.DONE;
    return true;
  });

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
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
      case MaintenanceStatus.OVERDUE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 text-xs font-bold rounded-full border border-red-100 dark:border-red-800">
            <span className="size-1.5 rounded-full bg-red-600"></span>
            Overdue
          </span>
        );
      case MaintenanceStatus.DONE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600"></span>
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-background-dark p-4 md:p-8 space-y-8 relative">
      {/* Page Header */}
      <div className="space-y-4">
        <nav className="flex text-xs font-medium text-slate-400 gap-2">
          <span className="hover:text-primary cursor-pointer">Dashboard</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300">Maintenance</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Fleet Maintenance</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor service history, repair status, and schedules.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Task
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className={`size-12 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto overflow-x-auto scrollbar-hide">
          {['All Tasks', 'Upcoming', 'In Progress', 'History'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search vehicle or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="border-t border-slate-100 dark:border-slate-800 -mx-4 md:mx-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4">build_circle</span>
              <p className="text-xl font-bold">No tasks found</p>
              <p>Everything seems to be in order!</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Work Order #</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Cost Est.</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsOpen(true);
                        }}
                        className="font-bold text-primary hover:text-primary/80 transition-colors hover:underline"
                      >
                        #{task.workOrderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          <img src={task.vehicleImage} alt="" className="size-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{task.vehicleName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{task.vehicleVin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white">{task.serviceType}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{task.currentStep}</p>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                          <img src={task.assigneeAvatar} alt="" className="size-full object-cover" />
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{task.assigneeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">
                      {task.costEstimate}
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">
                      {task.estCompletion}
                    </td>
                    <td className="px-6 py-5 text-center relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>

                      {activeMenuId === task.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenuId(null)}
                          ></div>
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in duration-150">
                            <button
                              onClick={() => {
                                openEditModal(task);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                              Edit Order
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteTask(task.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                              Delete Task
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Work Order Details Drawer */}
      {isDetailsOpen && selectedTask && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDetailsOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg bg-white dark:bg-surface-dark h-full shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Work Order Details</h2>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md uppercase tracking-wider">
                    #{selectedTask.workOrderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold">Maintenance Record</p>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-88px)]">
              {/* Vehicle Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">directions_car</span>
                  Vehicle Information
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="size-20 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                    <img src={selectedTask.vehicleImage} alt="" className="size-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{selectedTask.vehicleName}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1 tracking-wider uppercase">{selectedTask.vehicleVin}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Workshop</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Status */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">handyman</span>
                  Service & Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Service Type</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedTask.serviceType}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{selectedTask.currentStep}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Status</p>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>
              </div>

              {/* Logistics & Cost */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Logistics & Cost
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-sm">
                        <img src={selectedTask.assigneeAvatar} alt="" className="size-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned To</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTask.assigneeName}</p>
                      </div>
                    </div>
                    <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">chat</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-900 dark:bg-primary text-white shadow-xl shadow-primary/20">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Cost Estimate</p>
                      <p className="text-xl font-black">{selectedTask.costEstimate}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTask.estCompletion}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes or Timeline */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Activity Log
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Maintenance Scheduled</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedTask.estCompletion}</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 size-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <p className="text-xs font-bold text-slate-400">In Shop Inspection</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  openEditModal(selectedTask);
                  setIsDetailsOpen(false);
                }}
                className="flex-1 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit Order
              </button>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
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
              <form id="add-maintenance-form" onSubmit={handleCreateTask} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Details */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Task Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle</label>
                        <select
                          required
                          value={newTask.vehicle_id}
                          onChange={(e) => setNewTask({ ...newTask, vehicle_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select a vehicle...</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Work Order #</label>
                          <input
                            required
                            type="text"
                            value={newTask.work_order_number}
                            onChange={(e) => setNewTask({ ...newTask, work_order_number: e.target.value })}
                            placeholder="e.g. WO-12345"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Service Type</label>
                          <input
                            required
                            type="text"
                            value={newTask.service_type}
                            onChange={(e) => setNewTask({ ...newTask, service_type: e.target.value })}
                            placeholder="e.g. Oil Change"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Status</label>
                          <select
                            value={newTask.status}
                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value as MaintenanceStatus })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                          >
                            <option value={MaintenanceStatus.SCHEDULED}>Scheduled</option>
                            <option value={MaintenanceStatus.IN_SHOP}>In Shop</option>
                            <option value={MaintenanceStatus.OVERDUE}>Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Logistics & Cost</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Assignee (Staff)</label>
                        <select
                          required
                          value={newTask.staff_id}
                          onChange={(e) => setNewTask({ ...newTask, staff_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.department} - {s.job_title})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Cost Estimate ($)</label>
                        <input
                          type="text"
                          value={newTask.cost_estimate}
                          onChange={(e) => setNewTask({ ...newTask, cost_estimate: e.target.value })}
                          placeholder="150.00"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Scheduled Date</label>
                        <input
                          required
                          type="date"
                          value={newTask.scheduled_date}
                          onChange={(e) => setNewTask({ ...newTask, scheduled_date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-maintenance-form"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingTaskId(null);
              setNewTask(emptyTask);
            }}
          ></div>

          <div className="relative bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Maintenance Task</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Update details for work order #{newTask.work_order_number}.</p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTaskId(null);
                  setNewTask(emptyTask);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              <form id="edit-maintenance-form" onSubmit={handleUpdateTask} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Details */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Task Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle</label>
                        <select
                          required
                          value={newTask.vehicle_id}
                          onChange={(e) => setNewTask({ ...newTask, vehicle_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select a vehicle...</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Work Order #</label>
                          <input
                            required
                            type="text"
                            value={newTask.work_order_number}
                            onChange={(e) => setNewTask({ ...newTask, work_order_number: e.target.value })}
                            placeholder="e.g. WO-12345"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Service Type</label>
                          <input
                            required
                            type="text"
                            value={newTask.service_type}
                            onChange={(e) => setNewTask({ ...newTask, service_type: e.target.value })}
                            placeholder="e.g. Oil Change"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Status</label>
                          <select
                            value={newTask.status}
                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value as MaintenanceStatus })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                          >
                            <option value={MaintenanceStatus.SCHEDULED}>Scheduled</option>
                            <option value={MaintenanceStatus.IN_SHOP}>In Shop</option>
                            <option value={MaintenanceStatus.OVERDUE}>Overdue</option>
                            <option value={MaintenanceStatus.DONE}>Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logistics */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Logistics & Cost</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Assignee (Staff)</label>
                        <select
                          required
                          value={newTask.staff_id}
                          onChange={(e) => setNewTask({ ...newTask, staff_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.department} - {s.job_title})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Cost Estimate ($)</label>
                        <input
                          type="text"
                          value={newTask.cost_estimate}
                          onChange={(e) => setNewTask({ ...newTask, cost_estimate: e.target.value })}
                          placeholder="150.00"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Scheduled Date</label>
                        <input
                          required
                          type="date"
                          value={newTask.scheduled_date}
                          onChange={(e) => setNewTask({ ...newTask, scheduled_date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTaskId(null);
                  setNewTask(emptyTask);
                }}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-maintenance-form"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
