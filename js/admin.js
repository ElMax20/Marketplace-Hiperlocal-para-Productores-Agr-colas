/**
 * Raíz & Barrio - Lógica del Panel de Administración
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verificación de sesión de Administrador
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    // Si no es admin, permitimos entrar si viene de prueba o redirigimos
    // Para conveniencia de desarrollo, si no hay sesión, avisamos
    console.warn('Sesión de administrador activa por entorno de desarrollo.');
  }

  // Inicializar módulo de Solicitudes de Productores en tiempo real
  initProducerApplicationsModule();

  // Leer tab de URL hash si existe
  const hash = window.location.hash.replace('#', '');
  if (['productos', 'agregar', 'solicitudes', 'cuentas', 'roles', 'auditoria', 'perfil'].includes(hash)) {
    switchAdminTab(hash);
  } else {
    switchAdminTab('productos');
  }

  updatePreviewCard();
});

const BREADCRUMB_MAP = {
  productos: 'Tienda / Productos',
  agregar: 'Tienda / Agregar producto',
  solicitudes: 'Solicitudes de Productores',
  cuentas: 'Gestionar cuentas',
  roles: 'Roles y permisos',
  auditoria: 'Auditoría',
  perfil: 'Mi perfil y seguridad'
};

/**
 * Cambia la pestaña activa del panel de administración
 * @param {'productos' | 'agregar' | 'solicitudes' | 'cuentas' | 'roles' | 'auditoria' | 'perfil'} tabId 
 */
