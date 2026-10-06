import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hkbnklmyuypwmbunkfxl.supabase.co';
const supabaseKey = 'sb_publishable_qj-G_6Tz1IKGD4vYJ6lPTA_6J9jh8PE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Uploading banking files to Supabase...');

  // 1. Upload banking.zip
  const zipPath = 'C:\\Users\\marius\\Downloads\\Dunko\\Dunko\\resources\\[scripts]\\banking.zip';
  const zipBuffer = fs.readFileSync(zipPath);
  const zipName = 'banking.zip';

  const { data: zipData, error: zipErr } = await supabase.storage
    .from('scripts')
    .upload(zipName, zipBuffer, {
      contentType: 'application/zip',
      upsert: true
    });

  if (zipErr) {
    console.error('Error uploading zip:', zipErr);
  } else {
    console.log('Zip uploaded successfully:', zipData);
  }

  const { data: zipUrlData } = supabase.storage.from('scripts').getPublicUrl(zipName);
  const downloadUrl = zipUrlData.publicUrl;
  console.log('Download URL:', downloadUrl);

  // 2. Upload image
  const imgPath = 'C:\\Users\\marius\\.gemini\\antigravity-ide\\brain\\979b558d-c718-4b8a-80eb-4faac6f4bb30\\.user_uploaded\\media_1791316292440.png';
  const imgBuffer = fs.readFileSync(imgPath);
  const imgName = 'dunko_banking_atm.png';

  const { data: imgData, error: imgErr } = await supabase.storage
    .from('images')
    .upload(imgName, imgBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (imgErr) {
    console.error('Error uploading image:', imgErr);
  } else {
    console.log('Image uploaded successfully:', imgData);
  }

  const { data: imgUrlData } = supabase.storage.from('images').getPublicUrl(imgName);
  const imageUrl = imgUrlData.publicUrl;
  console.log('Image URL:', imageUrl);

  // 3. Insert into public.scripts
  const scriptRecord = {
    id: 'dunko-banking',
    title: 'Dunko vRP Banking & ATM Service',
    category: 'systems',
    frameworks: ['vRP'],
    version: 'v1.0.0',
    resmon: '0.00ms',
    author: 'Sponex',
    license: 'GPL-3.0',
    description: 'Sistem bancar și ATM avansat cu interfață modernă NUI, depuneri, retrageri de numerar, cont personal și comenzi optimizate pentru framework-ul Dunko vRP.',
    image_url: imageUrl,
    download_url: downloadUrl,
    cfg_command: 'ensure banking'
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('scripts')
    .upsert(scriptRecord);

  if (insertErr) {
    console.error('Error inserting script row:', insertErr);
  } else {
    console.log('Script record upserted successfully into public.scripts!');
  }
}

main().catch(console.error);
