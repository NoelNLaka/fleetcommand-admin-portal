
import React from 'react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, className = "" }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'inventory', label: 'Fleet', icon: 'directions_car' },
    { id: 'bookings', label: 'Bookings', icon: 'book_online' },
    { id: 'maintenance', label: 'Maintenance', icon: 'handyman' },
    { id: 'reports', label: 'Reports', icon: 'bar_chart' },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'live_map', label: 'Live Map', icon: 'map' },
  ];

  return (
    <aside className={`bg-surface-light dark:bg-surface-dark flex flex-col h-full z-10 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl filled">local_taxi</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-xl font-black leading-tight tracking-tighter">FleetManager</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                activeView === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeView === item.id ? 'filled' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className={`text-sm font-bold tracking-tight ${activeView === item.id ? '' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Settings Button - styled to match screenshot highlight */}
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
              activeView === 'settings'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeView === 'settings' ? 'filled' : ''}`}>
              settings
            </span>
            <span className="text-sm font-bold tracking-tight">Settings</span>
          </button>
          
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 px-3 py-2 border-2 border-primary/20 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                <img src="https://i.pravatar.cc/150?u=alex" alt="" className="size-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                <div className="flex flex-col overflow-hidden">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">Alex Morgan</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Admin</p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
