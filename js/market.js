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
    title: 'Tomate de huerta',
    category: 'verduras',
    tag: 'Cosecha fresca',
    discount: '-25%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
    subtitle: '1 kg · Selección de temporada',
    origin: 'Finca La Esperanza · Choachí · a 32 km',
    rating: '4.9',
    reviews: 88,
    price: 6400,
    originalPrice: 8500,
    availability: 'Disponible · cosecha del día',
    distanceKm: 32,
    isOffer: true
  },
  {
    id: 'aguacate-hass',
    title: 'Aguacate Hass',
    category: 'frutas',
    tag: 'Listo para pronto',
    discount: '-15%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg',
    subtitle: '1 kg · 4 a 5 unidades aprox.',
    origin: 'Familia Rojas · La Vega · a 52 km',
    rating: '4.8',
    reviews: 64,
    price: 10200,
    originalPrice: 12000,
    availability: 'Disponible · maduro/semimaduro',
    distanceKm: 52,
    isOffer: true
  },
  {
    id: 'zanahoria-tierra',
    title: 'Zanahoria de tierra',
    category: 'verduras',
    tag: 'Cosechado hoy',
    discount: '-20%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg',
    subtitle: '1 kg · con toda su frescura',
    origin: 'Huerta El Renacer · Subachoque · a 45 km',
    rating: '4.9',
    reviews: 112,
    price: 4000,
    originalPrice: 5000,
    availability: 'Disponible · cosecha del día',
    distanceKm: 45,
    isOffer: true
  },
  {
    id: 'canasta-huerto-familiar',
    title: 'Canasta Huerto Familiar',
    category: 'canastas',
    tag: 'La favorita del barrio',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg',
    subtitle: '9-10 kg · para 3 a 5 personas',
    origin: 'Red de Familias de Choachí · Choachí · a 30 km',
    rating: '4.9',
    reviews: 214,
    price: 58000,
    originalPrice: null,
    availability: 'Disponible · 11 canastas',
    distanceKm: 30,
    isOffer: false
  },
  {
    id: 'fresas-temporada',
    title: 'Fresas de temporada',
    category: 'frutas',
    tag: 'De temporada',
    discount: '-20%',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg',
    subtitle: '500 g · seleccionadas a mano',
    origin: 'Cooperativa La Colina · Sibaté · a 27 km',
    rating: '4.8',
    reviews: 93,
    price: 8000,
    originalPrice: 10000,
    availability: 'Disponible · cosechadas hoy',
    distanceKm: 27,
    isOffer: true
  },
  {
    id: 'queso-campesino',
    title: 'Queso campesino',
    category: 'lacteos',
    tag: 'Artesanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso_campesino.jpg',
    subtitle: '500 g · fresco de pastoreo',
    origin: 'Lácteos La Pradera · Sopó · a 42 km',
    rating: '4.9',
    reviews: 53,
    price: 14500,
    originalPrice: null,
    availability: 'Disponible · elaboración de ayer',
    distanceKm: 42,
    isOffer: false
  },
  {
    id: 'miel-flores',
    title: 'Miel de flores silvestres',
    category: 'despensa',
    tag: 'Cosecha local',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel_silvestre.jpg',
    subtitle: '500 g · pura, sin mezclas',
    origin: 'Apiario Monte Vivo · La Calera · a 18 km',
    rating: '5.0',
    reviews: 47,
    price: 22000,
    originalPrice: null,
    availability: 'Disponible · lote de noviembre',
    distanceKm: 18,
    isOffer: false
  },
  {
    id: 'papa-criolla',
    title: 'Papa criolla',
    category: 'verduras',
    tag: 'Recién cosechada',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/papa_criolla.jpg',
    subtitle: '1 kg · lavada y seleccionada',
    origin: 'Finca Las Margaritas · Usme · a 29 km',
    rating: '4.8',
    reviews: 82,
    price: 5500,
    originalPrice: null,
    availability: 'Disponible · cosechado la semana',
    distanceKm: 29,
    isOffer: false
  },
  {
    id: 'yogur-pastoreo',
    title: 'Yogur natural de pastoreo',
    category: 'lacteos',
    tag: 'Artesanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/yogur_pastoreo.jpg',
    subtitle: '1 litro · sin azúcar añadida',
    origin: 'Lácteos La Pradera · Sopó · a 42 km',
    rating: '4.9',
    reviews: 39,
    price: 12000,
    originalPrice: null,
    availability: 'Disponible · conservar refrigerado',
    distanceKm: 42,
    isOffer: false
  },
  {
    id: 'banano-criollo',
    title: 'Banano criollo',
    category: 'frutas',
    tag: 'De temporada',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/banano_criollo.jpg',
    subtitle: '1 kg · 6 a 8 unidades aprox.',
    origin: 'Finca El Porvenir · San Francisco · a 68 km',
    rating: '4.8',
    reviews: 40,
    price: 4800,
    originalPrice: null,
    availability: 'Disponible · maduración natural',
    distanceKm: 68,
    isOffer: false
  },
  {
    id: 'mermelada-mora',
    title: 'Mermelada de mora',
    category: 'despensa',
    tag: 'Hecho en pequeñas tandas',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/mermelada_mora.jpg',
    subtitle: '250 g · fruta + panela',
    origin: 'Sabores de la Abuela · Tabio · a 35 km',
    rating: '4.8',
    reviews: 23,
    price: 13500,
    originalPrice: null,
    availability: 'Disponible · elaboración artesanal',
    distanceKm: 35,
    isOffer: false
  },
  {
    id: 'canasta-agroecologica',
    title: 'Canasta Agroecológica',
    category: 'canastas',
    tag: 'Selección semanal',
    discount: null,
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg',
    subtitle: '6-7 kg · ideal 1 a 2 personas',
    origin: 'Familia Moreno · Bojacá/Facatativá · a 40 km',
    rating: '4.8',
    reviews: 75,
    price: 36000,
    originalPrice: null,
    availability: 'Disponible · 8 canastas',
    distanceKm: 40,
    isOffer: false
  }
];

