/**
 * Raíz & Barrio - Mercado de Cercanía
 * Lógica del Catálogo, Filtros, Carrito y Flujo de Usuario (Invitado / Registro Obligatorio)
 */

// =============================================================================
// 1. Base de datos de productos (Coincide exactamente con la imagen de referencia)
// =============================================================================
const PRODUCTS_DATA = [
  {
    id: 'tomate-huerta',
    numericId: 1,
    title: 'Tomate de huerta',
    category: 'verduras',
    tag: 'Cosecha fresca',
    discount: '-25%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
    subtitle: '1 kg · Selección de temporada',
    origin: 'Hacienda San José · Daule · a 45 km',
    rating: '0',
    reviews: 0,
    price: 0.64,
    originalPrice: 0.85,
    availability: 'Disponible · cosecha del día',
    distanceKm: 45,
    isOffer: true
  },
  {
    id: 'aguacate-hass',
    numericId: 2,
    title: 'Aguacate Hass',
    category: 'frutas',
    tag: 'Listo para pronto',
    discount: '-15%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg',
    subtitle: '1 kg · 4 a 5 unidades aprox.',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    rating: '0',
    reviews: 0,
    price: 0.85,
    originalPrice: 0.98,
    availability: 'Disponible · maduro/semimaduro',
    distanceKm: 42,
    isOffer: true
  },
  {
    id: 'zanahoria-tierra',
    numericId: 3,
    title: 'Zanahoria de tierra',
    category: 'verduras',
    tag: 'Cosechado hoy',
    discount: '-20%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg',
    subtitle: '1 kg · con toda su frescura',
    origin: 'Hacienda San José · Daule · a 45 km',
    rating: '0',
    reviews: 0,
    price: 0.40,
    originalPrice: 0.50,
    availability: 'Disponible · cosecha del día',
    distanceKm: 45,
    isOffer: true
  },
  {
    id: 'canasta-huerto-familiar',
    numericId: 11,
    title: 'Canasta Huerto Familiar',
    category: 'canastas',
    tag: 'La favorita del barrio',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg',
    subtitle: '9-10 kg · para 3 a 5 personas',
    origin: 'Hacienda San José · Daule · a 45 km',
    rating: '0',
    reviews: 0,
    price: 0.95,
    originalPrice: null,
    availability: 'Disponible · 11 canastas',
    distanceKm: 45,
    isOffer: false
  },
  {
    id: 'fresas-temporada',
    numericId: 4,
    title: 'Fresas de temporada',
    category: 'frutas',
    tag: 'De temporada',
    discount: '-20%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg',
    subtitle: '500 g · seleccionadas a mano',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    rating: '0',
    reviews: 0,
    price: 0.80,
    originalPrice: 0.95,
    availability: 'Disponible · cosechadas hoy',
    distanceKm: 42,
    isOffer: true
  },
  {
    id: 'queso-campesino',
    numericId: 7,
    title: 'Queso campesino',
    category: 'lacteos',
    tag: 'Artesanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso_campesino.jpg',
    subtitle: '500 g · fresco de pastoreo',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    rating: '0',
    reviews: 0,
    price: 0.75,
    originalPrice: null,
    availability: 'Disponible · elaboración de ayer',
    distanceKm: 78,
    isOffer: false
  },
  {
    id: 'miel-flores',
    numericId: 9,
    title: 'Miel de flores silvestres',
    category: 'despensa',
    tag: 'Cosecha local',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel_silvestre.jpg',
    subtitle: '500 g · pura, sin mezclas',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    rating: '0',
    reviews: 0,
    price: 0.88,
    originalPrice: null,
    availability: 'Disponible · lote de noviembre',
    distanceKm: 78,
    isOffer: false
  },
  {
    id: 'papa-criolla',
    numericId: 5,
    title: 'Papa criolla',
    category: 'verduras',
    tag: 'Recién cosechada',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/papa_criolla.jpg',
    subtitle: '1 kg · lavada y seleccionada',
    origin: 'Hacienda San José · Daule · a 45 km',
    rating: '0',
    reviews: 0,
    price: 0.52,
    originalPrice: null,
    availability: 'Disponible · cosechado la semana',
    distanceKm: 45,
    isOffer: false
  },
  {
    id: 'yogur-pastoreo',
    numericId: 8,
    title: 'Yogur natural de pastoreo',
    category: 'lacteos',
    tag: 'Artesanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/yogur_pastoreo.jpg',
    subtitle: '1 litro · sin azúcar añadida',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    rating: '0',
    reviews: 0,
    price: 0.65,
    originalPrice: null,
    availability: 'Disponible · conservar refrigerado',
    distanceKm: 78,
    isOffer: false
  },
  {
    id: 'banano-criollo',
    numericId: 6,
    title: 'Banano criollo',
    category: 'frutas',
    tag: 'De temporada',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/banano_criollo.jpg',
    subtitle: '1 kg · 6 a 8 unidades aprox.',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    rating: '0',
    reviews: 0,
    price: 0.38,
    originalPrice: null,
    availability: 'Disponible · maduración natural',
    distanceKm: 42,
    isOffer: false
  },
  {
    id: 'mermelada-mora',
    numericId: 10,
    title: 'Mermelada de mora',
    category: 'despensa',
    tag: 'Hecho en pequeñas tandas',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/mermelada_mora.jpg',
    subtitle: '250 g · fruta + panela',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    rating: '0',
    reviews: 0,
    price: 0.60,
    originalPrice: null,
    availability: 'Disponible · elaboración artesanal',
    distanceKm: 78,
    isOffer: false
  },
  {
    id: 'canasta-agroecologica',
    numericId: 12,
    title: 'Canasta Agroecológica',
    category: 'canastas',
    tag: 'Selección semanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg',
    subtitle: '6-7 kg · ideal 1 a 2 personas',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    rating: '0',
    reviews: 0,
    price: 0.70,
    originalPrice: null,
    availability: 'Disponible · 8 canastas',
    distanceKm: 42,
    isOffer: false
  },
  {
    id: 'rabanos-temporada',
    numericId: 13,
    title: 'Rábanos de temporada',
    category: 'verduras',
    tag: 'Cosechado hoy',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg',
    subtitle: '1 manojo · frescos y crujientes',
    origin: 'Hacienda San José · Daule · a 45 km',
    rating: '0',
    reviews: 0,
    price: 0.28,
    originalPrice: null,
    availability: 'Disponible · cosecha del día',
    distanceKm: 45,
    isOffer: false
  }
];

