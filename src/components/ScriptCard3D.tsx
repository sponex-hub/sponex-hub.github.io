import React, { useState, useRef } from 'react';
import { Download, Info } from 'lucide-react';
import type { FiveMScript } from '../types/script';

interface ScriptCard3DProps {
  script: FiveMScript;
  onOpenDetails: (script: FiveMScript) => void;
}

export const ScriptCard3D: React.FC<ScriptCard3DProps> = ({ script, onOpenDetails }) => {
  const cardRef = useRef<HTMLDivElement>(null);
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

    // Calculate rotation (-12deg to +12deg for smooth 3D tilt)
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);

    // Glare position in percentages
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.25 });
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

  return (
    <div
      className="perspective-1000 w-full"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025) translateY(-6px)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out'
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease-out, border-color 0.5s ease-out'
        }}
        className={`glass-panel rounded-2xl overflow-hidden flex flex-col justify-between relative select-none ${
          isHovered
            ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_35px_rgba(255,56,125,0.25)] border-[#ff387d]/40'
            : 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] border-white/10'
        }`}
      >
        {/* Dynamic Specular 3D Glare Light */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, transparent 65%)`
          }}
        />

        {/* Ambient Subtle Silver Glow */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-300 z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%, rgba(255, 255, 255, 0.04) 100%)',
            opacity: isHovered ? 1 : 0
          }}
        />

        {/* 3D Layer: Preview Image Banner */}
        {script.imageUrl && (
          <div
            className="w-full h-56 bg-black/60 overflow-hidden relative border-b border-white/10 group cursor-pointer"
            onClick={() => onOpenDetails(script)}
            style={{
              transform: isHovered ? 'translateZ(20px)' : 'translateZ(0)',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <img
              src={script.imageUrl}
              alt={script.title}
              className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent opacity-80" />
            
            {/* Version Badge popping out in 3D */}
            <div
              className="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-[10px] font-mono text-zinc-300 font-semibold px-2.5 py-1 rounded-md border border-white/15 shadow-lg"
              style={{
                transform: isHovered ? 'translateZ(35px)' : 'translateZ(0)',
                transition: 'transform 0.3s ease-out'
              }}
            >
              {script.version}
            </div>

            {/* Framework Badge */}
            <div
              className="absolute bottom-3 left-3 flex items-center gap-1.5"
              style={{
                transform: isHovered ? 'translateZ(30px)' : 'translateZ(0)',
                transition: 'transform 0.3s ease-out'
              }}
            >
              {script.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-md"
                >
                  {fw}
                </span>
              ))}
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10">
                {script.resmon}
              </span>
            </div>
          </div>
        )}

        {/* 3D Layer: Content */}
        <div
          className="p-5"
          style={{
            transform: isHovered ? 'translateZ(25px)' : 'translateZ(0)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          {!script.imageUrl && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                {script.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/15 text-white border border-white/20"
                  >
                    {fw}
                  </span>
                ))}
              </div>
              <span className="font-mono text-xs text-zinc-400">{script.version}</span>
            </div>
          )}

          <h3 className="font-['Montserrat'] text-base font-bold text-white mb-2 tracking-tight line-clamp-1">
            {script.title}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {script.description || 'Fără descriere disponibilă.'}
          </p>
        </div>

        {/* 3D Layer: Bottom Actions */}
        <div
          className="p-5 pt-0 relative z-20"
          style={{
            transform: isHovered ? 'translateZ(35px)' : 'translateZ(0)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
            <button
              onClick={() => onOpenDetails(script)}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white font-['Montserrat'] text-xs font-semibold py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>Detalii</span>
            </button>
            <a
              href={script.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-1 bg-white hover:bg-zinc-200 text-black font-['Montserrat'] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Descarcă</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