// =============================================================================
// 2. Estado de la Aplicación
// =============================================================================
let currentCategory = 'todos';
let searchQuery = '';
let offersOnly = false;
let currentSort = 'recomendados';
let cart = [];

// =============================================================================
// 3. Inicialización
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCartFromStorage();
  checkAuthStatus();
  parseUrlParams();
  renderProducts();
  setupCartDrawerListeners();
  setupSearchListener();
  loadProductsFromSupabase();
});

// Cargar catálogo en tiempo real desde Supabase
async function loadProductsFromSupabase() {
  if (window.supabase && typeof window.supabase.getProducts === 'function') {
    try {
      const dbProducts = await window.supabase.getProducts();
      if (dbProducts && dbProducts.length > 0) {
        const categoryMap = { 1: 'canastas', 2: 'verduras', 3: 'frutas', 4: 'lacteos', 5: 'despensa' };
        
        dbProducts.forEach(dbP => {
          const catName = categoryMap[dbP.category_id] || 'verduras';
          const existingIdx = PRODUCTS_DATA.findIndex(p => p.id === String(dbP.id) || p.title.toLowerCase() === dbP.title.toLowerCase());
          const mapped = {
            id: String(dbP.id),
            title: dbP.title,
            category: catName,
            tag: 'Cosecha fresca',
            image: dbP.image_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
            subtitle: `${dbP.unit} · Cosechado en finca`,
            origin: dbP.description || 'Finca campesina aliada',
            rating: '4.9',
            reviews: 45,
            price: Number(dbP.price),
            originalPrice: Math.round(Number(dbP.price) * 1.15),
            availability: dbP.is_available ? 'Disponible · Supabase' : 'Agotado',
            distanceKm: 38,
            isOffer: false
          };

          if (existingIdx !== -1) {
            PRODUCTS_DATA[existingIdx] = { ...PRODUCTS_DATA[existingIdx], ...mapped };
          } else {
            PRODUCTS_DATA.push(mapped);
          }
        });

        renderProducts();
        console.log(`Catálogo sincronizado exitosamente desde Supabase (${dbProducts.length} productos).`);
      }
    } catch (e) {
      console.warn('Error cargando productos de Supabase:', e);
    }
  }
}

// Leer parámetros de URL (por ejemplo si viene de "Explorar Canastas" -> ?categoria=canastas)
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('categoria') || params.get('cat');
  if (cat) {
    currentCategory = cat;
    highlightCategoryButton(cat);
  }
}

