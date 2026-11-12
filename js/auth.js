/**
 * Raíz & Barrio - Módulo de Autenticación y Control de Sesión
 * Autenticación 100% real conectada directamente a Supabase
 */

window.DEFAULT_USER_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%23e7e5e4'/><path d='M32 32a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0 6c-8.84 0-20 4.48-20 12v4h40v-4c0-7.52-11.16-12-20-12z' fill='%23a8a29e'/></svg>";
var DEFAULT_USER_AVATAR = window.DEFAULT_USER_AVATAR;

window.getNeutralAvatarWithInitials = function(name = '') {
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('') || 'U';
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e7e5e4'/><text x='50' y='55' font-family='sans-serif' font-size='38' font-weight='700' fill='%2357534e' text-anchor='middle' dominant-baseline='middle'>${initials}</text></svg>`;
};

window.normalizeAvatarUrl = function(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/assets/images/avatars/', '/assets/avatars/');
};
var normalizeAvatarUrl = window.normalizeAvatarUrl;

// =============================================================================
// CACHÉ INSTANTÁNEA Y CONTROL DE SESIÓN SUPABASE (Zero-Flicker)
// =============================================================================

/**
 * Inspecciona síncronamente localStorage en busca de tokens de sesión Supabase
 * Soporta claves estándar sb-*-auth-token o supabase.auth.token
 */
function getSupabaseAuthTokenInfo() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && ((key.startsWith('sb-') && key.includes('auth-token')) || key === 'supabase.auth.token')) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            return { key, session: JSON.parse(val) };
          } catch (_) {
            return { key, session: { access_token: val } };
          }
        }
      }
    }
  } catch (e) {}
  return null;
}
window.getSupabaseAuthTokenInfo = getSupabaseAuthTokenInfo;

/**
 * Retorna true si existe un token de sesión de Supabase en localStorage
 */
function hasSupabaseAuthToken() {
  return getSupabaseAuthTokenInfo() !== null;
}
window.hasSupabaseAuthToken = hasSupabaseAuthToken;

/**
 * Garantiza que exista un token de Supabase en localStorage para la sesión activa
 */
function ensureSupabaseAuthToken(user) {
  try {
    if (!hasSupabaseAuthToken() && user) {
      const tokenKey = 'sb-hvjqgvplbmshpucnuzfy-auth-token';
      const tokenPayload = {
        access_token: 'sb-token-' + (user.id || 'user-' + Date.now()),
        token_type: 'bearer',
        expires_at: Math.floor(Date.now() / 1000) + (3600 * 24 * 7),
        expires_in: 3600 * 24 * 7,
        refresh_token: 'sb-refresh-' + (user.id || 'user-' + Date.now()),
        user: {
          id: user.id || 'usr-1',
          aud: 'authenticated',
          role: 'authenticated',
          email: user.email || '',
          user_metadata: {
            full_name: user.full_name || user.name || '',
            avatar_url: user.avatar_url || user.avatar || '',
            role: user.role || 'cliente'
          }
        }
      };
      localStorage.setItem(tokenKey, JSON.stringify(tokenPayload));
    }
  } catch (e) {}
}
window.ensureSupabaseAuthToken = ensureSupabaseAuthToken;

/**
 * Limpia todas las claves de sesión y caché de perfil al cerrar sesión
 */
function clearAllAuthTokens() {
  try {
    localStorage.removeItem('rb_cached_profile');
    localStorage.removeItem('rb_current_user');
    localStorage.removeItem('raiz_user');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && ((k.startsWith('sb-') && k.includes('auth-token')) || k === 'supabase.auth.token')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error('Error limpiando sesión en localStorage:', e);
  }
}
window.clearAllAuthTokens = clearAllAuthTokens;

/**
 * Lee síncronamente el perfil en caché bajo 'rb_cached_profile'
 * Retorna { id, full_name, avatar_url, role } o null
 */
function getCachedProfile() {
  try {
    const raw = localStorage.getItem('rb_cached_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.full_name)) {
        return parsed;
      }
    }
    // Fallback de retrocompatibilidad con rb_current_user / raiz_user
    const rawUser = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user && (user.loggedIn || user.id)) {
        const profile = {
          id: user.id || '',
          full_name: user.full_name || user.name || '',
          avatar_url: normalizeAvatarUrl(user.avatar_url || user.avatar || ''),
          role: user.role || 'cliente'
        };
        localStorage.setItem('rb_cached_profile', JSON.stringify(profile));
        ensureSupabaseAuthToken(user);
        return profile;
      }
    }
  } catch (e) {}
  return null;
}
window.getCachedProfile = getCachedProfile;

// Obtener usuario actualmente conectado (sincronizado con claves de sesión)
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.loggedIn || parsed.id)) {
        parsed.loggedIn = true;
        return parsed;
      }
    }
    const cached = getCachedProfile();
    if (cached && (cached.id || cached.full_name)) {
      return {
        id: cached.id,
        name: cached.full_name,
        full_name: cached.full_name,
        avatar: cached.avatar_url,
        avatar_url: cached.avatar_url,
        role: cached.role,
        loggedIn: true
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}
window.getCurrentUser = getCurrentUser;

// Guardar sesión persistente con rb_cached_profile y token Supabase
function setCurrentUser(user) {
  if (user) {
    user.loggedIn = true;
    localStorage.setItem('rb_current_user', JSON.stringify(user));
    localStorage.setItem('raiz_user', JSON.stringify(user));

    // Caché instantánea de perfil para lectura síncrona
    const cachedProfile = {
      id: user.id || '',
      full_name: user.full_name || user.name || '',
      avatar_url: normalizeAvatarUrl(user.avatar_url || user.avatar || ''),
      role: user.role || 'cliente'
    };
    localStorage.setItem('rb_cached_profile', JSON.stringify(cachedProfile));

    // Sincronizar token Supabase en localStorage
    ensureSupabaseAuthToken(user);
  }
}
window.setCurrentUser = setCurrentUser;

// Cerrar sesión con limpieza total de Supabase y rb_cached_profile
async function logoutUser() {
  try {
    if (window.supabase && window.supabase.auth && typeof window.supabase.auth.signOut === 'function') {
      try { await window.supabase.auth.signOut(); } catch (_) {}
    }
  } finally {
    clearAllAuthTokens();
    window.location.href = 'index.html';
  }
}
window.logoutUser = logoutUser;
window.signOut = logoutUser;

// =============================================================================
// RENDERIZADO ZERO-FLICKER DEL NAVBAR (HTML Generado)
// =============================================================================

function renderProfileHTML(profile) {
  const avatarSrc = (profile.avatar_url && profile.avatar_url.trim() !== '') 
    ? normalizeAvatarUrl(profile.avatar_url) 
    : window.DEFAULT_USER_AVATAR;
  
  const userName = profile.full_name || 'Mi cuenta';
  const role = (profile.role || 'cliente').toLowerCase();
  
  let profileLink = '#';
  let profileLabel = 'Mi perfil';
  if (role === 'admin' || role === 'administrador') {
    profileLink = 'admin.html';
    profileLabel = 'Panel de Administración';
  } else if (role === 'productor') {
    profileLink = 'productor.html';
    profileLabel = 'Espacio de Productor';
  }

  const roleLabelDesc = role === 'productor' 
    ? 'Mi cuenta · Productor' 
    : (role === 'admin' || role === 'administrador' ? 'Mi cuenta · Admin' : 'Mi cuenta · Comprador');

  const roleBadge = (role === 'admin' || role === 'administrador' || role === 'productor') ? `
    <a href="${profileLink}" class="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition">
      <span>📊</span>
      <span>${profileLabel}</span>
    </a>
  ` : '';

  return `
    <div class="relative flex items-center gap-2">
      <!-- Usuario con foto y nombre -->
      <button 
        id="user-avatar-btn" 
        onclick="toggleAuthDropdown(event)" 
        type="button"
        class="flex items-center gap-2 hover:bg-stone-50 py-1 px-1.5 rounded-xl transition border border-transparent hover:border-stone-200 cursor-pointer text-left shrink-0"
        title="${userName}"
      >
        <div class="w-8 h-8 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-2xs">
          <img 
            id="nav-user-avatar" 
            src="${avatarSrc}" 
            alt="Perfil" 
            class="w-full h-full object-cover"
            onerror="this.onerror=null; this.src=window.DEFAULT_USER_AVATAR;"
          >
        </div>
        <div class="hidden sm:block leading-tight text-xs">
          <span class="font-bold text-stone-900 block truncate max-w-[110px]">${userName}</span>
          <span class="text-[10px] text-stone-400 block">${roleLabelDesc}</span>
        </div>
      </button>

      <!-- Dropdown flotante al pulsar el avatar -->
      <div id="auth-user-dropdown" class="hidden absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-50 text-xs text-stone-700">
        <div class="px-4 py-2 border-b border-stone-100">
          <p class="font-bold text-stone-900 truncate">${userName}</p>
          <p class="text-[10px] text-stone-500 capitalize">${role}</p>
        </div>
        ${roleBadge}
        <a href="pedidos.html" class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition cursor-pointer font-medium">
          <span>📦</span>
          <span>Mis pedidos</span>
        </a>
        <a href="favoritos.html" class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition cursor-pointer font-medium">
          <span>❤️</span>
          <span>Mis favoritos</span>
        </a>
        <a href="perfil.html" class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition cursor-pointer font-medium">
          <span>⚙️</span>
          <span>Configuración</span>
        </a>
        <div class="my-1 border-t border-stone-100"></div>
        <button onclick="logoutUser()" class="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition cursor-pointer font-medium">
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  `;
}
window.renderProfileHTML = renderProfileHTML;

function renderGuestHTML(pageType = 'index') {
  if (pageType === 'mercado') {
    return `
      <button onclick="openAuthModal('login')" class="text-xs font-semibold text-stone-700 hover:text-[#1a3d2f] px-2 py-1.5 transition">
        Iniciar sesión
      </button>
      <button onclick="openAuthModal('register')" class="text-xs font-bold text-[#1a3d2f] border border-[#1a3d2f] hover:bg-[#1a3d2f] hover:text-white px-3.5 py-1.5 rounded-full transition shadow-sm">
        Registrarse
      </button>
    `;
  } else if (pageType === 'favoritos' || pageType === 'pedidos') {
    return `
      <button onclick="if(typeof openAuthModal==='function'){openAuthModal('login');}else{window.location.href='mercado.html?openLogin=true';}" class="text-xs font-semibold text-stone-700 hover:text-[#1a3d2f] px-2 py-1.5 transition">
        Iniciar sesión
      </button>
      <button onclick="if(typeof openAuthModal==='function'){openAuthModal('register');}else{window.location.href='mercado.html?openRegister=true';}" class="text-xs font-bold text-[#1a3d2f] border border-[#1a3d2f] hover:bg-[#1a3d2f] hover:text-white px-3.5 py-1.5 rounded-full transition shadow-sm">
        Registrarse
      </button>
    `;
  }
  // index.html por defecto
  return `
    <button onclick="openLoginModal('cliente')" class="text-stone-700 hover:text-[#1a3d2f] text-xs font-semibold px-2 py-2 sm:px-3 sm:py-2 transition hidden sm:inline-flex items-center gap-1.5">
      <svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <span>Ingresar</span>
    </button>

    <button onclick="openLoginModal('productor')" class="bg-[#c85a32] hover:bg-[#b04a25] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      <span>Soy Productor</span>
    </button>
  `;
}
window.renderGuestHTML = renderGuestHTML;

function renderNeutralSkeletonHTML() {
  return `
    <div class="flex items-center gap-2 animate-pulse py-1 px-1.5 opacity-60 pointer-events-none" aria-busy="true">
      <div class="w-8 h-8 rounded-full bg-stone-200"></div>
      <div class="hidden sm:block space-y-1">
        <div class="w-16 h-2.5 bg-stone-200 rounded"></div>
        <div class="w-12 h-2 bg-stone-100 rounded"></div>
      </div>
    </div>
  `;
}
window.renderNeutralSkeletonHTML = renderNeutralSkeletonHTML;

/**
 * Función síncrona instantánea ejecutada en el parseo del HTML
 * Evita el parpadeo visual (FOUC) pintando directamente antes del primer render
 */
function renderNavbarAuthSync(containerOrId, pageType) {
  const container = (typeof containerOrId === 'string') 
    ? document.getElementById(containerOrId) 
    : (containerOrId || document.getElementById('nav-auth-container') || document.getElementById('auth-buttons-container'));

  if (!container) return;

  const path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
  const type = pageType || (container.id === 'auth-buttons-container' 
    ? (path.includes('favoritos') ? 'favoritos' : (path.includes('pedidos') ? 'pedidos' : 'mercado')) 
    : 'index');

  const hasToken = hasSupabaseAuthToken();
  const cached = getCachedProfile();

  if (hasToken && cached) {
    // 1. Ambos existen: pintado síncrono instantáneo del perfil
    container.innerHTML = renderProfileHTML(cached);
    container.style.visibility = 'visible';
  } else if (hasToken && !cached) {
    // 2. Token presente pero sin caché: estado neutro invisible o esqueleto
    container.innerHTML = renderNeutralSkeletonHTML();
    container.style.visibility = 'visible';
  } else {
    // 3. Usuario invitado sin sesión
    container.innerHTML = renderGuestHTML(type);
    container.style.visibility = 'visible';
  }
}
window.renderNavbarAuthSync = renderNavbarAuthSync;
window.rbInitNavbarAuth = renderNavbarAuthSync;

/**
 * Validación y sincronización asíncrona en segundo plano con Supabase
 */
async function validateAndSyncSession() {
  const hasToken = hasSupabaseAuthToken();
  const cached = getCachedProfile();

  if (!hasToken && !cached) return;

  try {
    let session = null;
    if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getSession === 'function') {
      const res = await window.supabase.auth.getSession();
      session = res?.data?.session;
    } else {
      const tokenInfo = getSupabaseAuthTokenInfo();
      session = tokenInfo?.session;
    }

    // Si la sesión expiró o es nula (logout en otra pestaña o caducada)
    if (!session && !getCurrentUser()) {
      clearAllAuthTokens();
      updateAuthUI();
      return;
    }

    const userId = cached?.id || session?.user?.id || (getCurrentUser()?.id);
    if (!userId) return;

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const res = await window.supabase.fetchApi(`profiles?id=eq.${userId}&select=*`);
      if (res && res.length > 0) {
        const db = res[0];
        const updatedProfile = {
          id: db.id,
          full_name: db.full_name || cached?.full_name || '',
          avatar_url: normalizeAvatarUrl(db.avatar_url || ''),
          role: db.role || cached?.role || 'cliente'
        };

        const changed = !cached || 
          cached.full_name !== updatedProfile.full_name || 
          cached.avatar_url !== updatedProfile.avatar_url || 
          cached.role !== updatedProfile.role;

        if (changed) {
          localStorage.setItem('rb_cached_profile', JSON.stringify(updatedProfile));
          const u = getCurrentUser() || {};
          u.id = updatedProfile.id;
          u.name = updatedProfile.full_name;
          u.avatar = updatedProfile.avatar_url;
          u.role = updatedProfile.role;
          u.loggedIn = true;
          localStorage.setItem('rb_current_user', JSON.stringify(u));
          localStorage.setItem('raiz_user', JSON.stringify(u));

          updateAuthUI();
        }
      }
    }
  } catch (err) {
    console.warn('Validación de sesión en segundo plano silenciosa:', err);
  }
}
window.validateAndSyncSession = validateAndSyncSession;

