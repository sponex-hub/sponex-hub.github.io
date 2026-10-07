import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation, type LanguageCode } from '../lib/i18n';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 bg-[#121215] hover:bg-[#18181f] border border-white/[0.08] hover:border-white/25 rounded-xl text-xs shadow-sm transition-all cursor-pointer active:scale-95 ${
          compact ? 'px-2.5 py-2' : 'px-3 py-2'
        }`}
        title={`Language: ${currentLanguageInfo.nativeName}`}
      >
        <span className="text-sm leading-none">{currentLanguageInfo.flag}</span>
        <span className="font-mono text-xs font-semibold text-zinc-200 uppercase tracking-wider">
          {currentLanguageInfo.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#121215]/95 backdrop-blur-xl border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.85)] py-1.5 z-50 animate-fade-in divide-y divide-white/[0.05]">
          <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500">
            Languages / Limbi
          </div>

          <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white/[0.08] text-white font-semibold'
                      : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{item.flag}</span>
                    <span className="text-xs">{item.nativeName}</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">({item.code})</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
