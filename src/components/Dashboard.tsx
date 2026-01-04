
import React, { useState } from 'react';
import StatsCard from './StatsCard';
import { INITIAL_STATS, MAINTENANCE_ITEMS, RECENT_BOOKINGS } from '../constants';
import { BookingStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Week');

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
        {INITIAL_STATS.filter(stat => {
          if (isMechanic) return ['Vehicles', 'Maintenance'].includes(stat.label);
          if (isClientOfficer) return ['Bookings', 'Customers', 'Vehicles'].includes(stat.label);
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

      {/* Recent Bookings Table */}
      {(isManagement || isClientOfficer) && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-surface-dark">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Bookings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest vehicle check-outs and returns</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">License Plate</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Return Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                {RECENT_BOOKINGS.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${booking.vehicleImage})` }}></div>
                        {booking.vehicleName}
                      </div>
                    </td>
                    <td className="px-6 py-4">{booking.licensePlate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Fixed: Replaced missing customerColor and customerInitials with existing customerAvatar from Booking type */}
                        <img src={booking.customerAvatar} alt="" className="size-6 rounded-full bg-slate-200 object-cover" />
                        {booking.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === BookingStatus.ACTIVE ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        booking.status === BookingStatus.COMPLETED ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                          booking.status === BookingStatus.OVERDUE ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
                        }`}>
                        {booking.status}
                      </span>
                    </td>
                    {/* Fixed: Replaced non-existent returnDate with endDate from Booking type */}
                    <td className={`px-6 py-4 ${booking.status === BookingStatus.OVERDUE ? 'text-red-600 font-medium' : booking.status === BookingStatus.COMPLETED ? 'text-slate-400' : ''}`}>
                      {booking.endDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Showing 1-4 of 24 bookings</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50">Previous</button>
              <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
