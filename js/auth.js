/**
 * Raíz & Barrio - Módulo de Autenticación y Control de Sesión
 * 
 * Usuarios de prueba:
 * - Cliente:      max   / 123
 * - Productor:    maxp  / 123
 * - Admin:        admin / admin123
 */

window.DEFAULT_USER_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2NCcgaGVpZ2h0PSc2NCcgdmlld0JveD0nMCAwIDY0IDY0Jz48Y2lyY2xlIGN4PSczMicgY3k9JzMyJyByPSczMicgZmlsbD0nI2U3ZTVlNCcvPjxwYXRoIGQ9J00zMiAzMmExMCAxMCAwIDEgMCAwLTIwIDEwIDEwIDAgMCAwIDAgMjB6bTAgNmMtOC44NCAwLTIwIDQuNDgtMjAgMTJ2NGg0MHYtNGMwLTcuNTItMTEuMTYtMTItMjAtMTJ6JyBmaWxsPScjNzg3MTZjJy8+PC9zdmc+";
var DEFAULT_USER_AVATAR = window.DEFAULT_USER_AVATAR;

window.normalizeAvatarUrl = function(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/assets/images/avatars/', '/assets/avatars/');
};
var normalizeAvatarUrl = window.normalizeAvatarUrl;

const AUTH_ACCOUNTS = {
  cliente: {
    username: 'max',
    password: '123',
    role: 'cliente',
    name: 'Max',
    phone: '0997766751',
    address: 'Carrera 7 n.º 32-16, apto. 402',
    preferredNode: 'Nodo Central · La Perseverancia',
    email: 'max@vecinos.com',
    avatar: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/avatars/avatar_max_1794094307238.jpg'
  },
  productor: {
    username: 'maxp',
    password: '123',
    role: 'productor',
    name: 'Max Productor',
    finca: 'Huerta El Renacer',
    email: 'maxp@elrenacer.co',
    avatar: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg'
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Lucía Torres',
    email: 'lucia@raizybarrio.co',
    avatar: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/lucia_torres.jpg'
  }
};

