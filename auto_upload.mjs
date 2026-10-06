import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hkbnklmyuypwmbunkfxl.supabase.co';
const supabaseKey = 'sb_publishable_qj-G_6Tz1IKGD4vYJ6lPTA_6J9jh8PE';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Automates the upload of any vRP script (.zip or folder) + image directly to Supabase
 * Usage:
 *   node auto_upload.mjs "C:\cale\catre\script.zip" "C:\cale\catre\poza.png" "Titlu Script" "systems|jobs|nui|garages|utilities"
 */
export async function uploadScriptAutomated({
  zipFilePath,
  imageFilePath,
  title,
  category = 'systems',
  description = '',
  version = 'v1.0.0',
  resmon = '0.00ms',
  author = 'Sponex',
  cfgCommand
}) {
  if (!fs.existsSync(zipFilePath)) {
    throw new Error(`Fișierul scriptului nu există la calea: ${zipFilePath}`);
  }

  const baseName = path.basename(zipFilePath, path.extname(zipFilePath)).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cleanId = `vrp-${baseName}`;
  const scriptTitle = title || baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  console.log(`\n🚀 [Auto-Upload] Procesare script: "${scriptTitle}" (ID: ${cleanId})...`);

  // 1. Upload ZIP to Supabase Storage
  console.log(`📦 Încărcare arhivă ZIP în Storage ('scripts')...`);
  const zipBuffer = fs.readFileSync(zipFilePath);
  const zipFileName = `${cleanId}_${Date.now()}.zip`;

  const { error: zipErr } = await supabase.storage
    .from('scripts')
    .upload(zipFileName, zipBuffer, {
      contentType: 'application/zip',
      upsert: true
    });

  if (zipErr) {
    throw new Error(`Eroare la upload ZIP: ${zipErr.message}`);
  }

  const { data: zipUrlData } = supabase.storage.from('scripts').getPublicUrl(zipFileName);
  const downloadUrl = zipUrlData.publicUrl;
  console.log(`✅ ZIP urcat cu succes: ${downloadUrl}`);

  // 2. Upload Image to Supabase Storage (if provided)
  let imageUrl = '';
  if (imageFilePath && fs.existsSync(imageFilePath)) {
    console.log(`🖼️ Încărcare imagine în Storage ('images')...`);
    const imgExt = path.extname(imageFilePath).toLowerCase() || '.png';
    const imgBuffer = fs.readFileSync(imageFilePath);
    const imgFileName = `${cleanId}_${Date.now()}${imgExt}`;

    const { error: imgErr } = await supabase.storage
      .from('images')
      .upload(imgFileName, imgBuffer, {
        contentType: imgExt === '.jpg' || imgExt === '.jpeg' ? 'image/jpeg' : 'image/png',
        upsert: true
      });

    if (imgErr) {
      console.warn(`⚠️ Eroare upload imagine: ${imgErr.message}`);
    } else {
      const { data: imgUrlData } = supabase.storage.from('images').getPublicUrl(imgFileName);
      imageUrl = imgUrlData.publicUrl;
      console.log(`✅ Imagine urcată cu succes: ${imageUrl}`);
    }
  }

  // 3. Automatically insert / upsert into Supabase Table
  console.log(`📝 Salvare automată în baza de date Supabase (tabelul 'scripts')...`);
  const record = {
    id: cleanId,
    title: scriptTitle,
    category: category,
    frameworks: ['vRP'],
    version: version,
    resmon: resmon,
    author: author,
    license: 'GPL-3.0',
    description: description || `Script profesional vRP optimizat pentru servere FiveM. Include funcționalități complete, interfață modernă și configurare rapidă.`,
    image_url: imageUrl,
    download_url: downloadUrl,
    cfg_command: cfgCommand || `ensure ${baseName}`
  };

  const { error: dbErr } = await supabase
    .from('scripts')
    .upsert(record);

  if (dbErr) {
    throw new Error(`Eroare salvare în baza de date: ${dbErr.message}`);
  }

  console.log(`✨ GATA! Scriptul "${scriptTitle}" este acum LIVE pe site!\n`);
  return record;
}

// CLI Execution support
const args = process.argv.slice(2);
if (args.length > 0) {
  const [zipFilePath, imageFilePath, title, category, description] = args;
  uploadScriptAutomated({
    zipFilePath,
    imageFilePath,
    title,
    category: category || 'systems',
    description
  }).catch(err => {
    console.error('❌ Eroare:', err.message);
    process.exit(1);
  });
}
