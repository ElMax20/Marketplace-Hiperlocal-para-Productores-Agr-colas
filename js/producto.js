/**
 * Raíz & Barrio - Ficha de Detalle de Producto
 * Gestión de catálogo, selección de despacho, cálculo de costos en tiempo real,
 * carrito de compras y sistema de valoraciones / comentarios (inicialmente en 0).
 */

// =============================================================================
// 1. Catálogo Completo de Productos con Datos Detallados de Finca y Cuidado
// =============================================================================
const DETAILED_PRODUCTS = [
  {
    id: 'tomate-huerta',
    numericId: 1,
    title: 'Tomate de huerta',
    category: 'verduras',
    badge: 'Cosechado hoy · Agroecológico',
    tag: 'Cosecha fresca',
    farmName: 'Finca La Esperanza',
    farmLocation: 'Choachí, Cundinamarca · a 32 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
    subtitle: '1 kg · selección de temporada',
    unit: '1 kg',
    unitLabel: 'COP / kg',
    price: 0.64,
    originalPrice: 0.85,
    discount: '-25%',
    stock: 24,
    stockText: 'En stock: 24 unidades de 1 kg',
    description: 'Tomates de temporada, maduros en la planta y seleccionados a mano. De pulpa jugosa y sabor de huerta campesina libre de químicos, ideales para ensaladas, salsas frescas y guisos caseros.',
    care: 'Conserva en un lugar fresco y seco. Lava antes de consumir. El tamaño y el color pueden variar naturalmente.',
    shippingCost: 0.35
  },
  {
    id: 'aguacate-hass',
    numericId: 2,
    title: 'Aguacate Hass',
    category: 'frutas',
    badge: 'Listo para pronto · Cosecha limpia',
    tag: 'Listo para pronto',
    farmName: 'Familia Rojas',
    farmLocation: 'La Vega, Cundinamarca · a 52 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg',
    subtitle: '1 kg · 4 a 5 unidades aprox.',
    unit: '1 kg',
    unitLabel: 'COP / kg',
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
    tag: 'Cosechado hoy',
    farmName: 'Huerta El Renacer',
    farmLocation: 'Subachoque, Cundinamarca · a 45 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg',
    subtitle: '1 kg · con toda su frescura',
    unit: '1 kg',
    unitLabel: 'COP / kg',
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
    tag: 'La favorita del barrio',
    farmName: 'Red de Familias Campesinas',
    farmLocation: 'Choachí, Cundinamarca · a 30 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg',
    subtitle: '9-10 kg · para 3 a 5 personas',
    unit: 'canasta semanal',
    unitLabel: 'COP / canasta',
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
    tag: 'De temporada',
    farmName: 'Cooperativa La Colina',
    farmLocation: 'Sibaté, Cundinamarca · a 27 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg',
    subtitle: '500 g · seleccionadas a mano',
    unit: '500g',
    unitLabel: 'COP / 500g',
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
    tag: 'Artesanal',
    farmName: 'Lácteos La Pradera',
    farmLocation: 'Sopó, Cundinamarca · a 42 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso_campesino.jpg',
    subtitle: '500 g · fresco de pastoreo',
    unit: '500g',
    unitLabel: 'COP / 500g',
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
    tag: 'Cosecha local',
    farmName: 'Apiario Monte Vivo',
    farmLocation: 'La Calera, Cundinamarca · a 18 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel_silvestre.jpg',
    subtitle: '350 g · pura, sin mezclas',
    unit: '350g',
    unitLabel: 'COP / 350g',
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
    tag: 'Recién cosechada',
    farmName: 'Finca Las Margaritas',
    farmLocation: 'Usme rural, Bogotá · a 29 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/papa_criolla.jpg',
    subtitle: '1 kg · lavada y seleccionada',
    unit: '1 kg',
    unitLabel: 'COP / kg',
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
    tag: 'Artesanal',
    farmName: 'Lácteos La Pradera',
    farmLocation: 'Sopó, Cundinamarca · a 42 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/yogur_pastoreo.jpg',
    subtitle: '1 litro · sin azúcar añadida',
    unit: '1L',
    unitLabel: 'COP / 1L',
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
    tag: 'De temporada',
    farmName: 'Finca El Porvenir',
    farmLocation: 'San Francisco, Cundinamarca · a 68 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/banano_criollo.jpg',
    subtitle: '1 kg · 6 a 8 unidades aprox.',
    unit: '1 kg',
    unitLabel: 'COP / kg',
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
    tag: 'Hecho a mano',
    farmName: 'Sabores de la Abuela',
    farmLocation: 'Tabio, Cundinamarca · a 35 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/mermelada_mora.jpg',
    subtitle: '280 g · fruta + panela orgánica',
    unit: '280g',
    unitLabel: 'COP / 280g',
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
    badge: 'Selección semanal · Parejas',
    tag: 'Selección semanal',
    farmName: 'Familia Moreno',
    farmLocation: 'Bojacá, Cundinamarca · a 40 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg',
    subtitle: '6-7 kg · ideal 1 a 2 personas',
    unit: 'canasta semanal',
    unitLabel: 'COP / canasta',
    price: 0.70,
    originalPrice: null,
    discount: null,
    stock: 8,
    stockText: 'En stock: 8 canastas semanales',
    description: 'Selección equilibrada para solteros o parejas: 5 a 6 variedades indispensables de huerta, 2 frutas cosechadas en su punto y media docena de huevos de pastoreo. Canasta 100% retornable sin residuos plásticos.',
    care: 'Al recibir, separar verduras de hoja para refrigerar y ubicar raíces en canasto aireado.',
    shippingCost: 0.35
  },
  {
    id: 'rabanos-temporada',
    numericId: 13,
    title: 'Rábanos de temporada',
    category: 'verduras',
    badge: 'Cosechado hoy · Agroecológico',
    tag: 'Cosechado hoy',
    farmName: 'Huerta El Renacer',
    farmLocation: 'Subachoque, Cundinamarca · a 45 km',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg',
    subtitle: '1 manojo · 300g aprox.',
    unit: 'manojo',
    unitLabel: 'COP / manojo',
    price: 0.28,
    originalPrice: null,
    discount: null,
    stock: 30,
    stockText: 'En stock: 30 manojos',
    description: 'Rábanos frescos de color magenta brillante y centro blanco crocante. Cultivados sin pesticidas, con notas picantes suaves que refrescan cualquier ensalada o encurtido casero.',
    care: 'Cortar las hojas verdes y conservar las raíces en un recipiente con agua fría en la nevera para mantener su textura crocante.',
    shippingCost: 0.35
  }
];

