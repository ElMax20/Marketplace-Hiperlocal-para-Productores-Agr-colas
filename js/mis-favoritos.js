/**
 * Raíz & Barrio - Vista "Mis favoritos"
 * Gestión reactiva del catálogo de productos guardados,
 * sincronización bidireccional con Supabase y adición al carrito global.
 */

let activeFavoritesList = [];

document.addEventListener('DOMContentLoaded', () => {
  initMisFavoritos();
});

// Listener para actualizaciones de favoritos emitidas por otros componentes
window.addEventListener('favorites-updated', () => {
  reloadFavoritesUI();
});

/**
 * Inicialización principal de la vista Mis Favoritos
 */
async function initMisFavoritos() {
  // 1. Verificación de Sesión Activa
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (!user || !user.loggedIn) {
    // Si no hay sesión activa al entrar a mis-favoritos.html, redirige a index.html
    window.location.replace('index.html?openLogin=true');
    return;
  }

  // 2. Inicializar contador del carrito
  updateCartBadge();

  // 3. Renderizado inmediato con caché local (Zero-Flicker)
  await reloadFavoritesUI();

  // 4. Sincronización en vivo con Supabase
  if (window.FavoritesService && typeof window.FavoritesService.syncWithSupabase === 'function') {
    await window.FavoritesService.syncWithSupabase();
    await reloadFavoritesUI();
  }
}

/**
 * Recarga la lista de favoritos y renderiza el estado correspondiente
 */
async function reloadFavoritesUI() {
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (!user || !user.loggedIn) return;

  // Obtener IDs de favoritos actuales
  const favIds = (window.FavoritesService && typeof window.FavoritesService.getFavorites === 'function')
    ? window.FavoritesService.getFavorites()
    : getStoredFavorites();

  // Resolver objetos de productos completos
  activeFavoritesList = await resolveFavoriteProducts(favIds);

  renderFavoritesView(activeFavoritesList);
}

/**
 * Obtiene IDs guardados en localStorage
 */
