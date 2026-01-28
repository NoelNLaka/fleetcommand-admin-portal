import React, { useState, useEffect, useRef } from 'react';
import { CUSTOMERS as STATIC_CUSTOMERS } from '../constants';
import { Customer, CustomerStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Customers: React.FC = () => {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    status: CustomerStatus.ACTIVE,
    license_number: '',
    license_state: '',
    license_expiry: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    company: '',
    nid_number: '',
    license_image_url: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchCustomerHistory = async (customerId: string) => {
    if (!profile?.org_id) return;
    try {
      setHistoryLoading(true);
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          payment_status,
          vehicle:vehicles(name, plate, image_url),
          booking_extensions(amount_paid, receipt_no)
        `)
        .eq('customer_id', customerId)
        .order('start_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      const bookings = bookingsData || [];
      if (bookings.length === 0) {
        setRentalHistory([]);
        return;
      }

      const bookingIds = bookings.map(b => b.id);

      // Fetch agreements and extra_charges separately to avoid nested query issues
      const [agreementsRes, chargesRes] = await Promise.all([
        supabase
          .from('agreements')
          .select('booking_id, agreement_doc_id')
          .in('booking_id', bookingIds),
        supabase
          .from('extra_charges')
          .select('*')
          .in('booking_id', bookingIds)
      ]);

      const agreementsByBooking: Record<string, any[]> = {};
      (agreementsRes.data || []).forEach((a: any) => {
        if (!agreementsByBooking[a.booking_id]) agreementsByBooking[a.booking_id] = [];
        agreementsByBooking[a.booking_id].push(a);
      });

      const chargesByBooking: Record<string, any[]> = {};
      (chargesRes.data || []).forEach((c: any) => {
        if (!chargesByBooking[c.booking_id]) chargesByBooking[c.booking_id] = [];
        chargesByBooking[c.booking_id].push(c);
      });

      const enrichedBookings = bookings.map(b => ({
        ...b,
        agreements: agreementsByBooking[b.id] || [],
        extra_charges: chargesByBooking[b.id] || [],
      }));

      setRentalHistory(enrichedBookings);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!profile?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          updated_by_profile:profiles!customers_updated_by_fkey(id, full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('name');

      if (error) throw error;

      const mappedCustomers: Customer[] = (data || []).map(c => ({
        id: c.id,
        name: c.name || 'Unknown Customer',
        email: c.email || '',
        phone: c.phone || '',
        status: c.status as CustomerStatus,
        profileImage: c.license_image_url || `https://i.pravatar.cc/150?u=${c.id}`,
        ratingTier: c.rating_tier as 'A' | 'B' | 'C',
        lastDLDigits: c.license_number ? c.license_number.slice(-4) : '****',
        customerId: c.id.slice(0, 8),
        location: 'Default Location',
        address: c.address || 'N/A',
        licenseVerified: true,
        secondaryPhone: c.secondary_phone || '',
        nextOfKinName: c.next_of_kin_name || '',
        nextOfKinPhone: c.next_of_kin_phone || '',
        company: c.company || '',
        nidNumber: c.nid_number || '',
        licenseImageUrl: c.license_image_url || '',
        license: {
          state: c.license_state || 'State',
          number: c.license_number || 'N/A',
          class: 'C',
          expires: c.license_expiry || 'N/A',
          issued: 'N/A'
        },
        totalBookings: 0,
        totalSpent: '$0.00',
        updatedAt: c.updated_at,
        updatedBy: c.updated_by_profile ? {
          id: c.updated_by_profile.id,
          fullName: c.updated_by_profile.full_name
        } : undefined,
        rating: 4.8,
        joinDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'New',
        isNew: true,
        returnDate: null
      }));

      setCustomers(mappedCustomers);
      if (mappedCustomers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(mappedCustomers[0].id);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLicense = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCustomer.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          license_image_url: publicUrl,
          updated_by: profile?.id
        })
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      await fetchCustomers();
    } catch (err) {
      console.error('Error uploading license:', err);
      alert('Failed to upload license image.');
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      secondary_phone: '',
      address: '',
      status: CustomerStatus.ACTIVE,
      license_number: '',
      license_state: '',
      license_expiry: '',
      next_of_kin_name: '',
      next_of_kin_phone: '',
      company: '',
      nid_number: '',
      license_image_url: '',
      rating_tier: 'B' as 'A' | 'B' | 'C'
    });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedCustomer) return;

    setIsEditMode(true);
    setNewCustomer({
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      secondary_phone: selectedCustomer.secondaryPhone || '',
      address: selectedCustomer.address,
      status: selectedCustomer.status,
      license_number: selectedCustomer.license.number,
      license_state: selectedCustomer.license.state,
      license_expiry: selectedCustomer.license.expires,
      next_of_kin_name: selectedCustomer.nextOfKinName || '',
      next_of_kin_phone: selectedCustomer.nextOfKinPhone || '',
      company: selectedCustomer.company || '',
      nid_number: selectedCustomer.nidNumber || '',
      license_image_url: selectedCustomer.licenseImageUrl || '',
      rating_tier: selectedCustomer.ratingTier || 'B'
    });
    setIsModalOpen(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    try {
      setIsSubmitting(true);

      if (isEditMode && selectedCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            ...newCustomer,
            updated_by: profile?.id
          })
          .eq('id', selectedCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            ...newCustomer,
            org_id: profile.org_id
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      if (!isEditMode) {
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          secondary_phone: '',
          address: '',
          status: CustomerStatus.ACTIVE,
          license_number: '',
          license_state: '',
          license_expiry: '',
          next_of_kin_name: '',
          next_of_kin_phone: '',
          company: '',
          nid_number: '',
          rating_tier: 'B'
        });
      }
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedCustomer.name}? This action cannot be undone and will un-link all related bookings.`);
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      alert('Customer deleted successfully.');
      setSelectedCustomerId(null);
      fetchCustomers();
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBan = async () => {
    if (!selectedCustomer) return;
    if (profile?.role !== 'Superadmin') {
      alert(`Only Superadmin can ${selectedCustomer.status === 'Banned' ? 'unban' : 'ban'} customers.`);
      return;
    }

    const isBanned = selectedCustomer.status === 'Banned';
    const action = isBanned ? 'UNBAN' : 'BAN';

    const confirmed = window.confirm(`Are you sure you want to ${action} ${selectedCustomer.name}? ${isBanned ? 'They will be able to make bookings again.' : 'This customer will no longer be able to make future bookings.'}`);
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('customers')
        .update({
          status: isBanned ? 'Active' : 'Banned',
          updated_by: profile?.id
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      alert(`Customer ${isBanned ? 'unbanned' : 'banned'} successfully.`);
      fetchCustomers();
    } catch (err: any) {
      console.error(`Error ${isBanned ? 'unbanning' : 'banning'} customer:`, err);
      alert(`Failed to ${isBanned ? 'unban' : 'ban'} customer: ` + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [profile?.org_id]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerHistory(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || (customers.length > 0 ? customers[0] : null);

  const calculateBookingOutstanding = (booking: any) => {
    const originalAmount = parseFloat(booking.total_amount || '0');
    const unpaidExt = (booking.booking_extensions || []).filter((e: any) => !e.receipt_no).reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0);
    const unpaidChg = (booking.extra_charges || []).reduce((sum: number, c: any) => sum + (Math.max(0, (c.amount || 0) - (c.amount_paid || 0))), 0);
    const originalOutstanding = booking.payment_status === 'Paid' ? 0 : originalAmount;
    return originalOutstanding + unpaidExt + unpaidChg;
  };

  const totalOutstanding = rentalHistory.reduce((acc, b) => acc + calculateBookingOutstanding(b), 0);

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20';
      case CustomerStatus.PENDING: return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20';
      case CustomerStatus.INACTIVE: return 'bg-slate-100 text-slate-500 dark:bg-slate-800';
      case CustomerStatus.BANNED: return 'bg-red-50 text-red-600 dark:bg-red-900/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setShowListOnMobile(false);
  };

  const filteredCustomers = customers.filter(customer => {
    // Search query filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.license.number.toLowerCase().includes(searchLower);

    // Category filter
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Active Rental') return matchesSearch && customer.status === CustomerStatus.ACTIVE;
    if (activeFilter === 'Banned') return matchesSearch && customer.status === CustomerStatus.BANNED;
    if (activeFilter === 'VIP') return matchesSearch && customer.totalBookings > 5; // Example logic for VIP

    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background-light dark:bg-background-dark relative">
      {/* Left Sidebar: Customer List */}
      <div className={`
        ${showListOnMobile || !selectedCustomerId ? 'flex' : 'hidden lg:flex'} 
        w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 flex-col bg-white dark:bg-surface-dark h-full shrink-0 z-10
      `}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customers</h2>
            <button
              onClick={openAddModal}
              className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add New
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{customers.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Renting</p>
              <p className="text-xl font-bold text-primary">{customers.filter(c => c.status === CustomerStatus.ACTIVE).length}</p>
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search name, license, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Active Rental', 'VIP', 'Banned'].map(filter => (
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
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm mb-1">No customers found</p>
              {searchQuery && <p className="text-[10px] text-slate-500">Matching "{searchQuery}"</p>}
            </div>
          ) : filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer.id)}
              className={`w-full p-4 flex gap-3 text-left transition-colors relative ${selectedCustomerId === customer.id ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
              {selectedCustomerId === customer.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              <img src={customer.profileImage} alt="" className="size-10 rounded-full bg-slate-200 object-cover ring-2 ring-white dark:ring-slate-700" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{customer.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mb-1">{customer.email}</p>
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                  {customer.returnDate ? <span><span className="material-symbols-outlined text-[12px] align-middle mr-1">calendar_today</span>Returned: {customer.returnDate}</span> : <span>{customer.isNew ? 'New Customer' : ''}</span>}
                  <span>DL: ***{customer.lastDLDigits}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Customer Details */}
      <div className={`
        ${!showListOnMobile && selectedCustomerId ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col overflow-y-auto h-full
      `}>
        {selectedCustomer ? (
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
                    <img src={selectedCustomer.profileImage} alt="" className="size-20 md:size-24 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-sm object-cover" />
                    <div className="absolute bottom-0 right-0 bg-emerald-500 size-6 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h1>
                          {selectedCustomer.ratingTier && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-black border-2 ${selectedCustomer.ratingTier === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              selectedCustomer.ratingTier === 'B' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`} title={selectedCustomer.ratingTier === 'A' ? 'Top Client' : selectedCustomer.ratingTier === 'B' ? 'Standard' : 'Risky Client'}>
                              Tier {selectedCustomer.ratingTier}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1 text-slate-500 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            {selectedCustomer.location}
                          </span>
                        </div>
                        {selectedCustomer.status === 'Banned' && (
                          <div className="mt-2 flex items-center gap-2 text-red-600 animate-pulse">
                            <span className="material-symbols-outlined font-black">block</span>
                            <span className="text-sm font-black uppercase tracking-widest italic">Banned Customer</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-2">
                            <button className="p-2 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">call</span></button>
                            <button className="p-2 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">mail</span></button>
                          </div>
                          <button
                            onClick={openEditModal}
                            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          {profile?.role === 'Superadmin' && (
                            <button
                              onClick={handleDeleteCustomer}
                              disabled={isSubmitting}
                              className="p-2 text-red-500 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete Customer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          )}
                          <button className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90">New Rental</button>
                        </div>
                        {totalOutstanding > 0 && (
                          <div className="text-right px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 leading-none mb-1">Total Outstanding</p>
                            <p className="text-lg font-black text-red-600 dark:text-red-400 leading-none text-right">K{totalOutstanding.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-[10px] md:text-xs font-bold rounded flex items-center gap-1">
                        Active Renter
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 text-[10px] md:text-xs font-bold rounded flex items-center gap-1">
                        Verified License
                      </span>
                    </div>

                    {selectedCustomer.updatedBy && (
                      <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-slate-400 mt-2 border-t border-slate-50 dark:border-slate-800/50 pt-2">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        <span>Last edited by <span className="font-semibold text-slate-500 truncate max-w-[120px] inline-block align-bottom">{selectedCustomer.updatedBy.fullName}</span> on {new Date(selectedCustomer.updatedAt!).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-6 md:gap-8 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                  {['Overview', 'Personal Details', 'Booking History'].map(tab => (
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

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Content Area */}
                <div className="xl:col-span-2 space-y-6">
                  {activeTab === 'Overview' && (
                    <>
                      {/* Contact Information */}
                      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mobile Number</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.phone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.email}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Home Address</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Rental History Preview (Increased Spacing) */}
                      <div className="mt-8">
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">history</span>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Rental History</h3>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              {rentalHistory.length} Records
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement ID</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Outstanding</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {historyLoading ? (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        <p className="text-xs font-bold text-slate-400">Loading history...</p>
                                      </div>
                                    </td>
                                  </tr>
                                ) : rentalHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                      No rental history found for this customer.
                                    </td>
                                  </tr>
                                ) : rentalHistory.slice(0, 3).map((booking) => (
                                  <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                                          {booking.vehicle?.image_url ? (
                                            <img src={booking.vehicle.image_url} alt="" className="size-full object-cover" />
                                          ) : (
                                            <div className="size-full flex items-center justify-center text-slate-400 focus:text-primary">
                                              <span className="material-symbols-outlined">directions_car</span>
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-wide">{booking.vehicle?.plate || 'No Plate'}</p>
                                          <p className="text-[10px] font-medium text-slate-500">{booking.vehicle?.name || 'Unknown'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-[10px] font-mono font-bold text-slate-500">
                                        {booking.agreements?.[0]?.agreement_doc_id || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                          {new Date(booking.start_date).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">to {new Date(booking.end_date).toLocaleDateString()}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                          booking.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            booking.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                          }`}>
                                          {booking.status}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        {(() => {
                                          const outstanding = calculateBookingOutstanding(booking);
                                          return outstanding > 0 ? (
                                            <span className="text-xs font-black text-red-600 dark:text-red-400">K{outstanding.toLocaleString()}</span>
                                          ) : (
                                            <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {selectedCustomer.internalNotes && (
                        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl p-4">
                          <p className="text-[10px] uppercase font-bold text-yellow-800 dark:text-yellow-600 mb-2">Internal Notes</p>
                          <p className="text-sm text-yellow-900 dark:text-yellow-700 leading-relaxed">
                            <span className="font-bold">Note:</span> {selectedCustomer.internalNotes}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'Personal Details' && (
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Personal Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Customer Rating</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-black border-2 ${selectedCustomer.ratingTier === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                selectedCustomer.ratingTier === 'B' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {selectedCustomer.ratingTier === 'A' ? 'Top Client (A)' :
                                  selectedCustomer.ratingTier === 'B' ? 'Standard (B)' :
                                    'Risky Client (C)'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Primary Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.phone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Secondary Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.secondaryPhone || 'N/A'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Personal Address</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Company</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.company || 'Self Employed'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">NID Number</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.nidNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Next of Kin</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Name</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.nextOfKinName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Number</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.nextOfKinPhone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">License Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">License Number</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.license.number}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry Date</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCustomer.license.expires}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Booking History' && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">history</span>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Booking History</h3>
                            </div>
                            <div className="relative w-full md:w-64">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                              <input
                                type="text"
                                placeholder="Search bookings..."
                                value={bookingSearchQuery}
                                onChange={(e) => setBookingSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Outstanding</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Payment</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {historyLoading ? (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                      <p className="text-xs font-bold">Loading history...</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : rentalHistory
                                .filter(b =>
                                  !bookingSearchQuery ||
                                  b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                                  b.vehicle?.name?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                                  b.status?.toLowerCase().includes(bookingSearchQuery.toLowerCase())
                                )
                                .slice(0, bookingSearchQuery ? undefined : 5)
                                .map((booking) => (
                                  <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                      <span className="text-[10px] font-mono font-bold text-slate-500">#{booking.id.slice(0, 8).toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-[10px] font-mono font-bold text-slate-500">
                                        {booking.agreements?.[0]?.agreement_doc_id || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="size-8 rounded bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                          {booking.vehicle?.image_url && <img src={booking.vehicle.image_url} alt="" className="size-full object-cover" />}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-wide">{booking.vehicle?.plate || 'No Plate'}</p>
                                          <p className="text-[9px] font-medium text-slate-500">{booking.vehicle?.name || 'Unknown'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                          {new Date(booking.start_date).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">to {new Date(booking.end_date).toLocaleDateString()}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                          booking.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                          }`}>
                                          {booking.status === 'Active' ? 'Current' : booking.status}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        {(() => {
                                          const outstanding = calculateBookingOutstanding(booking);
                                          return outstanding > 0 ? (
                                            <span className="text-sm font-black text-red-600 dark:text-red-400">K{outstanding.toLocaleString()}</span>
                                          ) : (
                                            <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${booking.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                          }`}>
                                          {booking.payment_status || 'Unpaid'}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {rentalHistory.length === 0 && !historyLoading && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                    No records found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Outstanding Summary */}
                      {totalOutstanding > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-red-500">warning</span>
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Outstanding Balance Summary</h3>
                          </div>
                          <div className="space-y-3">
                            {rentalHistory
                              .filter(b => calculateBookingOutstanding(b) > 0)
                              .map(b => {
                                const extraChargesOutstanding = (b.extra_charges || []).reduce((sum: number, c: any) => sum + Math.max(0, (c.amount || 0) - (c.amount_paid || 0)), 0);
                                return (
                                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-red-100 dark:border-red-900/30 last:border-0">
                                    <div>
                                      <p className="text-sm font-bold text-red-800 dark:text-red-300">{b.vehicle?.plate || 'No Plate'}</p>
                                      <p className="text-[10px] text-red-500 font-medium">
                                        {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}
                                        {extraChargesOutstanding > 0 && (
                                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-[9px] font-black">
                                            Extra Charges: K{extraChargesOutstanding.toLocaleString()}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <span className="text-sm font-black text-red-600 dark:text-red-400">K{calculateBookingOutstanding(b).toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-red-200 dark:border-red-800">
                              <span className="text-sm font-black text-red-800 dark:text-red-300 uppercase tracking-wider">Total Outstanding</span>
                              <span className="text-xl font-black text-red-600 dark:text-red-400">K{totalOutstanding.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Rental */}
                  {selectedCustomer.currentRental && (
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Current Rental</h3>
                        <button className="text-sm font-bold text-primary hover:underline">View All History</button>
                      </div>
                      <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:w-48 aspect-video md:aspect-square rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={selectedCustomer.currentRental.image} alt="" className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1 w-full space-y-4">
                          <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCustomer.currentRental.vehicleName}</h4>
                            <p className="text-sm text-slate-500">License: <span className="text-slate-900 dark:text-slate-300 font-medium">{selectedCustomer.currentRental.licensePlate}</span> • {selectedCustomer.currentRental.color}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Pick-up</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.currentRental.pickupDate}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Expected Return</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.currentRental.returnDate}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${(selectedCustomer.currentRental.totalDays - selectedCustomer.currentRental.remainingDays) / selectedCustomer.currentRental.totalDays * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-400">{selectedCustomer.currentRental.remainingDays} day remaining</span>
                              <span className="text-primary">{selectedCustomer.currentRental.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Content Area */}
                <div className="space-y-6">
                  {/* Driving License Card */}
                  <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Driving License</h3>
                      <span className="material-symbols-outlined text-emerald-500 filled">verified</span>
                    </div>

                    <div
                      onClick={() => selectedCustomer.licenseImageUrl && setIsLicenseModalOpen(true)}
                      className={`relative aspect-[1.6/1] bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white shadow-lg mb-6 overflow-hidden max-w-sm mx-auto xl:max-w-none ${selectedCustomer.licenseImageUrl ? 'cursor-zoom-in' : ''}`}
                    >
                      {selectedCustomer.licenseImageUrl ? (
                        <img
                          src={selectedCustomer.licenseImageUrl}
                          alt="Driver License"
                          className="absolute inset-0 size-full object-cover opacity-60 mix-blend-overlay"
                        />
                      ) : (
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                          <span className="material-symbols-outlined text-6xl">account_balance</span>
                        </div>
                      )}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">Driver License</p>
                            <p className="text-xl font-extrabold uppercase tracking-tighter">{selectedCustomer.license.state}</p>
                          </div>
                          <span className="material-symbols-outlined">account_balance</span>
                        </div>

                        <div className="flex items-end gap-3">
                          <div className="size-10 md:size-14 rounded bg-gradient-to-tr from-yellow-200/50 to-emerald-200/50 backdrop-blur-sm border border-white/20 overflow-hidden">
                            {selectedCustomer.licenseImageUrl ? (
                              <img src={selectedCustomer.licenseImageUrl} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="size-full bg-white/10"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">DL Number</p>
                            <p className="text-sm md:text-base font-bold">{selectedCustomer.license.number}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Class</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.license.class}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Expires</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.license.expires}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                        <span className="text-sm text-slate-500">Issued</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.license.issued}</span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUploadLicense}
                        className="hidden"
                        accept="image/*"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? (
                          <div className="size-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                        ) : (
                          <span className="material-symbols-outlined text-lg">upload_file</span>
                        )}
                        {isUploading ? 'Uploading...' : 'Update Document'}
                      </button>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Account Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <span className="material-symbols-outlined p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-[20px]">lock_reset</span>
                        <span className="text-sm font-semibold">Reset Password</span>
                      </button>
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <span className="material-symbols-outlined p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-[20px]">credit_card</span>
                        <span className="text-sm font-semibold text-left flex-1">Manage Payment Methods</span>
                      </button>
                      <button
                        onClick={handleToggleBan}
                        disabled={isSubmitting}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${selectedCustomer.status === 'Banned' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                      >
                        <span className="material-symbols-outlined p-2 bg-white/50 rounded-lg text-[20px]">{selectedCustomer.status === 'Banned' ? 'person_check' : 'block'}</span>
                        <span className="text-sm font-semibold">{selectedCustomer.status === 'Banned' ? 'Unban Customer' : 'Ban Customer'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <span className="material-symbols-outlined text-6xl mb-4">person_search</span>
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">No Customer Selected</h3>
            <p className="max-w-xs mt-2">Select a customer from the list to view their details or add a new one.</p>
          </div>
        )
        }
      </div >

      {/* Customer Modal (Add/Edit) */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isEditMode ? 'Edit Customer Details' : 'Register New Customer'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {isEditMode ? 'Update the information for this customer.' : 'Add a new customer to your organization.'}
                  </p>
                </div>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <form id="customer-form" onSubmit={handleSubmitCustomer} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Full Name</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. John Doe"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Email Address</label>
                          <input
                            type="email"
                            placeholder="john@example.com"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Secondary Phone (Optional)</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={newCustomer.secondary_phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, secondary_phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Company (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Actuon Corp"
                            value={newCustomer.company}
                            onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">NID/National Identity Number</label>
                          <input
                            type="text"
                            placeholder="ID-00000000"
                            value={newCustomer.nid_number}
                            onChange={(e) => setNewCustomer({ ...newCustomer, nid_number: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Status</label>
                          <select
                            value={newCustomer.status}
                            onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as CustomerStatus })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                          >
                            <option value={CustomerStatus.ACTIVE}>Active</option>
                            <option value={CustomerStatus.PENDING}>Pending</option>
                            <option value={CustomerStatus.INACTIVE}>Inactive</option>
                            <option value={CustomerStatus.BANNED}>Banned</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Residential Address</label>
                          <input
                            type="text"
                            placeholder="123 Street Ave, City, State"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Customer Rating Tier</label>
                          <select
                            value={newCustomer.rating_tier}
                            onChange={(e) => setNewCustomer({ ...newCustomer, rating_tier: e.target.value as 'A' | 'B' | 'C' })}
                            disabled={profile?.role !== 'Superadmin'}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none ${profile?.role !== 'Superadmin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <option value="A">Top Client (A)</option>
                            <option value="B">Standard (B)</option>
                            <option value="C">Risky Client (C)</option>
                          </select>
                          {profile?.role !== 'Superadmin' && (
                            <p className="text-[10px] text-amber-500 mt-1 ml-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              Only Superadmin can update ratings
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Next of Kin Information */}
                    <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Next of Kin Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Kin Name</label>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={newCustomer.next_of_kin_name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, next_of_kin_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Kin Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={newCustomer.next_of_kin_phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, next_of_kin_phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* License Information */}
                    <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Driver's License Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">License Number</label>
                          <input
                            type="text"
                            placeholder="DL-00000000"
                            value={newCustomer.license_number}
                            onChange={(e) => setNewCustomer({ ...newCustomer, license_number: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Issuing State</label>
                          <input
                            type="text"
                            placeholder="e.g. CA"
                            value={newCustomer.license_state}
                            onChange={(e) => setNewCustomer({ ...newCustomer, license_state: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newCustomer.license_expiry}
                            onChange={(e) => setNewCustomer({ ...newCustomer, license_expiry: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="customer-form"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {isEditMode ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* License Image Preview Modal */}
      {
        isLicenseModalOpen && selectedCustomer?.licenseImageUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setIsLicenseModalOpen(false)}
            ></div>
            <div className="relative max-w-5xl w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsLicenseModalOpen(false)}
                className="absolute -top-12 right-0 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="w-full bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                <img
                  src={selectedCustomer.licenseImageUrl}
                  alt="License Detail"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>
              <p className="text-white/60 text-sm font-medium">Driver's License Document - {selectedCustomer.name}</p>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Customers;
