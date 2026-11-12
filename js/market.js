/**
 * Raíz & Barrio - Mercado de Cercanía
 * Lógica del Catálogo, Filtros, Carrito y Flujo de Usuario (Invitado / Registro Obligatorio)
 */

// =============================================================================
// 1. Base de datos de productos (Coincide exactamente con la imagen de referencia)
// =============================================================================
const PRODUCTS_DATA = [
  {
    id: "canasta-huerto-familiar",
    numericId: 11,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 1,
    title: "Canasta Huerto Familiar",
    category: "canastas",
    tag: "Familiar",
    discount: null,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Cosecha fresca",
    origin: "Hacienda San José · Daule · 8-10 hortalizas, 3 frutas y aromáticas para 3 a 5 personas",
    rating: "0",
    reviews: 0,
    price: 0.95,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "canasta-agroecologica-esencial",
    numericId: 12,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 1,
    title: "Canasta Agroecológica Esencial",
    category: "canastas",
    tag: "Familiar",
    discount: null,
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · 5-6 variedades básicas, frutas y huevos para parejas",
    rating: "0",
    reviews: 0,
    price: 0.7,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "canasta-cosecha-campesina",
    numericId: 47,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 1,
    title: "Canasta Cosecha Campesina",
    category: "canastas",
    tag: "Familiar",
    discount: null,
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Canasta rústica con tubérculos, plátano verde, queso y miel",
    rating: "0",
    reviews: 0,
    price: 0.88,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "canasta-huerta-y-frutas",
    numericId: 48,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 1,
    title: "Canasta Huerta & Frutas",
    category: "canastas",
    tag: "Familiar",
    discount: null,
    image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Surtido abundante de frutas tropicales y hortalizas de huerta",
    rating: "0",
    reviews: 0,
    price: 0.82,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "tomate-de-huerta",
    numericId: 1,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Tomate de huerta",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Tomate fresco de huerta campesina libre de agroquímicos",
    rating: "0",
    reviews: 0,
    price: 0.64,
    originalPrice: 0.8,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: true
  },
  {
    id: "zanahoria-de-tierra",
    numericId: 3,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Zanahoria de tierra",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Zanahorias dulces cosechadas a mano con hojas frescas",
    rating: "0",
    reviews: 0,
    price: 0.4,
    originalPrice: 0.5,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: true
  },
  {
    id: "papa-criolla-nativa",
    numericId: 5,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Papa criolla nativa",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Papa criolla seleccionada y lavada de cosecha local",
    rating: "0",
    reviews: 0,
    price: 0.52,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "rabanos-de-temporada",
    numericId: 13,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Rábanos de temporada",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Cosecha fresca",
    origin: "Hacienda San José · Daule · Rábanos frescos y crujientes cosechados al amanecer",
    rating: "0",
    reviews: 0,
    price: 0.28,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "cebolla-colorada",
    numericId: 14,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Cebolla colorada",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Cebolla colorada crocante cosechada en su punto óptimo",
    rating: "0",
    reviews: 0,
    price: 0.45,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "cebolla-blanca-de-rama",
    numericId: 15,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Cebolla blanca de rama",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=600&q=80",
    subtitle: "atado · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Cebollín fresco aromático para refritos y sopas",
    rating: "0",
    reviews: 0,
    price: 0.35,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "pimiento-verde-criollo",
    numericId: 16,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Pimiento verde criollo",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Pimientos verdes carnosos de huerta agroecológica",
    rating: "0",
    reviews: 0,
    price: 0.42,
    originalPrice: 0.53,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: true
  },
  {
    id: "pimiento-rojo-dulce",
    numericId: 17,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Pimiento rojo dulce",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Pimientos rojos madurados al sol del valle",
    rating: "0",
    reviews: 0,
    price: 0.48,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "lechuga-crespa-verde",
    numericId: 18,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Lechuga crespa verde",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Hojas verdes hidropónicas crujientes y limpias",
    rating: "0",
    reviews: 0,
    price: 0.35,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "lechuga-romana",
    numericId: 19,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Lechuga romana",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Hacienda San José · Daule · Cogollo tierno de lechuga romana de cultivo natural",
    rating: "0",
    reviews: 0,
    price: 0.38,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "espinaca-baby-de-huerta",
    numericId: 20,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Espinaca baby de huerta",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80",
    subtitle: "300g · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Hojas tiernas de espinaca cosechadas a mano",
    rating: "0",
    reviews: 0,
    price: 0.45,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "acelga-arcoiris-organica",
    numericId: 21,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Acelga arcoíris orgánica",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80",
    subtitle: "atado · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Pencas y hojas verdes tiernas ricas en hierro",
    rating: "0",
    reviews: 0,
    price: 0.4,
    originalPrice: 0.5,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: true
  },
  {
    id: "cilantro-fresco-de-huerta",
    numericId: 22,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Cilantro fresco de huerta",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Cosecha fresca",
    origin: "Hacienda San José · Daule · Manojo aromático fresco cosechado el día de la entrega",
    rating: "0",
    reviews: 0,
    price: 0.25,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "albahaca-genovesa",
    numericId: 23,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 2,
    title: "Albahaca genovesa",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Hojas aromáticas intensas para salsas y pastas",
    rating: "0",
    reviews: 0,
    price: 0.3,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "brocoli-campesino",
    numericId: 24,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 2,
    title: "Brócoli campesino",
    category: "verduras",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Hacienda San José · Daule · Cabezas compactas de brócoli verde recién cortadas",
    rating: "0",
    reviews: 0,
    price: 0.55,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "aguacate-hass",
    numericId: 2,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Aguacate Hass",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Aguacates cremosos madurados en el árbol",
    rating: "0",
    reviews: 0,
    price: 0.85,
    originalPrice: 1.06,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: true
  },
  {
    id: "fresas-de-temporada",
    numericId: 4,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Fresas de temporada",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Fresas seleccionadas a mano cosechadas hoy",
    rating: "0",
    reviews: 0,
    price: 0.8,
    originalPrice: 1.0,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: true
  },
  {
    id: "banano-criollo-de-ladera",
    numericId: 6,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Banano criollo de ladera",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Banano dulce de maduración natural sin carburo",
    rating: "0",
    reviews: 0,
    price: 0.38,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "platano-verde-barraganete",
    numericId: 25,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 3,
    title: "Plátano verde barraganete",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80",
    subtitle: "racimo 5 un · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Plátano verde de primera para bolones, patacones y caldos",
    rating: "0",
    reviews: 0,
    price: 0.35,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "platano-maduro-dulce",
    numericId: 26,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 3,
    title: "Plátano maduro dulce",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80",
    subtitle: "racimo 5 un · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Maduro de textura suave ideal para asar o empanadas",
    rating: "0",
    reviews: 0,
    price: 0.35,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "pina-dulce-golden",
    numericId: 27,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Piña dulce Golden",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Piña jugosa de pulpa amarilla miel",
    rating: "0",
    reviews: 0,
    price: 0.75,
    originalPrice: 0.94,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: true
  },
  {
    id: "papaya-hawaiana-de-huerta",
    numericId: 28,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 3,
    title: "Papaya hawaiana de huerta",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Hacienda San José · Daule · Papaya aromática de pulpa roja suave y digestiva",
    rating: "0",
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "mango-tommy-atkins",
    numericId: 29,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 3,
    title: "Mango Tommy Atkins",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Hacienda San José · Daule · Mangos carnosos y aromáticos de los huertos del Litoral",
    rating: "0",
    reviews: 0,
    price: 0.5,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "naranja-valenciana-para-jugo",
    numericId: 30,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Naranja valenciana para jugo",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80",
    subtitle: "malla 12 un · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Naranjas jugosas cosechadas de árboles maduros",
    rating: "0",
    reviews: 0,
    price: 0.4,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "limon-sutil-criollo",
    numericId: 31,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 3,
    title: "Limón sutil criollo",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80",
    subtitle: "funda 15 un · Cosecha fresca",
    origin: "Hacienda San José · Daule · Limón verde aromático de acidez limpia para ceviches y aliños",
    rating: "0",
    reviews: 0,
    price: 0.3,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "mandarina-criolla-de-temporada",
    numericId: 32,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 3,
    title: "Mandarina criolla de temporada",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Mandarinas fáciles de pelar y muy dulces",
    rating: "0",
    reviews: 0,
    price: 0.45,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: false
  },
  {
    id: "maracuya-de-la-costa",
    numericId: 33,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 3,
    title: "Maracuyá de la costa",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Fruta de la pasión con pulpa densa y aroma tropical vibrante",
    rating: "0",
    reviews: 0,
    price: 0.48,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "sandia-baby-dulce",
    numericId: 34,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 3,
    title: "Sandía baby dulce",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Hacienda San José · Daule · Sandías personales refrescantes con pocas semillas",
    rating: "0",
    reviews: 0,
    price: 0.7,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "melon-cantaloupe",
    numericId: 35,
    producer_id: "00000000-0000-0000-0000-000000000005",
    category_id: 3,
    title: "Melón cantaloupe",
    category: "frutas",
    tag: "Cosecha fresca",
    discount: null,
    image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Cosecha fresca",
    origin: "Hacienda San José · Daule · Melón dulce de pulpa salmón jugosa y corteza enmallada",
    rating: "0",
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 45,
    isOffer: false
  },
  {
    id: "queso-campesino-artesanal",
    numericId: 7,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Queso campesino artesanal",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Elaborado en finca con leche fresca de vacas en pastoreo libre",
    rating: "0",
    reviews: 0,
    price: 0.75,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "yogur-de-pastoreo",
    numericId: 8,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Yogur de pastoreo",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Yogur natural sin azúcar añadida ni espesantes artificiales",
    rating: "0",
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "queso-madurado-de-finca",
    numericId: 36,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Queso madurado de finca",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
    subtitle: "400g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Queso curado 45 días con corteza natural y sabor profundo",
    rating: "0",
    reviews: 0,
    price: 0.95,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "leche-entera-de-pastoreo",
    numericId: 37,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Leche entera de pastoreo",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Leche pura entera pasteurizada en botella de vidrio retornable",
    rating: "0",
    reviews: 0,
    price: 0.55,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "yogur-artesanal-de-frutos-rojos",
    numericId: 38,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Yogur artesanal de frutos rojos",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Yogur cremoso batido con pulpa de mora y fresa natural",
    rating: "0",
    reviews: 0,
    price: 0.72,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "huevos-criollos-de-pastoreo",
    numericId: 39,
    producer_id: "00000000-0000-0000-0000-000000000004",
    category_id: 4,
    title: "Huevos criollos de pastoreo",
    category: "lacteos",
    tag: "Artesanal",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80",
    subtitle: "cubeta 15 un · Cosecha fresca",
    origin: "Huerta Agroecológica El Guayacán · Milagro · Huevos frescos de gallinas libres de jaula con yema dorada",
    rating: "0",
    reviews: 0,
    price: 0.75,
    originalPrice: 0.94,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 42,
    isOffer: true
  },
  {
    id: "mantequilla-de-campo-artesanal",
    numericId: 40,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Mantequilla de campo artesanal",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
    subtitle: "250g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Batida con crema de leche fresca y toque de sal marina",
    rating: "0",
    reviews: 0,
    price: 0.6,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "cuajada-fresca-tradicional",
    numericId: 41,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 4,
    title: "Cuajada fresca tradicional",
    category: "lacteos",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Cuajada tierna de leche pura de ordeño de la mañana",
    rating: "0",
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "miel-de-abeja-silvestre",
    numericId: 9,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Miel de abeja silvestre",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    subtitle: "350g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Miel 100% cruda cosechada en colmenas de bosque nativo",
    rating: "0",
    reviews: 0,
    price: 0.88,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "mermelada-artesanal-de-mora",
    numericId: 10,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Mermelada artesanal de mora",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80",
    subtitle: "280g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Elaborada en paila de cobre con moras frescas y panela",
    rating: "0",
    reviews: 0,
    price: 0.6,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "polen-de-flores-nativas",
    numericId: 42,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Polen de flores nativas",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=600&q=80",
    subtitle: "180g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Polen apícola multicolor seco recogido en floraciones silvestres",
    rating: "0",
    reviews: 0,
    price: 0.8,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "cacao-fino-de-aroma-100",
    numericId: 43,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Cacao fino de aroma 100%",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80",
    subtitle: "250g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Pasta pura de cacao nacional fino de aroma sin aditivos",
    rating: "0",
    reviews: 0,
    price: 0.75,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "panela-granulada-organica",
    numericId: 44,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Panela granulada orgánica",
    category: "despensa",
    tag: "Artesanal",
    discount: "-20%",
    image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Endulzante de jugo puro de caña evaporado artesanalmente",
    rating: "0",
    reviews: 0,
    price: 0.5,
    originalPrice: 0.62,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: true
  },
  {
    id: "cafe-de-especialidad-de-altura",
    numericId: 45,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Café de especialidad de altura",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    subtitle: "340g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Granos arábica seleccionados con tostión media artesanal",
    rating: "0",
    reviews: 0,
    price: 0.9,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  },
  {
    id: "chocolate-artesanal-al-70",
    numericId: 46,
    producer_id: "00000000-0000-0000-0000-000000000006",
    category_id: 5,
    title: "Chocolate artesanal al 70%",
    category: "despensa",
    tag: "Artesanal",
    discount: null,
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80",
    subtitle: "100g · Cosecha fresca",
    origin: "Asociación Don Jorge · Naranjal · Barra de chocolate amargo campesino elaborado en finca",
    rating: "0",
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: "Disponible · Cosecha de la semana",
    distanceKm: 78,
    isOffer: false
  }
];

