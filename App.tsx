import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Bookings from './components/Bookings';
import Inventory from './components/Inventory';
import Maintenance from './components/Maintenance';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'bookings':
        return <Bookings />;
      case 'maintenance':
        return <Maintenance />;
      case 'reports':
        return <Reports />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">construction</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Under Construction</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">The {activeView} view is currently being implemented.</p>
              <button 
                onClick={() => setActiveView('dashboard')}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'maintenance': return 'Maintenance Scheduling';
      case 'reports': return 'Reports Dashboard';
      case 'dashboard': return 'Fleet Analytics';
      case 'bookings': return 'Booking Management';
      case 'inventory': return 'Fleet Inventory';
      case 'customers': return 'Customer Management';
      default: return undefined;
    }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        className="w-64 border-r border-slate-200 dark:border-slate-800 hidden md:flex shrink-0"
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 w-64 bg-surface-light dark:bg-surface-dark z-50 transform transition-transform md:hidden shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => {
            setActiveView(view);
            setIsMobileMenuOpen(false);
          }} 
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          title={getPageTitle()}
        />
        {renderContent()}
      </main>
    </div>
  );
};

export default App;