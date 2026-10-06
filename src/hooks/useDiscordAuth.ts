import { useState, useEffect, useCallback } from 'react';
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


function getStoredProfile(): DiscordProfile | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.id)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read stored session:', e);
  }
  return null;
}

export function useDiscordAuth() {
  const [user, setUser] = useState<DiscordProfile | null>(getStoredProfile);
  const [loading, setLoading] = useState<boolean>(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const mapSupabaseUser = useCallback((sbUser: SupabaseUser | null): DiscordProfile | null => {
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
  }, []);

  useEffect(() => {
    // 1. Check for direct Discord OAuth access_token in URL hash
    const handleDirectDiscordToken = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        try {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const token = hashParams.get('access_token');
          const tokenType = hashParams.get('token_type') || 'Bearer';

          if (token) {
            const res = await fetch('https://discord.com/api/users/@me', {
              headers: {
                Authorization: `${tokenType} ${token}`
              }
            });

            if (res.ok) {
              const dUser = await res.json();
              if (dUser && dUser.id) {
                const name = dUser.global_name || dUser.username || 'Discord User';
                let avatar = '';
                if (dUser.avatar) {
                  avatar = `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png`;
                } else {
                  avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
                }

                const profile: DiscordProfile = {
                  id: dUser.id,
                  name: name,
                  avatarUrl: avatar,
                  email: dUser.email,
                  isDirect: false
                };

                setUser(profile);
                try {
                  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
                } catch (e) {}
                setOauthError(null);
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Failed to parse direct Discord token:', err);
        }
      }

      // Check for OAuth error in URL hash or search
      const search = window.location.search;
      if (hash.includes('error=') || search.includes('error=')) {
        const urlParams = new URLSearchParams(search);
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const errorMsg = urlParams.get('error_description') || hashParams.get('error_description') || urlParams.get('error') || hashParams.get('error');
        if (errorMsg) {
          console.warn('OAuth URL Error:', errorMsg);
          setOauthError(decodeURIComponent(errorMsg.replace(/\+/g, ' ')));
        }
      }
    };

    handleDirectDiscordToken();

    if (!supabase) {
      setLoading(false);
      return;
    }

    // 2. Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = mapSupabaseUser(session.user);
        if (profile) {
          setUser(profile);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          } catch (e) {}
        }
        // Clean URL if it has tokens
        if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear user state if the current session was an OAuth session (not a direct manual login)
        const currentSaved = getStoredProfile();
        if (currentSaved && !currentSaved.isDirect) {
          setUser(null);
          try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (e) {}
        }
      }
      setLoading(false);
    });

    // 3. Initial check for existing active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = mapSupabaseUser(session.user);
        if (profile) {
          setUser(profile);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          } catch (e) {}
        }
      }
      setLoading(false);
    }).catch(err => {
      console.warn('getSession error:', err);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mapSupabaseUser]);

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

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {}
    setUser(profile);
    setOauthError(null);
    return profile;
  };

  const updateProfile = (updates: Partial<DiscordProfile>): DiscordProfile | null => {
    if (!user) return null;
    const updated: DiscordProfile = {
      ...user,
      ...updates
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setUser(updated);
    return updated;
  };

  const logout = async () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    setUser(null);
    await signOutUser();
  };

  return {
    user,
    loading,
    oauthError,
    loginWithOAuth,
    loginDirectly,
    updateProfile,
    logout
  };
}



