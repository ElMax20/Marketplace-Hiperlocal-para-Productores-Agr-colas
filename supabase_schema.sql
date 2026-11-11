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
    (1, '00000000-0000-0000-0000-000000000005', 2, 'Tomate de huerta', 'Finca La Esperanza · Choachí · a 32 km', 0.64, 'kg', 85, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg'),
    (2, '00000000-0000-0000-0000-000000000006', 3, 'Aguacate Hass', 'Familia Rojas · La Vega · a 52 km', 0.85, 'kg', 42, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg'),
    (3, '00000000-0000-0000-0000-000000000004', 2, 'Zanahoria de tierra', 'Huerta El Renacer · Subachoque · a 45 km', 0.40, 'kg', 60, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg'),
    (4, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Huerto Familiar', 'Familias de Choachí · Selección de 8 a 10 productos', 0.95, 'canasta', 12, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg'),
    (5, '00000000-0000-0000-0000-000000000004', 1, 'Canasta Agroecológica Esencial', 'Huerta El Renacer · 5 a 6 variedades agroecológicas', 0.70, 'canasta', 8, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg'),
    (6, '00000000-0000-0000-0000-000000000004', 2, 'Acelga de la huerta', 'Huerta El Renacer · Cosechada en la madrugada', 0.35, 'manojo', 0, false, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/acelgas.jpg'),
    (7, '00000000-0000-0000-0000-000000000004', 3, 'Fresas de temporada', 'Huerta El Renacer · Cultivo agroecológico dulce', 0.80, 'caja 500g', 35, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg'),
    (8, '00000000-0000-0000-0000-000000000005', 4, 'Huevos campesinos pastoriles', 'Finca La Esperanza · Gallinas libres de pastoreo', 0.85, 'cubeta 30 u', 25, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/huevos.jpg'),
    (9, '00000000-0000-0000-0000-000000000005', 4, 'Queso campesino de hoja', 'Finca La Esperanza · Elaborado con leche fresca', 0.75, '500g', 18, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso.jpg'),
    (10, '00000000-0000-0000-0000-000000000006', 5, 'Miel pura de abejas nativas', 'Familia Rojas · Cosechada en bosque nativo', 0.88, 'frasco 500g', 30, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel.jpg'),
    (11, '00000000-0000-0000-0000-000000000006', 5, 'Café de origen arábica tostado', 'Familia Rojas · Tueste medio especial', 0.90, 'bolsa 500g', 40, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/cafe.jpg'),
    (12, '00000000-0000-0000-0000-000000000006', 5, 'Panela pulverizada orgánica', 'Familia Rojas · Trapiche tradicional', 0.45, 'bolsa 1kg', 50, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/panela.jpg'),
    (13, '00000000-0000-0000-0000-000000000004', 2, 'Rábanos de temporada', 'Huerta El Renacer · Subachoque', 0.28, 'manojo', 30, true, 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg')
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
    city text NOT NULL DEFAULT 'Bogotá',
    pickup_schedule text NOT NULL DEFAULT 'Sáb. 7 nov. · 8:00 a. m. – 12:00 p. m.',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir select pickup_nodes" ON public.pickup_nodes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insert pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir insert pickup_nodes" ON public.pickup_nodes FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir update pickup_nodes" ON public.pickup_nodes FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete pickup_nodes" ON public.pickup_nodes;
CREATE POLICY "Permitir delete pickup_nodes" ON public.pickup_nodes FOR DELETE TO public USING (true);

GRANT ALL ON TABLE public.pickup_nodes TO anon, authenticated, service_role;

-- =============================================================================
-- 13. Tabla de Direcciones de Domicilio ('public.delivery_addresses')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    label text NOT NULL DEFAULT 'Casa',
    street_address text NOT NULL,
    neighborhood text NOT NULL,
    city text NOT NULL DEFAULT 'Bogotá, D. C.',
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






