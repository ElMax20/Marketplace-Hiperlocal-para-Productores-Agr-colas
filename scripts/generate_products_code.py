import json
import os
from sync_catalog_supabase import PRODUCTS

category_slugs = {1: 'canastas', 2: 'verduras', 3: 'frutas', 4: 'lacteos', 5: 'despensa'}

js_products = []
for p in PRODUCTS:
    cat = category_slugs[p['category_id']]
    slug = (p['title'].lower()
            .replace(' ', '-')
            .replace('&', 'y')
            .replace('á', 'a')
            .replace('é', 'e')
            .replace('í', 'i')
            .replace('ó', 'o')
            .replace('ú', 'u')
            .replace('ñ', 'n')
            .replace('%', '')
            .replace('·', '')
            .strip('-'))
    
    orig_price = round(p['price'] * 1.25, 2)
    has_discount = p['id'] in (1, 2, 3, 4, 16, 21, 27, 39, 44)
    discount_str = '-20%' if has_discount else None
    
    item = {
        'id': slug,
        'numericId': p['id'],
        'producer_id': p['producer_id'],
        'category_id': p['category_id'],
        'title': p['title'],
        'category': cat,
        'tag': 'Cosecha fresca' if cat in ('verduras', 'frutas') else ('Familiar' if cat == 'canastas' else 'Artesanal'),
        'discount': discount_str,
        'image': p['image_url'],
        'subtitle': f"{p['unit']} · Cosecha fresca",
        'origin': p['description'],
        'rating': '0',
        'reviews': 0,
        'price': p['price'],
        'originalPrice': orig_price if has_discount else None,
        'availability': 'Disponible · Cosecha de la semana',
        'distanceKm': 45 if 'Daule' in p['description'] else (42 if 'Milagro' in p['description'] else 78),
        'isOffer': has_discount
    }
    js_products.append(item)

script_dir = os.path.dirname(os.path.abspath(__file__))
out_json = os.path.join(script_dir, 'products_data.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(js_products, f, indent=2, ensure_ascii=False)

print(f"Generated {len(js_products)} items to {out_json}")

# Generar string formateado para JS
js_lines = ["const PRODUCTS_DATA = ["]
for item in js_products:
    js_lines.append("  {")
    for k, v in item.items():
        if v is None:
            js_lines.append(f"    {k}: null,")
        elif isinstance(v, bool):
            js_lines.append(f"    {k}: {'true' if v else 'false'},")
        elif isinstance(v, (int, float)):
            js_lines.append(f"    {k}: {v},")
        else:
            js_lines.append(f"    {k}: {json.dumps(v, ensure_ascii=False)},")
    js_lines[-1] = js_lines[-1].rstrip(',') # remove last comma inside object
    js_lines.append("  },")
js_lines[-1] = js_lines[-1].rstrip(',')
js_lines.append("];")

out_js = os.path.join(script_dir, 'products_data.js')
with open(out_js, 'w', encoding='utf-8') as f:
    f.write("\n".join(js_lines))

print(f"Wrote JS array to {out_js}")

# Generar string formateado para MarketGrid.tsx (DEFAULT_MARKET_PRODUCTS)
ts_lines = ["const DEFAULT_MARKET_PRODUCTS: Product[] = ["]
for item in js_products:
    ts_lines.append("  {")
    ts_lines.append(f"    id: '{item['numericId']}',")
    ts_lines.append(f"    numericId: {item['numericId']},")
    ts_lines.append(f"    producer_id: '{item['producer_id']}',")
    ts_lines.append(f"    category_id: {item['category_id']},")
    ts_lines.append(f"    title: {json.dumps(item['title'], ensure_ascii=False)},")
    ts_lines.append(f"    category: '{item['category']}',")
    ts_lines.append(f"    image: '{item['image']}',")
    ts_lines.append(f"    price: {item['price']},")
    ts_lines.append(f"    originalPrice: {item['originalPrice'] if item['originalPrice'] is not None else 'null'},")
    ts_lines.append(f"    subtitle: {json.dumps(item['subtitle'], ensure_ascii=False)},")
    ts_lines.append(f"    origin: {json.dumps(item['origin'], ensure_ascii=False)},")
    ts_lines.append("    is_available: true,")
    ts_lines.append("    is_active: true,")
    ts_lines.append(f"    stock_quantity: 40,")
    ts_lines.append(f"    unit: '{item['subtitle'].split(' · ')[0]}'")
    ts_lines.append("  },")
ts_lines[-1] = ts_lines[-1].rstrip(',')
ts_lines.append("];")

out_ts = os.path.join(script_dir, 'products_data.ts')
with open(out_ts, 'w', encoding='utf-8') as f:
    f.write("\n".join(ts_lines))

print(f"Wrote TS array to {out_ts}")
