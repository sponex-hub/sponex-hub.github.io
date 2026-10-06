-- =========================================================================
-- TRIGGER AUTOMAT SUPABASE: Cand urci un .zip sau o poza in Storage,
-- Supabase creaza si publica AUTOMAT randul in tabelul 'scripts'!
-- =========================================================================

-- 1. Asigura tabela public.scripts
CREATE TABLE IF NOT EXISTS public.scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'systems',
  frameworks TEXT[] DEFAULT ARRAY['vRP']::TEXT[],
  version TEXT DEFAULT 'v1.0.0',
  resmon TEXT DEFAULT '0.00ms',
  author TEXT DEFAULT 'Sponex',
  license TEXT DEFAULT 'MIT',
  description TEXT,
  image_url TEXT DEFAULT '',
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  dependencies TEXT[] DEFAULT ARRAY['vrp']::TEXT[],
  cfg_command TEXT,
  download_url TEXT NOT NULL,
  github_url TEXT DEFAULT '',
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. Activeaza RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- 3. Politici de acces
DROP POLICY IF EXISTS "Public Read Access" ON public.scripts;
DROP POLICY IF EXISTS "Admin Insert and Update" ON public.scripts;

CREATE POLICY "Public Read Access" ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Admin Insert and Update" ON public.scripts FOR ALL USING (true) WITH CHECK (true);

-- 4. Buckets Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('scripts', 'scripts', true), ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Politici Storage
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;

CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (bucket_id IN ('scripts', 'images'));
CREATE POLICY "Public Storage Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('scripts', 'images'));
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (bucket_id IN ('scripts', 'images'));

-- =========================================================================
-- 6. FUNCTIA SI TRIGGERUL AUTOMAT PE STORAGE.OBJECTS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_auto_storage_script_upload()
RETURNS TRIGGER AS $$
DECLARE
  clean_name text;
  formatted_title text;
  pub_url text;
  script_rec_id text;
  proj_url text := 'https://hkbnklmyuypwmbunkfxl.supabase.co';
BEGIN
  -- A) CAND URCI UN .ZIP IN BUCKET-UL 'scripts'
  IF NEW.bucket_id = 'scripts' THEN
    clean_name := regexp_replace(NEW.name, '\.[^.]+$', '');
    script_rec_id := 'vrp-' || lower(regexp_replace(clean_name, '[^a-zA-Z0-9]', '-', 'g'));
    
    formatted_title := initcap(replace(replace(clean_name, '_', ' '), '-', ' '));
    IF NOT (formatted_title ILIKE 'vrp%') THEN
      formatted_title := 'vRP ' || formatted_title;
    END IF;

    pub_url := proj_url || '/storage/v1/object/public/scripts/' || NEW.name;

    INSERT INTO public.scripts (
      id,
      title,
      category,
      frameworks,
      version,
      resmon,
      author,
      license,
      description,
      download_url,
      cfg_command
    )
    VALUES (
      script_rec_id,
      formatted_title,
      'systems',
      ARRAY['vRP'],
      'v1.0.0',
      '0.00ms',
      'Sponex',
      'GPL-3.0',
      'Script vRP optimizat adăugat automat din Supabase Storage.',
      pub_url,
      'ensure ' || clean_name
    )
    ON CONFLICT (id) DO UPDATE SET
      download_url = EXCLUDED.download_url;

  -- B) CAND URCI O IMAGINE IN BUCKET-UL 'images'
  ELSIF NEW.bucket_id = 'images' THEN
    clean_name := regexp_replace(NEW.name, '\.[^.]+$', '');
    script_rec_id := 'vrp-' || lower(regexp_replace(clean_name, '[^a-zA-Z0-9]', '-', 'g'));
    pub_url := proj_url || '/storage/v1/object/public/images/' || NEW.name;

    UPDATE public.scripts
    SET image_url = pub_url
    WHERE id = script_rec_id OR id LIKE '%' || clean_name || '%';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ataseaza triggerul la storage.objects
DROP TRIGGER IF EXISTS on_storage_file_uploaded ON storage.objects;
CREATE TRIGGER on_storage_file_uploaded
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_storage_script_upload();