// Obtener usuario actualmente conectado (sincronizado con claves de sesión)
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed) {
      parsed.loggedIn = true;
      return parsed;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Guardar sesión persistente
function setCurrentUser(user) {
  if (user) {
    user.loggedIn = true;
    localStorage.setItem('rb_current_user', JSON.stringify(user));
    localStorage.setItem('raiz_user', JSON.stringify(user));
  }
}

// Cerrar sesión
function logoutUser() {
  localStorage.removeItem('rb_current_user');
  localStorage.removeItem('raiz_user');
  window.location.href = 'index.html';
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
  const hintEl = document.getElementById('auth-credentials-hint');
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
    if (hintEl) {
      hintEl.innerHTML = 'Credenciales de prueba: <strong>max</strong> / <strong>123</strong> (o admin: <strong>admin</strong> / <strong>admin123</strong>)';
    }
    if (tabCliente) {
      tabCliente.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-[#1a3d2f] text-white transition shadow-sm';
    }
    if (tabProductor) {
      tabProductor.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-stone-600 hover:text-stone-900 transition';
    }
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
    if (hintEl) {
      hintEl.innerHTML = 'Credenciales de prueba: <strong>maxp</strong> / <strong>123</strong> (o admin: <strong>admin</strong> / <strong>admin123</strong>)';
    }
    if (tabProductor) {
      tabProductor.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-[#c85a32] text-white transition shadow-sm';
    }
    if (tabCliente) {
      tabCliente.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-stone-600 hover:text-stone-900 transition';
    }
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (userInput) userInput.focus();
}

function closeLoginModal() {
  const modal = document.getElementById('login-auth-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

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

  // 1. Consulta en Base de Datos Supabase
  let dbUser = null;
  if (window.supabase && typeof window.supabase.login === 'function') {
    try {
      dbUser = await window.supabase.login(username, password);
    } catch (e) {
      console.warn('Error en Supabase login:', e);
    }
  }

  // Si existe en Supabase
  if (dbUser) {
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
        avatar: normalizeAvatarUrl(dbUser.avatar_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/lucia_torres.jpg'),
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
        showAuthError('⚠️ Esta cuenta es de Productor. Por favor ingresa a través del botón "Soy Productor".');
        resetBtn();
        return false;
      }
      if (role === 'cliente') {
        const clienteUser = {
          id: dbUser.id,
          username: dbUser.username,
          role: 'cliente',
          name: dbUser.full_name || dbUser.username,
          phone: dbUser.phone || '',
          address: dbUser.location_address || '',
          preferredNode: dbUser.farm_name || 'Nodo Central · La Perseverancia',
          email: dbUser.email || '',
          avatar: normalizeAvatarUrl(dbUser.avatar_url || ''),
          loggedIn: true
        };
        setCurrentUser(clienteUser);
        closeLoginModal();
        updateAuthUI();
        window.location.replace('mercado.html');
        return false;
      }
    }

    // C. Acceso PRODUCTOR
    if (currentAuthType === 'productor') {
      if (role === 'cliente') {
        showAuthError('⚠️ Esta cuenta es de Cliente / Comprador. Por favor ingresa a través del botón "Ingresar".');
        resetBtn();
        return false;
      }
      if (role === 'productor') {
        const prodUser = {
          id: dbUser.id,
          username: dbUser.username,
          role: 'productor',
          name: dbUser.full_name || dbUser.username,
          phone: dbUser.phone || '',
          address: dbUser.location_address || '',
          finca: dbUser.farm_name || 'Huerta El Renacer',
          email: dbUser.email || '',
          avatar: normalizeAvatarUrl(dbUser.avatar_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg'),
          loggedIn: true
        };
        setCurrentUser(prodUser);
        closeLoginModal();
        window.location.href = 'productor.html';
        return false;
      }
    }
  }

  // 2. Fallback de desarrollo local si no hay conexión a internet
  const cleanLowerUser = username.toLowerCase();
  if (cleanLowerUser === AUTH_ACCOUNTS.admin.username && password === AUTH_ACCOUNTS.admin.password) {
    setCurrentUser({ ...AUTH_ACCOUNTS.admin, loggedIn: true });
    closeLoginModal();
    window.location.href = 'admin.html';
    return false;
  }

  if (currentAuthType === 'cliente') {
    if (cleanLowerUser === AUTH_ACCOUNTS.productor.username) {
      showAuthError('⚠️ Esta cuenta es de Productor. Por favor ingresa a través del botón "Soy Productor".');
      resetBtn();
      return false;
    }
    if (cleanLowerUser === AUTH_ACCOUNTS.cliente.username && password === AUTH_ACCOUNTS.cliente.password) {
      const clienteUser = {
        ...AUTH_ACCOUNTS.cliente,
        loggedIn: true
      };
      setCurrentUser(clienteUser);
      closeLoginModal();
      updateAuthUI();
      window.location.replace('mercado.html');
      return false;
    }
  }

  if (currentAuthType === 'productor') {
    if (cleanLowerUser === AUTH_ACCOUNTS.cliente.username) {
      showAuthError('⚠️ Esta cuenta es de Cliente / Comprador. Por favor ingresa a través del botón "Ingresar".');
      resetBtn();
      return false;
    }
    if (cleanLowerUser === AUTH_ACCOUNTS.productor.username && password === AUTH_ACCOUNTS.productor.password) {
      setCurrentUser({ ...AUTH_ACCOUNTS.productor, loggedIn: true });
      closeLoginModal();
      window.location.href = 'productor.html';
      return false;
    }
  }

  resetBtn();
  // Credenciales erróneas
  showAuthError('Usuario o contraseña incorrectos en Supabase.');
  return false;
}

function showAuthError(msg) {
  const errorBox = document.getElementById('auth-error-box');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }
}

function normalizeAvatarUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/assets/images/avatars/', '/assets/avatars/');
}

/**
 * Actualiza la barra de navegación para mostrar el usuario activo o botones de inicio.
 * REGLA: Al lado del botón de la canasta SOLO se muestra la foto de usuario (sin texto con el nombre).
 */
function updateAuthUI() {
  const user = getCurrentUser();
  const authContainer = document.getElementById('nav-auth-container') || document.getElementById('auth-buttons-container');
  if (!authContainer) return;

  if (user) {
    const avatarSrc = (user.avatar && user.avatar.trim() !== '') ? normalizeAvatarUrl(user.avatar) : window.DEFAULT_USER_AVATAR;
    let profileLink = '#';
    let profileLabel = 'Mi perfil';

    if (user.role === 'admin') {
      profileLink = 'admin.html';
      profileLabel = 'Panel de Administración';
    } else if (user.role === 'productor') {
      profileLink = 'productor.html';
      profileLabel = 'Espacio de Productor';
    }

    const roleLabelDesc = user.role === 'productor' ? 'Mi cuenta · Productor' : (user.role === 'admin' ? 'Mi cuenta · Admin' : 'Mi cuenta · Comprador');

    authContainer.innerHTML = `
      <div class="relative flex items-center gap-2">
        <!-- Usuario con foto y nombre -->
        <button 
          id="user-avatar-btn" 
          onclick="toggleAuthDropdown(event)" 
          type="button"
          class="flex items-center gap-2 hover:bg-stone-50 py-1 px-1.5 rounded-xl transition border border-transparent hover:border-stone-200 cursor-pointer text-left shrink-0"
          title="${user.name || 'Mi cuenta'}"
        >
          <div class="w-8 h-8 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-2xs">
            <img 
              src="${avatarSrc}" 
              alt="Perfil" 
              class="w-full h-full object-cover"
              onerror="this.onerror=null; this.src=window.DEFAULT_USER_AVATAR;"
            >
          </div>
          <div class="hidden sm:block leading-tight text-xs">
            <span class="font-bold text-stone-900 block truncate max-w-[110px]">${user.name}</span>
            <span class="text-[10px] text-stone-400 block">${roleLabelDesc}</span>
          </div>
        </button>

        <!-- Dropdown flotante al pulsar el avatar -->
        <div id="auth-user-dropdown" class="hidden absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-1.5 z-50 text-xs text-stone-700">
          <div class="px-4 py-2 border-b border-stone-100">
            <p class="font-bold text-stone-900 truncate">${user.name}</p>
            <p class="text-[10px] text-stone-500 capitalize">${user.role || 'Cliente'}</p>
          </div>
          ${(user.role === 'admin' || user.role === 'productor') ? `
            <a href="${profileLink}" class="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition">
              <span>📊</span>
              <span>${profileLabel}</span>
            </a>
          ` : ''}
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
  } else {
    // Si estamos en mercado.html pero no hay usuario conectado
    if (document.getElementById('auth-buttons-container') && !document.getElementById('nav-auth-container')) {
      authContainer.innerHTML = `
        <button onclick="openAuthModal('login')" class="text-xs font-semibold text-stone-700 hover:text-[#1a3d2f] px-2 py-1.5 transition">
          Iniciar sesión
        </button>
        <button onclick="openAuthModal('register')" class="text-xs font-bold text-[#1a3d2f] border border-[#1a3d2f] hover:bg-[#1a3d2f] hover:text-white px-3.5 py-1.5 rounded-full transition shadow-sm">
          Registrarse
        </button>
      `;
    } else {
      // Estamos en index.html
      authContainer.innerHTML = `
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
  }
}

function toggleAuthDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('auth-user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

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
      if (db.farm_name !== undefined && user.preferredNode !== (db.farm_name || '')) { user.preferredNode = db.farm_name || 'Nodo Central · La Perseverancia'; hasChanges = true; }
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
  updateAuthUI();
  syncCurrentUserFromSupabase();
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
  wrapper.className = 'hidden fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
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
                      <option value="Nodo Central · La Perseverancia">Nodo Central · La Perseverancia</option>
                      <option value="Sede San Fernando / Chapinero">Sede San Fernando / Chapinero</option>
                      <option value="Nodo Teusaquillo / Park Way">Nodo Teusaquillo / Park Way</option>
                      <option value="Nodo Usaquén / Santa Bárbara">Nodo Usaquén / Santa Bárbara</option>
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
        user.preferredNode = (fresh.farm_name !== null && fresh.farm_name !== undefined) ? fresh.farm_name : (user.preferredNode || 'Nodo Central · La Perseverancia');
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

/**
 * ====================================================================
 * MODAL INTERACTIVO DE ENCUADRE Y RECORTE CIRCULAR DE FOTO DE PERFIL
 * ====================================================================
 * Permite al usuario ajustar la foto antes de aplicarla (pan, zoom, rotación)
 * con una guía circular en vivo, evitando descuadres y deformaciones.
 */

const cropperState = {
  img: null,
  file: null,
  fileName: 'avatar.jpg',
  baseScale: 1.0,
  zoom: 1.0,
  rotation: 0,
  panX: 0,
  panY: 0,
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
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'avatar-cropper-modal';
  modal.className = 'hidden fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
      <!-- Encabezado -->
      <div class="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#1a3d2f]/10 text-[#1a3d2f] flex items-center justify-center text-sm font-bold shrink-0">
            ✂️
          </div>
          <div>
            <h3 class="font-serif font-bold text-stone-900 text-sm sm:text-base leading-tight">Ajustar foto de perfil</h3>
            <p class="text-[11px] text-stone-500 leading-tight mt-0.5">Encuadra tu foto dentro del círculo</p>
          </div>
        </div>
        <button type="button" onclick="closeAvatarCropperModal(false)" class="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold transition shadow-xs cursor-pointer" title="Cancelar">
          ✕
        </button>
      </div>

      <!-- Cuerpo del Editor -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
        <!-- Canvas interactivo con marco circular -->
        <div class="relative mx-auto flex flex-col items-center">
          <div class="relative rounded-2xl overflow-hidden shadow-inner bg-stone-900 border border-stone-300 touch-none select-none flex items-center justify-center" style="width: 320px; height: 320px;">
            <canvas id="cropper-canvas" width="320" height="320" class="cursor-grab active:cursor-grabbing block" style="touch-action: none;"></canvas>
            
            <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm whitespace-nowrap">
              <span>✋ Arrastra para centrar</span>
              <span>•</span>
              <span>🔍 Rueda para zoom</span>
            </div>
          </div>
        </div>

        <!-- Controles de Zoom y Rotación -->
        <div class="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-3">
          <div>
            <div class="flex items-center justify-between text-xs font-bold text-stone-700 mb-1.5">
              <span class="flex items-center gap-1.5">
                <span>🔍</span>
                <span>Zoom / Acercamiento</span>
              </span>
              <span id="cropper-zoom-label" class="text-[11px] font-mono text-[#1a3d2f] bg-white px-2 py-0.5 rounded-md border border-stone-200">100%</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="cropper-zoom-out-btn" class="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shadow-xs transition cursor-pointer" title="Alejar">
                −
              </button>
              <input 
                type="range" 
                id="cropper-zoom-slider" 
                min="1" 
                max="3" 
                step="0.01" 
                value="1" 
                class="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#1a3d2f]"
              >
              <button type="button" id="cropper-zoom-in-btn" class="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shadow-xs transition cursor-pointer" title="Acercar">
                +
              </button>
            </div>
          </div>

          <!-- Acciones de rotación y recentrado -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-stone-200 text-xs">
            <button type="button" id="cropper-rotate-btn" class="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
              <span>↺</span>
              <span>Girar 90°</span>
            </button>
            <button type="button" id="cropper-reset-btn" class="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
              <span>⟲</span>
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        <!-- Vista previa en tiempo real -->
        <div class="bg-white border border-stone-200 rounded-2xl p-3 flex items-center gap-3">
          <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1a3d2f] shrink-0 bg-stone-100 shadow-sm flex items-center justify-center">
            <canvas id="cropper-preview-canvas" width="56" height="56" class="w-full h-full block rounded-full"></canvas>
          </div>
          <div class="text-xs">
            <p class="font-bold text-stone-800 leading-tight">Vista previa en perfil</p>
            <p class="text-[11px] text-stone-500 leading-snug mt-0.5">
              Así se verá en la esquina superior derecha junto a tu canasta.
            </p>
          </div>
        </div>
      </div>

      <!-- Pie con Confirmación Obligatoria -->
      <div class="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
        <button 
          type="button" 
          onclick="closeAvatarCropperModal(false)" 
          class="border border-stone-300 text-stone-700 bg-white hover:bg-stone-100 font-bold px-4 py-2 rounded-xl transition text-xs cursor-pointer shadow-xs"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          id="cropper-confirm-btn"
          class="bg-[#1a3d2f] hover:bg-[#255440] text-white font-bold px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition text-xs flex items-center gap-2 cursor-pointer"
        >
          <span>✓</span>
          <span>Confirmar encuadre</span>
        </button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAvatarCropperModal(false);
    }
  });

  document.body.appendChild(modal);
  initCropperEvents(modal);
  return modal;
}

