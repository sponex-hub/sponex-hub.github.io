import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, X, MessageSquareQuote } from 'lucide-react';
import type { CommunityReview } from '../lib/supabase';

interface LiveReviewPopupProps {
  reviews: CommunityReview[];
  onOpenReviewModal: () => void;
}

export const LiveReviewPopup: React.FC<LiveReviewPopupProps> = ({
  reviews,
  onOpenReviewModal
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!reviews || reviews.length === 0) return;

    // Trigger first review popup after 2.5 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    // Interval to cycle through reviews
    const cycleInterval = setInterval(() => {
      // Show next review
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setIsVisible(true);
    }, 11000); // Trigger every 11 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [reviews]);

  // Auto-hide popup after 3.8 seconds
  useEffect(() => {
    if (isVisible) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3800); // Stays visible for ~3.8 seconds

      return () => clearTimeout(hideTimer);
    }
  }, [isVisible, currentIndex]);

  if (!reviews || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex] || reviews[0];

  return (
    <aside
      aria-label="Notificare Recenzie Comunitate"
      className={`fixed bottom-6 left-6 z-40 max-w-[340px] w-[90vw] transition-all duration-500 transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
      }`}
      style={{ perspective: '1000px' }}
    >
      <div className="bg-[#121216]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(0,182,122,0.08)] flex flex-col gap-2.5 relative overflow-hidden select-none">
        
        {/* Subtle Green Trustpilot Accent Glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00b67a]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header: Star Rating + Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* 5 Green Trustpilot Stars */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                    i < (currentReview.rating || 5)
                      ? 'bg-[#00b67a] text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  <Star className="w-2.5 h-2.5 fill-current" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-white font-mono ml-1">
              {currentReview.rating || 5}.0
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#00b67a] font-mono font-bold flex items-center gap-0.5 bg-[#00b67a]/10 px-1.5 py-0.2 rounded border border-[#00b67a]/20">
              <ShieldCheck className="w-2.5 h-2.5" />
              Verificat
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Review Text */}
        <p className="text-xs text-zinc-200 leading-relaxed font-medium line-clamp-2">
          "{currentReview.text}"
        </p>

        {/* Footer: Author & Trustpilot Reference */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px]">
          <span className="text-zinc-400 font-semibold truncate">
            {currentReview.author}
          </span>
          <button
            onClick={onOpenReviewModal}
            className="text-zinc-400 hover:text-white underline cursor-pointer flex items-center gap-1"
          >
            <MessageSquareQuote className="w-3 h-3 text-zinc-400" />
            <span>Lasa review</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
