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
  const count = reviews.length;
  const avgRating = count > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / count).toFixed(1)
    : null;

  return (
    <div className="bg-[#101014] border border-white/[0.08] rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${
                avgRating && s <= Math.round(Number(avgRating))
                  ? 'text-white fill-white'
                  : 'text-zinc-600 fill-zinc-600'
              }`}
            />
          ))}
        </div>

        {/* Real Dynamic Stats */}
        <div className="flex items-center gap-2 text-xs">
          {count > 0 ? (
            <>
              <span className="font-bold text-white font-mono">
                {avgRating} <span className="text-zinc-500 font-normal text-[11px]">/ 5.0</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-medium">
                {count} {count === 1 ? 'recenzie verificată' : 'recenzii verificate'}
              </span>
            </>
          ) : (
            <span className="text-zinc-400 font-medium">
              Comunitate FiveM vRP • Fii primul care lasă un feedback
            </span>
          )}
        </div>
      </div>

      {/* Button to Add Real Review */}
      <button
        onClick={onOpenAddReview}
        className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 text-xs font-['Montserrat'] font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-zinc-400" />
        <span>Adaugă Recenzie</span>
      </button>
    </div>
  );
};