// =============================================================================
// 2. Estado de la Vista de Producto
// =============================================================================
let currentProduct = null;
let currentQuantity = 1;
let selectedDelivery = 'pickup'; // 'pickup' o 'home'
let formSelectedStars = 5;

// =============================================================================
// 3. Inicialización al cargar la página
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadProductFromUrl();
  updateCartPresenceHint();
  renderProductReviews();
  prefillReviewAuthor();
});

/**
 * Busca y carga el producto correspondiente según el parámetro `?id=` de la URL
 */
function loadProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('id') || params.get('producto') || 'tomate-huerta';

  // Buscar coincidencia por id slug, numérico o parcial
  currentProduct = DETAILED_PRODUCTS.find(p => 
    p.id === paramId || 
    String(p.numericId) === paramId ||
    p.id.includes(paramId) ||
    paramId.includes(p.id)
  );

  // Fallback al primer producto si no coincide
  if (!currentProduct) {
    currentProduct = DETAILED_PRODUCTS[0];
  }

  renderProductData(currentProduct);
}

/**
 * Renderiza todos los datos del producto en la interfaz
 */
function renderProductData(p) {
  document.title = `${p.title} | Raíz & Barrio`;

  // Columna Izquierda
  const imgEl = document.getElementById('prod-image');
  if (imgEl) {
    imgEl.src = p.image;
    imgEl.alt = p.title;
  }

  const badgeEl = document.getElementById('prod-badge');
  if (badgeEl) badgeEl.textContent = p.badge;

  const farmNameEl = document.getElementById('prod-farm-name');
  if (farmNameEl) farmNameEl.textContent = p.farmName;

  const farmLocationEl = document.getElementById('prod-farm-location');
  if (farmLocationEl) farmLocationEl.textContent = p.farmLocation;

  const descEl = document.getElementById('prod-description');
  if (descEl) descEl.textContent = p.description;

  const careEl = document.getElementById('prod-care');
  if (careEl) careEl.textContent = p.care;

  // Columna Derecha
  const titleEl = document.getElementById('prod-title');
  if (titleEl) titleEl.textContent = p.title;

  const subtitleEl = document.getElementById('prod-subtitle');
  if (subtitleEl) subtitleEl.textContent = p.subtitle;

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

  const deliveryPriceLabel = document.getElementById('delivery-price-label');
  if (deliveryPriceLabel) deliveryPriceLabel.textContent = `$${formatCOP(p.shippingCost)}`;

  // Actualizar cálculo y desglose de costos
  recalculateBreakdown();
}