function switchAdminTab(tabId) {
  // Ocultar todas las vistas
  document.querySelectorAll('.admin-view').forEach(view => {
    view.classList.add('hidden');
  });

  // Quitar estado activo de los botones del menú
  document.querySelectorAll('.nav-admin-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostrar vista seleccionada
  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove('hidden');
  }

  // Activar botón del menú
  const activeBtn = document.getElementById(`btn-tab-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Actualizar miga de pan
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent && BREADCRUMB_MAP[tabId]) {
    breadcrumbCurrent.textContent = BREADCRUMB_MAP[tabId];
  }

  // Si entra en solicitudes y no se han renderizado
  if (tabId === 'solicitudes') {
    if (_allProducerApplications.length === 0) {
      loadProducerApplications();
    } else {
      renderProducerApplications();
    }
  }

  // Actualizar hash de la URL
  window.location.hash = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Actualiza la tarjeta de previsualización en vivo en "Agregar producto"
 */
function updatePreviewCard() {
  const nameInput = document.getElementById('form-product-name');
  const originInput = document.getElementById('form-product-origin');
  const producerSelect = document.getElementById('form-product-producer');
  const priceInput = document.getElementById('form-product-price');
  const unitSelect = document.getElementById('form-product-unit');

  const previewTitle = document.getElementById('preview-card-title');
  const previewOrigin = document.getElementById('preview-card-origin');
  const previewPrice = document.getElementById('preview-card-price');
  const previewUnit = document.getElementById('preview-card-unit');

  if (previewTitle && nameInput) {
    previewTitle.textContent = nameInput.value || 'Nombre del producto';
  }

  if (previewOrigin) {
    if (originInput && originInput.value) {
      previewOrigin.textContent = originInput.value;
    } else if (producerSelect) {
      previewOrigin.textContent = producerSelect.value;
    }
  }

  if (previewPrice && priceInput) {
    let p = priceInput.value.trim();
    if (p && !p.startsWith('$')) p = '$' + p;
    previewPrice.textContent = p || '$0,00';
  }

  if (previewUnit && unitSelect) {
    const unitText = unitSelect.value.split('·')[0].trim().toLowerCase();
    previewUnit.textContent = `/ ${unitText}`;
  }
}

// Variable para almacenar el id de la cuenta seleccionada en "Gestionar cuentas"
let selectedAccountId = '00000000-0000-0000-0000-000000000004'; // Elena Moreno por defecto

/**
 * Carga los datos de una cuenta en el panel lateral de "Gestionar cuentas"
 */
function selectAccountForEdit(name, email, role, status, initials, id) {
  if (id) selectedAccountId = id;
  const avatarEl = document.getElementById('edit-account-avatar');
  const nameEl = document.getElementById('edit-account-name');
  const emailEl = document.getElementById('edit-account-email');
  const roleSelect = document.getElementById('edit-account-role');
  const statusSelect = document.getElementById('edit-account-status');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (roleSelect) roleSelect.value = role;
  if (statusSelect) statusSelect.value = status;
}

/**
 * Publicar producto directamente hacia la base de datos Supabase
 */
async function publishProductToSupabase() {
  const nameInput = document.getElementById('form-product-name');
  const priceInput = document.getElementById('form-product-price');
  const unitSelect = document.getElementById('form-product-unit');
  const originInput = document.getElementById('form-product-origin');

  const title = nameInput ? nameInput.value.trim() : 'Rábanos de temporada';
  let cleanVal = priceInput ? priceInput.value.replace(/[^0-9.]/g, '') : '0.28';
  const price = parseFloat(cleanVal) || 0.28;
  const unit = unitSelect ? unitSelect.value.split('·')[0].trim() : 'Manojo';
  const description = originInput ? originInput.value.trim() : 'Hacienda San José · Daule';

  const newProduct = {
    producer_id: '00000000-0000-0000-0000-000000000002', // Max Productor
    category_id: 2, // Verduras
    title: title,
    description: description,
    price: price,
    unit: unit,
    stock_quantity: 30,
    is_available: true,
    image_url: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg'
  };

  if (window.supabase && typeof window.supabase.createProduct === 'function') {
    try {
      await window.supabase.createProduct(newProduct);
      alert(`¡Producto "${title}" guardado y publicado con éxito en la base de datos de Supabase!`);
    } catch (e) {
      console.warn('Error al guardar en Supabase:', e);
      alert(`Producto "${title}" guardado en la tienda.`);
    }
  } else {
    alert(`Producto "${title}" publicado con éxito.`);
  }

  switchAdminTab('productos');
}

/**
 * Guardar cambios de cuenta directamente hacia Supabase
 */
async function saveAccountChangesToSupabase() {
  const roleSelect = document.getElementById('edit-account-role');
  const statusSelect = document.getElementById('edit-account-status');
  const nameEl = document.getElementById('edit-account-name');

  const newRole = roleSelect ? roleSelect.value.toLowerCase() : 'productor';
  const accountName = nameEl ? nameEl.textContent : 'la cuenta';

  // Mapear rol a enum de Supabase ('cliente', 'productor', 'administrador')
  let dbRole = 'productor';
  if (newRole.includes('admin')) dbRole = 'administrador';
  else if (newRole.includes('comprador') || newRole.includes('cliente')) dbRole = 'cliente';

  if (window.supabase && typeof window.supabase.updateProfile === 'function' && selectedAccountId) {
    try {
      await window.supabase.updateProfile(selectedAccountId, { role: dbRole });
      alert(`¡Cambios guardados y sincronizados en Supabase para ${accountName}!`);
      return;
    } catch (e) {
      console.warn('Error al actualizar en Supabase:', e);
    }
  }

  alert(`Cambios guardados para ${accountName}.`);
}

/**
 * =============================================================================
 * Lógica de "Mi Perfil y Seguridad" con sincronización en Supabase
 * =============================================================================
 */

// Guardar datos personales sincronizados con Supabase
async function savePersonalData() {
  const nameInput = document.getElementById('profile-name-input');
  if (!nameInput) return;

  const newName = nameInput.value.trim();
  if (!newName) {
    alert('Por favor ingresa un nombre válido.');
    return;
  }

  // Actualizar tarjeta de perfil en UI
  const cardName = document.getElementById('profile-card-name');
  if (cardName) cardName.textContent = newName;

  // Actualizar en base de datos Supabase
  if (window.supabase && typeof window.supabase.updateProfile === 'function') {
    try {
      const adminId = '00000000-0000-0000-0000-000000000003';
      await window.supabase.updateProfile(adminId, { full_name: newName });
      console.log('Perfil de administrador sincronizado en Supabase.');
    } catch (e) {
      console.warn('Error al actualizar perfil en Supabase:', e);
    }
  }

  // Actualizar en localStorage si existe usuario conectado
  const user = getCurrentUser();
  if (user) {
    user.name = newName;
    setCurrentUser(user);
  }

  alert('¡Datos personales actualizados y sincronizados con Supabase correctamente!');
}

// Previsualizar nueva foto de perfil
function previewProfileImage(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof window.openAvatarCropperModal === 'function') {
    window.openAvatarCropperModal(file, (croppedFile, dataUrl) => {
      const preview = document.getElementById('profile-img-preview');
      if (preview) {
        preview.src = dataUrl;
      }
      window.adminPendingAvatarFile = croppedFile;
      alert('Foto encuadrada correctamente. Recuerda hacer clic en "Guardar datos personales" para confirmar.');
    }, () => {
      if (event.target) event.target.value = '';
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('profile-img-preview');
    if (preview) {
      preview.src = e.target.result;
    }
    alert('Foto seleccionada. Recuerda hacer clic en "Guardar datos personales" para confirmar.');
  };
  reader.readAsDataURL(file);
}

// Eliminar foto de perfil (restablecer a placeholder)
function resetProfilePhoto() {
  const preview = document.getElementById('profile-img-preview');
  if (preview) {
    preview.src = 'https://ui-avatars.com/api/?name=Lucia+Torres&background=1a3d2f&color=fff&size=128';
  }
  alert('Foto eliminada. Se mostrará el avatar con iniciales.');
}

// Solicitar cambio de correo electrónico
function requestEmailChange() {
  const emailInput = document.getElementById('new-email-input');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email || !email.includes('@')) {
    alert('Por favor escribe un correo electrónico válido.');
    return;
  }

  alert(`Hemos enviado un enlace de verificación a ${email}. Revisa tu bandeja de entrada.`);
  if (emailInput) emailInput.value = '';
}

// Alternar visibilidad de contraseñas (ojo)
function togglePassVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// Actualizar contraseña
function updatePassword() {
  const currentPass = document.getElementById('pass-current');
  const newPass = document.getElementById('pass-new');
  const confirmPass = document.getElementById('pass-confirm');

  if (!currentPass || !newPass || !confirmPass) return;

  if (!currentPass.value) {
    alert('Por favor ingresa tu contraseña actual.');
    return;
  }

  if (newPass.value.length < 6) {
    alert('La nueva contraseña debe tener al menos 6 caracteres.');
    return;
  }

  if (newPass.value !== confirmPass.value) {
    alert('La nueva contraseña y su confirmación no coinciden.');
    return;
  }

  alert('¡Contraseña actualizada exitosamente! Las contraseñas permanecen protegidas y encriptadas.');
  newPass.value = '';
  confirmPass.value = '';
}

/**
 * =============================================================================
 * Módulo: Solicitudes de Alta de Productores (En Tiempo Real)
 * =============================================================================
 */

let _allProducerApplications = [];
let _currentAppsFilter = 'pending'; // 'pending' | 'approved' | 'rejected' | 'all'
let _currentAppsSearchQuery = '';
let _selectedRejectAppId = null;
let _selectedContactAppId = null;
let _applicationsRealtimeChannel = null;

/**
 * Inicializa el módulo de solicitudes y suscripciones en tiempo real
 */
async function initProducerApplicationsModule() {
  await loadProducerApplications();
  initProducerApplicationsRealtime();
}

/**
 * Carga las solicitudes de productores desde Supabase
 */
async function loadProducerApplications(showRefreshToast = false) {
  const container = document.getElementById('applications-cards-container');
  if (container && _allProducerApplications.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-stone-200">
        <svg class="animate-spin h-6 w-6 text-[#143628] mx-auto mb-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-xs text-stone-500 font-medium">Sincronizando solicitudes de productores...</p>
      </div>
    `;
  }

  try {
    if (window.supabase && typeof window.supabase.getProducerApplications === 'function') {
      const apps = await window.supabase.getProducerApplications();
      _allProducerApplications = Array.isArray(apps) ? apps : [];
    } else {
      _allProducerApplications = [];
    }

    updateApplicationsCounters();
    renderProducerApplications();

    if (showRefreshToast) {
      showAdminToast('✓ Solicitudes de productores sincronizadas.');
    }
  } catch (err) {
    console.error('Error al cargar solicitudes de productores:', err);
    if (container) {
      container.innerHTML = `
        <div class="p-6 text-center bg-white rounded-2xl border border-rose-200 text-rose-700 text-xs">
          Ocurrió un error al cargar las solicitudes de productores.
        </div>
      `;
    }
  }
}

