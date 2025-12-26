
import React, { useState } from 'react';
import { DETAILED_BOOKINGS, INITIAL_STATS } from '../constants';
import { BookingStatus, PaymentStatus } from '../types';

const Bookings: React.FC = () => {
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('List');

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
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {INITIAL_STATS.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <div className={`p-1.5 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</h3>
              <span className={`text-xs font-bold ${stat.trendType === 'up' ? 'text-emerald-500' : stat.trendType === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Filter bookings..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
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
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
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
              {DETAILED_BOOKINGS.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">{booking.bookingId}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <img src={booking.customerAvatar} alt="" className="size-9 rounded-full border-2 border-slate-100 dark:border-slate-800" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{booking.customerName}</p>
                        <p className="text-xs text-slate-400">{booking.customerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{booking.vehicleName}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-tighter">{booking.vehicleId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{booking.startDate} - {booking.endDate}</p>
                      <p className="text-xs text-slate-400">{booking.durationDays} Days</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {getPaymentStatus(booking.paymentStatus)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs md:text-sm font-medium text-slate-400">Showing 1 to 5 of 142 results</p>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-xs md:text-sm font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
            <button className="px-4 py-1.5 text-xs md:text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
