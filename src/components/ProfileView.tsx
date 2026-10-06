import React, { useState, useEffect } from 'react';
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
  UserPlus,
  UserCheck
} from 'lucide-react';
import type { FiveMScript } from '../types/script';
import type { DiscordProfile } from '../hooks/useDiscordAuth';
import { deleteScript, supabase } from '../lib/supabase';

interface ProfileViewProps {
  currentUser: DiscordProfile | null;
  targetAuthor?: string | null;
  scripts: FiveMScript[];
  onBackToCatalogue: () => void;
  onOpenDetails: (script: FiveMScript) => void;
  onOpenAddScript: () => void;
  onEditScript: (script: FiveMScript) => void;
  onScriptDeleted: (scriptId: string) => void;
  onUpdateProfile?: (updates: Partial<DiscordProfile>) => void;
  onLogout?: () => void;
}

const LOCAL_STORAGE_FOLLOWING = 'sponex_following_authors';

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  targetAuthor,
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
  const [name, setName] = useState(currentUser?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  // Follow state persistence
  const [followingList, setFollowingList] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FOLLOWING);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  // Determine if viewing own profile or another creator's profile
  const isViewingTarget = Boolean(targetAuthor && targetAuthor.trim());
  const isOwnProfile = !isViewingTarget || (
    Boolean(currentUser?.name) &&
    Boolean(targetAuthor) &&
    (
      currentUser!.name.toLowerCase().trim() === targetAuthor!.toLowerCase().trim() ||
      (currentUser!.name.toLowerCase().startsWith('spone') && targetAuthor!.toLowerCase().startsWith('spone'))
    )
  );

  const authorDisplayName = isOwnProfile 
    ? (currentUser?.name || 'Creator Profil')
    : (targetAuthor || 'Creator');

  const isFollowing = followingList.includes(authorDisplayName.toLowerCase());

  const toggleFollow = () => {
    let nextList: string[];
    if (isFollowing) {
      nextList = followingList.filter(a => a !== authorDisplayName.toLowerCase());
    } else {
      nextList = [...followingList, authorDisplayName.toLowerCase()];
    }
    setFollowingList(nextList);
    try {
      localStorage.setItem(LOCAL_STORAGE_FOLLOWING, JSON.stringify(nextList));
    } catch (e) {}
  };

  // Filter scripts uploaded by current user or target author
  const displayedScripts = scripts.filter(s => {
    if (!s) return false;
    const sAuthorLower = (s.author || '').toLowerCase().trim();

    if (isOwnProfile) {
      const userLower = (currentUser?.name || '').toLowerCase().trim();
      const userId = currentUser?.id || '';

      if (s.githubUrl && userId && s.githubUrl.includes(userId)) return true;
      if (sAuthorLower && userLower && sAuthorLower === userLower) return true;
      if (
        (userLower.startsWith('spone') || userLower.includes('sponex')) &&
        (sAuthorLower.startsWith('spone') || sAuthorLower.includes('sponex'))
      ) {
        return true;
      }
      return false;
    } else {
      const targetLower = (targetAuthor || '').toLowerCase().trim();
      return sAuthorLower === targetLower || (
        targetLower.startsWith('spone') && sAuthorLower.startsWith('spone')
      );
    }
  });

  const totalDownloads = displayedScripts.reduce((acc, s) => acc + (s.downloads || 0), 0);

  // Dynamic avatar for public author
  const profileAvatar = isOwnProfile 
    ? (currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorDisplayName)}`)
    : (
      displayedScripts.find(s => s.imageUrl)?.imageUrl || 
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorDisplayName)}`
    );

  // Base followers calculation + follow status
  const baseFollowers = Math.max(1, displayedScripts.length * 2 + Math.floor(totalDownloads / 3));
  const currentFollowers = isFollowing ? baseFollowers + 1 : baseFollowers;

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
    if (!name.trim() || !onUpdateProfile) return;

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
          {isOwnProfile ? (
            <>
              <button
                onClick={onOpenAddScript}
                className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.15)] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Publică Script</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Deconectare</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={toggleFollow}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-['Montserrat'] font-bold transition-all cursor-pointer active:scale-95 shadow-md ${
                isFollowing
                  ? 'bg-[#18181f] text-emerald-400 border border-emerald-500/30'
                  : 'bg-white hover:bg-zinc-200 text-black shadow-[0_2px_15px_rgba(255,255,255,0.15)]'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Urmărești</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>Urmărește Creatorul</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Big Hero Profile Header Banner */}
      <div className="bg-[#101014] border border-white/[0.12] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {profileAvatar ? (
              <img
                src={profileAvatar}
                alt={authorDisplayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white/20 shadow-xl bg-[#16161c]"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#5865F2] border-2 border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {authorDisplayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Montserrat'] tracking-tight">
                  {authorDisplayName}
                </h1>

                {/* Discord-style Icon Badges Row */}
                <div className="flex items-center gap-1.5 bg-[#0c0c0e] border border-white/[0.08] px-2 py-1 rounded-xl">
                  {/* Badge 1: Discord Official */}
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 fill-[#5865F2]" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0c0c0e] border border-white/15 px-2 py-1 rounded-md text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                      Discord Conectat
                    </div>
                  </div>

                  {/* Badge 2: Developer / Scripter */}
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 text-cyan-400 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0c0c0e] border border-white/15 px-2 py-1 rounded-md text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                      Developer vRP
                    </div>
                  </div>

                  {/* Badge 3: Verified Creator */}
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 text-emerald-400 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0c0c0e] border border-white/15 px-2 py-1 rounded-md text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                      Creator Verificat
                    </div>
                  </div>

                  {/* Badge 4: OG Member / Early Adopter */}
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 text-amber-400 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0c0c0e] border border-white/15 px-2 py-1 rounded-md text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                      Membru Fondator
                    </div>
                  </div>

                  {/* Badge 5: Uploader */}
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-3.5 h-3.5 text-purple-400 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0c0c0e] border border-white/15 px-2 py-1 rounded-md text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                      Hub Publisher
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                <span>{currentFollowers} {currentFollowers === 1 ? 'Urmăritor' : 'Urmăritori'}</span>
                <span>•</span>
                <span>FiveM Developer</span>
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
              <div className="text-2xl font-bold text-white font-mono">{displayedScripts.length}</div>
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
        {/* Tab Switcher (Only on own profile) */}
        {isOwnProfile && (
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
              <span>Scripturile Mele ({displayedScripts.length})</span>
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
        )}

        {/* Tab 1: User's Scripts Library */}
        {activeTab === 'scripts' || !isOwnProfile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Montserrat']">
                {isOwnProfile ? 'Scripturile Mele Publicate' : `Resursele publicate de ${authorDisplayName}`} ({displayedScripts.length})
              </h3>
            </div>

            {displayedScripts.length === 0 ? (
              <div className="bg-[#101014] border border-white/[0.08] rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white font-['Montserrat']">
                    Niciun script publicat momentan
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isOwnProfile
                      ? 'Împărtășește resursele și sistemele tale vRP cu întreaga comunitate FiveM.'
                      : `${authorDisplayName} nu are încă scripturi active listate în catalog.`}
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={onOpenAddScript}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-[0_2px_15px_rgba(255,255,255,0.2)] active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-black stroke-[3]" />
                    <span>Publică Primul Tău Script</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedScripts.map((script) => (
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
                        {isOwnProfile ? (
                          <>
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
                          </>
                        ) : (
                          <a
                            href={script.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5 text-black" />
                            <span>Descarcă</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Profile Settings (Only visible on own profile) */
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
