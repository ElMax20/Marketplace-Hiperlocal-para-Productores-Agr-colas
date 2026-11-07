/**
 * Raíz & Barrio - Módulo de Autenticación y Control de Sesión
 * 
 * Usuarios de prueba:
 * - Cliente:      max   / 123
 * - Productor:    maxp  / 123
 * - Admin:        admin / admin123
 */

const AUTH_ACCOUNTS = {
  cliente: {
    username: 'max',
    password: '123',
    role: 'cliente',
    name: 'Max',
    email: 'max@vecinos.com'
  },
  productor: {
    username: 'maxp',
    password: '123',
    role: 'productor',
    name: 'Max Productor',
    finca: 'Huerta El Renacer',
    email: 'maxp@elrenacer.co'
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Lucía Torres',
    email: 'lucia@raizybarrio.co'
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
        email: dbUser.email || 'lucia@raizybarrio.co',
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
          email: dbUser.email,
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
          finca: dbUser.farm_name || 'Huerta El Renacer',
          email: dbUser.email,
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
 * Actualiza la barra de navegación para mostrar el usuario activo o botones de inicio
 */
function updateAuthUI() {
  const user = getCurrentUser();
  const authContainer = document.getElementById('nav-auth-container');
  if (!authContainer) return;

  if (user) {
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    let roleName = 'Cliente';
    let profileLink = '#';

    if (user.role === 'admin') {
      badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
      roleName = 'Administrador';
      profileLink = 'admin.html';
    } else if (user.role === 'productor') {
      badgeColor = 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]';
      roleName = 'Productor';
      profileLink = 'productor.html';
    }

    authContainer.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="${profileLink}" class="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-full transition text-xs">
          <div class="w-6 h-6 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center font-bold text-[10px]">
            ${user.name.charAt(0)}
          </div>
          <span class="font-bold text-stone-800">${user.name}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full border ${badgeColor} font-semibold">${roleName}</span>
        </a>
        <button onclick="logoutUser()" class="p-2 text-stone-400 hover:text-red-600 transition rounded-full hover:bg-stone-100" title="Cerrar sesión">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    `;
  } else {
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

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
});

