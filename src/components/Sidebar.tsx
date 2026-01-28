import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
    className?: string;
    onMobileItemClick?: () => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    roles: UserRole[];
    subItems?: Omit<NavItem, 'icon' | 'roles'>[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ className = "", onMobileItemClick }) => {
    const { user, profile, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const toggleExpand = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Define navigation sections
    const navSections: NavSection[] = [
        {
            title: 'Main',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', path: '/dashboard', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
                { id: 'bookings', label: 'Bookings', icon: 'book_online', path: '/bookings', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER] },
                { id: 'customers', label: 'Customers', icon: 'group', path: '/customers', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER] },
            ]
        },
        {
            title: 'Operations',
            items: [
                { id: 'fleet', label: 'Fleet', icon: 'directions_car', path: '/inventory', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
                { id: 'maintenance', label: 'Maintenance', icon: 'handyman', path: '/maintenance', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] },
                {
                    id: 'inventory',
                    label: 'Inventory',
                    icon: 'inventory_2',
                    path: '/inventory/parts',
                    roles: [UserRole.WORKSHOP_SUPERVISOR],
                    subItems: [
                        { id: 'parts', label: 'Parts', path: '/inventory/parts' },
                        { id: 'fuel', label: 'Fuel', path: '/inventory/fuel' },
                        { id: 'tyres', label: 'Tyres', path: '/inventory/tyres' },
                        { id: 'tools', label: 'Tools', path: '/inventory/tools' },
                    ]
                },
                { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping', path: '/inventory/suppliers', roles: [UserRole.WORKSHOP_SUPERVISOR] },
                { id: 'insurance', label: 'Insurance', icon: 'shield', path: '/insurance', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKSHOP_SUPERVISOR] },
                { id: 'workshop-staff', label: 'Workshop Staff', icon: 'badge', path: '/staff/workshop', roles: [UserRole.WORKSHOP_SUPERVISOR] },
            ]
        },
        {
            title: 'Management',
            items: [
                {
                    id: 'reports',
                    label: 'Reports',
                    icon: 'bar_chart',
                    path: '/reports',
                    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
                    subItems: [
                        { id: 'reports-overview', label: 'Overview', path: '/reports' },
                        { id: 'audit-log', label: 'Audit Log', path: '/reports/audit' },
                    ]
                },
                { id: 'staff', label: 'Staff', icon: 'badge', path: '/staff', roles: [UserRole.SUPERADMIN] },
                { id: 'agreements', label: 'Agreements', icon: 'description', path: '/agreements', roles: [UserRole.SUPERADMIN] },
                { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CLIENT_OFFICER, UserRole.WORKSHOP_SUPERVISOR, UserRole.MECHANIC] },
            ]
        }
    ];

    // Filter sections based on user role
    const filteredSections = profile?.role
        ? navSections.map(section => ({
            ...section,
            items: section.items.filter(item => item.roles.includes(profile.role as UserRole))
        })).filter(section => section.items.length > 0)
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
                <nav className="flex-1 px-4 mt-2 flex flex-col gap-6 overflow-y-auto">
                    {loading || !profile ? (
                        // Navigation Skeleton
                        <>
                            {[1, 2, 3].map((sectionIdx) => (
                                <div key={sectionIdx} className="space-y-2">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-4 mb-3"></div>
                                    {Array(sectionIdx === 1 ? 3 : 2).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl animate-pulse">
                                            <div className="size-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    ) : (
                        filteredSections.map((section) => (
                            <div key={section.title} className="space-y-1">
                                {/* Section Title */}
                                <h3 className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    {section.title}
                                </h3>

                                { /* Section Items */}
                                {section.items.map((item) => {
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const isExpanded = expandedItems.includes(item.id);
                                    const isSubPathActive = item.subItems?.some(si => location.pathname === si.path);

                                    return (
                                        <div key={item.id} className="space-y-1">
                                            <NavLink
                                                to={item.path}
                                                onClick={(e) => {
                                                    if (hasSubItems) {
                                                        toggleExpand(e, item.id);
                                                    } else {
                                                        onMobileItemClick?.();
                                                    }
                                                }}
                                                className={({ isActive }) => `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all group ${isActive || isSubPathActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={`material-symbols-outlined text-[20px] ${isActive || isSubPathActive ? 'filled' : 'group-hover:scale-110 transition-transform'}`}>
                                                            {item.icon}
                                                        </span>
                                                        <span className={`text-sm font-semibold tracking-tight ${(isActive || isSubPathActive) ? '' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                            {item.label}
                                                        </span>
                                                        {hasSubItems && (
                                                            <span className={`material-symbols-outlined ml-auto text-[18px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                expand_more
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </NavLink>

                                            {/* Render Sub-items if any */}
                                            {hasSubItems && isExpanded && (
                                                <div className="ml-12 space-y-1">
                                                    {item.subItems?.map((subItem) => (
                                                        <NavLink
                                                            key={subItem.id}
                                                            to={subItem.path}
                                                            onClick={onMobileItemClick}
                                                            className={({ isActive }) => `flex items-center gap-4 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${isActive
                                                                ? 'text-primary'
                                                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                                                }`}
                                                        >
                                                            {subItem.label}
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </nav>


                {/* Bottom Section - User Profile */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
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
        </aside>
    );
};

export default Sidebar;
