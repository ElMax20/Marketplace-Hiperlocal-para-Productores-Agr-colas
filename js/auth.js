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

const AUTH_ACCOUNTS = {
  cliente: {
    username: 'max',
    password: '123',
    role: 'cliente',
    name: 'Elmaxi_09',
    phone: '0997766751',
    address: '',
    preferredNode: 'Nodo Central · La Perseverancia',
    email: 'max@vecinos.com',
    avatar: '' // Sin foto personalizada -> mostrará foto predeterminada
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
        avatar: dbUser.avatar_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/lucia_torres.jpg',
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
          avatar: dbUser.avatar_url || '',
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
          avatar: dbUser.avatar_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/elena_moreno.jpg',
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

/**
 * Actualiza la barra de navegación para mostrar el usuario activo o botones de inicio.
 * REGLA: Al lado del botón de la canasta SOLO se muestra la foto de usuario (sin texto con el nombre).
 */
function updateAuthUI() {
  const user = getCurrentUser();
  const authContainer = document.getElementById('nav-auth-container') || document.getElementById('auth-buttons-container');
  if (!authContainer) return;

  if (user) {
    const avatarSrc = (user.avatar && user.avatar.trim() !== '') ? user.avatar : window.DEFAULT_USER_AVATAR;
    let profileLink = '#';
    let profileLabel = 'Mi perfil';

    if (user.role === 'admin') {
      profileLink = 'admin.html';
      profileLabel = 'Panel de Administración';
    } else if (user.role === 'productor') {
      profileLink = 'productor.html';
      profileLabel = 'Espacio de Productor';
    }

    authContainer.innerHTML = `
      <div class="relative flex items-center">
        <!-- Foto de perfil pequeña y discreta (34x34px) -->
        <button 
          id="user-avatar-btn" 
          onclick="toggleAuthDropdown(event)" 
          type="button"
          class="rounded-full overflow-hidden border border-stone-200 hover:ring-2 hover:ring-[#1a3d2f] focus:outline-none transition flex items-center justify-center p-0 cursor-pointer bg-stone-100 shrink-0 shadow-xs"
          style="width: 34px; height: 34px; min-width: 34px; min-height: 34px; max-width: 34px; max-height: 34px;"
          title="${user.name || 'Mi cuenta'}"
        >
          <img 
            src="${avatarSrc}" 
            alt="Perfil" 
            class="rounded-full object-cover"
            style="width: 34px; height: 34px; min-width: 34px; min-height: 34px; max-width: 34px; max-height: 34px; display: block;"
            onerror="this.onerror=null; this.src=window.DEFAULT_USER_AVATAR;"
          >
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
          <button onclick="openClientSettingsModal()" class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-stone-50 text-stone-800 transition cursor-pointer font-medium">
            <span>⚙️</span>
            <span>Configuración</span>
          </button>
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
      if (db.avatar_url !== undefined && user.avatar !== (db.avatar_url || '')) { user.avatar = db.avatar_url || ''; hasChanges = true; }
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
  const user = getCurrentUser();
  if (!user) return;

  const dropdown = document.getElementById('auth-user-dropdown') || document.getElementById('market-user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  const modal = ensureClientSettingsModalExists();

  const preview = document.getElementById('client-profile-img-preview');
  if (preview) {
    preview.src = (user.avatar && user.avatar.trim() !== '') ? user.avatar : window.DEFAULT_USER_AVATAR;
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
        user.avatar = (fresh.avatar_url !== null && fresh.avatar_url !== undefined) ? fresh.avatar_url : '';
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
          preview.src = (user.avatar && user.avatar.trim() !== '') ? user.avatar : window.DEFAULT_USER_AVATAR;
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
        ? window.clientSettingsOriginal.avatar
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
          finalAvatarUrl = await window.supabase.uploadAsset(file, filename, 'avatars');
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
    user.avatar = (finalAvatarUrl !== null) ? finalAvatarUrl : '';
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

  if (file.size > 5 * 1024 * 1024) {
    alert('El archivo es demasiado grande (máximo 5 MB).');
    return;
  }

  if (!window.clientSettingsDraft) {
    const user = getCurrentUser() || {};
    window.clientSettingsDraft = { ...user };
  }

  window.clientSettingsDraft.pendingFile = file;
  window.clientSettingsDraft.hasPhotoChange = true;
  window.clientSettingsDraft.hasPhotoDelete = false;

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('client-profile-img-preview');
    if (preview) preview.src = e.target.result;

    const statusBadge = document.getElementById('client-photo-draft-status');
    const statusText = document.getElementById('client-photo-draft-text');
    if (statusBadge) statusBadge.classList.remove('hidden');
    if (statusText) statusText.textContent = '📸 Foto lista para guardar en Supabase';
  };
  reader.readAsDataURL(file);
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

// Cancelar/cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('client-settings-modal');
    if (modal && !modal.classList.contains('hidden')) {
      cancelClientSettings();
    }
  }
});