// =============================================================================
// 4. Lógica de Despacho y Desglose de Costos
// =============================================================================
function setDeliveryOption(type) {
  selectedDelivery = type;
  
  const cardPickup = document.getElementById('card-delivery-pickup');
  const cardHome = document.getElementById('card-delivery-home');
  const dotPickup = document.getElementById('dot-pickup');
  const dotHome = document.getElementById('dot-home');

  if (type === 'pickup') {
    if (cardPickup) {
      cardPickup.className = 'p-3.5 sm:p-4 rounded-xl border-2 border-[#1a3d2f] bg-[#f0f5f2] cursor-pointer transition flex items-start gap-3';
    }
    if (dotPickup) dotPickup.className = 'w-2 h-2 rounded-full bg-[#1a3d2f]';
    
    if (cardHome) {
      cardHome.className = 'p-3.5 sm:p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 cursor-pointer transition flex items-start gap-3';
    }
    if (dotHome) dotHome.className = 'w-2 h-2 rounded-full bg-transparent';
  } else {
    if (cardPickup) {
      cardPickup.className = 'p-3.5 sm:p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 cursor-pointer transition flex items-start gap-3';
    }
    if (dotPickup) dotPickup.className = 'w-2 h-2 rounded-full bg-transparent';

    if (cardHome) {
      cardHome.className = 'p-3.5 sm:p-4 rounded-xl border-2 border-[#1a3d2f] bg-[#f0f5f2] cursor-pointer transition flex items-start gap-3';
    }
    if (dotHome) dotHome.className = 'w-2 h-2 rounded-full bg-[#1a3d2f]';
  }

  recalculateBreakdown();
}

function updateQty(delta) {
  const newQty = currentQuantity + delta;
  if (newQty < 1) return;
  if (currentProduct && newQty > currentProduct.stock) {
    showToast(`Existencias máximas disponibles: ${currentProduct.stock}`);
    return;
  }
  currentQuantity = newQty;
  
  const qtyVal = document.getElementById('qty-value');
  if (qtyVal) qtyVal.textContent = currentQuantity;

  recalculateBreakdown();
  updateCartPresenceHint();
}

function recalculateBreakdown() {
  if (!currentProduct) return;

  const subtotal = currentQuantity * currentProduct.price;
  const shippingCost = selectedDelivery === 'home' ? currentProduct.shippingCost : 0;
  const total = subtotal + shippingCost;
  const totalWithHome = subtotal + currentProduct.shippingCost;

  // Elementos del desglose
  const prodQtyLabel = document.getElementById('breakdown-prod-qty');
  if (prodQtyLabel) prodQtyLabel.textContent = `Producto · ${currentQuantity} × ${currentProduct.unit}`;

  const subtotalEl = document.getElementById('breakdown-subtotal');
  if (subtotalEl) subtotalEl.textContent = `$${formatCOP(subtotal)}`;

  const deliveryTitle = document.getElementById('breakdown-delivery-title');
  if (deliveryTitle) {
    deliveryTitle.textContent = selectedDelivery === 'home' ? 'Envío a domicilio' : 'Recogida en nodo';
  }

  const deliveryCostEl = document.getElementById('breakdown-delivery-cost');
  if (deliveryCostEl) deliveryCostEl.textContent = `$${formatCOP(shippingCost)}`;

  const totalTitle = document.getElementById('breakdown-total-title');
  if (totalTitle) {
    totalTitle.textContent = selectedDelivery === 'home' ? 'Total con domicilio' : 'Total con recogida';
  }

  const totalEl = document.getElementById('breakdown-total');
  if (totalEl) totalEl.textContent = `$${formatCOP(total)}`;

  const footnoteEl = document.getElementById('breakdown-footnote');
  if (footnoteEl) {
    footnoteEl.textContent = `Impuestos incluidos. Con envío a domicilio: $${formatCOP(totalWithHome)} COP.`;
  }
}