// =============================================================================
// Helper: Normalización de URLs de Imágenes (Garantizar Supabase Storage público)
// =============================================================================
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
document.addEventListener('DOMContentLoaded', () => {
  initFavoritesFromStorage();
  initCartFromStorage();
  checkAuthStatus();
  initHeaderLocationSelector();
  parseUrlParams();
  renderProducts();
  setupCartDrawerListeners();
  setupSearchListener();
  loadProductsFromSupabase();
});

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

// Cargar catálogo en tiempo real desde Supabase sin filtrar por claves de nodos huérfanas
async function loadProductsFromSupabase() {
  if (window.supabase && typeof window.supabase.getProducts === 'function') {
    try {
      const dbProducts = await window.supabase.getProducts();
      if (dbProducts && dbProducts.length > 0) {
        const categoryMap = { 1: 'canastas', 2: 'verduras', 3: 'frutas', 4: 'lacteos', 5: 'despensa' };
        
        dbProducts.forEach(dbP => {
          const catName = categoryMap[dbP.category_id] || 'verduras';
          const existingIdx = PRODUCTS_DATA.findIndex(p => 
            p.id === String(dbP.id) || 
            (p.numericId && Number(p.numericId) === Number(dbP.id)) ||
            p.title.toLowerCase() === dbP.title.toLowerCase()
          );

          const normalizedImg = normalizeProductImageUrl(dbP.image_url);
          const priceNum = Number(dbP.price);
          const origPrice = Math.round(priceNum * 1.15 * 100) / 100;
          const isAvail = (dbP.is_active !== undefined) ? dbP.is_active : (dbP.is_available ?? true);

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
              subtitle: `${dbP.unit} · Cosechado en finca`,
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
              subtitle: `${dbP.unit} · Cosechado en finca`,
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
        console.log(`Catálogo sincronizado exitosamente desde Supabase (${dbProducts.length} productos sin filtros de nodo).`);
      }
    } catch (e) {
      console.warn('Error cargando productos de Supabase:', e);
    }
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

  container.innerHTML = filtered.map(p => {
    const itemInCart = cart.find(item => item.id === p.id);
    const cartQty = itemInCart ? itemInCart.quantity : 0;
    const isFav = isProductFavorite(p.id);
    const stats = getProductReviewStats(p.id);

    return `
      <div 
        class="product-card bg-white rounded-2xl border ${isFav ? 'border-[#c85a32]/40 ring-1 ring-[#c85a32]/20' : 'border-stone-200'} overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-stone-300 relative"
        onclick="openProductDetailPage('${p.id}', event)"
      >
        
        <!-- Contenedor de Imagen y Badges -->
        <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
          <img 
            src="${normalizeProductImageUrl(p.image)}" 
            alt="${p.title}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onerror="this.src='https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg'"
          >

          <!-- Tag Superior Izquierdo -->
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
            ${isFav ? `
              <span class="bg-[#c85a32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <span>❤️</span><span>Fijado</span>
              </span>
            ` : ''}
            <span class="bg-white/95 backdrop-blur-sm text-[#1a3d2f] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ${p.tag}
            </span>
          </div>

          <!-- Botón Favorito Superior Derecho -->
          <button 
            type="button"
            onclick="toggleProductFavorite('${p.id}', event)" 
            class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-20 cursor-pointer ${
              isFav 
                ? 'bg-white text-[#c85a32] ring-2 ring-[#c85a32]/30 scale-105 hover:scale-115' 
                : 'bg-white/95 backdrop-blur-sm text-stone-400 hover:text-[#c85a32] hover:bg-white hover:scale-110'
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
            <h3 class="font-bold text-stone-900 text-sm group-hover:text-[#1a3d2f] transition">${p.title}</h3>
            <p class="text-[11px] text-stone-500 mt-0.5">${p.subtitle}</p>
            <p class="text-[10px] text-stone-400 mt-1">${p.origin}</p>

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
              <span>${p.availability}</span>
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

function setupSearchListener() {
  const input = document.getElementById('market-search');
  if (input) {
    input.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
    });
  }
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
    drawer.classList.remove('pointer-events-none');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
    panel.classList.remove('translate-x-full');
  }

  function closeCart() {
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    panel.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('pointer-events-none');
    }, 300);
  }

  if (openBtn) openBtn.onclick = openCart;
  if (closeBtn) closeBtn.onclick = closeCart;
  if (backdrop) backdrop.onclick = closeCart;

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
  switchAuthTab(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
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
// 8. Selector Interactivo de Ubicación en Header y Redirección a Checkout Dedicado
// =============================================================================

let headerPickupNodes = [];
let headerDeliveryAddresses = [];
let activeDeliveryPreference = {
  type: 'node', // 'node' | 'home'
  id: null,
  name: 'Nodo Central',
  detail: 'Carrera 5 n.º 30A-10 · Bogotá'
};

/**
 * Inicializa el selector de ubicación del header (nodos y domicilios)
 */
async function initHeaderLocationSelector() {
  // 1. Cargar preferencia guardada en localStorage
  try {
    const saved = localStorage.getItem('raiz_delivery_preference');
    if (saved) {
      activeDeliveryPreference = JSON.parse(saved);
      updateHeaderLocationPillUI(activeDeliveryPreference.name);
    }
  } catch (e) {
    console.warn('Error leyendo raiz_delivery_preference:', e);
  }

  // 2. Cargar datos desde Supabase
  await loadHeaderLocationData();

  // 3. Listener para cerrar dropdown al hacer clic fuera
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('header-location-dropdown');
    const btn = document.getElementById('header-location-btn');
    if (!dropdown || dropdown.classList.contains('hidden')) return;

    if (btn && (btn === e.target || btn.contains(e.target))) return;
    if (dropdown.contains(e.target)) return;

    closeHeaderLocationDropdown();
  });
}

/**
 * Carga nodos activos y direcciones del usuario desde Supabase
 */
async function loadHeaderLocationData() {
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const userId = user?.id;

  // A. Nodos comunitarios activos
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const nodes = await window.supabase.fetchApi('pickup_nodes?is_active=eq.true&order=created_at.asc');
      if (Array.isArray(nodes) && nodes.length > 0) {
        headerPickupNodes = nodes;
      }
    } catch (err) {
      console.warn('Error cargando pickup_nodes para header:', err);
    }
  }

  if (headerPickupNodes.length === 0) {
    headerPickupNodes = [
      {
        id: 'e0177a54-9cbc-4426-a538-1d630f852ac1',
        name: 'Sede Urdesa · Espacio Verde',
        address: 'Av. Víctor Emilio Estrada y Bálsamos',
        city: 'Guayaquil',
        pickup_schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
        is_active: true
      },
      {
        id: '65925730-63b5-486f-9dd0-aaac13a0ffe9',
        name: 'Sede Puerto Santa Ana · Café del Río',
        address: 'Numa Pompilio Llona, Edificio The Point',
        city: 'Guayaquil',
        pickup_schedule: 'Jueves y Sábado: 8:30 AM – 1:30 PM',
        is_active: true
      },
      {
        id: '7a6f8f1f-ad1b-4f87-9d7f-58f1d3c5053c',
        name: 'Sede Ceibos · Mercado Sostenible',
        address: 'Av. del Bombero Km 6.5, Plaza Ceibos',
        city: 'Guayaquil',
        pickup_schedule: 'Sábados: 8:00 AM – 2:00 PM',
        is_active: true
      }
    ];
  }

  // B. Direcciones del usuario si está autenticado
  if (userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&order=is_preferred.desc,created_at.desc`);
      if (Array.isArray(addrs)) {
        headerDeliveryAddresses = addrs;
      }
    } catch (err) {
      console.warn('Error cargando delivery_addresses para header:', err);
    }
  }

  // Si no había preferencia explícita en localStorage pero el usuario tiene perfil con preferencias en Supabase
  if (!localStorage.getItem('raiz_delivery_preference') && userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const profs = await window.supabase.fetchApi(`profiles?id=eq.${userId}&select=*`);
      if (profs && profs.length > 0) {
        const p = profs[0];
        if (p.active_delivery_mode === 'home' && headerDeliveryAddresses.length > 0) {
          const prefAddr = headerDeliveryAddresses.find(a => a.id === p.preferred_delivery_address_id) || headerDeliveryAddresses[0];
          activeDeliveryPreference = {
            type: 'home',
            id: prefAddr.id,
            name: `${prefAddr.label || 'Casa'} · ${prefAddr.street_address}`,
            detail: `${prefAddr.neighborhood || ''} · ${prefAddr.city || 'Bogotá'}`
          };
          updateHeaderLocationPillUI(activeDeliveryPreference.name);
        } else if (p.preferred_pickup_node_id && headerPickupNodes.length > 0) {
          const prefNode = headerPickupNodes.find(n => n.id === p.preferred_pickup_node_id) || headerPickupNodes[0];
          activeDeliveryPreference = {
            type: 'node',
            id: prefNode.id,
            name: prefNode.name,
            detail: prefNode.address
          };
          updateHeaderLocationPillUI(activeDeliveryPreference.name);
        }
      }
    } catch (_) {}
  }

  // Renderizar contenido del dropdown
  renderHeaderLocationDropdown();
}

/**
 * Alterna visibilidad del dropdown del header
 */
function toggleHeaderLocationDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('header-location-dropdown');
  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    renderHeaderLocationDropdown();
    dropdown.classList.remove('hidden');
  } else {
    dropdown.classList.add('hidden');
  }
}

