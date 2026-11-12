/**
 * Raíz & Barrio - Ficha de Detalle de Producto
 * Diseño fiel a las 3 vistas de referencia:
 * 1. Estado inicial con 0 valoraciones y 0 comentarios (Imagen 1)
 * 2. Vista resumen con 2 comentarios destacados y desglose de estrellas (Imagen 3)
 * 3. Vista expandida "Ver todas las opiniones" con filtros por estrellas y paginación (Imagen 2)
 */

// =============================================================================
// 1. Catálogo Completo de Productos con Datos Hiperlocales
// =============================================================================
const CATEGORY_NAMES = {
  verduras: 'VERDURAS & RAÍCES',
  frutas: 'FRUTAS DEL VALLE',
  canastas: 'CANASTAS FAMILIARES',
  lacteos: 'LÁCTEOS DE PASTOREO',
  despensa: 'MIELES & DESPENSA ARTESANAL'
};

const DETAILED_PRODUCTS = [
  {
    id: "canasta-huerto-familiar",
    numericId: 11,
    title: "Canasta Huerto Familiar",
    category: "canastas",
    badge: "Familiar · Cosecha limpia",
    badgeIcon: "🧺",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Selección de temporada",
    unit: "canasta semanal",
    unitLabel: "USD / canasta semanal",
    price: 0.95,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de canasta semanal",
    description: "Hacienda San José · Daule · 8-10 hortalizas, 3 frutas y aromáticas para 3 a 5 personas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "canasta-agroecologica-esencial",
    numericId: 12,
    title: "Canasta Agroecológica Esencial",
    category: "canastas",
    badge: "Familiar · Cosecha limpia",
    badgeIcon: "🧺",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Selección de temporada",
    unit: "canasta semanal",
    unitLabel: "USD / canasta semanal",
    price: 0.7,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de canasta semanal",
    description: "Huerta Agroecológica El Guayacán · Milagro · 5-6 variedades básicas, frutas y huevos para parejas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "canasta-cosecha-campesina",
    numericId: 47,
    title: "Canasta Cosecha Campesina",
    category: "canastas",
    badge: "Familiar · Cosecha limpia",
    badgeIcon: "🧺",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Selección de temporada",
    unit: "canasta semanal",
    unitLabel: "USD / canasta semanal",
    price: 0.88,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de canasta semanal",
    description: "Asociación Don Jorge · Naranjal · Canasta rústica con tubérculos, plátano verde, queso y miel",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "canasta-huerta-y-frutas",
    numericId: 48,
    title: "Canasta Huerta & Frutas",
    category: "canastas",
    badge: "Familiar · Cosecha limpia",
    badgeIcon: "🧺",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80",
    subtitle: "canasta semanal · Selección de temporada",
    unit: "canasta semanal",
    unitLabel: "USD / canasta semanal",
    price: 0.82,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de canasta semanal",
    description: "Huerta Agroecológica El Guayacán · Milagro · Surtido abundante de frutas tropicales y hortalizas de huerta",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "tomate-de-huerta",
    numericId: 1,
    title: "Tomate de huerta",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.64,
    originalPrice: 0.8,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Tomate fresco de huerta campesina libre de agroquímicos",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "zanahoria-de-tierra",
    numericId: 3,
    title: "Zanahoria de tierra",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.4,
    originalPrice: 0.5,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Zanahorias dulces cosechadas a mano con hojas frescas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "papa-criolla-nativa",
    numericId: 5,
    title: "Papa criolla nativa",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.52,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Papa criolla seleccionada y lavada de cosecha local",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "rabanos-de-temporada",
    numericId: 13,
    title: "Rábanos de temporada",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Selección de temporada",
    unit: "manojo",
    unitLabel: "USD / manojo",
    price: 0.28,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de manojo",
    description: "Hacienda San José · Daule · Rábanos frescos y crujientes cosechados al amanecer",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cebolla-colorada",
    numericId: 14,
    title: "Cebolla colorada",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.45,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Cebolla colorada crocante cosechada en su punto óptimo",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cebolla-blanca-de-rama",
    numericId: 15,
    title: "Cebolla blanca de rama",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=600&q=80",
    subtitle: "atado · Selección de temporada",
    unit: "atado",
    unitLabel: "USD / atado",
    price: 0.35,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de atado",
    description: "Huerta Agroecológica El Guayacán · Milagro · Cebollín fresco aromático para refritos y sopas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "pimiento-verde-criollo",
    numericId: 16,
    title: "Pimiento verde criollo",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.42,
    originalPrice: 0.53,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Pimientos verdes carnosos de huerta agroecológica",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "pimiento-rojo-dulce",
    numericId: 17,
    title: "Pimiento rojo dulce",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.48,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Huerta Agroecológica El Guayacán · Milagro · Pimientos rojos madurados al sol del valle",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "lechuga-crespa-verde",
    numericId: 18,
    title: "Lechuga crespa verde",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.35,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Huerta Agroecológica El Guayacán · Milagro · Hojas verdes hidropónicas crujientes y limpias",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "lechuga-romana",
    numericId: 19,
    title: "Lechuga romana",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.38,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Hacienda San José · Daule · Cogollo tierno de lechuga romana de cultivo natural",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "espinaca-baby-de-huerta",
    numericId: 20,
    title: "Espinaca baby de huerta",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80",
    subtitle: "300g · Selección de temporada",
    unit: "300g",
    unitLabel: "USD / 300g",
    price: 0.45,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 300g",
    description: "Huerta Agroecológica El Guayacán · Milagro · Hojas tiernas de espinaca cosechadas a mano",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "acelga-arcoiris-organica",
    numericId: 21,
    title: "Acelga arcoíris orgánica",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80",
    subtitle: "atado · Selección de temporada",
    unit: "atado",
    unitLabel: "USD / atado",
    price: 0.4,
    originalPrice: 0.5,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de atado",
    description: "Huerta Agroecológica El Guayacán · Milagro · Pencas y hojas verdes tiernas ricas en hierro",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cilantro-fresco-de-huerta",
    numericId: 22,
    title: "Cilantro fresco de huerta",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Selección de temporada",
    unit: "manojo",
    unitLabel: "USD / manojo",
    price: 0.25,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de manojo",
    description: "Hacienda San José · Daule · Manojo aromático fresco cosechado el día de la entrega",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "albahaca-genovesa",
    numericId: 23,
    title: "Albahaca genovesa",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80",
    subtitle: "manojo · Selección de temporada",
    unit: "manojo",
    unitLabel: "USD / manojo",
    price: 0.3,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de manojo",
    description: "Huerta Agroecológica El Guayacán · Milagro · Hojas aromáticas intensas para salsas y pastas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "brocoli-campesino",
    numericId: 24,
    title: "Brócoli campesino",
    category: "verduras",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🌱",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.55,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Hacienda San José · Daule · Cabezas compactas de brócoli verde recién cortadas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "aguacate-hass",
    numericId: 2,
    title: "Aguacate Hass",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.85,
    originalPrice: 1.06,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Huerta Agroecológica El Guayacán · Milagro · Aguacates cremosos madurados en el árbol",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "fresas-de-temporada",
    numericId: 4,
    title: "Fresas de temporada",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Selección de temporada",
    unit: "500g",
    unitLabel: "USD / 500g",
    price: 0.8,
    originalPrice: 1.0,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de 500g",
    description: "Huerta Agroecológica El Guayacán · Milagro · Fresas seleccionadas a mano cosechadas hoy",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "banano-criollo-de-ladera",
    numericId: 6,
    title: "Banano criollo de ladera",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.38,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Huerta Agroecológica El Guayacán · Milagro · Banano dulce de maduración natural sin carburo",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "platano-verde-barraganete",
    numericId: 25,
    title: "Plátano verde barraganete",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80",
    subtitle: "racimo 5 un · Selección de temporada",
    unit: "racimo 5 un",
    unitLabel: "USD / racimo 5 un",
    price: 0.35,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de racimo 5 un",
    description: "Asociación Don Jorge · Naranjal · Plátano verde de primera para bolones, patacones y caldos",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "platano-maduro-dulce",
    numericId: 26,
    title: "Plátano maduro dulce",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80",
    subtitle: "racimo 5 un · Selección de temporada",
    unit: "racimo 5 un",
    unitLabel: "USD / racimo 5 un",
    price: 0.35,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de racimo 5 un",
    description: "Asociación Don Jorge · Naranjal · Maduro de textura suave ideal para asar o empanadas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "pina-dulce-golden",
    numericId: 27,
    title: "Piña dulce Golden",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.75,
    originalPrice: 0.94,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Huerta Agroecológica El Guayacán · Milagro · Piña jugosa de pulpa amarilla miel",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "papaya-hawaiana-de-huerta",
    numericId: 28,
    title: "Papaya hawaiana de huerta",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Hacienda San José · Daule · Papaya aromática de pulpa roja suave y digestiva",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "mango-tommy-atkins",
    numericId: 29,
    title: "Mango Tommy Atkins",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.5,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Hacienda San José · Daule · Mangos carnosos y aromáticos de los huertos del Litoral",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "naranja-valenciana-para-jugo",
    numericId: 30,
    title: "Naranja valenciana para jugo",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80",
    subtitle: "malla 12 un · Selección de temporada",
    unit: "malla 12 un",
    unitLabel: "USD / malla 12 un",
    price: 0.4,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de malla 12 un",
    description: "Huerta Agroecológica El Guayacán · Milagro · Naranjas jugosas cosechadas de árboles maduros",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "limon-sutil-criollo",
    numericId: 31,
    title: "Limón sutil criollo",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80",
    subtitle: "funda 15 un · Selección de temporada",
    unit: "funda 15 un",
    unitLabel: "USD / funda 15 un",
    price: 0.3,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de funda 15 un",
    description: "Hacienda San José · Daule · Limón verde aromático de acidez limpia para ceviches y aliños",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "mandarina-criolla-de-temporada",
    numericId: 32,
    title: "Mandarina criolla de temporada",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.45,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Huerta Agroecológica El Guayacán · Milagro · Mandarinas fáciles de pelar y muy dulces",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "maracuya-de-la-costa",
    numericId: 33,
    title: "Maracuyá de la costa",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=600&q=80",
    subtitle: "kg · Selección de temporada",
    unit: "kg",
    unitLabel: "USD / kg",
    price: 0.48,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de kg",
    description: "Asociación Don Jorge · Naranjal · Fruta de la pasión con pulpa densa y aroma tropical vibrante",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "sandia-baby-dulce",
    numericId: 34,
    title: "Sandía baby dulce",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.7,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Hacienda San José · Daule · Sandías personales refrescantes con pocas semillas",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "melon-cantaloupe",
    numericId: 35,
    title: "Melón cantaloupe",
    category: "frutas",
    badge: "Cosecha fresca · Cosecha limpia",
    badgeIcon: "🥑",
    farmName: "Hacienda San José",
    farmLocation: "Daule, Guayas · a 45 km de tu nodo",
    image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80",
    subtitle: "unidad · Selección de temporada",
    unit: "unidad",
    unitLabel: "USD / unidad",
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de unidad",
    description: "Hacienda San José · Daule · Melón dulce de pulpa salmón jugosa y corteza enmallada",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "queso-campesino-artesanal",
    numericId: 7,
    title: "Queso campesino artesanal",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Selección de temporada",
    unit: "500g",
    unitLabel: "USD / 500g",
    price: 0.75,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 500g",
    description: "Asociación Don Jorge · Naranjal · Elaborado en finca con leche fresca de vacas en pastoreo libre",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "yogur-de-pastoreo",
    numericId: 8,
    title: "Yogur de pastoreo",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Selección de temporada",
    unit: "1L",
    unitLabel: "USD / 1L",
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 1L",
    description: "Asociación Don Jorge · Naranjal · Yogur natural sin azúcar añadida ni espesantes artificiales",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "queso-madurado-de-finca",
    numericId: 36,
    title: "Queso madurado de finca",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
    subtitle: "400g · Selección de temporada",
    unit: "400g",
    unitLabel: "USD / 400g",
    price: 0.95,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 400g",
    description: "Asociación Don Jorge · Naranjal · Queso curado 45 días con corteza natural y sabor profundo",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "leche-entera-de-pastoreo",
    numericId: 37,
    title: "Leche entera de pastoreo",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Selección de temporada",
    unit: "1L",
    unitLabel: "USD / 1L",
    price: 0.55,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 1L",
    description: "Asociación Don Jorge · Naranjal · Leche pura entera pasteurizada en botella de vidrio retornable",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "yogur-artesanal-de-frutos-rojos",
    numericId: 38,
    title: "Yogur artesanal de frutos rojos",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80",
    subtitle: "1L · Selección de temporada",
    unit: "1L",
    unitLabel: "USD / 1L",
    price: 0.72,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 1L",
    description: "Asociación Don Jorge · Naranjal · Yogur cremoso batido con pulpa de mora y fresa natural",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "huevos-criollos-de-pastoreo",
    numericId: 39,
    title: "Huevos criollos de pastoreo",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Huerta Agroecológica El Guayacán",
    farmLocation: "Milagro, Guayas · a 42 km de tu nodo",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80",
    subtitle: "cubeta 15 un · Selección de temporada",
    unit: "cubeta 15 un",
    unitLabel: "USD / cubeta 15 un",
    price: 0.75,
    originalPrice: 0.94,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de cubeta 15 un",
    description: "Huerta Agroecológica El Guayacán · Milagro · Huevos frescos de gallinas libres de jaula con yema dorada",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "mantequilla-de-campo-artesanal",
    numericId: 40,
    title: "Mantequilla de campo artesanal",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
    subtitle: "250g · Selección de temporada",
    unit: "250g",
    unitLabel: "USD / 250g",
    price: 0.6,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 250g",
    description: "Asociación Don Jorge · Naranjal · Batida con crema de leche fresca y toque de sal marina",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cuajada-fresca-tradicional",
    numericId: 41,
    title: "Cuajada fresca tradicional",
    category: "lacteos",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🧀",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Selección de temporada",
    unit: "500g",
    unitLabel: "USD / 500g",
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 500g",
    description: "Asociación Don Jorge · Naranjal · Cuajada tierna de leche pura de ordeño de la mañana",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "miel-de-abeja-silvestre",
    numericId: 9,
    title: "Miel de abeja silvestre",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    subtitle: "350g · Selección de temporada",
    unit: "350g",
    unitLabel: "USD / 350g",
    price: 0.88,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 350g",
    description: "Asociación Don Jorge · Naranjal · Miel 100% cruda cosechada en colmenas de bosque nativo",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "mermelada-artesanal-de-mora",
    numericId: 10,
    title: "Mermelada artesanal de mora",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80",
    subtitle: "280g · Selección de temporada",
    unit: "280g",
    unitLabel: "USD / 280g",
    price: 0.6,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 280g",
    description: "Asociación Don Jorge · Naranjal · Elaborada en paila de cobre con moras frescas y panela",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "polen-de-flores-nativas",
    numericId: 42,
    title: "Polen de flores nativas",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=600&q=80",
    subtitle: "180g · Selección de temporada",
    unit: "180g",
    unitLabel: "USD / 180g",
    price: 0.8,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 180g",
    description: "Asociación Don Jorge · Naranjal · Polen apícola multicolor seco recogido en floraciones silvestres",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cacao-fino-de-aroma-100",
    numericId: 43,
    title: "Cacao fino de aroma 100%",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80",
    subtitle: "250g · Selección de temporada",
    unit: "250g",
    unitLabel: "USD / 250g",
    price: 0.75,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 250g",
    description: "Asociación Don Jorge · Naranjal · Pasta pura de cacao nacional fino de aroma sin aditivos",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "panela-granulada-organica",
    numericId: 44,
    title: "Panela granulada orgánica",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",
    subtitle: "500g · Selección de temporada",
    unit: "500g",
    unitLabel: "USD / 500g",
    price: 0.5,
    originalPrice: 0.62,
    discount: "-20%",
    stock: 25,
    stockText: "En stock: 25 unidades de 500g",
    description: "Asociación Don Jorge · Naranjal · Endulzante de jugo puro de caña evaporado artesanalmente",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "cafe-de-especialidad-de-altura",
    numericId: 45,
    title: "Café de especialidad de altura",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    subtitle: "340g · Selección de temporada",
    unit: "340g",
    unitLabel: "USD / 340g",
    price: 0.9,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 340g",
    description: "Asociación Don Jorge · Naranjal · Granos arábica seleccionados con tostión media artesanal",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  },
  {
    id: "chocolate-artesanal-al-70",
    numericId: 46,
    title: "Chocolate artesanal al 70%",
    category: "despensa",
    badge: "Artesanal · Cosecha limpia",
    badgeIcon: "🍯",
    farmName: "Asociación Don Jorge",
    farmLocation: "Naranjal, Guayas · a 78 km de tu nodo",
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80",
    subtitle: "100g · Selección de temporada",
    unit: "100g",
    unitLabel: "USD / 100g",
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: "En stock: 25 unidades de 100g",
    description: "Asociación Don Jorge · Naranjal · Barra de chocolate amargo campesino elaborado en finca",
    care: "Conservar en un lugar fresco y seco o refrigerado según corresponda. Consumir fresco para disfrutar al máximo sus propiedades naturales.",
    shippingCost: 0.35
  }
];

