/**
 * Raíz & Barrio - Servicio Global de Favoritos (Wishlist)
 * Conexión real con Supabase (tabla 'favorites') y sincronización reactiva
 * con localStorage y botones de corazón en todo el proyecto.
 */

(function(window) {
  let cachedFavorites = null;

  function getCurrentAuthUser() {
    if (typeof getCurrentUser === 'function') {
      const u = getCurrentUser();
      if (u && (u.loggedIn || u.id)) return u;
    }
    try {
      const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.loggedIn || u.id)) return u;
      }
      const cached = localStorage.getItem('rb_cached_profile');
      if (cached) {
        const p = JSON.parse(cached);
        if (p && (p.id || p.full_name)) return { id: p.id, name: p.full_name, loggedIn: true };
      }
    } catch (_) {}
    return null;
  }

  function getLocalFavorites() {
    try {
      const raw = localStorage.getItem('raiz_favorites');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch (_) {}
    return [];
  }

  function saveLocalFavorites(favs) {
    try {
      localStorage.setItem('raiz_favorites', JSON.stringify(favs));
    } catch (_) {}
  }

  function isProductFavorite(productId) {
    if (!productId) return false;
    const strId = String(productId);
    const favs = cachedFavorites || getLocalFavorites();
    if (favs.includes(strId)) return true;

    // Buscar coincidencia por numericId o slug en catálogo global
    const catalog = window.PRODUCTS_DATA || (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
    if (Array.isArray(catalog)) {
      const p = catalog.find(item => item.id === strId || String(item.numericId) === strId);
      if (p) {
        return favs.includes(p.id) || (p.numericId && favs.includes(String(p.numericId)));
      }
    }
    return false;
  }

  async function syncFavoritesWithSupabase() {
    const user = getCurrentAuthUser();
    if (!user || !user.id || !window.supabase || typeof window.supabase.fetchApi !== 'function') {
      cachedFavorites = getLocalFavorites();
      updateDOMHeartButtons();
      return cachedFavorites;
    }

    try {
      const res = await window.supabase.fetchApi(`favorites?user_id=eq.${user.id}&select=product_id`);
      if (Array.isArray(res)) {
        const dbIds = res.map(r => String(r.product_id)).filter(Boolean);
        // Si Supabase tiene datos, usarlos; si está vacío pero local tiene datos, podríamos sincronizarlos
        if (dbIds.length > 0) {
          cachedFavorites = dbIds;
          saveLocalFavorites(cachedFavorites);
        } else {
          cachedFavorites = getLocalFavorites();
          // Subir a Supabase los existentes en local
          if (cachedFavorites.length > 0) {
            for (const pid of cachedFavorites) {
              try {
                await window.supabase.fetchApi('favorites', {
                  method: 'POST',
                  body: { user_id: user.id, product_id: String(pid) }
                });
              } catch (_) {}
            }
          }
        }
      } else {
        cachedFavorites = getLocalFavorites();
      }
    } catch (err) {
      cachedFavorites = getLocalFavorites();
    }

    updateDOMHeartButtons();
    return cachedFavorites;
  }

  async function toggleProductFavorite(productId, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const user = getCurrentAuthUser();
    if (!user || !user.loggedIn) {
      // Si no ha iniciado sesión, abrir modal de login
      if (typeof openAuthModal === 'function') {
        openAuthModal('login');
      } else if (typeof openLoginModal === 'function') {
        openLoginModal('cliente');
      } else {
        window.location.href = 'index.html?openLogin=true';
      }
      if (typeof showToast === 'function') {
        showToast('Inicia sesión para guardar tus productos favoritos.');
      }
      return { success: false, reason: 'unauthenticated' };
    }

    const strId = String(productId);
    let favs = getLocalFavorites();
    const isFav = isProductFavorite(strId);
    let newStatus = false;

    // Resolver identificadores (slug y numericId)
    let primaryId = strId;
    let numId = null;
    let productTitle = 'Producto';
    const catalog = window.PRODUCTS_DATA || (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA : []);
    if (Array.isArray(catalog)) {
      const p = catalog.find(item => item.id === strId || String(item.numericId) === strId);
      if (p) {
        primaryId = p.id;
        productTitle = p.title || 'Producto';
        if (p.numericId) numId = String(p.numericId);
      }
    }

    if (isFav) {
      // Quitar de favoritos
      favs = favs.filter(id => id !== primaryId && id !== strId && id !== numId);
      newStatus = false;
      if (typeof showToast === 'function') {
        showToast(`✕ ${productTitle} eliminado de favoritos`);
      }

      // Eliminar en Supabase
      if (window.supabase && typeof window.supabase.fetchApi === 'function' && user.id) {
        try {
          await window.supabase.fetchApi(`favorites?user_id=eq.${user.id}&product_id=eq.${encodeURIComponent(primaryId)}`, {
            method: 'DELETE'
          });
          if (numId) {
            await window.supabase.fetchApi(`favorites?user_id=eq.${user.id}&product_id=eq.${encodeURIComponent(numId)}`, {
              method: 'DELETE'
            });
          }
        } catch (_) {}
      }
    } else {
      // Agregar a favoritos
      favs = favs.filter(id => id !== primaryId && id !== strId && id !== numId);
      favs.unshift(primaryId);
      newStatus = true;
      if (typeof showToast === 'function') {
        showToast(`❤️ ¡${productTitle} guardado en tus favoritos!`);
      }

      // Guardar en Supabase
      if (window.supabase && typeof window.supabase.fetchApi === 'function' && user.id) {
        try {
          await window.supabase.fetchApi('favorites', {
            method: 'POST',
            body: {
              user_id: user.id,
              product_id: primaryId
            }
          });
        } catch (_) {}
      }
    }

    cachedFavorites = favs;
    saveLocalFavorites(favs);
    updateDOMHeartButtons();

    // Notificar a otras vistas
    if (typeof CustomEvent === 'function' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('favorites-updated', {
        detail: { productId: primaryId, isFavorite: newStatus, favorites: favs }
      }));
    }

    return { success: true, isFavorite: newStatus };
  }

  function updateDOMHeartButtons() {
    const buttons = document.querySelectorAll('[data-favorite-btn]');
    buttons.forEach(btn => {
      const pid = btn.getAttribute('data-favorite-btn');
      const isFav = isProductFavorite(pid);

      const iconSvg = btn.querySelector('svg');
      if (iconSvg) {
        if (isFav) {
          btn.classList.add('text-[#c85a32]', 'ring-2', 'ring-[#c85a32]/30');
          iconSvg.classList.add('fill-[#c85a32]', 'text-[#c85a32]');
          iconSvg.classList.remove('text-stone-400');
          iconSvg.setAttribute('fill', '#c85a32');
          iconSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>`;
        } else {
          btn.classList.remove('text-[#c85a32]', 'ring-2', 'ring-[#c85a32]/30');
          iconSvg.classList.remove('fill-[#c85a32]', 'text-[#c85a32]');
          iconSvg.classList.add('text-stone-400');
          iconSvg.setAttribute('fill', 'none');
          iconSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>`;
        }
      }
      btn.title = isFav ? 'Quitar de favoritos' : 'Agregar a favoritos';
      btn.setAttribute('aria-label', isFav ? 'Quitar de favoritos' : 'Agregar a favoritos');
    });
  }

  window.FavoritesService = {
    isFavorite: isProductFavorite,
    getFavorites: () => cachedFavorites || getLocalFavorites(),
    syncWithSupabase: syncFavoritesWithSupabase,
    toggleFavorite: toggleProductFavorite,
    updateDOM: updateDOMHeartButtons
  };

  window.isProductFavorite = isProductFavorite;
  window.toggleProductFavorite = toggleProductFavorite;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncFavoritesWithSupabase();
    });
  } else {
    syncFavoritesWithSupabase();
  }
})(window);
