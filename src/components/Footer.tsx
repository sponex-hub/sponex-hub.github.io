import React from 'react';
import { Scale, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenDmca: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDmca }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#09090b] py-8 text-xs text-zinc-500 mt-12">
      <div className="max-w-[1240px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Rights */}
        <div className="flex items-center gap-2.5 text-center md:text-left">
          <span className="font-['Montserrat'] font-bold text-zinc-300">SPONEX</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-500">FiveM vRP Repository</span>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
            © {new Date().getFullYear()} Toate drepturile rezervate.
          </span>
        </div>

        {/* DMCA & Disclaimer Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDmca}
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Scale className="w-3 h-3 text-zinc-400" />
            <span>DMCA & Legal Disclaimer</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.04]">
            <ShieldCheck className="w-3 h-3 text-zinc-400" />
            <span>CFX.re / Tebex Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