// Helper para normalizar URLs de imágenes de productos
function normalizeProductImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('canasta_agroecologica.jpg')) {
      return clean.replace('canasta_agroecologica.jpg', 'canasta_esencial.jpg');
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
// 2. Estado Global de la Página
// =============================================================================
let currentProduct = null;
let currentQuantity = 1;
let currentReviewsView = 'summary'; // 'summary' (Imagen 3) o 'full' (Imagen 2)
let currentFilterStar = 'all';      // 'all' o 5, 4, 3, 2, 1
let currentFullPage = 1;
const REVIEWS_PER_PAGE = 6;
let formSelectedStars = 5;

// =============================================================================
// 3. Inicialización
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
});

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('id');

  // Buscar el producto por id de texto, número o título
  currentProduct = DETAILED_PRODUCTS.find(p => 
    p.id === paramId || 
    String(p.numericId) === paramId ||
    (paramId && p.title.toLowerCase() === paramId.toLowerCase())
  );
  if (!currentProduct) {
    currentProduct = DETAILED_PRODUCTS[0]; // Tomate de huerta por defecto
  }

  // Cargar datos en la interfaz
  renderProductDetails(currentProduct);
  updateCartPresenceHint();
  initCommentForm();
  renderReviewsSection();
}

// =============================================================================
// 4. Renderizado de Datos del Producto (Fiel a Imagen 1)
// =============================================================================
function renderProductDetails(p) {
  document.title = `${p.title} | Raíz & Barrio`;

  // Breadcrumbs
  const bcCat = document.getElementById('bc-category');
  const bcProd = document.getElementById('bc-product');
  if (bcCat) {
    bcCat.textContent = CATEGORY_NAMES[p.category] || p.category;
    bcCat.href = `mercado.html?categoria=${p.category}`;
  }
  if (bcProd) bcProd.textContent = p.title;

  // Columna Izquierda
  const imgEl = document.getElementById('prod-image');
  if (imgEl) {
    imgEl.src = normalizeProductImageUrl(p.image);
    imgEl.alt = p.title;
  }
  const badgeIconEl = document.getElementById('prod-badge-icon');
  if (badgeIconEl) badgeIconEl.textContent = p.badgeIcon || '🌱';
  const badgeEl = document.getElementById('prod-badge');
  if (badgeEl) badgeEl.textContent = p.badge;

  const farmNameEl = document.getElementById('prod-farm-name');
  if (farmNameEl) farmNameEl.textContent = p.farmName;
  const farmLocEl = document.getElementById('prod-farm-location');
  if (farmLocEl) farmLocEl.textContent = p.farmLocation;

  const careEl = document.getElementById('prod-care');
  if (careEl) careEl.textContent = p.care;

  // Columna Derecha
  const kickerEl = document.getElementById('prod-category-kicker');
  if (kickerEl) kickerEl.textContent = CATEGORY_NAMES[p.category] || p.category.toUpperCase();

  const titleEl = document.getElementById('prod-title');
  if (titleEl) titleEl.textContent = p.title;

  const subtitleEl = document.getElementById('prod-subtitle');
  if (subtitleEl) subtitleEl.textContent = p.subtitle;

  const descEl = document.getElementById('prod-description');
  if (descEl) descEl.textContent = p.description;

  const priceEl = document.getElementById('prod-price');
  if (priceEl) priceEl.textContent = `$${formatCOP(p.price)}`;

  const origPriceEl = document.getElementById('prod-original-price');
  const discountEl = document.getElementById('prod-discount');
  if (p.originalPrice) {
    if (origPriceEl) {
      origPriceEl.textContent = `$${formatCOP(p.originalPrice)}`;
      origPriceEl.classList.remove('hidden');
    }
    if (discountEl) {
      discountEl.textContent = p.discount || `-${Math.round((1 - p.price / p.originalPrice) * 100)}%`;
      discountEl.classList.remove('hidden');
    }
  } else {
    if (origPriceEl) origPriceEl.classList.add('hidden');
    if (discountEl) discountEl.classList.add('hidden');
  }

  const unitLabelEl = document.getElementById('prod-unit-label');
  if (unitLabelEl) unitLabelEl.textContent = p.unitLabel;

  const stockEl = document.getElementById('prod-stock');
  if (stockEl) stockEl.textContent = p.stockText;

  // Despacho a domicilio nota
  const deliveryHomeNote = document.getElementById('delivery-home-note');
  if (deliveryHomeNote) {
    const totalHome = p.price + (p.shippingCost || 0.35);
    deliveryHomeNote.textContent = `A domicilio en Guayaquil: $${formatCOP(p.shippingCost || 0.35)} · Total con envío: $${formatCOP(totalHome)} USD.`;
  }

  recalculateSubtotal();
}

