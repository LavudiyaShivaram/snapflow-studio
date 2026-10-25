import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../lib/types';
import { DEMO_PROFILES } from '../lib/mockData';

export interface AuthContextType {
  user: Profile | null;
  supabaseUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDemoMode: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  switchDemoUser: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(DEMO_PROFILES[0]);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync profile from Supabase profiles table
  const fetchOrSyncProfile = async (sbUser: User): Promise<Profile> => {
    if (!supabase) throw new Error('Supabase client unavailable');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', sbUser.id)
      .maybeSingle();

    if (profile && !error) {
      return { ...profile, id: (profile as any).profile_id || profile.id } as Profile;
    }

    // If profile row doesn't exist yet, synthesize and attempt to upsert
    const fallbackProfile: Profile = {
      profile_id: sbUser.id,
      id: sbUser.id,
      email: sbUser.email || '',
      full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Studio Principal',
      avatar_url: sbUser.user_metadata?.avatar_url || null,
      phone: sbUser.phone || null,
      timezone: 'Asia/Kolkata',
      is_platform_admin: false,
      inserted_date: sbUser.created_at,
      updated_date: sbUser.created_at,
      created_at: sbUser.created_at,
      updated_at: sbUser.created_at,
    };

    try {
      await supabase.from('profiles').upsert([fallbackProfile]);
    } catch {
      // Ignore if trigger or RLS restricts direct client upsert
    }

    return fallbackProfile;
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession warning:', error.message);
          }

          if (data.session?.user && mounted) {
            setSession(data.session);
            setSupabaseUser(data.session.user);
            setIsDemoMode(false);

            const profile = await fetchOrSyncProfile(data.session.user);
            if (mounted) {
              setUser(profile);
            }
          } else if (mounted) {
            // No active session in real Supabase: allow demo mode or empty state
            setIsDemoMode(true);
            setUser(DEMO_PROFILES[0]);
          }
        } catch (err) {
          console.warn('Failed to retrieve initial Supabase session, using demo mode:', err);
          if (mounted) {
            setIsDemoMode(true);
            setUser(DEMO_PROFILES[0]);
          }
        }
      } else {
        // Supabase not configured: default to initial demo studio founder
        if (mounted) {
          setIsDemoMode(true);
          setUser(DEMO_PROFILES[0]);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initAuth();

    // Listen to real-time auth changes using the official Supabase Auth client
    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setSupabaseUser(newSession?.user || null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user) {
            setIsDemoMode(false);
            const profile = await fetchOrSyncProfile(newSession.user);
            if (mounted) {
              setUser(profile);
              setLoading(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
          setSession(null);
          setLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }

        if (data.user) {
          setSupabaseUser(data.user);
          setSession(data.session);
          setIsDemoMode(false);
          const profile = await fetchOrSyncProfile(data.user);
          setUser(profile);
        }

        return {};
      } catch (err: any) {
        const msg = err.message || 'An unexpected authentication error occurred.';
        setAuthError(msg);
        return { error: msg };
      }
    }

    // Demo Mode Sign-In
    const matchedProfile = DEMO_PROFILES.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedProfile) {
      setUser(matchedProfile);
      setIsDemoMode(true);
      return {};
    }

    // Generate new simulated demo profile if credentials don't match pre-baked personas
    const newId = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    const newProfile: Profile = {
      profile_id: newId,
      id: newId,
      email: email.trim(),
      full_name: email.split('@')[0].replace('.', ' '),
      timezone: 'Asia/Kolkata',
      is_platform_admin: false,
      inserted_date: now,
      updated_date: now,
      created_at: now,
      updated_at: now,
    };
    setUser(newProfile);
    setIsDemoMode(true);
    return {};
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }

        // If email confirmation is required, session might be null
        if (!data.session && data.user) {
          return { requiresEmailConfirmation: true };
        }

        if (data.user) {
          setSupabaseUser(data.user);
          setSession(data.session);
          setIsDemoMode(false);
          const profile = await fetchOrSyncProfile(data.user);
          setUser(profile);
        }

        return {};
      } catch (err: any) {
        const msg = err.message || 'An error occurred during registration.';
        setAuthError(msg);
        return { error: msg };
      }
    }

    // Demo Mode Registration
    const newRegId = `usr-${Date.now()}`;
    const regNow = new Date().toISOString();
    const newProfile: Profile = {
      profile_id: newRegId,
      id: newRegId,
      email: email.trim(),
      full_name: fullName.trim(),
      timezone: 'Asia/Kolkata',
      is_platform_admin: false,
      inserted_date: regNow,
      updated_date: regNow,
      created_at: regNow,
      updated_at: regNow,
    };
    setUser(newProfile);
    setIsDemoMode(true);
    return {};
  };

  const signOut = async () => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const resetPasswordForEmail = async (
    email: string
  ): Promise<{ error?: string; message?: string }> => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }
        return { message: 'Password recovery email dispatched. Please check your inbox.' };
      } catch (err: any) {
        return { error: err.message || 'Failed to dispatch recovery email.' };
      }
    }

    return {
      message:
        'Demo Mode: Simulated password recovery link issued for ' + email.trim(),
    };
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ error?: string; message?: string }> => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }
        return { message: 'Password updated successfully.' };
      } catch (err: any) {
        return { error: err.message || 'Failed to update password.' };
      }
    }

    return { message: 'Demo Mode: Password updated in local session.' };
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!user) return { error: 'No authenticated user to update' };

    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    setUser(updated);

    if (isSupabaseConfigured && supabase && supabaseUser) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', supabaseUser.id);
        if (error) return { error: error.message };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    return {};
  };

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<{ error?: string }> => {
    setAuthError(null);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          setAuthError(error.message);
          return { error: error.message };
        }
        return {};
      } catch (err: any) {
        return { error: err.message || 'OAuth initialization failed.' };
      }
    }

    return { error: 'OAuth requires a live connected Supabase project with provider configured.' };
  };

  const switchDemoUser = (profileId: string) => {
    const target = DEMO_PROFILES.find((p) => p.id === profileId);
    if (target) {
      setUser(target);
      setIsDemoMode(true);
      setSession(null);
      setSupabaseUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isAuthenticated: Boolean(user),
        loading,
        isDemoMode,
        authError,
        clearAuthError,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        signInWithOAuth,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