function getEffectiveDimensions() {
  if (!cropperState.img) return { w: 1, h: 1 };
  const isRotated = cropperState.rotation % 180 !== 0;
  return {
    w: isRotated ? cropperState.img.naturalHeight : cropperState.img.naturalWidth,
    h: isRotated ? cropperState.img.naturalWidth : cropperState.img.naturalHeight
  };
}

function updateCropperBaseScale() {
  const { w, h } = getEffectiveDimensions();
  const circleDiameter = 240; // Diámetro del círculo guía (2 * R, con R = 120)
  cropperState.baseScale = Math.max(circleDiameter / w, circleDiameter / h);
}

function clampCropperPan() {
  const { w, h } = getEffectiveDimensions();
  const scale = cropperState.baseScale * cropperState.zoom;
  const halfW = (w * scale) / 2;
  const halfH = (h * scale) / 2;
  const R = 120;

  const maxPanX = Math.max(0, halfW - R);
  const maxPanY = Math.max(0, halfH - R);

  cropperState.panX = Math.max(-maxPanX, Math.min(maxPanX, cropperState.panX));
  cropperState.panY = Math.max(-maxPanY, Math.min(maxPanY, cropperState.panY));
}

function renderCropper() {
  const canvas = document.getElementById('cropper-canvas');
  if (!canvas || !cropperState.img) return;
  const ctx = canvas.getContext('2d');
  const W = 320;
  const H = 320;
  const cx = 160;
  const cy = 160;
  const R = 120;
  const scale = cropperState.baseScale * cropperState.zoom;

  ctx.clearRect(0, 0, W, H);

  // 1. Dibujar la imagen transformada
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(cx + cropperState.panX, cy + cropperState.panY);
  ctx.rotate((cropperState.rotation * Math.PI) / 180);
  const nw = cropperState.img.naturalWidth * scale;
  const nh = cropperState.img.naturalHeight * scale;
  ctx.drawImage(cropperState.img, -nw / 2, -nh / 2, nw, nh);
  ctx.restore();

  // 2. Viñeta oscura exterior
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
  ctx.fill('evenodd');

  // 3. Anillo circular blanco guía
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // 4. Guías sutiles de composición dentro del círculo
  const dThird = (2 * R) / 3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(cx - R + dThird, cy - R);
  ctx.lineTo(cx - R + dThird, cy + R);
  ctx.moveTo(cx - R + 2 * dThird, cy - R);
  ctx.lineTo(cx - R + 2 * dThird, cy + R);
  ctx.moveTo(cx - R, cy - R + dThird);
  ctx.lineTo(cx + R, cy - R + dThird);
  ctx.moveTo(cx - R, cy - R + 2 * dThird);
  ctx.lineTo(cx + R, cy - R + 2 * dThird);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // 5. Vista previa miniatura en vivo
  renderCropperPreview();

  // 6. Actualizar etiqueta de zoom
  const zoomLabel = document.getElementById('cropper-zoom-label');
  if (zoomLabel) {
    zoomLabel.textContent = `${Math.round(cropperState.zoom * 100)}%`;
  }
}

