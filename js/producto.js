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
    id: 'tomate-huerta',
    numericId: 1,
    title: 'Tomate de huerta',
    category: 'verduras',
    badge: 'Cosechado hoy · Agroecológico',
    badgeIcon: '🌱',
    farmName: 'Hacienda San José',
    farmLocation: 'Daule, Guayas · a 45 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
    subtitle: '1 kg · selección de temporada',
    unit: '1 kg',
    unitLabel: 'USD / kg',
    price: 0.64,
    originalPrice: 0.85,
    discount: '-20%',
    stock: 24,
    stockText: 'En stock: 24 unidades de 1 kg',
    description: 'Tomates de temporada, maduros en la planta y seleccionados a mano. De pulpa jugosa y sabor de huerta, ideales para ensaladas y guisos.',
    care: 'Conserva en un lugar fresco y seco. Lava antes de consumir. El tamaño y el color pueden variar naturalmente.',
    shippingCost: 0.35
  },
  {
    id: 'aguacate-hass',
    numericId: 2,
    title: 'Aguacate Hass',
    category: 'frutas',
    badge: 'Listo para pronto · Cosecha limpia',
    badgeIcon: '🥑',
    farmName: 'Huerta Agroecológica El Guayacán',
    farmLocation: 'Milagro, Guayas · a 42 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg',
    subtitle: '1 kg · 4 a 5 unidades aprox.',
    unit: '1 kg',
    unitLabel: 'USD / kg',
    price: 0.85,
    originalPrice: 0.98,
    discount: '-15%',
    stock: 18,
    stockText: 'En stock: 18 unidades de 1 kg',
    description: 'Aguacates cremosos cosechados en su punto óptimo de maduración natural en el árbol, sin acelerantes químicos. Textura suave tipo mantequilla, ideales para guacamole, ensaladas o tostadas campesinas.',
    care: 'Mantener a temperatura ambiente hasta que cedan levemente al tacto. Una vez maduros, refrigerar para prolongar su frescura.',
    shippingCost: 0.35
  },
  {
    id: 'zanahoria-tierra',
    numericId: 3,
    title: 'Zanahoria de tierra',
    category: 'verduras',
    badge: 'Cosechado hoy · Sin químicos',
    badgeIcon: '🥕',
    farmName: 'Hacienda San José',
    farmLocation: 'Daule, Guayas · a 45 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg',
    subtitle: '1 kg · con toda su frescura',
    unit: '1 kg',
    unitLabel: 'USD / kg',
    price: 0.40,
    originalPrice: 0.50,
    discount: '-20%',
    stock: 35,
    stockText: 'En stock: 35 unidades de 1 kg',
    description: 'Zanahorias dulces cosechadas a mano con hojas verdes y tierra viva. Cultivadas con abonos orgánicos compostados en la sabana alta, crujientes y llenas de betacarotenos y sabor auténtico.',
    care: 'Retira las hojas verdes antes de guardar en la gaveta de verduras del refrigerador para conservar la humedad natural de la raíz.',
    shippingCost: 0.35
  },
  {
    id: 'canasta-huerto-familiar',
    numericId: 11,
    title: 'Canasta Huerto Familiar',
    category: 'canastas',
    badge: 'La favorita del barrio · Familiar',
    badgeIcon: '🧺',
    farmName: 'Hacienda San José',
    farmLocation: 'Daule, Guayas · a 45 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg',
    subtitle: '9-10 kg · para 3 a 5 personas',
    unit: 'canasta semanal',
    unitLabel: 'USD / canasta',
    price: 0.95,
    originalPrice: null,
    discount: null,
    stock: 12,
    stockText: 'En stock: 12 canastas semanales',
    description: 'La combinación semanal predilecta de nuestros vecinos: 8 a 10 variedades de hortalizas campesinas, 3 variedades de fruta estacional y hierbas aromáticas recién cortadas con trazabilidad directa a 3 fincas.',
    care: 'Desempacar al recibir y organizar según tipo: tubérculos en lugar aireado y hojas verdes lavadas y secas en refrigeración.',
    shippingCost: 0.35
  },
  {
    id: 'fresas-temporada',
    numericId: 4,
    title: 'Fresas de temporada',
    category: 'frutas',
    badge: 'De temporada · Cosecha del día',
    badgeIcon: '🍓',
    farmName: 'Cooperativa La Colina',
    farmLocation: 'Sibaté, Cundinamarca · a 27 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg',
    subtitle: '500 g · seleccionadas a mano',
    unit: '500g',
    unitLabel: 'USD / 500g',
    price: 0.80,
    originalPrice: 0.95,
    discount: '-16%',
    stock: 20,
    stockText: 'En stock: 20 cajas de 500g',
    description: 'Fresas silvestres cultivadas en altura con agua pura de montaña. Color rubí brillante, aroma penetrante y equilibrio perfecto entre acidez y dulzura natural. Cosechadas en la madrugada.',
    care: 'Lavar únicamente justo antes de consumir. Conservar refrigeradas en un recipiente ventilado con una servilleta absorbente.',
    shippingCost: 0.35
  },
  {
    id: 'queso-campesino',
    numericId: 7,
    title: 'Queso campesino artesanal',
    category: 'lacteos',
    badge: 'Artesanal · Pastoreo libre',
    badgeIcon: '🧀',
    farmName: 'Lácteos La Pradera',
    farmLocation: 'Sopó, Cundinamarca · a 42 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso_campesino.jpg',
    subtitle: '500 g · fresco de pastoreo',
    unit: '500g',
    unitLabel: 'USD / 500g',
    price: 0.75,
    originalPrice: null,
    discount: null,
    stock: 15,
    stockText: 'En stock: 15 unidades de 500g',
    description: 'Queso campesino tradicional elaborado en finca con leche entera fresca del ordeño matutino de vacas en libre pastoreo. Textura semiblanda, bajo en sal y con el sabor puro del campo.',
    care: 'Mantener siempre refrigerado entre 2°C y 4°C. Una vez abierto el empaque, conservar en un recipiente hermético limpio.',
    shippingCost: 0.35
  },
  {
    id: 'miel-flores',
    numericId: 9,
    title: 'Miel de flores silvestres',
    category: 'despensa',
    badge: '100% Pura · Bosque nativo',
    badgeIcon: '🍯',
    farmName: 'Apiario Monte Vivo',
    farmLocation: 'La Calera, Cundinamarca · a 18 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel_silvestre.jpg',
    subtitle: '350 g · pura, sin mezclas',
    unit: '350g',
    unitLabel: 'USD / 350g',
    price: 0.88,
    originalPrice: null,
    discount: null,
    stock: 14,
    stockText: 'En stock: 14 frascos de 350g',
    description: 'Miel 100% pura y cruda recolectada en colmenas ubicadas en bosque altoandino nativo. No pasteurizada ni adulterada, conserva todo su polen natural, enzimas vivas y notas florales.',
    care: 'Conservar a temperatura ambiente en lugar seco y oscuro. Si cristaliza naturalmente, sumergir el frasco cerrado en agua tibia.',
    shippingCost: 0.35
  },
  {
    id: 'papa-criolla',
    numericId: 5,
    title: 'Papa criolla nativa',
    category: 'verduras',
    badge: 'Recién cosechada · Tradición',
    badgeIcon: '🥔',
    farmName: 'Hacienda San José',
    farmLocation: 'Daule, Guayas · a 45 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/papa_criolla.jpg',
    subtitle: '1 kg · lavada y seleccionada',
    unit: '1 kg',
    unitLabel: 'USD / kg',
    price: 0.52,
    originalPrice: null,
    discount: null,
    stock: 40,
    stockText: 'En stock: 40 unidades de 1 kg',
    description: 'Papa criolla redonda dorada tradicional de ladera de páramo. De piel fina y pulpa harinosa suave que se deshace en la boca, perfecta para ajiacos, purés o frita entera con sal marina.',
    care: 'Guardar en un lugar fresco, oscuro y bien ventilado. No refrigerar para evitar alteraciones en sus almidones naturales.',
    shippingCost: 0.35
  },
  {
    id: 'yogur-pastoreo',
    numericId: 8,
    title: 'Yogur natural de pastoreo',
    category: 'lacteos',
    badge: 'Artesanal · Probiótico natural',
    badgeIcon: '🥛',
    farmName: 'Lácteos La Pradera',
    farmLocation: 'Sopó, Cundinamarca · a 42 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/yogur_pastoreo.jpg',
    subtitle: '1 litro · sin azúcar añadida',
    unit: '1L',
    unitLabel: 'USD / 1L',
    price: 0.65,
    originalPrice: null,
    discount: null,
    stock: 16,
    stockText: 'En stock: 16 botellas de 1L',
    description: 'Yogur fermentado lentamente con probióticos vivos y leche fresca de vacas en pastoreo rotacional. Libre de almidones, espesantes o endulzantes artificiales. Textura cremosa y ligera acidez láctica.',
    care: 'Mantener en refrigeración continua. Agitar suavemente antes de servir.',
    shippingCost: 0.35
  },
  {
    id: 'banano-criollo',
    numericId: 6,
    title: 'Banano criollo de ladera',
    category: 'frutas',
    badge: 'De temporada · Agroecológico',
    badgeIcon: '🍌',
    farmName: 'Finca El Porvenir',
    farmLocation: 'San Francisco, Cundinamarca · a 68 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/banano_criollo.jpg',
    subtitle: '1 kg · 6 a 8 unidades aprox.',
    unit: '1 kg',
    unitLabel: 'USD / kg',
    price: 0.38,
    originalPrice: null,
    discount: null,
    stock: 25,
    stockText: 'En stock: 25 unidades de 1 kg',
    description: 'Bananos de ladera cálida agroecológica cultivados bajo sombra de guamos y cafetales. Maduración lenta y natural que concentra sus azúcares y aroma frutal inconfundible.',
    care: 'Mantener a temperatura ambiente en lugar ventilado. No almacenar dentro del refrigerador.',
    shippingCost: 0.35
  },
  {
    id: 'mermelada-mora',
    numericId: 10,
    title: 'Mermelada artesanal de mora',
    category: 'despensa',
    badge: 'Pequeñas tandas · Con panela',
    badgeIcon: '🫐',
    farmName: 'Sabores de la Abuela',
    farmLocation: 'Tabio, Cundinamarca · a 35 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/mermelada_mora.jpg',
    subtitle: '280 g · fruta + panela orgánica',
    unit: '280g',
    unitLabel: 'USD / 280g',
    price: 0.60,
    originalPrice: null,
    discount: null,
    stock: 22,
    stockText: 'En stock: 22 frascos de 280g',
    description: 'Elaborada en paila de cobre en pequeños lotes con moras silvestres de monte y panela orgánica molida, sin pectinas industriales ni conservantes químicos. Sabor casero con trocitos enteros de fruta.',
    care: 'Una vez abierto el frasco, conservar en refrigerador y consumir preferiblemente antes de 30 días.',
    shippingCost: 0.35
  },
  {
    id: 'canasta-agroecologica',
    numericId: 12,
    title: 'Canasta Agroecológica Esencial',
    category: 'canastas',
    badge: '100% Limpia · Cosecha viva',
    badgeIcon: '🌿',
    farmName: 'Huerta Agroecológica El Guayacán',
    farmLocation: 'Milagro, Guayas · a 42 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg',
    subtitle: '6-7 kg · para 1 a 2 personas',
    unit: 'canasta semanal',
    unitLabel: 'USD / canasta',
    price: 0.70,
    originalPrice: null,
    discount: null,
    stock: 15,
    stockText: 'En stock: 15 canastas semanales',
    description: 'Selección compacta de alimentos agroecológicos vivos: hojas verdes, hortalizas de raíz, hierbas aromáticas y fruta de temporada directa de parcelas con certificación campesina participativa.',
    care: 'Conservar tubérculos y raíces en lugar fresco. Mantener verduras de hoja en bolsa de tela o contenedor en la gaveta baja del refrigerador.',
    shippingCost: 0.35
  },
  {
    id: 'rabanos-temporada',
    numericId: 13,
    title: 'Rábanos de temporada',
    category: 'verduras',
    badge: 'Cosechado hoy · Sin químicos',
    badgeIcon: '🌱',
    farmName: 'Hacienda San José',
    farmLocation: 'Daule, Guayas · a 45 km de tu nodo',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg',
    subtitle: '1 manojo · frescos y crujientes',
    unit: 'manojo',
    unitLabel: 'USD / manojo',
    price: 0.28,
    originalPrice: null,
    discount: null,
    stock: 30,
    stockText: 'En stock: 30 manojos',
    description: 'Rábanos frescos y crujientes cosechados al amanecer en Daule. De pulpa firme, color carmesí vivo y suave picor refrescante.',
    care: 'Retira las hojas y guarda los rábanos en un recipiente ventilado en refrigeración.',
    shippingCost: 0.35
  }
];

// Helper para normalizar URLs de imágenes de productos
function normalizeProductImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg';
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