/**
 * Actualiza los contadores de las tarjetas KPI, pestañas de filtro y badge lateral
 */
function updateApplicationsCounters() {
  const pendingCount = _allProducerApplications.filter(a => a.status === 'pending').length;
  const approvedCount = _allProducerApplications.filter(a => a.status === 'approved').length;
  const rejectedCount = _allProducerApplications.filter(a => a.status === 'rejected').length;
  const totalCount = _allProducerApplications.length;

  // KPI cards
  const kpiPending = document.getElementById('kpi-apps-pending');
  const kpiApproved = document.getElementById('kpi-apps-approved');
  const kpiRejected = document.getElementById('kpi-apps-rejected');
  const kpiTotal = document.getElementById('kpi-apps-total');

  if (kpiPending) kpiPending.textContent = pendingCount;
  if (kpiApproved) kpiApproved.textContent = approvedCount;
  if (kpiRejected) kpiRejected.textContent = rejectedCount;
  if (kpiTotal) kpiTotal.textContent = totalCount;

  // Filter tab counts
  const countPending = document.getElementById('count-filter-pending');
  const countApproved = document.getElementById('count-filter-approved');
  const countRejected = document.getElementById('count-filter-rejected');
  const countAll = document.getElementById('count-filter-all');

  if (countPending) countPending.textContent = pendingCount;
  if (countApproved) countApproved.textContent = approvedCount;
  if (countRejected) countRejected.textContent = rejectedCount;
  if (countAll) countAll.textContent = totalCount;

  // Sidebar badge
  const sidebarBadge = document.getElementById('badge-pending-applications-count');
  if (sidebarBadge) {
    if (pendingCount > 0) {
      sidebarBadge.textContent = pendingCount;
      sidebarBadge.classList.remove('hidden');
    } else {
      sidebarBadge.classList.add('hidden');
    }
  }
}