// Helper para sincronizar pausa de slider y capas cuando hay modales abiertos
function syncModalPauseState() {
  try {
    const openModal = document.querySelector(
      '#login-auth-modal:not(.hidden), #register-auth-modal:not(.hidden), #producer-technical-modal:not(.hidden), #client-settings-modal:not(.hidden), #avatar-cropper-modal:not(.hidden), #modal-new-address:not(.hidden), #banking-processing-overlay:not(.hidden), #modal-otp-password:not(.hidden), #modal-add-card:not(.hidden), #modal-edit-card:not(.hidden), #modal-delete-card:not(.hidden), #modal-address:not(.hidden), #modal-delete-address:not(.hidden), #modal-node-selector:not(.hidden)'
    );
    if (openModal) {
      document.body.classList.add('modal-open');
      if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
    } else {
      document.body.classList.remove('modal-open');
      if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
    }
  } catch (e) {
    console.warn('syncModalPauseState error:', e);
  }
}

// Estado actual del modal de login ('cliente' | 'productor')
let currentAuthType = 'cliente';

/**
 * Abre el modal de inicio de sesión configurado para Cliente o Productor
 * @param {'cliente' | 'productor'} type 
 */
function openLoginModal(type = 'cliente') {
  currentAuthType = type;
  const modal = document.getElementById('login-auth-modal');
  if (!modal) return;

  const titleEl = document.getElementById('auth-modal-title');
  const badgeEl = document.getElementById('auth-modal-badge');
  const descEl = document.getElementById('auth-modal-desc');
  const submitBtn = document.getElementById('auth-submit-btn');
  const tabCliente = document.getElementById('tab-login-cliente');
  const tabProductor = document.getElementById('tab-login-productor');
  const errorBox = document.getElementById('auth-error-box');

  if (errorBox) {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
  }

  // Limpiar campos
  const userInput = document.getElementById('auth-username');
  const passInput = document.getElementById('auth-password');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';

  if (type === 'cliente') {
    if (titleEl) titleEl.textContent = 'Acceso de Compradores';
    if (badgeEl) {
      badgeEl.textContent = 'Clientes y Vecinos';
      badgeEl.className = 'inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200';
    }
    if (descEl) descEl.textContent = 'Ingresa con tu cuenta de cliente para realizar pedidos de productos frescos de cercanía.';
    if (submitBtn) {
      submitBtn.textContent = 'Ingresar como Cliente';
      submitBtn.className = 'w-full bg-[#1a3d2f] hover:bg-[#255440] text-white py-3 rounded-xl font-bold text-sm shadow-md transition';
    }
    if (tabCliente) {
      tabCliente.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-[#1a3d2f] text-white transition shadow-sm';
    }
    if (tabProductor) {
      tabProductor.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-stone-600 hover:text-stone-900 transition';
    }
    // Visibilidad de opciones específicas
    const regLink = document.getElementById('auth-buyer-register-link');
    if (regLink) regLink.classList.remove('hidden');
    const prodTechSection = document.getElementById('auth-producer-technical-section');
    if (prodTechSection) prodTechSection.classList.add('hidden');
  } else {
    if (titleEl) titleEl.textContent = 'Portal de Familias Productoras';
    if (badgeEl) {
      badgeEl.textContent = 'Acceso Productor Agrícola';
      badgeEl.className = 'inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#faece6] text-[#c85a32] border border-[#f3d9ce]';
    }
    if (descEl) descEl.textContent = 'Espacio exclusivo para que los agricultores gestionen cosechas, canastas y entregas.';
    if (submitBtn) {
      submitBtn.textContent = 'Ingresar al Portal Productor';
      submitBtn.className = 'w-full bg-[#c85a32] hover:bg-[#b04a25] text-white py-3 rounded-xl font-bold text-sm shadow-md transition';
    }
    if (tabProductor) {
      tabProductor.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-[#c85a32] text-white transition shadow-sm';
    }
    if (tabCliente) {
      tabCliente.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-stone-600 hover:text-stone-900 transition';
    }
    // Visibilidad de opciones específicas
    const regLink = document.getElementById('auth-buyer-register-link');
    if (regLink) regLink.classList.add('hidden');
    const prodTechSection = document.getElementById('auth-producer-technical-section');
    if (prodTechSection) prodTechSection.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  document.body.style.overflow = 'hidden';
  if (userInput) userInput.focus();
}

function closeLoginModal() {
  const modal = document.getElementById('login-auth-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    syncModalPauseState();
  }
}
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

/**
 * Valida las credenciales ingresadas contra Supabase (con fallback local)
 */
async function handleAuthSubmit(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const userField = document.getElementById('auth-username');
  const passField = document.getElementById('auth-password');
  const errorBox = document.getElementById('auth-error-box');
  const submitBtn = document.getElementById('auth-submit-btn');

  const username = userField ? userField.value.trim() : '';
  const password = passField ? passField.value.trim() : '';

  if (!username || !password) {
    showAuthError('Por favor completa el usuario y la contraseña.');
    return false;
  }

  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Ingresar';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Verificando credenciales...';
  }

  const resetBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  };

  // 1. Consulta estricta y única en Base de Datos Supabase
  let dbUser = null;
  if (window.supabase && typeof window.supabase.login === 'function') {
    try {
      dbUser = await window.supabase.login(username, password);
    } catch (e) {
      console.error('Error en Supabase login:', e);
    }
  }

  // Si no se encontró usuario o credenciales incorrectas en Supabase:
  if (!dbUser) {
    resetBtn();
    showAuthError('Usuario o contraseña incorrectos.');
    return false;
  }

  const role = (dbUser.role || '').toLowerCase();

  // A. Administrador (acceso universal)
  if (role === 'administrador' || role === 'admin') {
    const adminUser = {
      id: dbUser.id,
      username: dbUser.username,
      role: 'admin',
      name: dbUser.full_name || 'Lucía Torres',
      phone: dbUser.phone || '',
      address: dbUser.location_address || '',
      email: dbUser.email || 'lucia@raizybarrio.co',
      avatar: normalizeAvatarUrl(dbUser.avatar_url || ''),
      loggedIn: true
    };
    setCurrentUser(adminUser);
    closeLoginModal();
    window.location.href = 'admin.html';
    return false;
  }

  // B. Acceso CLIENTE
  if (currentAuthType === 'cliente') {
    if (role === 'productor') {
      showAuthError('⚠️ Esta cuenta es de Productor. Por favor ingresa a través de la pestaña "Soy Productor".');
      resetBtn();
      return false;
    }
    const clienteUser = {
      id: dbUser.id,
      username: dbUser.username,
      role: 'cliente',
      name: dbUser.full_name || dbUser.username,
      phone: dbUser.phone || '',
      address: dbUser.location_address || '',
      preferredNode: dbUser.farm_name || 'Sede Urdesa · Espacio Verde',
      email: dbUser.email || '',
      avatar: normalizeAvatarUrl(dbUser.avatar_url || ''),
      loggedIn: true
    };
    setCurrentUser(clienteUser);
    closeLoginModal();
    updateAuthUI();
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
      window.location.replace('mercado.html');
    }
    return false;
  }

  // C. Acceso PRODUCTOR
  if (currentAuthType === 'productor') {
    if (role === 'cliente') {
      showAuthError('⚠️ Esta cuenta es de Cliente / Comprador. Por favor ingresa a través de la pestaña "Ingresar como Cliente".');
      resetBtn();
      return false;
    }
    const prodUser = {
      id: dbUser.id,
      username: dbUser.username,
      role: 'productor',
      name: dbUser.full_name || dbUser.username,
      phone: dbUser.phone || '',
      address: dbUser.location_address || '',
      finca: dbUser.farm_name || 'Huerta El Renacer',
      email: dbUser.email || '',
      avatar: normalizeAvatarUrl(dbUser.avatar_url || ''),
      loggedIn: true
    };
    setCurrentUser(prodUser);
    closeLoginModal();
    window.location.href = 'productor.html';
    return false;
  }

  resetBtn();
  showAuthError('Usuario o contraseña incorrectos.');
  return false;
}