// =============================================================================
// 5. Stepper y Subtotal
// =============================================================================
function updateQty(delta) {
  const newQty = currentQuantity + delta;
  if (newQty < 1) return;
  if (currentProduct && newQty > currentProduct.stock) {
    showToast(`Existencias máximas disponibles: ${currentProduct.stock}`);
    return;
  }
  currentQuantity = newQty;
  const qtyEl = document.getElementById('qty-value');
  if (qtyEl) qtyEl.textContent = currentQuantity;

  recalculateSubtotal();
  updateCartPresenceHint();
}

function recalculateSubtotal() {
  if (!currentProduct) return;
  const subtotal = currentQuantity * currentProduct.price;
  
  const subtotalLabel = document.getElementById('subtotal-label');
  if (subtotalLabel) {
    subtotalLabel.textContent = `Subtotal · ${currentQuantity} × ${currentProduct.unit}`;
  }

  const subtotalPrice = document.getElementById('subtotal-price');
  if (subtotalPrice) {
    subtotalPrice.textContent = `$${formatCOP(subtotal)}`;
  }

  const deliveryHomeNote = document.getElementById('delivery-home-note');
  if (deliveryHomeNote) {
    const totalHome = subtotal + (currentProduct.shippingCost || 0.35);
    deliveryHomeNote.textContent = `A domicilio en Guayaquil: $${formatCOP(currentProduct.shippingCost || 0.35)} · Total con envío: $${formatCOP(totalHome)} USD.`;
  }
}

