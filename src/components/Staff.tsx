import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
    department: string;
    job_title: string;
    job_id: string;
    created_at: string;
}

const Staff: React.FC = () => {
    const { profile } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newStaff, setNewStaff] = useState({
        first_name: '',
        last_name: '',
        department: '',
        job_title: '',
        job_id: ''
    });

    const fetchStaff = async () => {
        if (!profile?.org_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [profile?.org_id]);

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.org_id) return;

        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('staff')
                .insert([{
                    ...newStaff,
                    org_id: profile.org_id
                }]);

            if (error) throw error;

            setIsAddModalOpen(false);
            setNewStaff({
                first_name: '',
                last_name: '',
                department: '',
                job_title: '',
                job_id: ''
            });
            fetchStaff();
        } catch (error) {
            console.error('Error creating staff:', error);
            alert('Failed to add staff member.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStaff = staff.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Staff',
            value: staff.length.toString(),
            icon: 'group',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary'
        },
        {
            label: 'Departments',
            value: new Set(staff.map(s => s.department)).size.toString(),
            icon: 'lan',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Maintenance Team',
            value: staff.filter(s => s.department === 'Maintenance').length.toString(),
            icon: 'handyman',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600'
        },
        {
            label: 'Recent Hires',
            value: staff.filter(s => {
                const hireDate = new Date(s.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return hireDate > thirtyDaysAgo;
            }).length.toString(),
            icon: 'person_add',
            iconBg: 'bg-orange-50 dark:bg-orange-900/20',
            iconColor: 'text-orange-600'
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 space-y-8">
            {/* Breadcrumbs & Header */}
            <div className="space-y-4">
                <nav className="flex text-xs font-medium text-slate-400 gap-2">
                    <span className="hover:text-primary cursor-pointer">Home</span>
                    <span>&gt;</span>
                    <span className="hover:text-primary cursor-pointer">Management</span>
                    <span>&gt;</span>
                    <span className="text-slate-600 dark:text-slate-300">Staff</span>
                </nav>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Staff Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage organization staff, roles, and departments.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Staff Member
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                            <div className={`p-1.5 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
                                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Table Filters */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-auto flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search staff by name, ID or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <span className="material-symbols-outlined text-6xl mb-4">person_off</span>
                            <p className="text-xl font-bold">No staff members found</p>
                            <p>Add a staff member to get started.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Job ID</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Job Title</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-5 font-bold text-primary">{member.job_id}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-white dark:ring-slate-700">
                                                    {member.first_name[0]}{member.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white leading-none">{member.first_name} {member.last_name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                                {member.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-medium text-slate-900 dark:text-white">{member.job_title}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                <span className="material-symbols-outlined">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Info */}
                <div className="p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs md:text-sm font-medium text-slate-400">Showing {filteredStaff.length} results</p>
                </div>
            </div>

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsAddModalOpen(false)}
                    ></div>

                    <div className="relative bg-white dark:bg-surface-dark w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Staff Member</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Enter details for the new staff member.</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreateStaff} className="p-5 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newStaff.first_name}
                                        onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                                        placeholder="John"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newStaff.last_name}
                                        onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                                        placeholder="Doe"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Department</label>
                                    <input
                                        required
                                        type="text"
                                        value={newStaff.department}
                                        onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                                        placeholder="e.g., Maintenance"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Job Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={newStaff.job_title}
                                        onChange={(e) => setNewStaff({ ...newStaff, job_title: e.target.value })}
                                        placeholder="e.g., Senior Mechanic"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Job ID / Employee Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={newStaff.job_id}
                                        onChange={(e) => setNewStaff({ ...newStaff, job_id: e.target.value })}
                                        placeholder="e.g., STF-001"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Adding...' : 'Add Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