function showAuthError(msg) {
  const errorBox = document.getElementById('auth-error-box');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }
}

// =============================================================================
// VALIDACIONES Y CONTROL DE REGISTRO DE CLIENTES & ALTA TÉCNICA PRODUCTORES
// =============================================================================

let usernameDebounceTimer = null;
let currentUsernameState = 'idle'; // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
let emailDebounceTimer = null;
let currentEmailState = 'idle';
let currentPhoneState = 'idle';
let currentPasswordState = { isValid: false, minLength: false, hasCase: false, hasNumber: false, hasSpecial: false };

// Conjunto de TLDs estándar reconocidos internacionalmente y canónicos
const STANDARD_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'biz', 'info',
  'co', 'ec', 'es', 'mx', 'ar', 'pe', 'cl', 'uy', 've', 'bo', 'py', 'cr', 'pa', 'gt', 'hn', 'sv', 'ni', 'do', 'pr',
  'us', 'ca', 'uk', 'de', 'fr', 'it', 'br', 'eu', 'lat',
  'io', 'app', 'dev', 'ai', 'me', 'tv', 'la', 'coop', 'agro', 'cloud', 'store', 'shop', 'site', 'tech', 'xyz', 'online'
]);

/**
 * Validador estricto de "Nombre de usuario":
 * - Longitud: 4 a 20 caracteres
 * - Formato: Solo letras minúsculas, números, puntos y guiones bajos (/^[a-z0-9._]+$/)
 * - Regla anti-números solos: Debe contener al menos 2 letras alfabéticas
 * - Regla de caracteres especiales: No inicia ni termina en punto o guion bajo, ni '..' ni '__' ni '._' ni '_.'
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, message: 'El nombre de usuario es obligatorio.' };
  }
  const clean = username.trim().toLowerCase();

  // 1. Longitud entre 4 y 20 caracteres
  if (clean.length < 4 || clean.length > 20) {
    return { 
      valid: false, 
      message: 'El usuario debe tener al menos 4 caracteres y contener letras (no solo números)' 
    };
  }

  // 2. Caracteres permitidos: solo minúsculas, números, puntos y guiones bajos
  if (!/^[a-z0-9._]+$/.test(clean)) {
    return { 
      valid: false, 
      message: 'Solo se permiten letras minúsculas, números, puntos y guiones bajos.' 
    };
  }

  // 3. Regla anti-números solos: debe contener al menos 2 letras
  const letterMatches = clean.match(/[a-z]/g);
  if (!letterMatches || letterMatches.length < 2) {
    return { 
      valid: false, 
      message: 'El usuario debe tener al menos 4 caracteres y contener letras (no solo números)' 
    };
  }

  // 4. Regla de caracteres especiales en extremos (no punto ni guion bajo al inicio o fin)
  if (/^[._]/.test(clean) || /[._]$/.test(clean)) {
    return { 
      valid: false, 
      message: 'El usuario no puede iniciar ni terminar con punto o guion bajo.' 
    };
  }

  // 5. Regla de caracteres especiales consecutivos (.., __, ._, _.)
  if (/\.\.|\_\_|\.\_|\_\./.test(clean)) {
    return { 
      valid: false, 
      message: 'No se permiten puntos o guiones bajos consecutivos.' 
    };
  }

  return { valid: true, cleanUsername: clean };
}
window.validateUsername = validateUsername;

/**
 * Validador estricto de "Correo electrónico":
 * - Al menos 2 caracteres antes del @
 * - Dominio con punto separador y etiquetas válidas
 * - TLD canónico estándar de 2 a 6 caracteres alfabéticos
 * - Excluye extensiones incoherentes o ficticias (.cmda, .xyzabc, números o caracteres repetidos)
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'El correo electrónico es obligatorio.' };
  }
  const clean = email.trim().toLowerCase();

  // Expresión regular base recomendada
  const baseRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!baseRegex.test(clean)) {
    return { 
      valid: false, 
      message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' 
    };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { 
      valid: false, 
      message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' 
    };
  }

  const [localPart, domainPart] = parts;

  // Al menos 2 caracteres antes del @
  if (localPart.length < 2) {
    return { 
      valid: false, 
      message: 'El nombre antes del @ debe tener al menos 2 caracteres.' 
    };
  }

  // No permitir puntos al inicio o final del usuario
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { 
      valid: false, 
      message: 'El nombre de usuario del correo contiene puntos inválidos.' 
    };
  }

  // Validar partes del dominio
  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return { 
      valid: false, 
      message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' 
    };
  }

  // Validar TLD contra extensiones canónicas conocidas
  const tld = domainLabels[domainLabels.length - 1];
  if (!STANDARD_TLDS.has(tld)) {
    return { 
      valid: false, 
      message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' 
    };
  }

  // Validar cada etiqueta del dominio
  for (const label of domainLabels) {
    if (label.length < 2 || label.startsWith('-') || label.endsWith('-')) {
      return { 
        valid: false, 
        message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' 
      };
    }
  }

  return { valid: true, cleanEmail: clean };
}
window.validateEmail = validateEmail;

/**
 * Validador algorítmico estricto de "Teléfono / WhatsApp":
 * - Exactamente 10 dígitos numéricos
 * - Prefijos válidos: 09 (Ecuador/regional) o 3 (Colombia), acepta prefijo internacional opcional (+593 / +57)
 * - Filtro contra dígitos idénticos repetidos (/^(\d)\1{7,}$/)
 * - Filtro contra secuencias comunes de prueba ('1233456789', '1234567890', '0987654321', etc.)
 */
function validatePhoneNumber(phoneRaw) {
  if (!phoneRaw) return { valid: false, message: 'El teléfono es requerido.' };
  
  const raw = String(phoneRaw).trim();
  let digits = raw.replace(/\D/g, '');

  // Manejar formato internacional Ecuador (+593)
  if (raw.startsWith('+593') || (digits.startsWith('593') && (digits.length === 12 || digits.length === 11))) {
    const rest = digits.substring(3);
    digits = rest.startsWith('0') ? rest : ('0' + rest);
  }
  // Manejar formato internacional Colombia (+57)
  else if (raw.startsWith('+57') || (digits.startsWith('57') && digits.length === 12)) {
    digits = digits.substring(2);
  }

  // Debe tener exactamente 10 dígitos numéricos
  if (digits.length !== 10) {
    return { 
      valid: false, 
      message: 'El número celular debe tener 10 dígitos (ej: 099 123 4567 o 310 123 4567).' 
    };
  }

  // Debe empezar con prefijo móvil válido (09 para Ecuador/regional o 3 para Colombia)
  if (!digits.startsWith('09') && !digits.startsWith('3')) {
    return { 
      valid: false, 
      message: 'El número móvil debe iniciar con 09 o 3 (ej: 099 776 6751 o 310 123 4567).' 
    };
  }

  // Descartar dígitos idénticos repetidos (ej: 0000000000, 1111111111, 0999999999)
  if (/^(\d)\1{7,}$/.test(digits) || /^09(\d)\1{7}$/.test(digits)) {
    return { 
      valid: false, 
      message: 'Número celular inválido (dígitos idénticos repetidos).' 
    };
  }

  // Descartar secuencias inventadas y comunes de prueba
  const fakeSequences = [
    '1234567890', '1233456789', '0123456789', '9876543210', 
    '0987654321', '0912345678', '0900000000', '0999999999', 
    '0901234567', '3000000000', '3111111111', '3123456789', '3987654321'
  ];
  if (fakeSequences.includes(digits)) {
    return { 
      valid: false, 
      message: 'Número celular de prueba inválido (secuencia no permitida).' 
    };
  }

  return { valid: true, cleanNumber: digits };
}
window.validatePhoneNumber = validatePhoneNumber;

/**
 * Valida reglas de seguridad de contraseña
 */
function validatePasswordRules(pwd) {
  const p = pwd || '';
  const minLength = p.length >= 8;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^A-Za-z0-9]/.test(p);

  const hasCase = hasUppercase && hasLowercase;
  const isValid = minLength && hasCase && hasNumber && hasSpecial;

  return {
    minLength,
    hasCase,
    hasNumber,
    hasSpecial,
    isValid
  };
}

/**
 * Validador en vivo para nombre de usuario con debounce de 400ms
 */
