import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  User, 
  ExternalLink, 
  ShieldCheck, 
  Terminal, 
  HelpCircle, 
  Code2, 
  Check, 
  Radio
} from 'lucide-react';
import { supabase, fetchChatMessages, saveChatMessage } from '../lib/supabase';
import { askAssistant } from '../lib/gemini';
import { securityShield } from '../lib/security';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isOwner?: boolean;
}

const CLEAN_DEFAULT_WELCOME: ChatMessage = {
  id: 'system_welcome',
  sender: 'Sponex Support',
  text: 'Bine ai venit pe Sponex vRP Hub. Pentru intrebari despre instalare in server.cfg, compatibilitate Dunko sau configurare resurse, scrie un mesaj aici.',
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
  const [messages, setMessages] = useState<ChatMessage[]>([CLEAN_DEFAULT_WELCOME]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [chatChannel, setChatChannel] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  // 3D Button Tilt State
  const [btnRotateX, setBtnRotateX] = useState(0);
  const [btnRotateY, setBtnRotateY] = useState(0);
  const [btnGlare, setBtnGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load from Supabase Database (with emoji cleaner)
  useEffect(() => {
    async function loadDatabaseMessages() {
      const dbMsgs = await fetchChatMessages();
      if (dbMsgs.length > 0) {
        // Strip any residual emojis from previous tests
        const cleaned = dbMsgs.map(m => ({
          ...m,
          text: m.text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
        })).filter(m => m.text.length > 0);

        setMessages([CLEAN_DEFAULT_WELCOME, ...cleaned]);
      }
    }
    loadDatabaseMessages();
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isAiTyping]);

  // Realtime Supabase Broadcast listener
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

  const handleMouseMoveBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -15;
    const rotY = ((x - centerX) / centerX) * 15;

    setBtnRotateX(rotX);
    setBtnRotateY(rotY);
    setBtnGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.35 });
  };

  const handleSaveNickname = () => {
    const clean = tempNick.trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    setNickname(clean);
    localStorage.setItem('sponex_chat_nick', clean);
    setIsEditingNick(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending) return;

    // Anti-Flood security check
    const spamCheck = securityShield.checkClickSpam();
    if (!spamCheck.allowed) {
      return;
    }

    const rateCheck = securityShield.rateLimit('send_chat_msg', { maxRequests: 8, windowMs: 15000 });
    if (!rateCheck.allowed) {
      return;
    }

    const isOwner = nickname.toLowerCase().includes('sponex') || nickname.toLowerCase().includes('marius');

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: nickname,
      text: cleanText,
      timestamp: Date.now(),
      isOwner
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // 1. Save user message to Supabase
      await saveChatMessage(nickname, cleanText, isOwner);

      // 2. Broadcast user message in realtime
      if (chatChannel) {
        await chatChannel.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: newMsg
        });
      }

      // 3. Automated Sponex Support Bot reply
      setIsAiTyping(true);
      const botResponseText = await askAssistant(cleanText);
      setIsAiTyping(false);

      const botMsg: ChatMessage = {
        id: `chat_bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: 'Sponex Support',
        text: botResponseText,
        timestamp: Date.now(),
        isOwner: true
      };

      setMessages(prev => [...prev, botMsg]);
      await saveChatMessage('Sponex Support', botResponseText, true);

      if (chatChannel) {
        await chatChannel.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: botMsg
        });
      }
    } catch (err) {
      console.warn('Chat error:', err);
      setIsAiTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <aside aria-label="Live Community Chat" className="fixed bottom-6 right-6 z-50 select-none">
      {/* 3D Floating Launcher Button */}
      {!isOpen && (
        <div style={{ perspective: '1000px' }}>
          <button
            onClick={() => setIsOpen(true)}
            onMouseMove={handleMouseMoveBtn}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => {
              setIsBtnHovered(false);
              setBtnRotateX(0);
              setBtnRotateY(0);
              setBtnGlare(prev => ({ ...prev, opacity: 0 }));
            }}
            style={{
              transform: isBtnHovered
                ? `rotateX(${btnRotateX}deg) rotateY(${btnRotateY}deg) scale3d(1.08, 1.08, 1.08) translateY(-4px)`
                : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0)',
              transformStyle: 'preserve-3d',
              transition: isBtnHovered
                ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out'
                : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease-out'
            }}
            className="relative group bg-gradient-to-b from-[#18181b] to-[#09090b] text-white border border-white/20 px-5 py-3.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(255,255,255,0.06)] flex items-center gap-3.5 cursor-pointer overflow-hidden active:scale-95"
          >
            {/* 3D Specular Glare Reflection */}
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${btnGlare.x}% ${btnGlare.y}%, rgba(255, 255, 255, ${btnGlare.opacity}) 0%, transparent 70%)`
              }}
            />

            {/* 3D Isometric Icon Box */}
            <div
              className="relative w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
              style={{
                transform: isBtnHovered ? 'translateZ(25px)' : 'translateZ(0)',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <MessageSquare className="w-5 h-5 fill-black text-black" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#101014]" />
              </span>
            </div>

            {/* Label with 3D Depth */}
            <div
              className="flex flex-col items-start"
              style={{
                transform: isBtnHovered ? 'translateZ(18px)' : 'translateZ(0)',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-['Montserrat'] font-bold text-xs tracking-tight text-white">
                  Live Chat
                </span>
                <span className="text-[10px] text-zinc-300 font-mono font-bold flex items-center gap-1 bg-white/10 px-1.5 py-0.2 rounded border border-white/10">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  vRP
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">
                Comunitate & Suport
              </span>
            </div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <span
                className="bg-white text-black font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg"
                style={{
                  transform: isBtnHovered ? 'translateZ(30px)' : 'translateZ(0)',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3D Chat Container Window */}
      {isOpen && (
        <div
          style={{ perspective: '1200px' }}
          className="w-[92vw] sm:w-[390px] h-[540px] max-h-[85vh] animate-fade-in"
        >
          <div className="w-full h-full bg-[#0d0d10]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_30px_rgba(255,255,255,0.05)] flex flex-col overflow-hidden relative">
            
            {/* Header with 3D Monochrome Clean Style */}
            <div className="bg-[#141418] border-b border-white/10 px-5 py-4 flex items-center justify-between relative z-10 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_4px_14px_rgba(255,255,255,0.2)]">
                  <Terminal className="w-4 h-4 text-black" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white font-['Montserrat'] tracking-tight">
                      Sponex Support
                    </h3>
                    <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 text-[9px] font-mono rounded font-bold uppercase tracking-wider border border-emerald-500/20">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Asistenta vRP & Scripturi
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <a
                  href="https://discord.gg/yourserver"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Deschide Discord"
                  className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Inchide chat"
                  className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nickname Bar */}
            <div className="bg-[#101014] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-zinc-400 truncate">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                {isEditingNick ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempNick}
                      onChange={(e) => setTempNick(e.target.value)}
                      maxLength={20}
                      placeholder="Nume..."
                      className="bg-black/70 border border-white/20 rounded-lg px-2 py-0.5 text-white text-[11px] outline-none focus:border-white/50 w-28 font-medium"
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="bg-white text-black font-bold text-[10px] px-2.5 py-0.5 rounded-lg cursor-pointer hover:bg-zinc-200 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-black" />
                      <span>Salveaza</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-zinc-300 truncate">
                    Nume: <strong className="text-white font-semibold">{nickname}</strong>
                  </span>
                )}
              </div>
              {!isEditingNick && (
                <button
                  onClick={() => {
                    setTempNick(nickname);
                    setIsEditingNick(true);
                  }}
                  className="text-zinc-400 hover:text-white text-[10px] font-medium underline cursor-pointer shrink-0"
                >
                  Schimba
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#0d0d10] via-[#09090b] to-[#0d0d10]">
              {messages.map((msg) => {
                const isMe = msg.sender === nickname;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {msg.sender}
                      </span>
                      {msg.isOwner && (
                        <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-zinc-300" />
                          <span>DEV</span>
                        </span>
                      )}
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words shadow-md ${
                        isMe
                          ? 'bg-white text-black font-medium rounded-tr-sm shadow-[0_4px_14px_rgba(255,255,255,0.12)]'
                          : 'bg-[#16161c] text-zinc-100 border border-white/10 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Bot Typing Indicator */}
              {isAiTyping && (
                <div className="flex flex-col items-start animate-pulse">
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-zinc-400">Sponex Support</span>
                    <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-md border border-emerald-500/20 font-mono">
                      RASPUNDE
                    </span>
                  </div>
                  <div className="bg-[#16161c] text-zinc-400 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-mono text-zinc-400 ml-1">scrie raspunsul...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips (Lucide SVG Icons only - Zero Emojis) */}
            <div className="px-3.5 py-2 bg-[#101014] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setInputText('Cum instalez scriptul de banking in server.cfg?')}
                className="text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/10 rounded-xl px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 font-medium"
              >
                <Terminal className="w-3 h-3 text-zinc-400" />
                <span>Instalare Banking</span>
              </button>
              <button
                onClick={() => setInputText('Ce framework-uri vRP sunt suportate pe acest site?')}
                className="text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/10 rounded-xl px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 font-medium"
              >
                <HelpCircle className="w-3 h-3 text-zinc-400" />
                <span>Compatibilitate vRP</span>
              </button>
              <button
                onClick={() => setInputText('Cum optimizez resmon la 0.00ms in FiveM?')}
                className="text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/10 rounded-xl px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 font-medium"
              >
                <Code2 className="w-3 h-3 text-zinc-400" />
                <span>Optimizare 0.00ms</span>
              </button>
            </div>

            {/* Input Form with 3D Depth */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#141418] border-t border-white/10 flex items-center gap-2.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Intreaba ceva despre scripturi sau FiveM..."
                maxLength={300}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-white/40 transition-colors font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
              >
                <Send className="w-4 h-4 fill-black text-black" />
              </button>
            </form>

          </div>
        </div>
      )}
    </aside>
  );
};