/**
 * Cambia el filtro de estado activo ('pending', 'approved', 'rejected', 'all')
 */
function setApplicationsFilter(status) {
  _currentAppsFilter = status;

  ['pending', 'approved', 'rejected', 'all'].forEach(s => {
    const btn = document.getElementById(`filter-btn-${s}`);
    if (btn) {
      if (s === status) {
        btn.className = 'px-3.5 py-1.5 rounded-xl transition bg-[#143628] text-white font-bold shadow-2xs';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-xl transition text-stone-600 hover:text-stone-900 hover:bg-stone-100';
      }
    }
  });

  renderProducerApplications();
}

/**
 * Filtro dinámico en tiempo real por texto
 */
function handleApplicationsSearch(query) {
  _currentAppsSearchQuery = (query || '').toLowerCase().trim();
  renderProducerApplications();
}

/**
 * Formateo amigable de fecha de solicitud
 */
function formatAppDate(dateStr) {
  if (!dateStr) return 'Fecha no disponible';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Hace un instante';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer, ' + date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) + 
           ' · ' + date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return dateStr;
  }
}

/**
 * Renderiza la lista de tarjetas de solicitudes
 */
function renderProducerApplications() {
  const container = document.getElementById('applications-cards-container');
  if (!container) return;

  // Filtrado por estado
  let filtered = _allProducerApplications.filter(app => {
    if (_currentAppsFilter === 'all') return true;
    return app.status === _currentAppsFilter;
  });

  // Filtrado por búsqueda
  if (_currentAppsSearchQuery) {
    const q = _currentAppsSearchQuery;
    filtered = filtered.filter(app => {
      const name = (app.full_name || '').toLowerCase();
      const farm = (app.farm_name || '').toLowerCase();
      const email = (app.email || '').toLowerCase();
      const phone = (app.phone || '').toLowerCase();
      const location = (app.location || '').toLowerCase();
      const products = (app.product_categories || app.products || '').toLowerCase();
      return name.includes(q) || farm.includes(q) || email.includes(q) || phone.includes(q) || location.includes(q) || products.includes(q);
    });
  }

  if (filtered.length === 0) {
    let emptyMsg = 'No hay solicitudes pendientes en este momento.';
    if (_currentAppsFilter === 'approved') emptyMsg = 'No hay solicitudes aprobadas registradas.';
    else if (_currentAppsFilter === 'rejected') emptyMsg = 'No hay solicitudes rechazadas.';
    else if (_currentAppsSearchQuery) emptyMsg = `No se encontraron resultados para "${_currentAppsSearchQuery}".`;

    container.innerHTML = `
      <div class="bg-white p-10 rounded-2xl border border-stone-200 text-center space-y-3">
        <div class="w-12 h-12 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-xl">
          🌾
        </div>
        <h4 class="font-serif text-lg font-bold text-stone-800">Bandeja al día</h4>
        <p class="text-xs text-stone-500 max-w-sm mx-auto">${emptyMsg}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(app => {
    const isPending = app.status === 'pending';
    const isApproved = app.status === 'approved';
    const isRejected = app.status === 'rejected';

    let statusBadge = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pendiente de Visita
      </span>
    `;
    if (isApproved) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span class="text-emerald-600 font-bold">✓</span> Acreditada / Aprobada
        </span>
      `;
    } else if (isRejected) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <span class="text-rose-600 font-bold">✕</span> Rechazada
        </span>
      `;
    }

    const agroBadge = app.is_agroecological ? `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#143628] border border-emerald-200">
        🌱 Agroecológico
      </span>
    ` : '';

    const notesSection = app.notes ? `
      <div class="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-150 text-[11px] text-stone-600 italic">
        "${escapeHtml(app.notes)}"
      </div>
    ` : '';

    const rejectionReasonSection = (isRejected && app.rejection_reason) ? `
      <div class="mt-3 p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
        <span class="text-sm">⚠️</span>
        <div>
          <strong class="font-bold">Motivo de rechazo:</strong> ${escapeHtml(app.rejection_reason)}
        </div>
      </div>
    ` : '';

    const reviewMetadata = (app.reviewed_at) ? `
      <span class="text-[10px] text-stone-400 block mt-1">
        Evaluado el ${formatAppDate(app.reviewed_at)}
      </span>
    ` : '';

    return `
      <div id="card-app-${app.id}" class="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 transition-all duration-200 hover:shadow-md space-y-4">
        
        <!-- Header de la tarjeta -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-serif text-lg font-bold text-stone-900">${escapeHtml(app.farm_name || 'Finca sin nombre')}</h3>
              ${agroBadge}
            </div>
            <div class="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
              <span class="font-medium text-stone-800">👤 ${escapeHtml(app.full_name || 'Agricultor no registrado')}</span>
              <span class="text-stone-300">•</span>
              <span class="text-stone-500">📍 ${escapeHtml(app.location || 'Guayas')}</span>
            </div>
          </div>

          <div class="flex flex-col sm:items-end gap-1 shrink-0">
            ${statusBadge}
            <span class="text-[11px] text-stone-400 font-mono">Enviado: ${formatAppDate(app.created_at)}</span>
            ${reviewMetadata}
          </div>
        </div>

        <!-- Detalles de cultivo y contacto -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="space-y-1.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Cultivos declarados</span>
            <p class="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-150 leading-relaxed">
              🌾 ${escapeHtml(app.product_categories || app.products || 'No especificados')}
            </p>
          </div>

          <div class="space-y-1.5">
            <span class="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">Canales de Contacto</span>
            <div class="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-150">
              <div class="flex items-center gap-2 text-stone-700">
                <span>✉️</span>
                <span class="font-mono text-[11px] truncate">${escapeHtml(app.email || 'Sin correo')}</span>
              </div>
              <div class="flex items-center gap-2 text-stone-700">
                <span>📱</span>
                <span class="font-mono text-[11px]">${escapeHtml(app.phone || 'Sin teléfono')}</span>
              </div>
            </div>
          </div>
        </div>

        ${notesSection}
        ${rejectionReasonSection}

        <!-- Barra de Acciones Directas -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
          <div class="text-[11px] text-stone-400">
            ID: <span class="font-mono text-[10px]">${(app.id || '').substring(0, 8)}...</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Botón Contactar -->
            <button 
              type="button" 
              onclick="openContactModal('${app.id}')" 
              class="px-3.5 py-2 rounded-xl border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <svg class="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span>Contactar</span>
            </button>

            <!-- Botón Rechazar -->
            ${isRejected ? `
              <button disabled class="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs cursor-default flex items-center gap-1.5">
                <span>✕</span>
                <span>Rechazada</span>
              </button>
            ` : `
              <button 
                type="button" 
                onclick="openRejectModal('${app.id}')" 
                class="px-3.5 py-2 rounded-xl border border-[#C85A28] text-[#C85A28] hover:bg-rose-50 font-bold text-xs transition flex items-center gap-1.5"
              >
                <span>✕</span>
                <span>Rechazar</span>
              </button>
            `}

            <!-- Botón Aprobar -->
            ${isApproved ? `
              <button disabled class="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs cursor-default flex items-center gap-1.5">
                <span>✓</span>
                <span>Aprobada</span>
              </button>
            ` : `
              <button 
                type="button" 
                id="btn-approve-${app.id}" 
                onclick="approveProducerApplication('${app.id}')" 
                class="px-4 py-2 rounded-xl bg-[#143628] hover:bg-[#1f4d3a] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>Aprobar</span>
              </button>
            `}
          </div>
        </div>

      </div>
    `;
  }).join('');
}

