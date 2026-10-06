/**
 * Sponex Assistant Engine for FiveM vRP
 * Combines intelligent FiveM vRP knowledge base with Google Gemini AI
 */

const LOCAL_KNOWLEDGE: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['banking', 'banca', 'atm', 'bani', 'card'],
    answer: 'Scriptul Dunko Banking & ATM include interfata NUI, depuneri, retrageri si transferuri. Pentru instalare, plaseaza folderul "banking" in directorul resources si adauga "ensure banking" in server.cfg.'
  },
  {
    keywords: ['instal', 'server.cfg', 'cum pun', 'cfg', 'start', 'ensure'],
    answer: 'Pentru a instala orice script descarcat de pe Sponex: 1. Dezarhiveaza fisierul .zip in resources/[vrp]/ 2. Deschide server.cfg 3. Adauga linia "ensure <nume_script>" dupa resursele de baza vRP.'
  },
  {
    keywords: ['resmon', 'lag', 'fps', 'optimiz', 'consum', 'ms'],
    answer: 'Toate scripturile de pe Sponex sunt optimizate pentru 0.00ms resmon in idle si maxim 0.01ms in utilizare, folosind tick-uri dinamice si interfețe NUI separate.'
  },
  {
    keywords: ['vrp', 'dunko', 'framework', 'vrpex', 'compatib'],
    answer: 'Resursele sunt complet compatibile cu Dunko vRP, vRP standard si vRPex. Nu necesita framework-uri grele si functioneaza standalone pe FiveM build 2699+.'
  },
  {
    keywords: ['salut', 'buna', 'servus', 'hei', 'ajutor', 'help'],
    answer: 'Salut. Cu ce te pot ajuta legat de FiveM vRP sau resursele de pe Sponex Hub? Poti intreba despre instalare, configurare banking sau optimizari server.'
  },
  {
    keywords: ['discord', 'contact', 'staff', 'owner', 'marius'],
    answer: 'Poti lua legatura direct cu dezvoltatorul pe serverul de Discord al comunitatii sau lasand un mesaj direct aici in chat.'
  }
];

function getApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  const b64 = 'QVEuQWI4Uk42S3pWNkthaXY5NV9XNkpIOENwMkxGd2dvUnJmbkZfalV5UHd3V1d6YU9vQ3c=';
  try {
    return atob(b64);
  } catch {
    return '';
  }
}

function matchLocalKnowledge(text: string): string | null {
  const lower = text.toLowerCase();
  for (const item of LOCAL_KNOWLEDGE) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item.answer;
    }
  }
  return null;
}

export async function askAssistant(prompt: string): Promise<string> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return 'Cu ce te pot ajuta legat de FiveM?';

  // 1. Try Gemini API
  try {
    const key = getApiKey();
    if (key) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Esti asistentul tehnic oficial Sponex vRP Hub FiveM Romania. Raspunde scurt, direct si tehnic in limba romana. FARA NICIUN EMOJI.\n\nIntrebare: "${cleanPrompt}"`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          return reply.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn('Gemini request fallback:', err);
  }

  // 2. Intelligent Built-in Fallback Engine
  const localMatch = matchLocalKnowledge(cleanPrompt);
  if (localMatch) {
    return localMatch;
  }

  return 'Resursa este disponibila pentru descarcare gratuita pe Sponex Hub. Pentru detalii specifice de configurare server.cfg sau baze de date, lasa un mesaj detaliat.';
}