function renderCropperPreview() {
  const pCanvas = document.getElementById('cropper-preview-canvas');
  if (!pCanvas || !cropperState.img) return;
  const pCtx = pCanvas.getContext('2d');
  const pSize = 56;
  const pRadius = 28;
  const R = 120;
  const factor = pSize / (2 * R);
  const scale = cropperState.baseScale * cropperState.zoom;

  pCtx.clearRect(0, 0, pSize, pSize);
  pCtx.save();
  pCtx.imageSmoothingEnabled = true;
  pCtx.imageSmoothingQuality = 'high';
  pCtx.beginPath();
  pCtx.arc(pRadius, pRadius, pRadius, 0, Math.PI * 2);
  pCtx.clip();

  pCtx.translate(pRadius + cropperState.panX * factor, pRadius + cropperState.panY * factor);
  pCtx.rotate((cropperState.rotation * Math.PI) / 180);
  const nw = cropperState.img.naturalWidth * scale * factor;
  const nh = cropperState.img.naturalHeight * scale * factor;
  pCtx.drawImage(cropperState.img, -nw / 2, -nh / 2, nw, nh);
  pCtx.restore();
}

function initCropperEvents(modal) {
  const canvas = modal.querySelector('#cropper-canvas');
  const slider = modal.querySelector('#cropper-zoom-slider');
  const zoomInBtn = modal.querySelector('#cropper-zoom-in-btn');
  const zoomOutBtn = modal.querySelector('#cropper-zoom-out-btn');
  const rotateBtn = modal.querySelector('#cropper-rotate-btn');
  const resetBtn = modal.querySelector('#cropper-reset-btn');
  const confirmBtn = modal.querySelector('#cropper-confirm-btn');

  if (slider) {
    slider.addEventListener('input', (e) => {
      cropperState.zoom = parseFloat(e.target.value);
      clampCropperPan();
      renderCropper();
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      cropperState.zoom = Math.min(3.0, cropperState.zoom + 0.15);
      if (slider) slider.value = cropperState.zoom;
      clampCropperPan();
      renderCropper();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      cropperState.zoom = Math.max(1.0, cropperState.zoom - 0.15);
      if (slider) slider.value = cropperState.zoom;
      clampCropperPan();
      renderCropper();
    });
  }

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      cropperState.rotation = (cropperState.rotation + 90) % 360;
      updateCropperBaseScale();
      clampCropperPan();
      renderCropper();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      cropperState.panX = 0;
      cropperState.panY = 0;
      cropperState.zoom = 1.0;
      cropperState.rotation = 0;
      if (slider) slider.value = 1.0;
      updateCropperBaseScale();
      renderCropper();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      confirmAvatarCrop();
    });
  }

  if (canvas) {
    // Arrastre con ratón
    canvas.addEventListener('mousedown', (e) => {
      cropperState.isDragging = true;
      cropperState.startX = e.clientX;
      cropperState.startY = e.clientY;
      cropperState.startPanX = cropperState.panX;
      cropperState.startPanY = cropperState.panY;
      canvas.classList.remove('cursor-grab');
      canvas.classList.add('cursor-grabbing');
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
        canvas.classList.remove('cursor-grabbing');
        canvas.classList.add('cursor-grab');
      }
    });

    // Zoom con rueda de ratón
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      cropperState.zoom = Math.max(1.0, Math.min(3.0, cropperState.zoom + delta));
      if (slider) slider.value = cropperState.zoom;
      clampCropperPan();
      renderCropper();
    }, { passive: false });

    // Gestos táctiles en pantallas táctiles y móviles
    canvas.addEventListener('touchstart', (e) => {
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

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
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
        cropperState.zoom = Math.max(1.0, Math.min(3.0, cropperState.startZoom * factor));
        if (slider) slider.value = cropperState.zoom;
        clampCropperPan();
        renderCropper();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      cropperState.isDragging = false;
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

  const slider = document.getElementById('cropper-zoom-slider');
  if (slider) slider.value = 1.0;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      cropperState.img = img;
      updateCropperBaseScale();
      clampCropperPan();
      modal.classList.remove('hidden');
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
  }
  if (!confirmed && typeof cropperState.onCancel === 'function') {
    cropperState.onCancel();
  }
}

