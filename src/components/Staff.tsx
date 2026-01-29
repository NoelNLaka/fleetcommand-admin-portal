import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    job_title: string;
    job_id: string;
    role: string;
    auth_user_id: string;
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
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        job_title: '',
        job_id: '',
        role: UserRole.MECHANIC
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        job_title: '',
        job_id: '',
        role: UserRole.MECHANIC
    });

    const [isDeleting, setIsDeleting] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        // Validate passwords match
        if (newStaff.password !== newStaff.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Validate password length
        if (newStaff.password.length < 8) {
            alert('Password must be at least 8 characters long.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('You must be logged in to create staff members');
            }

            // Call the Edge Function to create the user
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        email: newStaff.email,
                        password: newStaff.password,
                        first_name: newStaff.first_name,
                        last_name: newStaff.last_name,
                        department: newStaff.department,
                        job_title: newStaff.job_title,
                        job_id: newStaff.job_id,
                        role: newStaff.role,
                        org_id: profile.org_id,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create staff member');
            }

            // Success!
            alert('Staff member created successfully!\n\nLogin credentials:\nEmail: ' + newStaff.email + '\nPassword: ' + newStaff.password + '\n\nPlease share these credentials with the staff member.');

            setIsAddModalOpen(false);
            setNewStaff({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                confirmPassword: '',
                department: '',
                job_title: '',
                job_id: '',
                role: UserRole.MECHANIC
            });
            fetchStaff();
        } catch (error: any) {
            console.error('Error creating staff:', error);
            alert('Failed to create staff member: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditStaff = (member: StaffMember) => {
        setEditingStaff(member);
        setEditForm({
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
            department: member.department,
            job_title: member.job_title,
            job_id: member.job_id,
            role: member.role as UserRole
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.org_id || !editingStaff) return;

        try {
            setIsSubmitting(true);

            // 1. Update staff table
            const { error: staffError } = await supabase
                .from('staff')
                .update({
                    first_name: editForm.first_name,
                    last_name: editForm.last_name,
                    department: editForm.department,
                    job_title: editForm.job_title,
                    job_id: editForm.job_id,
                    role: editForm.role,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingStaff.id);

            if (staffError) throw staffError;

            // 2. Update profiles table (if auth_user_id exists)
            if (editingStaff.auth_user_id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: `${editForm.first_name} ${editForm.last_name}`.trim(),
                        role: editForm.role
                    })
                    .eq('id', editingStaff.auth_user_id);

                if (profileError) {
                    console.error('Error updating profile:', profileError);
                    alert('Staff record updated, but linked profile update failed: ' + profileError.message);
                }
            }

            alert('Staff member updated successfully!');
            setIsEditModalOpen(false);
            setEditingStaff(null);
            fetchStaff();
        } catch (error: any) {
            console.error('Error updating staff:', error);
            alert('Failed to update staff member: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = async (member: StaffMember) => {
        if (!confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsDeleting(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-staff-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        staff_id: member.id,
                        auth_user_id: member.auth_user_id
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete staff member');
            }

            alert('Staff member deleted successfully');
            fetchStaff();
        } catch (error: any) {
            console.error('Error deleting staff:', error);
            alert('Failed to delete staff member: ' + (error.message || 'Unknown error'));
        } finally {
            setIsDeleting(false);
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
                                    <th className="px-6 py-4">Role</th>
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
                                                    {member.first_name?.[0] || ''}{member.last_name?.[0] || ''}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white leading-none">{member.first_name} {member.last_name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{member.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                                                {member.role || 'Not set'}
                                            </span>
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
                                            <div className="flex items-center justify-center gap-2">
                                                {profile?.role === UserRole.SUPERADMIN && (
                                                    <button
                                                        onClick={() => handleEditStaff(member)}
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Edit Staff Member"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                )}
                                                {profile?.role === UserRole.SUPERADMIN && (
                                                    <button
                                                        onClick={() => handleDeleteStaff(member)}
                                                        disabled={isDeleting}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Staff Member"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                )}
                                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                    <span className="material-symbols-outlined">more_vert</span>
                                                </button>
                                            </div>
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

            {/* Add Staff Member Modal */}
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">Create a new staff member with login credentials and role.</p>
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
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        placeholder="user@example.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            value={newStaff.password}
                                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                            placeholder="Min. 8 characters"
                                            minLength={8}
                                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={newStaff.confirmPassword}
                                            onChange={(e) => setNewStaff({ ...newStaff, confirmPassword: e.target.value })}
                                            placeholder="Re-enter password"
                                            minLength={8}
                                            className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
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
                                <div>
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
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">User Profile / Role</label>
                                    <select
                                        required
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    >
                                        <option value={UserRole.MECHANIC}>Mechanic</option>
                                        <option value={UserRole.WORKSHOP_SUPERVISOR}>Workshop Supervisor</option>
                                        <option value={UserRole.CLIENT_OFFICER}>Client Officer</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.SUPERADMIN}>Superadmin</option>
                                    </select>
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
            {/* Edit Staff Member Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsEditModalOpen(false)}
                    ></div>

                    <div className="relative bg-white dark:bg-surface-dark w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Staff Member</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Update staff member details and role.</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleUpdateStaff} className="p-5 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        placeholder="John"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        placeholder="Doe"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Email Address (Read-only)</label>
                                    <input
                                        disabled
                                        type="email"
                                        value={editForm.email}
                                        className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 outline-none transition-all cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Department</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.department}
                                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                        placeholder="e.g., Maintenance"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Job Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.job_title}
                                        onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                                        placeholder="e.g., Senior Mechanic"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Job ID / Employee Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={editForm.job_id}
                                        onChange={(e) => setEditForm({ ...editForm, job_id: e.target.value })}
                                        placeholder="e.g., STF-001"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">User Profile / Role</label>
                                    <select
                                        required
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    >
                                        <option value={UserRole.MECHANIC}>Mechanic</option>
                                        <option value={UserRole.WORKSHOP_SUPERVISOR}>Workshop Supervisor</option>
                                        <option value={UserRole.CLIENT_OFFICER}>Client Officer</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        <option value={UserRole.SUPERADMIN}>Superadmin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setIsEditModalOpen(false)}
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
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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
