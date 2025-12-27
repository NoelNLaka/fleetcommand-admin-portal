
import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const Settings: React.FC = () => {
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
              className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                theme === 'light' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
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
              className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                theme === 'dark' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
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
              className={`flex flex-col gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                theme === 'system' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
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
                <img src="https://i.pravatar.cc/150?u=alex" alt="" className="size-24 md:size-32 rounded-3xl object-cover border-4 border-slate-50 dark:border-slate-800 shadow-sm" />
                <div className="absolute inset-0 bg-slate-900/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input type="text" defaultValue="Alex Morgan" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input type="email" defaultValue="alex.morgan@fleet.co" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button className="px-10 py-3.5 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
