import React, { useState, useRef } from 'react';
import { Download, Info, Check, Copy, Gauge, ShieldCheck, Terminal, HardDrive } from 'lucide-react';
import type { FiveMScript } from '../types/script';
import { incrementDownloadCount } from '../lib/supabase';

import { securityShield } from '../lib/security';

interface ScriptCardProps {
  script: FiveMScript;
  onOpenDetails: (script: FiveMScript) => void;
  onDownloadIncrement?: (scriptId: string) => void;
  onSecurityAlert?: (msg: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onOpenDetails,
  onDownloadIncrement,
  onSecurityAlert
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number>(script.downloads || 0);

  // 3D Tilt State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.18 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  const handleCopyConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(script.cfgCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    // Check for rapid click spam / autoclicker
    const spamCheck = securityShield.checkClickSpam();
    if (!spamCheck.allowed) {
      e.preventDefault();
      if (onSecurityAlert) {
        onSecurityAlert(spamCheck.reason || 'Protecție Anti-Flood activată!');
      }
      return;
    }

    // Rate limit downloads
    const rateCheck = securityShield.rateLimit('download_script', { maxRequests: 5, windowMs: 20000 });
    if (!rateCheck.allowed) {
      e.preventDefault();
      if (onSecurityAlert) {
        onSecurityAlert(`Protecție Anti-Flood activă. Așteaptă ${rateCheck.remainingSec} secunde.`);
      }
      return;
    }

    setDownloadCount(prev => prev + 1);
    if (onDownloadIncrement) {
      onDownloadIncrement(script.id);
    }
    await incrementDownloadCount(script.id);
  };

  return (
    <div
      className="w-full"
      style={{ perspective: '1200px' }}
    >
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 0.1s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.4s ease-out, box-shadow 0.4s ease-out'
        }}
        className={`pro-card rounded-2xl overflow-hidden flex flex-col justify-between relative select-none ${
          isHovered
            ? 'border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(255,255,255,0.06)]'
            : 'border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Dynamic Specular 3D Glare Light */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, transparent 65%)`
          }}
        />

        {/* Media Banner with 3D Depth */}
        {script.imageUrl && (
          <div
            className="w-full h-64 bg-[#0a0c10] overflow-hidden relative border-b border-white/[0.08] cursor-pointer"
            onClick={() => onOpenDetails(script)}
            style={{
              transform: isHovered ? 'translateZ(18px)' : 'translateZ(0)',
              transition: 'transform 0.25s ease-out'
            }}
          >
            <img
              src={script.imageUrl}
              alt={script.title}
              className="w-full h-full object-cover object-top transition-transform duration-500 ease-out hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />

            {/* Top Floating Badges with Icons */}
            <div
              className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none"
              style={{
                transform: isHovered ? 'translateZ(30px)' : 'translateZ(0)',
                transition: 'transform 0.25s ease-out'
              }}
            >
              <div className="flex items-center gap-1.5">
                {script.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/15 shadow-sm flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-zinc-300" />
                    <span>{fw}</span>
                  </span>
                ))}
              </div>
              <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-medium text-zinc-300 border border-white/15 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-zinc-400" />
                <span>{script.version}</span>
              </span>
            </div>

            {/* Bottom Floating Stats */}
            <div
              className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between pointer-events-none"
              style={{
                transform: isHovered ? 'translateZ(25px)' : 'translateZ(0)',
                transition: 'transform 0.25s ease-out'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/15 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-zinc-400" />
                  <span>{script.resmon}</span>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md text-[10px] text-zinc-300 border border-white/15">
                  {script.author}
                </span>
              </div>

              {/* Live Download Counter Badge */}
              <span className="px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-mono text-zinc-200 border border-white/15 flex items-center gap-1.5 shadow-sm">
                <Download className="w-3 h-3 text-zinc-300" />
                <span>{downloadCount} {downloadCount === 1 ? 'descărcare' : 'descărcări'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Content with 3D Depth */}
        <div
          className="p-5 flex-1 flex flex-col justify-between"
          style={{
            transform: isHovered ? 'translateZ(22px)' : 'translateZ(0)',
            transition: 'transform 0.25s ease-out'
          }}
        >
          <div>
            <h2
              onClick={() => onOpenDetails(script)}
              className="font-['Montserrat'] text-base font-bold text-white tracking-tight leading-snug mb-2 cursor-pointer hover:text-zinc-300 transition-colors"
            >
              {script.title}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
              {script.description || 'Script profesional optimizat pentru FiveM vRP.'}
            </p>
          </div>

          {/* Quick server.cfg command */}
          <div className="bg-black/60 border border-white/[0.08] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <code className="text-[11px] font-mono text-zinc-300 truncate select-all">
                {script.cfgCommand}
              </code>
            </div>
            <button
              onClick={handleCopyConfig}
              title="Copiază comanda"
              className="text-[10px] text-zinc-300 hover:text-white flex items-center gap-1 bg-white/[0.08] hover:bg-white/[0.15] px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Copiat</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copiază</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Footer with 3D Popout */}
        <div
          className="p-5 pt-0 relative z-20"
          style={{
            transform: isHovered ? 'translateZ(32px)' : 'translateZ(0)',
            transition: 'transform 0.25s ease-out'
          }}
        >
          <div className="pt-3.5 border-t border-white/[0.08] flex items-center gap-2.5">
            <button
              onClick={() => onOpenDetails(script)}
              className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] font-['Montserrat'] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>Detalii</span>
            </button>

            <a
              href={script.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={handleDownloadClick}
              className="flex-1 bg-white hover:bg-zinc-200 text-black font-['Montserrat'] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(255,255,255,0.12)] transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Descarcă</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
};
