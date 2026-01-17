import React, { useState } from 'react';

interface Part {
    partNo: string;
    name: string;
    category: string;
    vendor: string;
    onHand: number;
    total: number;
    unitCost: number;
    poNo?: string;
}

const InventoryParts: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const parts: Part[] = [
        { partNo: '07', name: '10-30wt oil', category: 'Oil', vendor: "Dave's Auto Parts", onHand: 829, total: 1000, unitCost: 1.30 },
        { partNo: '06', name: '30 wt Oil', category: 'Oil', vendor: "Dave's Auto Parts", onHand: 19, total: 100, unitCost: 1.49 },
        { partNo: '15', name: '50/50 Anti-freeze', category: 'Coolant', vendor: "Dave's Auto Parts", onHand: 295, total: 500, unitCost: 3.97 },
        { partNo: '04', name: '80/90 Gear Oil', category: 'Fluids', vendor: 'Warren CAT', onHand: 125, total: 200, unitCost: 20.43 },
        { partNo: '12', name: '85/140 Gear Oil', category: 'Fluids', vendor: "Dave's Auto Parts", onHand: 1008, total: 1200, unitCost: 24.49, poNo: '121' },
        { partNo: '2447-FD', name: 'Air Filter', category: 'Air Filters', vendor: 'J&R Equipment', onHand: 7, total: 50, unitCost: 20.47 },
        { partNo: '6585', name: 'Air Filter', category: 'Air Filters', vendor: "Dave's Auto Parts", onHand: 11, total: 40, unitCost: 60.58 },
        { partNo: '932670Q', name: 'Brake Pads', category: 'Brakes', vendor: "Dave's Auto Parts", onHand: 113, total: 200, unitCost: 56.72 },
        { partNo: '05', name: 'Dexron III', category: 'Transmission Fluid', vendor: "Dave's Auto Parts", onHand: 112, total: 150, unitCost: 4.53 },
        { partNo: '01', name: 'Hydro 46', category: 'Fluids', vendor: "Dave's Auto Parts", onHand: 20, total: 100, unitCost: 13.51 },
    ];

    const filteredParts = parts.filter(part =>
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.partNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Parts Inventory</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track your spare parts stock.</p>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-primary/25 flex items-center gap-2">
                        <span className="material-symbols-outlined">add</span>
                        Add Part
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search by part # or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">print</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Part #</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">On Hand</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Cost</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">PO #</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredParts.map((part) => (
                                    <tr key={part.partNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-primary">{part.partNo}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{part.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{part.category}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{part.vendor}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className={`${part.onHand / part.total < 0.2 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {part.onHand} / {part.total}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${part.onHand / part.total < 0.2 ? 'bg-red-500' :
                                                            part.onHand / part.total < 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${(part.onHand / part.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                                            ${part.unitCost.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-primary font-medium">{part.poNo || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
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

export default InventoryParts;
