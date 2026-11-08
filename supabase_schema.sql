-- =============================================================================
-- Raíz & Barrio - Esquema de Base de Datos, Storage y Políticas RLS en Supabase
-- Proyecto: Marketplace Hiperlocal para Productores Agrícolas
-- =============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Modificaciones en tabla 'profiles'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Políticas de Seguridad de Nivel de Fila (RLS) para Acceso Público
DROP POLICY IF EXISTS "Permitir todo anon profiles" ON public.profiles;
CREATE POLICY "Permitir todo anon profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo anon products" ON public.products;
CREATE POLICY "Permitir todo anon products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo anon categories" ON public.categories;
CREATE POLICY "Permitir todo anon categories" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Sembrado inicial de Categorías
INSERT INTO public.categories (id, name, description)
OVERRIDING SYSTEM VALUE
VALUES 
    (1, 'Canastas', 'Canastas familiares y agroecológicas semanales'),
    (2, 'Verduras', 'Verduras de huerta y hortalizas frescas'),
    (3, 'Frutas', 'Frutas de temporada cosechadas al punto'),
    (4, 'Lácteos', 'Huevos campesinos y derivados lácteos de pastoreo'),
    (5, 'Despensa', 'Miel, panela artesanal y café de origen')
ON CONFLICT (id) DO NOTHING;

-- 5. Cuentas de Usuario de Prueba
INSERT INTO public.profiles (id, username, password, email, full_name, role, farm_name, avatar_url)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'max', '123', 'max.cliente@raizybarrio.co', 'Max Cliente', 'cliente', NULL, NULL),
    ('00000000-0000-0000-0000-000000000002', 'maxp', '123', 'maxp.productor@raizybarrio.co', 'Max Productor', 'productor', 'Huerta El Renacer', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg'),
    ('00000000-0000-0000-0000-000000000003', 'admin', 'admin123', 'lucia@raizybarrio.co', 'Lucía Torres', 'administrador', 'Administración Raíz & Barrio', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/lucia_torres.jpg'),
    ('00000000-0000-0000-0000-000000000004', 'elena', '123', 'elena@elrenacer.co', 'Elena Moreno', 'productor', 'Huerta El Renacer', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg'),
    ('00000000-0000-0000-0000-000000000005', 'carlos', '123', 'carlos@laesperanza.co', 'Carlos Ramírez', 'productor', 'Finca La Esperanza', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_1.jpg'),
    ('00000000-0000-0000-0000-000000000006', 'daniel', '123', 'daniel@familiarojas.co', 'Daniel Rojas', 'productor', 'Familia Rojas', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_3.jpg')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    farm_name = EXCLUDED.farm_name,
    avatar_url = EXCLUDED.avatar_url;

-- 6. Sembrado de Productos del Catálogo con URLs de Supabase Storage
INSERT INTO public.products (id, producer_id, category_id, title, description, price, unit, stock_quantity, is_available, image_url)
OVERRIDING SYSTEM VALUE
VALUES
    (1, '00000000-0000-0000-0000-000000000005', 2, 'Tomate de huerta', 'Finca La Esperanza · Choachí · a 32 km', 64, 'kg', 85, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg'),
    (2, '00000000-0000-0000-0000-000000000006', 3, 'Aguacate Hass', 'Familia Rojas · La Vega · a 52 km', 102, 'kg', 42, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg'),
    (3, '00000000-0000-0000-0000-000000000004', 2, 'Zanahoria de tierra', 'Huerta El Renacer · Subachoque · a 45 km', 40, 'kg', 60, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg'),
    (4, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Huerto Familiar', 'Familias de Choachí · Selección de 8 a 10 productos', 580, 'canasta', 12, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg'),
    (5, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Agroecológica Esencial', 'Huerta El Renacer · 5 a 6 variedades agroecológicas', 360, 'canasta', 8, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg'),
    (6, '00000000-0000-0000-0000-000000000004', 2, 'Acelga de la huerta', 'Huerta El Renacer · Cosechada en la madrugada', 35, 'manojo', 0, false, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/acelgas.jpg'),
    (7, '00000000-0000-0000-0000-000000000004', 3, 'Fresas de temporada', 'Huerta El Renacer · Cultivo agroecológico dulce', 80, 'caja 500g', 35, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg'),
    (8, '00000000-0000-0000-0000-000000000005', 4, 'Huevos campesinos pastoriles', 'Finca La Esperanza · Gallinas libres de pastoreo', 185, 'cubeta 30 u', 25, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/huevos.jpg'),
    (9, '00000000-0000-0000-0000-000000000005', 4, 'Queso campesino de hoja', 'Finca La Esperanza · Elaborado con leche fresca', 120, '500g', 18, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso.jpg'),
    (10, '00000000-0000-0000-0000-000000000006', 5, 'Miel pura de abejas nativas', 'Familia Rojas · Cosechada en bosque nativo', 240, 'frasco 500g', 30, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel.jpg'),
    (11, '00000000-0000-0000-0000-000000000006', 5, 'Café de origen arábica tostado', 'Familia Rojas · Tueste medio especial', 260, 'bolsa 500g', 40, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/cafe.jpg'),
    (12, '00000000-0000-0000-0000-000000000006', 5, 'Panela pulverizada orgánica', 'Familia Rojas · Trapiche tradicional', 75, 'bolsa 1kg', 50, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/panela.jpg'),
    (13, '00000000-0000-0000-0000-000000000004', 2, 'Rábanos de temporada', 'Huerta El Renacer · Subachoque', 28, 'manojo', 30, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    unit = EXCLUDED.unit,
    stock_quantity = EXCLUDED.stock_quantity,
    is_available = EXCLUDED.is_available,
    image_url = EXCLUDED.image_url;

-- =============================================================================
-- 7. Configuración de Supabase Storage (Bucket 'assets')
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de seguridad para storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'assets');

-- =============================================================================
-- 8. Tabla Relacional de Metadatos de Assets ('public.assets')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename text NOT NULL,
    folder text NOT NULL DEFAULT 'images',
    path text NOT NULL UNIQUE,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    public_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo anon assets" ON public.assets;
CREATE POLICY "Permitir todo anon assets" ON public.assets 
FOR ALL TO public USING (true) WITH CHECK (true);
