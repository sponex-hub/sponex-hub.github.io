import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileArchive, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  Terminal, 
  FolderPlus, 
  Tag, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { createScript, uploadToStorage, supabase } from '../lib/supabase';
import type { FiveMScript } from '../types/script';
import type { DiscordProfile } from '../hooks/useDiscordAuth';

interface AddScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScriptAdded: (newScript: FiveMScript) => void;
  currentUser: DiscordProfile | null;
  onRequireLogin: () => void;
}

export const AddScriptModal: React.FC<AddScriptModalProps> = ({
  isOpen,
  onClose,
  onScriptAdded,
  currentUser,
  onRequireLogin
}) => {
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.name || '');
  const [category, setCategory] = useState('systems');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [howItWorks, setHowItWorks] = useState('');
  const [cfgCommand, setCfgCommand] = useState('');

  // Files & Drag State
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const [isDraggingImg, setIsDraggingImg] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // If user is not logged in with Discord, show login requirement screen
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-md w-full p-7 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center mx-auto mb-4 text-[#5865F2]">
            <FolderPlus className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight mb-2">
            Autentificare Necesară
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Pentru a menține calitatea și securitatea resurselor din hub, este necesar să te conectezi cu contul tău de Discord înainte de a publica un script.
          </p>

          <button
            onClick={onRequireLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-['Montserrat'] text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(88,101,242,0.35)] transition-all cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Conectează-te cu Discord</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Te rugăm să introduci numele resursei.');
      return;
    }

    if (!zipFile) {
      setErrorMsg('Te rugăm să atașezi fișierul arhivă .zip al scriptului.');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload .zip file to Supabase Storage
      const zipRes = await uploadToStorage('scripts', zipFile);
      if (zipRes.error || !zipRes.url) {
        setErrorMsg(`Eroare la încărcarea fișierului .zip: ${zipRes.error || 'Necunoscută'}`);
        setUploading(false);
        return;
      }

      // 2. Upload screenshot to Supabase Storage (if provided)
      let finalImageUrl = '';
      if (imgFile) {
        const imgRes = await uploadToStorage('images', imgFile);
        if (imgRes.url) {
          finalImageUrl = imgRes.url;
        }
      }

      const scriptSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const finalCategory = customCategory.trim() ? customCategory.trim().toLowerCase() : category;
      const finalCfg = cfgCommand.trim() || `ensure ${scriptSlug}`;

      const fullDescription = howItWorks.trim() 
        ? `${description.trim()}\n\nInstrucțiuni: ${howItWorks.trim()}`
        : description.trim();

      const newScript: FiveMScript = {
        id: scriptSlug,
        title: title.trim(),
        category: finalCategory,
        frameworks: ['vRP'],
        version: 'v1.0.0',
        resmon: '0.00ms',
        author: authorName.trim() || currentUser.name || 'Sponex Community',
        license: 'MIT',
        description: fullDescription,
        imageUrl: finalImageUrl,
        features: [],
        dependencies: ['vrp'],
        cfgCommand: finalCfg,
        downloadUrl: zipRes.url,
        githubUrl: `author:${currentUser.id}`
      };

      const result = await createScript(newScript);
      if (!result.success) {
        setErrorMsg(`Eroare salvare bază de date: ${result.error}`);
        setUploading(false);
        return;
      }

      // Broadcast realtime event to all online visitors
      if (supabase) {
        try {
          const feedChannel = supabase.channel('sponex_community_scripts_feed');
          feedChannel.send({
            type: 'broadcast',
            event: 'new_script_uploaded',
            payload: newScript
          });
        } catch (e) {
          console.warn('Realtime broadcast notice:', e);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onScriptAdded(newScript);
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare neașteptată la publicare.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#101014] border border-white/15 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Publică o Resursă FiveM
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight">
            Adaugă Script vRP
          </h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
            <span>Cont Discord:</span>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white font-semibold">
              {currentUser.avatarUrl && (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-4 h-4 rounded-full" />
              )}
              <span>{currentUser.name}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mb-3">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-white font-['Montserrat']">Script Publicat cu Succes!</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Resursa ta a fost încărcată în Supabase și este acum disponibilă în catalog.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* 1. Nume Resursă & Autor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Nume Resursă *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!cfgCommand) {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      setCfgCommand(`ensure ${slug}`);
                    }
                  }}
                  placeholder="Ex: Dunko Advanced Dealership"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Autor / Creat de *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={currentUser.name || 'Nume autor'}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>
            </div>

            {/* 2. Categorie (Select sau Custom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-zinc-400" />
                  <span>Categorie Principală</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-medium"
                >
                  <option value="systems">Sisteme / Heists</option>
                  <option value="banking">Banking & Economie</option>
                  <option value="garages">Garaje & Vehicule</option>
                  <option value="jobs">Joburi & Activități</option>
                  <option value="nui">Meniuri NUI & HUD</option>
                  <option value="utilities">Admin & Utilitare</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Sau Categorie Personalizată
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ex: telefon, droguri, casino"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>
            </div>

            {/* 3. Drag & Drop Fișier Script (.zip) */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                <FileArchive className="w-3 h-3 text-zinc-400" />
                <span>Arhivă Script (.zip) *</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingZip(true);
                }}
                onDragLeave={() => setIsDraggingZip(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingZip(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const f = e.dataTransfer.files[0];
                    if (f.name.endsWith('.zip') || f.name.endsWith('.rar') || f.name.endsWith('.7z')) {
                      setZipFile(f);
                    } else {
                      setErrorMsg('Te rugăm să încarci doar arhive .zip sau .rar.');
                    }
                  }
                }}
                onClick={() => zipInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDraggingZip || zipFile
                    ? 'border-white/40 bg-white/[0.04]'
                    : 'border-white/15 bg-black/40 hover:border-white/30'
                }`}
              >
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,.rar,.7z"
                  onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                {zipFile ? (
                  <div className="flex items-center justify-center gap-2 text-white font-medium">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{zipFile.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className="w-5 h-5 text-zinc-400" />
                    <span className="text-zinc-300 font-medium">
                      Trage fișierul <strong className="text-white">.zip</strong> aici sau click pentru a alege
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Maxim 50MB • Direct în Supabase Storage
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Drag & Drop Poză / Screenshot Preview */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-zinc-400" />
                <span>Poză / Screenshot Previzualizare (Opțional)</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImg(true);
                }}
                onDragLeave={() => setIsDraggingImg(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImg(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setImgFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => imgInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDraggingImg || imgFile
                    ? 'border-white/40 bg-white/[0.04]'
                    : 'border-white/15 bg-black/40 hover:border-white/30'
                }`}
              >
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImgFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                {imgFile ? (
                  <div className="flex items-center justify-center gap-2 text-white font-medium">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{imgFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="w-5 h-5 text-zinc-400" />
                    <span className="text-zinc-300 font-medium">
                      Trage o imagine (PNG / JPG / WebP) aici
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Format recomandat 16:9
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Descriere */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-zinc-400" />
                <span>Descriere Resursă *</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Sistem complet de dealership cu test drive, categorii de mașini și interfață modernă NUI..."
                rows={2}
                maxLength={300}
                required
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors resize-none font-medium leading-relaxed"
              />
            </div>

            {/* 6. Cum Funcționează & Comandă server.cfg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Cum Funcționează / Instrucțiuni
                </label>
                <input
                  type="text"
                  value={howItWorks}
                  onChange={(e) => setHowItWorks(e.target.value)}
                  placeholder="Ex: Deschide meniul cu tasta E la showroom"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-zinc-400" />
                  <span>Comandă server.cfg</span>
                </label>
                <input
                  type="text"
                  value={cfgCommand}
                  onChange={(e) => setCfgCommand(e.target.value)}
                  placeholder="Ex: ensure vrp_dealership"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-zinc-600 outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-['Montserrat'] text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_2px_14px_rgba(255,255,255,0.18)] transition-all cursor-pointer active:scale-95 mt-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Se încarcă în Supabase Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>Publică Scriptul pe Hub</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
