import React, { useState } from 'react';

interface Supplier {
    id: string;
    name: string;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    location: string;
}

const DUMMY_SUPPLIERS: Supplier[] = [
    {
        id: '1',
        name: 'AutoParts Direct',
        categories: ['Engine Components', 'Filters', 'Brakes'],
        contactPerson: 'Sarah Miller',
        phone: '+61 2 9876 5432',
        email: 'sarah@autoparts-direct.com',
        location: 'Sydney, NSW'
    },
    {
        id: '2',
        name: 'Tyre World',
        categories: ['Tyres', 'Wheels', 'Alignment Kits'],
        contactPerson: 'Mike Ross',
        phone: '+61 3 4567 8901',
        email: 'mike@tyreworld.com.au',
        location: 'Melbourne, VIC'
    },
    {
        id: '3',
        name: 'Workshop Solutions',
        categories: ['Tools', 'Equipment', 'Safety Gear'],
        contactPerson: 'David Lee',
        phone: '+61 7 3210 9876',
        email: 'd.lee@workshopsolutions.net',
        location: 'Brisbane, QLD'
    },
    {
        id: '4',
        name: 'Fleet Lubes',
        categories: ['Oils', 'Fluids', 'Coolants'],
        contactPerson: 'Jenny Chen',
        phone: '+61 8 5432 1098',
        email: 'orders@fleetlubes.com',
        location: 'Perth, WA'
    }
];

const Suppliers: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredSuppliers = DUMMY_SUPPLIERS.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())) ||
        supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Parts Suppliers</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and contact your workshop part and tool suppliers</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Supplier
                </button>
            </div>

            {/* Table Controls (Search Bar) */}
            <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search by supplier name, person, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Supplier Name</th>
                                <th className="px-6 py-4">Categories</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Contact Details</th>
                                <th className="px-6 py-4">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredSuppliers.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {supplier.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {supplier.categories.map((cat, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300 font-medium">
                                        {supplier.contactPerson}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <a href={`tel:${supplier.phone}`} className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-bold text-xs">
                                                <span className="material-symbols-outlined text-[16px]">call</span>
                                                {supplier.phone}
                                            </a>
                                            <a href={`mailto:${supplier.email}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs">
                                                <span className="material-symbols-outlined text-[16px]">mail</span>
                                                {supplier.email}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                                            {supplier.location}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20">inventory_2</span>
                                        <p className="text-lg font-bold">No suppliers found</p>
                                        <p className="text-sm">Try searching for a different name or category.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Suppliers;
