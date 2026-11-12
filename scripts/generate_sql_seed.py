import os
from sync_catalog_supabase import PRODUCTS

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
schema_path = os.path.join(workspace_root, 'supabase_schema.sql')

sql_values = []
for p in PRODUCTS:
    desc = p['description'].replace("'", "''")
    title = p['title'].replace("'", "''")
    sql_values.append(f"    ({p['id']}, '{p['producer_id']}', {p['category_id']}, '{title}', '{desc}', {p['price']}, '{p['unit']}', {p['stock_quantity']}, true, '{p['image_url']}')")

sql_section = """-- 6. Sembrado de Productos del Catálogo con URLs de Alta Calidad Unsplash y Precios en USD
INSERT INTO public.products (id, producer_id, category_id, title, description, price, unit, stock_quantity, is_available, image_url)
OVERRIDING SYSTEM VALUE
VALUES
""" + ",\n".join(sql_values) + """
ON CONFLICT (id) DO UPDATE SET
    producer_id = EXCLUDED.producer_id,
    category_id = EXCLUDED.category_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    unit = EXCLUDED.unit,
    stock_quantity = EXCLUDED.stock_quantity,
    is_available = EXCLUDED.is_available,
    image_url = EXCLUDED.image_url;"""

with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
pattern = r'-- 6\. Sembrado de Productos[\s\S]*?-- =============================================================================\n-- 7\. Configuración de Supabase Storage'

replacement = sql_section + "\n\n-- =============================================================================\n-- 7. Configuración de Supabase Storage"

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content, count=1)
    with open(schema_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated supabase_schema.sql with 48 products!")
else:
    print("WARNING: Pattern not found in supabase_schema.sql")
