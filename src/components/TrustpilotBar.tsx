import React, { useEffect, useRef } from 'react';
import { Star, ExternalLink } from 'lucide-react';

export const TrustpilotBar: React.FC = () => {
  const trustBoxRef = useRef<HTMLDivElement>(null);
  const trustpilotUrl = 'https://www.trustpilot.com/review/sponex-hub.github.io';

  useEffect(() => {
    // If official Trustpilot script is loaded, initialize TrustBox
    if (typeof window !== 'undefined' && (window as any).Trustpilot && trustBoxRef.current) {
      (window as any).Trustpilot.loadFromElement(trustBoxRef.current, true);
    }
  }, []);

  return (
    <div className="bg-[#101014] border border-white/[0.08] rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none shadow-sm">
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* Trustpilot Official Logo Badge */}
        <a
          href={trustpilotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#00b67a]/15 hover:bg-[#00b67a]/25 border border-[#00b67a]/30 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Star className="w-4 h-4 fill-[#00b67a] text-[#00b67a]" />
          <span className="text-xs font-['Montserrat'] font-extrabold text-white tracking-tight">
            Trustpilot
          </span>
        </a>

        {/* 5 Green Trustpilot Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="w-4 h-4 bg-[#00b67a] text-white rounded-xs flex items-center justify-center shadow-2xs"
            >
              <Star className="w-2.5 h-2.5 fill-current" />
            </div>
          ))}
        </div>

        {/* Status description */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-300 font-medium">
            Recenzii Verificate • Comunitate FiveM vRP
          </span>
        </div>
      </div>

      {/* Official TrustBox Container (Loads automatically from Trustpilot) */}
      <div
        ref={trustBoxRef}
        className="trustpilot-widget hidden"
        data-locale="ro-RO"
        data-template-id="5419b6a8b0d04a076446a9ad"
        data-businessunit-id="sponex-hub.github.io"
        data-style-height="24px"
        data-style-width="100%"
        data-theme="dark"
        data-stars="1,2,3,4,5"
        data-review-languages="ro,en"
      >
        <a href={trustpilotUrl} target="_blank" rel="noopener noreferrer">
          Trustpilot
        </a>
      </div>

      {/* Direct Link Button */}
      <a
        href={trustpilotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 text-xs font-['Montserrat'] font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 shrink-0"
      >
        <span>Vezi & Scrie pe Trustpilot</span>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
      </a>
    </div>
  );
};
