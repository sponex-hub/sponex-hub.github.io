import React, { useState } from 'react';
import { X, Check, Copy, Download, Terminal } from 'lucide-react';
import type { FiveMScript } from '../types/script';
import { useTranslation } from '../lib/i18n';

interface ScriptModalProps {
  script: FiveMScript | null;
  onClose: () => void;
  onOpenAuthorProfile?: (author: string) => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  script,
  onClose,
  onOpenAuthorProfile
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!script) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(script.cfgCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="pro-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] border border-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {script.frameworks.map((fw) => (
              <span
                key={fw}
                className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider border border-white/15"
              >
                {fw}
              </span>
            ))}
            <span className="text-zinc-500 font-mono text-xs">/</span>
            <span className="text-zinc-400 font-mono text-xs">{script.version}</span>
            <span className="text-zinc-500 font-mono text-xs">•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenAuthorProfile && script.author) {
                  onClose();
                  onOpenAuthorProfile(script.author);
                }
              }}
              className="text-xs text-zinc-300 font-mono hover:text-white cursor-pointer transition-colors"
            >
              {t('createdBy')} <span className="text-white font-bold underline decoration-white/30 underline-offset-2">{script.author || 'Sponex'}</span>
            </button>
          </div>

          <h2 className="font-['Montserrat'] text-xl sm:text-2xl font-bold text-white tracking-tight">
            {script.title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-2">
            {script.description || 'vRP script.'}
          </p>
        </div>

        {/* Preview Image in Modal */}
        {script.imageUrl && (
          <div className="w-full rounded-xl overflow-hidden mb-6 border border-white/[0.08] bg-black/40">
            <img
              src={script.imageUrl}
              alt={script.title}
              className="w-full max-h-80 object-contain mx-auto"
            />
          </div>
        )}

        {/* Metadata Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 border border-white/[0.06] rounded-xl p-4 mb-6">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 font-medium block">{t('version')}</span>
            <strong className="text-xs text-zinc-200 font-mono font-medium">{script.version}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase text-zinc-500 font-medium block">{t('resmon')}</span>
            <strong className="text-xs text-zinc-200 font-mono font-medium">{script.resmon}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase text-zinc-500 font-medium block">{t('license')}</span>
            <strong className="text-xs text-zinc-200 font-medium">{script.license}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase text-zinc-500 font-medium block">{t('author')}</span>
            <strong className="text-xs text-zinc-200 font-medium">{script.author}</strong>
          </div>
        </div>

        {/* Configuration command */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-['Montserrat']">
              {t('addToServerCfg')}
            </label>
          </div>
          <div className="flex items-center justify-between bg-black/80 border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-xs text-zinc-200">
            <code className="select-all">{script.cfgCommand}</code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ml-3 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? t('copied') : t('copy')}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
          <a
            href={script.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="w-full bg-white hover:bg-zinc-100 text-black font-['Montserrat'] text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_2px_16px_rgba(255,255,255,0.15)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-black" />
            <span>{t('downloadZip')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