// =============================================================================
// Helper: Normalización de URLs de Imágenes (Garantizar Supabase Storage público)
// =============================================================================
function normalizeProductImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('canasta_agroecologica.jpg')) {
      return clean.replace('canasta_agroecologica.jpg', 'canasta_esencial.jpg');
    }
    if (clean.includes('images.unsplash.com')) {
      try {
        const u = new URL(clean);
        u.searchParams.set('w', '600');
        u.searchParams.set('q', '75');
        u.searchParams.set('auto', 'format');
        return u.toString();
      } catch (e) {
        return clean;
      }
    }
    return clean;
  }
  if (clean.startsWith('assets/images/')) {
    const filename = clean.replace('assets/images/', '');
    const validFile = filename === 'canasta_agroecologica.jpg' ? 'canasta_esencial.jpg' : filename;
    return `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/${validFile}`;
  }
  if (clean.startsWith('assets/')) {
    return `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/${clean}`;
  }
  const filename = clean.replace(/^\/+/, '');
  const validFile = filename === 'canasta_agroecologica.jpg' ? 'canasta_esencial.jpg' : filename;
  return `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/${validFile}`;
}
window.normalizeProductImageUrl = normalizeProductImageUrl;

// =============================================================================
// 2. Estado de la Aplicación
// =============================================================================
let currentCategory = 'todos';
let searchQuery = '';
let offersOnly = false;
let currentSort = 'recomendados';
let cart = [];
let maxDistance = 0;
let weeklyOnly = false;
let priceMin = null;
let priceMax = null;
let farmingPractices = [];
let favorites = [];
let favoritesOnly = false;
let currentProducer = null;