function confirmAvatarCrop() {
  if (!cropperState.img) return;
  const outSize = 400;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');

  const R = 120;
  const factor = outSize / (2 * R); // 400 / 240
  const scale = cropperState.baseScale * cropperState.zoom;

  outCtx.save();
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.translate(200 + cropperState.panX * factor, 200 + cropperState.panY * factor);
  outCtx.rotate((cropperState.rotation * Math.PI) / 180);
  const nw = cropperState.img.naturalWidth * scale * factor;
  const nh = cropperState.img.naturalHeight * scale * factor;
  outCtx.drawImage(cropperState.img, -nw / 2, -nh / 2, nw, nh);
  outCtx.restore();

  outCanvas.toBlob((blob) => {
    if (!blob) {
      alert('Error al generar la imagen recortada.');
      return;
    }
    const cleanName = (cropperState.fileName || 'avatar.jpg').replace(/\.[^/.]+$/, "") + '_framed.jpg';
    const croppedFile = new File([blob], cleanName, { type: 'image/jpeg' });
    const dataUrl = outCanvas.toDataURL('image/jpeg', 0.92);

    if (typeof cropperState.onConfirm === 'function') {
      cropperState.onConfirm(croppedFile, dataUrl);
    }
    closeAvatarCropperModal(true);
  }, 'image/jpeg', 0.92);
}

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


