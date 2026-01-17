import React, { useState } from 'react';

interface Tyre {
    sku: string;
    brand: string;
    model: string;
    size: string;
    stock: number;
    total: number;
    unitCost: number;
}

const InventoryTyres: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const tyres: Tyre[] = [
        { sku: 'MIT-PS4-2454018', brand: 'Michelin', model: 'Pilot Sport 4', size: '245/40 R18', stock: 12, total: 20, unitCost: 285.00 },
        { sku: 'CON-EXC6-2254517', brand: 'Continental', model: 'ExtremeContact 6', size: '225/45 R17', stock: 3, total: 10, unitCost: 195.00 },
        { sku: 'BRI-TUR-2055516', brand: 'Bridgestone', model: 'Turanza T005', size: '205/55 R16', stock: 24, total: 40, unitCost: 145.00 },
        { sku: 'PIR-PZER-2553519', brand: 'Pirelli', model: 'P Zero', size: '255/35 R19', stock: 8, total: 15, unitCost: 320.00 },
    ];

    const filteredTyres = tyres.filter(tyre =>
        tyre.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tyre.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tyre.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Tyre Inventory</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage tyre stock levels across sizes and brands.</p>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-primary/25 flex items-center gap-2">
                        <span className="material-symbols-outlined">tire_repair</span>
                        Add Stock
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search by brand, model or SKU..."
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
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">SKU / Size</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Brand & Model</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">In Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Cost</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTyres.map((tyre) => (
                                    <tr key={tyre.sku} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{tyre.sku}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{tyre.size}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{tyre.brand}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{tyre.model}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className={`${tyre.stock / tyre.total < 0.2 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {tyre.stock} / {tyre.total}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${tyre.stock / tyre.total < 0.2 ? 'bg-red-500' :
                                                            tyre.stock / tyre.total < 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${(tyre.stock / tyre.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                                            ${tyre.unitCost.toFixed(2)}
                                        </td>
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

export default InventoryTyres;
