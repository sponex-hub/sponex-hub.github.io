import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  Plus, 
  ExternalLink, 
  Box, 
  Loader2,
  FolderKanban,
  Pencil,
  User,
  Check
} from 'lucide-react';

import type { FiveMScript } from '../types/script';
import type { DiscordProfile } from '../hooks/useDiscordAuth';
import { deleteScript, supabase } from '../lib/supabase';

interface UserLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: DiscordProfile | null;
  scripts: FiveMScript[];
  onOpenDetails: (script: FiveMScript) => void;
  onOpenAddScript: () => void;
  onEditScript: (script: FiveMScript) => void;
  onScriptDeleted: (scriptId: string) => void;
  onUpdateProfile?: (updated: Partial<DiscordProfile>) => void;
  onLogout: () => void;
}

export const UserLibraryModal: React.FC<UserLibraryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  scripts,
  onOpenDetails,
  onOpenAddScript,
  onEditScript,
  onScriptDeleted,
  onUpdateProfile,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'profile'>('scripts');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit Profile form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Filter scripts belonging to this user
  const userScripts = scripts.filter(s => {
    if (s.githubUrl && s.githubUrl === `author:${currentUser.id}`) return true;
    if (s.author && s.author.toLowerCase() === currentUser.name.toLowerCase()) return true;
    return false;
  });

  const totalUserDownloads = userScripts.reduce((acc, s) => acc + (s.downloads || 0), 0);

  const handleDelete = async (scriptId: string) => {
    setDeletingId(scriptId);
    try {
      const res = await deleteScript(scriptId);
      if (res.success) {
        onScriptDeleted(scriptId);
        setConfirmDeleteId(null);
        
        // Broadcast delete event if realtime is active
        if (supabase) {
          try {
            const feedChannel = supabase.channel('sponex_community_scripts_feed');
            feedChannel.send({
              type: 'broadcast',
              event: 'script_deleted',
              payload: { id: scriptId }
            });
          } catch (e) {
            console.warn('Realtime delete broadcast notice:', e);
          }
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
    if (!editName.trim()) return;

    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim(),
        avatarUrl: editAvatarUrl.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(editName.trim())}`
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-12 h-12 rounded-2xl border border-white/20 object-cover shadow-sm bg-[#16161c]"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center text-base font-bold text-white shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Montserrat']">
                  {currentUser.name}
                </h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-md">
                  Membru Activ
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Profil & Creator Hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/[0.06] bg-[#0c0c0e]/50">
          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'scripts'
                ? 'text-white border-white bg-white/[0.04]'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
            <span>Scripturile Mele ({userScripts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'profile'
                ? 'text-white border-white bg-white/[0.04]'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Editează Profilul</span>
          </button>
        </div>

        {activeTab === 'scripts' ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 p-6 pb-3">
              <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Scripturi Publicate</div>
                  <div className="text-lg font-bold text-white font-mono">{userScripts.length}</div>
                </div>
              </div>

              <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Total Descărcări</div>
                  <div className="text-lg font-bold text-white font-mono">{totalUserDownloads}</div>
                </div>
              </div>
            </div>

            {/* Scripts List */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 min-h-[220px]">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Resursele Tale
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddScript();
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-zinc-300 transition-colors cursor-pointer bg-white/[0.06] hover:bg-white/[0.1] px-3 py-1.5 rounded-xl border border-white/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publică Script Nou</span>
                </button>
              </div>

              {userScripts.length === 0 ? (
                <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl p-10 text-center space-y-3">
                  <FolderKanban className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">
                    Nu ai publicat încă niciun script vRP pe hub.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddScript();
                    }}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                  >
                    <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                    <span>Publică Primul Tău Script</span>
                  </button>
                </div>
              ) : (
                userScripts.map((script) => (
                  <div
                    key={script.id}
                    className="bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      {script.imageUrl ? (
                        <img
                          src={script.imageUrl}
                          alt={script.title}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 bg-[#16161c]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 shrink-0 font-mono text-xs">
                          vRP
                        </div>
                      )}
                      <div>
                        <h5 className="text-sm font-bold text-white font-['Montserrat'] tracking-tight">
                          {script.title}
                        </h5>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
                          <span className="bg-white/[0.06] px-2 py-0.5 rounded text-zinc-300 uppercase">
                            {script.category}
                          </span>
                          <span>•</span>
                          <span>{script.downloads || 0} descărcări</span>
                          <span>•</span>
                          <span>{script.version || 'v1.0.0'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          onClose();
                          onEditScript(script);
                        }}
                        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
                        title="Editează Scriptul"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editează</span>
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenDetails(script);
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                        title="Vezi Detalii"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Detalii</span>
                      </button>

                      {confirmDeleteId === script.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                          <button
                            onClick={() => handleDelete(script.id)}
                            disabled={deletingId === script.id}
                            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {deletingId === script.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Confirmă'
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-zinc-400 hover:text-white text-[11px] px-2 py-1.5 cursor-pointer"
                          >
                            Anulează
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(script.id)}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                          title="Șterge Scriptul"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Profile Edit Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-[280px]">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 bg-[#0c0c0e] border border-white/[0.08] p-4 rounded-2xl">
                {editAvatarUrl ? (
                  <img
                    src={editAvatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-white/15 bg-[#16161c] shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {editName ? editName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">
                    {editName || 'Nume Utilizator'}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Așa va apărea numele și avatarul tău pe scripturile publicate.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nume Afișat / Nickname
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Marius"
                  className="w-full bg-[#0c0c0e] border border-white/15 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Link Poză de Profil (Avatar URL)
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="Ex: https://i.imgur.com/... sau link de Discord avatar"
                  className="w-full bg-[#0c0c0e] border border-white/15 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-medium"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Dacă lași gol, se va genera automat un avatar unic bazat pe numele tău.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-zinc-200 text-black font-['Montserrat'] text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                >
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>{saveSuccess ? 'Profil Salvat!' : 'Salvează Modificările'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer with Logout */}
        <div className="p-4 bg-[#0c0c0e]/80 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Deconectare cont Discord
          </button>
          <button
            onClick={onClose}
            className="bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
};

