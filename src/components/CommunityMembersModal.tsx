import React from 'react';
import { X, Users, ShieldCheck } from 'lucide-react';
import type { PresenceUser } from '../hooks/useRealtimePresence';
import type { FiveMScript } from '../types/script';

interface CommunityMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: PresenceUser[];
  scripts: FiveMScript[];
}

export const CommunityMembersModal: React.FC<CommunityMembersModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  scripts
}) => {
  if (!isOpen) return null;

  // Collect distinct authors from published scripts
  const knownAuthors = Array.from(
    new Set(
      scripts
        .map(s => s.author?.trim())
        .filter((a): a is string => Boolean(a && a !== 'Sponex Community'))
    )
  );

  // Determine if a known author is currently online
  const onlineAuthorNames = new Set(onlineUsers.map(u => u.name.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-md w-full p-6 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Montserrat']">
                Membri Comunitate
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {onlineUsers.length} {onlineUsers.length === 1 ? 'utilizator conectat' : 'utilizatori conectați'} în timp real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Lists */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Online Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Online Acum ({onlineUsers.length})</span>
            </div>

            <div className="space-y-1.5">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#0c0c0e] border border-white/[0.06] hover:border-white/15 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 rounded-xl object-cover border border-white/10 bg-[#16161c]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0c0e]" />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white font-['Montserrat'] flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.isRegistered && (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {user.isRegistered ? 'Membru Autentificat' : 'Vizitator Hub'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    online
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Creators / Authors Section */}
          {knownAuthors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Creatori & Autori Înregistrați
              </div>

              <div className="space-y-1.5">
                {knownAuthors.map((author) => {
                  const isOnline = onlineAuthorNames.has(author.toLowerCase());
                  return (
                    <div
                      key={author}
                      className="bg-[#0c0c0e] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author)}`}
                            alt={author}
                            className="w-8 h-8 rounded-xl object-cover border border-white/10 bg-[#16161c]"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c0c0e] ${
                              isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="text-xs font-bold text-zinc-200 font-['Montserrat']">
                            {author}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Scripter vRP
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isOnline
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-zinc-500 bg-white/[0.02] border border-white/[0.05]'
                        }`}
                      >
                        {isOnline ? 'online' : 'offline'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] text-center">
          <p className="text-[10px] text-zinc-400 font-mono">
            Sincronizare în timp real prin Supabase WebSockets
          </p>
        </div>
      </div>
    </div>
  );
};
