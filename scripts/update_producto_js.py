import os
import json
import re

workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
producto_js_path = os.path.join(workspace_root, 'js', 'producto.js')

with open(os.path.join(workspace_root, 'scripts', 'products_data.json'), 'r', encoding='utf-8') as f:
    all_products = json.load(f)

# Generar DETAILED_PRODUCTS array
detailed = []
for p in all_products:
    farm = "Hacienda San José" if "Daule" in p['origin'] else ("Huerta Agroecológica El Guayacán" if "Milagro" in p['origin'] else "Asociación Don Jorge")
    loc = "Daule, Guayas · a 45 km de tu nodo" if "Daule" in p['origin'] else ("Milagro, Guayas · a 42 km de tu nodo" if "Milagro" in p['origin'] else "Naranjal, Guayas · a 78 km de tu nodo")
    badge_icon = "🌱" if p['category'] == 'verduras' else ("🥑" if p['category'] == 'frutas' else ("🧺" if p['category'] == 'canastas' else ("🧀" if p['category'] == 'lacteos' else "🍯")))
    
    unit_str = p['subtitle'].split(' · ')[0]
    
    item = {
        'id': p['id'],
        'numericId': p['numericId'],
        'title': p['title'],
        'category': p['category'],
        'badge': f"{p['tag']} · Cosecha limpia",
        'badgeIcon': badge_icon,
        'farmName': farm,
        'farmLocation': loc,
        'image': p['image'],
        'subtitle': f"{unit_str} · Selección de temporada",
        'unit': unit_str,
        'unitLabel': f"USD / {unit_str}",
        'price': p['price'],
        'originalPrice': p['originalPrice'],
        'discount': p['discount'],
        'stock': 25,
        'stockText': f"En stock: 25 unidades de {unit_str}",
        'description': p['origin'],
        'care': 'Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.',
        'shippingCost': 0.35
    }
    detailed.append(item)

lines = ["const DETAILED_PRODUCTS = ["]
for item in detailed:
    lines.append("  {")
    for k, v in item.items():
        if v is None:
            lines.append(f"    {k}: null,")
        elif isinstance(v, bool):
            lines.append(f"    {k}: {'true' if v else 'false'},")
        elif isinstance(v, (int, float)):
            lines.append(f"    {k}: {v},")
        else:
            lines.append(f"    {k}: {json.dumps(v, ensure_ascii=False)},")
    lines[-1] = lines[-1].rstrip(',')
    lines.append("  },")
lines[-1] = lines[-1].rstrip(',')
lines.append("];")

detailed_js = "\n".join(lines)

with open(producto_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r'const DETAILED_PRODUCTS = \[[\s\S]*?\n\];'
if re.search(pattern, code):
    code = re.sub(pattern, detailed_js, code, count=1)
    code = code.replace(
        "return 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg';",
        "return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';"
    )
    with open(producto_js_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated DETAILED_PRODUCTS in js/producto.js with {len(detailed)} products!")
else:
    print("WARNING: Pattern not found in js/producto.js")
