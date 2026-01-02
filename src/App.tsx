import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Bookings from './components/Bookings';
import Inventory from './components/Inventory';
import Maintenance from './components/Maintenance';
import Reports from './components/Reports';
import Settings from './components/Settings';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Protected Layout Component
const ProtectedLayout: React.FC = () => {
    const { user, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const getPageTitle = () => {
        const path = location.pathname.split('/')[1];
        switch (path) {
            case 'maintenance': return 'Maintenance Scheduling';
            case 'reports': return 'Reports Dashboard';
            case 'dashboard': return 'Fleet Analytics';
            case 'bookings': return 'Booking Management';
            case 'inventory': return 'Fleet Inventory';
            case 'customers': return 'Customer Management';
            case 'settings': return 'System Settings';
            default: return undefined;
        }
    };

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar
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
                    onMobileItemClick={() => setIsMobileMenuOpen(false)}
                />
            </div>

            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                <Header
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    title={getPageTitle()}
                />
                <Outlet />
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                {/* Placeholder for future routes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default App;
