import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
            <header className="px-6 md:px-20 lg:px-32 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <img src="/actuon-logo.png" alt="Actuon Logo" className="h-10 w-auto" />
                        <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Actuon</span>
                    </div>
                </div>
                <nav>
                    <Link to="/login" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95">
                        Log In
                    </Link>
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-20 lg:px-32 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mb-4 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        v2.0 Now Available
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                        Manage your fleet <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">like a pro.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        The all-in-one solution for vehicle tracking, maintenance scheduling, and driver management. Streamline your operations today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                        >
                            Get Started Now
                        </Link>
                        <button className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold rounded-2xl transition-all border-2 border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                            View Demo
                        </button>
                    </div>

                    {/* Feature Grid Mini */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-20">
                        {[
                            { icon: 'analytics', title: 'Real-time Analytics', desc: 'Monitor fleet performance with live data dashboards.' },
                            { icon: 'build', title: 'Predictive Maintenance', desc: 'Schedule repairs before breakdowns happen.' },
                            { icon: 'map', title: 'Live GPS Tracking', desc: 'Track every vehicle in your fleet in real-time.' }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-3xl text-primary mb-4">{feature.icon}</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Section */}
                    <div className="pt-32 pb-20">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-slate-500 dark:text-slate-400">Choose the plan that's right for your business. Scalable solutions for fleets of all sizes.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'Starter',
                                    price: '$29',
                                    period: '/mo',
                                    desc: 'Perfect for small business owners and startups.',
                                    features: ['5 Vehicles', 'Basic Analytics', 'Standard Reports', 'Email Support'],
                                    button: 'Start Free Trial',
                                    popular: false
                                },
                                {
                                    name: 'Pro',
                                    price: '$79',
                                    period: '/mo',
                                    desc: 'Advanced tools for growing fleets and operations.',
                                    features: ['20 Vehicles', 'Predictive Maintenance', 'Live GPS Tracking', 'Priority Support', 'Advanced Analytics'],
                                    button: 'Go Professional',
                                    popular: true
                                },
                                {
                                    name: 'Enterprise',
                                    price: 'Custom',
                                    period: '',
                                    desc: 'Full-scale solution for large industrial fleets.',
                                    features: ['Unlimited Vehicles', 'Dedicated Account Manager', 'Custom Integrations', '24/7 Phone Support', 'API Access', 'White-labeling'],
                                    button: 'Talk to Sales',
                                    popular: false
                                }
                            ].map((plan, i) => (
                                <div
                                    key={i}
                                    className={`relative p-8 rounded-3xl border-2 transition-all hover:-translate-y-2 ${plan.popular
                                            ? 'bg-white dark:bg-slate-800 border-primary shadow-2xl shadow-primary/20 scale-105 z-20'
                                            : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:border-primary/30'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-black rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{plan.desc}</p>
                                    </div>

                                    <div className="mb-8 flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">{plan.period}</span>
                                    </div>

                                    <ul className="space-y-4 mb-10 text-left">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                <span className="text-sm font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 ${plan.popular
                                                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40'
                                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
                                            }`}
                                    >
                                        {plan.button}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-slate-400 dark:text-slate-600 text-sm">
                &copy; {new Date().getFullYear()} Actuon Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