// =============================================================================
// Helper: Manejo de Favoritos Persistentes
// =============================================================================
function initFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem('raiz_favorites');
    favorites = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(favorites)) favorites = [];
  } catch (e) {
    favorites = [];
  }
}

function getFavoriteIndex(productId) {
  if (!productId) return 9999;
  const p = PRODUCTS_DATA.find(item => item.id === productId || String(item.numericId) === String(productId));
  const primaryId = p ? p.id : String(productId);
  const numId = p && p.numericId ? String(p.numericId) : null;
  const idx1 = favorites.indexOf(primaryId);
  if (idx1 !== -1) return idx1;
  if (numId) {
    const idx2 = favorites.indexOf(numId);
    if (idx2 !== -1) return idx2;
  }
  return 9999;
}

function isProductFavorite(productId) {
  if (!productId) return false;
  const p = PRODUCTS_DATA.find(item => item.id === productId || String(item.numericId) === String(productId));
  if (!p) return favorites.includes(String(productId));
  return favorites.includes(p.id) || (p.numericId && favorites.includes(String(p.numericId)));
}

/**
 * Alternar producto en favoritos, colorear corazón y fijar al primer espacio
 */
function toggleProductFavorite(productId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const p = PRODUCTS_DATA.find(item => item.id === productId || String(item.numericId) === String(productId));
  const primaryId = p ? p.id : String(productId);
  const numId = p && p.numericId ? String(p.numericId) : null;

  const isFav = isProductFavorite(primaryId);

  if (isFav) {
    // Quitar de favoritos
    favorites = favorites.filter(id => id !== primaryId && id !== numId);
    if (typeof showToast === 'function') {
      showToast(`${p ? p.title : 'Producto'} eliminado de favoritos`);
    }
  } else {
    // Agregar al inicio para fijarlo en el primer espacio del catálogo
    favorites = favorites.filter(id => id !== primaryId && id !== numId);
    favorites.unshift(primaryId);
    if (typeof showToast === 'function') {
      showToast(`❤️ ¡${p ? p.title : 'Producto'} fijado en el primer espacio del catálogo!`);
    }
  }

  try {
    localStorage.setItem('raiz_favorites', JSON.stringify(favorites));
  } catch (e) {}

  renderProducts();
}
window.toggleProductFavorite = toggleProductFavorite;
window.isProductFavorite = isProductFavorite;
window.getFavoriteIndex = getFavoriteIndex;

// =============================================================================
// Helper: Estadísticas de Valoración y Opiniones Sincronizadas
// =============================================================================
function getProductReviewStats(productId) {
  if (!productId) {
    return { rating: 0, ratingDisplay: '0', reviewsCount: 0, hasReviews: false };
  }

  const p = PRODUCTS_DATA.find(item => item.id === productId || String(item.numericId) === String(productId));
  const primaryId = p ? p.id : String(productId);
  const numId = p && p.numericId ? String(p.numericId) : null;

  let reviews = [];
  try {
    let raw = localStorage.getItem(`product_reviews_${primaryId}`);
    if (!raw && numId) {
      raw = localStorage.getItem(`product_reviews_${numId}`);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        reviews = parsed.filter(r => !String(r.id).startsWith('mock-'));
      }
    }
  } catch (e) {
    reviews = [];
  }

  const count = reviews.length;
  if (count === 0) {
    return {
      rating: 0,
      ratingDisplay: '0',
      reviewsCount: 0,
      hasReviews: false
    };
  }

  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avgNumeric = Number((sum / count).toFixed(1));
  const avgStr = avgNumeric.toFixed(1).replace('.', ',');

  return {
    rating: avgNumeric,
    ratingDisplay: avgStr,
    reviewsCount: count,
    hasReviews: true
  };
}
window.getProductReviewStats = getProductReviewStats;

// =============================================================================
// 3. Inicialización
// =============================================================================
function initMarketApp() {
  try { initFavoritesFromStorage(); } catch (e) { console.warn('Error initFavorites:', e); }
  try { initCartFromStorage(); } catch (e) { console.warn('Error initCart:', e); }
  try { if (typeof checkAuthStatus === 'function') checkAuthStatus(); } catch (e) { console.warn('Error checkAuth:', e); }
  try { if (typeof initHeaderLocationSelector === 'function') initHeaderLocationSelector(); } catch (e) { console.warn('Error initHeaderLocation:', e); }
  try { parseUrlParams(); } catch (e) { console.warn('Error parseUrlParams:', e); }
  try { renderProducts(); } catch (e) { console.error('Error renderProducts:', e); }
  try { setupCartDrawerListeners(); } catch (e) { console.warn('Error setupCartDrawerListeners:', e); }
  try { setupSearchListener(); } catch (e) { console.warn('Error setupSearchListener:', e); }
  try { loadProductsFromSupabase(); } catch (e) { console.warn('Error loadProductsFromSupabase:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarketApp);
} else {
  initMarketApp();
}

// Sincronización en vivo de valoraciones y favoritos al regresar a la pestaña o recibir cambios
window.addEventListener('storage', (e) => {
  if (e.key && (e.key.startsWith('product_reviews_') || e.key === 'raiz_favorites')) {
    initFavoritesFromStorage();
    renderProducts();
  }
});

window.addEventListener('focus', () => {
  renderProducts();
});

// Cargar catálogo en tiempo real desde Supabase con consulta limpia y directa
async function loadProductsFromSupabase() {
  if (!window.supabase) return;

  try {
    let dbProducts = null;

    // 1. Consulta limpia y directa con Supabase Client según requerimiento:
    // const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (typeof window.supabase.from === 'function') {
      const { data, error } = await window.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        dbProducts = data;
      } else if (error) {
        console.warn('Aviso en supabase.from("products"):', error);
      }
    }

    // 2. Fallback con getProducts si no retornó desde .from()
    if (!dbProducts && typeof window.supabase.getProducts === 'function') {
      dbProducts = await window.supabase.getProducts();
    }

    if (dbProducts && Array.isArray(dbProducts) && dbProducts.length > 0) {
      const categoryMap = { 1: 'canastas', 2: 'verduras', 3: 'frutas', 4: 'lacteos', 5: 'despensa' };

      dbProducts.forEach(dbP => {
        const catName = categoryMap[dbP.category_id] || 'verduras';
        const existingIdx = PRODUCTS_DATA.findIndex(p => 
          String(p.id) === String(dbP.id) || 
          (p.numericId && Number(p.numericId) === Number(dbP.id)) ||
          p.title.toLowerCase() === dbP.title.toLowerCase()
        );

        const normalizedImg = normalizeProductImageUrl(dbP.image_url);
        const priceNum = Number(dbP.price);
        const origPrice = Math.round(priceNum * 1.15 * 100) / 100;
        const isAvail = (dbP.is_available !== undefined) ? dbP.is_available : (dbP.is_active ?? true);

        if (existingIdx !== -1) {
          // Preservar el slug ID original (ej: 'tomate-huerta') para mantener coherencia en las URLs
          PRODUCTS_DATA[existingIdx] = {
            ...PRODUCTS_DATA[existingIdx],
            numericId: dbP.id,
            title: dbP.title,
            category: catName,
            image: normalizedImg,
            price: priceNum,
            originalPrice: origPrice,
            subtitle: `${dbP.unit || 'kg'} · Cosechado en finca`,
            origin: dbP.description || PRODUCTS_DATA[existingIdx].origin,
            availability: isAvail ? 'Disponible · Supabase' : 'Agotado'
          };
        } else {
          PRODUCTS_DATA.push({
            id: String(dbP.id),
            numericId: dbP.id,
            title: dbP.title,
            category: catName,
            tag: 'Cosecha fresca',
            image: normalizedImg,
            subtitle: `${dbP.unit || 'kg'} · Cosechado en finca`,
            origin: dbP.description || 'Finca campesina aliada',
            rating: '0',
            reviews: 0,
            price: priceNum,
            originalPrice: origPrice,
            availability: isAvail ? 'Disponible · Supabase' : 'Agotado',
            distanceKm: 38,
            isOffer: false
          });
        }
      });

      renderProducts();
      console.log(`Catálogo sincronizado exitosamente desde Supabase (${dbProducts.length} productos).`);
    }
  } catch (e) {
    console.warn('Error cargando productos de Supabase:', e);
  }
}

