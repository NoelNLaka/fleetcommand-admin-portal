/// <reference types="vite/client" />
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserRole, BranchLocation } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark' | 'system';

// Get Supabase config from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const Settings: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [orgInfo, setOrgInfo] = useState<{ name: string; plan_name: string } | null>(null);

    // Mobile pairing state
    const [deviceId, setDeviceId] = useState<string>(() => {
        // Try to get existing device ID from localStorage, or generate new one
        const stored = localStorage.getItem('workshop_device_id');
        return stored || uuidv4();
    });
    const [accessToken, setAccessToken] = useState<string>('');
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);

    // Generate a new device ID
    const regenerateDeviceId = useCallback(() => {
        const newId = uuidv4();
        setDeviceId(newId);
        localStorage.setItem('workshop_device_id', newId);
    }, []);

    // Generate access token for workshop device
    const generateAccessToken = useCallback(async () => {
        if (!profile?.org_id) return;

        setIsGeneratingToken(true);
        setTokenError(null);

        try {
            // Generate a secure token combining org_id and a random component
            // In production, this would ideally be a signed JWT from the backend
            const tokenData = `${profile.org_id}-${deviceId}-${Date.now()}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(tokenData);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Store the token association in Supabase for validation
            const token = `wst_${hashHex.slice(0, 32)}`;

            const { error } = await supabase
                .from('workshop_devices')
                .upsert({
                    id: deviceId,
                    org_id: profile.org_id,
                    access_token: token,
                    device_name: `Workshop Tablet`,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) {
                // If table doesn't exist, still generate token for demo purposes
                console.debug('Workshop devices table not available:', error);
            }

            setAccessToken(token);
            localStorage.setItem('workshop_access_token', token);
        } catch (err) {
            console.error('Failed to generate token:', err);
            // Fallback token for demo
            setAccessToken(`wst_demo_${Date.now().toString(36)}`);
        } finally {
            setIsGeneratingToken(false);
        }
    }, [profile?.org_id, deviceId]);

    // Load or generate token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('workshop_access_token');
        if (storedToken) {
            setAccessToken(storedToken);
        } else if (profile?.org_id) {
            generateAccessToken();
        }
    }, [profile?.org_id, generateAccessToken]);

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

    // Locations State
    const [locations, setLocations] = useState<BranchLocation[]>([]);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<BranchLocation | null>(null);
    const [newLocation, setNewLocation] = useState({ name: '', address: '', isDefault: false });

    const fetchLocations = async () => {
        if (!profile?.org_id) return;
        try {
            const { data, error } = await supabase
                .from('branch_locations')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const mappedLocations: BranchLocation[] = (data || []).map(l => ({
                id: l.id,
                name: l.name,
                address: l.address,
                isDefault: l.is_default
            }));
            setLocations(mappedLocations);
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    useEffect(() => {
        if (activeOrgTab === 'Locations') {
            fetchLocations();
        }
    }, [activeOrgTab]);

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.org_id) return;

        try {
            // If setting as default, unset others first if needed
            if (newLocation.isDefault) {
                await supabase
                    .from('branch_locations')
                    .update({ is_default: false })
                    .eq('org_id', profile.org_id);
            }

            if (editingLocation) {
                // Update existing location
                const { error } = await supabase
                    .from('branch_locations')
                    .update({
                        name: newLocation.name,
                        address: newLocation.address,
                        is_default: newLocation.isDefault,
                        updated_by: profile.id
                    })
                    .eq('id', editingLocation.id);

                if (error) throw error;

                // Sync fleet if this is (now) the default location
                if (newLocation.isDefault) {
                    const { error: vehicleError } = await supabase
                        .from('vehicles')
                        .update({ location: newLocation.address })
                        .eq('org_id', profile.org_id);
                    if (vehicleError) console.error('Error syncing vehicle locations:', vehicleError);
                }
            } else {
                // Insert new location
                const { error } = await supabase.from('branch_locations').insert([{
                    org_id: profile.org_id,
                    name: newLocation.name,
                    address: newLocation.address,
                    is_default: newLocation.isDefault,
                    updated_by: profile.id
                }]);

                if (error) throw error;

                // Sync fleet if this is the default location
                if (newLocation.isDefault) {
                    const { error: vehicleError } = await supabase
                        .from('vehicles')
                        .update({ location: newLocation.address })
                        .eq('org_id', profile.org_id);
                    if (vehicleError) console.error('Error syncing vehicle locations:', vehicleError);
                }
            }

            setIsLocationModalOpen(false);
            setEditingLocation(null);
            setNewLocation({ name: '', address: '', isDefault: false });
            fetchLocations();
        } catch (error) {
            console.error('Error saving location:', error);
        }
    };

    const handleDeleteLocation = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;
        try {
            const { error } = await supabase.from('branch_locations').delete().eq('id', id);
            if (error) throw error;
            fetchLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
        }
    };

    const handleSetDefaultLocation = async (id: string) => {
        if (!profile?.org_id) return;
        try {
            // Find the location to get its address
            const targetLoc = locations.find(l => l.id === id);
            if (!targetLoc) return;

            await supabase
                .from('branch_locations')
                .update({ is_default: false })
                .eq('org_id', profile.org_id); // Unset all

            await supabase
                .from('branch_locations')
                .update({ is_default: true })
                .eq('id', id); // Set new default

            // Sync fleet with new default location address
            const { error: vehicleError } = await supabase
                .from('vehicles')
                .update({ location: targetLoc.address })
                .eq('org_id', profile.org_id);

            if (vehicleError) throw vehicleError;

            fetchLocations();
        } catch (error) {
            console.error('Error setting default location:', error);
        }
    };

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
                    { id: 'Locations', icon: 'store', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
                    { id: 'Team Members', icon: 'groups', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] },
                    { id: 'Mobile Pairing', icon: 'qr_code_2', roles: [UserRole.SUPERADMIN] }
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

                    {activeOrgTab === 'Mobile Pairing' && (
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6 mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Workshop App Pairing</h2>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">Secure Pairing</span>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-slate-100 flex items-center justify-center shrink-0">
                                        {accessToken ? (
                                            <QRCodeCanvas
                                                value={JSON.stringify({
                                                    orgId: profile?.org_id || "",
                                                    orgName: orgInfo?.name || "Fleet Organization",
                                                    token: accessToken,
                                                    deviceId: deviceId,
                                                    supabaseUrl: SUPABASE_URL,
                                                    supabaseAnonKey: SUPABASE_ANON_KEY
                                                })}
                                                size={220}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        ) : (
                                            <div className="size-[220px] flex items-center justify-center">
                                                <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            regenerateDeviceId();
                                            generateAccessToken();
                                        }}
                                        disabled={isGeneratingToken}
                                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                                        {isGeneratingToken ? 'Generating...' : 'Generate New Code'}
                                    </button>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">How to connect</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            Scan this QR code with the <strong>Workshop Inventory</strong> app to automatically configure the tablet for your organization.
                                        </p>
                                    </div>

                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 mt-0.5">1</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Install the Workshop app APK on your Android tablet.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 mt-0.5">2</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Tap "Scan QR Code" on the setup screen.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 mt-0.5">3</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Point the camera at this QR code to pair.</p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-black text-emerald-600 shrink-0 mt-0.5">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">The app will sync your fleet vehicles automatically.</p>
                                        </li>
                                    </ul>

                                    {/* Device Info */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pairing Details</p>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-slate-400 font-bold">Organization</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-black truncate">{orgInfo?.name || 'Loading...'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-bold">Device ID</p>
                                                <p className="text-slate-700 dark:text-slate-200 font-mono text-[10px]">{deviceId.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                                        <a
                                            href="/workshop-app-debug.apk"
                                            download
                                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/10"
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                            Download APK
                                        </a>
                                        <button
                                            onClick={() => {
                                                const qrData = JSON.stringify({
                                                    orgId: profile?.org_id || "",
                                                    orgName: orgInfo?.name || "Fleet Organization",
                                                    token: accessToken,
                                                    deviceId: deviceId,
                                                    supabaseUrl: SUPABASE_URL,
                                                    supabaseAnonKey: SUPABASE_ANON_KEY
                                                }, null, 2);
                                                navigator.clipboard.writeText(qrData);
                                            }}
                                            className="flex items-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                            Copy Config
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeOrgTab === 'Locations' && (
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6 mb-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Branch Locations</h2>
                                <button
                                    onClick={() => setIsLocationModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Add Branch
                                </button>
                            </div>

                            {locations.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">store</span>
                                    <p className="font-bold text-slate-600 dark:text-slate-300">No locations added</p>
                                    <p className="text-sm">Add your main HQ or branch offices.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {locations.map(location => (
                                        <div key={location.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 hover:border-primary/30 transition-all group relative">
                                            {location.isDefault && (
                                                <span className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-[9px] font-black uppercase tracking-wider rounded-lg">Default</span>
                                            )}
                                            <div className="flex items-start gap-4">
                                                <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                    <span className="material-symbols-outlined">store</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{location.name}</h3>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[200px]">{location.address}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!location.isDefault && (
                                                    <button onClick={() => handleSetDefaultLocation(location.id)} className="text-[10px] font-bold text-slate-400 hover:text-primary">Set Default</button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setEditingLocation(location);
                                                        setNewLocation({ name: location.name, address: location.address, isDefault: location.isDefault });
                                                        setIsLocationModalOpen(true);
                                                    }}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-primary ml-2"
                                                >
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteLocation(location.id)} className="text-[10px] font-bold text-red-400 hover:text-red-500 ml-2">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Location Modal */}
                            {isLocationModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => {
                                        setIsLocationModalOpen(false);
                                        setEditingLocation(null);
                                        setNewLocation({ name: '', address: '', isDefault: false });
                                    }}></div>
                                    <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in duration-200">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                            {editingLocation ? 'Edit Branch Location' : 'Add Branch Location'}
                                        </h3>
                                        <form onSubmit={handleAddLocation} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Branch Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newLocation.name}
                                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                                    placeholder="e.g. Headquarters"
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Address</label>
                                                <textarea
                                                    required
                                                    value={newLocation.address}
                                                    onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                                                    placeholder="Full address..."
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isDefault"
                                                    checked={newLocation.isDefault}
                                                    onChange={e => setNewLocation({ ...newLocation, isDefault: e.target.checked })}
                                                    className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                                />
                                                <label htmlFor="isDefault" className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default location</label>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsLocationModalOpen(false);
                                                        setEditingLocation(null);
                                                        setNewLocation({ name: '', address: '', isDefault: false });
                                                    }}
                                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90"
                                                >
                                                    {editingLocation ? 'Save Changes' : 'Add Location'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
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