// =============================================================================
// 6. Carrito de Compras (Sincronizado con raiz_cart)
// =============================================================================
function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem('raiz_cart') || '[]');
  } catch (e) {
    return [];
  }
}

function saveLocalCart(cart) {
  try {
    localStorage.setItem('raiz_cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('Error al guardar carrito:', e);
  }
}

function handleAddToCart() {
  if (!currentProduct) return;
  const cart = getLocalCart();
  const existingIdx = cart.findIndex(item => item.id === currentProduct.id);

  if (existingIdx !== -1) {
    cart[existingIdx].quantity += currentQuantity;
  } else {
    cart.push({
      id: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      subtitle: currentProduct.subtitle,
      origin: currentProduct.farmLocation,
      image: currentProduct.image,
      quantity: currentQuantity,
      unit: currentProduct.unit
    });
  }

  saveLocalCart(cart);
  updateCartPresenceHint();
  showToast(`¡${currentQuantity} × ${currentProduct.title} añadido al carrito!`);
}

function handleBuyNow() {
  if (!currentProduct) return;

  // Agregar o actualizar el producto con la cantidad seleccionada en el carrito
  const cart = getLocalCart();
  const existingIdx = cart.findIndex(item => item.id === currentProduct.id);

  if (existingIdx !== -1) {
    cart[existingIdx].quantity = currentQuantity;
  } else {
    cart.push({
      id: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      subtitle: currentProduct.subtitle,
      origin: currentProduct.farmLocation,
      image: currentProduct.image,
      quantity: currentQuantity,
      unit: currentProduct.unit
    });
  }

  saveLocalCart(cart);

  // Redirigir automáticamente al checkout / opciones de pago
  window.location.href = 'mercado.html?checkout=1';
}

function updateCartPresenceHint() {
  if (!currentProduct) return;
  const cart = getLocalCart();
  const found = cart.find(item => item.id === currentProduct.id);
  const hintEl = document.getElementById('cart-item-hint');
  
  if (hintEl) {
    if (found && found.quantity > 0) {
      hintEl.innerHTML = `Ya tienes <strong>${found.quantity} ${currentProduct.unit}</strong> en tu carrito. Agregarás <strong>${currentQuantity} ${currentProduct.unit}</strong> más.`;
    } else {
      hintEl.textContent = 'Ya tienes 0 unidades en tu carrito.';
    }
  }
}

// =============================================================================
// 7. Sistema de Opiniones y Valoraciones ("Lo que dice el barrio")
//    Manejo de las 3 Vistas:
//    - Vista 1: 0 opiniones / 0 valoraciones (Imagen 1)
//    - Vista 2: Resumen con 2 opiniones destacadas y desglose (Imagen 3)
//    - Vista 3: Vista completa expandida con filtros y paginación (Imagen 2)
// =============================================================================

function getReviewsStorageKey() {
  return currentProduct ? `product_reviews_${currentProduct.id}` : 'product_reviews_default';
}

function getProductReviews() {
  try {
    let raw = localStorage.getItem(getReviewsStorageKey());
    if (!raw && currentProduct && currentProduct.numericId) {
      raw = localStorage.getItem(`product_reviews_${currentProduct.numericId}`);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(r => !String(r.id).startsWith('mock-')) : [];
  } catch (e) {
    return [];
  }
}

function saveProductReviews(reviews) {
  try {
    const key = getReviewsStorageKey();
    localStorage.setItem(key, JSON.stringify(reviews));
    if (currentProduct && currentProduct.numericId) {
      localStorage.setItem(`product_reviews_${currentProduct.numericId}`, JSON.stringify(reviews));
    }
  } catch (e) {
    console.warn('Error al guardar opiniones:', e);
  }
}

/**
 * Renderiza la sección completa de opiniones según la cantidad existente
 */
function renderReviewsSection() {
  const reviews = getProductReviews();
  const totalCount = reviews.length;

  const headerRating = document.getElementById('prod-header-rating');
  const headerStars = document.getElementById('prod-header-stars');
  const headerOpinionsCount = document.getElementById('header-opinions-count');
  const btnBackSummary = document.getElementById('btn-header-back-summary');

  const viewEmpty = document.getElementById('view-reviews-empty');
  const viewSummary = document.getElementById('view-reviews-summary');
  const viewFull = document.getElementById('view-reviews-full');

  // Si no hay reviews (Estado inicial por requerimiento del usuario - Imagen 1)
  if (totalCount === 0) {
    if (headerRating) headerRating.textContent = '0 · Aún sin valoraciones · 0 opiniones';
    if (headerStars) {
      headerStars.className = 'flex text-stone-300 text-sm tracking-tighter';
      headerStars.innerHTML = '<span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>';
    }
    if (headerOpinionsCount) {
      headerOpinionsCount.textContent = '0 opiniones';
      headerOpinionsCount.classList.remove('hidden');
    }
    if (btnBackSummary) btnBackSummary.classList.add('hidden');

    if (viewEmpty) viewEmpty.classList.remove('hidden');
    if (viewSummary) viewSummary.classList.add('hidden');
    if (viewFull) viewFull.classList.add('hidden');
    return;
  }

  // Si existen reviews (Imagen 3 o Imagen 2)
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avgNumeric = Number((sum / totalCount).toFixed(1));
  const avgStr = avgNumeric.toFixed(1).replace('.', ',');

  // Actualizar cabecera del producto
  if (headerRating) {
    headerRating.textContent = `${avgStr} · ${totalCount} opiniones`;
  }
  if (headerStars) {
    headerStars.className = 'flex text-amber-500 text-sm tracking-tighter';
    headerStars.innerHTML = generateStarsHtml(avgNumeric);
  }

  // Desglose de estrellas (1 a 5)
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    counts[star] = (counts[star] || 0) + 1;
  });

  // Ocultar vista vacía
  if (viewEmpty) viewEmpty.classList.add('hidden');

  if (currentReviewsView === 'summary') {
    // -------------------------------------------------------------------------
    // VISTA 2: Resumen (Imagen 3)
    // -------------------------------------------------------------------------
    if (viewSummary) viewSummary.classList.remove('hidden');
    if (viewFull) viewFull.classList.add('hidden');

    if (headerOpinionsCount) {
      headerOpinionsCount.innerHTML = `
        <div class="relative inline-block text-left">
          <button class="inline-flex items-center gap-1.5 text-xs text-stone-600 border border-stone-200 bg-white rounded-lg px-2.5 py-1 hover:bg-stone-50">
            <span>Más recientes</span>
            <span class="text-[10px]">⌄</span>
          </button>
        </div>
      `;
      headerOpinionsCount.classList.remove('hidden');
    }
    if (btnBackSummary) btnBackSummary.classList.add('hidden');

    // Tarjeta izquierda resumen
    const scoreNum = document.getElementById('summary-score-num');
    if (scoreNum) scoreNum.textContent = avgStr;

    const scoreStars = document.getElementById('summary-score-stars');
    if (scoreStars) scoreStars.innerHTML = generateStarsHtml(avgNumeric);

    const buyersLabel = document.getElementById('summary-score-buyers');
    if (buyersLabel) buyersLabel.textContent = `${totalCount} opiniones de compradores`;

    // Barras de distribución
    const barsContainer = document.getElementById('summary-rating-bars');
    if (barsContainer) {
      barsContainer.innerHTML = [5, 4, 3, 2, 1].map(star => {
        const c = counts[star] || 0;
        const pct = totalCount > 0 ? Math.round((c / totalCount) * 100) : 0;
        return `
          <div class="flex items-center gap-2">
            <span class="w-6 text-[11px] text-stone-500 font-medium">${star} ★</span>
            <div class="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width: ${pct}%;"></div>
            </div>
            <span class="w-6 text-right text-[11px] text-stone-400">${c}</span>
          </div>
        `;
      }).join('');
    }

    // Top 2 opiniones en tarjeta derecha
    const top2 = reviews.slice(0, 2);
    const topContainer = document.getElementById('summary-top-reviews-list');
    if (topContainer) {
      topContainer.innerHTML = top2.map((rev, idx) => renderSingleReviewHtml(rev, idx < top2.length - 1)).join('');
    }

    const showingCount = document.getElementById('summary-showing-count');
    if (showingCount) {
      showingCount.textContent = `Mostrando ${Math.min(2, totalCount)} de ${totalCount} opiniones`;
    }

  } else {
    // -------------------------------------------------------------------------
    // VISTA 3: Expandida "Ver todas las opiniones" (Imagen 2)
    // -------------------------------------------------------------------------
    if (viewSummary) viewSummary.classList.add('hidden');
    if (viewFull) viewFull.classList.remove('hidden');

    if (headerOpinionsCount) headerOpinionsCount.classList.add('hidden');
    if (btnBackSummary) btnBackSummary.classList.remove('hidden');

    // Tarjeta izquierda expandida
    const fullScoreNum = document.getElementById('full-score-num');
    if (fullScoreNum) fullScoreNum.textContent = avgStr;

    const fullScoreStars = document.getElementById('full-score-stars');
    if (fullScoreStars) fullScoreStars.innerHTML = generateStarsHtml(avgNumeric);

    const fullBuyersLabel = document.getElementById('full-score-buyers');
    if (fullBuyersLabel) fullBuyersLabel.textContent = `${totalCount} opiniones de compradores`;

    const fullBarsContainer = document.getElementById('full-rating-bars');
    if (fullBarsContainer) {
      fullBarsContainer.innerHTML = [5, 4, 3, 2, 1].map(star => {
        const c = counts[star] || 0;
        const pct = totalCount > 0 ? Math.round((c / totalCount) * 100) : 0;
        return `
          <div class="flex items-center gap-2">
            <span class="w-6 text-[11px] text-stone-500 font-medium">${star} ★</span>
            <div class="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full" style="width: ${pct}%;"></div>
            </div>
            <span class="w-6 text-right text-[11px] text-stone-400">${c}</span>
          </div>
        `;
      }).join('');
    }

    // Título de la lista derecha
    const headerTitle = document.getElementById('full-opinions-header-title');
    if (headerTitle) {
      headerTitle.textContent = `Todas las opiniones (${totalCount})`;
    }

    // Filtros por estrellas (Pills)
    const pillsContainer = document.getElementById('full-filter-pills');
    if (pillsContainer) {
      const pills = [
        { key: 'all', label: `Todas (${totalCount})` },
        { key: '5', label: `5 ★ (${counts[5] || 0})` },
        { key: '4', label: `4 ★ (${counts[4] || 0})` },
        { key: '3', label: `3 ★ (${counts[3] || 0})` },
        { key: '2', label: `2 ★ (${counts[2] || 0})` },
        { key: '1', label: `1 ★ (${counts[1] || 0})` }
      ];

      pillsContainer.innerHTML = pills.map(p => {
        const isActive = currentFilterStar === p.key;
        return `
          <button 
            onclick="setReviewStarFilter('${p.key}')" 
            class="px-3 py-1 rounded-full font-medium transition text-xs ${
              isActive 
                ? 'bg-[#1a3d2f] text-white shadow-xs' 
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
            }"
          >
            ${p.label}
          </button>
        `;
      }).join('');
    }

    // Filtrar opiniones
    let filtered = reviews;
    if (currentFilterStar !== 'all') {
      const targetStar = Number(currentFilterStar);
      filtered = reviews.filter(r => Math.round(Number(r.rating) || 5) === targetStar);
    }

    // Paginación
    const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
    if (currentFullPage > totalPages) currentFullPage = 1;

    const startIdx = (currentFullPage - 1) * REVIEWS_PER_PAGE;
    const endIdx = startIdx + REVIEWS_PER_PAGE;
    const paginatedReviews = filtered.slice(startIdx, endIdx);

    const listContainer = document.getElementById('full-reviews-list-container');
    if (listContainer) {
      if (paginatedReviews.length === 0) {
        listContainer.innerHTML = `
          <div class="text-center py-8 text-stone-400 text-xs">
            No hay opiniones registradas con esta calificación.
          </div>
        `;
      } else {
        listContainer.innerHTML = paginatedReviews.map((rev, idx) => 
          renderSingleReviewHtml(rev, idx < paginatedReviews.length - 1)
        ).join('');
      }
    }

    // Texto de paginación
    const paginationText = document.getElementById('full-pagination-text');
    if (paginationText) {
      const from = filtered.length > 0 ? startIdx + 1 : 0;
      const to = Math.min(endIdx, filtered.length);
      paginationText.textContent = `Mostrando ${from}-${to} de ${filtered.length} opiniones`;
    }

    // Controles de paginación
    const paginationNav = document.getElementById('full-pagination-nav');
    if (paginationNav) {
      let navHtml = '';
      
      // Botón Anterior
      navHtml += `
        <button 
          onclick="changeFullPage(${currentFullPage - 1})" 
          class="px-2.5 py-1 rounded-lg border border-stone-200 text-xs ${currentFullPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-stone-50'}"
        >
          ← Anterior
        </button>
      `;

      // Botones numéricos
      for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 6 && p > 3 && p < totalPages) {
          if (p === 4) navHtml += `<span class="px-1 text-stone-400">...</span>`;
          continue;
        }
        navHtml += `
          <button 
            onclick="changeFullPage(${p})" 
            class="w-7 h-7 rounded-lg text-xs font-semibold ${
              p === currentFullPage 
                ? 'bg-[#1a3d2f] text-white' 
                : 'border border-stone-200 hover:bg-stone-50 text-stone-700'
            }"
          >
            ${p}
          </button>
        `;
      }

      // Botón Siguiente
      navHtml += `
        <button 
          onclick="changeFullPage(${currentFullPage + 1})" 
          class="px-2.5 py-1 rounded-lg border border-stone-200 text-xs ${currentFullPage === totalPages || totalPages === 0 ? 'opacity-40 pointer-events-none' : 'hover:bg-stone-50'}"
        >
          Siguiente →
        </button>
      `;

      paginationNav.innerHTML = navHtml;
    }
  }
}

