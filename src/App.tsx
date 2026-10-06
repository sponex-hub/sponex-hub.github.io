import React, { useState, useEffect } from 'react';
import { CatalogueView } from './components/CatalogueView';
import { Footer } from './components/Footer';
import { ScriptModal } from './components/ScriptModal';
import { DmcaModal } from './components/DmcaModal';
import { Toast } from './components/Toast';
import { getScripts } from './lib/supabase';
import type { FiveMScript } from './types/script';

import { MiniChat } from './components/MiniChat';

export const App: React.FC = () => {
  const [scripts, setScripts] = useState<FiveMScript[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScript, setSelectedScript] = useState<FiveMScript | null>(null);
  const [isDmcaOpen, setIsDmcaOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: ''
  });

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

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f4f4f5] selection:bg-white selection:text-black">
      {/* Main Content Showcase */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-28 text-xs text-zinc-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping mr-3" />
            Se încarcă resursele...
          </div>
        ) : (
          <CatalogueView
            scripts={scripts}
            onOpenDetails={(script) => setSelectedScript(script)}
            onDownloadIncrement={handleDownloadIncrement}
            onSecurityAlert={handleSecurityAlert}
          />
        )}
      </main>

      {/* Footer with DMCA Trigger */}
      <Footer onOpenDmca={() => setIsDmcaOpen(true)} />

      {/* Script Details Modal */}
      <ScriptModal
        script={selectedScript}
        onClose={() => setSelectedScript(null)}
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
