import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { DiscordProfile } from '../hooks/useDiscordAuth';

interface DiscordLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOAuthLogin: () => Promise<{ error?: string }>;
  onDirectLogin: (username: string, avatarUrl?: string) => DiscordProfile;
  oauthError?: string | null;
}

export const DiscordLoginModal: React.FC<DiscordLoginModalProps> = ({
  isOpen,
  onClose,
  onOAuthLogin,
  onDirectLogin,
  oauthError
}) => {
  const [username, setUsername] = useState('');
  const [isAttemptingOAuth, setIsAttemptingOAuth] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthClick = async () => {
    setIsAttemptingOAuth(true);
    setLocalError(null);
    try {
      const res = await onOAuthLogin();
      if (res?.error) {
        setLocalError(res.error);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Eroare la redirecționare Discord');
    } finally {
      setIsAttemptingOAuth(false);
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    onDirectLogin(username.trim());
    onClose();
  };

  const activeError = localError || oauthError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-7 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 fill-[#5865F2]" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight">
            Autentificare Discord
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Conectează-te pentru a publica resurse și a gestiona biblioteca ta de scripturi.
          </p>
        </div>

        {/* Error notification if OAuth failed */}
        {activeError && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 mb-4 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Observație OAuth:</span> {activeError}
              <div className="text-[11px] text-zinc-400 mt-1">
                Poți folosi direct câmpul de mai jos pentru conectare instant fără redirect!
              </div>
            </div>
          </div>
        )}

        {/* Fast 1-Click Direct Name Login Form */}
        <form onSubmit={handleDirectSubmit} className="space-y-3 mb-4 bg-white/[0.02] border border-white/[0.08] p-4 rounded-2xl">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Introdu Numele tău de Discord
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: marius sau alex#1234"
                className="flex-1 bg-[#0d0d10] border border-white/15 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-medium"
              />
              {username.trim() && (
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`}
                  alt="Avatar preview"
                  className="w-9 h-9 rounded-xl border border-white/20 shrink-0 bg-[#18181c]"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200 font-['Montserrat'] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
          >
            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>Conectează-te Instant</span>
          </button>
        </form>

        <div className="relative py-2 flex items-center justify-center mb-3">
          <div className="border-t border-white/[0.08] w-full absolute" />
          <span className="bg-[#101014] px-3 text-[10px] text-zinc-500 uppercase font-mono relative">
            sau prin Discord OAuth
          </span>
        </div>

        {/* Primary OAuth Button */}
        <button
          type="button"
          onClick={handleOAuthClick}
          disabled={isAttemptingOAuth}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-['Montserrat'] text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-[0_4px_20px_rgba(88,101,242,0.35)] active:scale-95"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span>{isAttemptingOAuth ? 'Se redirecționează...' : 'Conectare cu Discord (OAuth)'}</span>
        </button>
      </div>
    </div>
  );
};

