-- SCRIPTS DE CREACIÓN DE TABLAS PARA SPECTRA (VERSIÓN ROBUSTA V3)
-- Esta versión separa la lógica de administración para evitar recursión infinita.

-- 0. Tabla de Administradores (Whitelist)
-- Para hacer admin a alguien: INSERT INTO public.admins (user_id) VALUES ('ID-DEL-USUARIO');
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Tabla de Perfiles (Usuarios)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    country TEXT,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    rank TEXT DEFAULT 'Normal' CHECK (rank IN ('Normal', 'Premium', 'Plus')),
    is_admin BOOLEAN DEFAULT FALSE,
    rank_expiration TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para verificar si es admin (SEGURO CONTRA RECURSIÓN)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. Otras Tablas (Contenido)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    online_url TEXT,
    price_cop BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    free_ranks TEXT[] DEFAULT '{}',
    price_cop BIGINT NOT NULL,
    download_url TEXT,
    password TEXT,
    type TEXT CHECK (type IN ('mobile', 'pc')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    free_ranks TEXT[] DEFAULT '{}',
    price_cop BIGINT NOT NULL,
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.networks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    photo_url TEXT,
    link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    allowed_ranks TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    price_cop BIGINT NOT NULL,
    duration TEXT CHECK (duration IN ('monthly', 'quarterly', 'annual', 'lifetime')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS y crear políticas para las demás tablas
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name NOT IN ('profiles', 'admins', 'spatial_ref_sys')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Authenticated users can read %I" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Admins can manage %I" ON public.%I FOR ALL USING (public.is_admin())', t, t);
    END LOOP;
END $$;
