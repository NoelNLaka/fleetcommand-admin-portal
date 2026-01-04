import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

type Theme = 'light' | 'dark' | 'system';

const Settings: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [orgInfo, setOrgInfo] = useState<{ name: string; plan_name: string } | null>(null);

    // Default to 'Team Members' for sub-users, 'Organization Profile' for Superadmin
    const [activeOrgTab, setActiveOrgTab] = useState(profile?.role === UserRole.SUPERADMIN ? 'Organization Profile' : 'Team Members');
    const [orgData, setOrgData] = useState({
        name: '',
        taxId: 'US-88392019',
        website: 'www.acmelogistics.com',
        email: 'billing@acmelogistics.com',
        phone: '+1 (555) 012-3456',
        address: '123 Logistics Blvd, Suite 400, San Francisco, CA 94107, USA'
    });

    useEffect(() => {
        const fetchOrgInfo = async () => {
            if (!profile?.org_id) return;
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('name, plan_name')
                    .eq('id', profile.org_id)
                    .single();

                if (!error && data) {
                    setOrgInfo(data);
                    setOrgData(prev => ({ ...prev, name: data.name }));
                }
                // Silently ignore errors - organizations table may not exist yet
            } catch (err) {
                // Silently handle - table may not exist
                console.debug('Organizations table not available:', err);
            }
        };

        fetchOrgInfo();
    }, [profile?.org_id]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const applyTheme = (t: Theme) => {
            if (t === 'dark') {
                root.classList.add('dark');
            } else if (t === 'light') {
                root.classList.remove('dark');
            } else {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark p-4 md:p-8 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <nav className="flex text-[10px] font-black uppercase tracking-widest text-slate-400 gap-2 mb-2">
                        <span className="hover:text-primary cursor-pointer">Settings</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-slate-300">Organization Account</span>
                    </nav>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Organization Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your company details, subscription plan, and billing information.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">share</span>
                        Share
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Sub Navigation */}
            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'Organization Profile', icon: 'badge', roles: [UserRole.SUPERADMIN] },
                    { id: 'Subscription Plan', icon: 'workspace_premium', roles: [UserRole.SUPERADMIN] },
                    { id: 'Billing & Invoices', icon: 'receipt_long', roles: [UserRole.SUPERADMIN] },
                    { id: 'Team Members', icon: 'groups', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] }
                ].filter(tab => profile?.role && tab.roles.includes(profile.role as UserRole)).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveOrgTab(tab.id)}
                        className={`flex items-center gap-2 py-4 px-1 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeOrgTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${activeOrgTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                        {tab.id}
                    </button>
                ))}
            </div>

            <div className={`grid grid-cols-1 ${profile?.role === UserRole.SUPERADMIN ? 'lg:grid-cols-3' : ''} gap-8 pb-12`}>
                {/* Main Content: Organization Profile */}
                <div className={`${profile?.role === UserRole.SUPERADMIN ? 'lg:col-span-2' : ''} space-y-8`}>
                    {activeOrgTab === 'Organization Profile' && (
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Company Details</h2>
                                <button className="text-sm font-bold text-primary hover:underline">Edit Details</button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                <div className="size-32 rounded-[2rem] bg-emerald-950 flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-950/20 relative group">
                                    <div className="size-16 border-2 border-emerald-500/30 rounded-full flex items-center justify-center relative">
                                        <div className="size-10 border-2 border-emerald-500 rounded-full"></div>
                                        <span className="material-symbols-outlined text-emerald-500 text-3xl absolute -bottom-1 -right-1 bg-emerald-950 rounded-full">check_circle</span>
                                    </div>
                                    <button className="absolute inset-0 bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={orgData.name}
                                            onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax ID / VAT</label>
                                        <input
                                            type="text"
                                            value={orgData.taxId}
                                            onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Website</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">https://</span>
                                            <input
                                                type="text"
                                                value={orgData.website}
                                                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                                                className="w-full pl-20 pr-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Email</label>
                                        <input
                                            type="email"
                                            value={orgData.email}
                                            onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={orgData.phone}
                                            onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Headquarters Address</label>
                                        <textarea
                                            rows={2}
                                            value={orgData.address}
                                            onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeOrgTab === 'Team Members' && (
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6 mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Team Members</h2>
                                <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Manage Team</button>
                            </div>
                            <table className="w-full">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="text-left py-4 px-2">User</th>
                                        <th className="text-left py-4 px-2">Role</th>
                                        <th className="text-left py-4 px-2">Status</th>
                                        <th className="text-right py-4 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {[
                                        { name: 'Sarah Jenkins', email: 'sarah@acme.com', role: 'Fleet Manager', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=sarah' },
                                        { name: 'Michael Chen', email: 'mchen@acme.com', role: 'Compliance Officer', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=michael' },
                                        { name: profile?.email || 'You', email: profile?.email || '', role: 'Administrator', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=admin' }
                                    ].map((member, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full border-2 border-white dark:border-slate-700 bg-slate-100 overflow-hidden shrink-0">
                                                        <img src={member.avatar} alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{member.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-sm font-bold text-slate-600 dark:text-slate-400">{member.role}</td>
                                            <td className="py-4 px-2">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-100 dark:border-emerald-800">
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sidebar: Subscription & Payment */}
                {profile?.role === UserRole.SUPERADMIN && (
                    <div className="space-y-6">
                        {/* Subscription Card */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription</p>
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-800">Active</span>
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                    {orgInfo?.plan_name || 'Enterprise'} <span className="text-lg text-slate-400 font-bold tracking-normal italic">/ month</span>
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-2">Next billing date: <span className="text-slate-600 dark:text-slate-300">Oct 24, 2026</span></p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Vehicles</span>
                                        <span className="text-slate-600 dark:text-slate-200">45 / 50</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[90%] rounded-full shadow-lg shadow-primary/20"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Drivers</span>
                                        <span className="text-slate-600 dark:text-slate-200">32 / 100</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[32%] rounded-full shadow-lg shadow-emerald-500/20"></div>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                                Upgrade Plan
                            </button>
                        </div>

                        {/* Payment Method Card */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 group">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black italic text-slate-900 dark:text-white text-lg shadow-sm">
                                        VISA
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">Visa ending in 4242</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expires 12/28</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Invoices Card */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Invoices</p>
                            <div className="space-y-4">
                                {[
                                    { date: 'Sep 24, 2025', amount: '$499.00' },
                                    { date: 'Aug 24, 2025', amount: '$499.00' }
                                ].map((invoice, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm filled">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{invoice.date}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{invoice.amount}</p>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">download</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full text-center text-xs font-black text-primary hover:underline pt-2">
                                View All History
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Section */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-red-500 mb-1">Account Actions</h3>
                    <p className="text-sm text-slate-500">Sign out of your account or change theme preferences.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 mr-4">
                        {['light', 'dark', 'system'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t as Theme)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${theme === t
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
