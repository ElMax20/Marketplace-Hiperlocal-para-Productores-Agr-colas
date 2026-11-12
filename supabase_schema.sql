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

-- 5. Cuentas de Usuario de Prueba y Productores Locales de Guayas
INSERT INTO public.profiles (id, username, password, email, full_name, role, farm_name, avatar_url)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'max', '123', 'max@vecinos.com', 'Max Cliente', 'cliente', NULL, NULL),
    ('00000000-0000-0000-0000-000000000002', 'maxp', '123', 'maxp@elrenacer.co', 'Max Productor', 'productor', 'Hacienda San José', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_1.jpg'),
    ('00000000-0000-0000-0000-000000000003', 'admin', 'admin123', 'lucia@raizybarrio.co', 'Lucía Torres', 'administrador', 'Administración Raíz & Barrio', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/lucia_torres.jpg'),
    ('00000000-0000-0000-0000-000000000004', 'elena', '123', 'elena@elguayacan.ec', 'Elena Moreno', 'productor', 'Huerta Agroecológica El Guayacán', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg'),
    ('00000000-0000-0000-0000-000000000005', 'carlos', '123', 'carlos@alvarado.ec', 'Carlos Alvarado', 'productor', 'Hacienda San José', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_1.jpg'),
    ('00000000-0000-0000-0000-000000000006', 'jorge', '123', 'jorge@donjorge.ec', 'Don Jorge', 'productor', 'Asociación Don Jorge', 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_3.jpg')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    farm_name = EXCLUDED.farm_name,
    avatar_url = EXCLUDED.avatar_url;

-- 6. Sembrado de Productos del Catálogo con URLs de Alta Calidad Unsplash y Precios en USD
INSERT INTO public.products (id, producer_id, category_id, title, description, price, unit, stock_quantity, is_available, image_url)
OVERRIDING SYSTEM VALUE
VALUES
    (11, '00000000-0000-0000-0000-000000000005', 1, 'Canasta Huerto Familiar', 'Hacienda San José · Daule · 8-10 hortalizas, 3 frutas y aromáticas para 3 a 5 personas', 0.95, 'canasta semanal', 15, true, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'),
    (12, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Agroecológica Esencial', 'Huerta Agroecológica El Guayacán · Milagro · 5-6 variedades básicas, frutas y huevos para parejas', 0.7, 'canasta semanal', 12, true, 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80'),
    (47, '00000000-0000-0000-0000-000000000006', 1, 'Canasta Cosecha Campesina', 'Asociación Don Jorge · Naranjal · Canasta rústica con tubérculos, plátano verde, queso y miel', 0.88, 'canasta semanal', 10, true, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80'),
    (48, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Huerta & Frutas', 'Huerta Agroecológica El Guayacán · Milagro · Surtido abundante de frutas tropicales y hortalizas de huerta', 0.82, 'canasta semanal', 14, true, 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80'),
    (1, '00000000-0000-0000-0000-000000000005', 2, 'Tomate de huerta', 'Hacienda San José · Daule · Tomate fresco de huerta campesina libre de agroquímicos', 0.64, 'kg', 85, true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'),
    (3, '00000000-0000-0000-0000-000000000005', 2, 'Zanahoria de tierra', 'Hacienda San José · Daule · Zanahorias dulces cosechadas a mano con hojas frescas', 0.4, 'kg', 60, true, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80'),
    (5, '00000000-0000-0000-0000-000000000005', 2, 'Papa criolla nativa', 'Hacienda San José · Daule · Papa criolla seleccionada y lavada de cosecha local', 0.52, 'kg', 50, true, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'),
    (13, '00000000-0000-0000-0000-000000000005', 2, 'Rábanos de temporada', 'Hacienda San José · Daule · Rábanos frescos y crujientes cosechados al amanecer', 0.28, 'manojo', 30, true, 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80'),
    (14, '00000000-0000-0000-0000-000000000005', 2, 'Cebolla colorada', 'Hacienda San José · Daule · Cebolla colorada crocante cosechada en su punto óptimo', 0.45, 'kg', 55, true, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80'),
    (15, '00000000-0000-0000-0000-000000000004', 2, 'Cebolla blanca de rama', 'Huerta Agroecológica El Guayacán · Milagro · Cebollín fresco aromático para refritos y sopas', 0.35, 'atado', 40, true, 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=600&q=80'),
    (16, '00000000-0000-0000-0000-000000000005', 2, 'Pimiento verde criollo', 'Hacienda San José · Daule · Pimientos verdes carnosos de huerta agroecológica', 0.42, 'kg', 45, true, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80'),
    (17, '00000000-0000-0000-0000-000000000004', 2, 'Pimiento rojo dulce', 'Huerta Agroecológica El Guayacán · Milagro · Pimientos rojos madurados al sol del valle', 0.48, 'kg', 38, true, 'https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&w=600&q=80'),
    (18, '00000000-0000-0000-0000-000000000004', 2, 'Lechuga crespa verde', 'Huerta Agroecológica El Guayacán · Milagro · Hojas verdes hidropónicas crujientes y limpias', 0.35, 'unidad', 50, true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80'),
    (19, '00000000-0000-0000-0000-000000000005', 2, 'Lechuga romana', 'Hacienda San José · Daule · Cogollo tierno de lechuga romana de cultivo natural', 0.38, 'unidad', 42, true, 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80'),
    (20, '00000000-0000-0000-0000-000000000004', 2, 'Espinaca baby de huerta', 'Huerta Agroecológica El Guayacán · Milagro · Hojas tiernas de espinaca cosechadas a mano', 0.45, '300g', 35, true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'),
    (21, '00000000-0000-0000-0000-000000000004', 2, 'Acelga arcoíris orgánica', 'Huerta Agroecológica El Guayacán · Milagro · Pencas y hojas verdes tiernas ricas en hierro', 0.4, 'atado', 28, true, 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80'),
    (22, '00000000-0000-0000-0000-000000000005', 2, 'Cilantro fresco de huerta', 'Hacienda San José · Daule · Manojo aromático fresco cosechado el día de la entrega', 0.25, 'manojo', 60, true, 'https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80'),
    (23, '00000000-0000-0000-0000-000000000004', 2, 'Albahaca genovesa', 'Huerta Agroecológica El Guayacán · Milagro · Hojas aromáticas intensas para salsas y pastas', 0.3, 'manojo', 30, true, 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80'),
    (24, '00000000-0000-0000-0000-000000000005', 2, 'Brócoli campesino', 'Hacienda San José · Daule · Cabezas compactas de brócoli verde recién cortadas', 0.55, 'unidad', 32, true, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80'),
    (2, '00000000-0000-0000-0000-000000000004', 3, 'Aguacate Hass', 'Huerta Agroecológica El Guayacán · Milagro · Aguacates cremosos madurados en el árbol', 0.85, 'kg', 42, true, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80'),
    (4, '00000000-0000-0000-0000-000000000004', 3, 'Fresas de temporada', 'Huerta Agroecológica El Guayacán · Milagro · Fresas seleccionadas a mano cosechadas hoy', 0.8, '500g', 35, true, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'),
    (6, '00000000-0000-0000-0000-000000000004', 3, 'Banano criollo de ladera', 'Huerta Agroecológica El Guayacán · Milagro · Banano dulce de maduración natural sin carburo', 0.38, 'kg', 40, true, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80'),
    (25, '00000000-0000-0000-0000-000000000006', 3, 'Plátano verde barraganete', 'Asociación Don Jorge · Naranjal · Plátano verde de primera para bolones, patacones y caldos', 0.35, 'racimo 5 un', 65, true, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80'),
    (26, '00000000-0000-0000-0000-000000000006', 3, 'Plátano maduro dulce', 'Asociación Don Jorge · Naranjal · Maduro de textura suave ideal para asar o empanadas', 0.35, 'racimo 5 un', 55, true, 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80'),
    (27, '00000000-0000-0000-0000-000000000004', 3, 'Piña dulce Golden', 'Huerta Agroecológica El Guayacán · Milagro · Piña jugosa de pulpa amarilla miel', 0.75, 'unidad', 30, true, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80'),
    (28, '00000000-0000-0000-0000-000000000005', 3, 'Papaya hawaiana de huerta', 'Hacienda San José · Daule · Papaya aromática de pulpa roja suave y digestiva', 0.65, 'unidad', 25, true, 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80'),
    (29, '00000000-0000-0000-0000-000000000005', 3, 'Mango Tommy Atkins', 'Hacienda San José · Daule · Mangos carnosos y aromáticos de los huertos del Litoral', 0.5, 'kg', 48, true, 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80'),
    (30, '00000000-0000-0000-0000-000000000004', 3, 'Naranja valenciana para jugo', 'Huerta Agroecológica El Guayacán · Milagro · Naranjas jugosas cosechadas de árboles maduros', 0.4, 'malla 12 un', 50, true, 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80'),
    (31, '00000000-0000-0000-0000-000000000005', 3, 'Limón sutil criollo', 'Hacienda San José · Daule · Limón verde aromático de acidez limpia para ceviches y aliños', 0.3, 'funda 15 un', 60, true, 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80'),
    (32, '00000000-0000-0000-0000-000000000004', 3, 'Mandarina criolla de temporada', 'Huerta Agroecológica El Guayacán · Milagro · Mandarinas fáciles de pelar y muy dulces', 0.45, 'kg', 38, true, 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80'),
    (33, '00000000-0000-0000-0000-000000000006', 3, 'Maracuyá de la costa', 'Asociación Don Jorge · Naranjal · Fruta de la pasión con pulpa densa y aroma tropical vibrante', 0.48, 'kg', 35, true, 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=600&q=80'),
    (34, '00000000-0000-0000-0000-000000000005', 3, 'Sandía baby dulce', 'Hacienda San José · Daule · Sandías personales refrescantes con pocas semillas', 0.7, 'unidad', 20, true, 'https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=600&q=80'),
    (35, '00000000-0000-0000-0000-000000000005', 3, 'Melón cantaloupe', 'Hacienda San José · Daule · Melón dulce de pulpa salmón jugosa y corteza enmallada', 0.65, 'unidad', 22, true, 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80'),
    (7, '00000000-0000-0000-0000-000000000006', 4, 'Queso campesino artesanal', 'Asociación Don Jorge · Naranjal · Elaborado en finca con leche fresca de vacas en pastoreo libre', 0.75, '500g', 25, true, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80'),
    (8, '00000000-0000-0000-0000-000000000006', 4, 'Yogur de pastoreo', 'Asociación Don Jorge · Naranjal · Yogur natural sin azúcar añadida ni espesantes artificiales', 0.65, '1L', 20, true, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'),
    (36, '00000000-0000-0000-0000-000000000006', 4, 'Queso madurado de finca', 'Asociación Don Jorge · Naranjal · Queso curado 45 días con corteza natural y sabor profundo', 0.95, '400g', 18, true, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80'),
    (37, '00000000-0000-0000-0000-000000000006', 4, 'Leche entera de pastoreo', 'Asociación Don Jorge · Naranjal · Leche pura entera pasteurizada en botella de vidrio retornable', 0.55, '1L', 35, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'),
    (38, '00000000-0000-0000-0000-000000000006', 4, 'Yogur artesanal de frutos rojos', 'Asociación Don Jorge · Naranjal · Yogur cremoso batido con pulpa de mora y fresa natural', 0.72, '1L', 22, true, 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80'),
    (39, '00000000-0000-0000-0000-000000000004', 4, 'Huevos criollos de pastoreo', 'Huerta Agroecológica El Guayacán · Milagro · Huevos frescos de gallinas libres de jaula con yema dorada', 0.75, 'cubeta 15 un', 40, true, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'),
    (40, '00000000-0000-0000-0000-000000000006', 4, 'Mantequilla de campo artesanal', 'Asociación Don Jorge · Naranjal · Batida con crema de leche fresca y toque de sal marina', 0.6, '250g', 25, true, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80'),
    (41, '00000000-0000-0000-0000-000000000006', 4, 'Cuajada fresca tradicional', 'Asociación Don Jorge · Naranjal · Cuajada tierna de leche pura de ordeño de la mañana', 0.65, '500g', 16, true, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80'),
    (9, '00000000-0000-0000-0000-000000000006', 5, 'Miel de abeja silvestre', 'Asociación Don Jorge · Naranjal · Miel 100% cruda cosechada en colmenas de bosque nativo', 0.88, '350g', 25, true, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80'),
    (10, '00000000-0000-0000-0000-000000000006', 5, 'Mermelada artesanal de mora', 'Asociación Don Jorge · Naranjal · Elaborada en paila de cobre con moras frescas y panela', 0.6, '280g', 30, true, 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80'),
    (42, '00000000-0000-0000-0000-000000000006', 5, 'Polen de flores nativas', 'Asociación Don Jorge · Naranjal · Polen apícola multicolor seco recogido en floraciones silvestres', 0.8, '180g', 18, true, 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=600&q=80'),
    (43, '00000000-0000-0000-0000-000000000006', 5, 'Cacao fino de aroma 100%', 'Asociación Don Jorge · Naranjal · Pasta pura de cacao nacional fino de aroma sin aditivos', 0.75, '250g', 30, true, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80'),
    (44, '00000000-0000-0000-0000-000000000006', 5, 'Panela granulada orgánica', 'Asociación Don Jorge · Naranjal · Endulzante de jugo puro de caña evaporado artesanalmente', 0.5, '500g', 40, true, 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80'),
    (45, '00000000-0000-0000-0000-000000000006', 5, 'Café de especialidad de altura', 'Asociación Don Jorge · Naranjal · Granos arábica seleccionados con tostión media artesanal', 0.9, '340g', 25, true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'),
    (46, '00000000-0000-0000-0000-000000000006', 5, 'Chocolate artesanal al 70%', 'Asociación Don Jorge · Naranjal · Barra de chocolate amargo campesino elaborado en finca', 0.65, '100g', 35, true, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO UPDATE SET
    producer_id = EXCLUDED.producer_id,
    category_id = EXCLUDED.category_id,
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

-- =============================================================================
-- 9. Tabla de Solicitudes de Cambio de Correo ('public.email_change_requests')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_change_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    current_email text NOT NULL,
    new_email text NOT NULL,
    verification_token text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
    created_at timestamptz NOT NULL DEFAULT now(),
    confirmation_url text,
    verification_url text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_change_requests_token 
ON public.email_change_requests (verification_token);

ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select email_change_requests" ON public.email_change_requests;
CREATE POLICY "Permitir select email_change_requests" ON public.email_change_requests FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert email_change_requests" ON public.email_change_requests;
CREATE POLICY "Permitir insert email_change_requests" ON public.email_change_requests FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update email_change_requests" ON public.email_change_requests;
CREATE POLICY "Permitir update email_change_requests" ON public.email_change_requests FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete email_change_requests" ON public.email_change_requests;
CREATE POLICY "Permitir delete email_change_requests" ON public.email_change_requests FOR DELETE TO public USING (true);

-- =============================================================================
-- 10. Tabla Transitoria de Solicitudes de Cambio de Contraseña (2FA OTP)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.password_change_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_email text NOT NULL,
    new_password_hash text NOT NULL,
    otp_code text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
    attempts int NOT NULL DEFAULT 0,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_change_requests_user 
ON public.password_change_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_password_change_requests_lookup 
ON public.password_change_requests (user_id, otp_code, used);

ALTER TABLE public.password_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select password_change_requests" ON public.password_change_requests;
CREATE POLICY "Permitir select password_change_requests" ON public.password_change_requests FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert password_change_requests" ON public.password_change_requests;
CREATE POLICY "Permitir insert password_change_requests" ON public.password_change_requests FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update password_change_requests" ON public.password_change_requests;
CREATE POLICY "Permitir update password_change_requests" ON public.password_change_requests FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete password_change_requests" ON public.password_change_requests;
CREATE POLICY "Permitir delete password_change_requests" ON public.password_change_requests FOR DELETE TO public USING (true);

GRANT ALL ON TABLE public.password_change_requests TO anon, authenticated, service_role;

-- =============================================================================
-- 11. Tabla de Métodos de Pago Tokenizados ('public.payment_methods')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand text NOT NULL,
    last4 varchar(4) NOT NULL,
    cardholder_name text NOT NULL,
    exp_month int NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
    exp_year int NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id 
ON public.payment_methods (user_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default 
ON public.payment_methods (user_id, is_default);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select payment_methods" ON public.payment_methods;
CREATE POLICY "Permitir select payment_methods" ON public.payment_methods FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert payment_methods" ON public.payment_methods;
CREATE POLICY "Permitir insert payment_methods" ON public.payment_methods FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update payment_methods" ON public.payment_methods;
CREATE POLICY "Permitir update payment_methods" ON public.payment_methods FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete payment_methods" ON public.payment_methods;
CREATE POLICY "Permitir delete payment_methods" ON public.payment_methods FOR DELETE TO public USING (true);

GRANT ALL ON TABLE public.payment_methods TO anon, authenticated, service_role;

-- =============================================================================
-- 12. Tabla de Nodos de Recogida Física ('public.pickup_nodes')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pickup_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL DEFAULT 'Guayaquil',
    schedule text NOT NULL,
    assigned_baskets int DEFAULT 0,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    pickup_schedule text NOT NULL DEFAULT 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de nodos activos" ON public.pickup_nodes;
DROP POLICY IF EXISTS "Permitir select pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Lectura pública de nodos activos"
  ON public.pickup_nodes FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Permitir insert pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir insert pickup_nodes" ON public.pickup_nodes FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir update pickup_nodes" ON public.pickup_nodes FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir delete pickup_nodes" ON public.pickup_nodes FOR DELETE TO public USING (true);

GRANT ALL ON TABLE public.pickup_nodes TO anon, authenticated, service_role;

-- Sembrado inicial de Nodos Estratégicos de Guayaquil
INSERT INTO public.pickup_nodes (id, name, address, city, schedule, pickup_schedule, assigned_baskets, latitude, longitude, is_active)
VALUES
    ('e0177a54-9cbc-4426-a538-1d630f852ac1', 'Sede Urdesa · Espacio Verde', 'Av. Víctor Emilio Estrada y Bálsamos', 'Guayaquil', 'Miércoles y Viernes: 3:00 PM – 7:30 PM', 'Miércoles y Viernes: 3:00 PM – 7:30 PM', 14, -2.1698, -79.9142, true),
    ('65925730-63b5-486f-9dd0-aaac13a0ffe9', 'Sede Puerto Santa Ana · Café del Río', 'Numa Pompilio Llona, Edificio The Point', 'Guayaquil', 'Jueves y Sábado: 8:30 AM – 1:30 PM', 'Jueves y Sábado: 8:30 AM – 1:30 PM', 18, -2.1804, -79.8767, true),
    ('7a6f8f1f-ad1b-4f87-9d7f-58f1d3c5053c', 'Sede Ceibos · Mercado Sostenible', 'Av. del Bombero Km 6.5, Plaza Ceibos', 'Guayaquil', 'Sábados: 8:00 AM – 2:00 PM', 'Sábados: 8:00 AM – 2:00 PM', 22, -2.1729, -79.9546, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    schedule = EXCLUDED.schedule,
    pickup_schedule = EXCLUDED.pickup_schedule,
    assigned_baskets = EXCLUDED.assigned_baskets,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    is_active = EXCLUDED.is_active;

-- =============================================================================
-- 13. Tabla de Direcciones de Domicilio ('public.delivery_addresses')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    label text NOT NULL DEFAULT 'Casa',
    street_address text NOT NULL,
    neighborhood text NOT NULL,
    city text NOT NULL DEFAULT 'Guayaquil',
    delivery_instructions text,
    delivery_fee numeric NOT NULL DEFAULT 8000,
    delivery_schedule text NOT NULL DEFAULT 'Sáb. 7 nov. · 2:00 – 6:00 p. m.',
    is_preferred boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user_id 
ON public.delivery_addresses (user_id);

ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select delivery_addresses" ON public.delivery_addresses;
CREATE POLICY "Permitir select delivery_addresses" ON public.delivery_addresses FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert delivery_addresses" ON public.delivery_addresses;
CREATE POLICY "Permitir insert delivery_addresses" ON public.delivery_addresses FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update delivery_addresses" ON public.delivery_addresses;
CREATE POLICY "Permitir update delivery_addresses" ON public.delivery_addresses FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete delivery_addresses" ON public.delivery_addresses;
CREATE POLICY "Permitir delete delivery_addresses" ON public.delivery_addresses FOR DELETE TO public USING (true);

GRANT ALL ON TABLE public.delivery_addresses TO anon, authenticated, service_role;

-- Columnas de preferencia añadidas a public.profiles:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_pickup_node_id uuid REFERENCES public.pickup_nodes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_delivery_address_id uuid REFERENCES public.delivery_addresses(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_delivery_mode text DEFAULT 'node';

-- =============================================================================
-- 13.1 TABLA: user_preferences (Preferencia activa de entrega por usuario)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivery_mode text NOT NULL DEFAULT 'node' CHECK (delivery_mode IN ('node', 'home', 'NODE_PICKUP', 'HOME_DELIVERY')),
    preferred_node_id uuid REFERENCES public.pickup_nodes(id) ON DELETE SET NULL,
    preferred_address_id uuid REFERENCES public.delivery_addresses(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir all user_preferences" ON public.user_preferences;
CREATE POLICY "Permitir all user_preferences" ON public.user_preferences FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.user_preferences TO anon, authenticated, service_role;

-- =============================================================================
-- 14. TABLA: orders (Órdenes y pedidos confirmados en el marketplace)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number text NOT NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name text,
    customer_email text,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    delivery_type text NOT NULL CHECK (delivery_type IN ('node', 'home', 'NODE_PICKUP', 'HOME_DELIVERY')),
    delivery_location text,
    delivery_estimated_date text,
    preparation_time_estimate text,
    delivery_address_or_node_id uuid,
    payment_method text DEFAULT 'CARD',
    payment_method_type text NOT NULL DEFAULT 'card' CHECK (payment_method_type IN ('card', 'cash_on_delivery', 'pse', 'CARD', 'CASH_ON_DELIVERY')),
    payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_status text NOT NULL DEFAULT 'COMPLETED',
    payment_details jsonb DEFAULT '{}'::jsonb,
    delivery_details jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'confirmed',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select orders" ON public.orders;
CREATE POLICY "Permitir select orders" ON public.orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert orders" ON public.orders;
CREATE POLICY "Permitir insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update orders" ON public.orders;
CREATE POLICY "Permitir update orders" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

-- =============================================================================
-- 15. TABLA: producer_applications (Solicitudes técnicas de acreditación agronómica)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.producer_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name text NOT NULL,
    location text NOT NULL,
    products text NOT NULL,
    whatsapp text NOT NULL,
    status text DEFAULT 'pendiente',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.producer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_insert_producer_applications" ON public.producer_applications;
CREATE POLICY "allow_anon_insert_producer_applications" ON public.producer_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_read_producer_applications" ON public.producer_applications;
CREATE POLICY "allow_read_producer_applications" ON public.producer_applications FOR SELECT TO anon, authenticated USING (true);

GRANT ALL ON TABLE public.producer_applications TO anon, authenticated, service_role;

-- Constraints y defaults para profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE public.profiles ALTER COLUMN avatar_url SET DEFAULT NULL;






