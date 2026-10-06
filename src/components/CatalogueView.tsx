import React from 'react';
import { Users, Download, Box } from 'lucide-react';
import type { FiveMScript } from '../types/script';
import { ScriptCard } from './ScriptCard';
import { useRealtimePresence } from '../hooks/useRealtimePresence';


interface CatalogueViewProps {
  scripts: FiveMScript[];
  onOpenDetails: (script: FiveMScript) => void;
  onDownloadIncrement?: (scriptId: string) => void;
  onSecurityAlert?: (msg: string) => void;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  scripts,
  onOpenDetails,
  onDownloadIncrement,
  onSecurityAlert
}) => {
  const onlineUsers = useRealtimePresence();
  const totalDownloads = scripts.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

  return (
    <div className="space-y-8">
      {/* Clean Minimalist Header with Real-time Metrics & Icons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        {/* Title */}
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

        {/* Real-time Presence & Stats Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Real-time Active Online Users */}
          <div className="flex items-center gap-2 bg-[#121215] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-medium text-white">{onlineUsers}</span>
            <span className="text-[11px] text-zinc-400">online acum</span>
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
        </div>
      </div>

      {/* Empty State */}
      {scripts.length === 0 && (
        <div className="pro-card rounded-2xl p-16 text-center">
          <p className="text-zinc-400 text-xs font-mono">
            Nu există niciun script vRP publicat momentan.
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