function getStoredFavorites() {
  try {
    const raw = localStorage.getItem('raiz_favorites');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch (_) {}
  return [];
}

/**
 * Resuelve la información completa de cada producto favorito
 */
async function resolveFavoriteProducts(favIds) {
  if (!Array.isArray(favIds) || favIds.length === 0) return [];

  const catalog = window.PRODUCTS_DATA || (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
  const resolved = [];
  const missingIds = [];

  for (const favId of favIds) {
    const strId = String(favId).trim();
    // 1. Buscar en catálogo estático en memoria
    const match = catalog.find(p => p.id === strId || String(p.numericId) === strId);
    if (match) {
      resolved.push(formatProduct(match));
    } else {
      missingIds.push(strId);
    }
  }

  // 2. Si hay productos de base de datos no incluidos en PRODUCTS_DATA, consultarlos en Supabase
  if (missingIds.length > 0 && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      for (const mId of missingIds) {
        const query = isNaN(Number(mId)) ? `id=eq.${mId}` : `id=eq.${mId}`;
        const res = await window.supabase.fetchApi(`products?${query}&select=*`);
        if (Array.isArray(res) && res.length > 0) {
          resolved.push(formatProduct(res[0]));
        }
      }
    } catch (err) {
      console.warn('Error resolviendo productos faltantes en Supabase:', err);
    }
  }

  return resolved;
}

/**
 * Normaliza los campos de un producto para la tarjeta de Favoritos
 */
function formatProduct(p) {
  const id = p.id || String(p.numericId);
  const numericId = p.numericId || p.id;
  const title = p.title || 'Producto de cercanía';

  // Presentación / Subtítulo
  let presentation = p.subtitle || p.unit || '1 kg · selección de temporada';
  if (presentation.includes(' · ')) {
    // Ya tiene formato adecuado
  } else if (p.unit) {
    presentation = `${p.unit} · Cosecha fresca`;
  }

  // Productor y Localidad
  let producerName = 'Familia Productora';
  let producerLocation = 'Guayaquil y valles cercanos';
  if (p.origin) {
    const parts = p.origin.split('·').map(s => s.trim());
    if (parts.length >= 1 && parts[0]) producerName = parts[0];
    if (parts.length >= 2 && parts[1]) producerLocation = parts[1];
    if (p.distanceKm) producerLocation += ` · a ${p.distanceKm} km`;
  } else if (p.farm_name) {
    producerName = p.farm_name;
    producerLocation = p.location || 'Guayaquil · a 30 km';
  }

  // Calificación
  const ratingNum = Number(p.rating || 4.9).toFixed(1);
  const rating = ratingNum === '0.0' ? '4.9' : ratingNum;
  const reviews = p.reviews || p.reviews_count || 48;

  // Precio formateado en USD
  const priceNum = Number(p.price || 2.50);
  const priceDisplay = priceNum.toFixed(2);

  // Unidad de venta
  let unit = '1 kg';
  if (p.unit) {
    unit = p.unit;
  } else if (presentation.toLowerCase().includes('canasta')) {
    unit = 'canasta';
  } else if (presentation.toLowerCase().includes('kg')) {
    unit = '1 kg';
  } else if (presentation.toLowerCase().includes('500')) {
    unit = '500 g';
  }

  // Imagen
  const image = p.image || p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

  return {
    id,
    numericId,
    title,
    presentation,
    producerName,
    producerLocation,
    rating,
    reviews,
    price: priceNum,
    priceDisplay,
    unit,
    image,
    raw: p
  };
}

/**
 * Renderiza el DOM según la cantidad de favoritos
 */
function renderFavoritesView(products) {
  const gridContainer = document.getElementById('favorites-grid-container');
  const emptyContainer = document.getElementById('favorites-empty-container');
  const countPill = document.getElementById('fav-count-pill');
  const countFooter = document.getElementById('favorites-count-footer');
  const productsGrid = document.getElementById('favorites-products-grid');

  const count = products.length;

  // Actualizar píldora de conteo superior
  if (countPill) {
    countPill.textContent = `${count} ${count === 1 ? 'favorito' : 'favoritos'}`;
  }

  if (count === 0) {
    // ESTADO VACÍO (Mis favoritos · Vacío.png)
    if (gridContainer) gridContainer.classList.add('hidden');
    if (emptyContainer) emptyContainer.classList.remove('hidden');
  } else {
    // ESTADO CON PRODUCTOS (Mis favoritos · Demostración.jpg)
    if (emptyContainer) emptyContainer.classList.add('hidden');
    if (gridContainer) gridContainer.classList.remove('hidden');

    if (countFooter) {
      countFooter.textContent = `Mostrando tus ${count} ${count === 1 ? 'producto guardado' : 'productos guardados'}`;
    }

    if (productsGrid) {
      productsGrid.innerHTML = products.map(prod => `
        <article 
          id="fav-card-${prod.id}" 
          class="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group p-3.5"
        >
          <!-- Contenedor de Imagen y Botón Circular de Favorito -->
          <div class="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100">
            <img 
              src="${escapeHtml(prod.image)}" 
              alt="${escapeHtml(prod.title)}" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            >
            <!-- Botón flotante corazón lleno oscuro para desmarcar -->
            <button 
              type="button" 
              onclick="handleRemoveFavorite('${prod.id}', event)" 
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-stone-900 hover:text-red-500 hover:scale-110 transition cursor-pointer z-10"
              title="Quitar de favoritos"
              aria-label="Quitar ${escapeHtml(prod.title)} de favoritos"
            >
              <svg class="w-4 h-4 fill-stone-900 text-stone-900" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          <!-- Cuerpo de la tarjeta -->
          <div class="p-2.5 pt-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-serif text-xl sm:text-2xl font-bold text-[#143628] leading-tight">
                ${escapeHtml(prod.title)}
              </h3>
              <p class="text-xs text-stone-500 mt-1">
                ${escapeHtml(prod.presentation)}
              </p>

              <!-- Datos de finca y procedencia -->
              <p class="text-xs font-semibold text-stone-700 mt-3 truncate">
                ${escapeHtml(prod.producerName)}
              </p>
              <p class="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5 truncate">
                <span>📍</span>
                <span>${escapeHtml(prod.producerLocation)}</span>
              </p>

              <!-- Calificación con estrellas doradas -->
              <div class="flex items-center gap-1.5 mt-2">
                <span class="text-amber-500 text-xs font-bold tracking-tighter">★★★★★</span>
                <span class="text-xs font-bold text-stone-800">${prod.rating}</span>
                <span class="text-xs text-stone-400">(${prod.reviews})</span>
              </div>

              <!-- Precio en Dólares USD -->
              <div class="mt-4 flex items-baseline gap-1.5">
                <span class="text-2xl font-bold text-stone-900">$${prod.priceDisplay}</span>
                <span class="text-xs text-stone-500 font-medium uppercase tracking-wider">USD / ${escapeHtml(prod.unit)}</span>
              </div>
            </div>

            <!-- Acciones: Añadir al carrito & Quitar de favoritos -->
            <div class="mt-4 pt-2">
              <button 
                type="button" 
                id="btn-add-${prod.id}"
                onclick="handleAddToCart('${prod.id}')" 
                class="w-full bg-[#143628] hover:bg-[#204a37] text-white text-xs font-bold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
              >
                + Añadir al carrito
              </button>

              <button 
                type="button" 
                onclick="handleRemoveFavorite('${prod.id}', event)" 
                class="mt-2.5 text-[11px] font-medium text-stone-400 hover:text-red-600 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                ✕ Quitar de favoritos
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }
  }
}

/**
 * Añade un producto al carrito global y actualiza UI
 */
function handleAddToCart(productId) {
  const prod = activeFavoritesList.find(p => p.id === productId || String(p.numericId) === productId);
  if (!prod) return;

  try {
    const rawCart = localStorage.getItem('raiz_cart');
    let cart = rawCart ? JSON.parse(rawCart) : [];
    if (!Array.isArray(cart)) cart = [];

    const existing = cart.find(item => item.id === prod.id || String(item.id) === String(prod.numericId));
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        image: prod.image,
        subtitle: prod.presentation,
        quantity: 1
      });
    }

    localStorage.setItem('raiz_cart', JSON.stringify(cart));
    updateCartBadge();

    // Feedback visual en el botón
    const btn = document.getElementById(`btn-add-${prod.id}`);
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.classList.remove('bg-[#143628]', 'hover:bg-[#204a37]');
      btn.classList.add('bg-emerald-700', 'text-white');
      btn.innerHTML = `<span>✓</span><span>¡Añadido!</span>`;
      setTimeout(() => {
        btn.classList.remove('bg-emerald-700');
        btn.classList.add('bg-[#143628]', 'hover:bg-[#204a37]');
        btn.innerHTML = originalHtml;
      }, 1500);
    }

    showToast(`✓ ¡${prod.title} añadido a tu canasta!`);
  } catch (e) {
    console.error('Error al agregar al carrito:', e);
  }
}

/**
 * Elimina un producto de favoritos con transición suave
 */
async function handleRemoveFavorite(productId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const card = document.getElementById(`fav-card-${productId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.25s ease';
  }

  // Eliminar a través del servicio centralizado
  if (window.FavoritesService && typeof window.FavoritesService.toggleFavorite === 'function') {
    await window.FavoritesService.toggleFavorite(productId);
  } else {
    let favs = getStoredFavorites();
    favs = favs.filter(id => id !== productId && id !== String(productId));
    localStorage.setItem('raiz_favorites', JSON.stringify(favs));
    showToast('✕ Producto eliminado de favoritos');
  }

  // Breve espera para la animación de salida
  setTimeout(() => {
    reloadFavoritesUI();
  }, 220);
}

/**
 * Actualiza el contador numérico del carrito en el navbar
 */
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  try {
    const rawCart = localStorage.getItem('raiz_cart');
    const cart = rawCart ? JSON.parse(rawCart) : [];
    const count = Array.isArray(cart) ? cart.reduce((acc, i) => acc + (i.quantity || 1), 0) : 0;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch (_) {
    badge.style.display = 'none';
  }
}

/**
 * Toast flotante de retroalimentación
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
  toast.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
  }, 3500);
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

window.initMisFavoritos = initMisFavoritos;
window.reloadFavoritesUI = reloadFavoritesUI;
window.handleAddToCart = handleAddToCart;
window.handleRemoveFavorite = handleRemoveFavorite;
window.updateCartBadge = updateCartBadge;
window.showToast = showToast;