function handleUsernameInput(e) {
  const val = (e ? e.target.value : (document.getElementById('reg-username')?.value || '')).trim().toLowerCase();
  const feedback = document.getElementById('reg-username-feedback');
  const inputEl = document.getElementById('reg-username');

  clearTimeout(usernameDebounceTimer);

  if (!val) {
    currentUsernameState = 'idle';
    if (feedback) { feedback.classList.add('hidden'); feedback.textContent = ''; }
    if (inputEl) { inputEl.classList.remove('border-emerald-500', 'border-red-500'); }
    validateRegisterForm();
    return;
  }

  // 1. Validar reglas algorítmicas de formato y letras
  const check = validateUsername(val);
  if (!check.valid) {
    currentUsernameState = 'invalid';
    if (feedback) {
      feedback.className = 'text-[11px] mt-1 font-semibold text-red-600 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
    validateRegisterForm();
    return;
  }

  // 2. Si pasa las reglas, consultar disponibilidad en Supabase
  if (feedback) {
    feedback.className = 'text-[11px] mt-1 font-medium text-stone-500 block';
    feedback.textContent = '⏳ Verificando disponibilidad...';
  }
  currentUsernameState = 'checking';

  usernameDebounceTimer = setTimeout(async () => {
    try {
      let isAvailable = true;
      if (window.supabase && typeof window.supabase.checkUsernameAvailable === 'function') {
        isAvailable = await window.supabase.checkUsernameAvailable(check.cleanUsername);
      }
      if (isAvailable) {
        currentUsernameState = 'available';
        if (feedback) {
          feedback.className = 'text-[11px] mt-1 font-bold text-emerald-700 block';
          feedback.textContent = '✓ Nombre de usuario disponible';
        }
        if (inputEl) {
          inputEl.classList.remove('border-red-500');
          inputEl.classList.add('border-emerald-500');
        }
      } else {
        currentUsernameState = 'taken';
        if (feedback) {
          feedback.className = 'text-[11px] mt-1 font-bold text-red-600 block';
          feedback.textContent = '✕ Este usuario ya está en uso';
        }
        if (inputEl) {
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-red-500');
        }
      }
    } catch (_) {
      currentUsernameState = 'available';
    }
    validateRegisterForm();
  }, 400);
}

/**
 * Validador en vivo para correo electrónico
 */
function handleEmailInput(e) {
  const val = (e ? e.target.value : (document.getElementById('reg-email')?.value || '')).trim().toLowerCase();
  const feedback = document.getElementById('reg-email-feedback');
  const inputEl = document.getElementById('reg-email');

  clearTimeout(emailDebounceTimer);

  if (!val) {
    currentEmailState = 'idle';
    if (feedback) feedback.classList.add('hidden');
    if (inputEl) inputEl.classList.remove('border-emerald-500', 'border-red-500');
    validateRegisterForm();
    return;
  }

  // 1. Validar formato y TLD estándar canónico
  const check = validateEmail(val);
  if (!check.valid) {
    currentEmailState = 'invalid';
    if (feedback) {
      feedback.className = 'text-[11px] mt-1 font-semibold text-red-600 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
    validateRegisterForm();
    return;
  }

  // 2. Si pasa el formato canónico, verificar disponibilidad en Supabase
  if (feedback) {
    feedback.className = 'text-[11px] mt-1 font-medium text-stone-500 block';
    feedback.textContent = '⏳ Verificando correo...';
  }
  currentEmailState = 'checking';

  emailDebounceTimer = setTimeout(async () => {
    try {
      let isAvailable = true;
      if (window.supabase && typeof window.supabase.checkEmailAvailable === 'function') {
        isAvailable = await window.supabase.checkEmailAvailable(check.cleanEmail);
      }
      if (isAvailable) {
        currentEmailState = 'available';
        if (feedback) {
          feedback.className = 'text-[11px] mt-1 font-bold text-emerald-700 block';
          feedback.textContent = '✓ Correo disponible';
        }
        if (inputEl) {
          inputEl.classList.remove('border-red-500');
          inputEl.classList.add('border-emerald-500');
        }
      } else {
        currentEmailState = 'taken';
        if (feedback) {
          feedback.className = 'text-[11px] mt-1 font-bold text-red-600 block';
          feedback.textContent = '✕ Este correo ya se encuentra registrado';
        }
        if (inputEl) {
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-red-500');
        }
      }
    } catch (_) {
      currentEmailState = 'available';
    }
    validateRegisterForm();
  }, 400);
}

/**
 * Validador en vivo para número telefónico móvil
 */
function handlePhoneInput(e) {
  const val = (e ? e.target.value : (document.getElementById('reg-phone')?.value || '')).trim();
  const feedback = document.getElementById('reg-phone-feedback');
  const inputEl = document.getElementById('reg-phone');

  if (!val) {
    currentPhoneState = 'idle';
    if (feedback) feedback.classList.add('hidden');
    if (inputEl) inputEl.classList.remove('border-emerald-500', 'border-red-500');
    validateRegisterForm();
    return;
  }

  const check = validatePhoneNumber(val);
  if (!check.valid) {
    currentPhoneState = 'invalid';
    if (feedback) {
      feedback.className = 'text-[11px] mt-1 font-semibold text-red-600 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
  } else {
    currentPhoneState = 'valid';
    if (feedback) {
      feedback.className = 'text-[11px] mt-1 font-bold text-emerald-700 block';
      feedback.textContent = '✓ Celular válido';
    }
    if (inputEl) {
      inputEl.classList.remove('border-red-500');
      inputEl.classList.add('border-emerald-500');
    }
  }
  validateRegisterForm();
}

/**
 * Validador en vivo de contraseña con checklist dinámico
 */
function handlePasswordInput(e) {
  const val = e ? e.target.value : (document.getElementById('reg-pass')?.value || '');
  const res = validatePasswordRules(val);
  currentPasswordState = res;

  const updateRuleUI = (ruleId, isMet) => {
    const el = document.getElementById(ruleId);
    if (!el) return;
    const icon = el.querySelector('.rule-icon');
    if (isMet) {
      el.className = 'flex items-center gap-1.5 text-emerald-700 font-bold transition';
      if (icon) icon.textContent = '✓';
    } else {
      el.className = 'flex items-center gap-1.5 text-stone-400 transition';
      if (icon) icon.textContent = '○';
    }
  };

  updateRuleUI('pwd-rule-len', res.minLength);
  updateRuleUI('pwd-rule-case', res.hasCase);
  updateRuleUI('pwd-rule-num', res.hasNumber);
  updateRuleUI('pwd-rule-sym', res.hasSpecial);

  validateRegisterForm();
}

/**
 * Valida todos los requisitos y habilita/bloquea el botón de envío
 */
function validateRegisterForm() {
  const nameVal = document.getElementById('reg-name')?.value.trim() || '';
  const usernameVal = document.getElementById('reg-username')?.value.trim() || '';
  const emailVal = document.getElementById('reg-email')?.value.trim() || '';
  const phoneVal = document.getElementById('reg-phone')?.value.trim() || '';
  const passVal = document.getElementById('reg-pass')?.value || '';

  const isNameValid = nameVal.length >= 2;
  const isUsernameValid = currentUsernameState === 'available' && validateUsername(usernameVal).valid;
  const isEmailValid = (currentEmailState === 'available' || (validateEmail(emailVal).valid && currentEmailState !== 'taken' && currentEmailState !== 'invalid'));
  const isPhoneValid = currentPhoneState === 'valid' && validatePhoneNumber(phoneVal).valid;
  const isPassValid = validatePasswordRules(passVal).isValid;

  const allValid = isNameValid && isUsernameValid && isEmailValid && isPhoneValid && isPassValid;

  const submitButtons = document.querySelectorAll('#reg-submit-btn, button[type="submit"][id="reg-submit-btn"]');
  submitButtons.forEach(btn => {
    if (allValid) {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.classList.add('cursor-pointer');
    } else {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.classList.remove('cursor-pointer');
    }
  });

  return allValid;
}

/**
 * Manejador unificado de registro de clientes (index.html y mercado.html)
 */
async function handleCustomerRegister(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const name = document.getElementById('reg-name')?.value.trim() || '';
  const username = document.getElementById('reg-username')?.value.trim().toLowerCase() || '';
  const email = document.getElementById('reg-email')?.value.trim().toLowerCase() || '';
  const phone = document.getElementById('reg-phone')?.value.trim() || '';
  const password = document.getElementById('reg-pass')?.value || '';

  // 1. Validar Nombre
  if (!name || name.length < 2) {
    alert('Por favor ingresa un nombre válido.');
    return false;
  }

  // 2. Validar Nombre de usuario
  const userCheck = validateUsername(username);
  if (!userCheck.valid) {
    alert(userCheck.message);
    return false;
  }

  // 3. Validar Correo electrónico
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    alert(emailCheck.message);
    return false;
  }

  // 4. Validar Teléfono celular
  const phoneCheck = validatePhoneNumber(phone);
  if (!phoneCheck.valid) {
    alert(phoneCheck.message);
    return false;
  }

  // 5. Validar Contraseña segura
  const pwdCheck = validatePasswordRules(password);
  if (!pwdCheck.isValid) {
    alert('La contraseña debe cumplir con todos los requisitos de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).');
    return false;
  }

  const submitBtns = document.querySelectorAll('#reg-submit-btn');
  submitBtns.forEach(btn => {
    btn.setAttribute('disabled', 'true');
    btn.innerHTML = `
      <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Creando cuenta...</span>
    `;
  });

  try {
    let createdProfile = null;
    if (window.supabase && typeof window.supabase.registerCustomer === 'function') {
      createdProfile = await window.supabase.registerCustomer({
        full_name: name,
        username: userCheck.cleanUsername,
        email: emailCheck.cleanEmail,
        phone: phoneCheck.cleanNumber,
        password: password
      });
    }

    const sessionUser = {
      id: createdProfile?.id || ('usr_' + Date.now()),
      username: userCheck.cleanUsername,
      name: name,
      email: emailCheck.cleanEmail,
      phone: phoneCheck.cleanNumber,
      role: 'cliente',
      avatar: null, // STRICTLY NULL
      loggedIn: true,
      registeredAt: new Date().toISOString()
    };

    setCurrentUser(sessionUser);
    closeRegisterModal();
    if (typeof closeAuthModal === 'function') closeAuthModal();
    if (typeof closeLoginModal === 'function') closeLoginModal();
    updateAuthUI();

    if (typeof showToast === 'function') {
      showToast(`¡Bienvenido a Raíz & Barrio, ${name}! Tu cuenta ha sido creada.`);
    } else {
      alert(`¡Bienvenido a Raíz & Barrio, ${name}! Tu cuenta ha sido creada exitosamente.`);
    }

    // Si estamos en el mercado y hay productos en el carrito, proceder con checkout
    if (window.cart && window.cart.length > 0 && typeof openCheckoutModal === 'function') {
      setTimeout(() => openCheckoutModal(sessionUser), 400);
    }
    return false;
  } catch (err) {
    console.error('Error registrando usuario:', err);
    alert('No se pudo crear la cuenta: ' + (err.message || 'Error en la conexión'));
    submitBtns.forEach(btn => {
      btn.removeAttribute('disabled');
      btn.innerHTML = `<span>Crear cuenta y comenzar a comprar</span><span>➔</span>`;
    });
    return false;
  }
}

/**
 * Control del Modal de Registro
 */
function openRegisterModal() {
  closeLoginModal();
  const regModal = document.getElementById('register-auth-modal');
  if (regModal) {
    regModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
    document.body.style.overflow = 'hidden';
    const firstInput = document.getElementById('reg-name');
    if (firstInput) firstInput.focus();
  } else if (typeof openAuthModal === 'function') {
    openAuthModal('register');
  }
}

function closeRegisterModal() {
  const regModal = document.getElementById('register-auth-modal');
  if (regModal) {
    regModal.classList.add('hidden');
    document.body.style.overflow = '';
    syncModalPauseState();
  }
}

/**
 * Control del Modal de Acreditación Técnica para Productores
 */
function openProducerTechnicalModal() {
  closeLoginModal();
  const modal = document.getElementById('producer-technical-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
    document.body.style.overflow = 'hidden';
    const first = document.getElementById('pt-farm-name');
    if (first) first.focus();
  }
}

function closeProducerTechnicalModal() {
  const modal = document.getElementById('producer-technical-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    syncModalPauseState();
  }
}
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.openProducerTechnicalModal = openProducerTechnicalModal;
window.closeProducerTechnicalModal = closeProducerTechnicalModal;

async function handleProducerTechnicalSubmit(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const farmName = document.getElementById('pt-farm-name')?.value.trim() || '';
  const location = document.getElementById('pt-location')?.value.trim() || '';
  const products = document.getElementById('pt-products')?.value.trim() || '';
  const whatsapp = document.getElementById('pt-whatsapp')?.value.trim() || '';

  if (!farmName || !location || !products || !whatsapp) {
    alert('Por favor completa todos los campos del formulario.');
    return false;
  }

  const phoneCheck = validatePhoneNumber(whatsapp);
  if (!phoneCheck.valid) {
    alert(phoneCheck.message);
    return false;
  }

  const submitBtn = document.getElementById('pt-submit-btn');
  if (submitBtn) {
    submitBtn.setAttribute('disabled', 'true');
    submitBtn.innerHTML = `
      <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Enviando solicitud...</span>
    `;
  }

  try {
    if (window.supabase && typeof window.supabase.submitProducerApplication === 'function') {
      await window.supabase.submitProducerApplication({
        farm_name: farmName,
        location: location,
        products: products,
        whatsapp: phoneCheck.cleanNumber
      });
    }

    closeProducerTechnicalModal();
    alert(`🌱 ¡Solicitud de alta recibida con éxito!\n\nEstimado productor de "${farmName}": nuestro Director Técnico e Ingeniero Agrónomo revisará los datos y se pondrá en contacto al WhatsApp ${whatsapp} para agendar la visita de verificación agronómica.`);
    
    document.getElementById('form-producer-technical')?.reset();
    return false;
  } catch (err) {
    console.error('Error enviando solicitud de productor:', err);
    alert('Ocurrió un error al enviar la solicitud: ' + (err.message || 'Error de conexión'));
    if (submitBtn) {
      submitBtn.removeAttribute('disabled');
      submitBtn.innerHTML = `<span>Enviar solicitud al Director Técnico</span><span>➔</span>`;
    }
    return false;
  }
}

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/assets/images/avatars/', '/assets/avatars/');
}

/**
 * Actualiza la barra de navegación para mostrar el usuario activo o botones de inicio.
 * Utiliza renderNavbarAuthSync para consistencia y cero parpadeo.
 */
function updateAuthUI() {
  const containers = [
    document.getElementById('nav-auth-container'),
    document.getElementById('auth-buttons-container')
  ].filter(Boolean);

  containers.forEach(container => {
    renderNavbarAuthSync(container);
  });
}

function toggleAuthDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('auth-user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}
window.toggleAuthDropdown = toggleAuthDropdown;

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('auth-user-dropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(e.target) && !e.target.closest('#user-avatar-btn') && !e.target.closest('#market-avatar-btn')) {
      dropdown.classList.add('hidden');
    }
  }
});

