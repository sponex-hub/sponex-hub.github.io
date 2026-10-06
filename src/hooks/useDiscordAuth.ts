import { useState, useEffect } from 'react';
import { supabase, signInWithDiscord, signOutUser } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface DiscordProfile {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
  isDirect?: boolean;
}

const LOCAL_STORAGE_KEY = 'sponex_discord_session';

export function useDiscordAuth() {
  const [user, setUser] = useState<DiscordProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mapSupabaseUser = (sbUser: SupabaseUser | null): DiscordProfile | null => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    const name = meta.global_name || meta.full_name || meta.name || meta.user_name || meta.preferred_username || meta.custom_claims?.global_name || sbUser.email?.split('@')[0] || 'Discord User';
    
    let avatar = meta.avatar_url || meta.picture || '';
    if (!avatar && meta.provider_id && meta.avatar) {
      avatar = `https://cdn.discordapp.com/avatars/${meta.provider_id}/${meta.avatar}.png`;
    }
    if (!avatar) {
      avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    }

    return {
      id: sbUser.id,
      name: name,
      avatarUrl: avatar,
      email: sbUser.email,
      isDirect: false
    };
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Handle initial state and URL returns
    const initAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // 1. If returning from OAuth redirect with code / hash
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session?.user && !error) {
            const profile = mapSupabaseUser(session.user);
            setUser(profile);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
            // Clean URL query/hash without page reload
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
          }
        }

        // 2. Check active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = mapSupabaseUser(session.user);
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          setLoading(false);
          return;
        }

        // 3. Fallback to locally stored session if any
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.warn('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 4. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const profile = mapSupabaseUser(session.user);
        setUser(profile);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        } catch (e) {}
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (e) {}
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithOAuth = async (): Promise<{ error?: string }> => {
    return await signInWithDiscord();
  };

  const loginDirectly = (name: string, avatarUrl: string = ''): DiscordProfile => {
    const cleanName = name.trim();
    const cleanId = `discord_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const profile: DiscordProfile = {
      id: cleanId,
      name: cleanName,
      avatarUrl: avatarUrl.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      isDirect: true
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await signOutUser();
    setUser(null);
  };

  return {
    user,
    loading,
    loginWithOAuth,
    loginDirectly,
    logout
  };
}