// Leer parámetros de URL (por ejemplo si viene de "Explorar Canastas" -> ?categoria=canastas o Comprar Ahora -> ?checkout=1)
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('categoria') || params.get('cat');
  if (cat) {
    currentCategory = cat;
    highlightCategoryButton(cat);
  }

  // Si viene del botón "Comprar ahora" de la ficha de producto
  const isCheckout = params.get('checkout') === '1' || params.get('checkout') === 'true' || params.get('pago') === '1';
  if (isCheckout) {
    setTimeout(() => {
      initCartFromStorage();
      openCheckoutModal(getCurrentUser());
    }, 250);
  }

  // Si viene con filtro de favoritos (ej: desde perfil)
  const favParam = params.get('favoritos') || params.get('fav');
  if (favParam === '1' || favParam === 'true') {
    favoritesOnly = true;
  }

  // Si viene con filtro de productor/finca (ej: ?productor=hacienda-san-jose o el-guayacan o don-jorge)
  const prodParam = params.get('productor') || params.get('finca');
  if (prodParam) {
    currentProducer = prodParam.toLowerCase();
  }

  // Si viene con solicitud de login (ej: tras cambiar contraseña con 2FA)
  const isAuth = params.get('openAuth') === '1' || params.get('login') === '1';
  if (isAuth) {
    setTimeout(() => {
      if (typeof openAuthModal === 'function') {
        openAuthModal('login');
      }
    }, 250);
  }
}

function clearProducerFilter() {
  currentProducer = null;
  const url = new URL(window.location);
  url.searchParams.delete('productor');
  url.searchParams.delete('finca');
  window.history.replaceState({}, '', url);
  renderProducts();
}
window.clearProducerFilter = clearProducerFilter;

