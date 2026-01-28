import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
    const fetchingRef = useRef(false);

    const fetchProfile = async (userId: string) => {
        // Prevent duplicate fetches
        if (fetchingRef.current) {
            console.log('[Auth] Profile fetch already in progress, skipping...');
            return;
        }

        fetchingRef.current = true;
        console.log('[Auth] Fetching profile...');

        try {
            console.log('[Auth] Querying staff table for userId:', userId);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
            );

            // First try to get from staff table (new users)
            const staffQueryPromise = supabase
                .from('staff')
                .select('id, org_id, first_name, last_name, role')
                .eq('auth_user_id', userId)
                .maybeSingle();

            const { data: staffData, error: staffError } = await Promise.race([staffQueryPromise, timeoutPromise]) as Awaited<typeof staffQueryPromise>;

            console.log('[Auth] Staff query result:', { staffData, staffError });

            if (staffData) {
                // Found in staff table - map to profile format
                console.log('[Auth] Staff profile loaded successfully:', staffData?.role);
                setProfile({
                    id: staffData.id,
                    org_id: staffData.org_id,
                    full_name: `${staffData.first_name} ${staffData.last_name}`.trim(),
                    avatar_url: null,
                    role: staffData.role as UserRole,
                });
                return;
            }

            // Fallback: check profiles table for legacy users
            console.log('[Auth] No staff record found, checking profiles table...');
            const profileQueryPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            const { data: profileData, error: profileError } = await Promise.race([profileQueryPromise, timeoutPromise]) as Awaited<typeof profileQueryPromise>;

            console.log('[Auth] Profile query result:', { profileData, profileError });

            if (profileError) {
                console.error('[Auth] Profile fetch error:', profileError.code, profileError.message);
                setProfile(null);
            } else if (profileData) {
                console.log('[Auth] Legacy profile loaded successfully:', profileData?.role);
                setProfile(profileData);
            } else {
                console.warn('[Auth] No staff or profile found for user');
                setProfile(null);
            }
        } catch (err) {
            console.error('[Auth] Unexpected error fetching profile:', err);
            setProfile(null);
        } finally {
            console.log('[Auth] Profile fetch complete, setting loading to false');
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let lastUserId: string | null = null;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            const currentUser = session?.user ?? null;
            console.log(`[Auth] Event: ${event}, userId: ${currentUser?.id?.slice(0, 8) || 'none'}, lastUserId: ${lastUserId?.slice(0, 8) || 'none'}`);

            // Ignore SIGNED_OUT if we still have a session (spurious event)
            if (event === 'SIGNED_OUT' && session?.user) {
                console.log('[Auth] Ignoring spurious SIGNED_OUT - session still active');
                return;
            }

            setSession(session);
            setUser(currentUser);

            if (currentUser) {
                const isNewUser = lastUserId !== currentUser.id;

                if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && isNewUser)) {
                    console.log(`[Auth] ${event} for ${currentUser.email} - fetching profile`);
                    lastUserId = currentUser.id;
                    setLoading(true);
                    await fetchProfile(currentUser.id);
                } else if (event === 'SIGNED_IN' && !isNewUser) {
                    // Same user, profile already loaded
                    console.log(`[Auth] ${event} for ${currentUser.email} - same user, keeping profile`);
                    setLoading(false);
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log(`[Auth] Token refreshed for ${currentUser.email}`);
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            } else {
                // Actually signed out
                console.log('[Auth] User signed out');
                lastUserId = null;
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
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
