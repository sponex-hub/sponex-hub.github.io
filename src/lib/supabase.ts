import { createClient } from '@supabase/supabase-js';
import type { FiveMScript } from '../types/script';
import { SCRIPTS_DATA } from '../data/scripts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkbnklmyuypwmbunkfxl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qj-G_6Tz1IKGD4vYJ6lPTA_6J9jh8PE';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Discord OAuth Login via Discord Developer Portal Implicit Flow
 */
export async function signInWithDiscord(): Promise<{ error?: string }> {
  try {
    const clientId = '1557141985653948567';
    const origin = window.location.origin;
    const path = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
    const cleanUrl = `${origin}${path}`;
    const redirectUri = encodeURIComponent(cleanUrl);

    // Direct Discord OAuth2 URL
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20email`;

    window.location.href = discordUrl;
    return {};
  } catch (err: any) {
    return { error: err.message || 'Eroare la redirecționare Discord' };
  }
}



/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Signout notice:', err);
  }
}

/**
 * Upload a file (.zip or image) directly to Supabase Storage and returns its public URL
 */
export async function uploadToStorage(
  bucket: 'scripts' | 'images',
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!supabase) {
    return { error: 'Supabase nu este conectat în .env' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'zip';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (
        uploadError.message?.toLowerCase().includes('exceeded') ||
        uploadError.message?.toLowerCase().includes('size') ||
        uploadError.message?.toLowerCase().includes('payload')
      ) {
        return { 
          error: 'Fișierul depășește limita Supabase Storage. Te rugăm să folosești opțiunea "Link Extern de Descărcare" (Google Drive, Mega, MediaFire, GitHub).' 
        };
      }
      return { error: uploadError.message };
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err.message || 'Eroare la upload' };
  }
}

/**
 * Fetch all vRP scripts from Supabase with fallback
 */
export async function getScripts(): Promise<FiveMScript[]> {
  if (!supabase) {
    return SCRIPTS_DATA;
  }

  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetch notice:', error?.message);
      return SCRIPTS_DATA;
    }

    // Filter real FiveM script cards from Supabase
    const validScriptRows = data.filter((item: any) => {
      if (!item.id || typeof item.id !== 'string') return false;
      if (item.id.startsWith('rev_') || item.id.startsWith('chat_')) return false;
      if (item.category === 'chat_message' || item.category === 'review') return false;
      // Must have title and download URL or valid resource content
      return Boolean(item.title && (item.download_url || item.description));
    });

    const parsedSupabaseScripts: FiveMScript[] = validScriptRows.map((item: any) => ({
      id: item.id || item.slug,
      title: item.title,
      category: item.category || 'systems',
      frameworks: Array.isArray(item.frameworks) && item.frameworks.length > 0 ? item.frameworks : ['vRP'],
      version: item.version || 'v1.0.0',
      resmon: item.resmon || '0.00ms',
      author: item.author || 'Sponex',
      license: item.license || 'MIT',
      description: item.description || '',
      imageUrl: item.image_url || '',
      features: Array.isArray(item.features) ? item.features : [],
      dependencies: Array.isArray(item.dependencies) ? item.dependencies : ['vrp'],
      cfgCommand: item.cfg_command || `ensure ${item.id}`,
      downloadUrl: item.download_url || '#',
      githubUrl: item.github_url || '',
      downloads: item.downloads 
        ? Number(item.downloads) 
        : Number(String(item.github_url || '').replace('downloads:', '') || 0)
    }));

    // Merge Supabase scripts (newest first) with default catalogue without ID collisions
    const dbIds = new Set(parsedSupabaseScripts.map(s => s.id.toLowerCase()));
    const mergedList = [
      ...parsedSupabaseScripts,
      ...SCRIPTS_DATA.filter(s => !dbIds.has(s.id.toLowerCase()))
    ];

    return mergedList;
  } catch (err) {
    console.error('Failed to query Supabase:', err);
    return SCRIPTS_DATA;
  }
}

export interface CommunityReview {
  id: string;
  author: string;
  text: string;
  rating: number;
  timestamp: number;
  isVerified?: boolean;
}

/**
 * Fetch all verified community reviews from Supabase
 */
export async function fetchReviews(): Promise<CommunityReview[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('id, title, description, author, version, download_url, created_at')
      .eq('category', 'review')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      author: row.author || row.title || 'Membru Comunitate',
      text: row.description || '',
      rating: parseInt(row.version, 10) || 5,
      timestamp: new Date(row.created_at).getTime() || Date.now(),
      isVerified: row.download_url === 'verified'
    }));
  } catch (err) {
    console.warn('Failed to fetch reviews:', err);
    return [];
  }
}

/**
 * Save new community review to Supabase
 */
export async function saveReview(author: string, text: string, rating: number = 5): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('scripts')
      .insert([
        {
          id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: author,
          description: text,
          category: 'review',
          author: author,
          download_url: 'verified',
          version: rating.toString(),
          license: 'review',
          resmon: '0.00ms'
        }
      ]);

    return !error;
  } catch (err) {
    console.warn('Failed to save review to Supabase:', err);
    return false;
  }
}

/**
 * Real Database Chat: Fetch messages stored in Supabase
 */
export async function fetchChatMessages(): Promise<Array<{
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isOwner?: boolean;
}>> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('id, title, description, author, download_url, created_at')
      .eq('category', 'chat_message')
      .order('created_at', { ascending: true })
      .limit(60);

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      sender: row.title || row.author || 'Vizitator',
      text: row.description || '',
      timestamp: new Date(row.created_at).getTime() || Date.now(),
      isOwner: row.download_url === 'owner' || String(row.title || '').toLowerCase().includes('sponex')
    }));
  } catch (err) {
    console.warn('Failed to load chat from Supabase:', err);
    return [];
  }
}

/**
 * Real Database Chat: Save message to Supabase
 */
export async function saveChatMessage(sender: string, text: string, isOwner: boolean = false): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('scripts')
      .insert([
        {
          id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: sender,
          description: text,
          category: 'chat_message',
          author: sender,
          download_url: isOwner ? 'owner' : 'user',
          license: 'chat',
          version: '1.0.0',
          resmon: '0.00ms'
        }
      ]);

    return !error;
  } catch (err) {
    console.warn('Failed to save chat message to Supabase:', err);
    return false;
  }
}

/**
 * Increment downloads count for a script and persist directly to Supabase
 */
export async function incrementDownloadCount(scriptId: string): Promise<number | null> {
  if (!supabase) return null;
  try {
    const { data: current } = await supabase
      .from('scripts')
      .select('github_url, downloads')
      .eq('id', scriptId)
      .maybeSingle();

    const currentCount = current?.downloads
      ? Number(current.downloads)
      : Number(String(current?.github_url || '').replace('downloads:', '') || 0);

    const newCount = currentCount + 1;

    // Try updating both for complete compatibility
    await supabase
      .from('scripts')
      .update({ github_url: `downloads:${newCount}` })
      .eq('id', scriptId);

    return newCount;
  } catch (err) {
    console.warn('Could not persist download count:', err);
    return null;
  }
}




/**
 * Add a new vRP script to Supabase database
 */
export async function createScript(script: Partial<FiveMScript>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nu este încă configurat în .env' };
  }

  try {
    const { error } = await supabase
      .from('scripts')
      .insert([
        {
          id: script.id,
          title: script.title,
          category: script.category || 'systems',
          frameworks: script.frameworks || ['vRP'],
          version: script.version || 'v1.0.0',
          resmon: script.resmon || '0.00ms',
          author: script.author || 'Sponex',
          license: script.license || 'MIT',
          description: script.description || '',
          image_url: script.imageUrl || '',
          features: script.features || [],
          dependencies: script.dependencies || ['vrp'],
          cfg_command: script.cfgCommand || `ensure ${script.id}`,
          download_url: script.downloadUrl,
          github_url: script.githubUrl || ''
        }
      ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Eroare necunoscută' };
  }
}

/**
 * Delete a vRP script from Supabase database
 */
export async function deleteScript(scriptId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nu este conectat' };
  }

  try {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Eroare la ștergere' };
  }
}

/**
 * Update an existing vRP script in Supabase database
 */
export async function updateScript(scriptId: string, updates: Partial<FiveMScript>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nu este conectat' };
  }

  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.version !== undefined) payload.version = updates.version;
    if (updates.resmon !== undefined) payload.resmon = updates.resmon;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.license !== undefined) payload.license = updates.license;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.features !== undefined) payload.features = updates.features;
    if (updates.dependencies !== undefined) payload.dependencies = updates.dependencies;
    if (updates.cfgCommand !== undefined) payload.cfg_command = updates.cfgCommand;
    if (updates.downloadUrl !== undefined) payload.download_url = updates.downloadUrl;

    const { error } = await supabase
      .from('scripts')
      .update(payload)
      .eq('id', scriptId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Eroare la actualizare' };
  }
}


