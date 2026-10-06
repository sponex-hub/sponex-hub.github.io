import React, { useState } from 'react';
import { X, Star, Check, Send } from 'lucide-react';
import { saveReview } from '../lib/supabase';
import { securityShield } from '../lib/security';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewAdded: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewAdded
}) => {
  const [author, setAuthor] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAuthor = author.trim() || 'Membru FiveM';
    const cleanText = text.trim();

    if (!cleanText || isSubmitting) return;

    // Anti-Flood security check
    const spamCheck = securityShield.checkClickSpam();
    if (!spamCheck.allowed) {
      alert(spamCheck.reason || 'Te rugam sa nu spamezi!');
      return;
    }

    const rateCheck = securityShield.rateLimit('submit_review', { maxRequests: 3, windowMs: 60000 });
    if (!rateCheck.allowed) {
      alert(`Poti trimite o noua recenzie in ${rateCheck.remainingSec} secunde.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const ok = await saveReview(cleanAuthor, cleanText, rating);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onReviewAdded();
          onClose();
          setSuccess(false);
          setText('');
        }, 1500);
      }
    } catch (err) {
      console.warn('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#121216] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-7 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-[#00b67a] flex items-center justify-center text-white">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-['Montserrat']">
              Trustpilot & Community
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight">
            Lasa o Recenzie
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Parerea ta ajuta alti dezvoltatori de FiveM sa aleaga scripturile optimizate.
          </p>
        </div>

        {success ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#00b67a]/20 border border-[#00b67a]/30 text-[#00b67a] flex items-center justify-center mb-3 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Recenzie Publicata!</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Multumim! Recenzia ta a fost salvata in baza de date.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Star Selector */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5 uppercase font-mono">
                Nota ta
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      star <= (hoverRating || rating)
                        ? 'bg-[#00b67a] text-white scale-105 shadow-[0_2px_10px_rgba(0,182,122,0.3)]'
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                ))}
                <span className="text-xs font-bold text-zinc-200 font-mono ml-2">
                  {rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5 uppercase font-mono">
                Nume sau Nickname
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Cosmin (FiveM Dev)"
                maxLength={30}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/40 transition-colors font-medium"
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5 uppercase font-mono">
                Mesaj / Parere despre scripturi
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Spune cum a functionat scriptul pe serverul tau de FiveM..."
                rows={3}
                maxLength={200}
                required
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/40 transition-colors resize-none font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!text.trim() || isSubmitting}
              className="w-full bg-[#00b67a] hover:bg-[#009e6a] disabled:opacity-40 text-white font-['Montserrat'] text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,182,122,0.3)] transition-all cursor-pointer active:scale-95 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Se trimite...' : 'Publica Recenzia'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
