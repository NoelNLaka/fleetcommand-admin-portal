import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuditLogEntry {
    id: string;
    table_name: string;
    action: string;
    record_id: string;
    old_data: any;
    new_data: any;
    changed_by_email: string;
    created_at: string;
}

const AuditLog: React.FC = () => {
    const { profile } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tableFilter, setTableFilter] = useState('All');

    const fetchLogs = async () => {
        if (!profile?.org_id) return;
        try {
            setLoading(true);
            let query = supabase
                .from('audit_logs')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });

            if (tableFilter !== 'All') {
                query = query.eq('table_name', tableFilter);
            }

            const { data, error } = await query.limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [profile?.org_id, tableFilter]);

    const filteredLogs = logs.filter(log =>
        log.changed_by_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.record_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.table_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActionColor = (action: string) => {
        switch (action) {
            case 'INSERT': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20';
            case 'UPDATE': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20';
            case 'DELETE': return 'bg-red-50 text-red-600 dark:bg-red-900/20';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const tableNames = ['All', ...new Set(logs.map(l => l.table_name))];

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-background-dark p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Audit Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Track all changes made to application records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-sm font-bold"
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search by user email or record ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter Table:</span>
                    <div className="flex flex-wrap gap-2">
                        {tableNames.map(name => (
                            <button
                                key={name}
                                onClick={() => setTableFilter(name)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tableFilter === name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-6">Timestamp</th>
                                <th className="px-8 py-6">User</th>
                                <th className="px-8 py-6">Table</th>
                                <th className="px-8 py-6">Action</th>
                                <th className="px-8 py-6">Record ID</th>
                                <th className="px-8 py-6 text-center">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic font-medium">No audit records found matching your filters.</td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                    <td className="px-8 py-6 font-bold text-slate-500">
                                        {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white">{log.changed_by_email || 'System'}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">via Auth Context</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{log.table_name.replace(/_/g, ' ')}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 font-mono text-[11px] text-slate-400">
                                        {log.record_id}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2 text-slate-400 hover:text-primary transition-all bg-slate-50 dark:bg-slate-900 rounded-lg"
                                        >
                                            <span className="material-symbols-outlined">data_object</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Change Details</h3>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {selectedLog.action} ON {selectedLog.table_name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto overflow-x-hidden flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-red-500">history</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previous State</span>
                                </div>
                                <pre className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-auto max-h-[400px] border border-slate-200 dark:border-slate-800">
                                    {JSON.stringify(selectedLog.old_data, null, 2) || 'null'}
                                </pre>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-emerald-500">update</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current State</span>
                                </div>
                                <pre className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl text-[11px] font-mono text-slate-600 dark:text-slate-300 overflow-auto max-h-[400px] border border-emerald-100 dark:border-emerald-900/20">
                                    {JSON.stringify(selectedLog.new_data, null, 2) || 'null'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
