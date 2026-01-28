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
  const [activeTab, setActiveTab] = useState<'All' | 'Reserved' | 'Active' | 'Extended'>('All');
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<Booking | null>(null);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
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
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };


  const isSuperadmin = profile?.role === 'Superadmin';

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookingIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBookingIds.size === filteredBookings.length) {
      setSelectedBookingIds(new Set());
    } else {
      setSelectedBookingIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const clearSelection = () => {
    setSelectedBookingIds(new Set());
  };

  const fetchBookings = async () => {
    if (!profile?.org_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          duration_days,
          status,
          payment_status,
          receipt_no,
          total_amount,
          customer_id,
          vehicle_id,
          customer:customers(name, email, license_image_url, address),
          vehicle:vehicles(name, plate),
          updated_by_profile:profiles!bookings_updated_by_fkey(id, full_name),
          updated_at
        `)
        .eq('org_id', profile.org_id);

      if (bookingsError) throw bookingsError;

      // Fetch agreements and extensions separately
      const bookingIds = (bookingsData || []).map((b: any) => b.id);

      const [agreementsRes, extensionsRes, chargesRes, retrievalsRes] = await Promise.all([
        supabase.from('agreements').select(' id, org_id, booking_id, agreement_doc_id, agreement_link').in('booking_id', bookingIds),
        supabase.from('booking_extensions').select('id, org_id, booking_id, date_from, date_to, days_hired, amount_paid, receipt_no, payment_method, agreement_id, agreement_link').in('booking_id', bookingIds),
        supabase.from('extra_charges').select('*').in('booking_id', bookingIds),
        supabase.from('retrievals').select('booking_id').in('booking_id', bookingIds)
      ]);

      const { data: agreementsData, error: agreementsError } = agreementsRes;
      const { data: extensionsData, error: extensionsError } = extensionsRes;
      const { data: chargesData, error: chargesError } = chargesRes;
      const { data: retrievalsData, error: retrievalsError } = retrievalsRes;

      if (agreementsError) console.warn('Error fetching agreements:', agreementsError);
      if (extensionsError) console.warn('Error fetching extensions:', extensionsError);
      if (chargesError) console.warn('Error fetching charges:', chargesError);
      if (retrievalsError) console.warn('Error fetching retrievals:', retrievalsError);

      const returnedBookingIds = new Set((retrievalsData || []).map((r: any) => r.booking_id));

      const agreementsMap = new Map();
      (agreementsData || []).forEach((a: any) => agreementsMap.set(a.booking_id, a));

      const extensionsMap = new Map();
      (extensionsData || []).forEach((e: any) => {
        const list = extensionsMap.get(e.booking_id) || [];
        list.push({
          id: e.id,
          orgId: e.org_id,
          bookingId: e.booking_id,
          dateFrom: e.date_from,
          dateTo: e.date_to,
          daysHired: e.days_hired,
          amountPaid: e.amount_paid,
          receiptNo: e.receipt_no,
          paymentMethod: e.payment_method,
          agreementId: e.agreement_id,
          agreementLink: e.agreement_link
        });
        extensionsMap.set(e.booking_id, list);
      });

      const chargesMap = new Map();
      (chargesData || []).forEach((c: any) => {
        const list = chargesMap.get(c.booking_id) || [];
        list.push({
          id: c.id,
          orgId: c.org_id,
          bookingId: c.booking_id,
          charge_type: c.charge_type,
          amount: c.amount,
          amount_paid: c.amount_paid || 0,
          description: c.description,
          status: c.status,
          createdAt: c.created_at
        });
        chargesMap.set(c.booking_id, list);
      });

      const mappedBookings: Booking[] = (bookingsData || []).map((b: any) => {
        const agreement = agreementsMap.get(b.id);
        const extensions = extensionsMap.get(b.id) || [];
        const extraCharges = chargesMap.get(b.id) || [];

        const originalAmount = parseFloat(b.total_amount || '0');
        const originalPaid = (b.payment_status === 'Paid') ? originalAmount : 0;

        const paidExt = extensions.filter((e: any) => e.receiptNo).reduce((acc: number, e: any) => acc + (e.amountPaid || 0), 0);
        const unpaidExt = extensions.filter((e: any) => !e.receiptNo).reduce((acc: number, e: any) => acc + (e.amountPaid || 0), 0);

        const paidChg = extraCharges.reduce((acc: number, c: any) => acc + (c.amount_paid || 0), 0);
        const unpaidChg = extraCharges.reduce((acc: number, c: any) => acc + (Math.max(0, (c.amount || 0) - (c.amount_paid || 0))), 0);

        const totalPaid = originalPaid + paidExt + paidChg;
        const totalOutstanding = (b.payment_status === 'Paid' ? 0 : originalAmount) + unpaidExt + unpaidChg;

        // Calculate Overdue Status
        let isOverdue = false;
        let daysOverdue = 0;

        // Only consider active or extended bookings for overdue status (or those that should have been returned)
        if (b.status === 'Active' || b.status === 'Extended' || b.status === 'Confirmed') {
          const endDate = new Date(b.end_date);
          const today = new Date();
          // Reset time components for accurate day comparison
          today.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (today > endDate && !returnedBookingIds.has(b.id)) {
            isOverdue = true;
            const diffTime = Math.abs(today.getTime() - endDate.getTime());
            daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        return {
          id: b.id,
          bookingId: `#BK-${b.id.slice(0, 4).toUpperCase()}`,
          customerName: b.customer?.name || 'Unknown Customer',
          customerEmail: b.customer?.email || '',
          customerUuid: b.customer_id,
          customerAddress: b.customer?.address || '',
          customerAvatar: b.customer?.license_image_url || `https://i.pravatar.cc/150?u=${b.customer_id}`,
          vehicleName: b.vehicle?.name || 'Unknown Vehicle',
          vehicleId: b.vehicle?.plate || '',
          vehicleUuid: b.vehicle_id,
          startDate: b.start_date || '',
          endDate: b.end_date || '',
          durationDays: b.duration_days || Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24)) || 0,
          totalAmount: `K${totalPaid.toLocaleString()}`,
          totalPaid,
          totalOutstanding,
          status: b.status as BookingStatus,
          paymentStatus: (totalOutstanding > 0 ? 'Outstanding' : 'Paid') as any, // Cast to any as Outstading is new concept for this field
          receiptNo: b.receipt_no,
          updatedAt: b.updated_at,
          updatedBy: b.updated_by_profile ? {
            id: b.updated_by_profile.id,
            fullName: b.updated_by_profile.full_name
          } : undefined,
          agreement: agreement ? {
            id: agreement.id,
            orgId: agreement.org_id,
            bookingId: agreement.booking_id,
            agreementDocId: agreement.agreement_doc_id,
            agreementLink: agreement.agreement_link,
            createdAt: agreement.created_at || new Date().toISOString()
          } : undefined,
          extensions: extensions,
          extraCharges: extraCharges,
          isOverdue,
          daysOverdue
        };
      });

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
        .select('id, name, email, phone, license_number, address')
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
      if (isNewCustomer && !selectedBooking) {
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

      // Calculate duration
      const start = new Date(newBooking.start_date);
      const end = new Date(newBooking.end_date);
      const duration_days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (selectedBooking) {
        // Update existing booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            vehicle_id: newBooking.vehicle_id,
            start_date: newBooking.start_date,
            end_date: newBooking.end_date,
            duration_days: duration_days,
            status: newBooking.status,
            payment_status: newBooking.payment_status,
            customer_id: customerId,
            updated_by: profile.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBooking.id);

        if (updateError) throw updateError;
      } else {
        // Create new booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            ...newBooking,
            duration_days: duration_days,
            customer_id: customerId,
            org_id: profile.org_id,
            updated_by: profile?.id
          }]);

        if (bookingError) throw bookingError;
      }

      // Auto-update vehicle location if Paid
      if (newBooking.payment_status === PaymentStatus.PAID) {
        let addressToUpdate = '';
        if (isNewCustomer) {
          addressToUpdate = newCustomerData.address;
        } else if (selectedCustomer?.address) {
          addressToUpdate = selectedCustomer.address;
        }

        if (addressToUpdate) {
          await supabase
            .from('vehicles')
            .update({ location: addressToUpdate })
            .eq('id', newBooking.vehicle_id);
        }
      }

      // 3. Success!
      setIsAddModalOpen(false);
      resetForm();
      fetchBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking. Please check the logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewBooking({
      vehicle_id: booking.vehicleUuid || '',
      start_date: booking.startDate,
      end_date: booking.endDate,
      status: booking.status,
      payment_status: booking.paymentStatus
    });

    // Mock a selected customer object for display since we don't have full customer details
    if (booking.customerUuid) {
      setSelectedCustomer({
        id: booking.customerUuid,
        name: booking.customerName,
        email: booking.customerEmail,
        address: booking.customerAddress
      });
    }

    setIsAddModalOpen(true);
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
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setSelectedBooking(null);
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!isSuperadmin) {
      alert('Only Superadmin users can delete bookings.');
      return;
    }

    setIsDeleting(true);
    try {
      // Unlink agreements from this booking (set booking_id to null) so they are preserved
      await supabase
        .from('agreements')
        .update({ booking_id: null })
        .eq('booking_id', booking.id);

      // Delete the booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      // Update vehicle status back to available if it was rented
      if (booking.vehicleUuid) {
        await supabase
          .from('vehicles')
          .update({ status: 'Available' })
          .eq('id', booking.vehicleUuid);
      }

      // Close modals and refresh
      setDeleteConfirmBooking(null);
      setSelectedDetailBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!isSuperadmin || selectedBookingIds.size === 0) return;

    setIsDeleting(true);
    try {
      const bookingIdsArray = Array.from(selectedBookingIds);
      const selectedBookings = bookings.filter(b => selectedBookingIds.has(b.id));

      // Delete all selected bookings
      // The database handles cascading deletes for agreements, extensions, etc.
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', bookingIdsArray);

      if (error) throw error;

      // Update vehicle statuses back to available
      const vehicleUuids = selectedBookings
        .map(b => b.vehicleUuid)
        .filter((uuid): uuid is string => !!uuid);

      if (vehicleUuids.length > 0) {
        await supabase
          .from('vehicles')
          .update({ status: 'Available' })
          .in('id', vehicleUuids);
      }

      // Close modal, clear selection and refresh
      setShowBulkDeleteConfirm(false);
      clearSelection();
      fetchBookings();
    } catch (error) {
      console.error('Error deleting bookings:', error);
      alert('Failed to delete bookings. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Reserved') return b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING_PICKUP;
    if (activeTab === 'Active') return b.status === BookingStatus.ACTIVE;
    if (activeTab === 'Extended') return b.status === BookingStatus.EXTENDED;
    if (activeTab === 'Overdue') return b.isOverdue;
    return true;
  });

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
      value: bookings.filter(b => b.isOverdue).length.toString(),
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
      case BookingStatus.EXTENDED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentStatus = (booking: Booking) => {
    const isOutstanding = (booking.totalOutstanding || 0) > 0;

    if (!isOutstanding) {
      return (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-[16px] filled">check_circle</span> Paid
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-[10px] bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
        <span className="material-symbols-outlined text-[16px] filled">warning</span> Outstanding
      </span>
    );
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
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
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
        <div className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center px-4 md:px-6">
            {['All', 'Reserved', 'Active', 'Extended', 'Overdue'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  clearSelection();
                }}
                className={`px-4 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

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

        {/* Selection Action Bar */}
        {isSuperadmin && selectedBookingIds.size > 0 && (
          <div className="px-6 py-3 bg-primary/5 dark:bg-primary/10 border-b border-primary/20 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">
                {selectedBookingIds.size} booking{selectedBookingIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete Selected
            </button>
          </div>
        )}

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
                  {isSuperadmin && (
                    <th className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedBookingIds.has(booking.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    {isSuperadmin && (
                      <td className="px-4 py-5">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.has(booking.id)}
                          onChange={() => toggleBookingSelection(booking.id)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <button
                          onClick={() => setSelectedDetailBooking(booking)}
                          className="font-bold text-primary hover:underline text-left"
                        >
                          {booking.bookingId}
                        </button>
                        {booking.updatedBy && (
                          <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5" title={`Last edited by ${booking.updatedBy.fullName} on ${new Date(booking.updatedAt!).toLocaleString()}`}>
                            <span className="material-symbols-outlined text-[12px]">edit_note</span>
                            {booking.updatedBy.fullName.split(' ')[0]} • {formatDate(booking.updatedAt!)}
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
                      <p className="font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wider">{booking.vehicleId}</p>
                      <p className="text-xs text-slate-500 mt-1">{booking.vehicleName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 dark:text-white leading-none">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p>
                      <p className="text-xs text-slate-500 mt-1">{booking.durationDays} days</p>
                    </td>
                    <td className="px-6 py-5">
                      {booking.isOverdue ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Overdue
                          </span>
                          <span className="text-[10px] font-bold text-red-600">+{booking.daysOverdue} Days</span>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {getPaymentStatus(booking)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(booking)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="Edit Booking"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        {isSuperadmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmBooking(booking);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete Booking"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
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

      {/* Booking Details Slide-over */}
      {selectedDetailBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDetailBooking(null)}
          ></div>

          {/* Slide-over Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Booking Details</h2>
                <p className="text-slate-500 text-sm mt-1">Review complete reservation information.</p>
              </div>
              <button
                onClick={() => setSelectedDetailBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-8">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(selectedDetailBooking.status)}`}>
                  {selectedDetailBooking.status}
                </span>
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Customer Information</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-slate-50 dark:ring-slate-900">
                    <img src={selectedDetailBooking.customerAvatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedDetailBooking.customerName}</p>
                    <p className="text-slate-500 text-sm">{selectedDetailBooking.customerEmail}</p>
                  </div>
                </div>
                {selectedDetailBooking.customerAddress && (
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-slate-400 mt-0.5">location_on</span>
                    <p>{selectedDetailBooking.customerAddress}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Vehicle Information</h3>
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedDetailBooking.vehicleName}</p>
                      <p className="text-slate-500 text-sm mt-1">{selectedDetailBooking.vehicleId}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-4xl">directions_car</span>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Reservation Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold mb-1">Start Date</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedDetailBooking.startDate}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold mb-1">End Date</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedDetailBooking.endDate}</p>
                  </div>
                  <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-bold">Duration</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedDetailBooking.durationDays} Days</p>
                  </div>
                </div>
              </div>

              {/* Agreement Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Agreement & Extensions</h3>
                {selectedDetailBooking.agreement || (selectedDetailBooking.extensions && selectedDetailBooking.extensions.length > 0) ? (
                  <div className="space-y-4">
                    {selectedDetailBooking.agreement && (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Original Agreement</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedDetailBooking.agreement.agreementDocId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Original Receipt</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedDetailBooking.receiptNo || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium text-xs italic">Original Booking Dates</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right">
                              {formatDate(selectedDetailBooking.startDate)} - {(() => {
                                const totalExtDays = selectedDetailBooking.extensions?.reduce((acc, ext) => acc + (ext.daysHired || 0), 0) || 0;
                                const currentEnd = new Date(selectedDetailBooking.endDate);
                                const originalEnd = new Date(currentEnd.getTime() - (totalExtDays * 24 * 60 * 60 * 1000));
                                return formatDate(originalEnd.toISOString());
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium text-xs italic">Original Booking Duration</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                              {selectedDetailBooking.durationDays - (selectedDetailBooking.extensions?.reduce((acc, ext) => acc + (ext.daysHired || 0), 0) || 0)} Days
                            </span>
                          </div>
                        </div>
                        {selectedDetailBooking.agreement.agreementLink && (
                          <div className="flex justify-end pt-1">
                            <a
                              href={selectedDetailBooking.agreement.agreementLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline font-bold text-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              View Original
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDetailBooking.extensions && selectedDetailBooking.extensions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Hire Extensions</p>
                        {selectedDetailBooking.extensions.map((ext) => (
                          <div key={ext.id} className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-purple-900 dark:text-purple-300">{ext.id}</p>
                              <p className="text-[9px] text-purple-600 dark:text-purple-400">{formatDate(ext.dateFrom)} - {formatDate(ext.dateTo)}</p>
                              {ext.agreementLink && (
                                <a
                                  href={ext.agreementLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-purple-600 hover:underline font-bold text-[9px] mt-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                  View extension doc
                                </a>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-purple-900 dark:text-purple-200">K{ext.amountPaid.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-purple-500">{ext.receiptNo ? `Receipt: ${ext.receiptNo}` : 'UNPAID'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500">No agreement or extensions found.</p>
                  </div>
                )}
              </div>

              {/* Extra Charges Breakdown */}
              {selectedDetailBooking.extraCharges && selectedDetailBooking.extraCharges.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Extra Charges Breakdown</h3>
                  <div className="space-y-2">
                    {selectedDetailBooking.extraCharges.map((charge) => (
                      <div key={charge.id} className="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-900 dark:text-orange-300">{charge.charge_type}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${charge.status === 'Paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : (charge.status === 'Partial' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400')}`}>
                              {charge.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{charge.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs font-black text-orange-900 dark:text-orange-200">
                            {charge.amount_paid > 0 && charge.amount_paid < charge.amount ? (
                              <>K{charge.amount_paid.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">/ K{charge.amount.toLocaleString()}</span></>
                            ) : (
                              `K${charge.amount.toLocaleString()}`
                            )}
                          </p>
                          <p className="text-[9px] font-bold text-orange-500">{new Date(charge.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment & Total */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Payment Status</span>
                  {getPaymentStatus(selectedDetailBooking)}
                </div>

                <div className="flex justify-between items-end bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Total Amount Paid</p>
                    <p className="text-[10px] text-slate-500">Includes original + settled extras</p>
                  </div>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-300">K{(selectedDetailBooking.totalPaid || 0).toLocaleString()}</p>
                </div>

                {(selectedDetailBooking.totalOutstanding || 0) > 0 && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex justify-between items-center animate-in fade-in duration-500">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Outstanding Balance</p>
                      <p className="text-xs text-slate-500">Unpaid extensions & extra charges</p>
                    </div>
                    <p className="text-xl font-black text-red-600 dark:text-red-400">K{(selectedDetailBooking.totalOutstanding || 0).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Delete Button - Superadmin Only */}
              {isSuperadmin && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    onClick={() => setDeleteConfirmBooking(selectedDetailBooking)}
                    className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Delete Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirmBooking(null)}
          ></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Booking?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete booking <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfirmBooking.bookingId}</span>?
                The linked agreement will be preserved. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmBooking(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBooking(deleteConfirmBooking)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">delete_sweep</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete {selectedBookingIds.size} Booking{selectedBookingIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">{selectedBookingIds.size} booking{selectedBookingIds.size > 1 ? 's' : ''}</span>?
                Linked agreements will be preserved. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      Delete All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}
          ></div>

          <div className="relative bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedBooking ? 'Edit Booking' : 'New Booking'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedBooking ? 'Update reservation details.' : 'Create a new reservation for a customer.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
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
                        disabled={!!selectedBooking}
                      >
                        {!!selectedBooking ? '' : (isNewCustomer ? 'Search Existing Customer' : 'Register New Customer')}
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
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none text-left flex items-center justify-between"
                          >
                            {newBooking.vehicle_id ? (
                              (() => {
                                const v = vehicles.find(v => v.id === newBooking.vehicle_id);
                                return v ? (
                                  <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-wide">{v.plate}</span>
                                    <span className="text-xs text-slate-500">{v.name}</span>
                                  </div>
                                ) : <span className="text-slate-500">Choose a vehicle...</span>
                              })()
                            ) : (
                              <span className="text-slate-500">Choose a vehicle...</span>
                            )}
                            <span className="material-symbols-outlined text-slate-400">expand_more</span>
                          </button>

                          {/* Hidden input for form validation */}
                          <input
                            type="text"
                            required
                            value={newBooking.vehicle_id}
                            onChange={() => { }}
                            className="absolute opacity-0 pointer-events-none h-0 w-0 bottom-0"
                            tabIndex={-1}
                          />

                          {isVehicleDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setIsVehicleDropdownOpen(false)}></div>
                              <div className="absolute z-30 w-full mt-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 flex flex-col">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-10">
                                  <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                    <input
                                      type="text"
                                      placeholder="Search vehicle..."
                                      value={vehicleSearchQuery}
                                      onChange={(e) => setVehicleSearchQuery(e.target.value)}
                                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto">
                                  {vehicles
                                    .filter(v =>
                                      v.name.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                                      v.plate.toLowerCase().includes(vehicleSearchQuery.toLowerCase())
                                    )
                                    .map(v => (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => {
                                          setNewBooking({ ...newBooking, vehicle_id: v.id });
                                          setIsVehicleDropdownOpen(false);
                                          setVehicleSearchQuery('');
                                        }}
                                        className="w-full px-4 py-3 flex flex-col items-start gap-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-none"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">{v.plate}</span>
                                          {newBooking.vehicle_id === v.id && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                                        </div>
                                        <span className="text-xs text-slate-500">{v.name}</span>
                                      </button>
                                    ))}
                                  {vehicles.filter(v =>
                                    v.name.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                                    v.plate.toLowerCase().includes(vehicleSearchQuery.toLowerCase())
                                  ).length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-500">
                                        No vehicles found
                                      </div>
                                    )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
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
                          <option value={BookingStatus.EXTENDED}>Extended</option>
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
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
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
                {isSubmitting ? (selectedBooking ? 'Updating...' : 'Creating...') : (selectedBooking ? 'Update Booking' : 'Create Booking')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