// =============================================================================
// 5. Gestión del Carrito (Sincronizado con localStorage)
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
    console.warn('Error guardando carrito:', e);
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

function updateCartPresenceHint() {
  if (!currentProduct) return;
  const cart = getLocalCart();
  const found = cart.find(item => item.id === currentProduct.id);
  const hintEl = document.getElementById('cart-item-hint');
  
  if (hintEl) {
    if (found && found.quantity > 0) {
      hintEl.innerHTML = `Ya tienes <strong>${found.quantity}</strong> en tu carrito. Agregarás <strong>${currentQuantity}</strong> más.`;
    } else {
      hintEl.textContent = 'Aún no tienes este producto en tu carrito.';
    }
  }
}

// =============================================================================
// 6. Sección de Comentarios y Valoraciones (Inicialmente Vacío y en 0)
// =============================================================================
function getReviewsStorageKey() {
  return currentProduct ? `product_reviews_${currentProduct.id}` : 'product_reviews_default';
}

function getProductReviews() {
  try {
    const raw = localStorage.getItem(getReviewsStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveProductReviews(reviews) {
  try {
    localStorage.setItem(getReviewsStorageKey(), JSON.stringify(reviews));
  } catch (e) {
    console.warn('Error guardando reviews:', e);
  }
}

function renderProductReviews() {
  const reviews = getProductReviews();
  const totalCount = reviews.length;

  const scoreBig = document.getElementById('rating-score-display');
  const countDisplay = document.getElementById('rating-count-display');
  const starsDisplay = document.getElementById('rating-stars-display');
  const headerRating = document.getElementById('prod-header-rating');
  const headerStars = document.getElementById('prod-header-stars');

  const emptyState = document.getElementById('reviews-empty-state');
  const listContainer = document.getElementById('reviews-list');

  // Si no hay reviews (estado inicial por defecto)
  if (totalCount === 0) {
    if (scoreBig) scoreBig.textContent = '0,0';
    if (countDisplay) countDisplay.textContent = '0 valoraciones';
    if (headerRating) headerRating.textContent = '0,0 · 0 opiniones';
    
    // Estrellas vacías en gris
    const emptyStarsHtml = '<span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>';
    if (starsDisplay) {
      starsDisplay.className = 'flex text-stone-300 text-lg my-1.5 tracking-tighter';
      starsDisplay.innerHTML = emptyStarsHtml;
    }
    if (headerStars) {
      headerStars.className = 'flex text-stone-300 text-sm tracking-tighter';
      headerStars.innerHTML = emptyStarsHtml;
    }

    // Barras en 0%
    for (let s = 1; s <= 5; s++) {
      const bar = document.getElementById(`bar-${s}-star`);
      const pct = document.getElementById(`pct-${s}-star`);
      if (bar) bar.style.width = '0%';
      if (pct) pct.textContent = '0%';
    }

    if (emptyState) emptyState.classList.remove('hidden');
    if (listContainer) listContainer.innerHTML = '';
    return;
  }

  // Si existen reviews agregadas por el usuario:
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = (sum / totalCount).toFixed(1).replace('.', ',');

  if (scoreBig) scoreBig.textContent = avg;
  if (countDisplay) countDisplay.textContent = `${totalCount} ${totalCount === 1 ? 'valoración' : 'valoraciones'}`;
  if (headerRating) headerRating.textContent = `${avg} · ${totalCount} ${totalCount === 1 ? 'opinión' : 'opiniones'}`;

  // Desglose por estrellas
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    counts[star] = (counts[star] || 0) + 1;
  });

  for (let s = 1; s <= 5; s++) {
    const p = Math.round((counts[s] / totalCount) * 100);
    const bar = document.getElementById(`bar-${s}-star`);
    const pct = document.getElementById(`pct-${s}-star`);
    if (bar) bar.style.width = `${p}%`;
    if (pct) pct.textContent = `${p}%`;
  }

  // Estrellas doradas proporcionales
  const numericAvg = parseFloat((sum / totalCount).toFixed(1));
  const fullStars = Math.floor(numericAvg);
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span class="${i <= fullStars ? 'text-amber-400' : 'text-stone-300'}">★</span>`;
  }
  if (starsDisplay) starsDisplay.innerHTML = starsHtml;
  if (headerStars) headerStars.innerHTML = starsHtml;

  // Renderizar la lista de comentarios
  if (emptyState) emptyState.classList.add('hidden');
  if (listContainer) {
    listContainer.innerHTML = reviews.map(r => `
      <div class="bg-stone-50/70 p-4 rounded-xl border border-stone-200/80">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="font-bold text-stone-900 text-xs">${escapeHtml(r.name)}</span>
            ${r.neighborhood ? `<span class="text-[10px] text-stone-400">• ${escapeHtml(r.neighborhood)}</span>` : ''}
          </div>
          <span class="text-[10px] text-stone-400">${r.date || 'Reciente'}</span>
        </div>
        <div class="flex text-amber-400 text-xs mb-2">
          ${'★'.repeat(Math.min(5, Math.max(1, r.rating)))}${'☆'.repeat(5 - Math.min(5, Math.max(1, r.rating)))}
        </div>
        <p class="text-xs text-stone-600 leading-relaxed">${escapeHtml(r.comment)}</p>
      </div>
    `).join('');
  }
}

function toggleReviewForm() {
  const formCard = document.getElementById('review-form-card');
  const toggleBtnText = document.getElementById('btn-toggle-review-text');
  if (!formCard) return;

  if (formCard.classList.contains('hidden')) {
    formCard.classList.remove('hidden');
    if (toggleBtnText) toggleBtnText.textContent = 'Cerrar formulario';
    document.getElementById('review-name')?.focus();
  } else {
    formCard.classList.add('hidden');
    if (toggleBtnText) toggleBtnText.textContent = 'Escribir opinión';
  }
}

function setFormStars(num) {
  formSelectedStars = num;
  const buttons = document.querySelectorAll('#star-picker .star-btn');
  buttons.forEach((btn, idx) => {
    btn.className = `star-btn text-2xl transition ${idx < num ? 'text-amber-400' : 'text-stone-300'}`;
  });

  const label = document.getElementById('star-picker-label');
  const labels = ['', 'Muy regular', 'Aceptable', 'Bueno', 'Muy bueno', '¡Excelente cosecha!'];
  if (label) label.textContent = labels[num] || `${num} estrellas`;
}

function prefillReviewAuthor() {
  try {
    const rawUser = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user') || sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const nameInput = document.getElementById('review-name');
      const neighborhoodInput = document.getElementById('review-neighborhood');
      if (nameInput && (user.name || user.full_name)) nameInput.value = user.name || user.full_name;
      if (neighborhoodInput && (user.location || user.location_address)) neighborhoodInput.value = user.location || user.location_address;
    }
  } catch (e) {}
}

function submitReview(e) {
  e.preventDefault();
  const nameInput = document.getElementById('review-name');
  const neighborhoodInput = document.getElementById('review-neighborhood');
  const commentInput = document.getElementById('review-comment');

  const name = nameInput ? nameInput.value.trim() : 'Vecino';
  const neighborhood = neighborhoodInput ? neighborhoodInput.value.trim() : '';
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!comment) return;

  const now = new Date();
  const dateStr = `${now.getDate()} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][now.getMonth()]}`;

  const newReview = {
    id: Date.now().toString(),
    name,
    neighborhood,
    rating: formSelectedStars,
    comment,
    date: dateStr
  };

  const reviews = getProductReviews();
  reviews.unshift(newReview);
  saveProductReviews(reviews);

  // Limpiar y ocultar formulario
  if (commentInput) commentInput.value = '';
  toggleReviewForm();

  // Actualizar estadísticas de opiniones
  renderProductReviews();
  showToast('¡Gracias! Tu opinión ha sido publicada con éxito.');
}

// =============================================================================
// 7. Utilidades de Navegación y Notificación
// =============================================================================
function closeProductPage() {
  if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = 'mercado.html';
  }
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
