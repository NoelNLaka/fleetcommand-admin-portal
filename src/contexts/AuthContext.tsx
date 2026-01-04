import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '../types';

interface Profile {
    id: string;
    org_id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If it's a 406 (Not Acceptable) it means no record was found
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Consolidated listener: Handles initial session and subsequent changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setSession(session);
            setUser(currentUser);

            if (currentUser) {
                // Only start loading if we don't already have the profile or if it's a new session
                // This prevents redundant fetches on minor auth state changes (like TOKEN_REFRESHED)
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                    console.log(`[Auth] ${event} event received. Fetching profile for ${currentUser.email}...`);
                    setLoading(true);
                    console.time('Fetch Profile');
                    await fetchProfile(currentUser.id);
                    console.timeEnd('Fetch Profile');
                } else if (!profile) {
                    console.log(`[Auth] No profile found but user exists. Fetching profile...`);
                    console.time('Fetch Profile');
                    await fetchProfile(currentUser.id);
                    console.timeEnd('Fetch Profile');
                } else {
                    setLoading(false);
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        session,
        profile,
        loading,
        signOut: async () => {
            await supabase.auth.signOut();
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
