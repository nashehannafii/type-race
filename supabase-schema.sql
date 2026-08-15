-- 1. Create profiles table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create typing_materials table (untuk materi ketik dinamis)
CREATE TABLE public.typing_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create race_sessions table (untuk room multiplayer)
CREATE TABLE public.race_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT UNIQUE,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create race_players table (untuk menyimpan data pemain dan hasil balapan/Hall of Fame)
CREATE TABLE public.race_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID REFERENCES public.race_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Bisa NULL jika is_guest = true
  display_name TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  wpm INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0.0,
  errors INTEGER DEFAULT 0,
  time_ms INTEGER DEFAULT 0,
  language TEXT DEFAULT 'id',
  rank INTEGER
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_players ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Semua orang bisa melihat materi ketik
CREATE POLICY "Public typing_materials are viewable by everyone." 
ON public.typing_materials FOR SELECT USING (true);

-- Semua orang bisa melihat data sesi balapan
CREATE POLICY "Race sessions are viewable by everyone." 
ON public.race_sessions FOR SELECT USING (true);
-- Semua orang bisa membuat room baru
CREATE POLICY "Anyone can create race sessions." 
ON public.race_sessions FOR INSERT WITH CHECK (true);
-- Semua orang bisa mengupdate room (untuk mengubah status)
CREATE POLICY "Anyone can update race sessions." 
ON public.race_sessions FOR UPDATE USING (true);

-- Semua orang bisa melihat data pemain (untuk keperluan Hall of Fame)
CREATE POLICY "Race players are viewable by everyone." 
ON public.race_players FOR SELECT USING (true);
-- Semua orang (termasuk Guest) bisa menyimpan hasil balapan mereka
CREATE POLICY "Anyone can insert race players." 
ON public.race_players FOR INSERT WITH CHECK (true);

-- 7. Insert Dummy Data (Opsional, agar Hall of Fame tidak kosong di awal)
INSERT INTO public.typing_materials (content, difficulty) VALUES 
('Technology continues to transform the way we live, work, and communicate. As new innovations emerge, the boundaries of what is possible expand.', 'medium'),
('The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.', 'easy');