/**
 * Renderiza el HTML de una opinión individual con el diseño de referencia
 */
function renderSingleReviewHtml(rev, withDivider = true) {
  const initials = getInitials(rev.name || 'Vecino');
  const starNum = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
  const stars = '★'.repeat(starNum) + '☆'.repeat(5 - starNum);

  return `
    <div class="review-item">
      <!-- Fila superior: Avatar, Nombre, Compra verificada y Fecha -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
            ${escapeHtml(initials)}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-stone-900">${escapeHtml(rev.name || 'Vecino')}</span>
              <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>Compra verificada</span>
              </span>
            </div>
          </div>
        </div>
        <span class="text-[11px] text-stone-400">${escapeHtml(rev.date || 'Reciente')}</span>
      </div>

      <!-- Estrellas doradas -->
      <div class="flex text-amber-500 text-xs my-1.5 tracking-tighter">
        ${stars}
      </div>

      <!-- Título de la opinión (si tiene) -->
      ${rev.title ? `<h4 class="text-xs font-bold text-stone-900 mb-1">${escapeHtml(rev.title)}</h4>` : ''}

      <!-- Contenido del comentario -->
      <p class="text-xs text-stone-600 leading-relaxed">
        ${escapeHtml(rev.comment || '')}
      </p>

      ${withDivider ? '<div class="border-t border-stone-100 my-4"></div>' : ''}
    </div>
  `;
}