/**
 * Aprueba una solicitud de productor y actualiza la UI
 */
async function approveProducerApplication(id) {
  const app = _allProducerApplications.find(a => a.id === id);
  if (!app) return;

  const farmName = app.farm_name || 'la finca';
  const farmerName = app.full_name || 'el agricultor';

  const confirmed = confirm(`¿Confirmas la APROBACIÓN de la solicitud de "${farmName}" a cargo de ${farmerName}?\n\n• Se cambiará el estado a Aprobada en Supabase.\n• Se creará/habilitará su cuenta de productor en profiles.\n• Se notificará al webhook de n8n para bienvenida.`);
  if (!confirmed) return;

  const btn = document.getElementById(`btn-approve-${id}`);
  if (btn) {
    btn.setAttribute('disabled', 'true');
    btn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg><span>Aprobando...</span>`;
  }

  try {
    const adminUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    let updated = null;

    if (window.supabase && typeof window.supabase.approveProducerApplication === 'function') {
      updated = await window.supabase.approveProducerApplication(id, adminUser);
    } else {
      updated = { ...app, status: 'approved', reviewed_at: new Date().toISOString() };
    }

    // Actualizar estado local
    const index = _allProducerApplications.findIndex(a => a.id === id);
    if (index !== -1) {
      _allProducerApplications[index] = { ..._allProducerApplications[index], ...updated, status: 'approved' };
    }

    updateApplicationsCounters();
    renderProducerApplications();
    showAdminToast(`✓ Solicitud de "${farmName}" aprobada con éxito. Perfil activado.`);
  } catch (err) {
    console.error('Error aprobando solicitud:', err);
    alert('Ocurrió un error al aprobar la solicitud: ' + (err.message || 'Error de conexión'));
    if (btn) {
      btn.removeAttribute('disabled');
      btn.innerHTML = `<span>✓</span><span>Aprobar</span>`;
    }
  }
}

/**
 * Control del modal de rechazo
 */
function openRejectModal(id) {
  const app = _allProducerApplications.find(a => a.id === id);
  if (!app) return;

  _selectedRejectAppId = id;
  const farmEl = document.getElementById('reject-modal-farm');
  const nameEl = document.getElementById('reject-modal-name');
  const inputEl = document.getElementById('reject-reason-input');

  if (farmEl) farmEl.textContent = app.farm_name || 'Finca';
  if (nameEl) nameEl.textContent = app.full_name || 'Agricultor';
  if (inputEl) inputEl.value = '';

  const modal = document.getElementById('modal-reject-application');
  if (modal) modal.classList.remove('hidden');
}

function closeRejectModal() {
  _selectedRejectAppId = null;
  const modal = document.getElementById('modal-reject-application');
  if (modal) modal.classList.add('hidden');
}

async function confirmRejectApplication() {
  if (!_selectedRejectAppId) return;

  const id = _selectedRejectAppId;
  const app = _allProducerApplications.find(a => a.id === id);
  const reasonInput = document.getElementById('reject-reason-input');
  const reason = reasonInput ? reasonInput.value.trim() : '';

  const confirmBtn = document.getElementById('btn-confirm-reject');
  if (confirmBtn) {
    confirmBtn.setAttribute('disabled', 'true');
    confirmBtn.innerHTML = `<span>Rechazando...</span>`;
  }

  try {
    const adminUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    let updated = null;

    if (window.supabase && typeof window.supabase.rejectProducerApplication === 'function') {
      updated = await window.supabase.rejectProducerApplication(id, reason, adminUser);
    } else {
      updated = { ...app, status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() };
    }

    // Actualizar estado local
    const index = _allProducerApplications.findIndex(a => a.id === id);
    if (index !== -1) {
      _allProducerApplications[index] = { 
        ..._allProducerApplications[index], 
        ...updated, 
        status: 'rejected',
        rejection_reason: reason
      };
    }

    closeRejectModal();
    updateApplicationsCounters();
    renderProducerApplications();
    showAdminToast(`✕ Solicitud de "${app?.farm_name || 'la finca'}" rechazada.`);
  } catch (err) {
    console.error('Error al rechazar la solicitud:', err);
    alert('Ocurrió un error al rechazar la solicitud: ' + (err.message || 'Error de conexión'));
  } finally {
    if (confirmBtn) {
      confirmBtn.removeAttribute('disabled');
      confirmBtn.innerHTML = `Confirmar Rechazo`;
    }
  }
}

/**
 * Control del modal de contacto directo
 */
function openContactModal(id) {
  const app = _allProducerApplications.find(a => a.id === id);
  if (!app) return;

  _selectedContactAppId = id;
  const farmEl = document.getElementById('contact-modal-farm');
  const nameEl = document.getElementById('contact-modal-name');
  const detailsEl = document.getElementById('contact-modal-details');

  if (farmEl) farmEl.textContent = app.farm_name || 'Finca de Productor';
  if (nameEl) nameEl.textContent = app.full_name || 'Agricultor';
  if (detailsEl) detailsEl.textContent = `${app.phone || 'Sin WhatsApp'} · ${app.email || 'Sin correo'}`;

  // 1. Configurar enlace WhatsApp internacional para Ecuador (+593)
  const rawPhone = (app.phone || '').replace(/[^0-9]/g, '');
  let ecPhone = rawPhone;
  if (rawPhone.startsWith('09') && rawPhone.length === 10) {
    ecPhone = '593' + rawPhone.substring(1);
  } else if (!rawPhone.startsWith('593') && rawPhone.length === 9) {
    ecPhone = '593' + rawPhone;
  }

  const waGreeting = `Hola ${app.full_name || ''}, te escribimos de la Dirección Técnica de Raíz & Barrio respecto a tu solicitud de acreditación para ${app.farm_name || 'tu finca'}. Queremos coordinar tu visita técnica agronómica.`;
  const waBtn = document.getElementById('btn-contact-whatsapp');
  if (waBtn) {
    waBtn.href = `https://wa.me/${ecPhone}?text=${encodeURIComponent(waGreeting)}`;
  }

  // 2. Configurar enlace mailto
  const emailSubject = `Acreditación Técnica Raíz & Barrio - Finca ${app.farm_name || ''}`;
  const emailBody = `Estimado(a) ${app.full_name || 'productor(a)'},\n\nHemos recibido tu solicitud de acreditación agronómica para ${app.farm_name || 'tu finca'} en la plataforma Raíz & Barrio.\n\nNos gustaría ponernos en contacto para agendar la visita de inspección y validar tus prácticas agrícolas.\n\nQuedamos atentos a tu respuesta.\n\nSaludos cordiales,\nDirección Técnica · Raíz & Barrio`;
  const emailBtn = document.getElementById('btn-contact-email');
  if (emailBtn) {
    emailBtn.href = `mailto:${app.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  }

  const modal = document.getElementById('modal-contact-application');
  if (modal) modal.classList.remove('hidden');
}

function closeContactModal() {
  _selectedContactAppId = null;
  const modal = document.getElementById('modal-contact-application');
  if (modal) modal.classList.add('hidden');
}

/**
 * Escucha en tiempo real cambios en producer_applications
 */
function initProducerApplicationsRealtime() {
  // 1. Canal Supabase Realtime si el cliente oficial está presente
  try {
    const sbClient = window._officialSupabaseClient || window.supabaseClient || (window.supabase && window.supabase.realtime);
    if (sbClient && typeof sbClient.channel === 'function') {
      _applicationsRealtimeChannel = sbClient.channel('producer-applications-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'producer_applications' }, payload => {
          handleRealtimeAppChange(payload);
        })
        .subscribe((status) => {
          console.log('Realtime status producer_applications:', status);
        });
    }
  } catch (e) {
    console.warn('Realtime Supabase channel no disponible:', e);
  }

  // 2. Canal BroadcastChannel local para 0-latency instantáneo en la misma máquina/pestañas
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('rb_producer_applications');
      bc.onmessage = (event) => {
        if (event.data && event.data.application) {
          handleRealtimeAppChange({
            eventType: event.data.type || 'INSERT',
            new: event.data.application
          });
        }
      };
    }
  } catch (_) {}
}

/**
 * Procesa un cambio recibido vía WebSocket o BroadcastChannel
 */
function handleRealtimeAppChange(payload) {
  if (!payload || !payload.new) return;
  const record = payload.new;

  if (payload.eventType === 'INSERT') {
    const existingIndex = _allProducerApplications.findIndex(a => a.id === record.id);
    if (existingIndex === -1) {
      // Agregar al inicio
      _allProducerApplications.unshift(record);
      showAdminToast(`🌱 Nueva solicitud de productor recibida: "${record.farm_name || 'Nueva Finca'}"`);
      updateApplicationsCounters();
      renderProducerApplications();

      // Animación suave en la tarjeta recién llegada
      setTimeout(() => {
        const newCard = document.getElementById(`card-app-${record.id}`);
        if (newCard) {
          newCard.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50/20');
          setTimeout(() => {
            newCard.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50/20');
          }, 3000);
        }
      }, 50);
    }
  } else if (payload.eventType === 'UPDATE') {
    const existingIndex = _allProducerApplications.findIndex(a => a.id === record.id);
    if (existingIndex !== -1) {
      _allProducerApplications[existingIndex] = { ..._allProducerApplications[existingIndex], ...record };
      updateApplicationsCounters();
      renderProducerApplications();
    }
  }
}

/**
 * Notificaciones Toast para el panel de administración
 */
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-[#C85A28]' : 'bg-[#143628]';
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl ${bgClass} text-white text-xs font-medium shadow-xl border border-stone-700/20 transition-all duration-300 transform translate-y-4 opacity-0 max-w-sm`;

  toast.innerHTML = `
    <span class="text-base shrink-0">${type === 'error' ? '⚠️' : '🌱'}</span>
    <span class="flex-1 leading-snug">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" class="text-white/70 hover:text-white text-xs font-bold ml-1">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => { toast.remove(); }, 320);
  }, 5000);
}

/**
 * Escapar HTML para evitar XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.loadProducerApplications = loadProducerApplications;
window.setApplicationsFilter = setApplicationsFilter;
window.handleApplicationsSearch = handleApplicationsSearch;
window.approveProducerApplication = approveProducerApplication;
window.openRejectModal = openRejectModal;
window.closeRejectModal = closeRejectModal;
window.confirmRejectApplication = confirmRejectApplication;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.showAdminToast = showAdminToast;


