# Sponex Developments — FiveM Scripts Hub

O aplicație web ultra-rapidă și curată bazată pe **React 19 + Vite + TypeScript + Tailwind CSS v4** și integrată complet cu **Supabase** pentru încărcarea și administrarea scripturilor FiveM în cloud.

---

## ⚡ Caracteristici

- **Integrare Supabase**: Încarcă automat scripturile direct din baza ta de date din Supabase.
- **Fallback inteligent**: Dacă nu ai configurat încă Supabase sau nu ai internet, site-ul folosește automat datele locale din `src/data/scripts.ts`, deci nu crapă niciodată.
- **Aspect curat**: Doar cardurile de scripturi cu butoanele de **Detalii** și **Descarcă**, fără elemente de prisos.

---

## 🗄️ Cum configurezi Supabase în 2 pași simpli

### 1. Creează tabela în Supabase
1. Intră în contul tău pe [supabase.com](https://supabase.com) și deschide proiectul tău.
2. Mergi în **SQL Editor** în panoul din stânga.
3. Copiază tot codul din fișierul [supabase_schema.sql](file:///c:/Users/marius/Downloads/ddd/supabase_schema.sql) și apasă **Run**.

### 2. Adaugă cheile în fișierul `.env`
Deschide fișierul [.env](file:///c:/Users/marius/Downloads/ddd/.env) și pune URL-ul și cheia anonimă (le găsești în Supabase -> **Project Settings -> API**):

```env
VITE_SUPABASE_URL=https://nume-proiect.supabase.co
VITE_SUPABASE_ANON_KEY=cheia-ta-anonima
```

---

## 🚀 Cum rulezi proiectul

```bash
npm run dev
```
Deschide `http://localhost:5173` în browser.