function switchReviewsView(viewMode) {
  currentReviewsView = viewMode;
  currentFullPage = 1;
  currentFilterStar = 'all';
  renderReviewsSection();
}

function setReviewStarFilter(starKey) {
  currentFilterStar = starKey;
  currentFullPage = 1;
  renderReviewsSection();
}

function changeFullPage(page) {
  currentFullPage = page;
  renderReviewsSection();
}

// =============================================================================
// 8. Formulario de Opinión Interactivo ("¿Cómo estuvo tu cosecha?")
// =============================================================================
function initCommentForm() {
  let userName = '';
  let firstName = '';

  try {
    const rawUser = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.name || user.full_name) {
        userName = user.name || user.full_name;
        firstName = userName.split(' ')[0];
      }
    }
  } catch (e) {}

  const greetingEl = document.getElementById('form-user-greeting');
  if (greetingEl) {
    greetingEl.textContent = firstName ? `¿Cómo estuvo tu cosecha, ${firstName}?` : '¿Cómo estuvo tu cosecha?';
  }

  const authorNoteEl = document.getElementById('form-author-note');
  if (authorNoteEl) {
    authorNoteEl.textContent = userName 
      ? `Publicarás como ${userName} · Comparte una opinión respetuosa.` 
      : 'Comparte una opinión respetuosa con la comunidad.';
  }

  setInteractiveStars(5);
}