/**
 * Cierra el dropdown del header
 */
function closeHeaderLocationDropdown() {
  const dropdown = document.getElementById('header-location-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/**
 * Renderiza las listas de nodos y domicilios en el dropdown
 */
function renderHeaderLocationDropdown() {
  const nodesContainer = document.getElementById('header-dropdown-nodes-list');
  const addrsContainer = document.getElementById('header-dropdown-addrs-list');

  // 1. Renderizar Nodos Comunitarios
  if (nodesContainer) {
    if (headerPickupNodes.length === 0) {
      nodesContainer.innerHTML = '<p class="text-[11px] text-stone-400 p-2">No hay nodos disponibles.</p>';
    } else {
      nodesContainer.innerHTML = headerPickupNodes.map(node => {
        const isSelected = activeDeliveryPreference.type === 'node' && (
          activeDeliveryPreference.id === node.id || 
          (!activeDeliveryPreference.id && node.name.includes('Nodo Central'))
        );

        return `
          <button 
            type="button" 
            onclick="selectHeaderLocation('node', '${node.id}', '${escapeHtml(node.name).replace(/'/g, "\\'")}', '${escapeHtml(node.address).replace(/'/g, "\\'")}')"
            class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
              isSelected 
                ? 'bg-[#f0f6f2] border-[#1a3d2f] text-stone-900 font-bold shadow-2xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
            } cursor-pointer group"
          >
            <div class="min-w-0 flex-1 pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">🏛️</span>
                <span class="font-bold text-xs truncate ${isSelected ? 'text-[#1a3d2f]' : 'text-stone-800'}">${escapeHtml(node.name)}</span>
              </div>
              <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(node.address)} · ${escapeHtml(node.city || 'Bogotá')}</p>
              <p class="text-[10px] text-emerald-700 font-medium ml-4">${escapeHtml(node.pickup_schedule || 'Sábados')}</p>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">Gratis</span>
              ${isSelected ? '<span class="text-[#1a3d2f] font-bold text-xs">✓</span>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }

  // 2. Renderizar Direcciones a Domicilio
  if (addrsContainer) {
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (!user || !user.loggedIn) {
      addrsContainer.innerHTML = `
        <div class="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-center">
          <p class="text-[11px] text-stone-600 font-medium">Inicia sesión para seleccionar tus domicilios</p>
          <button 
            type="button" 
            onclick="closeHeaderLocationDropdown(); openAuthModal('login');" 
            class="mt-1.5 text-[11px] font-bold text-[#1a3d2f] hover:underline cursor-pointer"
          >
            Iniciar sesión →
          </button>
        </div>
      `;
    } else if (headerDeliveryAddresses.length === 0) {
      addrsContainer.innerHTML = `
        <div class="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center">
          <p class="text-[11px] text-stone-500">No tienes direcciones guardadas.</p>
          <a 
            href="perfil.html" 
            class="inline-block mt-1 text-[11px] font-bold text-[#1a3d2f] hover:underline"
          >
            + Agregar dirección en mi perfil
          </a>
        </div>
      `;
    } else {
      addrsContainer.innerHTML = headerDeliveryAddresses.map(addr => {
        const isSelected = activeDeliveryPreference.type === 'home' && activeDeliveryPreference.id === addr.id;
        const displayName = `${addr.label || 'Domicilio'} · ${addr.street_address}`;

        return `
          <button 
            type="button" 
            onclick="selectHeaderLocation('home', '${addr.id}', '${escapeHtml(displayName).replace(/'/g, "\\'")}', '${escapeHtml(addr.neighborhood || addr.city).replace(/'/g, "\\'")}')"
            class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
              isSelected 
                ? 'bg-[#f0f6f2] border-[#1a3d2f] text-stone-900 font-bold shadow-2xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
            } cursor-pointer group"
          >
            <div class="min-w-0 flex-1 pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">🏡</span>
                <span class="font-bold text-xs truncate ${isSelected ? 'text-[#1a3d2f]' : 'text-stone-800'}">${escapeHtml(addr.label || 'Casa')}</span>
              </div>
              <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(addr.street_address)}</p>
              <p class="text-[10px] text-stone-400 ml-4">${escapeHtml(addr.neighborhood ? addr.neighborhood + ' · ' : '')}${escapeHtml(addr.city || 'Bogotá')}</p>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">$8.000</span>
              ${isSelected ? '<span class="text-[#1a3d2f] font-bold text-xs">✓</span>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }
}

/**
 * Selecciona una ubicación (nodo o domicilio), actualiza UI y persiste
 */
async function selectHeaderLocation(type, id, name, detail) {
  activeDeliveryPreference = { type, id, name, detail };

  // 1. Guardar en localStorage
  try {
    localStorage.setItem('raiz_delivery_preference', JSON.stringify(activeDeliveryPreference));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }

  // 2. Actualizar texto de la píldora en Navbar
  updateHeaderLocationPillUI(name);

  // 3. Cerrar dropdown
  closeHeaderLocationDropdown();

  // 4. Mostrar feedback toast
  showToast(`📍 Entregas configuradas en: ${name}`);

  // 5. Persistir en Supabase si el usuario está autenticado
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const userId = user?.id;

  if (userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const updateData = { active_delivery_mode: type };
      if (type === 'node') {
        updateData.preferred_pickup_node_id = id;
      } else if (type === 'home') {
        updateData.preferred_delivery_address_id = id;
      }
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    } catch (errSupabase) {
      console.warn('Error guardando preferencia en Supabase profiles:', errSupabase);
    }
  }

  // 6. Actualizar visualmente badges de entrega en las fichas de productos
  updateCatalogDeliveryCues(name);
}

/**
 * Actualiza el texto de la píldora del header
 */
function updateHeaderLocationPillUI(name) {
  const pillLabel = document.getElementById('header-node-name');
  if (pillLabel) {
    const short = name.length > 24 ? name.substring(0, 22) + '...' : name;
    pillLabel.textContent = short;
    pillLabel.title = name;
  }
}

/**
 * Actualiza la información de entrega en el catálogo según la zona
 */
function updateCatalogDeliveryCues(locationName) {
  const deliveryCueElements = document.querySelectorAll('.product-delivery-cue');
  deliveryCueElements.forEach(el => {
    el.textContent = `Disponible para entrega en ${locationName}`;
  });
}

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

window.toggleHeaderLocationDropdown = toggleHeaderLocationDropdown;
window.closeHeaderLocationDropdown = closeHeaderLocationDropdown;
window.selectHeaderLocation = selectHeaderLocation;
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