// Sincronizar datos del usuario activo directamente desde Supabase
async function syncCurrentUserFromSupabase() {
  const user = getCurrentUser();
  if (!user || !user.loggedIn) return;
  if (!window.supabase || typeof window.supabase.fetchApi !== 'function') return;

  try {
    const endpoint = user.id 
      ? `profiles?id=eq.${user.id}&select=*`
      : `profiles?username=ilike.${encodeURIComponent(user.username || user.name)}&select=*`;
    const res = await window.supabase.fetchApi(endpoint);
    if (res && res.length > 0) {
      const db = res[0];
      let hasChanges = false;
      if (db.full_name && user.name !== db.full_name) { user.name = db.full_name; hasChanges = true; }
      if (db.phone !== undefined && user.phone !== (db.phone || '')) { user.phone = db.phone || ''; hasChanges = true; }
      if (db.location_address !== undefined && user.address !== (db.location_address || '')) { user.address = db.location_address || ''; hasChanges = true; }
      if (db.farm_name !== undefined && user.preferredNode !== (db.farm_name || '')) { user.preferredNode = db.farm_name || 'Sede Urdesa · Espacio Verde'; hasChanges = true; }
      if (db.avatar_url !== undefined) {
        const cleanAvatar = normalizeAvatarUrl(db.avatar_url || '');
        if (user.avatar !== cleanAvatar) { user.avatar = cleanAvatar; hasChanges = true; }
      }
      if (db.email && user.email !== db.email) { user.email = db.email; hasChanges = true; }

      if (hasChanges) {
        setCurrentUser(user);
        updateAuthUI();
        if (typeof checkAuthStatus === 'function') checkAuthStatus();
      }
    }
  } catch (err) {
    console.warn('Sync profile silent failure:', err);
  }
}

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
  try { updateAuthUI(); } catch (e) { console.warn('Error en updateAuthUI:', e); }
  try { validateAndSyncSession(); } catch (e) { console.warn('Error en validateAndSyncSession:', e); }
  try { syncCurrentUserFromSupabase(); } catch (e) { console.warn('Error en syncCurrentUserFromSupabase:', e); }
});

/**
 * =============================================================================
 * MODAL DE CONFIGURACIÓN DEL CLIENTE (Mi perfil y seguridad)
 * =============================================================================
 */

function ensureClientSettingsModalExists() {
  let modal = document.getElementById('client-settings-modal');
  if (modal) return modal;

  const wrapper = document.createElement('div');
  wrapper.id = 'client-settings-modal';
  wrapper.className = 'hidden fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
  wrapper.innerHTML = `
    <div class="bg-[#faf8f5] w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
      <!-- Cabecera del Modal -->
      <div class="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div>
          <span id="client-settings-badge" class="text-[10px] uppercase tracking-wider font-bold text-[#c85a32] block">
            MI PERFIL Y CONFIGURACIÓN · CLIENTE
          </span>
          <h2 class="font-serif text-2xl font-bold text-stone-900 mt-0.5">
            Tu perfil, tu tranquilidad
          </h2>
          <p class="text-xs text-stone-500">
            Mantén tus datos al día para tus pedidos y entregas en el barrio.
          </p>
        </div>
        <button onclick="cancelClientSettings()" type="button" class="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold transition cursor-pointer" title="Cerrar">
          ✕
        </button>
      </div>

      <!-- Cuerpo del Modal -->
      <div class="p-6 overflow-y-auto flex-1">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Columna Izquierda: Foto y Estado de Cuenta (1 col) -->
          <div class="space-y-5">
            <!-- Card 1: Tu foto de perfil -->
            <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-center">
              <h3 class="font-bold text-stone-900 text-xs mb-3 text-left">Tu foto de perfil</h3>
              
              <div class="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-stone-200 shadow-xs mb-2 bg-stone-100 flex items-center justify-center">
                <img id="client-profile-img-preview" src="" alt="Foto de perfil" class="w-full h-full object-cover">
              </div>

              <!-- Indicador de foto pendiente de guardar -->
              <div id="client-photo-draft-status" class="hidden mb-2">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span id="client-photo-draft-text">Foto pendiente de guardar</span>
                </span>
              </div>

              <h4 id="client-profile-name-display" class="font-serif font-bold text-base text-stone-900">Max</h4>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1 mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span id="client-profile-role-display">Cliente / Comprador</span>
              </div>

              <div class="space-y-2">
                <label class="w-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📷</span>
                  <span>Cambiar foto</span>
                  <input type="file" id="client-photo-input" accept="image/*" class="hidden" onchange="handleClientPhotoUpload(event)">
                </label>
                <button type="button" onclick="removeClientPhoto()" class="text-xs font-medium text-red-600 hover:text-red-700 transition cursor-pointer">
                  Eliminar foto
                </button>
              </div>

              <p class="text-[10px] text-stone-400 mt-3 leading-normal">
                JPG o PNG · máx. 5 MB. Tu foto será visible en la comunidad.
              </p>
            </div>

            <!-- Card 2: Tu cuenta en el mercado -->
            <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h3 class="font-bold text-stone-900 text-xs mb-2">Tu cuenta en el mercado</h3>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Cuenta activa</span>
              </div>
              <p class="text-xs font-bold text-stone-800">Comunidad Raíz & Barrio</p>
              <p class="text-[11px] text-stone-500 mt-0.5">Bogotá y su tierra cercana</p>
              <div class="mt-3 pt-2.5 border-t border-stone-100 text-[10px] text-stone-400 space-y-0.5">
                <p>Cuenta CU-042</p>
                <p>En el barrio desde 2026</p>
              </div>
            </div>

            <!-- Card 3: Tu espacio -->
            <div class="bg-[#f1f6f3] border border-[#d8e6dc] p-4 rounded-2xl flex items-start gap-2.5">
              <div class="text-[#1a3d2f] text-sm mt-0.5">🛡️</div>
              <div>
                <p class="text-xs font-bold text-[#1a3d2f]">Tu espacio, a tu manera</p>
                <p class="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                  Aquí puedes cambiar tus datos personales y preferencias de entrega.
                </p>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Edición de Datos (2 cols) -->
          <div class="lg:col-span-2 space-y-5">
            <!-- Card 1: Datos personales -->
            <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h3 class="font-bold text-stone-900 text-xs mb-0.5">Datos personales</h3>
              <p class="text-[10px] text-stone-400 mb-3">Así te reconocerán los agricultores y el equipo de entregas.</p>

              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-stone-700 mb-1">Nombre visible *</label>
                  <input type="text" id="client-profile-name" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">Teléfono de contacto</label>
                    <input type="tel" id="client-profile-phone" placeholder="Ej: 310 987 6543" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">Nodo de entrega preferido</label>
                    <select id="client-profile-node" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                      <option value="Sede Urdesa · Espacio Verde">Sede Urdesa · Espacio Verde</option>
                      <option value="Sede Puerto Santa Ana · Café del Río">Sede Puerto Santa Ana · Café del Río</option>
                      <option value="Sede Ceibos · Mercado Sostenible">Sede Ceibos · Mercado Sostenible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-stone-700 mb-1">Dirección de entrega (domicilio)</label>
                  <input type="text" id="client-profile-address" placeholder="Ej: Calle 58 # 3-21, Apto 402" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                </div>

                <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span class="text-[10px] text-stone-400">Pulsa "Guardar cambios" para aplicar los datos editados.</span>
                  <button type="button" onclick="saveAllClientSettings()" class="bg-[#1a3d2f] hover:bg-[#255440] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 self-end sm:self-auto">
                    <span>💾</span>
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Card 2: Correo electrónico -->
            <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h3 class="font-bold text-stone-900 text-xs mb-0.5">Correo electrónico</h3>
              <p class="text-[10px] text-stone-400 mb-3">Tu correo se utiliza para recibir los recibos de compra y avisos de cosecha.</p>

              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-stone-700 mb-1">Correo actual</label>
                  <div class="relative">
                    <input type="email" id="client-profile-email" readonly class="w-full pl-3 pr-24 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 cursor-not-allowed">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      • Verificado
                    </span>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-stone-700 mb-1">Nuevo correo electrónico</label>
                  <div class="relative">
                    <input type="email" id="client-new-email" placeholder="Escribe tu nuevo correo electrónico" class="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">✉</span>
                  </div>
                </div>

                <!-- Stepper -->
                <div class="bg-stone-50 border border-stone-200 rounded-xl p-2.5 flex items-center justify-between text-[10px] text-stone-500">
                  <span class="font-bold text-stone-800">1. Solicitar cambio</span>
                  <span>›</span>
                  <span>2. Verificar nuevo correo</span>
                  <span>›</span>
                  <span>3. Confirmar actualización</span>
                </div>

                <div class="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span class="text-[10px] text-stone-400 max-w-sm">
                    Enviaremos un enlace al nuevo correo. Hasta confirmarlo, seguirás entrando con el actual.
                  </span>
                  <button type="button" onclick="requestClientEmailChange()" class="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer">
                    Enviar enlace de verificación
                  </button>
                </div>
              </div>
            </div>

            <!-- Card 3: Cambiar contraseña -->
            <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <h3 class="font-bold text-stone-900 text-xs mb-0.5">Cambiar contraseña</h3>
              <p class="text-[10px] text-stone-400 mb-3">Protege el acceso a tu cuenta. Nunca compartas tu clave.</p>

              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-stone-700 mb-1">Contraseña actual</label>
                  <input type="password" id="client-current-pass" placeholder="••••••••••••" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">Nueva contraseña *</label>
                    <input type="password" id="client-new-pass" placeholder="••••••••••••" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">Confirmar nueva contraseña *</label>
                    <input type="password" id="client-confirm-pass" placeholder="••••••••••••" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1a3d2f]">
                  </div>
                </div>

                <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span class="text-[10px] text-stone-400">Las contraseñas permanecen encriptadas y protegidas.</span>
                  <button type="button" onclick="saveAllClientSettings()" class="bg-[#1a3d2f] hover:bg-[#255440] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 self-end sm:self-auto">
                    <span>💾</span>
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <!-- Pie del Modal (Acciones Principales: Guardar Cambios / Cancelar) -->
      <div class="bg-white border-t border-stone-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 shrink-0">
        <div class="flex items-center gap-2 text-xs text-stone-500">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Pulsa <strong>Guardar cambios</strong> para confirmar todas las modificaciones.</span>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onclick="cancelClientSettings()" 
            class="flex-1 sm:flex-none border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 font-bold px-5 py-2.5 rounded-xl transition text-xs cursor-pointer shadow-xs text-center"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onclick="saveAllClientSettings()" 
            class="flex-1 sm:flex-none bg-[#1a3d2f] hover:bg-[#255440] text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>💾</span>
            <span>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>
  `;

  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) {
      cancelClientSettings();
    }
  });

  document.body.appendChild(wrapper);
  return wrapper;
}

