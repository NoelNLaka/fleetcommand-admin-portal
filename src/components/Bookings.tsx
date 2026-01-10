import React, { useState, useEffect } from 'react';
import { INITIAL_STATS as STATIC_STATS } from '../constants';
import { BookingStatus, PaymentStatus, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Bookings: React.FC = () => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('List');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [newBooking, setNewBooking] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    status: BookingStatus.CONFIRMED,
    payment_status: PaymentStatus.UNPAID
  });
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = async () => {
    if (!profile?.org_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
id,
  start_date,
  end_date,
  duration_days,
  status,
  payment_status,
  customer_id,
  vehicle_id,
  vehicle: vehicles(name, plate),
  updated_by_profile:profiles!bookings_updated_by_fkey(id, full_name),
  updated_at
        `)
        .eq('org_id', profile.org_id);

      if (error) throw error;

      const mappedBookings: Booking[] = (data || []).map((b: any) => ({
        id: b.id,
        bookingId: `#BK-${b.id.slice(0, 4).toUpperCase()}`,
        customerName: b.customer?.name || 'Unknown Customer',
        customerEmail: b.customer?.email || '',
        customerAvatar: `https://i.pravatar.cc/150?u=${b.customer_id}`, // Using customer_id for unique avatar
        vehicleName: b.vehicle?.name || 'Unknown Vehicle',
        vehicleId: b.vehicle?.plate || '',
        startDate: b.start_date || '',
        endDate: b.end_date || '',
        durationDays: b.duration_days || 0,
        status: b.status as BookingStatus,
        paymentStatus: b.payment_status as PaymentStatus,
        updatedAt: b.updated_at,
        updatedBy: b.updated_by_profile ? {
          id: b.updated_by_profile.id,
          fullName: b.updated_by_profile.full_name
        } : undefined
      }));

      setBookings(mappedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (!profile?.org_id) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, name, plate, status')
        .eq('org_id', profile.org_id)
        .eq('status', 'available');
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const searchCustomers = async (query: string) => {
    if (!profile?.org_id || query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      setIsSearchingCustomers(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, license_number')
        .eq('org_id', profile.org_id)
        .ilike('name', `%${query}%`)
        .limit(5);
      if (error) throw error;
      setCustomerSearchResults(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
  }, [profile?.org_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchQuery) {
        searchCustomers(customerSearchQuery);
      } else {
        setCustomerSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    try {
      setIsSubmitting(true);
      let customerId = selectedCustomer?.id;

      // 1. If new customer, register them first
      if (isNewCustomer) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert([{
            ...newCustomerData,
            org_id: profile.org_id,
            status: 'active'
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = customerData.id;
      }

      if (!customerId) {
        alert('Please select a customer or register a new one.');
        return;
      }

      if (!newBooking.vehicle_id) {
        alert('Please select a vehicle.');
        return;
      }

      // 2. Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          ...newBooking,
          customer_id: customerId,
          org_id: profile.org_id,
          updated_by: profile?.id
        }]);

      if (bookingError) throw bookingError;

      // 3. Success!
      setIsAddModalOpen(false);
      resetForm();
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please check the logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewBooking({
      vehicle_id: '',
      start_date: '',
      end_date: '',
      status: BookingStatus.CONFIRMED,
      payment_status: PaymentStatus.UNPAID
    });
    setNewCustomerData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_state: '',
      license_expiry: '',
      address: ''
    });
    setCustomerSearchQuery('');
    setSelectedCustomer(null);
    setIsNewCustomer(false);
  };

  const stats = [
    {
      label: 'Active Rentals',
      value: bookings.filter(b => b.status === BookingStatus.ACTIVE).length.toString(),
      trend: '+5%',
      trendType: 'up',
      icon: 'key',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Pending Pickups',
      value: bookings.filter(b => b.status === BookingStatus.PENDING_PICKUP).length.toString(),
      trend: '2%',
      trendType: 'up',
      icon: 'schedule',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Confirmed',
      value: bookings.filter(b => b.status === BookingStatus.CONFIRMED).length.toString(),
      icon: 'check_circle',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Overdue',
      value: bookings.filter(b => b.status === BookingStatus.OVERDUE).length.toString(),
      icon: 'warning',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    }
  ];

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case BookingStatus.PENDING_PICKUP: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case BookingStatus.COMPLETED: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case BookingStatus.OVERDUE: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case BookingStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="material-symbols-outlined text-[18px] filled">check_circle</span> Paid
          </span>
        );
      case PaymentStatus.UNPAID:
        return (
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
            <span className="material-symbols-outlined text-[18px] filled">pending</span> Unpaid
          </span>
        );
      case PaymentStatus.PARTIAL:
        return (
          <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-medium">
            <span className="material-symbols-outlined text-[18px] filled">hourglass_top</span> Partial
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        <nav className="flex text-xs font-medium text-slate-400 gap-2">
          <span className="hover:text-primary cursor-pointer">Home</span>
          <span>&gt;</span>
          <span className="hover:text-primary cursor-pointer">Fleet</span>
          <span>&gt;</span>
          <span className="text-slate-600 dark:text-slate-300">Bookings</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Booking Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage vehicle assignments, rental periods, and payment statuses.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
              <span className="material-symbols-outlined text-[20px]">upload</span>
              Export
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <div className={`p-1.5 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</h3>
              {stat.trend && (
                <span className={`text-xs font-bold ${stat.trendType === 'up' ? 'text-emerald-500' : stat.trendType === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('List')}
              className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'List' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-[18px]">list</span>
              List
            </button>
            <button
              onClick={() => setViewMode('Calendar')}
              className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'Calendar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Calendar
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
              <p className="text-xl font-bold">No bookings found</p>
              <p>Create a booking to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{booking.bookingId}</span>
                        {booking.updatedBy && (
                          <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5" title={`Last edited by ${booking.updatedBy.fullName} on ${new Date(booking.updatedAt!).toLocaleString()}`}>
                            <span className="material-symbols-outlined text-[12px]">edit_note</span>
                            {booking.updatedBy.fullName.split(' ')[0]} • {new Date(booking.updatedAt!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-2 ring-white dark:ring-slate-700">
                          <img src={booking.customerAvatar} alt="" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-none">{booking.customerName}</p>
                          <p className="text-xs text-slate-500 mt-1">{booking.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{booking.vehicleName}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{booking.vehicleId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{booking.startDate} - {booking.endDate}</p>
                      <p className="text-xs text-slate-500 mt-1">{booking.durationDays} days</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {getPaymentStatus(booking.paymentStatus)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs md:text-sm font-medium text-slate-400">Showing 1 to {bookings.length} of {bookings.length} results</p>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-xs md:text-sm font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
            <button className="px-4 py-1.5 text-xs md:text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
      {/* Add Booking Modal */}
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Booking</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create a new reservation for a customer.</p>
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
              <form id="add-booking-form" onSubmit={handleCreateBooking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Details</h3>
                      <button
                        type="button"
                        onClick={() => setIsNewCustomer(!isNewCustomer)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {isNewCustomer ? 'Search Existing Customer' : 'Register New Customer'}
                      </button>
                    </div>

                    {!isNewCustomer ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Search Customer (Name)</label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                              type="text"
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              placeholder="Type name to search..."
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                            {isSearchingCustomers && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>

                          {/* Search Results Dropdown */}
                          {customerSearchResults.length > 0 && !selectedCustomer && (
                            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {customerSearchResults.map(customer => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setCustomerSearchQuery(customer.name);
                                    setCustomerSearchResults([]);
                                  }}
                                  className="w-full px-4 py-3 flex flex-col items-start gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-none"
                                >
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{customer.name}</span>
                                  <span className="text-xs text-slate-500">{customer.email || customer.phone || 'No contact info'}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedCustomer && (
                            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                  <span className="material-symbols-outlined text-[18px] filled">person</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                                  <p className="text-xs text-slate-500">Selected Customer</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  setCustomerSearchQuery('');
                                }}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <span className="material-symbols-outlined text-[20px]">deselect</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right duration-300">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Full Name</label>
                          <input
                            required
                            type="text"
                            value={newCustomerData.name}
                            onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Email Address</label>
                          <input
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                            placeholder="john@example.com"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Phone Number</label>
                          <input
                            type="tel"
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">License Number</label>
                          <input
                            type="text"
                            value={newCustomerData.license_number}
                            onChange={(e) => setNewCustomerData({ ...newCustomerData, license_number: e.target.value })}
                            placeholder="DL-00000000"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reservation Info */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reservation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Select Vehicle</label>
                        <select
                          required
                          value={newBooking.vehicle_id}
                          onChange={(e) => setNewBooking({ ...newBooking, vehicle_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Choose a vehicle...</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Start Date</label>
                        <input
                          required
                          type="date"
                          value={newBooking.start_date}
                          onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">End Date</label>
                        <input
                          required
                          type="date"
                          value={newBooking.end_date}
                          onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Booking Status</label>
                        <select
                          value={newBooking.status}
                          onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as BookingStatus })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                        >
                          <option value={BookingStatus.CONFIRMED}>Confirmed</option>
                          <option value={BookingStatus.PENDING_PICKUP}>Pending Pickup</option>
                          <option value={BookingStatus.ACTIVE}>Active</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Payment Status</label>
                        <select
                          value={newBooking.payment_status}
                          onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value as PaymentStatus })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                        >
                          <option value={PaymentStatus.UNPAID}>Unpaid</option>
                          <option value={PaymentStatus.PAID}>Paid</option>
                          <option value={PaymentStatus.PARTIAL}>Partial</option>
                        </select>
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
                form="add-booking-form"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isSubmitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
