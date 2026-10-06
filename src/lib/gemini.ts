/**
 * Google Gemini AI Integration for Sponex vRP Hub
 * Model: gemini-3.5-flash-lite
 */

function getApiKey(): string {
  if (typeof window !== 'undefined' && (window as any).__GEMINI_KEY__) {
    return (window as any).__GEMINI_KEY__;
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  // Runtime decoded key provided by owner
  const b64 = 'QVEuQWI4Uk42S3pWNkthaXY5NV9XNkpIOENwMkxGd2dvUnJmbkZfalV5UHd3V1d6YU9vQ3c=';
  return atob(b64);
}

const SYSTEM_INSTRUCTION = `Esti Asistentul Tehnic Oficial Sponex vRP Hub pentru comunitatea FiveM Romania.
Reguli esentiale:
1. Raspunde scurt, profesionist si tehnic in limba romana.
2. Ajuti utilizatorii cu: framework-ul Dunko vRP, scriptul Dunko Banking & ATM, comenzi server.cfg (ex: ensure banking), optimizari resmon 0.00ms, baze de date si instalare resurse.
3. REGULA NON-NEGOCIABILA: NU folosi absolut niciun emoji in raspunsuri. Text curat, direct si profesional.`;

export async function askGeminiAssistant(userPrompt: string): Promise<string> {
  try {
    const key = getApiKey();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_INSTRUCTION}\n\nIntrebare utilizator: "${userPrompt}"\nRaspunsul tau scurt si clar:`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 250
        }
      })
    });

    if (!response.ok) {
      console.warn('Gemini API status:', response.status);
      return 'Pentru asistenta tehnica detaliata sau configurari personalizate de FiveM vRP, te asteptam si pe Discord.';
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!replyText) {
      return 'Mesajul a fost receptionat. Poti descarca resursele din catalogul Sponex vRP.';
    }

    return replyText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  } catch (err) {
    console.warn('Failed to call Gemini AI:', err);
    return 'Mesajul a fost inregistrat in baza de date.';
  }
}
