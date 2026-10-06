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
          setAuthor('');
        }, 1200);
      }
    } catch (err) {
      console.warn('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-2xl max-w-md w-full p-6 sm:p-7 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Comunitate & Feedback
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight">
            Adaugă o Recenzie
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Părerea ta ajută ceilalți dezvoltatori de FiveM. Recenzia se salvează în timp real.
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mb-3">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold text-white font-['Montserrat']">Recenzie Trimisă</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Recenzia ta a fost salvată în baza de date.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Stars (Minimal Clean Studio Style) */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase font-mono tracking-wider">
                Evaluare (Stele)
              </label>
              <div className="flex items-center gap-2 bg-black/50 border border-white/[0.08] rounded-xl p-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-white fill-white'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-white font-mono ml-auto">
                  {rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                Nume sau Nickname
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Marius (Dev)"
                maxLength={30}
                required
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors font-medium"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                Mesaj / Comentariu
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrie părerea ta despre script sau compatibilitatea vRP..."
                rows={3}
                maxLength={250}
                required
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!text.trim() || isSubmitting}
              className="w-full bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-['Montserrat'] text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-95 mt-2"
            >
              <Send className="w-3.5 h-3.5 fill-black text-black" />
              <span>{isSubmitting ? 'Se trimite...' : 'Trimite Recenzia'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
