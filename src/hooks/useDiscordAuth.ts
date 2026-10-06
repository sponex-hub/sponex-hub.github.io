import { useState, useEffect } from 'react';
import { supabase, signInWithDiscord, signOutUser } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface DiscordProfile {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export function useDiscordAuth() {
  const [user, setUser] = useState<DiscordProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mapSupabaseUser = (sbUser: SupabaseUser | null): DiscordProfile | null => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.custom_claims?.global_name || meta.full_name || meta.name || meta.user_name || sbUser.email?.split('@')[0] || 'Discord User',
      avatarUrl: meta.avatar_url || meta.picture || '',
      email: sbUser.email
    };
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user || null));
      setLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user || null));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithDiscord = async () => {
    await signInWithDiscord();
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  return {
    user,
    loading,
    loginWithDiscord,
    logout
  };
}
