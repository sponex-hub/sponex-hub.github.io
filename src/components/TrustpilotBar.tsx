import React from 'react';
import { Star, ExternalLink } from 'lucide-react';

export const TrustpilotBar: React.FC = () => {
  const trustpilotUrl = 'https://www.trustpilot.com/review/sponex-hub.github.io';

  return (
    <div className="bg-[#101014] border border-white/[0.08] rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Trustpilot Logo Badge */}
        <div className="flex items-center gap-1.5 bg-[#00b67a]/15 border border-[#00b67a]/30 px-2.5 py-1 rounded-lg">
          <Star className="w-3.5 h-3.5 fill-[#00b67a] text-[#00b67a]" />
          <span className="text-[11px] font-['Montserrat'] font-extrabold text-white tracking-tight">
            Trustpilot
          </span>
        </div>

        {/* 5 Stars Outlined */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className="w-3.5 h-3.5 text-zinc-600 fill-zinc-800"
            />
          ))}
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 font-medium">
            Profil Oficial Trustpilot • Lasă o recenzie pe pagina noastră oficială
          </span>
        </div>
      </div>

      {/* Direct Link to Official Trustpilot Review Form */}
      <a
        href={trustpilotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 text-xs font-['Montserrat'] font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
      >
        <span>Scrie pe Trustpilot</span>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
      </a>
    </div>
  );
};
