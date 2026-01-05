import React, { useState, useEffect } from 'react';
import { InsuranceRecordType, InsuranceStatus, InsuranceRecord } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Insurance: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Records');
  const [activeType, setActiveType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newRecord, setNewRecord] = useState({
    vehicle_id: '',
    record_type: InsuranceRecordType.INSURANCE,
    date_renewed: '',
    expiry_date: '',
    provider: '',
    policy_number: '',
    cost: '',
    notes: ''
  });

  const fetchRecords = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insurance_records')
        .select(`
          *,
          vehicle: vehicles(name, plate, image_url)
        `)
        .eq('org_id', profile.org_id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const mappedRecords: InsuranceRecord[] = (data || []).map((r: any) => {
        const today = new Date();
        const expiryDate = new Date(r.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: InsuranceStatus = InsuranceStatus.VALID;
        if (daysUntilExpiry < 0) {
          status = InsuranceStatus.EXPIRED;
        } else if (daysUntilExpiry <= 30) {
          status = InsuranceStatus.EXPIRING_SOON;
        }

        return {
          id: r.id,
          vehicleId: r.vehicle_id,
          vehicleName: r.vehicle?.name || 'Unknown Vehicle',
          vehiclePlate: r.vehicle?.plate || 'N/A',
          vehicleImage: r.vehicle?.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=300',
          recordType: r.record_type as InsuranceRecordType,
          dateRenewed: r.date_renewed,
          expiryDate: r.expiry_date,
          provider: r.provider,
          policyNumber: r.policy_number,
          cost: r.cost,
          notes: r.notes,
          status,
          daysUntilExpiry
        };
      });

      setRecords(mappedRecords);
    } catch (error) {
      console.error('Error fetching insurance records:', error);
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

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, [profile?.org_id]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('insurance_records')
        .insert([{
          org_id: profile.org_id,
          vehicle_id: newRecord.vehicle_id,
          record_type: newRecord.record_type,
          date_renewed: newRecord.date_renewed,
          expiry_date: newRecord.expiry_date,
          provider: newRecord.provider || null,
          policy_number: newRecord.policy_number || null,
          cost: newRecord.cost ? parseFloat(newRecord.cost) : null,
          notes: newRecord.notes || null
        }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setNewRecord({
        vehicle_id: '',
        record_type: InsuranceRecordType.INSURANCE,
        date_renewed: '',
        expiry_date: '',
        provider: '',
        policy_number: '',
        cost: '',
        notes: ''
      });
      fetchRecords();
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    {
      label: 'Expired',
      value: records.filter(r => r.status === InsuranceStatus.EXPIRED).length.toString(),
      icon: 'error',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    },
    {
      label: 'Expiring Soon',
      value: records.filter(r => r.status === InsuranceStatus.EXPIRING_SOON).length.toString(),
      icon: 'warning',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600'
    },
    {
      label: 'Valid',
      value: records.filter(r => r.status === InsuranceStatus.VALID).length.toString(),
      icon: 'verified',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600'
    }
  ];

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.provider?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter by status tab
    if (activeTab === 'Expired') return record.status === InsuranceStatus.EXPIRED;
    if (activeTab === 'Expiring Soon') return record.status === InsuranceStatus.EXPIRING_SOON;
    if (activeTab === 'Valid') return record.status === InsuranceStatus.VALID;

    // Filter by type
    if (activeType !== 'all' && record.recordType !== activeType) return false;

    return true;
  });

  const getStatusBadge = (status: InsuranceStatus) => {
    switch (status) {
      case InsuranceStatus.EXPIRED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/20 text-xs font-bold rounded-full border border-red-100 dark:border-red-800">
            <span className="size-1.5 rounded-full bg-red-600"></span>
            Expired
          </span>
        );
      case InsuranceStatus.EXPIRING_SOON:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/20 text-xs font-bold rounded-full border border-amber-100 dark:border-amber-800">
            <span className="size-1.5 rounded-full bg-amber-600"></span>
            Expiring Soon
          </span>
        );
      case InsuranceStatus.VALID:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600"></span>
            Valid
          </span>
        );
      default:
        return null;
    }
  };

  const getRecordTypeBadge = (type: InsuranceRecordType) => {
    switch (type) {
      case InsuranceRecordType.INSURANCE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
            Insurance
          </span>
        );
      case InsuranceRecordType.REGISTRATION:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 dark:bg-purple-900/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
            Registration
          </span>
        );
      case InsuranceRecordType.SAFETY_STICKER:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-teal-600 dark:bg-teal-900/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
            Safety Sticker
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-background-dark p-4 md:p-8 space-y-8 relative">
      {/* Page Header */}
      <div className="space-y-4">
        <nav className="flex text-xs font-medium text-slate-400 gap-2">
          <span className="hover:text-primary cursor-pointer">Dashboard</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300">Insurance & Registration</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Insurance & Registration</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track vehicle insurance, registration, and safety stickers.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Record
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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            {['All Records', 'Expired', 'Expiring Soon', 'Valid'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          >
            <option value="all">All Types</option>
            <option value="insurance">Insurance</option>
            <option value="registration">Registration</option>
            <option value="safety_sticker">Safety Sticker</option>
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search vehicle or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="border-t border-slate-100 dark:border-slate-800 -mx-4 md:mx-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4">shield</span>
              <p className="text-xl font-bold">No records found</p>
              <p>Add insurance, registration, or safety sticker records to track them.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Provider / Policy</th>
                  <th className="px-6 py-4">Renewed</th>
                  <th className="px-6 py-4">Expires</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          <img src={record.vehicleImage} alt="" className="size-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{record.vehicleName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{record.vehiclePlate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getRecordTypeBadge(record.recordType)}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white">{record.provider || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{record.policyNumber || '-'}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(record.dateRenewed)}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white">{formatDate(record.expiryDate)}</p>
                      <p className={`text-xs mt-0.5 ${record.daysUntilExpiry < 0 ? 'text-red-500' : record.daysUntilExpiry <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {record.daysUntilExpiry < 0
                          ? `${Math.abs(record.daysUntilExpiry)} days overdue`
                          : record.daysUntilExpiry === 0
                            ? 'Expires today'
                            : `${record.daysUntilExpiry} days left`}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">
                      {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Record</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track insurance, registration, or safety sticker.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRecord}>
              <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="space-y-6">
                  {/* Vehicle & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle *</label>
                      <select
                        required
                        value={newRecord.vehicle_id}
                        onChange={(e) => setNewRecord({ ...newRecord, vehicle_id: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                      >
                        <option value="">Select a vehicle...</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Record Type *</label>
                      <select
                        required
                        value={newRecord.record_type}
                        onChange={(e) => setNewRecord({ ...newRecord, record_type: e.target.value as InsuranceRecordType })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                      >
                        <option value="insurance">Insurance</option>
                        <option value="registration">Registration</option>
                        <option value="safety_sticker">Safety Sticker</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Date Renewed *</label>
                      <input
                        type="date"
                        required
                        value={newRecord.date_renewed}
                        onChange={(e) => setNewRecord({ ...newRecord, date_renewed: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={newRecord.expiry_date}
                        onChange={(e) => setNewRecord({ ...newRecord, expiry_date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Provider & Policy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Provider / Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. State Farm, DMV"
                        value={newRecord.provider}
                        onChange={(e) => setNewRecord({ ...newRecord, provider: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Policy / Reference Number</label>
                      <input
                        type="text"
                        placeholder="e.g. POL-123456"
                        value={newRecord.policy_number}
                        onChange={(e) => setNewRecord({ ...newRecord, policy_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newRecord.cost}
                        onChange={(e) => setNewRecord({ ...newRecord, cost: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Additional notes..."
                      value={newRecord.notes}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 md:px-8 md:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;