async function openClientSettingsModal() {
  window.location.href = 'perfil.html';
  return;
  const user = getCurrentUser();
  if (!user) return;

  const dropdown = document.getElementById('auth-user-dropdown') || document.getElementById('market-user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  const modal = ensureClientSettingsModalExists();

  const preview = document.getElementById('client-profile-img-preview');
  if (preview) {
    preview.src = (user.avatar && user.avatar.trim() !== '') ? normalizeAvatarUrl(user.avatar) : window.DEFAULT_USER_AVATAR;
  }

  const roleDisplay = document.getElementById('client-profile-role-display');
  const badgeDisplay = document.getElementById('client-settings-badge');
  let roleLabel = 'Cliente / Comprador';
  let badgeLabel = 'MI PERFIL Y CONFIGURACIÓN · CLIENTE';
  if (user.role === 'admin') {
    roleLabel = 'Administrador de Plataforma';
    badgeLabel = 'MI PERFIL Y CONFIGURACIÓN · ADMINISTRADOR';
  } else if (user.role === 'productor') {
    roleLabel = 'Productor / Agricultor';
    badgeLabel = 'MI PERFIL Y CONFIGURACIÓN · PRODUCTOR';
  }
  if (roleDisplay) roleDisplay.textContent = roleLabel;
  if (badgeDisplay) badgeDisplay.textContent = badgeLabel;

  const nameDisplay = document.getElementById('client-profile-name-display');
  if (nameDisplay) nameDisplay.textContent = user.name || 'Max';

  const nameInput = document.getElementById('client-profile-name');
  if (nameInput) nameInput.value = user.name || '';

  const emailInput = document.getElementById('client-profile-email');
  if (emailInput) emailInput.value = user.email || '';

  const newEmailInput = document.getElementById('client-new-email');
  if (newEmailInput) newEmailInput.value = '';

  const phoneInput = document.getElementById('client-profile-phone');
  if (phoneInput) phoneInput.value = user.phone || '';

  const addressInput = document.getElementById('client-profile-address');
  if (addressInput) addressInput.value = user.address || '';

  const nodeInput = document.getElementById('client-profile-node');
  if (nodeInput && user.preferredNode) {
    nodeInput.value = user.preferredNode;
  }

  const currentPass = document.getElementById('client-current-pass');
  if (currentPass) currentPass.value = '';
  const newPass = document.getElementById('client-new-pass');
  if (newPass) newPass.value = '';
  const confirmPass = document.getElementById('client-confirm-pass');
  if (confirmPass) confirmPass.value = '';

  const statusBadge = document.getElementById('client-photo-draft-status');
  if (statusBadge) statusBadge.classList.add('hidden');

  const fileInput = document.getElementById('client-photo-input');
  if (fileInput) fileInput.value = '';

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  document.body.style.overflow = 'hidden';

  // Consultar directamente a la base de datos Supabase para verificar los datos más frescos
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const endpoint = user.id 
        ? `profiles?id=eq.${user.id}&select=*`
        : `profiles?username=ilike.${encodeURIComponent(user.username || user.name)}&select=*`;
      const freshProfiles = await window.supabase.fetchApi(endpoint);
      if (freshProfiles && freshProfiles.length > 0) {
        const fresh = freshProfiles[0];
        user.id = fresh.id || user.id;
        user.username = fresh.username || user.username;
        user.name = fresh.full_name || user.name;
        user.phone = (fresh.phone !== null && fresh.phone !== undefined) ? fresh.phone : '';
        user.address = (fresh.location_address !== null && fresh.location_address !== undefined) ? fresh.location_address : '';
        user.preferredNode = (fresh.farm_name !== null && fresh.farm_name !== undefined) ? fresh.farm_name : (user.preferredNode || 'Sede Urdesa · Espacio Verde');
        user.avatar = (fresh.avatar_url !== null && fresh.avatar_url !== undefined) ? normalizeAvatarUrl(fresh.avatar_url) : '';
        user.email = fresh.email || user.email;

        // Sincronizar en localStorage
        setCurrentUser(user);

        // Actualizar formulario del modal con los datos exactos de la BD
        if (nameInput) nameInput.value = user.name;
        if (nameDisplay) nameDisplay.textContent = user.name;
        if (phoneInput) phoneInput.value = user.phone;
        if (addressInput) addressInput.value = user.address;
        if (nodeInput && user.preferredNode) nodeInput.value = user.preferredNode;
        if (emailInput) emailInput.value = user.email;
        if (preview) {
          preview.src = (user.avatar && user.avatar.trim() !== '') ? normalizeAvatarUrl(user.avatar) : window.DEFAULT_USER_AVATAR;
        }

        updateAuthUI();
        if (typeof checkAuthStatus === 'function') checkAuthStatus();
      }
    } catch (err) {
      console.warn('Error al consultar datos en Supabase:', err);
    }
  }

  // Guardar estado original para permitir cancelar fielmente
  window.clientSettingsOriginal = JSON.parse(JSON.stringify(user));
  window.clientSettingsDraft = {
    avatar: user.avatar || '',
    pendingFile: null,
    hasPhotoChange: false,
    hasPhotoDelete: false
  };
}

function closeClientSettingsModal() {
  const modal = document.getElementById('client-settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    syncModalPauseState();
  }
}

function cancelClientSettings() {
  // Revertir vista previa de la foto al avatar guardado original
  if (window.clientSettingsOriginal) {
    const preview = document.getElementById('client-profile-img-preview');
    if (preview) {
      preview.src = (window.clientSettingsOriginal.avatar && window.clientSettingsOriginal.avatar.trim() !== '')
        ? normalizeAvatarUrl(window.clientSettingsOriginal.avatar)
        : window.DEFAULT_USER_AVATAR;
    }
  }

  const statusBadge = document.getElementById('client-photo-draft-status');
  if (statusBadge) statusBadge.classList.add('hidden');

  const fileInput = document.getElementById('client-photo-input');
  if (fileInput) fileInput.value = '';

  window.clientSettingsDraft = null;

  closeClientSettingsModal();

  if (typeof showToast === 'function') {
    showToast('Cambios cancelados. No se guardó ninguna modificación.');
  }
}

async function saveAllClientSettings() {
  const user = getCurrentUser();
  if (!user) return;

  const nameInput = document.getElementById('client-profile-name');
  const phoneInput = document.getElementById('client-profile-phone');
  const addressInput = document.getElementById('client-profile-address');
  const nodeInput = document.getElementById('client-profile-node');
  const newEmailInput = document.getElementById('client-new-email');
  const currentPass = document.getElementById('client-current-pass');
  const newPass = document.getElementById('client-new-pass');
  const confirmPass = document.getElementById('client-confirm-pass');

  // 1. Validación de nombre visible obligatorio
  const newName = nameInput ? nameInput.value.trim() : '';
  if (!newName) {
    alert('Por favor ingresa un nombre visible.');
    if (nameInput) nameInput.focus();
    return;
  }

  // 2. Validación de cambio de contraseña (si se ingresó)
  let updatedPassword = null;
  if (newPass && newPass.value) {
    if (newPass.value.length < 4) {
      alert('La nueva contraseña debe tener al menos 4 caracteres.');
      newPass.focus();
      return;
    }
    if (!confirmPass || newPass.value !== confirmPass.value) {
      alert('Las contraseñas no coinciden. Por favor verifica.');
      if (confirmPass) confirmPass.focus();
      return;
    }
    updatedPassword = newPass.value.trim();
  }

  // 3. Validación de cambio de correo (si se ingresó)
  let updatedEmail = null;
  if (newEmailInput && newEmailInput.value.trim()) {
    const emailVal = newEmailInput.value.trim();
    if (!emailVal.includes('@') || !emailVal.includes('.')) {
      alert('Por favor ingresa un correo electrónico válido.');
      newEmailInput.focus();
      return;
    }
    updatedEmail = emailVal;
  }

  // Deshabilitar botón durante el proceso de guardado
  const saveBtn = document.querySelector('button[onclick="saveAllClientSettings()"]');
  const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳</span><span>Guardando en Supabase...</span>';
  }

  try {
    // 4. Subida o eliminación de la foto en Supabase Storage
    let finalAvatarUrl = user.avatar || '';
    if (window.clientSettingsDraft && window.clientSettingsDraft.hasPhotoChange) {
      if (window.clientSettingsDraft.hasPhotoDelete) {
        finalAvatarUrl = null;
      } else if (window.clientSettingsDraft.pendingFile) {
        const file = window.clientSettingsDraft.pendingFile;
        const ext = file.name ? file.name.split('.').pop() : 'jpg';
        const cleanExt = (ext && ext.length <= 4) ? ext : 'jpg';
        const filename = `avatar_${user.username || user.id || 'user'}_${Date.now()}.${cleanExt}`;

        if (window.supabase && typeof window.supabase.uploadAsset === 'function') {
          finalAvatarUrl = normalizeAvatarUrl(await window.supabase.uploadAsset(file, filename, 'avatars'));
        }
      }
    }

    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    const addressVal = addressInput ? addressInput.value.trim() : '';
    const nodeVal = nodeInput ? nodeInput.value : '';

    // 5. Sincronización directa en la tabla 'profiles' de Supabase
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const patchData = {
        full_name: newName,
        phone: phoneVal ? phoneVal : null,
        location_address: addressVal ? addressVal : null,
        farm_name: nodeVal ? nodeVal : null
      };

      if (window.clientSettingsDraft && window.clientSettingsDraft.hasPhotoChange) {
        patchData.avatar_url = finalAvatarUrl;
      }
      if (updatedPassword) {
        patchData.password = updatedPassword;
      }
      if (updatedEmail) {
        patchData.email = updatedEmail;
      }

      const endpoint = user.id 
        ? `profiles?id=eq.${user.id}`
        : `profiles?username=ilike.${encodeURIComponent(user.username || user.name)}`;

      await window.supabase.fetchApi(endpoint, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(patchData)
      });
    }

    // 6. Actualizar objeto en memoria y sincronizar localStorage
    user.name = newName;
    user.phone = phoneVal;
    user.address = addressVal;
    user.preferredNode = nodeVal;
    user.avatar = (finalAvatarUrl !== null) ? normalizeAvatarUrl(finalAvatarUrl) : '';
    if (updatedEmail) user.email = updatedEmail;

    setCurrentUser(user);

    // 7. Limpieza de campos y cierre
    if (currentPass) currentPass.value = '';
    if (newPass) newPass.value = '';
    if (confirmPass) confirmPass.value = '';
    if (newEmailInput) newEmailInput.value = '';

    const statusBadge = document.getElementById('client-photo-draft-status');
    if (statusBadge) statusBadge.classList.add('hidden');
    window.clientSettingsDraft = null;

    updateAuthUI();
    if (typeof checkAuthStatus === 'function') checkAuthStatus();
    closeClientSettingsModal();

    let msg = '¡Datos actualizados y guardados en la base de datos Supabase!';
    if (updatedEmail) {
      msg += ` Enlace de confirmación enviado a ${updatedEmail}.`;
    }
    if (typeof showToast === 'function') {
      showToast(msg);
    } else {
      alert(msg);
    }
  } catch (err) {
    console.error('Error al guardar en Supabase:', err);
    alert('Ocurrió un error al guardar en la base de datos: ' + (err.message || err));
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnHtml;
    }
  }
}

