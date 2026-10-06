import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileArchive, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  Tag, 
  AlertCircle,
  HardDrive,
  Gauge
} from 'lucide-react';
import { updateScript, uploadToStorage, supabase } from '../lib/supabase';
import type { FiveMScript } from '../types/script';

interface EditScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: FiveMScript | null;
  onScriptUpdated: (updated: FiveMScript) => void;
}

export const EditScriptModal: React.FC<EditScriptModalProps> = ({
  isOpen,
  onClose,
  script,
  onScriptUpdated
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('systems');
  const [customCategory, setCustomCategory] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [resmon, setResmon] = useState('0.00ms');
  const [description, setDescription] = useState('');
  const [cfgCommand, setCfgCommand] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // New Files (Optional replacement)
  const [newZipFile, setNewZipFile] = useState<File | null>(null);
  const [newImgFile, setNewImgFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (script) {
      setTitle(script.title || '');
      setAuthor(script.author || '');
      setVersion(script.version || 'v1.0.0');
      setResmon(script.resmon || '0.00ms');
      setDescription(script.description || '');
      setCfgCommand(script.cfgCommand || `ensure ${script.id}`);
      setImageUrl(script.imageUrl || '');
      
      const standardCategories = ['systems', 'banking', 'garages', 'jobs', 'admin', 'ui'];
      if (standardCategories.includes(script.category?.toLowerCase())) {
        setCategory(script.category.toLowerCase());
        setCustomCategory('');
      } else {
        setCategory('custom');
        setCustomCategory(script.category || '');
      }
      
      setNewZipFile(null);
      setNewImgFile(null);
      setErrorMsg('');
      setSuccess(false);
    }
  }, [script, isOpen]);

  if (!isOpen || !script) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Te rugăm să introduci numele resursei.');
      return;
    }

    setSaving(true);

    try {
      let finalDownloadUrl = script.downloadUrl;
      let finalImageUrl = imageUrl.trim();

      // 1. If user provided a new .zip archive, upload it
      if (newZipFile) {
        const zipRes = await uploadToStorage('scripts', newZipFile);
        if (zipRes.error || !zipRes.url) {
          setErrorMsg(`Eroare încărcare arhivă nouă: ${zipRes.error || 'Necunoscută'}`);
          setSaving(false);
          return;
        }
        finalDownloadUrl = zipRes.url;
      }

      // 2. If user provided a new image file, upload it
      if (newImgFile) {
        const imgRes = await uploadToStorage('images', newImgFile);
        if (imgRes.url) {
          finalImageUrl = imgRes.url;
        }
      }

      const finalCat = category === 'custom' && customCategory.trim()
        ? customCategory.trim().toLowerCase()
        : category;

      const updatedData: Partial<FiveMScript> = {
        title: title.trim(),
        author: author.trim() || script.author,
        category: finalCat,
        version: version.trim() || 'v1.0.0',
        resmon: resmon.trim() || '0.00ms',
        description: description.trim(),
        cfgCommand: cfgCommand.trim() || `ensure ${script.id}`,
        imageUrl: finalImageUrl,
        downloadUrl: finalDownloadUrl
      };

      const result = await updateScript(script.id, updatedData);
      if (!result.success) {
        setErrorMsg(`Eroare actualizare: ${result.error}`);
        setSaving(false);
        return;
      }

      const fullUpdatedScript: FiveMScript = {
        ...script,
        ...updatedData
      };

      // Broadcast update event to all active visitors
      if (supabase) {
        try {
          const feedChannel = supabase.channel('sponex_community_scripts_feed');
          feedChannel.send({
            type: 'broadcast',
            event: 'script_updated',
            payload: fullUpdatedScript
          });
        } catch (e) {
          console.warn('Realtime update broadcast notice:', e);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onScriptUpdated(fullUpdatedScript);
        onClose();
        setSuccess(false);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare neașteptată.');
    } finally {
      setSaving(false);
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

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Editare Resursă vRP
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Montserrat'] tracking-tight">
            Editează: {script.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Actualizează versiunea, descrierea, imaginile sau înlocuiește arhiva .zip.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-white font-['Montserrat']">Script Actualizat cu Succes!</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Modificările au fost salvate și actualizate în timp real în catalog.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Nume Resursă *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Autor / Creat de *
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-medium"
                />
              </div>
            </div>

            {/* Version & Resmon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-zinc-400" />
                  <span>Versiune Nouă (Ex: v1.1.0)</span>
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.1.0"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-zinc-400" />
                  <span>Optimizare Resmon</span>
                </label>
                <input
                  type="text"
                  value={resmon}
                  onChange={(e) => setResmon(e.target.value)}
                  placeholder="0.00ms"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-zinc-400" />
                  <span>Categorie</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-medium"
                >
                  <option value="systems">Sisteme / Heists</option>
                  <option value="banking">Banking & Economie</option>
                  <option value="garages">Garaje & Vehicule</option>
                  <option value="jobs">Joburi & Companii</option>
                  <option value="admin">Administrare & Logs</option>
                  <option value="ui">Interfețe & NUI</option>
                  <option value="custom">Categorie Personalizată...</option>
                </select>
              </div>

              {category === 'custom' && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                    Scrie Categoria Ta
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ex: tuning, dealership, inventory"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors font-medium"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                Descriere & Instrucțiuni de Utilizare
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalii despre ce face scriptul..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* server.cfg command */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                Comandă server.cfg
              </label>
              <input
                type="text"
                value={cfgCommand}
                onChange={(e) => setCfgCommand(e.target.value)}
                placeholder="ensure numescript"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Replace / Update Files Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Optional New Zip */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Înlocuiește Arhiva .ZIP (Opțional)
                </label>
                <input
                  type="file"
                  ref={zipInputRef}
                  accept=".zip,.rar,.7z"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewZipFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="w-full bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl p-3 text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileArchive className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-[11px] text-zinc-300 truncate">
                      {newZipFile ? newZipFile.name : 'Păstrează arhiva existentă'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono underline shrink-0">Schimbă</span>
                </button>
              </div>

              {/* Optional New Image */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1.5 uppercase font-mono tracking-wider">
                  Poză Previzualizare / Banner
                </label>
                <input
                  type="file"
                  ref={imgInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewImgFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className="w-full bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl p-3 text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-[11px] text-zinc-300 truncate">
                      {newImgFile ? newImgFile.name : (imageUrl ? 'Poză actuală setată' : 'Fără poză')}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono underline shrink-0">Încarcă</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-white/[0.08] flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 font-semibold py-3 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Anulează
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-2/3 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-['Montserrat'] text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_2px_16px_rgba(255,255,255,0.15)] active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Se salvează modificările...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>Salvează Modificările</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
