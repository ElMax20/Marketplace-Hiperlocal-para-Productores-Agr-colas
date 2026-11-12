import urllib.request
import json
import sys

SUPABASE_URL = "https://hvjqgvplbmshpucnuzfy.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU"

PRODUCER_CARLOS = "00000000-0000-0000-0000-000000000005" # Hacienda San José, Daule (a 45 km)
PRODUCER_ELENA  = "00000000-0000-0000-0000-000000000004" # Huerta Agroecológica El Guayacán, Milagro (a 42 km)
PRODUCER_JORGE  = "00000000-0000-0000-0000-000000000006" # Asociación Don Jorge, Naranjal (a 78 km)

# Catálogo completo de 48 productos agrícolas auténticos
PRODUCTS = [
    # ------------------ CATEGORÍA 1: CANASTAS (IDs 11, 12, 47, 48) ------------------
    {
        "id": 11,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 1,
        "title": "Canasta Huerto Familiar",
        "description": "Hacienda San José · Daule · 8-10 hortalizas, 3 frutas y aromáticas para 3 a 5 personas",
        "price": 0.95,
        "unit": "canasta semanal",
        "stock_quantity": 15,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 12,
        "producer_id": PRODUCER_ELENA,
        "category_id": 1,
        "title": "Canasta Agroecológica Esencial",
        "description": "Huerta Agroecológica El Guayacán · Milagro · 5-6 variedades básicas, frutas y huevos para parejas",
        "price": 0.70,
        "unit": "canasta semanal",
        "stock_quantity": 12,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 47,
        "producer_id": PRODUCER_JORGE,
        "category_id": 1,
        "title": "Canasta Cosecha Campesina",
        "description": "Asociación Don Jorge · Naranjal · Canasta rústica con tubérculos, plátano verde, queso y miel",
        "price": 0.88,
        "unit": "canasta semanal",
        "stock_quantity": 10,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 48,
        "producer_id": PRODUCER_ELENA,
        "category_id": 1,
        "title": "Canasta Huerta & Frutas",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Surtido abundante de frutas tropicales y hortalizas de huerta",
        "price": 0.82,
        "unit": "canasta semanal",
        "stock_quantity": 14,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80"
    },

    # ------------------ CATEGORÍA 2: VERDURAS & HIERBAS (IDs 1, 3, 5, 13, 14-24) ------------------
    {
        "id": 1,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Tomate de huerta",
        "description": "Hacienda San José · Daule · Tomate fresco de huerta campesina libre de agroquímicos",
        "price": 0.64,
        "unit": "kg",
        "stock_quantity": 85,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 3,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Zanahoria de tierra",
        "description": "Hacienda San José · Daule · Zanahorias dulces cosechadas a mano con hojas frescas",
        "price": 0.40,
        "unit": "kg",
        "stock_quantity": 60,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 5,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Papa criolla nativa",
        "description": "Hacienda San José · Daule · Papa criolla seleccionada y lavada de cosecha local",
        "price": 0.52,
        "unit": "kg",
        "stock_quantity": 50,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 13,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Rábanos de temporada",
        "description": "Hacienda San José · Daule · Rábanos frescos y crujientes cosechados al amanecer",
        "price": 0.28,
        "unit": "manojo",
        "stock_quantity": 30,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 14,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Cebolla colorada",
        "description": "Hacienda San José · Daule · Cebolla colorada crocante cosechada en su punto óptimo",
        "price": 0.45,
        "unit": "kg",
        "stock_quantity": 55,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 15,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Cebolla blanca de rama",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Cebollín fresco aromático para refritos y sopas",
        "price": 0.35,
        "unit": "atado",
        "stock_quantity": 40,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 16,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Pimiento verde criollo",
        "description": "Hacienda San José · Daule · Pimientos verdes carnosos de huerta agroecológica",
        "price": 0.42,
        "unit": "kg",
        "stock_quantity": 45,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 17,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Pimiento rojo dulce",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Pimientos rojos madurados al sol del valle",
        "price": 0.48,
        "unit": "kg",
        "stock_quantity": 38,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 18,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Lechuga crespa verde",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Hojas verdes hidropónicas crujientes y limpias",
        "price": 0.35,
        "unit": "unidad",
        "stock_quantity": 50,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 19,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Lechuga romana",
        "description": "Hacienda San José · Daule · Cogollo tierno de lechuga romana de cultivo natural",
        "price": 0.38,
        "unit": "unidad",
        "stock_quantity": 42,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 20,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Espinaca baby de huerta",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Hojas tiernas de espinaca cosechadas a mano",
        "price": 0.45,
        "unit": "300g",
        "stock_quantity": 35,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 21,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Acelga arcoíris orgánica",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Pencas y hojas verdes tiernas ricas en hierro",
        "price": 0.40,
        "unit": "atado",
        "stock_quantity": 28,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 22,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Cilantro fresco de huerta",
        "description": "Hacienda San José · Daule · Manojo aromático fresco cosechado el día de la entrega",
        "price": 0.25,
        "unit": "manojo",
        "stock_quantity": 60,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 23,
        "producer_id": PRODUCER_ELENA,
        "category_id": 2,
        "title": "Albahaca genovesa",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Hojas aromáticas intensas para salsas y pastas",
        "price": 0.30,
        "unit": "manojo",
        "stock_quantity": 30,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 24,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 2,
        "title": "Brócoli campesino",
        "description": "Hacienda San José · Daule · Cabezas compactas de brócoli verde recién cortadas",
        "price": 0.55,
        "unit": "unidad",
        "stock_quantity": 32,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80"
    },

    # ------------------ CATEGORÍA 3: FRUTAS (IDs 2, 4, 6, 25-35) ------------------
    {
        "id": 2,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Aguacate Hass",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Aguacates cremosos madurados en el árbol",
        "price": 0.85,
        "unit": "kg",
        "stock_quantity": 42,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 4,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Fresas de temporada",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Fresas seleccionadas a mano cosechadas hoy",
        "price": 0.80,
        "unit": "500g",
        "stock_quantity": 35,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 6,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Banano criollo de ladera",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Banano dulce de maduración natural sin carburo",
        "price": 0.38,
        "unit": "kg",
        "stock_quantity": 40,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 25,
        "producer_id": PRODUCER_JORGE,
        "category_id": 3,
        "title": "Plátano verde barraganete",
        "description": "Asociación Don Jorge · Naranjal · Plátano verde de primera para bolones, patacones y caldos",
        "price": 0.35,
        "unit": "racimo 5 un",
        "stock_quantity": 65,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 26,
        "producer_id": PRODUCER_JORGE,
        "category_id": 3,
        "title": "Plátano maduro dulce",
        "description": "Asociación Don Jorge · Naranjal · Maduro de textura suave ideal para asar o empanadas",
        "price": 0.35,
        "unit": "racimo 5 un",
        "stock_quantity": 55,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 27,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Piña dulce Golden",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Piña jugosa de pulpa amarilla miel",
        "price": 0.75,
        "unit": "unidad",
        "stock_quantity": 30,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 28,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 3,
        "title": "Papaya hawaiana de huerta",
        "description": "Hacienda San José · Daule · Papaya aromática de pulpa roja suave y digestiva",
        "price": 0.65,
        "unit": "unidad",
        "stock_quantity": 25,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 29,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 3,
        "title": "Mango Tommy Atkins",
        "description": "Hacienda San José · Daule · Mangos carnosos y aromáticos de los huertos del Litoral",
        "price": 0.50,
        "unit": "kg",
        "stock_quantity": 48,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 30,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Naranja valenciana para jugo",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Naranjas jugosas cosechadas de árboles maduros",
        "price": 0.40,
        "unit": "malla 12 un",
        "stock_quantity": 50,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 31,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 3,
        "title": "Limón sutil criollo",
        "description": "Hacienda San José · Daule · Limón verde aromático de acidez limpia para ceviches y aliños",
        "price": 0.30,
        "unit": "funda 15 un",
        "stock_quantity": 60,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 32,
        "producer_id": PRODUCER_ELENA,
        "category_id": 3,
        "title": "Mandarina criolla de temporada",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Mandarinas fáciles de pelar y muy dulces",
        "price": 0.45,
        "unit": "kg",
        "stock_quantity": 38,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 33,
        "producer_id": PRODUCER_JORGE,
        "category_id": 3,
        "title": "Maracuyá de la costa",
        "description": "Asociación Don Jorge · Naranjal · Fruta de la pasión con pulpa densa y aroma tropical vibrante",
        "price": 0.48,
        "unit": "kg",
        "stock_quantity": 35,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 34,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 3,
        "title": "Sandía baby dulce",
        "description": "Hacienda San José · Daule · Sandías personales refrescantes con pocas semillas",
        "price": 0.70,
        "unit": "unidad",
        "stock_quantity": 20,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 35,
        "producer_id": PRODUCER_CARLOS,
        "category_id": 3,
        "title": "Melón cantaloupe",
        "description": "Hacienda San José · Daule · Melón dulce de pulpa salmón jugosa y corteza enmallada",
        "price": 0.65,
        "unit": "unidad",
        "stock_quantity": 22,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80"
    },

    # ------------------ CATEGORÍA 4: LÁCTEOS & HUEVOS (IDs 7, 8, 36-41) ------------------
    {
        "id": 7,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Queso campesino artesanal",
        "description": "Asociación Don Jorge · Naranjal · Elaborado en finca con leche fresca de vacas en pastoreo libre",
        "price": 0.75,
        "unit": "500g",
        "stock_quantity": 25,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 8,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Yogur de pastoreo",
        "description": "Asociación Don Jorge · Naranjal · Yogur natural sin azúcar añadida ni espesantes artificiales",
        "price": 0.65,
        "unit": "1L",
        "stock_quantity": 20,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 36,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Queso madurado de finca",
        "description": "Asociación Don Jorge · Naranjal · Queso curado 45 días con corteza natural y sabor profundo",
        "price": 0.95,
        "unit": "400g",
        "stock_quantity": 18,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 37,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Leche entera de pastoreo",
        "description": "Asociación Don Jorge · Naranjal · Leche pura entera pasteurizada en botella de vidrio retornable",
        "price": 0.55,
        "unit": "1L",
        "stock_quantity": 35,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 38,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Yogur artesanal de frutos rojos",
        "description": "Asociación Don Jorge · Naranjal · Yogur cremoso batido con pulpa de mora y fresa natural",
        "price": 0.72,
        "unit": "1L",
        "stock_quantity": 22,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 39,
        "producer_id": PRODUCER_ELENA,
        "category_id": 4,
        "title": "Huevos criollos de pastoreo",
        "description": "Huerta Agroecológica El Guayacán · Milagro · Huevos frescos de gallinas libres de jaula con yema dorada",
        "price": 0.75,
        "unit": "cubeta 15 un",
        "stock_quantity": 40,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 40,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Mantequilla de campo artesanal",
        "description": "Asociación Don Jorge · Naranjal · Batida con crema de leche fresca y toque de sal marina",
        "price": 0.60,
        "unit": "250g",
        "stock_quantity": 25,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 41,
        "producer_id": PRODUCER_JORGE,
        "category_id": 4,
        "title": "Cuajada fresca tradicional",
        "description": "Asociación Don Jorge · Naranjal · Cuajada tierna de leche pura de ordeño de la mañana",
        "price": 0.65,
        "unit": "500g",
        "stock_quantity": 16,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80"
    },

    # ------------------ CATEGORÍA 5: DESPENSA (IDs 9, 10, 42-46) ------------------
    {
        "id": 9,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Miel de abeja silvestre",
        "description": "Asociación Don Jorge · Naranjal · Miel 100% cruda cosechada en colmenas de bosque nativo",
        "price": 0.88,
        "unit": "350g",
        "stock_quantity": 25,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 10,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Mermelada artesanal de mora",
        "description": "Asociación Don Jorge · Naranjal · Elaborada en paila de cobre con moras frescas y panela",
        "price": 0.60,
        "unit": "280g",
        "stock_quantity": 30,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 42,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Polen de flores nativas",
        "description": "Asociación Don Jorge · Naranjal · Polen apícola multicolor seco recogido en floraciones silvestres",
        "price": 0.80,
        "unit": "180g",
        "stock_quantity": 18,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 43,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Cacao fino de aroma 100%",
        "description": "Asociación Don Jorge · Naranjal · Pasta pura de cacao nacional fino de aroma sin aditivos",
        "price": 0.75,
        "unit": "250g",
        "stock_quantity": 30,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 44,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Panela granulada orgánica",
        "description": "Asociación Don Jorge · Naranjal · Endulzante de jugo puro de caña evaporado artesanalmente",
        "price": 0.50,
        "unit": "500g",
        "stock_quantity": 40,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 45,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Café de especialidad de altura",
        "description": "Asociación Don Jorge · Naranjal · Granos arábica seleccionados con tostión media artesanal",
        "price": 0.90,
        "unit": "340g",
        "stock_quantity": 25,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": 46,
        "producer_id": PRODUCER_JORGE,
        "category_id": 5,
        "title": "Chocolate artesanal al 70%",
        "description": "Asociación Don Jorge · Naranjal · Barra de chocolate amargo campesino elaborado en finca",
        "price": 0.65,
        "unit": "100g",
        "stock_quantity": 35,
        "is_available": True,
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80"
    }
]

def main():
    print(f"Total productos preparados para sincronización: {len(PRODUCTS)}")
    headers = {
        'apikey': ANON_KEY,
        'Authorization': f'Bearer {ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
    }
    
    url = f"{SUPABASE_URL}/rest/v1/products"
    
    # Enviar por lotes o individual para trazabilidad exacta
    success_count = 0
    for p in PRODUCTS:
        req = urllib.request.Request(url, data=json.dumps(p).encode('utf-8'), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    success_count += 1
                    # print(f"✓ [{p['id']}] {p['title']} sincronizado")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode()
            print(f"✗ [{p['id']}] {p['title']} error HTTP {e.code}: {err_body}")
        except Exception as e:
            print(f"✗ [{p['id']}] {p['title']} error: {e}")
            
    print(f"\nResumen: {success_count}/{len(PRODUCTS)} productos actualizados/insertados exitosamente en Supabase.")

if __name__ == '__main__':
    main()