function setInteractiveStars(num) {
  formSelectedStars = num;
  const picker = document.getElementById('form-star-picker');
  if (!picker) return;

  const buttons = picker.querySelectorAll('button');
  buttons.forEach((btn, idx) => {
    if (idx < num) {
      btn.className = 'text-amber-500 hover:text-amber-500 transition px-0.5';
      btn.textContent = '★';
    } else {
      btn.className = 'text-stone-300 hover:text-amber-500 transition px-0.5';
      btn.textContent = '☆';
    }
  });
}

function handlePublishReview() {
  const commentInput = document.getElementById('form-comment-text');
  const commentText = commentInput ? commentInput.value.trim() : '';

  if (!commentText) {
    showToast('Por favor escribe tu comentario antes de publicar.');
    commentInput?.focus();
    return;
  }

  let userName = 'Vecino';
  try {
    const rawUser = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.name || user.full_name) userName = user.name || user.full_name;
    }
  } catch (e) {}

  const now = new Date();
  const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Extraer primera frase como título si es posible
  let title = 'Excelente cosecha';
  if (commentText.length > 30) {
    const firstSentence = commentText.split('.')[0];
    if (firstSentence && firstSentence.length <= 40) {
      title = firstSentence;
    }
  }

  const newReview = {
    id: Date.now().toString(),
    name: userName,
    rating: formSelectedStars,
    title: title,
    comment: commentText,
    date: dateStr,
    verified: true
  };

  const reviews = getProductReviews();
  reviews.unshift(newReview);
  saveProductReviews(reviews);

  // Limpiar campo de texto
  if (commentInput) commentInput.value = '';

  // Cambiar vista a resumen para mostrar la opinión publicada
  currentReviewsView = 'summary';
  renderReviewsSection();
  showToast('¡Gracias! Tu opinión ha sido publicada y valorada.');
}

// =============================================================================
// 9. Utilidades Auxiliares
// =============================================================================
function generateStarsHtml(avgNumeric) {
  const fullStars = Math.floor(avgNumeric);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span>${i <= fullStars ? '★' : '☆'}</span>`;
  }
  return html;
}

function getInitials(name) {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100', 'pointer-events-auto');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'pointer-events-auto');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}