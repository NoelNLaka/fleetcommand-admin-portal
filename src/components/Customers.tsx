
import React, { useState } from 'react';
import { CUSTOMERS } from '../constants';
import { Customer, CustomerStatus } from '../types';

const Customers: React.FC = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(CUSTOMERS.length > 0 ? CUSTOMERS[0].id : null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showListOnMobile, setShowListOnMobile] = useState(false);

  const selectedCustomer = CUSTOMERS.find(c => c.id === selectedCustomerId) || (CUSTOMERS.length > 0 ? CUSTOMERS[0] : null);

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
            <button className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">add</span>
              Add New
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">1,240</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">Renting</p>
              <p className="text-xl font-bold text-primary">45</p>
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              type="text" 
              placeholder="Search name, license, phone..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Active Rental', 'VIP', 'Banned'].map(filter => (
              <button key={filter} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {CUSTOMERS.map((customer) => (
            <button 
              key={customer.id}
              onClick={() => handleSelectCustomer(customer.id)}
              className={`w-full p-4 flex gap-3 text-left transition-colors relative ${selectedCustomerId === customer.id ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
              {selectedCustomerId === customer.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              <img src={customer.profileImage} alt="" className="size-10 rounded-full bg-slate-200 object-cover" />
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
          {CUSTOMERS.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No customers found</div>
          )}
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
                    <img src={selectedCustomer.profileImage} alt="" className="size-20 md:size-24 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-sm" />
                    <div className="absolute bottom-0 right-0 bg-emerald-500 size-6 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1 text-slate-500 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            {selectedCustomer.location}
                          </span>
                          <span className="flex items-center gap-1">
                            ID: <span className="text-slate-900 dark:text-slate-300 font-medium">{selectedCustomer.customerId}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-2">
                          <button className="p-2 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">call</span></button>
                          <button className="p-2 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><span className="material-symbols-outlined">mail</span></button>
                        </div>
                        <button className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Edit</button>
                        <button className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90">New Rental</button>
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
                  </div>
                </div>

                <div className="mt-8 flex gap-6 md:gap-8 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                  {['Overview', 'Personal Details', 'Documents', 'History'].map(tab => (
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
                    
                    {selectedCustomer.internalNotes && (
                      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-yellow-800 dark:text-yellow-600 mb-2">Internal Notes</p>
                        <p className="text-sm text-yellow-900 dark:text-yellow-700 leading-relaxed">
                          <span className="font-bold">Note:</span> {selectedCustomer.internalNotes}
                        </p>
                      </div>
                    )}
                  </div>

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
                    
                    <div className="relative aspect-[1.6/1] bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 text-white shadow-lg mb-6 overflow-hidden max-w-sm mx-auto xl:max-w-none">
                      <div className="absolute top-0 right-0 p-3 opacity-20">
                        <span className="material-symbols-outlined text-6xl">account_balance</span>
                      </div>
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">Driver License</p>
                            <p className="text-xl font-extrabold uppercase tracking-tighter">{selectedCustomer.license.state}</p>
                          </div>
                          <span className="material-symbols-outlined">account_balance</span>
                        </div>
                        
                        <div className="flex items-end gap-3">
                          <div className="size-10 md:size-14 rounded bg-gradient-to-tr from-yellow-200/50 to-emerald-200/50 backdrop-blur-sm border border-white/20"></div>
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
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Update Document
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
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors">
                        <span className="material-symbols-outlined p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-[20px]">block</span>
                        <span className="text-sm font-semibold">Ban Customer</span>
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
        )}
      </div>
    </div>
  );
};

export default Customers;
