import React from 'react';
import { X, ShieldAlert, Scale, CheckCircle2, FileText, Lock } from 'lucide-react';

interface DmcaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmcaModal: React.FC<DmcaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="pro-card rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] border border-white/10 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-['Montserrat'] text-xl font-bold text-white tracking-tight">
              DMCA & Legal Compliance Notice
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">
              Conformitate Cfx.re (FiveM), Tebex Limited & Drepturi de Autor
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed">
          {/* Section 1: Original Code & Authorship */}
          <div className="bg-black/50 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>1. Drepturi de Autor & Creație Proprie</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Toate scripturile, logica de programare (Lua, JavaScript, HTML, CSS) și interfețele NUI distribuite pe această platformă sunt <strong>dezvoltate independent și deținute de către Sponex</strong>. Acestea reprezintă muncă originală destinată comunității vRP și nu conțin cod piratat, decompilat sau distribuit fără permisiunea autorilor originali.
            </p>
          </div>

          {/* Section 2: Cfx.re / FiveM / Rockstar Games Disclaimer */}
          <div className="bg-black/50 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>2. Declinarea Răspunderii (Cfx.re & Rockstar Games)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Această platformă este un proiect independent creat de fani și dezvoltatori pentru comunitate. <strong>Nu suntem afiliați, asociați, autorizați, aprobați sau sponsorizați</strong> în niciun fel de către <strong>Cfx.re (CitizenFX Collective)</strong>, <strong>Rockstar Games</strong> sau <strong>Take-Two Interactive Software, Inc.</strong> Mărcile comerciale FiveM™, Grand Theft Auto™ și logo-urile aferente aparțin exclusiv deținătorilor lor legali.
            </p>
          </div>

          {/* Section 3: Tebex Compliance */}
          <div className="bg-black/50 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
              <Lock className="w-4 h-4 text-white" />
              <span>3. Conformitate cu Politicile Tebex Limited</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Nu redistribuim, nu deblocăm (*escrow bypass*) și nu comercializăm produse protejate prin sistemul de licențiere <strong>Tebex Asset Escrow</strong> ale altor creatori. Toate fișierele de pe acest hub sunt scripturi proprii gratuite sau sub licențe Open-Source conforme cu regulamentele comunității FiveM.
            </p>
          </div>

          {/* Section 4: DMCA Safe Harbor & Takedown Notice */}
          <div className="bg-black/50 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
              <FileText className="w-4 h-4 text-white" />
              <span>4. Solicitări DMCA & Procedură de Înlăturare</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              În conformitate cu Digital Millennium Copyright Act (DMCA), respectăm drepturile de autor ale oricărui creator. Dacă deții drepturile asupra oricărui element și consideri că a fost utilizat fără acord, trimite o notificare și conținutul va fi investigat și retras imediat de pe platformă.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
          <span className="text-[10px] text-zinc-500 font-mono">
            Licență: MIT / GPL Community Distribution
          </span>
          <button
            onClick={onClose}
            className="bg-white hover:bg-zinc-200 text-black font-['Montserrat'] text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Am înțeles și sunt de acord
          </button>
        </div>
      </div>
    </div>
  );
};
