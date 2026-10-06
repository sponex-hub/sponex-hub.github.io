import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090b]">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Studio Tag */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white font-bold text-sm tracking-wider font-['Montserrat'] shadow-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-['Montserrat'] font-bold text-sm tracking-tight text-white leading-none">
              SPONEX
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
              vRP Resources
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          <span className="font-mono text-[10px] text-zinc-400">vRP 1.0 & Dunko Ready</span>
        </div>
      </div>
    </header>
  );
};
