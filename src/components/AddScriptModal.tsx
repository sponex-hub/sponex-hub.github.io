import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, FileArchive, Loader2 } from 'lucide-react';
import { createScript, uploadToStorage } from '../lib/supabase';
import type { FiveMScript, VrpCategory } from '../types/script';

interface AddScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScriptAdded: (newScript: FiveMScript) => void;
}

export const AddScriptModal: React.FC<AddScriptModalProps> = ({
  isOpen,
  onClose,
  onScriptAdded
}) => {
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [category, setCategory] = useState<VrpCategory>('systems');
  const [vrpSubtype, setVrpSubtype] = useState<string>('vRP');
  
  const [downloadUrl, setDownloadUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [dependencies, setDependencies] = useState('vrp, oxmysql');

  // File Upload States
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Te rog introdu titlul scriptului.');
      return;
    }

    if (!zipFile && !downloadUrl.trim()) {
      setErrorMsg('Te rog atașează fișierul .zip al scriptului sau introdu un link de descărcare.');
      return;
    }

    setUploading(true);

    let finalDownloadUrl = downloadUrl.trim();
    let finalImageUrl = imageUrl.trim();

    // 1. Upload .zip to Supabase Storage if file chosen
    if (zipFile) {
      const zipRes = await uploadToStorage('scripts', zipFile);
      if (zipRes.error) {
        setErrorMsg(`Eroare la upload fișier script: ${zipRes.error}`);
        setUploading(false);
        return;
      }
      if (zipRes.url) {
        finalDownloadUrl = zipRes.url;
      }
    }

    // 2. Upload image screenshot to Supabase Storage if file chosen
    if (imgFile) {
      const imgRes = await uploadToStorage('images', imgFile);
      if (imgRes.error) {
        console.warn('Eroare upload imagine:', imgRes.error);
      } else if (imgRes.url) {
        finalImageUrl = imgRes.url;
      }
    }

    const scriptSlug = id.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newScript: FiveMScript = {
      id: scriptSlug,
      title: title.trim(),
      category: category,
      frameworks: [vrpSubtype],
      version: version.trim() || 'v1.0.0',
      resmon: '0.00ms',
      author: 'Sponex',
      license: 'MIT',
      description: description.trim(),
      imageUrl: finalImageUrl,
      features: [],
      dependencies: dependencies.split(',').map(d => d.trim()).filter(Boolean),
      cfgCommand: `ensure ${scriptSlug}`,
      downloadUrl: finalDownloadUrl,
      githubUrl: ''
    };

    // Save metadata to Supabase DB
    const result = await createScript(newScript);
    if (!result.success && result.error && !result.error.includes('nu este încă configurat')) {
      console.warn('Supabase DB warning:', result.error);
    }

    onScriptAdded(newScript);
    setUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border-[#ff387d]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(255,56,125,0.15)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ba7bd] hover:text-white bg-black/40 hover:bg-white/10 border border-white/10 w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <h2 className="font-['Montserrat'] text-lg font-bold text-white mb-1">
          Upload Script vRP
        </h2>
        <p className="text-xs text-[#8e98ac] mb-4">
          Încarcă fișierul scriptului și poza direct în Supabase.
        </p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded mb-3">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Titlu & Categorie */}
          <div>
            <label className="block text-[#8e98ac] mb-1 font-medium">Titlu Script vRP *</label>
            <input
              type="text"
              placeholder="ex: vRP Garaj Avansat"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!id) setId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              className="w-full bg-[#0a0d14] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[#ff387d]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#8e98ac] mb-1 font-medium">Versiune vRP</label>
              <select
                value={vrpSubtype}
                onChange={(e) => setVrpSubtype(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-[#ff387d]"
              >
                <option value="vRP">vRP Standard</option>
                <option value="vRPex">vRPex</option>
                <option value="Dunko">vRP Dunko</option>
                <option value="vRP 2.0">vRP 2.0</option>
              </select>
            </div>
            <div>
              <label className="block text-[#8e98ac] mb-1 font-medium">Categorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VrpCategory)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-[#ff387d]"
              >
                <option value="systems">Sisteme / Heists</option>
                <option value="jobs">Joburi</option>
                <option value="nui">Meniuri NUI / HUD</option>
                <option value="garages">Garaje & Vehicule</option>
                <option value="utilities">Admin & Utilitare</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#8e98ac] mb-1 font-medium">Versiune Script</label>
              <input
                type="text"
                placeholder="v1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[#ff387d]"
              />
            </div>
            <div>
              <label className="block text-[#8e98ac] mb-1 font-medium">Dependențe</label>
              <input
                type="text"
                placeholder="vrp, oxmysql"
                value={dependencies}
                onChange={(e) => setDependencies(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[#ff387d]"
              />
            </div>
          </div>

          {/* Upload Script File (.zip) */}
          <div className="border border-dashed border-white/15 bg-black/30 rounded-lg p-3">
            <label className="block text-white font-medium mb-1 flex items-center gap-1.5">
              <FileArchive className="w-3.5 h-3.5 text-[#ff387d]" />
              <span>Fișier Script (.zip) *</span>
            </label>
            <input
              type="file"
              accept=".zip,.rar,.7z"
              onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs text-[#8e98ac] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#ff387d]/20 file:text-[#ff80aa] hover:file:bg-[#ff387d]/30 cursor-pointer"
            />
            {zipFile && (
              <span className="block text-[11px] text-emerald-400 mt-1">
                ✓ Selectat: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
            <span className="block text-[10px] text-[#5e6b82] mt-1">sau introdu direct linkul de descărcare mai jos:</span>
            <input
              type="text"
              placeholder="https://..."
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded px-2.5 py-1 text-xs text-white mt-1 focus:outline-none focus:border-[#ff387d]"
            />
          </div>

          {/* Upload Image / Screenshot */}
          <div className="border border-dashed border-white/15 bg-black/30 rounded-lg p-3">
            <label className="block text-white font-medium mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Poză / Screenshot Script (Opțional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImgFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs text-[#8e98ac] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
            />
            {imgFile && (
              <span className="block text-[11px] text-emerald-400 mt-1">
                ✓ Poză selectată: {imgFile.name}
              </span>
            )}
            <input
              type="text"
              placeholder="sau introdu link poză: https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded px-2.5 py-1 text-xs text-white mt-1 focus:outline-none focus:border-[#ff387d]"
            />
          </div>

          {/* Descriere */}
          <div>
            <label className="block text-[#8e98ac] mb-1 font-medium">Descriere Scurtă</label>
            <textarea
              rows={2}
              placeholder="Detalii despre resursă, comenzi, cerințe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[#ff387d]"
            />
          </div>

          {/* Butoane Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-['Montserrat'] font-semibold py-2.5 rounded transition-colors cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-[#ff387d] hover:bg-[#e0246a] text-white font-['Montserrat'] font-bold py-2.5 rounded flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(255,56,125,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Se încarcă în Supabase...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Încarcă & Publică</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
