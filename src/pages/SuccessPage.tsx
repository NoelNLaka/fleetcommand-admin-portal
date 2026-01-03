import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const SuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            window.location.href = '/';
        }
    }, [countdown]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">
                            check_circle
                        </span>
                    </div>
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                    Payment Successful!
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Thank you for subscribing to Actuon. Your account is being set up.
                </p>

                {sessionId && (
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-8 font-mono">
                        Session ID: {sessionId}
                    </p>
                )}

                <div className="space-y-4">
                    <Link
                        to="/"
                        className="block px-8 py-4 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40"
                    >
                        Go to Dashboard
                    </Link>

                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        Redirecting in {countdown} seconds...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuccessPage;
