import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, ExternalLink, Sparkles, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { securityShield } from '../lib/security';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isOwner?: boolean;
}

const DEFAULT_WELCOME: ChatMessage = {
  id: 'welcome_msg_01',
  sender: 'Sponex (Bot)',
  text: 'Salut! 👋 Bine ai venit pe Hub. Dacă ai nevoie de ajutor cu vreun script vRP sau vrei să discutăm ceva legat de FiveM, lasă un mesaj aici!',
  timestamp: Date.now() - 60000,
  isOwner: true
};

export const MiniChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('sponex_chat_nick') || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [isEditingNick, setIsEditingNick] = useState<boolean>(false);
  const [tempNick, setTempNick] = useState<string>(nickname);
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sponex_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [DEFAULT_WELCOME];
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [chatChannel, setChatChannel] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Persist messages in localStorage (last 50 messages)
  useEffect(() => {
    localStorage.setItem('sponex_chat_history', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  // Supabase Realtime Broadcast setup
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('sponex_live_chat_v1', {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on('broadcast', { event: 'new_chat_message' }, ({ payload }) => {
        if (payload && payload.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setChatChannel(channel);
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen]);

  const handleSaveNickname = () => {
    const clean = tempNick.trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    setNickname(clean);
    localStorage.setItem('sponex_chat_nick', clean);
    setIsEditingNick(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    // Security & Anti-Flood check
    const spamCheck = securityShield.checkClickSpam();
    if (!spamCheck.allowed) {
      alert(spamCheck.reason || 'Te rugăm să nu spamezi!');
      return;
    }

    const rateCheck = securityShield.rateLimit('send_chat_msg', { maxRequests: 8, windowMs: 15000 });
    if (!rateCheck.allowed) {
      alert(`Protecție Anti-Spam: Te rugăm să aștepți ${rateCheck.remainingSec} secunde.`);
      return;
    }

    const isOwner = nickname.toLowerCase().includes('sponex') || nickname.toLowerCase().includes('marius');

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: nickname,
      text: cleanText,
      timestamp: Date.now(),
      isOwner
    };

    // Append locally
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Broadcast in real-time to all connected users
    if (chatChannel) {
      try {
        await chatChannel.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: newMsg
        });
      } catch (err) {
        console.warn('Realtime broadcast error:', err);
      }
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Deschide Chat"
            className="group relative flex items-center gap-2.5 bg-[#18181b] hover:bg-[#27272a] text-white border border-white/15 px-4 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <span className="text-xs font-['Montserrat'] font-semibold tracking-tight pr-1">
              Live Chat
            </span>
            {unreadCount > 0 && (
              <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-[#0f0f12] border border-white/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-fade-in backdrop-blur-xl">
          {/* Header */}
          <div className="bg-[#18181b]/95 border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-xs">
                <Sparkles className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white font-['Montserrat']">
                    Sponex Community
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Chat în timp real & Suport
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://discord.gg/yourserver"
                target="_blank"
                rel="noopener noreferrer"
                title="Deschide Discord"
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                title="Închide chat"
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nickname Bar */}
          <div className="bg-[#141418] border-b border-white/5 px-4 py-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400 truncate">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              {isEditingNick ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    maxLength={20}
                    placeholder="Numele tău..."
                    className="bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-white text-[11px] outline-none focus:border-white/50 w-28"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="bg-white text-black font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <span className="text-zinc-300 font-medium truncate">
                  Nume: <strong className="text-white">{nickname}</strong>
                </span>
              )}
            </div>
            {!isEditingNick && (
              <button
                onClick={() => {
                  setTempNick(nickname);
                  setIsEditingNick(true);
                }}
                className="text-zinc-400 hover:text-white text-[10px] underline cursor-pointer shrink-0"
              >
                Schimbă
              </button>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#0f0f12] to-[#0a0a0c]">
            {messages.map((msg) => {
              const isMe = msg.sender === nickname;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-zinc-400">
                      {msg.sender}
                    </span>
                    {msg.isOwner && (
                      <span className="bg-white/10 text-zinc-200 border border-white/20 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5 text-zinc-300" />
                        <span>DEV</span>
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-white text-black font-medium rounded-tr-sm'
                        : 'bg-[#1e1e24] text-zinc-100 border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills */}
          <div className="px-3 py-1.5 bg-[#121216] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setInputText('Salut! Ai suport pentru vRP Dunko?')}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              💬 Suport vRP?
            </button>
            <button
              onClick={() => setInputText('Cum instalez scriptul de banking?')}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              💳 Ghid instalare?
            </button>
            <button
              onClick={() => setInputText('Pot contribui cu un script nou?')}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              🚀 Upload script?
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#18181b] border-t border-white/10 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Scrie un mesaj..."
              maxLength={300}
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
