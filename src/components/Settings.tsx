import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark' | 'system';

const Settings: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [orgInfo, setOrgInfo] = useState<{ name: string; plan_name: string } | null>(null);

    useEffect(() => {
        const fetchOrgInfo = async () => {
            if (!profile?.org_id) return;
            const { data, error } = await supabase
                .from('organizations')
                .select('name, plan_name')
                .eq('id', profile.org_id)
                .single();

            if (!error && data) {
                setOrgInfo(data);
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
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your account preferences and application appearance.</p>
            </div>

            <div className="max-w-5xl space-y-6">
                {/* Appearance Section */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                            <span className="material-symbols-outlined text-2xl filled">palette</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Appearance</h2>
                            <p className="text-sm text-slate-500">Customize how FleetManager looks on your device.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Light Mode */}
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${theme === 'light' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative">
                                <div className="absolute inset-x-2 top-2 h-3 bg-slate-300/40 rounded"></div>
                                <div className="absolute left-2 top-7 h-3 w-1/3 bg-slate-300/40 rounded"></div>
                                <div className="absolute right-2 top-7 h-3 w-1/4 bg-slate-300/40 rounded"></div>
                                <div className="absolute inset-x-2 top-12 bottom-2 bg-white rounded-lg border border-slate-200 p-2 space-y-1.5">
                                    <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
                                        <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-slate-900 dark:text-slate-300">Light Mode</span>
                                {theme === 'light' && <span className="material-symbols-outlined text-primary filled">check_circle</span>}
                            </div>
                        </button>

                        {/* Dark Mode */}
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${theme === 'dark' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="aspect-[4/3] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
                                <div className="absolute inset-x-2 top-2 h-3 bg-slate-800 rounded"></div>
                                <div className="absolute left-2 top-7 h-3 w-1/3 bg-slate-800 rounded"></div>
                                <div className="absolute right-2 top-7 h-3 w-1/4 bg-slate-800 rounded"></div>
                                <div className="absolute inset-x-2 top-12 bottom-2 bg-slate-950 rounded-lg border border-slate-800 p-2 space-y-1.5">
                                    <div className="h-2 w-1/2 bg-slate-900 rounded"></div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="h-10 bg-slate-900 rounded border border-slate-800"></div>
                                        <div className="h-10 bg-slate-900 rounded border border-slate-800"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-slate-900 dark:text-slate-300">Dark Mode</span>
                                {theme === 'dark' && <span className="material-symbols-outlined text-primary filled">check_circle</span>}
                            </div>
                        </button>

                        {/* System Preference */}
                        <button
                            onClick={() => setTheme('system')}
                            className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${theme === 'system' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="aspect-[4/3] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex">
                                <div className="w-1/2 h-full bg-slate-100"></div>
                                <div className="w-1/2 h-full bg-slate-900"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-2xl">settings_brightness</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-slate-900 dark:text-slate-300">System</span>
                                {theme === 'system' && <span className="material-symbols-outlined text-primary filled">check_circle</span>}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Organization Details Section */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                            <span className="material-symbols-outlined text-2xl filled">business</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Organization & Subscription</h2>
                            <p className="text-sm text-slate-500">Manage your organization's identity and subscription plan.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Organization Name</label>
                                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm flex items-center justify-between">
                                    <span>{orgInfo?.name || 'Loading organization...'}</span>
                                    <span className="material-symbols-outlined text-slate-400 text-sm">verified</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Plan</label>
                                <div className="px-5 py-3.5 bg-primary/5 border-2 border-primary/20 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center font-black italic shadow-lg shadow-primary/20">
                                            S
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Actuon {orgInfo?.plan_name || 'Starter'}</p>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Active Plan</p>
                                        </div>
                                    </div>
                                    <button className="text-primary hover:text-primary/80 transition-colors">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Plan Features Preview */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Plan Benefits</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { icon: 'directions_car', label: 'Up to 5 Vehicles' },
                                    { icon: 'analytics', label: 'Basic Analytics' },
                                    { icon: 'description', label: 'Standard Reports' },
                                    { icon: 'mail', label: 'Email Support' }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{feature.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Settings Section */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl">
                            <span className="material-symbols-outlined text-2xl filled">account_circle</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile Details</h2>
                            <p className="text-sm text-slate-500">Update your personal information and profile picture.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="relative group cursor-pointer shrink-0">
                                <div className="size-24 md:size-32 rounded-3xl border-4 border-slate-50 dark:border-slate-800 shadow-sm bg-primary text-white flex items-center justify-center text-5xl font-bold">
                                    {user?.email?.[0].toUpperCase() || 'A'}
                                </div>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address (Read Only)</label>
                                    <input type="email" value={user?.email || ''} readOnly className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm cursor-not-allowed opacity-70" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleSignOut}
                                className="px-10 py-3.5 bg-red-500 hover:bg-red-600 text-white text-sm font-black rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
