
import React, { useState } from 'react';
import { INVENTORY, INVENTORY_STATS } from '../constants';
import { VehicleStatus } from '../types';

const Inventory: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600"></span>
            Available
          </span>
        );
      case VehicleStatus.RENTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800">
            <span className="size-1.5 rounded-full bg-blue-600"></span>
            Rented
          </span>
        );
      case VehicleStatus.MAINTENANCE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/20 text-xs font-bold rounded-full border border-orange-100 dark:border-orange-800">
            <span className="size-1.5 rounded-full bg-orange-600"></span>
            Maintenance
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
          <span className="text-slate-600 dark:text-slate-300">Inventory</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Inventory</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage fleet availability, status, and locations.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {INVENTORY_STATS.map((stat, idx) => (
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

      {/* Filter Section */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search license plate, VIN, or model..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option>Status: All</option>
              <option>Available</option>
              <option>Rented</option>
              <option>Maintenance</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option>Type: All</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Truck</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none">
              <option>Location: All</option>
              <option>LAX Airport</option>
              <option>San Francisco</option>
              <option>Las Vegas</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="border-t border-slate-100 dark:border-slate-800 -mx-4 md:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Plate & VIN</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Mileage</th>
                <th className="px-6 py-4">Daily Rate</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {INVENTORY.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img src={vehicle.image} alt="" className="size-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{vehicle.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{vehicle.year} • {vehicle.trim}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 dark:text-white">{vehicle.plate}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{vehicle.vin}</p>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(vehicle.status)}
                  </td>
                  <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">
                    {vehicle.location}
                  </td>
                  <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">
                    {vehicle.mileage}
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">
                    {vehicle.dailyRate}
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
        </div>
      </div>

      {/* Add Vehicle Modal */}
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Vehicle</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Register a new vehicle to your fleet inventory.</p>
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
                  {/* Basic Info */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Vehicle Name</label>
                        <input type="text" placeholder="e.g. Toyota Camry" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Year</label>
                        <input type="text" placeholder="2024" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Trim Level / Model Version</label>
                      <input type="text" placeholder="e.g. LE Hybrid" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Identification & Logistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">License Plate</label>
                        <input type="text" placeholder="ABC-1234" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">VIN Number</label>
                        <input type="text" placeholder="17-character VIN" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Current Status</label>
                        <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none">
                          <option value={VehicleStatus.AVAILABLE}>Available</option>
                          <option value={VehicleStatus.RENTED}>Rented</option>
                          <option value={VehicleStatus.MAINTENANCE}>Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Location</label>
                        <input type="text" placeholder="e.g. LAX Lot B" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Operational */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pricing & Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Mileage (mi)</label>
                        <input type="text" placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Daily Rate ($)</label>
                        <input type="text" placeholder="45.00" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Placeholder */}
                  <div className="md:col-span-2 pt-4 space-y-4 border-t border-slate-50 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Vehicle Image</h3>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-3xl">add_a_photo</span>
                      <p className="text-xs font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-300">Click to upload or drag image</p>
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
                Register Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