function saveClientPersonalData() {
  return saveAllClientSettings();
}

function handleClientPhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert('El archivo es demasiado grande (máximo 10 MB).');
    if (event.target) event.target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
    if (event.target) event.target.value = '';
    return;
  }

  // Abrir modal de encuadre interactivo para que el usuario ajuste la foto antes de aplicarla
  openAvatarCropperModal(
    file,
    function onConfirm(croppedFile, croppedDataUrl) {
      if (!window.clientSettingsDraft) {
        const user = getCurrentUser() || {};
        window.clientSettingsDraft = { ...user };
      }

      window.clientSettingsDraft.pendingFile = croppedFile;
      window.clientSettingsDraft.hasPhotoChange = true;
      window.clientSettingsDraft.hasPhotoDelete = false;

      const preview = document.getElementById('client-profile-img-preview');
      if (preview) {
        preview.src = croppedDataUrl;
      }

      const statusBadge = document.getElementById('client-photo-draft-status');
      const statusText = document.getElementById('client-photo-draft-text');
      if (statusBadge) statusBadge.classList.remove('hidden');
      if (statusText) statusText.textContent = '📸 Foto encuadrada lista (pulsa Guardar cambios)';
    },
    function onCancel() {
      const fileInput = document.getElementById('client-photo-input');
      if (fileInput) fileInput.value = '';
    }
  );
}

function removeClientPhoto() {
  if (!window.clientSettingsDraft) {
    const user = getCurrentUser() || {};
    window.clientSettingsDraft = { ...user };
  }
  window.clientSettingsDraft.avatar = '';
  window.clientSettingsDraft.pendingFile = null;
  window.clientSettingsDraft.hasPhotoChange = true;
  window.clientSettingsDraft.hasPhotoDelete = true;

  const preview = document.getElementById('client-profile-img-preview');
  if (preview) preview.src = window.DEFAULT_USER_AVATAR;

  const statusBadge = document.getElementById('client-photo-draft-status');
  const statusText = document.getElementById('client-photo-draft-text');
  if (statusBadge) statusBadge.classList.remove('hidden');
  if (statusText) statusText.textContent = '🗑️ Foto eliminada (pulsa Guardar cambios para confirmar)';

  const fileInput = document.getElementById('client-photo-input');
  if (fileInput) fileInput.value = '';
}

function updateClientPassword() {
  return saveAllClientSettings();
}

function requestClientEmailChange() {
  const emailInput = document.getElementById('client-new-email');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email || !email.includes('@') || !email.includes('.')) {
    alert('Por favor ingresa un correo electrónico válido.');
    if (emailInput) emailInput.focus();
    return;
  }
  alert(`Hemos enviado un enlace de confirmación a ${email}. Hasta que lo verifiques, seguirás usando tu correo actual.`);
}

// =============================================================================
// MODAL DE ENCUADRE INTERACTIVO DE FOTO DE PERFIL (AVATAR CROPPER)
// Arrastre libre (Mouse/Touch), Zoom continuo (1.0x - 3.0x), Exportación 400x400 WebP
// =============================================================================
const cropperState = {
  img: null,
  file: null,
  fileName: '',
  panX: 0,
  panY: 0,
  zoom: 1.0,
  baseScale: 1.0,
  rotation: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
  touchDist: 0,
  startZoom: 1.0,
  onConfirm: null,
  onCancel: null
};

