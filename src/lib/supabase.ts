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
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
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

    return data.map((item: any) => ({
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
  } catch (err) {
    console.error('Failed to query Supabase:', err);
    return SCRIPTS_DATA;
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
