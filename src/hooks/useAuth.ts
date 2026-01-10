import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      } else {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    return { data };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    return { data };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthState((prev) => ({ ...prev, error: error.message }));
      return { error };
    }
    return {};
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!authState.user,
  };
}
