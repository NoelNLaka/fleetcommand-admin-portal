import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <span className="material-symbols-outlined text-4xl filled">local_taxi</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your fleet dashboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                        <span className="material-symbols-outlined text-xl">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">mail</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                            <a href="#" className="text-xs font-bold text-primary hover:text-primary/80">Forgot password?</a>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Don't have an account? <a href="#" className="font-bold text-primary hover:underline">Contact Admin</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
