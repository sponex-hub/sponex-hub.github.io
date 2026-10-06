import React from 'react';
import { Star, MessageSquarePlus } from 'lucide-react';
import type { CommunityReview } from '../lib/supabase';

interface TrustpilotBarProps {
  reviews: CommunityReview[];
  onOpenAddReview: () => void;
}

export const TrustpilotBar: React.FC<TrustpilotBarProps> = ({
  reviews,
  onOpenAddReview
}) => {
  const count = reviews.length || 3;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.9';

  return (
    <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shadow-sm">
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* Trustpilot Logo Badge */}
        <div className="flex items-center gap-1.5 bg-[#00b67a]/10 border border-[#00b67a]/25 px-3 py-1.5 rounded-xl">
          <div className="w-5 h-5 bg-[#00b67a] rounded-sm flex items-center justify-center text-white font-bold text-xs">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-['Montserrat'] font-extrabold text-white tracking-tight">
            Trustpilot
          </span>
        </div>

        {/* 5 Green Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="w-5 h-5 bg-[#00b67a] text-white rounded-sm flex items-center justify-center shadow-xs"
            >
              <Star className="w-3 h-3 fill-current" />
            </div>
          ))}
        </div>

        {/* Score & Label */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-mono">
            {avgRating} <span className="text-zinc-500 font-normal text-xs">/ 5.0</span>
          </span>
          <span className="text-zinc-500 text-xs font-mono">•</span>
          <span className="text-xs font-bold text-[#00b67a]">
            Excelent
          </span>
          <span className="text-zinc-400 text-xs font-medium">
            ({count} {count === 1 ? 'recenzie' : 'recenzii'})
          </span>
        </div>
      </div>

      {/* Button to Add Review */}
      <button
        onClick={onOpenAddReview}
        className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 text-xs font-['Montserrat'] font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 shrink-0"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-400" />
        <span>Adauga Recenzie</span>
      </button>
    </div>
  );
};