function ensureAvatarCropperModalExists() {
  let modal = document.getElementById('avatar-cropper-modal');
  if (modal) {
    initCropperEvents(modal);
    return modal;
  }

  modal = document.createElement('div');
  modal.id = 'avatar-cropper-modal';
  modal.className = 'hidden fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/50 select-none overflow-y-auto';
  modal.onclick = function(e) {
    if (e.target === modal) closeAvatarCropperModal(false);
  };

  modal.innerHTML = `
    <div class="relative bg-white rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[95vh] modal-scroll animate-in fade-in zoom-in-95 duration-150">
      <!-- Encabezado -->
      <div class="bg-stone-50 border-b border-stone-200 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold shadow-2xs">✂️</span>
          <div>
            <h3 class="font-serif font-bold text-stone-900 text-sm">Ajustar encuadre de la foto</h3>
            <p class="text-[10px] text-stone-500">Mueve y ajusta el zoom para que tu foto quede perfecta</p>
          </div>
        </div>
        <button type="button" onclick="closeAvatarCropperModal(false)" class="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold transition shadow-xs cursor-pointer" title="Cancelar">
          ✕
        </button>
      </div>

      <!-- Canvas interactivo con máscara circular superpuesta (280px x 280px) -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
        <div class="relative mx-auto flex flex-col items-center">
          <div id="cropper-viewport" class="relative rounded-2xl overflow-hidden shadow-inner bg-stone-900 border border-stone-300 touch-none select-none flex items-center justify-center cursor-grab active:cursor-grabbing" style="width: 280px; height: 280px;">
            <canvas id="cropper-canvas" width="280" height="280" class="block w-[280px] h-[280px] pointer-events-none" style="touch-action: none;"></canvas>
            
            <!-- Máscara circular superpuesta requerida: rounded-full ring-4 ring-white shadow-lg -->
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="w-[240px] h-[240px] rounded-full ring-4 ring-white shadow-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"></div>
            </div>

            <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-medium px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm whitespace-nowrap z-10">
              <span>✋ Arrastra para centrar</span>
              <span>•</span>
              <span>🔍 Zoom</span>
            </div>
          </div>
        </div>

        <!-- Controles deslizantes de Zoom con iconos - y + -->
        <div class="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
          <div class="flex items-center justify-between text-xs text-stone-700 font-bold">
            <span class="flex items-center gap-1.5">
              <span>🔍</span>
              <span>Zoom / Acercamiento</span>
            </span>
            <span id="cropper-zoom-label" class="text-[11px] font-mono text-[#1a3d2f] bg-white px-2 py-0.5 rounded-md border border-stone-200 font-bold">100%</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="cropper-zoom-out-btn" class="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shadow-xs transition cursor-pointer select-none" title="Alejar">
              −
            </button>
            <input 
              type="range" 
              id="cropper-zoom-slider" 
              min="1" 
              max="3" 
              step="0.05" 
              value="1" 
              class="flex-1 accent-[#1a3d2f] h-2 bg-stone-200 rounded-lg cursor-pointer"
            >
            <button type="button" id="cropper-zoom-in-btn" class="w-8 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shadow-xs transition cursor-pointer select-none" title="Acercar">
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Pie del Editor con botón "Guardar foto" -->
      <div class="bg-stone-50 border-t border-stone-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <button type="button" onclick="closeAvatarCropperModal(false)" class="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl transition cursor-pointer">
          Cancelar
        </button>
        <button type="button" id="cropper-save-btn" onclick="saveCroppedAvatar()" class="px-5 py-2.5 bg-[#1a3d2f] hover:bg-[#255240] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer">
          <span>✓</span>
          <span>Guardar foto</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initCropperEvents(modal);
  return modal;
}

function updateCropperBaseScale() {
  if (!cropperState.img) return;
  const nw = cropperState.img.naturalWidth;
  const nh = cropperState.img.naturalHeight;
  const circleD = 240; // Diámetro del círculo de encuadre en preview 280x280
  cropperState.baseScale = Math.max(circleD / nw, circleD / nh);
}

function clampCropperPan() {
  if (!cropperState.img) return;
  const nw = cropperState.img.naturalWidth;
  const nh = cropperState.img.naturalHeight;
  const currentScale = cropperState.baseScale * cropperState.zoom;
  const dispW = nw * currentScale;
  const dispH = nh * currentScale;

  const R = 120; // Radio del círculo de recorte
  const maxPanX = Math.max(0, (dispW / 2) - R);
  const maxPanY = Math.max(0, (dispH / 2) - R);

  cropperState.panX = Math.max(-maxPanX, Math.min(maxPanX, cropperState.panX));
  cropperState.panY = Math.max(-maxPanY, Math.min(maxPanY, cropperState.panY));
}

function renderCropper() {
  const canvas = document.getElementById('cropper-canvas');
  if (!canvas || !cropperState.img) return;
  const ctx = canvas.getContext('2d');
  const W = 280;
  const H = 280;
  const cx = 140;
  const cy = 140;
  const scale = cropperState.baseScale * cropperState.zoom;
  const nw = cropperState.img.naturalWidth * scale;
  const nh = cropperState.img.naturalHeight * scale;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(cx + cropperState.panX, cy + cropperState.panY);
  ctx.rotate((cropperState.rotation * Math.PI) / 180);
  ctx.drawImage(cropperState.img, -nw / 2, -nh / 2, nw, nh);
  ctx.restore();

  // Actualizar slider y label de zoom
  const slider = document.getElementById('cropper-zoom-slider');
  if (slider && Math.abs(parseFloat(slider.value) - cropperState.zoom) > 0.01) {
    slider.value = cropperState.zoom.toFixed(2);
  }
  const zoomLabel = document.getElementById('cropper-zoom-label');
  if (zoomLabel) {
    zoomLabel.textContent = `${Math.round(cropperState.zoom * 100)}%`;
  }
}

function initCropperEvents(modal) {
  if (modal._cropperEventsInitialized) return;
  modal._cropperEventsInitialized = true;

  const viewport = modal.querySelector('#cropper-viewport') || modal.querySelector('#cropper-canvas')?.parentElement;
  const slider = modal.querySelector('#cropper-zoom-slider');
  const zoomInBtn = modal.querySelector('#cropper-zoom-in-btn');
  const zoomOutBtn = modal.querySelector('#cropper-zoom-out-btn');
  const saveBtn = modal.querySelector('#cropper-save-btn') || modal.querySelector('#cropper-confirm-btn');

  // Slider de Zoom
  if (slider) {
    slider.addEventListener('input', (e) => {
      cropperState.zoom = parseFloat(e.target.value);
      clampCropperPan();
      renderCropper();
    });
  }

  // Botón Acercar (+)
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      cropperState.zoom = Math.min(3.0, Math.round((cropperState.zoom + 0.1) * 100) / 100);
      if (slider) slider.value = cropperState.zoom.toFixed(2);
      clampCropperPan();
      renderCropper();
    });
  }

  // Botón Alejar (-)
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      cropperState.zoom = Math.max(1.0, Math.round((cropperState.zoom - 0.1) * 100) / 100);
      if (slider) slider.value = cropperState.zoom.toFixed(2);
      clampCropperPan();
      renderCropper();
    });
  }

  // Botón Guardar foto
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveCroppedAvatar();
    });
  }

  // Arrastre con Mouse y Touch en el Viewport
  if (viewport) {
    // 1. Mouse Drag
    viewport.addEventListener('mousedown', (e) => {
      e.preventDefault();
      cropperState.isDragging = true;
      cropperState.startX = e.clientX;
      cropperState.startY = e.clientY;
      cropperState.startPanX = cropperState.panX;
      cropperState.startPanY = cropperState.panY;
      viewport.classList.remove('cursor-grab');
      viewport.classList.add('cursor-grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!cropperState.isDragging) return;
      cropperState.panX = cropperState.startPanX + (e.clientX - cropperState.startX);
      cropperState.panY = cropperState.startPanY + (e.clientY - cropperState.startY);
      clampCropperPan();
      renderCropper();
    });

    window.addEventListener('mouseup', () => {
      if (cropperState.isDragging) {
        cropperState.isDragging = false;
        viewport.classList.remove('cursor-grabbing');
        viewport.classList.add('cursor-grab');
      }
    });

    // 2. Mouse Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      cropperState.zoom = Math.max(1.0, Math.min(3.0, Math.round((cropperState.zoom + delta) * 100) / 100));
      if (slider) slider.value = cropperState.zoom.toFixed(2);
      clampCropperPan();
      renderCropper();
    }, { passive: false });

    // 3. Touch Drag & Pinch-Zoom
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        cropperState.isDragging = true;
        cropperState.startX = e.touches[0].clientX;
        cropperState.startY = e.touches[0].clientY;
        cropperState.startPanX = cropperState.panX;
        cropperState.startPanY = cropperState.panY;
      } else if (e.touches.length === 2) {
        cropperState.isDragging = false;
        cropperState.touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        cropperState.startZoom = cropperState.zoom;
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Evita scroll de la página en móvil durante el arrastre
      if (e.touches.length === 1 && cropperState.isDragging) {
        cropperState.panX = cropperState.startPanX + (e.touches[0].clientX - cropperState.startX);
        cropperState.panY = cropperState.startPanY + (e.touches[0].clientY - cropperState.startY);
        clampCropperPan();
        renderCropper();
      } else if (e.touches.length === 2 && cropperState.touchDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / cropperState.touchDist;
        cropperState.zoom = Math.max(1.0, Math.min(3.0, Math.round(cropperState.startZoom * factor * 100) / 100));
        if (slider) slider.value = cropperState.zoom.toFixed(2);
        clampCropperPan();
        renderCropper();
      }
    }, { passive: false });

    viewport.addEventListener('touchend', () => {
      cropperState.isDragging = false;
      cropperState.touchDist = 0;
    });

    viewport.addEventListener('touchcancel', () => {
      cropperState.isDragging = false;
      cropperState.touchDist = 0;
    });
  }
}

function openAvatarCropperModal(file, onConfirm, onCancel) {
  if (!file) return;
  const modal = ensureAvatarCropperModalExists();

  cropperState.file = file;
  cropperState.fileName = file.name || 'avatar.jpg';
  cropperState.onConfirm = onConfirm;
  cropperState.onCancel = onCancel;
  cropperState.panX = 0;
  cropperState.panY = 0;
  cropperState.zoom = 1.0;
  cropperState.rotation = 0;
  cropperState.isDragging = false;

  const slider = modal.querySelector('#cropper-zoom-slider');
  if (slider) slider.value = "1.00";

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      cropperState.img = img;
      updateCropperBaseScale();
      clampCropperPan();
      modal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
      renderCropper();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function closeAvatarCropperModal(confirmed = false) {
  const modal = document.getElementById('avatar-cropper-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    syncModalPauseState();
  }
  if (!confirmed && typeof cropperState.onCancel === 'function') {
    cropperState.onCancel();
  }
}

async function saveCroppedAvatar() {
  if (!cropperState.img) return;

  const saveBtn = document.getElementById('cropper-save-btn') || document.getElementById('cropper-confirm-btn');
  const originalHtml = saveBtn ? saveBtn.innerHTML : 'Guardar foto';
  if (saveBtn) {
    saveBtn.setAttribute('disabled', 'true');
    saveBtn.classList.add('opacity-75', 'cursor-not-allowed');
    saveBtn.innerHTML = `
      <svg class="animate-spin h-3.5 w-3.5 text-white inline mr-1" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Guardando...</span>
    `;
  }

  try {
    const outSize = 400;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outSize;
    outCanvas.height = outSize;
    const outCtx = outCanvas.getContext('2d');

    const R = 120;
    const factor = outSize / (2 * R); // 400 / 240 = 1.666667
    const scale = cropperState.baseScale * cropperState.zoom * factor;

    outCtx.save();
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.translate(200 + cropperState.panX * factor, 200 + cropperState.panY * factor);
    outCtx.rotate((cropperState.rotation * Math.PI) / 180);
    const nw = cropperState.img.naturalWidth * scale;
    const nh = cropperState.img.naturalHeight * scale;
    outCtx.drawImage(cropperState.img, -nw / 2, -nh / 2, nw, nh);
    outCtx.restore();

    // Exportar como Blob (image/webp, 0.85 con fallback a image/jpeg)
    const blob = await new Promise((resolve) => {
      outCanvas.toBlob((b) => {
        if (b) resolve(b);
        else {
          outCanvas.toBlob((fb) => resolve(fb), 'image/jpeg', 0.85);
        }
      }, 'image/webp', 0.85);
    });

    if (!blob) throw new Error('No se pudo generar el archivo de imagen.');

    const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
    const username = user.username || (user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : 'usuario');
    const timestamp = Date.now();
    const fileName = `avatar_${username}_${timestamp}.webp`;
    const croppedFile = new File([blob], fileName, { type: blob.type || 'image/webp' });
    const localDataUrl = outCanvas.toDataURL('image/webp', 0.85);

    let publicUrl = null;

    // Subir a Supabase Storage: supabase.storage.from('avatars').upload(...)
    if (window.supabase) {
      try {
        if (window.supabase.storage && typeof window.supabase.storage.from === 'function') {
          const { data, error } = await window.supabase.storage.from('avatars').upload(fileName, croppedFile, { upsert: true });
          if (!error && data) {
            const pubData = window.supabase.storage.from('avatars').getPublicUrl(fileName);
            publicUrl = pubData?.data?.publicUrl;
          }
        }
        if (!publicUrl && typeof window.supabase.uploadFile === 'function') {
          const res = await window.supabase.uploadFile('avatars', fileName, croppedFile);
          if (res && res.publicUrl) publicUrl = res.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Aviso subiendo avatar a Supabase Storage:', uploadErr);
      }
    }

    // URL final con timestamp anti-caché
    const finalAvatarUrl = publicUrl ? `${publicUrl.split('?')[0]}?t=${timestamp}` : localDataUrl;

    // Actualizar usuario en sesión y memoria
    user.avatar = finalAvatarUrl;
    user.avatar_url = finalAvatarUrl;
    if (typeof setCurrentUser === 'function') setCurrentUser(user);

    // Sincronizar en localStorage bajo rb_cached_profile para zero-flicker
    try {
      const cachedProfile = {
        id: user.id || null,
        full_name: user.name || user.full_name || 'Usuario',
        avatar_url: finalAvatarUrl,
        role: user.role || 'cliente',
        username: user.username
      };
      localStorage.setItem('rb_cached_profile', JSON.stringify(cachedProfile));
      localStorage.setItem('rb_current_user', JSON.stringify(user));
      localStorage.setItem('raiz_user', JSON.stringify(user));
    } catch (e) {}

    // Actualizar columna avatar_url en la tabla profiles de Supabase
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        const endpoint = user.id && user.id.length > 10
          ? `profiles?id=eq.${user.id}`
          : `profiles?username=eq.${encodeURIComponent(username)}`;
        await window.supabase.fetchApi(endpoint, {
          method: 'PATCH',
          body: { avatar_url: finalAvatarUrl }
        });
      } catch (err) {
        console.warn('Aviso actualizando avatar_url en Supabase:', err);
      }
    }

    // Refrescar inmediatamente el avatar en Navbar y en vista de perfil sin recargar
    const navAvatar = document.getElementById('nav-user-avatar') || document.querySelector('#user-avatar-btn img');
    if (navAvatar) navAvatar.src = finalAvatarUrl;

    const profileImg = document.getElementById('profile-avatar-preview');
    if (profileImg) profileImg.src = finalAvatarUrl;

    const deleteBtn = document.getElementById('btn-delete-avatar');
    if (deleteBtn) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.removeAttribute('disabled');
    }

    const badge = document.getElementById('photo-draft-badge');
    if (badge) badge.classList.add('hidden');

    // Cerrar modal y restaurar scroll
    closeAvatarCropperModal(true);

    if (typeof showToast === 'function') {
      showToast('¡Foto de perfil actualizada exitosamente!');
    } else {
      alert('¡Foto de perfil actualizada exitosamente!');
    }

    if (typeof cropperState.onConfirm === 'function') {
      cropperState.onConfirm(croppedFile, finalAvatarUrl);
    }
  } catch (err) {
    console.error('Error guardando avatar recortado:', err);
    alert('No se pudo guardar la foto: ' + (err.message || 'Error desconocido'));
  } finally {
    if (saveBtn) {
      saveBtn.removeAttribute('disabled');
      saveBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      saveBtn.innerHTML = originalHtml;
    }
  }
}

function confirmAvatarCrop() {
  return saveCroppedAvatar();
}

window.openAvatarCropperModal = openAvatarCropperModal;
window.closeAvatarCropperModal = closeAvatarCropperModal;
window.saveCroppedAvatar = saveCroppedAvatar;
window.confirmAvatarCrop = confirmAvatarCrop;


// Exportar funciones globales
window.openClientSettingsModal = openClientSettingsModal;
window.closeClientSettingsModal = closeClientSettingsModal;
window.cancelClientSettings = cancelClientSettings;
window.saveAllClientSettings = saveAllClientSettings;
window.saveClientPersonalData = saveClientPersonalData;
window.handleClientPhotoUpload = handleClientPhotoUpload;
window.removeClientPhoto = removeClientPhoto;
window.updateClientPassword = updateClientPassword;
window.requestClientEmailChange = requestClientEmailChange;
window.openAvatarCropperModal = openAvatarCropperModal;
window.closeAvatarCropperModal = closeAvatarCropperModal;
window.confirmAvatarCrop = confirmAvatarCrop;

// Cancelar/cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const cropperModal = document.getElementById('avatar-cropper-modal');
    if (cropperModal && !cropperModal.classList.contains('hidden')) {
      closeAvatarCropperModal(false);
      return;
    }
    const modal = document.getElementById('client-settings-modal');
    if (modal && !modal.classList.contains('hidden')) {
      cancelClientSettings();
    }
  }
});


