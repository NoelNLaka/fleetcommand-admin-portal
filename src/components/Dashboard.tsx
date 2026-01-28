
import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { INITIAL_STATS, MAINTENANCE_ITEMS } from '../constants';
import { BookingStatus, UserRole, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleStats, setVehicleStats] = useState({ available: 0, maintenance: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.org_id) {
      fetchDashboardData();
    }
  }, [profile?.org_id]);

  const fetchDashboardData = async () => {
    try {
      if (!profile?.org_id) return;

      // 1. Fetch Bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:customers(name, email, license_image_url, address),
          vehicle:vehicles(name, plate),
          updated_by_profile:profiles!bookings_updated_by_fkey(id, full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // 2. Fetch Vehicles for stats
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('status')
        .eq('org_id', profile.org_id);

      if (vehiclesError) console.error('Error fetching vehicles:', vehiclesError);

      // Process Vehicle Stats
      const vStats = { available: 0, maintenance: 0, total: 0 };
      if (vehiclesData) {
        vStats.total = vehiclesData.length;
        vStats.available = vehiclesData.filter((v: any) => v.status === 'Available').length;
        vStats.maintenance = vehiclesData.filter((v: any) => v.status === 'Maintenance').length;
      }
      setVehicleStats(vStats);

      // 3. Fetch Extensions & Retrievals
      const bookingIds = (bookingsData || []).map((b: any) => b.id);

      const [extensionsRes, retrievalsRes] = await Promise.all([
        supabase.from('booking_extensions').select('booking_id, amount_paid, receipt_no').in('booking_id', bookingIds),
        supabase.from('retrievals').select('booking_id').in('booking_id', bookingIds)
      ]);

      const extensionsData = extensionsRes.data || [];
      const retrievalsData = retrievalsRes.data || [];

      const returnedBookingIds = new Set(retrievalsData.map((r: any) => r.booking_id));
      const extensionsMap = new Map();
      extensionsData.forEach((e: any) => {
        const list = extensionsMap.get(e.booking_id) || [];
        list.push(e);
        extensionsMap.set(e.booking_id, list);
      });

      const mappedBookings: Booking[] = (bookingsData || []).map((b: any) => {
        let isOverdue = false;
        let daysOverdue = 0;

        if (b.status === 'Active' || b.status === 'Extended' || b.status === 'Confirmed') {
          const endDate = new Date(b.end_date);
          const today = new Date();
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
          customerAddress: b.customer?.address || '',
          customerAvatar: b.customer?.license_image_url || `https://i.pravatar.cc/150?u=${b.customer_id}`,
          vehicleName: b.vehicle?.name || 'Unknown Vehicle',
          vehicleId: b.vehicle?.plate || '',
          startDate: b.start_date || '',
          endDate: b.end_date || '',
          status: b.status as BookingStatus,
          isOverdue,
          daysOverdue,
          vehicleUuid: b.vehicle_id,
          durationDays: b.duration_days,
          totalAmount: `K${b.total_amount || 0}`,
          totalPaid: 0,
          totalOutstanding: 0,
          paymentStatus: 'Paid' as any
        };
      });

      setBookings(mappedBookings);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueTodayBookings = bookings.filter(b => {
    // Note: BookingStatus enum might not have CANCELLED, checked previously
    if (b.status === BookingStatus.COMPLETED) return false;
    const end = new Date(b.endDate);
    end.setHours(0, 0, 0, 0);
    return end.getTime() === today.getTime();
  });

  const overdueBookings = bookings.filter(b => b.isOverdue);

  // Dynamic Stats Calculation
  const activeRentalsCount = bookings.filter(b => b.status === BookingStatus.ACTIVE || b.status === BookingStatus.EXTENDED).length;
  const reservationsCount = bookings.filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING_PICKUP).length;
  const overdueCount = overdueBookings.length;

  const stats = [
    {
      label: 'Active Rentals',
      value: activeRentalsCount.toString(),
      trend: '+0%', // Placeholder trend
      trendType: 'up' as const,
      icon: 'car_rental',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Reservations',
      value: reservationsCount.toString(),
      trend: '+0%',
      trendType: 'up' as const,
      icon: 'event_available',
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Overdue Rentals',
      value: overdueCount.toString(),
      trend: overdueCount > 0 ? 'Action Req' : 'Good',
      trendType: overdueCount > 0 ? 'down' as const : 'up' as const,
      icon: 'warning',
      iconBg: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600'
    },
    {
      label: 'Available Vehicles',
      value: vehicleStats.available.toString(),
      trend: `${vehicleStats.total} Total`,
      trendType: 'neutral' as const,
      icon: 'directions_car',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600'
    }
  ];

  const role = profile?.role || UserRole.ADMIN; // Default to Admin for now if no role

  const isMechanic = role === UserRole.MECHANIC;
  const isClientOfficer = role === UserRole.CLIENT_OFFICER;
  const isWorkshopSupervisor = role === UserRole.WORKSHOP_SUPERVISOR;
  const isManagement = role === UserRole.SUPERADMIN || role === UserRole.ADMIN;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Key performance indicators for Oct 24, 2023 - Oct 31, 2023</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['Week', 'Month', 'Year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter(stat => {
          if (isMechanic) return ['Vehicles', 'Maintenance'].includes(stat.label);
          if (isClientOfficer) return ['Active Rentals', 'Reservations', 'Overdue Rentals', 'Available Vehicles'].includes(stat.label);
          return true;
        }).map((stat, idx) => (
          <StatsCard key={idx} stat={stat} />
        ))}
      </div>

      {/* Middle Section: Map and Maintenance */}
      {(isManagement || isWorkshopSupervisor || isMechanic) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Fleet Map */}
          <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">map</span>
                Live Fleet Tracking
              </h3>
              <button className="text-sm text-primary font-medium hover:underline">Full Map</button>
            </div>
            <div className="relative flex-1 bg-slate-100 dark:bg-slate-900 w-full min-h-[300px] h-[350px]">
              {/* Abstract Map Background using placeholder */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply dark:mix-blend-normal"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_3Ebuqj8w--OvCKGBspYPUUp0KMUPoJTHdjEDF-Q_zVW4bcTjGsdC0gjBQWMRh-63IY0_RPPmsGbqqvL9waIyNyscyJQjXj4eYoSiIRHwd9BH_3ZQQhborjh4NL_Y9HJu4C2glCL4KEWpvi7vChyBtfQA5StsjMF02ZHuk7IziX9pTnwYaHr06j7CQuYxNwBCb88esR1uG4zBWc28gEl7B2jTtzYd9HdDdmSz56DSNBz2KSFA-WPyR9ddl3cVQKfC2IhQaXw6XY0")' }}
              ></div>

              {/* Mock Pins */}
              <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                <div className="bg-primary size-4 rounded-full ring-4 ring-primary/30 animate-pulse"></div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-dark text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  Toyota Camry (Active)
                </div>
              </div>
              <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                <div className="bg-orange-500 size-4 rounded-full ring-4 ring-orange-500/30"></div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-dark text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  Ford Transit (Maintenance)
                </div>
              </div>
              <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                <div className="bg-primary size-4 rounded-full ring-4 ring-primary/30"></div>
              </div>
            </div>
          </div>

          {/* Maintenance List */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[438px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">build</span>
                Maintenance Due
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {MAINTENANCE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${item.isUrgent
                    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                    }`}
                >
                  <div className={`${item.isUrgent ? 'bg-orange-100 dark:bg-orange-800/30 text-orange-600 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'} p-2 rounded shrink-0`}>
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.vehicleName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.service} • {item.dueDate}</p>
                  </div>
                  <button className={`text-xs font-medium px-2 py-1 rounded transition-colors bg-white dark:bg-surface-dark border ${item.isUrgent
                    ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/30 hover:bg-orange-50'
                    : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}>
                    {item.isUrgent ? 'Schedule' : 'Details'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Due Today & Overdue */}
      {(isManagement || isClientOfficer) && (
        <div className={`grid grid-cols-1 ${overdueBookings.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>

          {/* Bookings Due Today */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bookings Due Today</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Rentals scheduled to return by end of day</p>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                {dueTodayBookings.length} Due
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading bookings...</div>
            ) : dueTodayBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                    {dueTodayBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <div>
                            <p>{booking.vehicleName}</p>
                            <p className="text-xs text-slate-500 font-normal">{booking.vehicleId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={booking.customerAvatar} alt="" className="size-6 rounded-full bg-slate-200 object-cover" />
                            {booking.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Due Today
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">event_available</span>
                <p>No bookings due today.</p>
              </div>
            )}
          </div>

          {/* Overdue Bookings Table - Only appears if there are overdue bookings */}
          {overdueBookings.length > 0 && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                <div>
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    Overdue Bookings
                  </h3>
                  <p className="text-sm text-red-600/80 dark:text-red-400/70">Action required: Vehicles not returned</p>
                </div>
                <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {overdueBookings.length} Overdue
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-red-50/50 dark:bg-red-900/10 text-xs uppercase font-semibold text-red-500 dark:text-red-400">
                    <tr>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Overdue By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 dark:divide-red-900/30 bg-white dark:bg-surface-dark">
                    {overdueBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <div>
                            <p className="group-hover:text-red-600 transition-colors">{booking.vehicleName}</p>
                            <p className="text-xs text-slate-500 font-normal">{booking.vehicleId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={booking.customerAvatar} alt="" className="size-6 rounded-full bg-slate-200 object-cover" />
                            {booking.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">
                            +{booking.daysOverdue} Days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
