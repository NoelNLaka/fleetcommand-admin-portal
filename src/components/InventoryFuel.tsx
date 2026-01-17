import React, { useState } from 'react';

interface FuelTank {
    id: string;
    type: string;
    capacity: string;
    currentLevel: string;
    lastRefill: string;
    status: 'Good' | 'Low' | 'Critical';
}

const InventoryFuel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const fuelTanks: FuelTank[] = [
        { id: 'Tank-01', type: 'Diesel', capacity: '10,000L', currentLevel: '7,500L', lastRefill: '2026-01-10', status: 'Good' },
        { id: 'Tank-02', type: 'Unleaded', capacity: '5,000L', currentLevel: '1,200L', lastRefill: '2026-01-12', status: 'Low' },
        { id: 'Tank-03', type: 'Diesel Extra', capacity: '8,000L', currentLevel: '300L', lastRefill: '2026-01-05', status: 'Critical' },
    ];

    const filteredTanks = fuelTanks.filter(tank =>
        tank.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tank.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Good': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30';
            case 'Low': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30';
            case 'Critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Fuel Inventory</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitor fuel levels and refill history.</p>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-primary/25 flex items-center gap-2">
                        <span className="material-symbols-outlined">local_gas_station</span>
                        Record Refill
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search tanks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tank ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fuel Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Level</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Refill</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTanks.map((tank) => (
                                    <tr key={tank.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{tank.id}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{tank.type}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tank.capacity}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-400">Level: {tank.currentLevel}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${tank.status === 'Critical' ? 'bg-red-500' :
                                                                tank.status === 'Low' ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${(parseInt(tank.currentLevel) / parseInt(tank.capacity)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tank.lastRefill}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(tank.status)}`}>
                                                {tank.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">history</span>
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryFuel;
