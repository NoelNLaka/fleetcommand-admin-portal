import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Agreement } from '../types';

interface AgreementWithDetails extends Agreement {
    booking: {
        start_date: string;
        end_date: string;
        customer: {
            name: string;
        };
        vehicle: {
            plate: string;
            name: string;
        };
    };
}

const Agreements: React.FC = () => {
    const { profile } = useAuth();
    const [agreements, setAgreements] = useState<AgreementWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgreements = async () => {
        if (!profile?.org_id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('agreements')
                .select(`
          id,
          org_id,
          booking_id,
          agreement_doc_id,
          agreement_link,
          created_at,
          booking:bookings(
            start_date,
            end_date,
            customer:customers(name),
            vehicle:vehicles(plate, name)
          )
        `)
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAgreements(data || []);
        } catch (error) {
            console.error('Error fetching agreements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgreements();
    }, [profile?.org_id]);

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <nav className="flex text-xs font-medium text-slate-400 gap-2">
                    <span className="hover:text-primary cursor-pointer">Home</span>
                    <span>&gt;</span>
                    <span className="text-slate-600 dark:text-slate-300">Agreements</span>
                </nav>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Rental Agreements</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Review and manage generated car rental agreements.</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative flex-1 sm:flex-initial">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search agreements..."
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : agreements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <span className="material-symbols-outlined text-6xl mb-4">description</span>
                            <p className="text-xl font-bold">No agreements found</p>
                            <p>Agreements will appear here once generated.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Agreement ID</th>
                                    <th className="px-6 py-4">Client Name</th>
                                    <th className="px-6 py-4">Vehicle Rego</th>
                                    <th className="px-6 py-4">Hire Dates</th>
                                    <th className="px-6 py-4 text-center">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {agreements.map((agreement) => (
                                    <tr key={agreement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {agreement.agreement_doc_id || `#${agreement.id.slice(0, 8)}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {agreement.booking?.customer?.name || 'Unknown Client'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                {agreement.booking?.vehicle?.plate || 'Unknown Vehicle'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {agreement.booking?.vehicle?.name || ''}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-900 dark:text-white leading-none">
                                                {agreement.booking?.start_date} - {agreement.booking?.end_date}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {agreement.agreement_link ? (
                                                <a
                                                    href={agreement.agreement_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                    View PDF
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">PDF Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agreements;
