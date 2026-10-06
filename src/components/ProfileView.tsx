import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Box, 
  Download, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Check, 
  User, 
  FolderKanban, 
  Loader2,
  ShieldCheck,
  Calendar
} from 'lucide-react';

import type { FiveMScript } from '../types/script';
import type { DiscordProfile } from '../hooks/useDiscordAuth';
import { deleteScript, supabase } from '../lib/supabase';

interface ProfileViewProps {
  currentUser: DiscordProfile;
  scripts: FiveMScript[];
  onBackToCatalogue: () => void;
  onOpenDetails: (script: FiveMScript) => void;
  onOpenAddScript: () => void;
  onEditScript: (script: FiveMScript) => void;
  onScriptDeleted: (scriptId: string) => void;
  onUpdateProfile: (updates: Partial<DiscordProfile>) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  scripts,
  onBackToCatalogue,
  onOpenDetails,
  onOpenAddScript,
  onEditScript,
  onScriptDeleted,
  onUpdateProfile,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'settings'>('scripts');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state for profile settings
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  // Filter scripts uploaded by current user
  const userScripts = scripts.filter(s => {
    if (s.githubUrl && s.githubUrl === `author:${currentUser.id}`) return true;
    if (s.author && s.author.toLowerCase() === currentUser.name.toLowerCase()) return true;
    return false;
  });

  const totalDownloads = userScripts.reduce((acc, s) => acc + (s.downloads || 0), 0);

  const handleDelete = async (scriptId: string) => {
    setDeletingId(scriptId);
    try {
      const res = await deleteScript(scriptId);
      if (res.success) {
        onScriptDeleted(scriptId);
        setConfirmDeleteId(null);
        
        if (supabase) {
          try {
            const feedChannel = supabase.channel('sponex_community_scripts_feed');
            feedChannel.send({
              type: 'broadcast',
              event: 'script_deleted',
              payload: { id: scriptId }
            });
          } catch (e) {}
        }
      } else {
        alert(`Eroare la ștergerea scriptului: ${res.error || 'Necunoscută'}`);
      }
    } catch (err: any) {
      alert(`Eroare: ${err.message || 'Eroare neașteptată'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateProfile({
      name: name.trim(),
      avatarUrl: avatarUrl.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 select-none animate-fade-in">
      {/* Top Navigation Bar with Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <button
          onClick={onBackToCatalogue}
          className="inline-flex items-center gap-2 bg-[#121215] hover:bg-[#18181f] text-zinc-300 hover:text-white border border-white/10 px-4 py-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer shadow-sm active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>Înapoi la Catalog</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddScript}
            className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>Publică Script</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Deconectare</span>
          </button>
        </div>
      </div>

      {/* Big Hero Profile Header Banner */}
      <div className="bg-[#101014] border border-white/[0.12] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white/20 shadow-xl bg-[#16161c]"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#5865F2] border-2 border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Montserrat'] tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono px-2.5 py-0.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Creator FiveM</span>
                </span>
              </div>

              <p className="text-xs text-zinc-400 font-mono">
                ID Cont: <span className="text-zinc-300">{currentUser.id}</span>
              </p>

              <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Membru Comunitate
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Cont Activ</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-4 min-w-[140px]">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Box className="w-3.5 h-3.5 text-white" />
                <span>Scripturi</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{userScripts.length}</div>
            </div>

            <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-4 min-w-[140px]">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Descărcări</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalDownloads}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer border ${
              activeTab === 'scripts'
                ? 'bg-white text-black border-white shadow-[0_2px_12px_rgba(255,255,255,0.15)]'
                : 'bg-[#101014] text-zinc-400 hover:text-white border-white/[0.08]'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Scripturile Mele ({userScripts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer border ${
              activeTab === 'settings'
                ? 'bg-white text-black border-white shadow-[0_2px_12px_rgba(255,255,255,0.15)]'
                : 'bg-[#101014] text-zinc-400 hover:text-white border-white/[0.08]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Editează Profilul</span>
          </button>
        </div>

        {/* Tab 1: User's Scripts Library */}
        {activeTab === 'scripts' ? (
          <div className="space-y-4">
            {userScripts.length === 0 ? (
              <div className="bg-[#101014] border border-white/[0.08] rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white font-['Montserrat']">
                    Nu ai publicat încă niciun script
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Împărtășește resursele și sistemele tale vRP cu întreaga comunitate FiveM.
                  </p>
                </div>
                <button
                  onClick={onOpenAddScript}
                  className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-[0_2px_15px_rgba(255,255,255,0.2)] active:scale-95"
                >
                  <Plus className="w-4 h-4 text-black stroke-[3]" />
                  <span>Publică Primul Tău Script</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userScripts.map((script) => (
                  <div
                    key={script.id}
                    className="bg-[#101014] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-md group"
                  >
                    <div className="flex items-start gap-4">
                      {script.imageUrl ? (
                        <img
                          src={script.imageUrl}
                          alt={script.title}
                          className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-[#16161c]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 shrink-0 font-mono text-xs font-bold">
                          vRP
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-['Montserrat'] truncate">
                            {script.title}
                          </h4>
                          <span className="bg-white/[0.06] text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded uppercase shrink-0">
                            {script.category}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {script.description || 'Fără descriere adăugată.'}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono pt-1">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Download className="w-3 h-3 text-zinc-500" />
                            {script.downloads || 0} descărcări
                          </span>
                          <span>•</span>
                          <span>{script.version || 'v1.0.0'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => onOpenDetails(script)}
                        className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Vezi în Catalog</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditScript(script)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editează</span>
                        </button>

                        {confirmDeleteId === script.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 p-1 rounded-xl">
                            <button
                              onClick={() => handleDelete(script.id)}
                              disabled={deletingId === script.id}
                              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {deletingId === script.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Confirmă'
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-zinc-400 hover:text-white text-[11px] px-2 py-1 cursor-pointer"
                            >
                              Anulează
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(script.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                            title="Șterge Scriptul"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Profile Settings */
          <div className="bg-[#101014] border border-white/[0.08] rounded-3xl p-6 sm:p-8 max-w-xl">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-white font-['Montserrat']">
                  Setări Profil
                </h3>
                <p className="text-xs text-zinc-400">
                  Personalizează modul în care apari în comunitatea Sponex Hub.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
                  Nume Afișat / Nickname
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Marius"
                  className="w-full bg-[#0c0c0e] border border-white/15 focus:border-white rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
                  Link Poză de Profil (Avatar URL)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Ex: https://i.imgur.com/... sau link de Discord avatar"
                  className="w-full bg-[#0c0c0e] border border-white/15 focus:border-white rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Dacă lași gol, se va genera automat un avatar stilizat pe baza numelui tău.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black font-['Montserrat'] text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                >
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>{isSaved ? 'Profil Salvat cu Succes!' : 'Salvează Modificările'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
