import React, { useState } from 'react';

interface Tool {
    id: string;
    name: string;
    category: string;
    status: 'Operational' | 'Maintenance' | 'Broken';
    lastServiced: string;
    location: string;
    condition: number; // 0-100
}

const InventoryTools: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const tools: Tool[] = [
        { id: 'TOOL-001', name: 'Air Compressor (50L)', category: 'Pneumatic', status: 'Operational', lastServiced: '2023-11-15', location: 'Bay 1', condition: 85 },
        { id: 'TOOL-002', name: 'Hydraulic Jack (3T)', category: 'Lifting', status: 'Operational', lastServiced: '2023-12-01', location: 'Bay 2', condition: 92 },
        { id: 'TOOL-003', name: 'Impact Wrench', category: 'Hand Tools', status: 'Maintenance', lastServiced: '2024-01-10', location: 'Workshop A', condition: 45 },
        { id: 'TOOL-004', name: 'Vehicle Lift #1', category: 'Heavy Equipment', status: 'Operational', lastServiced: '2023-10-20', location: 'Bay 3', condition: 78 },
        { id: 'TOOL-005', name: 'Diagnostic Scanner', category: 'Electronic', status: 'Operational', lastServiced: '2024-01-05', location: 'Admin Office', condition: 95 },
        { id: 'TOOL-006', name: 'Tire Changer', category: 'Tire Service', status: 'Broken', lastServiced: '2023-09-15', location: 'Bay 4', condition: 15 },
    ];

    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status: Tool['status']) => {
        switch (status) {
            case 'Operational': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Broken': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Workshop Tools</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitor and manage workshop equipment and tools.</p>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-primary/25 flex items-center gap-2">
                        <span className="material-symbols-outlined">add</span>
                        Add Tool
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search tools by name, ID or category..."
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
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tool ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Equipment Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Condition</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Serviced</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTools.map((tool) => (
                                    <tr key={tool.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-primary">{tool.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{tool.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tool.category}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(tool.status)}`}>
                                                {tool.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tool.location}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${tool.condition < 30 ? 'bg-red-500' :
                                                            tool.condition < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${tool.condition}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-500">
                                            {tool.lastServiced}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
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

export default InventoryTools;
