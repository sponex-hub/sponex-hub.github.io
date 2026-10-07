import React, { useState, useMemo } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Search, 
  Box, 
  Download, 
  ArrowRight, 
  Radio, 
  Code2
} from 'lucide-react';
import type { PresenceUser } from '../hooks/useRealtimePresence';
import type { FiveMScript } from '../types/script';
import { useTranslation } from '../lib/i18n';

interface CommunityMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: PresenceUser[];
  scripts: FiveMScript[];
  onOpenAuthorProfile?: (author: string) => void;
}

export const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  scripts,
  onOpenAuthorProfile
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');

  // Canonical key function to deduplicate variations (e.g. sponeV3 -> sponex)
  const getCanonicalAuthorKey = (name: string): string => {
    const lower = name.toLowerCase().trim();
    if (lower.startsWith('spone') || lower === 'sponex' || lower === 'sponev3') {
      return 'sponex';
    }
    return lower;
  };

  // Collect and aggregate real creators from the scripts database + online registered users
  const creatorList = useMemo(() => {
    const map = new Map<string, {
      name: string;
      scriptsCount: number;
      downloads: number;
      avatarUrl?: string;
      isOnline: boolean;
      role: string;
      frameworks: Set<string>;
    }>();

    // 1. Process all scripts to aggregate stats per creator
    scripts.forEach(script => {
      const rawAuthor = script.author?.trim() || 'Sponex';
      const key = getCanonicalAuthorKey(rawAuthor);
      const displayName = key === 'sponex' ? 'Sponex' : rawAuthor;

      const existing = map.get(key) || {
        name: displayName,
        scriptsCount: 0,
        downloads: 0,
        avatarUrl: script.imageUrl || undefined,
        isOnline: false,
        role: key === 'sponex' ? 'Hub Founder & Lead Dev' : 'Scripter vRP',
        frameworks: new Set<string>()
      };

      existing.scriptsCount += 1;
      existing.downloads += (script.downloads || 0);
      if (script.frameworks) {
        script.frameworks.forEach(fw => existing.frameworks.add(fw));
      }
      map.set(key, existing);
    });

    // 2. Check online status from Supabase Realtime without duplicating creators
    onlineUsers.forEach(u => {
      const key = getCanonicalAuthorKey(u.name);
      const existing = map.get(key);
      if (existing) {
        existing.isOnline = true;
        if (u.avatarUrl) existing.avatarUrl = u.avatarUrl;
        if (key === 'sponex') {
          existing.name = 'Sponex';
        }
      } else if (u.isRegistered && !u.name.startsWith('Vizitator')) {
        map.set(key, {
          name: u.name,
          scriptsCount: 0,
          downloads: 0,
          avatarUrl: u.avatarUrl,
          isOnline: true,
          role: 'Community Member',
          frameworks: new Set()
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.scriptsCount - a.scriptsCount;
    });
  }, [scripts, onlineUsers]);

  if (!isOpen) return null;

  // Filter creators based on search query and active tab
  const filteredCreators = creatorList.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (activeTab === 'online') return creator.isOnline;
    return true;
  });

  const onlineCreatorsCount = creatorList.filter(c => c.isOnline).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-lg w-full p-6 relative z-10 shadow-[0_25px_90px_rgba(0,0,0,0.95)] max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Montserrat'] tracking-tight">
                {t('communityMembers')}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {onlineUsers.length} {t('online')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="py-4 space-y-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchCreator')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/30 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 font-mono focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {t('all')} ({creatorList.length})
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Montserrat'] font-bold transition-all cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{t('online')} ({onlineCreatorsCount})</span>
            </button>
          </div>
        </div>

        {/* Creators List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {filteredCreators.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              {t('emptyCatalog')}
            </div>
          ) : (
            filteredCreators.map((creator) => {
              return (
                <div
                  key={creator.name}
                  onClick={() => {
                    if (onOpenAuthorProfile) {
                      onClose();
                      onOpenAuthorProfile(creator.name);
                    }
                  }}
                  className="bg-[#0c0c0e] hover:bg-[#16161c] border border-white/[0.07] hover:border-white/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar with Status Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creator.name)}`}
                        alt={creator.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-[#121215]"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0c0c0e] ${
                          creator.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                        title={creator.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white font-['Montserrat'] truncate group-hover:text-zinc-200">
                          {creator.name}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3 text-zinc-500" />
                          <strong className="text-zinc-300 font-medium">{creator.scriptsCount}</strong> {creator.scriptsCount === 1 ? t('scriptSingle') : t('scripts')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3 text-zinc-500" />
                          <strong className="text-zinc-300 font-medium">{creator.downloads}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action View Profile */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-white font-['Montserrat'] font-semibold bg-white/[0.04] group-hover:bg-white/[0.1] border border-white/[0.06] group-hover:border-white/20 px-3 py-1.5 rounded-xl transition-all shrink-0">
                    <span>{t('viewProfile')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1">
            <Code2 className="w-3 h-3 text-zinc-400" />
            FiveM Scripter Registry
          </span>
          <span>Sponex Hub Platform</span>
        </div>
      </div>
    </div>
  );
};
