import React, { useState, useEffect } from 'react';
import { VehicleStatus, Vehicle, InsuranceRecordType, InsuranceStatus, MaintenanceStatus, BranchLocation, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InsuranceRecord {
  id: string;
  recordType: InsuranceRecordType;
  dateRenewed: string;
  expiryDate: string;
  provider: string;
  policyNumber: string;
  cost: number;
  status: InsuranceStatus;
  daysUntilExpiry: number;
}

interface MaintenanceRecord {
  id: string;
  serviceType: string;
  status: string;
  assigneeName: string;
  costEstimate: string;
  scheduledDate: string;
  arrivalMileage?: number;
  notes?: string;
}

interface BookingRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
}

const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showListOnMobile, setShowListOnMobile] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  // Add Vehicle State
  const [locations, setLocations] = useState<BranchLocation[]>([]);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    year: '',
    trim: '',
    plate: '',
    vin: '',
    location: '',
    dailyRate: '',
    mileage: '',
    category: 'B' as 'A' | 'B' | 'C'
  });

  const fetchLocations = async () => {
    if (!profile?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('branch_locations')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedLocations: BranchLocation[] = (data || []).map(l => ({
        id: l.id,
        name: l.name,
        address: l.address,
        isDefault: l.is_default
      }));
      setLocations(mappedLocations);

      // Set default location if available
      const defaultLoc = mappedLocations.find(l => l.isDefault);
      if (defaultLoc) {
        setNewVehicle(prev => ({ ...prev, location: defaultLoc.address }));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    if (showListOnMobile || !selectedVehicleId) {
      // Refresh locations when back to list view or similar triggers, 
      // or just call it on mount if we want. 
      // For now, let's call it when opening the modal or on mount.
      fetchLocations();
    }
  }, [profile?.org_id]); // Fetch on mount/profile load

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    try {
      if (editingVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            name: newVehicle.name,
            year: parseInt(newVehicle.year) || new Date().getFullYear(),
            trim: newVehicle.trim,
            plate: newVehicle.plate,
            vin: newVehicle.vin,
            location: newVehicle.location,
            mileage: parseInt(newVehicle.mileage) || 0,
            daily_rate: parseFloat(newVehicle.dailyRate.replace(/[^0-9.]/g, '')) || 0,
            category: newVehicle.category,
            updated_by: profile.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVehicle.id);

        if (error) throw error;
      } else {
        // Insert new vehicle
        const { error } = await supabase.from('vehicles').insert([{
          org_id: profile.org_id,
          name: newVehicle.name,
          year: parseInt(newVehicle.year) || new Date().getFullYear(),
          trim: newVehicle.trim,
          plate: newVehicle.plate,
          vin: newVehicle.vin,
          status: VehicleStatus.AVAILABLE,
          location: newVehicle.location,
          mileage: parseInt(newVehicle.mileage) || 0,
          daily_rate: parseFloat(newVehicle.dailyRate.replace(/[^0-9.]/g, '')) || 0,
          category: newVehicle.category,
          updated_by: profile.id
        }]);

        if (error) throw error;
      }

      setIsAddModalOpen(false);
      setEditingVehicle(null);
      setNewVehicle({
        name: '',
        year: '',
        trim: '',
        plate: '',
        vin: '',
        location: '',
        dailyRate: '',
        mileage: '',
        category: 'B' as 'A' | 'B' | 'C'
      });
      fetchVehicles();
      // Refetch locations to reset default if needed
      fetchLocations();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle. Please check input.');
    }
  };

  // Detail data states
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchVehicles = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          updated_by_profile:profiles!vehicles_updated_by_fkey(id, full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedVehicles: Vehicle[] = (data || []).map(v => ({
        id: v.id,
        name: v.name,
        year: v.year?.toString() || '',
        trim: v.trim || '',
        image: v.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=300',
        plate: v.plate || '',
        vin: v.vin || '',
        status: v.status as VehicleStatus,
        location: v.location || '',
        mileage: v.mileage || '0',
        dailyRate: v.daily_rate || '$0.00',
        category: v.category,
        updatedAt: v.updated_at,
        updatedBy: v.updated_by_profile ? {
          id: v.updated_by_profile.id,
          fullName: v.updated_by_profile.full_name
        } : undefined
      }));

      setVehicles(mappedVehicles);
      if (mappedVehicles.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(mappedVehicles[0].id);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetails = async (vehicleId: string) => {
    if (!profile?.org_id) return;

    try {
      setDetailLoading(true);

      // Fetch insurance records
      const { data: insuranceData } = await supabase
        .from('insurance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expiry_date', { ascending: true });

      const today = new Date();
      const mappedInsurance: InsuranceRecord[] = (insuranceData || []).map(r => {
        const expiryDate = new Date(r.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: InsuranceStatus = InsuranceStatus.VALID;
        if (daysUntilExpiry < 0) status = InsuranceStatus.EXPIRED;
        else if (daysUntilExpiry <= 30) status = InsuranceStatus.EXPIRING_SOON;

        return {
          id: r.id,
          recordType: r.record_type as InsuranceRecordType,
          dateRenewed: r.date_renewed,
          expiryDate: r.expiry_date,
          provider: r.provider || '',
          policyNumber: r.policy_number || '',
          cost: r.cost || 0,
          status,
          daysUntilExpiry
        };
      });
      setInsuranceRecords(mappedInsurance);

      // Fetch maintenance records
      const { data: maintenanceData } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });

      const mappedMaintenance: MaintenanceRecord[] = (maintenanceData || []).map(m => ({
        id: m.id,
        serviceType: m.service_type || 'General Maintenance',
        status: m.status || 'scheduled',
        assigneeName: m.assignee_name || 'Unassigned',
        costEstimate: m.cost_estimate ? `$${parseFloat(m.cost_estimate).toFixed(2)}` : '-',
        scheduledDate: m.scheduled_date || '',
        arrivalMileage: m.arrival_mileage,
        notes: m.notes
      }));
      setMaintenanceRecords(mappedMaintenance);

      // Fetch booking history
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          payment_status,
          customer:customers(name, email)
        `)
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });

      const mappedBookings: BookingRecord[] = (bookingData || []).map(b => ({
        id: b.id,
        customerName: (b.customer as any)?.name || 'Unknown',
        customerEmail: (b.customer as any)?.email || '',
        startDate: b.start_date,
        endDate: b.end_date,
        status: b.status,
        paymentStatus: b.payment_status
      }));
      setBookingHistory(mappedBookings);

    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [profile?.org_id]);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchVehicleDetails(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const handleStatusUpdate = async (newStatus: VehicleStatus) => {
    if (!selectedVehicleId || !profile?.org_id) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          status: newStatus,
          updated_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVehicleId)
        .eq('org_id', profile.org_id);

      if (error) throw error;

      // Update local state
      setVehicles(prev => prev.map(v =>
        v.id === selectedVehicleId ? { ...v, status: newStatus } : v
      ));

      // If we are editing the vehicle currently, update that too
      if (editingVehicle?.id === selectedVehicleId) {
        setEditingVehicle(prev => prev ? { ...prev, status: newStatus } : null);
      }

    } catch (error) {
      console.error('Error updating vehicle status:', error);
      alert('Failed to update vehicle status');
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || (vehicles.length > 0 ? vehicles[0] : null);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20';
      case VehicleStatus.RENTED: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20';
      case VehicleStatus.MAINTENANCE: return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setShowListOnMobile(false);
    setActiveTab('Overview');
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchLower) ||
      vehicle.plate.toLowerCase().includes(searchLower) ||
      vehicle.vin.toLowerCase().includes(searchLower);

    const matchesTier = tierFilter === 'All' || vehicle.category === tierFilter;

    if (activeFilter === 'All') return matchesSearch && matchesTier;
    if (activeFilter === 'Available') return matchesSearch && vehicle.status === VehicleStatus.AVAILABLE && matchesTier;
    if (activeFilter === 'Rented') return matchesSearch && vehicle.status === VehicleStatus.RENTED && matchesTier;
    if (activeFilter === 'Maintenance') return matchesSearch && vehicle.status === VehicleStatus.MAINTENANCE && matchesTier;

    return matchesSearch && matchesTier;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInsuranceStatusBadge = (status: InsuranceStatus) => {
    switch (status) {
      case InsuranceStatus.EXPIRED:
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 text-[10px] font-bold rounded-full">Expired</span>;
      case InsuranceStatus.EXPIRING_SOON:
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-[10px] font-bold rounded-full">Expiring Soon</span>;
      case InsuranceStatus.VALID:
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-[10px] font-bold rounded-full">Valid</span>;
    }
  };

  const getRecordTypeLabel = (type: InsuranceRecordType) => {
    switch (type) {
      case InsuranceRecordType.INSURANCE: return 'Insurance';
      case InsuranceRecordType.REGISTRATION: return 'Registration';
      case InsuranceRecordType.SAFETY_STICKER: return 'Safety Sticker';
      default: return type;
    }
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'done' || normalizedStatus === 'completed') {
      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-[10px] font-bold rounded-full">Completed</span>;
    }
    if (normalizedStatus === 'in_shop' || normalizedStatus === 'in-shop' || normalizedStatus === 'in progress') {
      return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 text-[10px] font-bold rounded-full">In Shop</span>;
    }
    if (normalizedStatus === 'overdue') {
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 text-[10px] font-bold rounded-full">Overdue</span>;
    }
    return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 text-[10px] font-bold rounded-full">Scheduled</span>;
  };

  // Calculate insurance summary
  const insuranceSummary = {
    expired: insuranceRecords.filter(r => r.status === InsuranceStatus.EXPIRED).length,
    expiringSoon: insuranceRecords.filter(r => r.status === InsuranceStatus.EXPIRING_SOON).length,
    valid: insuranceRecords.filter(r => r.status === InsuranceStatus.VALID).length
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark relative">
      {/* Left Sidebar: Vehicle List */}
      <div className={`
        ${showListOnMobile || !selectedVehicleId ? 'flex' : 'hidden lg:flex'}
        w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 flex-col bg-white dark:bg-surface-dark h-full shrink-0 z-10
      `}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fleet</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add New
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{vehicles.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Available</p>
              <p className="text-xl font-bold text-emerald-600">{vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length}</p>
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search plate, VIN, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/50">
            <p className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fleet Segment</p>
            {['All', 'A', 'B', 'C'].map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${tierFilter === tier
                  ? 'bg-slate-900 text-white shadow-md dark:bg-primary'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50'
                  }`}
              >
                {tier === 'All' ? 'ALL TIERS' :
                  tier === 'A' ? 'PREMIER (A)' :
                    tier === 'B' ? 'STANDARD (B)' :
                      'BUDGET (C)'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Available', 'Rented', 'Maintenance'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === filter ? 'bg-slate-900 text-white shadow-sm dark:bg-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm mb-1">No vehicles found</p>
              {searchQuery && <p className="text-[10px] text-slate-500">Matching "{searchQuery}"</p>}
            </div>
          ) : filteredVehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => handleSelectVehicle(vehicle.id)}
              className={`w-full p-4 flex gap-3 text-left transition-colors relative ${selectedVehicleId === vehicle.id ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
              {selectedVehicleId === vehicle.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                <img src={vehicle.image} alt="" className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{vehicle.plate}</h3>
                  <div className="flex gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                    {vehicle.category && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${vehicle.category === 'A' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        vehicle.category === 'B' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {vehicle.category}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">{vehicle.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Vehicle Details */}
      <div className={`
        ${!showListOnMobile && selectedVehicleId ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col overflow-y-auto h-full
      `}>
        {selectedVehicle ? (
          <>
            {/* Mobile Header Controls */}
            <div className="lg:hidden p-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                onClick={() => setShowListOnMobile(true)}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="text-sm font-medium ml-1">Back to List</span>
              </button>
            </div>

            <div className="p-4 md:p-8 space-y-6">
              {/* Header Profile Card */}
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative self-center md:self-start">
                    <div className="size-24 md:size-32 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm">
                      <img src={selectedVehicle.image} alt="" className="size-full object-cover" />
                    </div>
                    <div className={`absolute -bottom-2 -right-2 size-8 rounded-lg border-2 border-white dark:border-surface-dark flex items-center justify-center ${getStatusColor(selectedVehicle.status)}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {selectedVehicle.status === VehicleStatus.AVAILABLE ? 'check' : selectedVehicle.status === VehicleStatus.RENTED ? 'key' : 'build'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-wide">{selectedVehicle.plate}</h1>
                          {selectedVehicle.category && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-black border-2 ${selectedVehicle.category === 'A' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              selectedVehicle.category === 'B' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              Tier {selectedVehicle.category}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1 text-slate-500 text-sm">
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            {selectedVehicle.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            {selectedVehicle.year}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">sell</span>
                            {selectedVehicle.trim}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            {selectedVehicle.location || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingVehicle(selectedVehicle);
                            setNewVehicle({
                              name: selectedVehicle.name,
                              year: selectedVehicle.year,
                              trim: selectedVehicle.trim,
                              plate: selectedVehicle.plate,
                              vin: selectedVehicle.vin,
                              location: selectedVehicle.location,
                              dailyRate: selectedVehicle.dailyRate.toString().replace(/[^0-9.]/g, ''),
                              mileage: selectedVehicle.mileage.toString(),
                              category: selectedVehicle.category || 'B'
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90">Create Booking</button>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded flex items-center gap-1 ${getStatusColor(selectedVehicle.status)}`}>
                        {selectedVehicle.status}
                      </span>
                      {selectedVehicle.status === VehicleStatus.MAINTENANCE && profile?.role === UserRole.SUPERADMIN && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to mark this vehicle as Available?')) {
                              handleStatusUpdate(VehicleStatus.AVAILABLE);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Mark as Available
                        </button>
                      )}
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] md:text-xs font-bold rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">speed</span>
                        {selectedVehicle.mileage} mi
                      </span>
                      <span className="px-3 py-1 bg-green-50 text-green-600 dark:bg-green-900/20 text-[10px] md:text-xs font-bold rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">payments</span>
                        {selectedVehicle.dailyRate}/day
                      </span>
                    </div>

                    {selectedVehicle.updatedBy && (
                      <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-slate-400 mt-4 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        <span>Last edited by <span className="font-semibold text-slate-500 truncate max-w-[120px] inline-block align-bottom">{selectedVehicle.updatedBy.fullName}</span> on {new Date(selectedVehicle.updatedAt!).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-6 md:gap-8 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                  {['Overview', 'Insurance', 'Maintenance', 'History'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    {/* Vehicle Details */}
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Vehicle Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">License Plate</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedVehicle.plate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">VIN Number</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">{selectedVehicle.vin}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Mileage</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedVehicle.mileage} miles</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Daily Rate</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedVehicle.dailyRate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Location</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedVehicle.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${getStatusColor(selectedVehicle.status)}`}>
                            {selectedVehicle.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Insurance Summary */}
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Insurance & Registration</h3>
                        <button onClick={() => setActiveTab('Insurance')} className="text-sm font-bold text-primary hover:underline">View All</button>
                      </div>
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : insuranceRecords.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No insurance records found.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                            <p className="text-2xl font-bold text-red-600">{insuranceSummary.expired}</p>
                            <p className="text-xs font-medium text-red-600/70">Expired</p>
                          </div>
                          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                            <p className="text-2xl font-bold text-amber-600">{insuranceSummary.expiringSoon}</p>
                            <p className="text-xs font-medium text-amber-600/70">Expiring Soon</p>
                          </div>
                          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                            <p className="text-2xl font-bold text-emerald-600">{insuranceSummary.valid}</p>
                            <p className="text-xs font-medium text-emerald-600/70">Valid</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Total Bookings</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{bookingHistory.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Maintenance Records</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{maintenanceRecords.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Insurance Records</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{insuranceRecords.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Actions */}
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                          <span className="material-symbols-outlined p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-[20px]">build</span>
                          <span className="text-sm font-semibold">Schedule Maintenance</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                          <span className="material-symbols-outlined p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[20px]">shield</span>
                          <span className="text-sm font-semibold">Add Insurance Record</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors">
                          <span className="material-symbols-outlined p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-[20px]">delete</span>
                          <span className="text-sm font-semibold">Remove Vehicle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Insurance' && (
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">shield</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Insurance & Registration Records</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {insuranceRecords.length} Records
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : insuranceRecords.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">shield</span>
                        <p className="font-medium">No insurance records found</p>
                        <p className="text-sm">Add insurance, registration, or safety sticker records for this vehicle.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Renewed</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Expires</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {insuranceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{getRecordTypeLabel(record.recordType)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{record.provider || '-'}</p>
                                <p className="text-[10px] text-slate-400">{record.policyNumber || '-'}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(record.dateRenewed)}</td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(record.expiryDate)}</p>
                                <p className={`text-[10px] ${record.daysUntilExpiry < 0 ? 'text-red-500' : record.daysUntilExpiry <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                                  {record.daysUntilExpiry < 0 ? `${Math.abs(record.daysUntilExpiry)} days overdue` : `${record.daysUntilExpiry} days left`}
                                </p>
                              </td>
                              <td className="px-6 py-4">{getInsuranceStatusBadge(record.status)}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Maintenance' && (
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">build</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance History</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {maintenanceRecords.length} Records
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : maintenanceRecords.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">build</span>
                        <p className="font-medium">No maintenance records found</p>
                        <p className="text-sm">Schedule maintenance tasks for this vehicle.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Service</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignee</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Est.</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mileage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {maintenanceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{record.serviceType}</span>
                                {record.notes && <p className="text-[10px] text-slate-400 mt-0.5">{record.notes}</p>}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(record.scheduledDate)}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{record.assigneeName}</td>
                              <td className="px-6 py-4">{getMaintenanceStatusBadge(record.status)}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{record.costEstimate}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {record.arrivalMileage ? `${record.arrivalMileage} mi` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'History' && (
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">history</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Booking History</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {bookingHistory.length} Bookings
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : bookingHistory.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
                        <p className="font-medium">No booking history found</p>
                        <p className="text-sm">This vehicle hasn't been rented yet.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {bookingHistory.map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{booking.customerName}</p>
                                <p className="text-[10px] text-slate-400">{booking.customerEmail}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(booking.startDate)}</p>
                                <p className="text-[10px] text-slate-400">to {formatDate(booking.endDate)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                  booking.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                                    booking.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                                      'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                  }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                  booking.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30'
                                  }`}>
                                  {booking.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <span className="material-symbols-outlined text-6xl mb-4">directions_car</span>
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">No Vehicle Selected</h3>
            <p className="max-w-xs mt-2">Select a vehicle from the list to view its details or add a new one.</p>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal (keeping the existing modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingVehicle(null);
            }}
          ></div>

          <div className="relative bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingVehicle ? `Update details for ${editingVehicle.plate}` : 'Register a new vehicle to your fleet.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              <form onSubmit={handleRegisterVehicle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle Name</label>
                        <input
                          type="text"
                          required
                          value={newVehicle.name}
                          onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                          placeholder="e.g. Toyota Camry"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Year</label>
                        <input
                          type="text"
                          required
                          value={newVehicle.year}
                          onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                          placeholder="2024"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Trim / Model</label>
                        <input
                          type="text"
                          value={newVehicle.trim}
                          onChange={e => setNewVehicle({ ...newVehicle, trim: e.target.value })}
                          placeholder="e.g. SE Hybrid"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Daily Rate ($)</label>
                        <input
                          type="number"
                          required
                          value={newVehicle.dailyRate}
                          onChange={e => setNewVehicle({ ...newVehicle, dailyRate: e.target.value })}
                          placeholder="50.00"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle Category</label>
                        <select
                          value={newVehicle.category}
                          onChange={e => setNewVehicle({ ...newVehicle, category: e.target.value as 'A' | 'B' | 'C' })}
                          disabled={profile?.role !== 'Superadmin'}
                          className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all ${profile?.role !== 'Superadmin' ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <option value="A">Premier (A)</option>
                          <option value="B">Standard (B)</option>
                          <option value="C">Budget (C)</option>
                        </select>
                        {profile?.role !== 'Superadmin' && (
                          <p className="text-[10px] text-amber-500 mt-1 ml-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            Only Superadmin can change categories
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Identification & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">License Plate</label>
                        <input
                          type="text"
                          required
                          value={newVehicle.plate}
                          onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                          placeholder="ABC-1234"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">VIN Number</label>
                        <input
                          type="text"
                          required
                          value={newVehicle.vin}
                          onChange={e => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                          placeholder="17-character VIN"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Current Mileage</label>
                        <input
                          type="number"
                          value={newVehicle.mileage}
                          onChange={e => setNewVehicle({ ...newVehicle, mileage: e.target.value })}
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Location</label>
                        <div className="relative">
                          <select
                            value={newVehicle.location}
                            onChange={e => setNewVehicle({ ...newVehicle, location: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                          >
                            <option value="">Select a location...</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.address}>{loc.name} ({loc.address})</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 md:px-8 md:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3 -mx-8 -mb-8 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingVehicle(null);
                    }}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