// =============================================================================
// 4. Renderizado y Filtro de Productos
// =============================================================================
function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const producerBanner = document.getElementById('producer-filter-banner');
  const producerTitle = document.getElementById('producer-filter-title');
  if (producerBanner) {
    if (currentProducer) {
      let displayName = 'Finca Campesina';
      if (currentProducer.includes('san-jose') || currentProducer.includes('daule') || currentProducer.includes('alvarado')) {
        displayName = 'Hacienda San José · Familia Alvarado (Daule · 45 km)';
      } else if (currentProducer.includes('guayacan') || currentProducer.includes('milagro')) {
        displayName = 'Huerta Agroecológica El Guayacán (Milagro · 42 km)';
      } else if (currentProducer.includes('don-jorge') || currentProducer.includes('naranjal')) {
        displayName = 'Asociación Don Jorge (Naranjal · 78 km)';
      } else {
        displayName = currentProducer.replace(/-/g, ' ').toUpperCase();
      }
      if (producerTitle) producerTitle.textContent = displayName;
      producerBanner.classList.remove('hidden');
    } else {
      producerBanner.classList.add('hidden');
    }
  }

  let filtered = PRODUCTS_DATA.filter(p => {
    // Filtro por Productor / Finca
    if (currentProducer) {
      const orig = (p.origin || '').toLowerCase();
      const tit = (p.title || '').toLowerCase();
      const sub = (p.subtitle || '').toLowerCase();
      const combined = `${orig} ${tit} ${sub}`;

      if (currentProducer.includes('san-jose') || currentProducer.includes('daule') || currentProducer.includes('alvarado')) {
        if (!combined.includes('san josé') && !combined.includes('san jose') && !combined.includes('daule') && !combined.includes('alvarado')) {
          return false;
        }
      } else if (currentProducer.includes('guayacan') || currentProducer.includes('milagro')) {
        if (!combined.includes('guayacán') && !combined.includes('guayacan') && !combined.includes('milagro')) {
          return false;
        }
      } else if (currentProducer.includes('don-jorge') || currentProducer.includes('naranjal')) {
        if (!combined.includes('don jorge') && !combined.includes('naranjal') && !combined.includes('cacao')) {
          return false;
        }
      } else {
        const cleanP = currentProducer.replace(/-/g, ' ');
        if (!combined.includes(cleanP)) {
          return false;
        }
      }
    }

    // Categoría
    if (currentCategory !== 'todos' && p.category !== currentCategory) {
      return false;
    }
    // Favoritos únicamente (si está activo el filtro de favoritos)
    if (favoritesOnly && !isProductFavorite(p.id)) {
      return false;
    }
    // Ofertas
    if (offersOnly && !p.isOffer) {
      return false;
    }
    // Búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchOrigin = (p.origin || '').toLowerCase().includes(q);
      const matchSub = (p.subtitle || '').toLowerCase().includes(q);
      if (!matchTitle && !matchOrigin && !matchSub) return false;
    }
    // Disponibles esta semana
    if (weeklyOnly) {
      const avail = (p.availability || '').toLowerCase();
      if (avail.includes('agotado') || avail.includes('no disponible')) return false;
    }
    // Distancia máxima
    if (maxDistance > 0 && typeof p.distanceKm === 'number' && p.distanceKm > maxDistance) {
      return false;
    }
    // Rango de precio
    if (priceMin !== null && p.price < priceMin) {
      return false;
    }
    if (priceMax !== null && p.price > priceMax) {
      return false;
    }
    // Prácticas de cultivo y elaboración
    if (farmingPractices && farmingPractices.length > 0) {
      const text = `${p.tag || ''} ${p.origin || ''} ${p.subtitle || ''}`.toLowerCase();
      for (const practice of farmingPractices) {
        if (practice === 'agro' && !text.includes('agro') && !text.includes('cosecha') && !text.includes('huerta')) return false;
        if (practice === 'nochem' && !text.includes('pura') && !text.includes('fresca') && !text.includes('temporada')) return false;
        if (practice === 'artesanal' && !text.includes('artesanal') && !text.includes('familia') && !text.includes('apiario')) return false;
      }
    }
    return true;
  });

  // Ordenamiento base seleccionado por el usuario
  if (currentSort === 'precio-menor') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'precio-mayor') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'calificacion') {
    filtered.sort((a, b) => {
      const aStats = getProductReviewStats(a.id);
      const bStats = getProductReviewStats(b.id);
      return bStats.rating - aStats.rating;
    });
  }

  // FIJAR PRODUCTOS FAVORITOS EN EL PRIMER ESPACIO DEL CATÁLOGO
  // Los productos con corazón activo se ubican en la primera posición (index 0, 1, ...)
  filtered.sort((a, b) => {
    const aFav = isProductFavorite(a.id);
    const bFav = isProductFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    if (aFav && bFav) {
      return getFavoriteIndex(a.id) - getFavoriteIndex(b.id);
    }
    return 0;
  });

  // Actualizar etiqueta de conteo
  const countLabel = document.getElementById('products-count-label');
  if (countLabel) {
    countLabel.textContent = `${filtered.length} productos para tu próxima entrega`;
  }

  // Actualizar etiqueta de paginación inferior
  const paginationLabel = document.getElementById('products-pagination-label');
  if (paginationLabel) {
    const showingMax = Math.min(filtered.length, 12);
    paginationLabel.textContent = filtered.length > 0 
      ? `Mostrando 1–${showingMax} de ${filtered.length} productos` 
      : 'Mostrando 0 de 0 productos';
  }

  // Actualizar contadores de categorías en la barra lateral
  updateCategoryBadgesCounts();

  // Actualizar interfaz reactiva de filtros activos y botones de limpiar
  updateActiveFiltersUI();

  if (filtered.length === 0) {
    if (favoritesOnly) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-16 h-16 rounded-full bg-rose-50 text-[#c85a32] flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">❤️</div>
          <h4 class="font-serif text-lg font-bold text-stone-700">Aún no tienes cosechas favoritas fijadas</h4>
          <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Haz clic en el corazón de cualquier producto en el mercado para colorearlo y fijarlo en el primer espacio de tu catálogo.</p>
          <button onclick="removeFavoritesFilter()" class="mt-4 px-5 py-2 bg-[#1a3d2f] text-white rounded-full text-xs font-bold hover:bg-[#255240] transition cursor-pointer shadow-sm">
            Ver todas las cosechas
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3 text-2xl">🌱</div>
        <h4 class="font-serif text-lg font-bold text-stone-700">No encontramos cosechas con esos filtros</h4>
        <p class="text-xs text-stone-500 mt-1">Prueba seleccionando otra categoría o limpiando tus filtros.</p>
        <button onclick="resetFilters()" class="mt-4 px-5 py-2 bg-[#1a3d2f] text-white rounded-full text-xs font-bold hover:bg-[#255240] transition cursor-pointer shadow-sm">
          Limpiar todos los filtros
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((p, index) => {
    const itemInCart = cart.find(item => String(item.id) === String(p.id));
    const cartQty = itemInCart ? itemInCart.quantity : 0;
    const isFav = isProductFavorite(p.id);
    const stats = getProductReviewStats(p.id);

    return `
      <div 
        class="product-card bg-white rounded-2xl border ${isFav ? 'border-[#c85a32]/40 ring-1 ring-[#c85a32]/20' : 'border-stone-200'} overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-stone-300 relative"
        style="contain: content;"
        onclick="openProductDetailPage('${p.id}', event)"
      >
        
        <!-- Contenedor de Imagen y Badges -->
        <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
          <img 
            src="${normalizeProductImageUrl(p.image)}" 
            alt="${p.title || 'Producto'}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="${index < 4 ? 'eager' : 'lazy'}"
            decoding="async"
            onerror="this.src='https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg'"
          >

          <!-- Tag Superior Izquierdo -->
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
            ${isFav ? `
              <span class="bg-[#c85a32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <span>❤️</span><span>Fijado</span>
              </span>
            ` : ''}
            <span class="bg-white/95 border border-stone-200/80 text-[#1a3d2f] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ${p.tag || 'Cosecha fresca'}
            </span>
          </div>

          <!-- Botón Favorito Superior Derecho -->
          <button 
            type="button"
            onclick="toggleProductFavorite('${p.id}', event)" 
            class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-20 cursor-pointer ${
              isFav 
                ? 'bg-white text-[#c85a32] ring-2 ring-[#c85a32]/30 scale-105 hover:scale-115' 
                : 'bg-white/95 border border-stone-200/80 text-stone-400 hover:text-[#c85a32] hover:bg-white hover:scale-110'
            }"
            title="${isFav ? 'Quitar de favoritos' : 'Fijar en el primer espacio de favoritos'}"
            aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
          >
            ${isFav ? `
              <!-- Corazón completamente coloreado y relleno -->
              <svg class="w-4 h-4 text-[#c85a32] fill-[#c85a32] stroke-[#c85a32]" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            ` : `
              <!-- Corazón silueta / contorno vacío -->
              <svg class="w-4 h-4 text-stone-400 hover:text-[#c85a32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            `}
          </button>

          <!-- Badge Descuento Inferior Derecho -->
          ${p.discount ? `
            <span class="absolute bottom-2.5 right-2.5 bg-[#c85a32] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
              ${p.discount}
            </span>
          ` : ''}
        </div>

        <!-- Información del Producto -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-stone-900 text-sm group-hover:text-[#1a3d2f] transition">${p.title || 'Producto'}</h3>
            <p class="text-[11px] text-stone-500 mt-0.5">${p.subtitle || 'Cosechado en finca'}</p>
            <p class="text-[10px] text-stone-400 mt-1">${p.origin || 'Finca local de Guayas'}</p>

            <div class="flex items-center gap-1.5 mt-2 text-xs">
              <span class="${stats.hasReviews ? 'text-amber-500' : 'text-stone-400'} font-bold">★ ${stats.ratingDisplay}</span>
              <span class="text-stone-400 text-[10px]">(${stats.reviewsCount})</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-stone-100">
            <div class="flex items-baseline gap-2 mb-1">
              <span class="text-base font-bold text-stone-900">$${formatCOP(p.price)}</span>
              ${p.originalPrice ? `
                <span class="text-xs text-stone-400 line-through">$${formatCOP(p.originalPrice)}</span>
              ` : ''}
            </div>

            <p class="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mb-3">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>${p.availability || 'Disponible'}</span>
            </p>

            <!-- Botón de Compra / Carrito -->
            ${cartQty > 0 ? `
              <div class="w-full flex items-center justify-between bg-stone-100 rounded-full px-2 py-1 text-xs font-bold text-[#1a3d2f]" onclick="event.stopPropagation()">
                <button type="button" onclick="event.stopPropagation(); decrementProduct('${p.id}')" class="w-7 h-7 rounded-full bg-white hover:bg-stone-200 flex items-center justify-center text-sm shadow-sm transition">-</button>
                <span>${cartQty} en tu carrito</span>
                <button type="button" onclick="event.stopPropagation(); incrementProduct('${p.id}')" class="w-7 h-7 rounded-full bg-white hover:bg-stone-200 flex items-center justify-center text-sm shadow-sm transition">+</button>
              </div>
            ` : `
              <button 
                type="button"
                onclick="event.stopPropagation(); addProductToCart('${p.id}')" 
                class="w-full bg-[#1a3d2f] hover:bg-[#255240] text-white text-xs font-bold py-2.5 rounded-full transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>+ Añadir</span>
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  }).join('');
}

// =============================================================================
// 5. Manejo de Filtros y Búsqueda Reactiva
// =============================================================================
function setCategoryFilter(category) {
  currentCategory = category;
  highlightCategoryButton(category);
  renderProducts();
}

function highlightCategoryButton(category) {
  const buttons = ['todos', 'canastas', 'verduras', 'frutas', 'lacteos', 'despensa'];
  buttons.forEach(cat => {
    const btn = document.getElementById(`cat-btn-${cat}`);
    if (btn) {
      if (cat === category) {
        btn.className = "w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold bg-[#1a3d2f] text-white transition text-left shadow-2xs";
      } else {
        btn.className = "w-full flex items-center justify-between px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 transition text-left font-medium";
      }
    }
  });
}

function toggleOffersOnly() {
  const checkbox = document.getElementById('filter-offers');
  offersOnly = checkbox ? checkbox.checked : false;
  renderProducts();
}

function removeOffersFilter() {
  offersOnly = false;
  const checkbox = document.getElementById('filter-offers');
  if (checkbox) checkbox.checked = false;
  renderProducts();
}

function toggleWeeklyOnly() {
  const checkbox = document.getElementById('filter-weekly');
  weeklyOnly = checkbox ? checkbox.checked : false;
  renderProducts();
}

function removeWeeklyFilter() {
  weeklyOnly = false;
  const checkbox = document.getElementById('filter-weekly');
  if (checkbox) checkbox.checked = false;
  renderProducts();
}

function setDistanceFilter(dist) {
  maxDistance = parseInt(dist, 10) || 0;
  const radios = document.querySelectorAll('input[name="distancia"]');
  radios.forEach(r => {
    r.checked = (parseInt(r.value, 10) || 0) === maxDistance;
  });
  renderProducts();
}

function setPriceFilter() {
  const minEl = document.getElementById('filter-price-min');
  const maxEl = document.getElementById('filter-price-max');
  const minVal = (minEl && minEl.value !== '') ? parseFloat(minEl.value) : null;
  const maxVal = (maxEl && maxEl.value !== '') ? parseFloat(maxEl.value) : null;
  priceMin = minVal;
  priceMax = maxVal;
  renderProducts();
}

function clearPriceFilter() {
  priceMin = null;
  priceMax = null;
  const minEl = document.getElementById('filter-price-min');
  if (minEl) minEl.value = '';
  const maxEl = document.getElementById('filter-price-max');
  if (maxEl) maxEl.value = '';
  renderProducts();
}

function toggleFarmingPractice(practice) {
  const idx = farmingPractices.indexOf(practice);
  if (idx > -1) {
    farmingPractices.splice(idx, 1);
  } else {
    farmingPractices.push(practice);
  }
  const idMap = { 'agro': 'filter-agro', 'nochem': 'filter-nochem', 'artesanal': 'filter-artesanal' };
  const el = document.getElementById(idMap[practice]);
  if (el) el.checked = farmingPractices.includes(practice);
  renderProducts();
}

function clearSearchFilter() {
  searchQuery = '';
  const searchInput = document.getElementById('market-search');
  if (searchInput) searchInput.value = '';
  renderProducts();
}

function sortProducts() {
  const select = document.getElementById('sort-select');
  if (select) {
    currentSort = select.value;
    renderProducts();
  }
}

function removeFavoritesFilter() {
  favoritesOnly = false;
  if (window.location.search) {
    const url = new URL(window.location);
    url.searchParams.delete('favoritos');
    url.searchParams.delete('fav');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  }
  renderProducts();
}
window.removeFavoritesFilter = removeFavoritesFilter;

function resetFilters() {
  currentCategory = 'todos';
  offersOnly = false;
  favoritesOnly = false;
  searchQuery = '';
  maxDistance = 0;
  weeklyOnly = false;
  priceMin = null;
  priceMax = null;
  farmingPractices = [];

  const searchInput = document.getElementById('market-search');
  if (searchInput) searchInput.value = '';

  const offerCheckbox = document.getElementById('filter-offers');
  if (offerCheckbox) offerCheckbox.checked = false;

  const weeklyCheckbox = document.getElementById('filter-weekly');
  if (weeklyCheckbox) weeklyCheckbox.checked = false;

  const distanceRadios = document.querySelectorAll('input[name="distancia"]');
  distanceRadios.forEach(r => {
    r.checked = (r.value === '0' || r.value === 'todas');
  });

  const minInput = document.getElementById('filter-price-min');
  if (minInput) minInput.value = '';
  const maxInput = document.getElementById('filter-price-max');
  if (maxInput) maxInput.value = '';

  ['filter-agro', 'filter-nochem', 'filter-artesanal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  highlightCategoryButton('todos');

  // Limpiar parámetro de URL si existe (ej: ?categoria=canastas)
  if (window.location.search) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }

  renderProducts();
}

function updateActiveFiltersUI() {
  const container = document.getElementById('active-filters-chips');
  const countBadge = document.getElementById('filter-count-badge');
  const countSpan = document.getElementById('filter-count');
  const clearInlineBtn = document.getElementById('filter-clear-btn-inline');
  const clearDivider = document.getElementById('filter-divider');
  const clearBtn = document.getElementById('filter-clear-btn');

  const activeFilters = [];

  // 0. Favoritos
  if (favoritesOnly) {
    activeFilters.push({
      id: 'favorites',
      label: '❤️ Solo favoritos',
      onRemove: "removeFavoritesFilter()"
    });
  }

  // 1. Categoría
  if (currentCategory && currentCategory !== 'todos') {
    const categoryNames = {
      'canastas': 'Canastas Familiares',
      'verduras': 'Verduras & Granos',
      'frutas': 'Frutas del Valle',
      'lacteos': 'Lácteos de Pastoreo',
      'despensa': 'Mieles & Despensa'
    };
    const label = categoryNames[currentCategory] || currentCategory;
    activeFilters.push({
      id: 'category',
      label: label,
      onRemove: "setCategoryFilter('todos')"
    });
  }

  // 2. Búsqueda
  if (searchQuery && searchQuery.trim() !== '') {
    activeFilters.push({
      id: 'search',
      label: `Búsqueda: "${searchQuery}"`,
      onRemove: "clearSearchFilter()"
    });
  }

  // 3. Ofertas
  if (offersOnly) {
    activeFilters.push({
      id: 'offers',
      label: 'Solo ofertas',
      onRemove: "removeOffersFilter()"
    });
  }

  // 4. Disponibles esta semana
  if (weeklyOnly) {
    activeFilters.push({
      id: 'weekly',
      label: 'Disponibles esta semana',
      onRemove: "removeWeeklyFilter()"
    });
  }

  // 5. Distancia
  if (maxDistance > 0) {
    activeFilters.push({
      id: 'distance',
      label: `Hasta ${maxDistance} km`,
      onRemove: "setDistanceFilter(0)"
    });
  }

  // 6. Rango de precio
  if (priceMin !== null || priceMax !== null) {
    let priceLabel = 'Precio: ';
    if (priceMin !== null && priceMax !== null) {
      priceLabel += `$${formatCOP(priceMin)} – $${formatCOP(priceMax)}`;
    } else if (priceMin !== null) {
      priceLabel += `Desde $${formatCOP(priceMin)}`;
    } else {
      priceLabel += `Hasta $${formatCOP(priceMax)}`;
    }
    activeFilters.push({
      id: 'price',
      label: priceLabel,
      onRemove: "clearPriceFilter()"
    });
  }

  // 7. Prácticas de cultivo
  if (farmingPractices && farmingPractices.length > 0) {
    const practiceLabels = {
      'agro': 'Agroecológico',
      'nochem': 'Sin químicos',
      'artesanal': 'Elaboración artesanal'
    };
    farmingPractices.forEach(p => {
      activeFilters.push({
        id: `practice-${p}`,
        label: practiceLabels[p] || p,
        onRemove: `toggleFarmingPractice('${p}')`
      });
    });
  }

  const count = activeFilters.length;

  // Actualizar conteo numérico
  if (countSpan) countSpan.textContent = count;
  if (countBadge) {
    if (count > 0) {
      countBadge.classList.remove('hidden');
    } else {
      countBadge.classList.add('hidden');
    }
  }

  // Mostrar u ocultar botones de limpiar
  if (count > 0) {
    if (clearInlineBtn) clearInlineBtn.classList.remove('hidden');
    if (clearDivider) clearDivider.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');
  } else {
    if (clearInlineBtn) clearInlineBtn.classList.add('hidden');
    if (clearDivider) clearDivider.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
  }

  // Renderizar chips de filtros activos
  if (container) {
    if (count === 0) {
      container.innerHTML = '';
    } else {
      container.innerHTML = activeFilters.map(f => `
        <span class="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-full text-[11px] font-medium shadow-2xs hover:border-stone-300 transition">
          <span>${f.label}</span>
          <button onclick="${f.onRemove}" class="text-stone-400 hover:text-stone-700 text-xs leading-none p-0.5 rounded-full transition cursor-pointer" title="Eliminar filtro">✕</button>
        </span>
      `).join('');
    }
  }
}

/**
 * Actualiza los contadores numéricos de cada categoría y disponibilidad en la barra lateral
 */
function updateCategoryBadgesCounts() {
  const catCounts = {
    todos: PRODUCTS_DATA.length,
    canastas: 0,
    verduras: 0,
    frutas: 0,
    lacteos: 0,
    despensa: 0
  };

  PRODUCTS_DATA.forEach(p => {
    if (catCounts[p.category] !== undefined) {
      catCounts[p.category]++;
    }
  });

  Object.keys(catCounts).forEach(cat => {
    const el = document.getElementById(`cat-count-${cat}`);
    if (el) {
      el.textContent = catCounts[cat];
    }
  });

  const weeklyEl = document.getElementById('weekly-count-label');
  if (weeklyEl) {
    const weeklyCount = PRODUCTS_DATA.filter(p => {
      const avail = (p.availability || '').toLowerCase();
      return !avail.includes('agotado') && !avail.includes('no disponible');
    }).length;
    weeklyEl.textContent = `(${weeklyCount})`;
  }
}
window.updateCategoryBadgesCounts = updateCategoryBadgesCounts;

let searchDebounceTimer = null;
function setupSearchListener() {
  const input = document.getElementById('market-search');
  if (!input) return;
  if (input.dataset.listenerAttached === 'true') return;
  input.dataset.listenerAttached = 'true';

  input.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    const val = e.target.value.trim();
    searchDebounceTimer = setTimeout(() => {
      searchQuery = val;
      renderProducts();
    }, 250);
  });
}

/**
 * Desplegar o disminuir (colapsar) una sección de filtros en la barra lateral
 * @param {'weekly' | 'distance' | 'price' | 'farming' | 'offers'} sectionId
 */
function toggleFilterSection(sectionId) {
  const content = document.getElementById(`filter-content-${sectionId}`);
  const arrow = document.getElementById(`filter-arrow-${sectionId}`);
  if (!content) return;

  const isCollapsed = content.classList.contains('collapsed');
  if (isCollapsed) {
    // Desplegar (expandir)
    content.classList.remove('collapsed');
    if (arrow) {
      arrow.classList.remove('-rotate-90');
      arrow.classList.add('rotate-0');
    }
  } else {
    // Disminuir (colapsar)
    content.classList.add('collapsed');
    if (arrow) {
      arrow.classList.remove('rotate-0');
      arrow.classList.add('-rotate-90');
    }
  }
}

// Exportar globalmente
window.toggleFilterSection = toggleFilterSection;
window.setCategoryFilter = setCategoryFilter;
window.toggleOffersOnly = toggleOffersOnly;
window.removeOffersFilter = removeOffersFilter;
window.toggleWeeklyOnly = toggleWeeklyOnly;
window.removeWeeklyFilter = removeWeeklyFilter;
window.setDistanceFilter = setDistanceFilter;
function openProductDetailPage(productId, event) {
  if (event && event.target && event.target.closest('button')) {
    return;
  }
  window.location.href = `producto.html?id=${encodeURIComponent(productId)}`;
}

window.openProductDetailPage = openProductDetailPage;
window.setPriceFilter = setPriceFilter;
window.clearPriceFilter = clearPriceFilter;
window.toggleFarmingPractice = toggleFarmingPractice;
window.clearSearchFilter = clearSearchFilter;
window.sortProducts = sortProducts;
window.resetFilters = resetFilters;
window.updateActiveFiltersUI = updateActiveFiltersUI;

// =============================================================================
// 6. Carrito de Compras (Cart System)
// =============================================================================
function initCartFromStorage() {
  const stored = localStorage.getItem('raiz_cart');
  if (stored) {
    try {
      cart = JSON.parse(stored);
    } catch(e) {
      cart = [];
    }
  }
  updateCartUI();
}

function saveCartToStorage() {
  localStorage.setItem('raiz_cart', JSON.stringify(cart));
  updateCartUI();
}

function addProductToCart(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      subtitle: product.subtitle,
      quantity: 1
    });
  }

  saveCartToStorage();
  renderProducts();
  showToast(`Agregaste 1 ${product.title} a tu canasta.`);
}

function incrementProduct(productId) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity += 1;
    saveCartToStorage();
    renderProducts();
  }
}

function decrementProduct(productId) {
  const index = cart.findIndex(i => i.id === productId);
  if (index !== -1) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
    } else {
      cart.splice(index, 1);
    }
    saveCartToStorage();
    renderProducts();
  }
}

function removeProductFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCartToStorage();
  renderProducts();
}

function updateCartUI() {
  const counter = document.getElementById('cart-counter');
  const itemsContainer = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (counter) counter.textContent = totalCount;
  if (subtotalEl) subtotalEl.textContent = `$${formatCOP(totalAmount)}`;
  if (totalEl) totalEl.textContent = `$${formatCOP(totalAmount)}`;

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="py-16 text-center text-stone-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <p class="text-xs">Tu canasta está vacía</p>
        <p class="text-[11px] text-stone-400 mt-1">Agrega productos frescos del campo para armar tu pedido.</p>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
      <img src="${item.image}" alt="${item.title}" class="w-14 h-14 object-cover rounded-xl shrink-0" onerror="this.src='https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg'">
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-stone-900 truncate">${item.title}</h4>
        <p class="text-[10px] text-stone-500">${item.subtitle}</p>
        <p class="text-xs font-bold text-[#c85a32] mt-0.5">$${formatCOP(item.price)}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 bg-white border border-stone-200 rounded-lg p-1 text-xs font-bold">
        <button onclick="decrementProduct('${item.id}')" class="w-5 h-5 rounded hover:bg-stone-100 flex items-center justify-center">-</button>
        <span class="px-1 text-xs">${item.quantity}</span>
        <button onclick="incrementProduct('${item.id}')" class="w-5 h-5 rounded hover:bg-stone-100 flex items-center justify-center">+</button>
      </div>
      <button onclick="removeProductFromCart('${item.id}')" class="text-stone-400 hover:text-red-500 p-1">
        ✕
      </button>
    </div>
  `).join('');
}

function setupCartDrawerListeners() {
  const openBtn = document.getElementById('open-cart-btn');
  const closeBtn = document.getElementById('close-cart-btn');
  const backdrop = document.getElementById('cart-backdrop');
  const drawer = document.getElementById('cart-drawer');
  const panel = document.getElementById('cart-panel');

  function openCart() {
    if (drawer) {
      drawer.classList.remove('hidden', 'pointer-events-none');
      drawer.classList.add('pointer-events-auto');
    }
    if (backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (panel) {
      panel.classList.remove('translate-x-full', 'pointer-events-none');
      panel.classList.add('pointer-events-auto');
    }
    document.body.classList.add('modal-open');
    if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  }

  function closeCart() {
    if (backdrop) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }
    if (panel) {
      panel.classList.add('translate-x-full', 'pointer-events-none');
      panel.classList.remove('pointer-events-auto');
    }
    setTimeout(() => {
      if (drawer) {
        drawer.classList.add('hidden', 'pointer-events-none');
        drawer.classList.remove('pointer-events-auto');
      }
      const otherModals = document.querySelectorAll('#auth-modal:not(.hidden), #login-auth-modal:not(.hidden), #register-auth-modal:not(.hidden), #producer-technical-modal:not(.hidden)');
      if (otherModals.length === 0) {
        document.body.classList.remove('modal-open');
        if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
      }
    }, 300);
  }

  if (openBtn) openBtn.onclick = openCart;
  if (closeBtn) closeBtn.onclick = closeCart;
  if (backdrop) backdrop.onclick = closeCart;

  window.openCart = openCart;
  window.closeCart = closeCart;
  window.openCartDrawer = openCart;
  window.closeCartDrawer = closeCart;
}

// =============================================================================
// 7. FLUJO DE AUTENTICACIÓN / OBLIGATORIO PARA COMPRAR (Invitado -> Registro)
// =============================================================================

/**
 * Obtener usuario actual desde localStorage (compatible con rb_current_user y raiz_user)
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        parsed.loggedIn = true;
        return parsed;
      }
    }
  } catch(e) {
    return null;
  }
  return null;
}

/**
 * Verificar estado de sesión y actualizar botones del encabezado
 */
function checkAuthStatus() {
  if (typeof updateAuthUI === 'function') {
    updateAuthUI();
  }
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const nodeSpan = document.getElementById('header-node-name');
  if (nodeSpan && user && user.preferredNode) {
    nodeSpan.textContent = user.preferredNode.split('·')[0].trim();
  }
}

function toggleMarketUserDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('market-user-dropdown') || document.getElementById('auth-user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('market-user-dropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  }
});

/**
 * Proceder al pago (REGLA: Si no tiene cuenta, pedir crear cuenta antes de comprar)
 */
function handleProceedToCheckout() {
  if (cart.length === 0) {
    showToast('Tu canasta de compras está vacía.');
    return;
  }

  const user = getCurrentUser();

  // Si el usuario NO tiene cuenta -> Pedir crearse una cuenta
  if (!user || !user.loggedIn) {
    if (window.closeCartDrawer) window.closeCartDrawer();
    openAuthModal('register');
    return;
  }

  // Si el usuario ya tiene cuenta -> Continuar directo al checkout en página dedicada
  if (window.closeCartDrawer) window.closeCartDrawer();
  saveCartToStorage();
  window.location.href = 'checkout.html';
}

// Control del Modal de Autenticación
function openAuthModal(mode = 'register') {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  switchAuthTab(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOpen = cartDrawer && !cartDrawer.classList.contains('pointer-events-none') && document.getElementById('cart-panel') && !document.getElementById('cart-panel').classList.contains('translate-x-full');
  if (!cartOpen) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
  }
}

function switchAuthTab(tab) {
  const formRegister = document.getElementById('form-register');
  const formLogin = document.getElementById('form-login');
  const tabRegBtn = document.getElementById('tab-register-btn');
  const tabLogBtn = document.getElementById('tab-login-btn');
  const title = document.getElementById('auth-modal-title');
  const subtitle = document.getElementById('auth-modal-subtitle');

  if (tab === 'register') {
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    tabRegBtn.className = "flex-1 py-2.5 border-b-2 border-[#1a3d2f] text-[#1a3d2f] transition";
    tabLogBtn.className = "flex-1 py-2.5 border-b-2 border-transparent text-stone-400 hover:text-stone-700 transition";
    title.textContent = "Crea tu cuenta para comprar";
    subtitle.textContent = "Estás comprando directo a agricultores locales. Regístrate para coordinar la cosecha y entrega en tu nodo.";
  } else {
    formRegister.classList.add('hidden');
    formLogin.classList.remove('hidden');
    tabLogBtn.className = "flex-1 py-2.5 border-b-2 border-[#1a3d2f] text-[#1a3d2f] transition";
    tabRegBtn.className = "flex-1 py-2.5 border-b-2 border-transparent text-stone-400 hover:text-stone-700 transition";
    title.textContent = "Inicia sesión en tu cuenta";
    subtitle.textContent = "Ingresa con tus credenciales para acceder a tus pedidos y puntos de recolección.";
  }
}

// Registro de Usuario
function handleRegister(e) {
  if (typeof handleCustomerRegister === 'function') {
    return handleCustomerRegister(e);
  }
}

// Inicio de Sesión
async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass') || document.getElementById('login-password');
  const inputVal = (emailInput ? emailInput.value : '').trim();
  const passVal = (passEl ? passEl.value : '').trim();

  if (!inputVal) {
    alert('Por favor introduce tu usuario o correo.');
    return;
  }

  // 1. Consultar directamente en la base de datos Supabase
  let dbUser = null;
  if (window.supabase && typeof window.supabase.login === 'function') {
    try {
      dbUser = await window.supabase.login(inputVal, passVal);
    } catch(err) {
      console.error('Error al verificar login en Supabase:', err);
    }
  }

  if (dbUser) {
    const role = (dbUser.role || 'cliente').toLowerCase();
    const userObj = {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.full_name || dbUser.username,
      role: (role === 'administrador' || role === 'admin') ? 'admin' : role,
      email: dbUser.email || '',
      phone: dbUser.phone || '',
      address: dbUser.location_address || '',
      preferredNode: dbUser.farm_name || 'Sede Urdesa · Espacio Verde',
      avatar: (typeof normalizeAvatarUrl === 'function') ? normalizeAvatarUrl(dbUser.avatar_url || '') : (dbUser.avatar_url || '').replace('/assets/images/avatars/', '/assets/avatars/'),
      loggedIn: true
    };

    localStorage.setItem('raiz_user', JSON.stringify(userObj));
    localStorage.setItem('rb_current_user', JSON.stringify(userObj));
    closeAuthModal();
    checkAuthStatus();
    showToast(`Sesión iniciada correctamente. Bienvenido ${userObj.name}.`);

    if (userObj.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }
    if (userObj.role === 'productor') {
      window.location.href = 'productor.html';
      return;
    }

    if (cart.length > 0) {
      setTimeout(() => {
        saveCartToStorage();
        window.location.href = 'checkout.html';
      }, 400);
    }
    return;
  }

  // Si no se encuentra en Supabase o contraseña errónea:
  showToast('Usuario o contraseña incorrectos.', 'error');
  alert('Usuario o contraseña incorrectos.');
}

// Cerrar Sesión (vuelve a ser invitado)
function handleLogout() {
  localStorage.removeItem('rb_current_user');
  localStorage.removeItem('raiz_user');
  checkAuthStatus();
  showToast('Has cerrado sesión. Ahora navegas como invitado.');
}

// =============================================================================
// 8. Integración de Ubicación y Redirección a Checkout Dedicado
// =============================================================================
// Toda la gestión interactiva del modal/dropdown de ubicación reside en js/header-location.js

/**
 * Redirección limpia al Checkout dedicado (/checkout)
 */
function openCheckoutModal(user) {
  if (cart.length === 0) {
    showToast('Tu canasta de compras está vacía.');
    return;
  }
  saveCartToStorage();
  window.location.href = 'checkout.html';
}

function closeCheckoutModal() {
  // No-op para compatibilidad
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;

// =============================================================================
// 9. Utilidades y Notificaciones Toast
// =============================================================================
function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');
  if (!toast || !messageEl) return;

  messageEl.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100', 'pointer-events-auto');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'pointer-events-auto');
  }, 3200);
}

