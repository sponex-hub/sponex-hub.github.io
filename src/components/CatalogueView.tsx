import React from 'react';
import { Users, Download, Box, Plus, LogOut } from 'lucide-react';
import type { FiveMScript } from '../types/script';
import { ScriptCard } from './ScriptCard';
import { useRealtimePresence } from '../hooks/useRealtimePresence';
import type { DiscordProfile } from '../hooks/useDiscordAuth';

interface CatalogueViewProps {
  scripts: FiveMScript[];
  onOpenDetails: (script: FiveMScript) => void;
  onDownloadIncrement?: (scriptId: string) => void;
  onSecurityAlert?: (msg: string) => void;
  onOpenAddScript: () => void;
  currentUser: DiscordProfile | null;
  onLoginDiscord: () => void;
  onLogoutDiscord: () => void;
  onOpenLibrary: () => void;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  scripts,
  onOpenDetails,
  onDownloadIncrement,
  onSecurityAlert,
  onOpenAddScript,
  currentUser,
  onLoginDiscord,
  onLogoutDiscord,
  onOpenLibrary
}) => {
  const onlineUsers = useRealtimePresence();
  const totalDownloads = scripts.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

  return (
    <div className="space-y-8 select-none">
      {/* Clean Minimalist Header with Real-time Metrics & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        {/* Title & Tagline */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h1 className="font-['Montserrat'] text-2xl font-bold text-white tracking-tight">
              SPONEX <span className="font-normal text-zinc-500 text-sm ml-1.5">vRP Hub</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Resurse și scripturi FiveM optimizate pentru framework-ul Dunko & vRP.
          </p>
        </div>

        {/* Real-time Presence, Discord User & Upload Button Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Real-time Active Online Users */}
          <div className="flex items-center gap-2 bg-[#121215] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-medium text-white">{onlineUsers}</span>
            <span className="text-[11px] text-zinc-400">online</span>
          </div>

          {/* Total Downloads Counter */}
          <div className="flex items-center gap-2 bg-[#121215] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-medium text-white">{totalDownloads}</span>
            <span className="text-[11px] text-zinc-400">descărcări</span>
          </div>

          {/* Scripts Total */}
          <div className="flex items-center gap-2 bg-[#121215] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <Box className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-medium text-white">{scripts.length}</span>
            <span className="text-[11px] text-zinc-400">{scripts.length === 1 ? 'script' : 'scripturi'}</span>
          </div>

          {/* Discord Profile Status or Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#121215] border border-white/[0.12] pl-2 pr-1.5 py-1 rounded-xl text-xs shadow-sm">
              <button
                onClick={onOpenLibrary}
                className="flex items-center gap-2 hover:bg-white/[0.05] p-1 rounded-lg transition-colors cursor-pointer text-left"
                title="Deschide Biblioteca Mea"
              >
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#5865F2] flex items-center justify-center text-[10px] text-white font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-zinc-200 font-semibold truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="bg-white/[0.08] text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded">
                  Library
                </span>
              </button>

              <button
                onClick={onLogoutDiscord}
                title="Deconectare"
                className="text-zinc-500 hover:text-white p-1 rounded transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginDiscord}
              className="flex items-center gap-1.5 bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-white border border-[#5865F2]/30 px-3.5 py-2 rounded-xl text-xs font-['Montserrat'] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-[#5865F2]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Conectare Discord</span>
            </button>
          )}

          {/* Upload Script Trigger Button - ONLY visible when connected! */}
          {currentUser && (
            <button
              onClick={onOpenAddScript}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-3.5 py-2 rounded-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>Publică Script</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {scripts.length === 0 && (
        <div className="pro-card rounded-2xl p-16 text-center">
          <p className="text-zinc-400 text-xs font-mono">
            Nu există niciun script vRP publicat momentan. Fii primul care publică!
          </p>
        </div>
      )}

      {/* Grid of Scripts */}
      {scripts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onOpenDetails={onOpenDetails}
              onDownloadIncrement={onDownloadIncrement}
              onSecurityAlert={onSecurityAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
};
