import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    className?: string;
    onMobileItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "", onMobileItemClick }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
        { id: 'inventory', label: 'Fleet', icon: 'directions_car', path: '/inventory' },
        { id: 'bookings', label: 'Bookings', icon: 'book_online', path: '/bookings' },
        { id: 'maintenance', label: 'Maintenance', icon: 'handyman', path: '/maintenance' },
        { id: 'reports', label: 'Reports', icon: 'bar_chart', path: '/reports' },
        { id: 'customers', label: 'Customers', icon: 'group', path: '/customers' },
        // { id: 'live_map', label: 'Live Map', icon: 'map', path: '/live-map' }, // Commented out until path exists
    ];

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
                    {navItems.map((item) => (
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
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {/* Settings Button */}
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

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 px-3 py-2 border-2 border-primary/20 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="size-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm bg-primary text-white flex items-center justify-center font-bold">
                                {user?.email?.[0].toUpperCase() || 'A'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.email}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Admin</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
