
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 shrink-0 z-20 relative">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <button onClick={onMenuClick} className="md:hidden text-slate-500">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {title && <h2 className="hidden md:block font-black text-lg text-slate-900 dark:text-white tracking-tight">{title}</h2>}
      </div>

      {/* Search - only show if no title or small screen */}
      {/* Search Bar */}
      {!title && (
        <>
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden text-slate-500 p-2 mr-2"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Search Input Container */}
          <div className={`
             absolute md:relative top-16 md:top-auto left-0 md:left-auto w-full md:w-auto p-4 md:p-0 bg-surface-light dark:bg-surface-dark md:bg-transparent border-b md:border-none border-slate-200 dark:border-slate-800
             flex-1 max-w-lg transition-all duration-200 ease-in-out z-10
             ${isSearchOpen ? 'block' : 'hidden md:block'}
           `}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 rounded-lg bg-background-light dark:bg-background-dark border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 sm:text-sm transition-all outline-none"
                placeholder="Search..."
                type="text"
                autoFocus={isSearchOpen}
              />
            </div>
          </div>

          {/* Overlay for mobile search */}
          {isSearchOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-0 md:hidden top-32"
              onClick={() => setIsSearchOpen(false)}
            />
          )}
        </>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
        </button>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <div className="flex items-center gap-3 ml-2">
          <img src="https://i.pravatar.cc/150?u=alex" alt="User" className="size-8 rounded-full border-2 border-slate-100 dark:border-slate-800" />
          <div className="hidden sm:block">
            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">Alex Morgan</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
