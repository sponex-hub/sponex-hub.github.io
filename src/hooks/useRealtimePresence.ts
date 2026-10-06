import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { DiscordProfile } from './useDiscordAuth';

export interface PresenceUser {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  isRegistered?: boolean;
  lastSeen?: number;
}

function getStableVisitorId(): string {
  if (typeof window === 'undefined') return 'visitor_ssr';
  let id = sessionStorage.getItem('spx_visitor_id');
  if (!id) {
    id = `usr_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem('spx_visitor_id', id);
  }
  return id;
}

export function useRealtimePresence(currentUser?: DiscordProfile | null) {
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const visitorId = getStableVisitorId();
    const presenceKey = currentUser?.id || visitorId;

    const channel = supabase.channel('site_presence_v1', {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const userList: PresenceUser[] = [];

      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1];
          userList.push({
            id: key,
            name: latest.name || (key.startsWith('usr_') ? `Vizitator #${key.slice(-4)}` : 'Membru'),
            avatarUrl: latest.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(latest.name || key)}`,
            isOnline: true,
            isRegistered: Boolean(latest.isRegistered),
            lastSeen: latest.lastSeen || Date.now()
          });
        }
      });

      // Ensure unique by ID
      const uniqueMap = new Map<string, PresenceUser>();
      userList.forEach(u => uniqueMap.set(u.id, u));
      const finalUsers = Array.from(uniqueMap.values());

      setOnlineUsers(finalUsers);
      setOnlineCount(Math.max(1, finalUsers.length));
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const payload = {
            id: presenceKey,
            name: currentUser?.name || `Vizitator #${visitorId.slice(-4)}`,
            avatarUrl: currentUser?.avatarUrl || '',
            isRegistered: Boolean(currentUser),
            lastSeen: Date.now(),
          };

          await channel.track(payload);
          updatePresenceState();
        }
      });

    return () => {
      channel.untrack();
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.avatarUrl]);

  return {
    onlineCount,
    onlineUsers
  };
}

