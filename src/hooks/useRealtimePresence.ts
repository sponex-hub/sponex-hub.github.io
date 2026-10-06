import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function getStableVisitorId(): string {
  if (typeof window === 'undefined') return 'visitor_ssr';
  let id = sessionStorage.getItem('spx_visitor_id');
  if (!id) {
    id = `usr_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem('spx_visitor_id', id);
  }
  return id;
}

export function useRealtimePresence(): number {
  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    if (!supabase) return;

    const stableKey = getStableVisitorId();
    const channel = supabase.channel('site_presence_v1', {
      config: {
        presence: {
          key: stableKey,
        },
      },
    });

    const updatePresenceCount = () => {
      const state = channel.presenceState();
      // Count unique presence keys
      const uniqueKeys = Object.keys(state);
      setOnlineCount(Math.max(1, uniqueKeys.length));
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceCount)
      .on('presence', { event: 'join' }, updatePresenceCount)
      .on('presence', { event: 'leave' }, updatePresenceCount)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: Date.now(),
          });
          updatePresenceCount();
        }
      });

    return () => {
      channel.untrack();
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };

  }, []);

  return onlineCount;
}