// =============================================================================
// 4. Renderizado y Filtro de Productos
// =============================================================================
function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  let filtered = PRODUCTS_DATA.filter(p => {
    // Categoría
    if (currentCategory !== 'todos' && p.category !== currentCategory) {
      return false;
    }
    // Ofertas
    if (offersOnly && !p.isOffer) {
      return false;
    }
    // Búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchOrigin = p.origin.toLowerCase().includes(q);
      const matchSub = p.subtitle.toLowerCase().includes(q);
      if (!matchTitle && !matchOrigin && !matchSub) return false;
    }
    return true;
  });

  // Ordenamiento
  if (currentSort === 'precio-menor') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'precio-mayor') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'calificacion') {
    filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }

  // Actualizar etiqueta de conteo
  const countLabel = document.getElementById('products-count-label');
  if (countLabel) {
    countLabel.textContent = `${filtered.length} productos para tu próxima entrega`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3 text-2xl">🌱</div>
        <h4 class="font-serif text-lg font-bold text-stone-700">No encontramos cosechas con esos filtros</h4>
        <p class="text-xs text-stone-500 mt-1">Prueba seleccionando otra categoría o borrando tu búsqueda.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-[#1a3d2f] text-white rounded-full text-xs font-bold hover:bg-[#255240] transition">
          Ver todos los productos
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const itemInCart = cart.find(item => item.id === p.id);
    const cartQty = itemInCart ? itemInCart.quantity : 0;

    return `
      <div class="product-card bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between group">
        
        <!-- Contenedor de Imagen y Badges -->
        <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
          <img 
            src="${p.image}" 
            alt="${p.title}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onerror="this.src='https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg'"
          >

          <!-- Tag Superior Izquierdo -->
          <span class="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#1a3d2f] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            ${p.tag}
          </span>

          <!-- Botón Favorito Superior Derecho -->
          <button class="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm text-stone-400 hover:text-[#c85a32] flex items-center justify-center shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
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
              <span class="text-amber-500 font-bold">★ ${p.rating}</span>
              <span class="text-stone-400 text-[10px]">(${p.reviews})</span>
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
              <div class="w-full flex items-center justify-between bg-stone-100 rounded-full px-2 py-1 text-xs font-bold text-[#1a3d2f]">
                <button onclick="decrementProduct('${p.id}')" class="w-7 h-7 rounded-full bg-white hover:bg-stone-200 flex items-center justify-center text-sm shadow-sm transition">-</button>
                <span>${cartQty} en tu carrito</span>
                <button onclick="incrementProduct('${p.id}')" class="w-7 h-7 rounded-full bg-white hover:bg-stone-200 flex items-center justify-center text-sm shadow-sm transition">+</button>
              </div>
            ` : `
              <button onclick="addProductToCart('${p.id}')" class="w-full bg-[#1a3d2f] hover:bg-[#255240] text-white text-xs font-bold py-2.5 rounded-full transition shadow-sm flex items-center justify-center gap-1.5">
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
// 5. Manejo de Filtros y Búsqueda
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
        btn.className = "w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold bg-[#1a3d2f] text-white transition text-left";
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

function sortProducts() {
  const select = document.getElementById('sort-select');
  if (select) {
    currentSort = select.value;
    renderProducts();
  }
}

function resetFilters() {
  currentCategory = 'todos';
  offersOnly = false;
  searchQuery = '';
  const searchInput = document.getElementById('market-search');
  if (searchInput) searchInput.value = '';
  const offerCheckbox = document.getElementById('filter-offers');
  if (offerCheckbox) offerCheckbox.checked = false;
  highlightCategoryButton('todos');
  renderProducts();
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
 * Obtener usuario actual desde localStorage
 */
function getCurrentUser() {
  const data = localStorage.getItem('raiz_user');
  if (data) {
    try {
      return JSON.parse(data);
    } catch(e) {
      return null;
    }
  }
  return null;
}

/**
 * Verificar estado de sesión y actualizar botones del encabezado
 */
function checkAuthStatus() {
  const user = getCurrentUser();
  const container = document.getElementById('auth-buttons-container');
  if (!container) return;

  if (user && user.loggedIn) {
    container.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-[#1a3d2f] bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 flex items-center gap-1.5">
          <span>👤</span>
          <span>${user.name}</span>
        </span>
        <button onclick="handleLogout()" class="text-[11px] text-stone-500 hover:text-red-600 underline transition">
          Salir
        </button>
      </div>
    `;
    const nodeSpan = document.getElementById('header-node-name');
    if (nodeSpan && user.preferredNode) {
      nodeSpan.textContent = user.preferredNode.split('·')[0].trim();
    }
  } else {
    // Usuario sin cuenta (Invitado)
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="text-xs font-semibold text-stone-700 hover:text-[#1a3d2f] px-2 py-1.5 transition">
        Iniciar sesión
      </button>
      <button onclick="openAuthModal('register')" class="text-xs font-bold text-[#1a3d2f] border border-[#1a3d2f] hover:bg-[#1a3d2f] hover:text-white px-3.5 py-1.5 rounded-full transition shadow-sm">
        Registrarse
      </button>
    `;
  }
}

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

  // Si el usuario ya tiene cuenta -> Continuar directo al checkout
  if (window.closeCartDrawer) window.closeCartDrawer();
  openCheckoutModal(user);
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
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const node = document.getElementById('reg-node').value;

  const newUser = {
    name,
    email,
    phone,
    preferredNode: node,
    loggedIn: true,
    registeredAt: new Date().toISOString()
  };

  localStorage.setItem('raiz_user', JSON.stringify(newUser));
  closeAuthModal();
  checkAuthStatus();
  showToast(`¡Cuenta creada con éxito! Bienvenido, ${name}.`);

  // Si tiene productos en el carrito, pasar directamente a pagar
  if (cart.length > 0) {
    setTimeout(() => {
      openCheckoutModal(newUser);
    }, 400);
  }
}

// Inicio de Sesión
function handleLogin(e) {
  e.preventDefault();
  const inputVal = (document.getElementById('login-email').value || '').trim();
  const passEl = document.getElementById('login-pass') || document.getElementById('login-password');
  const passVal = (passEl ? passEl.value : '').trim();

  // Caso 1: Administrador
  if (inputVal === 'admin') {
    if (passVal && passVal !== 'admin123') {
      alert('Contraseña incorrecta para Administrador (prueba: admin123)');
      return;
    }
    const adminUser = { username: 'admin', role: 'admin', name: 'Lucía Torres', email: 'lucia@raizybarrio.co', loggedIn: true };
    localStorage.setItem('rb_current_user', JSON.stringify(adminUser));
    localStorage.setItem('raiz_user', JSON.stringify(adminUser));
    window.location.href = 'admin.html';
    return;
  }

  // Caso 2: Productor
  if (inputVal === 'maxp') {
    if (passVal && passVal !== '123') {
      alert('Contraseña incorrecta para Productor (prueba: 123)');
      return;
    }
    const prodUser = { username: 'maxp', role: 'productor', name: 'Max Productor', finca: 'Huerta El Renacer', loggedIn: true };
    localStorage.setItem('rb_current_user', JSON.stringify(prodUser));
    localStorage.setItem('raiz_user', JSON.stringify(prodUser));
    window.location.href = 'productor.html';
    return;
  }

  // Caso 3: Cliente (max u otro)
  let userName = inputVal.includes('@') ? inputVal.split('@')[0] : inputVal;
  if (inputVal === 'max') {
    userName = 'Max';
    if (passVal && passVal !== '123') {
      alert('Contraseña incorrecta para Cliente (prueba: 123)');
      return;
    }
  }

  const existingUser = {
    name: userName,
    email: inputVal.includes('@') ? inputVal : `${inputVal}@vecinos.com`,
    phone: '310 987 6543',
    preferredNode: 'Nodo Central · La Perseverancia',
    loggedIn: true,
    role: 'cliente'
  };

  localStorage.setItem('raiz_user', JSON.stringify(existingUser));
  localStorage.setItem('rb_current_user', JSON.stringify(existingUser));
  closeAuthModal();
  checkAuthStatus();
  showToast(`Sesión iniciada correctamente. Bienvenido ${userName}.`);

  if (cart.length > 0) {
    setTimeout(() => {
      openCheckoutModal(existingUser);
    }, 400);
  }
}

// Cerrar Sesión (vuelve a ser invitado)
function handleLogout() {
  localStorage.removeItem('raiz_user');
  checkAuthStatus();
  showToast('Has cerrado sesión. Ahora navegas como invitado.');
}

// =============================================================================
// 8. Pantalla de Checkout y Confirmación de Orden
// =============================================================================
function openCheckoutModal(user) {
  const modal = document.getElementById('checkout-modal');
  const payStep = document.getElementById('checkout-step-pay');
  const successStep = document.getElementById('checkout-step-success');
  const userInfo = document.getElementById('checkout-user-info');
  const nodeInfo = document.getElementById('checkout-node-info');
  const totalEl = document.getElementById('checkout-final-total');

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (userInfo) userInfo.textContent = `${user.name} (${user.email} - Tel: ${user.phone || 'N/A'})`;
  if (nodeInfo) nodeInfo.textContent = `📍 Punto de recogida: ${user.preferredNode || 'Nodo Central · La Perseverancia'}`;
  if (totalEl) totalEl.textContent = `$${formatCOP(totalAmount)}`;

  payStep.classList.remove('hidden');
  successStep.classList.add('hidden');
  modal.classList.remove('hidden');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

function confirmOrderPayment() {
  const payStep = document.getElementById('checkout-step-pay');
  const successStep = document.getElementById('checkout-step-success');
  const orderIdEl = document.getElementById('success-order-id');
  const successNodeEl = document.getElementById('success-node');

  const randomOrderId = '#RB-' + Math.floor(1000 + Math.random() * 9000);
  const user = getCurrentUser();

  if (orderIdEl) orderIdEl.textContent = randomOrderId;
  if (successNodeEl && user) successNodeEl.textContent = user.preferredNode || 'Nodo Central · La Perseverancia';

  // Limpiar carrito tras compra exitosa
  cart = [];
  saveCartToStorage();
  renderProducts();

  payStep.classList.add('hidden');
  successStep.classList.remove('hidden');
}

// =============================================================================
// 9. Utilidades y Notificaciones Toast
// =============================================================================
function formatCOP(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

