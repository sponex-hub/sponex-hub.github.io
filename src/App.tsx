import React, { useState, useEffect } from 'react';
import { CatalogueView } from './components/CatalogueView';
import { Footer } from './components/Footer';
import { ScriptModal } from './components/ScriptModal';
import { AddScriptModal } from './components/AddScriptModal';
import { EditScriptModal } from './components/EditScriptModal';
import { DiscordLoginModal } from './components/DiscordLoginModal';
import { ProfileView } from './components/ProfileView';
import { DmcaModal } from './components/DmcaModal';
import { Toast } from './components/Toast';
import { supabase, getScripts } from './lib/supabase';


import type { FiveMScript } from './types/script';

import { MiniChat } from './components/MiniChat';
import { useDiscordAuth } from './hooks/useDiscordAuth';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'catalogue' | 'profile'>('catalogue');
  const [viewingAuthor, setViewingAuthor] = useState<string | null>(null);
  const [scripts, setScripts] = useState<FiveMScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScript, setSelectedScript] = useState<FiveMScript | null>(null);
  const [editingScript, setEditingScript] = useState<FiveMScript | null>(null);
  const [isDmcaOpen, setIsDmcaOpen] = useState<boolean>(false);
  const [isAddScriptOpen, setIsAddScriptOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDiscordLoginOpen, setIsDiscordLoginOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: ''
  });


  const { user: currentUser, oauthError, loginWithOAuth, loginDirectly, updateProfile, logout: logoutDiscord } = useDiscordAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getScripts();
      setScripts(data);
    } catch (err) {
      console.error('Error loading scripts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!supabase) return;

    // Realtime listener for live script uploads across the globe
    const channel = supabase.channel('sponex_community_scripts_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scripts' },
        async (payload) => {
          // If a new script is inserted directly in the DB
          if (payload.new && (payload.new as any).download_url?.endsWith('.zip')) {
            const row = payload.new as any;
            const newScript: FiveMScript = {
              id: row.id,
              title: row.title,
              category: row.category || 'systems',
              frameworks: Array.isArray(row.frameworks) ? row.frameworks : ['vRP'],
              version: row.version || 'v1.0.0',
              resmon: row.resmon || '0.00ms',
              author: row.author || 'Sponex Community',
              license: row.license || 'MIT',
              description: row.description || '',
              imageUrl: row.image_url || '',
              features: Array.isArray(row.features) ? row.features : [],
              dependencies: Array.isArray(row.dependencies) ? row.dependencies : ['vrp'],
              cfgCommand: row.cfg_command || `ensure ${row.id}`,
              downloadUrl: row.download_url || '#',
              githubUrl: row.github_url || '',
              downloads: Number(row.downloads || 0)
            };

            setScripts(prev => {
              if (prev.some(s => s.id === newScript.id)) return prev;
              return [newScript, ...prev];
            });
          }
        }
      )
      .on('broadcast', { event: 'new_script_uploaded' }, ({ payload }) => {
        if (payload && payload.id) {
          setScripts(prev => {
            if (prev.some(s => s.id === payload.id)) return prev;
            return [payload, ...prev];
          });
        }
      })
      .on('broadcast', { event: 'script_updated' }, ({ payload }) => {
        if (payload && payload.id) {
          setScripts(prev => prev.map(s => s.id === payload.id ? payload : s));
        }
      })
      .on('broadcast', { event: 'script_deleted' }, ({ payload }) => {
        if (payload && payload.id) {
          setScripts(prev => prev.filter(s => s.id !== payload.id));
        }
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleDownloadIncrement = (scriptId: string) => {
    setScripts(prev =>
      prev.map(s => (s.id === scriptId ? { ...s, downloads: (s.downloads || 0) + 1 } : s))
    );
  };

  const handleSecurityAlert = (msg: string) => {
    setToast({
      visible: true,
      title: 'Shield Anti-Flood',
      message: msg
    });
  };

  const handleScriptAdded = (newScript: FiveMScript) => {
    setScripts(prev => [newScript, ...prev.filter(s => s.id !== newScript.id)]);
    setToast({
      visible: true,
      title: 'Script Publicat',
      message: `Resursa "${newScript.title}" a fost adăugată în catalog.`
    });
  };

  const handleScriptUpdated = (updatedScript: FiveMScript) => {
    setScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
    setToast({
      visible: true,
      title: 'Script Actualizat',
      message: `Resursa "${updatedScript.title}" a fost actualizată.`
    });
  };

  const handleScriptDeleted = (deletedId: string) => {
    setScripts(prev => prev.filter(s => s.id !== deletedId));
    setToast({
      visible: true,
      title: 'Script Șters',
      message: 'Resursa a fost ștearsă cu succes din Hub și baza de date.'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5] selection:bg-white selection:text-black">
      {/* Main Content Showcase */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-28 text-xs text-zinc-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping mr-3" />
            Se încarcă resursele...
          </div>
        ) : currentView === 'profile' ? (
          <ProfileView
            currentUser={currentUser}
            targetAuthor={viewingAuthor}
            scripts={scripts}
            onBackToCatalogue={() => {
              setViewingAuthor(null);
              setCurrentView('catalogue');
            }}
            onOpenDetails={(script) => setSelectedScript(script)}
            onOpenAddScript={() => setIsAddScriptOpen(true)}
            onEditScript={(script) => {
              setEditingScript(script);
              setIsEditModalOpen(true);
            }}
            onScriptDeleted={handleScriptDeleted}
            onUpdateProfile={(updates) => {
              updateProfile(updates);
              setToast({
                visible: true,
                title: 'Profil Actualizat',
                message: 'Datele profilului tău au fost actualizate.'
              });
            }}
            onLogout={() => {
              logoutDiscord();
              setViewingAuthor(null);
              setCurrentView('catalogue');
            }}
          />
        ) : (
          <CatalogueView
            scripts={scripts}
            onOpenDetails={(script) => setSelectedScript(script)}
            onOpenAuthorProfile={(author) => {
              setViewingAuthor(author);
              setCurrentView('profile');
            }}
            onDownloadIncrement={handleDownloadIncrement}
            onSecurityAlert={handleSecurityAlert}
            onOpenAddScript={() => setIsAddScriptOpen(true)}
            currentUser={currentUser}
            onLoginDiscord={() => setIsDiscordLoginOpen(true)}
            onLogoutDiscord={logoutDiscord}
            onOpenLibrary={() => {
              setViewingAuthor(null);
              setCurrentView('profile');
            }}
          />
        )}
      </main>

      {/* Footer with DMCA Trigger */}
      <Footer onOpenDmca={() => setIsDmcaOpen(true)} />

      {/* Script Details Modal */}
      <ScriptModal
        script={selectedScript}
        onClose={() => setSelectedScript(null)}
        onOpenAuthorProfile={(author) => {
          setViewingAuthor(author);
          setCurrentView('profile');
        }}
      />

      {/* Add Script Modal (Protected with Discord) */}
      <AddScriptModal
        isOpen={isAddScriptOpen}
        onClose={() => setIsAddScriptOpen(false)}
        onScriptAdded={handleScriptAdded}
        currentUser={currentUser}
        onRequireLogin={() => setIsDiscordLoginOpen(true)}
      />

      {/* Edit Script Modal */}
      <EditScriptModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingScript(null);
        }}
        script={editingScript}
        onScriptUpdated={handleScriptUpdated}
      />

      {/* Discord Login / Connect Modal */}
      <DiscordLoginModal
        isOpen={isDiscordLoginOpen}
        onClose={() => setIsDiscordLoginOpen(false)}
        onOAuthLogin={loginWithOAuth}
        onDirectLogin={(username, avatarUrl) => loginDirectly(username, avatarUrl)}
        oauthError={oauthError}
      />



      {/* DMCA & Legal Disclaimer Modal */}
      <DmcaModal
        isOpen={isDmcaOpen}
        onClose={() => setIsDmcaOpen(false)}
      />

      {/* Live Mini-Chat Widget */}
      <MiniChat />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default App;
