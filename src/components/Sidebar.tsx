import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
    className?: string;
    onMobileItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "", onMobileItemClick }) => {
    const { user, profile, loading, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', path: '/dashboard', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
        { id: 'inventory', label: 'Fleet', icon: 'directions_car', path: '/inventory', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] },
        { id: 'bookings', label: 'Bookings', icon: 'book_online', path: '/bookings', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER] },
        { id: 'maintenance', label: 'Maintenance', icon: 'handyman', path: '/maintenance', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] },
        { id: 'insurance', label: 'Insurance', icon: 'shield', path: '/insurance', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKSHOP_SUPERVISOR] },
        { id: 'reports', label: 'Reports', icon: 'bar_chart', path: '/reports', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
        { id: 'customers', label: 'Customers', icon: 'group', path: '/customers', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER] },
    ];

    // Restrictive by default: Only show items after profile loads and role is matched
    const navItems = profile?.role
        ? allNavItems.filter(item => item.roles.includes(profile.role as UserRole))
        : [];

    return (
        <aside className={`bg-surface-light dark:bg-surface-dark flex flex-col h-full z-10 ${className}`}>
            <div className="flex flex-col h-full">
                {/* Brand */}
                <div className="p-6 flex items-center gap-3">
                    <img src="/actuon-logo.png" alt="Actuon Logo" className="h-10 w-auto object-contain" />
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-2xl font-black leading-tight tracking-tighter">Actuon</h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 mt-4 flex flex-col gap-1 overflow-y-auto">
                    {loading || !profile ? (
                        // Navigation Skeleton
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl animate-pulse">
                                <div className="size-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                            </div>
                        ))
                    ) : (
                        navItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                onClick={onMobileItemClick}
                                className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : 'group-hover:scale-110 transition-transform'}`}>
                                            {item.icon}
                                        </span>
                                        <span className={`text-sm font-bold tracking-tight ${isActive ? '' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))
                    )}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {/* Settings Button */}
                    {loading || !profile ? (
                        <div className="flex items-center gap-4 px-4 py-3 rounded-xl animate-pulse">
                            <div className="size-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        </div>
                    ) : (
                        <NavLink
                            to="/settings"
                            onClick={onMobileItemClick}
                            className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''}`}>
                                        settings
                                    </span>
                                    <span className="text-sm font-bold tracking-tight">Settings</span>
                                </>
                            )}
                        </NavLink>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        {loading || !profile ? (
                            <div className="flex items-center gap-3 px-3 py-2 border-2 border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse">
                                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 px-3 py-2 border-2 border-primary/20 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 overflow-hidden">
                                <div className="flex-shrink-0 size-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm bg-primary text-white flex items-center justify-center font-bold">
                                    {user?.email?.[0].toUpperCase() || 'A'}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{user?.email}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{profile?.role}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="ml-auto flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Sign Out"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
