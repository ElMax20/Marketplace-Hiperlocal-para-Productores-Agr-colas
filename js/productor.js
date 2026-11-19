/**
 * Raíz & Barrio - Portal del Productor
 * Lógica de navegación entre pestañas, edición y publicación de productos,
 * gestión de perfil, sincronización con Supabase y webhooks de n8n.
 */

// URL pública oficial de producción en GitHub Pages (sin barra final)
window.PUBLIC_SITE_URL = window.PUBLIC_SITE_URL || 'https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas';
var PUBLIC_SITE_URL = window.PUBLIC_SITE_URL;

// Base CDN de assets en Supabase Storage
const SUPABASE_STORAGE_URL = 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images';
const DEFAULT_PRODUCER_AVATAR = `${SUPABASE_STORAGE_URL}/agricultor_1.jpg`;
const PRODUCER_USER_ID = '00000000-0000-0000-0000-000000000002';

// Estado del catálogo local de la finca (se nutre con los 48 productos de Supabase)
let producerProducts = [];
let allLoadedProducts = [];

// Estado del formulario de producto (Nuevo / Edición)
let productFormMode = 'new'; // 'new' | 'edit'
let editingProductId = null;
let currentEditingCode = 'PR-003';
let currentEditingTitle = '';
let uploadedImages = []; // Array of { file: File | null, url: string, isCover: boolean, isExisting: boolean }
let formDirty = false;

// Estado para constructor de canastas y estacionalidad
let productType = 'individual'; // 'individual' | 'basket'
let basketItems = []; // [{ product_id, name, quantity_label, price, units }]
let basketSavingsPercent = 0;


// Filtro activo en Mis Productos (todos, publicado, borrador, agotado)
let currentFilter = 'todos';
let currentSearchQuery = '';

// Variables para OTP 2FA de contraseña
let activeOtpTargetEmail = 'campomax46@gmail.com';
let activeOtpUserId = PRODUCER_USER_ID;
let otpResendTimer = null;
let otpSecondsRemaining = 60;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inicializar sesión del productor y UI
  await initProducerSession();

  // 2. Verificar si viene con token de confirmación de email
  const urlParams = new URLSearchParams(window.location.search);
  const verifyToken = urlParams.get('verify_email_token') || urlParams.get('token');
  if (verifyToken) {
    if (typeof switchProducerTab === 'function') {
      switchProducerTab('perfil-seguridad');
    }
    await confirmProducerEmailVerification(verifyToken);
  }

  // 3. Inicializar tarjeta y cuenta para recibir pagos
  initPayoutMethod();

  // 4. Inicializar Drag & Drop de fotografías
  setupDragAndDrop();

  // 5. Configurar fechas de entrega dinámicas
  populateUpcomingDeliveryDates();

  // 6. Configurar escuchadores de previsualización en vivo
  setupPreviewListeners();

  // 7. Cargar todos los 48 productos desde Supabase asignados a Max Productor
  await loadProducerProductsFromSupabase();

  // 8. Verificar parámetro edit_product_id en URL
  const editIdParam = urlParams.get('edit_product_id');
  if (editIdParam) {
    await loadProductForEditing(editIdParam);
    return;
  }

  // 9. Leer pestaña desde parámetro de URL (?tab= / ?seccion=) o hash (#...)
  const tabParam = urlParams.get('tab') || urlParams.get('seccion') || window.location.hash.replace('#', '');
  const initialTab = normalizeProducerTabName(tabParam || 'mis-productos');

  if (initialTab === 'nuevo-producto') {
    openNewProductForm();
  } else if (initialTab === 'registrar-gasto') {
    openExpenseForm();
  } else {
    switchProducerTab(initialTab);
  }

  // 10. Delegación de eventos a prueba de fallos para la navegación del panel de productor
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.nav-producer-btn, [data-tab]');
    if (!navBtn) return;

    const dataTab = navBtn.getAttribute('data-tab');
    if (!dataTab) return;

    const targetTab = normalizeProducerTabName(dataTab);
    if (targetTab === 'nuevo-producto') {
      openNewProductForm();
    } else if (targetTab === 'registrar-gasto') {
      openExpenseForm();
    } else {
      switchProducerTab(targetTab);
    }
  });

  // 11. Escuchar cambios de historial en el navegador (atrás / adelante)
  window.addEventListener('popstate', () => {
    const currentParams = new URLSearchParams(window.location.search);
    const poppedTab = currentParams.get('tab') || currentParams.get('seccion') || window.location.hash.replace('#', '');
    const target = normalizeProducerTabName(poppedTab || 'mis-productos');
    if (target === 'nuevo-producto' && productFormMode !== 'edit') {
      openNewProductForm();
    } else if (target === 'registrar-gasto') {
      openExpenseForm();
    } else {
      switchProducerTab(target);
    }
  });

  // Cargar módulo de economía de fondo
  initEconomyModule();
});

// =============================================================================
// UTILIDADES: TOAST, HASH Y OTP
// =============================================================================

function showProducerToast(message, isError = false) {
  let toast = document.getElementById('producer-floating-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'producer-floating-toast';
    toast.className = 'fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-none max-w-md';
    document.body.appendChild(toast);
  }

  toast.className = isError
    ? 'fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto max-w-md bg-red-800 text-white border border-red-700'
    : 'fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto max-w-md bg-[#1a3d2f] text-white border border-[#265945]';

  toast.innerHTML = `
    <span class="text-base">${isError ? '⚠️' : '✓'}</span>
    <span class="flex-1 leading-snug">${message}</span>
  `;

  if (window._producerToastTimer) clearTimeout(window._producerToastTimer);
  window._producerToastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    toast.classList.add('translate-y-4', 'opacity-0', 'pointer-events-none');
  }, 4500);
}

async function hashPassword(text) {
  if (!window.crypto || !window.crypto.subtle) return text;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateOtpCode() {
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function togglePassVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🔒';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁';
  }
}

// =============================================================================
// SESIÓN DEL PRODUCTOR Y PERFIL
// =============================================================================

async function initProducerSession() {
  let cached = null;
  try {
    const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (raw) cached = JSON.parse(raw);
  } catch (e) { }

  // Si no hay perfil o no es de productor, creamos la estructura por defecto para Max Productor
  if (!cached || !cached.role || (!cached.role.includes('productor') && !cached.role.includes('admin'))) {
    cached = {
      id: PRODUCER_USER_ID,
      username: 'maxp',
      full_name: 'Max Productor',
      email: 'campomax46@gmail.com',
      farm_name: 'Hacienda San José',
      role: 'productor',
      avatar_url: DEFAULT_PRODUCER_AVATAR,
      loggedIn: true
    };
    try {
      localStorage.setItem('rb_cached_profile', JSON.stringify(cached));
      localStorage.setItem('rb_current_user', JSON.stringify(cached));
    } catch (_) { }
  }

  // Intentar refrescar desde Supabase si hay conexión disponible
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const dbUsers = await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}&select=*`);
      if (dbUsers && dbUsers.length > 0) {
        const u = dbUsers[0];
        cached.full_name = u.full_name || cached.full_name;
        cached.farm_name = u.farm_name || cached.farm_name;
        cached.email = u.email || cached.email;
        if (u.avatar_url) cached.avatar_url = u.avatar_url;
        localStorage.setItem('rb_cached_profile', JSON.stringify(cached));
        localStorage.setItem('rb_current_user', JSON.stringify(cached));
      }
    } catch (e) {
      console.warn('Aviso sincronizando perfil de productor:', e);
    }
  }

  const producerName = cached.full_name || cached.name || 'Max Productor';
  const producerFarm = cached.farm_name || cached.finca || 'Hacienda San José';
  const producerEmail = cached.email || 'campomax46@gmail.com';
  const producerAvatar = cached.avatar_url || cached.avatar || DEFAULT_PRODUCER_AVATAR;

  // Actualizar textos en la interfaz
  const nameEls = document.querySelectorAll('.producer-name-display');
  nameEls.forEach(el => el.textContent = producerName);

  const farmEls = document.querySelectorAll('.producer-farm-display');
  farmEls.forEach(el => el.textContent = producerFarm);

  // Iniciales y avatar en cabecera
  const initials = producerName.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'MP';
  const initialsTextEl = document.getElementById('header-user-initials-text');
  if (initialsTextEl) initialsTextEl.textContent = initials;

  updateProducerAvatarUI(producerAvatar);

  // Campos de formulario en "Mi perfil y seguridad"
  const profileNameInput = document.getElementById('producer-profile-name');
  if (profileNameInput) profileNameInput.value = producerName;

  const profileFarmInput = document.getElementById('producer-profile-farm');
  if (profileFarmInput) profileFarmInput.value = producerFarm;

  const currentEmailInput = document.getElementById('producer-current-email');
  if (currentEmailInput) currentEmailInput.value = producerEmail;

  activeOtpTargetEmail = producerEmail;

  // Suscripción en Tiempo Real al Inventario
  if (window.supabase && typeof window.supabase.subscribeToProducts === 'function') {
    window.supabase.subscribeToProducts((eventPayload) => {
      try {
        console.log('[Productor Realtime] Cambio de inventario recibido:', eventPayload);

        // 1. Manejo de decremento de existencias desde checkout
        if (eventPayload.updated_products && Array.isArray(eventPayload.updated_products)) {
          let anyUpdated = false;
          eventPayload.updated_products.forEach(up => {
            const pId = up.product_id || up.id;
            const prod = producerProducts.find(p => p.id == pId || p.numericId == pId);
            if (prod) {
              const newStk = Number(up.new_stock !== undefined ? up.new_stock : up.stock_quantity);
              prod.stock = newStk;
              if (prod.status !== 'borrador') {
                const isAvail = newStk > 0;
                prod.status = isAvail ? 'publicado' : 'agotado';
                prod.statusText = isAvail ? 'Publicado' : 'Agotado';
              }
              anyUpdated = true;
            }
          });
          if (anyUpdated) {
            renderProducerProducts();
            updateKPIs();
          }
          return;
        }

        const row = eventPayload.new || eventPayload;
        if (row && row.id) {
          const prod = producerProducts.find(p => p.id == row.id || p.numericId == row.id);
          if (prod) {
            if (row.stock_quantity !== undefined) {
              prod.stock = Number(row.stock_quantity);
              if (prod.status !== 'borrador') {
                const isAvail = row.is_available !== false && prod.stock > 0;
                prod.status = isAvail ? 'publicado' : 'agotado';
                prod.statusText = isAvail ? 'Publicado' : 'Agotado';
              }
            }
            if (row.price !== undefined) prod.price = Number(row.price);
            if (row.title) prod.title = row.title;
            renderProducerProducts();
            updateKPIs();
          }
        }
      } catch (err) {
        console.warn('Error procesando realtime en productor:', err);
      }
    });
  }
}

function updateProducerAvatarUI(avatarUrl) {
  if (!avatarUrl) return;
  const cleanUrl = typeof normalizeAvatarUrl === 'function' ? normalizeAvatarUrl(avatarUrl) : avatarUrl;

  const sidebarImg = document.getElementById('producer-sidebar-avatar');
  if (sidebarImg) sidebarImg.src = cleanUrl;

  const profileImg = document.getElementById('producer-profile-avatar');
  if (profileImg) profileImg.src = cleanUrl;

  const headerAvatarImg = document.getElementById('header-user-avatar');
  const headerInitialsText = document.getElementById('header-user-initials-text');
  if (headerAvatarImg) {
    headerAvatarImg.src = cleanUrl;
    headerAvatarImg.classList.remove('hidden');
    if (headerInitialsText) headerInitialsText.classList.add('hidden');
  }
}

// =============================================================================
// GESTIÓN DE FOTO DE PERFIL (AVATAR CROPPER Y SUPABASE STORAGE)
// =============================================================================

function handleProducerPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof window.openAvatarCropperModal === 'function') {
    window.openAvatarCropperModal(file, (croppedFile, finalAvatarUrl) => {
      updateProducerAvatarUI(finalAvatarUrl);
      showProducerToast('¡Foto de perfil actualizada y guardada con éxito!');
    });
  } else {
    // Fallback en caso de que cropper modal no esté disponible
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      updateProducerAvatarUI(dataUrl);
      showProducerToast('Foto actualizada temporalmente.');
    };
    reader.readAsDataURL(file);
  }

  // Reset del input para permitir volver a seleccionar la misma foto
  event.target.value = '';
}

async function removeProducerPhoto() {
  if (!confirm('¿Estás seguro de que deseas restablecer tu foto de perfil al valor por defecto?')) return;

  const defaultAvatar = DEFAULT_PRODUCER_AVATAR;

  // 1. Actualizar en Supabase profiles
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: defaultAvatar })
      });
    } catch (e) {
      console.warn('Error al actualizar avatar en Supabase:', e);
    }
  }

  // 2. Actualizar sesión local y caché
  try {
    const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user');
    const u = raw ? JSON.parse(raw) : {};
    u.avatar_url = defaultAvatar;
    u.avatar = defaultAvatar;
    localStorage.setItem('rb_cached_profile', JSON.stringify(u));
    localStorage.setItem('rb_current_user', JSON.stringify(u));
  } catch (_) { }

  // 3. Actualizar UI
  updateProducerAvatarUI(defaultAvatar);
  showProducerToast('Foto restablecida al valor por defecto.');
}

// =============================================================================
// ACTUALIZACIÓN DE DATOS PERSONALES
// =============================================================================

async function saveProducerPersonalData() {
  const nameInput = document.getElementById('producer-profile-name');
  const farmInput = document.getElementById('producer-profile-farm');

  const newName = nameInput ? nameInput.value.trim() : 'Max Productor';
  const newFarm = farmInput ? farmInput.value.trim() : 'Hacienda San José';

  if (!newName) {
    showProducerToast('El nombre visible no puede estar vacío.', true);
    return;
  }

  // Actualizar UI
  const nameDisplays = document.querySelectorAll('.producer-name-display');
  nameDisplays.forEach(el => el.textContent = newName);

  const farmDisplays = document.querySelectorAll('.producer-farm-display');
  farmDisplays.forEach(el => el.textContent = newFarm);

  // Actualizar sesión local
  try {
    const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user');
    const u = raw ? JSON.parse(raw) : {};
    u.full_name = newName;
    u.name = newName;
    u.farm_name = newFarm;
    u.finca = newFarm;
    localStorage.setItem('rb_cached_profile', JSON.stringify(u));
    localStorage.setItem('rb_current_user', JSON.stringify(u));
  } catch (_) { }

  // Actualizar en Supabase
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: newName,
          farm_name: newFarm
        })
      });
      console.log('Perfil de productor sincronizado en Supabase.');
    } catch (e) {
      console.warn('Error al actualizar perfil en Supabase:', e);
    }
  }

  showProducerToast('¡Datos personales actualizados y guardados en Supabase correctamente!');
}

// =============================================================================
// CAMBIO DE CORREO ELECTRÓNICO (SUPABASE + WEBHOOK N8N + MICROINTERACCIONES)
// =============================================================================

let producerResendInterval = null;
let producerResendCountdown = 30;
let producerPendingNewEmail = '';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetProducerEmailStepper() {
  const s1 = document.getElementById('producer-step-1');
  const s2 = document.getElementById('producer-step-2');
  const s3 = document.getElementById('producer-step-3');
  if (s1) {
    s1.className = 'transition-all duration-300 flex items-center gap-1.5 font-bold text-stone-800';
    s1.innerHTML = '<span class="step-num">1.</span> Solicitar cambio';
  }
  if (s2) {
    s2.className = 'transition-all duration-300 flex items-center gap-1.5 text-stone-400';
    s2.innerHTML = '<span class="step-num">2.</span> Verificar nuevo correo';
  }
  if (s3) {
    s3.className = 'transition-all duration-300 flex items-center gap-1.5 text-stone-400';
    s3.innerHTML = '<span class="step-num">3.</span> Confirmar actualización';
  }
}

function renderProducerEmailBanner(newEmail) {
  const banner = document.getElementById('producer-email-banner');
  const footer = document.getElementById('producer-email-footer');
  if (footer) footer.classList.add('hidden');
  if (!banner) return;

  banner.className = 'animate-slide-down-fade bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mt-1';
  banner.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800 text-base shadow-2xs">
        ✉️
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <h4 class="font-bold text-xs text-stone-900 leading-snug">¡Enlace de verificación enviado!</h4>
          <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">Vence en 15 min</span>
        </div>
        <p class="text-[11px] text-stone-600 mt-1 leading-relaxed">
          Revisa la bandeja de entrada (o Spam) de <strong class="text-stone-900 font-bold">${escapeHtml(newEmail)}</strong> y haz clic en el botón de autorización.
        </p>
        <div class="flex items-center gap-3.5 mt-3 pt-2.5 border-t border-emerald-200/60 text-[11px]">
          <button type="button" id="btn-producer-resend-email" onclick="resendProducerEmailVerification()" class="font-semibold text-emerald-800 hover:text-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1" disabled>
            <span>↻</span> <span id="producer-resend-countdown-text">Reenviar enlace (30s)</span>
          </button>
          <span class="text-stone-300">•</span>
          <button type="button" onclick="changeProducerEmailAddress()" class="font-semibold text-stone-600 hover:text-stone-900 cursor-pointer transition">
            Cambiar dirección
          </button>
        </div>
      </div>
    </div>
  `;
  startProducerResendTimer();
}

function startProducerResendTimer() {
  if (producerResendInterval) clearInterval(producerResendInterval);
  producerResendCountdown = 30;
  const countdownEl = document.getElementById('producer-resend-countdown-text');
  const resendBtn = document.getElementById('btn-producer-resend-email');
  if (resendBtn) resendBtn.disabled = true;
  if (countdownEl) countdownEl.textContent = `Reenviar enlace (${producerResendCountdown}s)`;

  producerResendInterval = setInterval(() => {
    producerResendCountdown--;
    const el = document.getElementById('producer-resend-countdown-text');
    const btn = document.getElementById('btn-producer-resend-email');
    if (producerResendCountdown > 0) {
      if (el) el.textContent = `Reenviar enlace (${producerResendCountdown}s)`;
    } else {
      clearInterval(producerResendInterval);
      producerResendInterval = null;
      if (el) el.textContent = 'Reenviar enlace';
      if (btn) btn.disabled = false;
    }
  }, 1000);
}

function changeProducerEmailAddress() {
  if (producerResendInterval) {
    clearInterval(producerResendInterval);
    producerResendInterval = null;
  }
  const banner = document.getElementById('producer-email-banner');
  if (banner) {
    banner.innerHTML = '';
    banner.className = 'hidden';
  }
  const footer = document.getElementById('producer-email-footer');
  if (footer) footer.classList.remove('hidden');

  const btn = document.getElementById('btn-producer-email');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span id="btn-producer-email-text">Enviar enlace de verificación</span>';
  }

  const inputNew = document.getElementById('producer-new-email');
  if (inputNew) {
    inputNew.readOnly = false;
    inputNew.disabled = false;
    inputNew.classList.remove('ring-2', 'ring-emerald-500/40', 'bg-emerald-50/20', 'animate-pulse', 'bg-stone-100', 'text-stone-500', 'cursor-not-allowed');
    inputNew.focus();
  }

  resetProducerEmailStepper();
}

async function resendProducerEmailVerification() {
  if (!producerPendingNewEmail) return;
  startProducerResendTimer();
  showProducerToast('Reenviando enlace de verificación a ' + producerPendingNewEmail + '...');

  const currentEmailEl = document.getElementById('producer-current-email');
  const currentEmail = currentEmailEl ? currentEmailEl.value.trim().toLowerCase() : 'campomax46@gmail.com';

  try {
    let token = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(32);
      window.crypto.getRandomValues(arr);
      token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const verificationUrl = `${PUBLIC_SITE_URL}/productor.html?verify_email_token=${encodeURIComponent(token)}`;

    // Guardar en Supabase
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        await window.supabase.fetchApi(`email_change_requests?user_id=eq.${PRODUCER_USER_ID}`, {
          method: 'DELETE'
        });
      } catch (_) { }

      await window.supabase.fetchApi('email_change_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          current_email: currentEmail,
          new_email: producerPendingNewEmail,
          verification_token: token,
          expires_at: expiresAt,
          confirmation_url: verificationUrl,
          verification_url: verificationUrl
        })
      });
    }

    // Webhook n8n
    try {
      await fetch('https://elmaxi.app.n8n.cloud/webhook/solicitar-verificacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          current_email: currentEmail,
          new_email: producerPendingNewEmail,
          verification_token: token,
          verification_url: verificationUrl,
          expires_at: expiresAt
        })
      });
    } catch (_) { }

    showProducerToast('¡Enlace reenviado! Revisa la bandeja de entrada o Spam.');
  } catch (err) {
    console.error('Error al reenviar enlace:', err);
    showProducerToast('Error de red al reenviar el enlace.', true);
  }
}

async function requestProducerEmailChange() {
  const inputNew = document.getElementById('producer-new-email');
  const newEmail = inputNew ? inputNew.value.trim().toLowerCase() : '';
  const currentEmailEl = document.getElementById('producer-current-email');
  const currentEmail = currentEmailEl ? currentEmailEl.value.trim().toLowerCase() : 'campomax46@gmail.com';
  const btn = document.getElementById('btn-producer-email');

  if (!newEmail) {
    showProducerToast('Por favor escribe tu nuevo correo electrónico.', true);
    if (inputNew) inputNew.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    showProducerToast('El correo electrónico ingresado no tiene un formato válido.', true);
    if (inputNew) inputNew.focus();
    return;
  }

  if (newEmail === currentEmail) {
    showProducerToast('El nuevo correo no puede ser idéntico al actual.', true);
    if (inputNew) inputNew.focus();
    return;
  }

  // a. Botón muestra spinner + "Enviando enlace seguro..."
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="inline-block animate-spin mr-1.5 text-xs">⏳</span> <span id="btn-producer-email-text">Enviando enlace seguro...</span>';
  }

  // Campo de entrada se bloquea con sutil resplandor de procesamiento
  if (inputNew) {
    inputNew.readOnly = true;
    inputNew.classList.add('ring-2', 'ring-emerald-500/40', 'bg-emerald-50/20', 'animate-pulse');
  }

  // b. Stepper transition:
  // Paso 1 -> check verde ("✓ Solicitud enviada")
  // Paso 2 -> se ilumina con pastilla verde bosque (#143628) con pulso sutil
  const s1 = document.getElementById('producer-step-1');
  const s2 = document.getElementById('producer-step-2');
  const s3 = document.getElementById('producer-step-3');

  if (s1) {
    s1.className = 'transition-all duration-300 flex items-center gap-1.5 text-emerald-700 font-bold';
    s1.innerHTML = '<span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">✓</span> Solicitud enviada';
  }
  if (s2) {
    s2.className = 'transition-all duration-300 flex items-center gap-1.5';
    s2.innerHTML = '<span class="bg-[#143628] text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>2. Verificar nuevo correo</span>';
  }
  if (s3) {
    s3.className = 'transition-all duration-300 flex items-center gap-1.5 text-stone-400';
    s3.innerHTML = '<span class="step-num">3.</span> Confirmar actualización';
  }

  try {
    let token = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(32);
      window.crypto.getRandomValues(arr);
      token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const verificationUrl = `${PUBLIC_SITE_URL}/productor.html?verify_email_token=${encodeURIComponent(token)}`;

    // 1. Guardar solicitud en Supabase (email_change_requests)
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        await window.supabase.fetchApi(`email_change_requests?user_id=eq.${PRODUCER_USER_ID}`, {
          method: 'DELETE'
        });
      } catch (_) { }

      await window.supabase.fetchApi('email_change_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          current_email: currentEmail,
          new_email: newEmail,
          verification_token: token,
          expires_at: expiresAt,
          confirmation_url: verificationUrl,
          verification_url: verificationUrl
        })
      });
    }

    // 2. Disparar petición POST en JSON al webhook de n8n
    try {
      await fetch('https://elmaxi.app.n8n.cloud/webhook/solicitar-verificacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          current_email: currentEmail,
          new_email: newEmail,
          verification_token: token,
          verification_url: verificationUrl,
          expires_at: expiresAt
        })
      });
      console.log('Webhook n8n de verificación de email invocado correctamente.');
    } catch (whErr) {
      console.warn('Aviso webhook n8n:', whErr);
    }

    producerPendingNewEmail = newEmail;
    if (inputNew) {
      inputNew.classList.remove('animate-pulse');
      inputNew.classList.add('bg-stone-100', 'text-stone-500', 'cursor-not-allowed');
    }

    // c. Mostrar banner animado con fade-in + slide-down
    renderProducerEmailBanner(newEmail);
    showProducerToast('Hemos enviado un enlace de confirmación a tu nuevo correo (vence en 15 min).');

  } catch (err) {
    console.error('Error al solicitar cambio de correo:', err);
    showProducerToast('Error al procesar la solicitud: ' + (err.message || 'Error de red'), true);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span id="btn-producer-email-text">Enviar enlace de verificación</span>';
    }
    if (inputNew) {
      inputNew.readOnly = false;
      inputNew.classList.remove('ring-2', 'ring-emerald-500/40', 'bg-emerald-50/20', 'animate-pulse');
    }
    resetProducerEmailStepper();
  }
}

async function confirmProducerEmailVerification(token) {
  if (!token) return;
  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const cleanToken = token.trim();
      const endpoint = `email_change_requests?verification_token=eq.${encodeURIComponent(cleanToken)}&expires_at=gt.now()&select=*`;
      const requests = await window.supabase.fetchApi(endpoint);

      if (!requests || requests.length === 0) {
        showProducerToast('El enlace de verificación ha caducado o no es válido.', true);
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (_) { }
        return;
      }

      const match = requests[0];
      const targetEmail = match.new_email;

      // Actualizar en public.profiles
      await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ email: targetEmail })
      });

      // Marcar solicitud como procesada
      try {
        await window.supabase.fetchApi(`email_change_requests?id=eq.${match.id}`, {
          method: 'DELETE'
        });
      } catch (_) { }

      // Actualizar sesión y UI
      try {
        const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user');
        const u = raw ? JSON.parse(raw) : {};
        u.email = targetEmail;
        localStorage.setItem('rb_cached_profile', JSON.stringify(u));
        localStorage.setItem('rb_current_user', JSON.stringify(u));
      } catch (_) { }

      // d. Paso 3 ("3. Confirmar actualización") se ilumina en verde con animación de check
      const s1 = document.getElementById('producer-step-1');
      const s2 = document.getElementById('producer-step-2');
      const s3 = document.getElementById('producer-step-3');
      if (s1) {
        s1.className = 'transition-all duration-300 flex items-center gap-1.5 text-emerald-700 font-bold';
        s1.innerHTML = '<span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">✓</span> 1. Solicitud enviada';
      }
      if (s2) {
        s2.className = 'transition-all duration-300 flex items-center gap-1.5 text-emerald-700 font-bold';
        s2.innerHTML = '<span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">✓</span> 2. Correo verificado';
      }
      if (s3) {
        s3.className = 'transition-all duration-300 flex items-center gap-1.5';
        s3.innerHTML = '<span class="bg-emerald-600 text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs transition-all duration-500"><span class="w-4 h-4 rounded-full bg-white/20 inline-flex items-center justify-center text-[10px] font-bold">✓</span> 3. Actualización confirmada</span>';
      }

      // Input "Correo actual" ejecuta una transición visual actualizándose al nuevo correo
      const curInput = document.getElementById('producer-current-email');
      if (curInput) {
        curInput.value = targetEmail;
        curInput.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'text-emerald-950');
        setTimeout(() => {
          curInput.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'text-emerald-950');
        }, 4000);
      }

      // Badge "• Verificado" ejecuta un destello/glow suave de confirmación
      const badge = document.getElementById('producer-email-verified-badge');
      if (badge) {
        badge.classList.add('ring-4', 'ring-emerald-400/50', 'scale-110', 'bg-emerald-100');
        setTimeout(() => {
          badge.classList.remove('ring-4', 'ring-emerald-400/50', 'scale-110', 'bg-emerald-100');
        }, 3000);
      }

      // Banner de éxito
      const banner = document.getElementById('producer-email-banner');
      if (banner) {
        banner.className = 'animate-slide-down-fade bg-emerald-50/90 border border-emerald-300 rounded-xl p-3.5 mt-1 flex items-center gap-3';
        banner.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">✓</div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-xs text-emerald-900 leading-snug">¡Correo electrónico actualizado con éxito!</h4>
            <p class="text-[11px] text-emerald-800 mt-0.5">Tu cuenta ahora está vinculada a <strong>${escapeHtml(targetEmail)}</strong>.</p>
          </div>
        `;
      }

      // Limpiar input nuevo
      const inputNew = document.getElementById('producer-new-email');
      if (inputNew) {
        inputNew.value = '';
        inputNew.readOnly = false;
        inputNew.disabled = false;
        inputNew.classList.remove('ring-2', 'ring-emerald-500/40', 'bg-emerald-50/20', 'animate-pulse', 'bg-stone-100', 'text-stone-500', 'cursor-not-allowed');
      }

      activeOtpTargetEmail = targetEmail;

      showProducerToast('¡Tu correo electrónico ha sido actualizado exitosamente!');
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (_) { }
    }
  } catch (err) {
    console.error('Error confirmando email:', err);
  }
}

// =============================================================================
// CAMBIO DE CONTRASEÑA CON VERIFICACIÓN 2FA OTP
// =============================================================================

async function handleProducerPasswordUpdate() {
  const current = document.getElementById('producer-pass-current')?.value?.trim();
  const newPass = document.getElementById('producer-pass-new')?.value?.trim();
  const confirm = document.getElementById('producer-pass-confirm')?.value?.trim();
  const btn = document.getElementById('btn-producer-pass');
  const btnText = document.getElementById('btn-producer-pass-text');

  if (!current || !newPass || !confirm) {
    showProducerToast('Por favor completa todos los campos de contraseña.', true);
    return;
  }

  if (newPass.length < 12) {
    showProducerToast('La nueva contraseña debe tener al menos 12 caracteres.', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (!/[A-Z]/.test(newPass)) {
    showProducerToast('La nueva contraseña debe incluir al menos una letra mayúscula.', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (!/[a-z]/.test(newPass)) {
    showProducerToast('La nueva contraseña debe incluir al menos una letra minúscula.', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (!/[0-9]/.test(newPass)) {
    showProducerToast('La nueva contraseña debe incluir al menos un número (0-9).', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (!/[^a-zA-Z0-9]/.test(newPass)) {
    showProducerToast('La nueva contraseña debe incluir al menos un símbolo especial.', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (newPass !== confirm) {
    showProducerToast('La confirmación de la contraseña no coincide.', true);
    document.getElementById('producer-pass-confirm')?.focus();
    return;
  }

  if (newPass === current) {
    showProducerToast('La nueva contraseña no puede ser idéntica a la actual.', true);
    document.getElementById('producer-pass-new')?.focus();
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Verificando datos...';

  try {
    let dbPassword = null;
    let targetEmail = activeOtpTargetEmail || 'campomax46@gmail.com';

    // Verificar contraseña actual con Supabase
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        const profs = await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}&select=id,password,email`);
        if (profs && profs.length > 0) {
          dbPassword = profs[0].password;
          if (profs[0].email) targetEmail = profs[0].email;
        }
      } catch (e) {
        console.warn('Error consultando contraseña actual:', e);
      }
    }

    const currentHash = await hashPassword(current);
    const validInServer = dbPassword && (dbPassword === current || dbPassword === currentHash);
    const validInFallback = current === '123'; // Clave demo conocida

    if (!validInServer && !validInFallback) {
      showProducerToast('La contraseña actual ingresada es incorrecta.', true);
      document.getElementById('producer-pass-current')?.focus();
      return;
    }

    // Generar código OTP de 6 dígitos
    const otpCode = generateOtpCode();
    const newPasswordHash = await hashPassword(newPass);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Guardar en password_change_requests
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        await window.supabase.fetchApi(`password_change_requests?user_id=eq.${PRODUCER_USER_ID}`, {
          method: 'DELETE'
        });
      } catch (_) { }

      await window.supabase.fetchApi('password_change_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          current_email: targetEmail,
          new_password_hash: newPasswordHash,
          otp_code: otpCode,
          expires_at: expiresAt,
          attempts: 0,
          used: false
        })
      });
    }

    // Disparar n8n webhook para enviar el OTP por email
    try {
      await fetch('https://elmaxi.app.n8n.cloud/webhook/solicitar-verificacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          email: targetEmail,
          otp_code: otpCode,
          type: 'password_change_2fa',
          expires_at: expiresAt
        })
      });
    } catch (_) { }

    console.log('[2FA OTP Productor] Código generado:', otpCode);

    // Limpiar campos
    document.getElementById('producer-pass-current').value = '';
    document.getElementById('producer-pass-new').value = '';
    document.getElementById('producer-pass-confirm').value = '';

    // Abrir modal de verificación 2FA OTP
    openProducerOtpModal(targetEmail);

  } catch (err) {
    console.error('Error al preparar cambio de contraseña:', err);
    showProducerToast('Error al procesar: ' + (err.message || 'Error de red'), true);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Actualizar contraseña';
  }
}

function openProducerOtpModal(targetEmail) {
  const modal = document.getElementById('modal-otp-password');
  if (!modal) return;

  const emailDisplay = document.getElementById('otp-user-email-text');
  if (emailDisplay) emailDisplay.textContent = targetEmail || 'campomax46@gmail.com';

  const input = document.getElementById('input-otp-code');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 150);
  }

  const err = document.getElementById('otp-error-msg');
  if (err) {
    err.textContent = '';
    err.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  startProducerOtpCountdown();
}

function closeProducerOtpModal() {
  const modal = document.getElementById('modal-otp-password');
  if (modal) modal.classList.add('hidden');
  if (otpResendTimer) {
    clearInterval(otpResendTimer);
    otpResendTimer = null;
  }
}

function startProducerOtpCountdown() {
  const resendBtn = document.getElementById('btn-resend-otp');
  const countdownSpan = document.getElementById('otp-resend-countdown');
  if (otpResendTimer) clearInterval(otpResendTimer);

  otpSecondsRemaining = 60;
  if (resendBtn) resendBtn.disabled = true;
  if (countdownSpan) countdownSpan.textContent = `(60s)`;

  otpResendTimer = setInterval(() => {
    otpSecondsRemaining--;
    if (countdownSpan) countdownSpan.textContent = `(${otpSecondsRemaining}s)`;
    if (otpSecondsRemaining <= 0) {
      clearInterval(otpResendTimer);
      otpResendTimer = null;
      if (resendBtn) resendBtn.disabled = false;
      if (countdownSpan) countdownSpan.textContent = '';
    }
  }, 1000);
}

async function submitProducerOtpVerification() {
  const input = document.getElementById('input-otp-code');
  const code = input ? input.value.trim() : '';
  const errEl = document.getElementById('otp-error-msg');
  const btn = document.getElementById('btn-verify-otp');
  const btnText = document.getElementById('btn-verify-otp-text');

  if (!code || code.length !== 6) {
    if (errEl) {
      errEl.textContent = 'Ingresa el código completo de 6 dígitos.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Verificando...';

  try {
    let verified = false;
    let newHash = null;
    let requestId = null;

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const endpoint = `password_change_requests?user_id=eq.${PRODUCER_USER_ID}&used=eq.false&expires_at=gt.now()&order=created_at.desc&limit=1&select=*`;
      const records = await window.supabase.fetchApi(endpoint);

      if (records && records.length > 0) {
        const req = records[0];
        requestId = req.id;
        newHash = req.new_password_hash;

        if (req.otp_code === code) {
          verified = true;
        } else {
          const attempts = (req.attempts || 0) + 1;
          await window.supabase.fetchApi(`password_change_requests?id=eq.${requestId}`, {
            method: 'PATCH',
            body: JSON.stringify({ attempts })
          });
          if (attempts >= 3) {
            await window.supabase.fetchApi(`password_change_requests?id=eq.${requestId}`, {
              method: 'PATCH',
              body: JSON.stringify({ used: true })
            });
            if (errEl) {
              errEl.textContent = 'Has superado el límite de 3 intentos. Solicita un nuevo código.';
              errEl.classList.remove('hidden');
            }
            return;
          }
          if (errEl) {
            errEl.textContent = `Código incorrecto. Te quedan ${3 - attempts} intentos.`;
            errEl.classList.remove('hidden');
          }
          return;
        }
      }
    }

    if (!verified) {
      if (errEl) {
        errEl.textContent = 'Código incorrecto o expirado.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    // Si el código fue correcto, actualizar contraseña en profiles
    if (newHash && window.supabase && typeof window.supabase.fetchApi === 'function') {
      await window.supabase.fetchApi(`profiles?id=eq.${PRODUCER_USER_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newHash })
      });

      if (requestId) {
        await window.supabase.fetchApi(`password_change_requests?id=eq.${requestId}`, {
          method: 'PATCH',
          body: JSON.stringify({ used: true })
        });
      }
    }

    // Actualizar sesión local
    try {
      const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user');
      const u = raw ? JSON.parse(raw) : {};
      u.password = newHash;
      localStorage.setItem('rb_cached_profile', JSON.stringify(u));
      localStorage.setItem('rb_current_user', JSON.stringify(u));
    } catch (_) { }

    closeProducerOtpModal();
    showProducerToast('¡Contraseña de productor actualizada con éxito en Supabase!');

  } catch (err) {
    console.error('Error al verificar OTP:', err);
    if (errEl) {
      errEl.textContent = 'Error al validar código. Intenta de nuevo.';
      errEl.classList.remove('hidden');
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Confirmar cambio';
  }
}

async function resendProducerOtp() {
  const resendBtn = document.getElementById('btn-resend-otp');
  if (resendBtn) resendBtn.disabled = true;

  try {
    const newOtp = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const records = await window.supabase.fetchApi(`password_change_requests?user_id=eq.${PRODUCER_USER_ID}&used=eq.false&order=created_at.desc&limit=1&select=id`);
      if (records && records.length > 0) {
        await window.supabase.fetchApi(`password_change_requests?id=eq.${records[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            otp_code: newOtp,
            expires_at: expiresAt,
            attempts: 0
          })
        });
      }
    }

    try {
      await fetch('https://elmaxi.app.n8n.cloud/webhook/solicitar-verificacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: PRODUCER_USER_ID,
          email: activeOtpTargetEmail,
          otp_code: newOtp,
          type: 'password_change_2fa_resend',
          expires_at: expiresAt
        })
      });
    } catch (_) { }

    console.log('[2FA OTP Productor] Nuevo código reenviado:', newOtp);
    showProducerToast('Nuevo código de seguridad enviado a tu correo.');
    startProducerOtpCountdown();

  } catch (err) {
    console.error('Error reenviando código:', err);
    showProducerToast('No se pudo reenviar el código. Intenta más tarde.', true);
  }
}

// =============================================================================
// TARJETA Y CUENTA PARA RECIBIR PAGOS (Visual + LocalStorage Persistence)
// =============================================================================

function initPayoutMethod() {
  let payoutData = null;
  try {
    const raw = localStorage.getItem('rb_producer_payout');
    if (raw) payoutData = JSON.parse(raw);
  } catch (_) { }

  const emptyState = document.getElementById('payout-empty-state');
  const configuredState = document.getElementById('payout-configured-state');

  if (payoutData && payoutData.account) {
    if (emptyState) emptyState.classList.add('hidden');
    if (configuredState) configuredState.classList.remove('hidden');

    const bankEl = document.getElementById('payout-bank-display');
    const typeEl = document.getElementById('payout-type-display');
    const numEl = document.getElementById('payout-number-display');
    const holderEl = document.getElementById('payout-holder-display');

    if (bankEl) bankEl.textContent = payoutData.bank || 'Banco Pichincha';
    if (typeEl) typeEl.textContent = payoutData.type || 'Cuenta de Ahorros';
    if (numEl) numEl.textContent = payoutData.maskedNumber || '•••• •••• •••• 4892';
    if (holderEl) holderEl.textContent = `Titular: ${payoutData.holder || 'Max Productor'}`;
  } else {
    if (emptyState) emptyState.classList.remove('hidden');
    if (configuredState) configuredState.classList.add('hidden');
  }
}

function openPayoutMethodModal() {
  const modal = document.getElementById('modal-payout-method');
  if (!modal) return;

  // Si ya existía uno guardado, pre-llenar formulario
  try {
    const raw = localStorage.getItem('rb_producer_payout');
    if (raw) {
      const d = JSON.parse(raw);
      if (document.getElementById('payout-form-holder') && d.holder) document.getElementById('payout-form-holder').value = d.holder;
      if (document.getElementById('payout-form-bank') && d.bank) document.getElementById('payout-form-bank').value = d.bank;
      if (document.getElementById('payout-form-type') && d.type) document.getElementById('payout-form-type').value = d.type;
      if (document.getElementById('payout-form-account') && d.rawAccount) document.getElementById('payout-form-account').value = d.rawAccount;
      if (document.getElementById('payout-form-doc') && d.doc) document.getElementById('payout-form-doc').value = d.doc;
    }
  } catch (_) { }

  modal.classList.remove('hidden');
}

function closePayoutMethodModal() {
  const modal = document.getElementById('modal-payout-method');
  if (modal) modal.classList.add('hidden');
}

function savePayoutMethod(event) {
  if (event) event.preventDefault();

  const holder = document.getElementById('payout-form-holder')?.value?.trim() || 'Max Productor';
  const bank = document.getElementById('payout-form-bank')?.value || 'Banco Pichincha';
  const type = document.getElementById('payout-form-type')?.value || 'Cuenta de Ahorros';
  const accountInput = document.getElementById('payout-form-account')?.value?.trim() || '';
  const doc = document.getElementById('payout-form-doc')?.value?.trim() || '';

  if (!accountInput) {
    showProducerToast('Por favor ingresa tu número de cuenta o tarjeta.', true);
    return;
  }

  // Extraer últimos 4 dígitos
  const digitsOnly = accountInput.replace(/\D/g, '');
  const last4 = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : (accountInput.length >= 4 ? accountInput.slice(-4) : '4892');
  const maskedNumber = `•••• •••• •••• ${last4}`;

  const payoutObj = {
    holder,
    bank,
    type,
    rawAccount: accountInput,
    maskedNumber,
    doc,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('rb_producer_payout', JSON.stringify(payoutObj));
  } catch (_) { }

  initPayoutMethod();
  closePayoutMethodModal();
  showProducerToast('Preferencia de cobro guardada (Vista previa).');
}

function removePayoutMethod() {
  if (!confirm('¿Deseas eliminar esta cuenta de cobro?')) return;
  try {
    localStorage.removeItem('rb_producer_payout');
  } catch (_) { }
  initPayoutMethod();
  showProducerToast('Método de cobro eliminado.');
}

// =============================================================================
// CATÁLOGO: CARGA DE LOS 48 PRODUCTOS ASIGNADOS A MAX PRODUCTOR
// =============================================================================

async function loadProducerProductsFromSupabase() {
  try {
    let prods = null;
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // 1. Consultar productos de Max Productor o todo el catálogo activo
      prods = await window.supabase.fetchApi(`products?producer_id=eq.${PRODUCER_USER_ID}&order=id.asc`);
      if (!prods || prods.length === 0) {
        prods = await window.supabase.fetchApi('products?order=id.asc');
      }
    }

    // 2. Fallback local desde js/products-data.js si no hay red
    if (!prods || prods.length === 0) {
      if (Array.isArray(window.ALL_PRODUCTS) && window.ALL_PRODUCTS.length > 0) {
        prods = window.ALL_PRODUCTS;
      }
    }

    if (prods && prods.length > 0) {
      allLoadedProducts = prods.map(p => {
        const id = p.id || p.numericId || 1;
        const code = `PR-${String(id).padStart(3, '0')}`;
        const isAvailable = p.is_available !== false;
        let stock = Number(p.stock ?? (p.stock_quantity ?? 30));
        try {
          const overrides = JSON.parse(localStorage.getItem('rb_stock_overrides') || '{}');
          if (overrides[id] !== undefined) stock = Number(overrides[id]);
          else if (overrides[code] !== undefined) stock = Number(overrides[code]);
        } catch (_) { }
        let status = 'publicado';
        let statusText = 'Publicado';
        if (p.status === 'borrador' || p.status === 'draft' || isAvailable === false) {
          status = 'borrador';
          statusText = 'Borrador';
        } else if (stock <= 0) {
          status = 'agotado';
          statusText = 'Agotado';
        }

        let catName = 'Verduras & Raíces';
        if (p.category_id === 1) catName = 'Canastas Familiares';
        else if (p.category_id === 2) catName = 'Verduras & Raíces';
        else if (p.category_id === 3) catName = 'Frutas';
        else if (p.category_id === 4) catName = 'Lácteos & Huevos';
        else if (p.category_id === 5) catName = 'Despensa Artesanal';

        const unit = p.unit || 'kg';
        const unitLabel = unit.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'kg';

        const isSeasonal = Boolean(p.is_seasonal || p.isSeasonal || (p.season_label && p.season_label !== 'Disponible todo el año'));
        const seasonLabel = p.season_label || p.seasonLabel || 'Disponible todo el año';
        const isBasket = Boolean(p.is_basket || p.isBasket || p.category_id === 1);
        let basketItemsData = Array.isArray(p.basket_items) ? p.basket_items : (p.basketItems || []);
        if (isBasket && (!basketItemsData || basketItemsData.length === 0)) {
          basketItemsData = [
            { product_id: 'PR-001', name: 'Zanahorias Daule', quantity_label: '1 kg', price: 0.35, units: 1 },
            { product_id: 'PR-002', name: 'Rábanos de temporada', quantity_label: '1 manojo', price: 0.28, units: 1 },
            { product_id: 'PR-003', name: 'Tomate riñón fresco', quantity_label: '1 kg', price: 0.45, units: 1 },
            { product_id: 'PR-004', name: 'Cebolla blanca en rama', quantity_label: '1 manojo', price: 0.30, units: 1 },
            { product_id: 'PR-005', name: 'Cilantro fresco', quantity_label: '1 atado', price: 0.20, units: 1 }
          ];
        }
        const basketSavings = Number(p.basket_savings_percent || p.basketSavingsPercent || (isBasket ? 15 : 0));

        return {
          code: code,
          id: id,
          title: p.title || p.name || 'Producto del campo',
          category: catName,
          unit: unit,
          price: Number(p.price || 0.50),
          stock: stock,
          production_cost: Number(p.production_cost || 0),
          unitLabel: unitLabel,
          status: status,
          statusText: statusText,
          is_seasonal: isSeasonal,
          season_label: seasonLabel,
          is_basket: isBasket,
          basket_items: basketItemsData,
          basket_savings_percent: basketSavings,
          subtitle: p.description ? (p.description.split('·')[2]?.trim() || p.description.slice(0, 45)) : 'Cosecha fresca de la hacienda',
          image: p.image_url || p.image || `${SUPABASE_STORAGE_URL}/zanahorias.jpg`,
          description: p.description || '',
          origin: 'Hacienda San José · Daule',
          harvestDate: '06 / 11 / 2026',
          lastUpdate: 'Hoy'
        };
      });

      producerProducts = [...allLoadedProducts];
      console.log(`[Catálogo Productor] ${producerProducts.length} productos cargados para Max Productor.`);
    }
  } catch (err) {
    console.warn('Error cargando catálogo de productor desde Supabase:', err);
  }

  renderProducerProducts();
  updateKPIs();
}

function handleProducerSearch(query) {
  currentSearchQuery = (query || '').trim().toLowerCase();
  renderProducerProducts();
}

function renderProducerProducts() {
  const container = document.getElementById('producer-products-grid');
  if (!container) return;

  const filtered = producerProducts.filter(p => {
    // Filtro por tab de estado
    if (currentFilter !== 'todos' && p.status !== currentFilter) {
      return false;
    }
    // Filtro por término de búsqueda
    if (currentSearchQuery) {
      const matchTitle = (p.title || '').toLowerCase().includes(currentSearchQuery);
      const matchCode = (p.code || '').toLowerCase().includes(currentSearchQuery);
      const matchCat = (p.category || '').toLowerCase().includes(currentSearchQuery);
      const matchOrigin = (p.origin || '').toLowerCase().includes(currentSearchQuery);
      return matchTitle || matchCode || matchCat || matchOrigin;
    }
    return true;
  });

  // 1. Vista Especializada para la Pestaña "Borradores"
  if (currentFilter === 'borrador') {
    if (filtered.length === 0) {
      container.className = 'grid grid-cols-1 gap-6 mb-8';
      container.innerHTML = `
        <div class="py-14 px-6 text-center bg-[#FDFBF7] rounded-3xl border border-[#EFE8DC] shadow-2xs max-w-xl mx-auto my-4 w-full">
          <div class="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-[#F5EFE6] text-[#143628] flex items-center justify-center text-3xl shadow-2xs">
            🌾
          </div>
          <h4 class="font-serif text-lg font-bold text-stone-900 mb-1.5">No tienes borradores pendientes</h4>
          <p class="text-xs text-stone-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Todos tus productos están al día en la tienda. Cuando comiences una nueva cosecha y quieras terminarla más tarde, aparecerá aquí.
          </p>
          <button type="button" onclick="openNewProductForm()" class="inline-flex items-center gap-2 bg-[#143628] hover:bg-[#1f4a38] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer">
            <span class="text-base leading-none">+</span>
            <span>Crear nueva cosecha</span>
          </button>
        </div>
      `;
      return;
    }

    container.className = 'grid grid-cols-1 gap-4 mb-8';
    container.innerHTML = filtered.map(prod => {
      const hasPhoto = Boolean(prod.image && !prod.image.includes('placeholder') && !prod.image.includes('rabanos.jpg'));
      const hasPrice = Number(prod.price) > 0;
      const hasStock = Number(prod.stock) > 0;
      const isComplete = Boolean(prod.title && prod.title.trim() && hasPrice && hasStock);

      const completenessBadge = isComplete
        ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Listo para publicar</span>`
        : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAECE6] text-[#C85A28] border border-[#F3D9CE]">⚠ ${!hasPhoto ? 'Falta foto' : (!hasPrice ? 'Falta precio' : 'Faltan existencias')}</span>`;

      return `
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
          <div class="flex items-center gap-4 min-w-0">
            <!-- Miniatura de portada 64x64px -->
            <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-[#F5EFE6] flex items-center justify-center shadow-2xs">
              ${prod.image ? `
                <img src="${prod.image}" alt="${escapeHtml(prod.title)}" class="w-full h-full object-cover">
              ` : `
                <span class="text-2xl select-none" title="Sin foto aún">🌱</span>
              `}
            </div>

            <!-- Metadatos Claros del Borrador -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                  <span>Borrador sin publicar</span>
                </span>
                ${completenessBadge}
              </div>

              <h4 class="font-serif font-bold text-base text-stone-900 leading-snug truncate">
                ${escapeHtml(prod.title || 'Producto sin título')}
              </h4>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 mt-1">
                <span class="font-semibold text-stone-700">$${formatUSD(prod.price)} / ${escapeHtml(prod.unitLabel || 'unidad')} · USD</span>
                <span class="text-stone-300">•</span>
                <span>${escapeHtml(prod.category || 'Verduras & Raíces')}</span>
                <span class="text-stone-300">•</span>
                <span class="text-stone-400 text-[11px]">${escapeHtml(prod.lastUpdate || 'Guardado hoy')}</span>
              </div>
            </div>
          </div>

          <!-- 3 Acciones directas por borrador -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
            <!-- 1. Continuar editando -->
            <button type="button" onclick="openEditProductModal('${prod.code}')" class="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>Continuar editando</span>
            </button>

            <!-- 2. Publicar ahora -->
            <button type="button" onclick="publishProductDirectly('${prod.code}')" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#143628] hover:bg-[#1f4a38] text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer">
              <span>↗ Publicar ahora</span>
            </button>

            <!-- 3. Eliminar borrador -->
            <button type="button" onclick="openDeleteProductModal('${prod.code}', event)" class="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer" title="Eliminar borrador">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  // 2. Vista Estándar (Todos, Publicados, Agotados)
  container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-stone-200">
        <p class="text-2xl mb-2">🔍</p>
        <h4 class="text-sm font-bold text-stone-800">No se encontraron productos</h4>
        <p class="text-xs text-stone-400 mt-1">Intenta con otro término de búsqueda o selecciona otro filtro.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => {
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let badgeDot = 'bg-emerald-500';
    let badgeText = `En stock (${prod.stock})`;
    if (prod.status === 'borrador') {
      badgeClass = 'bg-[#f7f3eb] text-[#92400e] border-[#eedfc9]';
      badgeDot = 'bg-amber-500';
      badgeText = 'Borrador sin publicar';
    } else if (prod.stock <= 0) {
      badgeClass = 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]';
      badgeDot = 'bg-[#c85a32]';
      badgeText = 'Agotado (0)';
    } else if (prod.stock <= 5) {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      badgeDot = 'bg-amber-500';
      badgeText = `Stock bajo (${prod.stock})`;
    }

    const isAgotado = prod.stock <= 0;
    const isBorrador = prod.status === 'borrador';

    return `
      <div class="bg-white rounded-2xl border ${isBorrador ? 'border-amber-300' : 'border-stone-200/90'} overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <!-- Imagen y Badges Superiores -->
          <div class="relative aspect-[16/10] overflow-hidden bg-stone-100">
            <img src="${prod.image}" alt="${escapeHtml(prod.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            <div class="absolute top-3 left-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full ${badgeDot}"></span>
                <span>${badgeText}</span>
              </span>
            </div>
            <div class="absolute top-3 right-3 flex flex-col gap-1 items-end">
              ${prod.is_basket ? `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#143628] text-white shadow-xs">
                  🧺 Canasta semanal
                </span>
              ` : (prod.is_seasonal && prod.season_label !== 'Disponible todo el año') ? `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#c85a28] text-white shadow-xs">
                  🌿 ${escapeHtml(prod.season_label || 'De temporada')}
                </span>
              ` : ''}
              ${prod.is_basket && prod.basket_savings_percent > 0 ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#c85a32] text-white shadow-xs">
                  Ahorra ${prod.basket_savings_percent}%
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Contenido de la Tarjeta -->
          <div class="p-4 sm:p-5">
            <div class="text-[11px] font-medium text-stone-400 mb-1">
              ${prod.code} · ${escapeHtml(prod.origin.split('·')[0].trim())}
            </div>
            <h3 class="font-serif font-bold text-lg text-stone-900 leading-snug mb-1">
              ${escapeHtml(prod.title)}
            </h3>
            <p class="text-xs text-stone-500 mb-4 line-clamp-1">
              ${escapeHtml(prod.subtitle || '')}
            </p>

            <div class="flex items-baseline gap-1 mb-3">
              <span class="text-xl font-bold text-stone-900">$${formatUSD(prod.price)}</span>
              <span class="text-xs text-stone-400 font-medium">/ ${escapeHtml(prod.unitLabel)} · USD</span>
            </div>

            <!-- Existencias y Gestión Rápida de Stock -->
            <div class="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span class="text-stone-500 font-medium">Existencias</span>
              <div class="flex items-center gap-1">
                <button type="button" onclick="adjustProducerStock('${prod.code}', -1, event)" class="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer transition select-none" title="Disminuir 1 stock">-</button>
                <span class="font-bold min-w-[55px] text-center ${prod.stock <= 0 ? 'text-red-600' : prod.stock <= 5 ? 'text-amber-600' : 'text-stone-800'}">
                  ${prod.stock} ${escapeHtml(prod.unitLabel)}
                </span>
                <button type="button" onclick="adjustProducerStock('${prod.code}', 1, event)" class="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer transition select-none" title="Aumentar 1 stock">+</button>
                <button type="button" onclick="quickRestockProduct('${prod.code}', 15, event)" class="ml-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 cursor-pointer transition" title="Reponer 15 unidades">+15</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Inferiores -->
        <div class="p-4 sm:p-5 pt-0">
          <div class="flex items-center justify-between border-t border-stone-100 pt-3">
            <div class="flex items-center gap-1 sm:gap-1.5">
              <button type="button" onclick="openEditProductModal('${prod.code}')" class="text-xs font-bold text-[#143628] hover:text-[#255440] hover:bg-emerald-50/70 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition cursor-pointer" title="Modificar este producto">
                <svg class="w-3.5 h-3.5 text-[#143628]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span>${isBorrador ? 'Continuar editando' : 'Modificar'}</span>
              </button>

              <button type="button" onclick="openDeleteProductModal('${prod.code}', event)" class="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-2.5 py-1.5 text-xs font-medium transition flex items-center gap-1 cursor-pointer" title="Eliminar este producto">
                <svg class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span>Eliminar</span>
              </button>
            </div>

            ${isBorrador ? `
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="publishProductDirectly('${prod.code}')" class="bg-[#143628] hover:bg-[#1f4a38] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer">
                  Publicar
                </button>
              </div>
            ` : isAgotado ? `
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="quickRestockProduct('${prod.code}', 15, event)" class="border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                  Reponer stock
                </button>
              </div>
            ` : `
              <span class="text-[11px] text-stone-400 font-medium">${escapeHtml(prod.lastUpdate || 'Hoy')}</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setProductFilter(filterType) {
  if (filterType === 'borradores') filterType = 'borrador';
  if (filterType === 'publicados') filterType = 'publicado';
  if (filterType === 'agotados') filterType = 'agotado';
  currentFilter = filterType;

  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active', 'border-b-2', 'border-[#143628]', 'text-[#143628]', 'font-bold');
      btn.classList.remove('text-stone-500', 'font-medium');
    } else {
      btn.classList.remove('active', 'border-b-2', 'border-[#143628]', 'border-[#1a3d2f]', 'text-[#143628]', 'text-[#1a3d2f]', 'font-bold');
      btn.classList.add('text-stone-500', 'font-medium');
    }
  });

  renderProducerProducts();
}

function updateKPIs() {
  const total = producerProducts.length;
  const publicados = producerProducts.filter(p => p.status === 'publicado').length;
  const borradores = producerProducts.filter(p => p.status === 'borrador').length;
  const agotados = producerProducts.filter(p => p.status === 'agotado').length;

  const totalEl = document.getElementById('kpi-total');
  const pubEl = document.getElementById('kpi-publicados');
  const borEl = document.getElementById('kpi-borradores');
  const agotEl = document.getElementById('kpi-agotados');

  if (totalEl) totalEl.textContent = total;
  if (pubEl) pubEl.textContent = publicados;
  if (borEl) borEl.textContent = borradores;
  if (agotEl) agotEl.textContent = agotados;

  const countPills = document.querySelectorAll('.kpi-count-total');
  countPills.forEach(el => el.textContent = total);
  const countPubPills = document.querySelectorAll('.kpi-count-pub');
  countPubPills.forEach(el => el.textContent = publicados);
  const countBorPills = document.querySelectorAll('.kpi-count-bor');
  countBorPills.forEach(el => el.textContent = borradores);
  const countAgotPills = document.querySelectorAll('.kpi-count-agot');
  countAgotPills.forEach(el => el.textContent = agotados);
}

// =============================================================================
// NAVEGACIÓN ENTRE PESTAÑAS DEL PORTAL
// =============================================================================

function normalizeProducerTabName(tab) {
  if (!tab) return 'mis-productos';
  const clean = String(tab).toLowerCase().trim().replace(/^#/, '');
  if (['productos', 'mis-productos', 'catalogo', 'tienda'].includes(clean)) return 'mis-productos';
  if (['publicar', 'nuevo-producto', 'crear', 'nueva-cosecha', 'modificar-producto'].includes(clean)) return 'nuevo-producto';
  if (['economia', 'mi-economia', 'finanzas', 'gastos-list'].includes(clean)) return 'mi-economia';
  if (['gasto', 'registrar-gasto', 'nuevo-gasto'].includes(clean)) return 'registrar-gasto';
  if (['perfil', 'seguridad', 'perfil-seguridad', 'mi-perfil', 'cuenta'].includes(clean)) return 'perfil-seguridad';
  return clean;
}

function switchProducerTab(tabName) {
  const normalizedTab = normalizeProducerTabName(tabName);

  const views = ['mis-productos', 'nuevo-producto', 'mi-economia', 'registrar-gasto', 'perfil-seguridad'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${normalizedTab}`);
  if (activeView) activeView.classList.remove('hidden');

  // Actualizar estado visual de los botones de la barra lateral
  const navBtns = document.querySelectorAll('.nav-producer-btn');
  navBtns.forEach(btn => {
    const dataTab = btn.getAttribute('data-tab');
    const isActive = dataTab === normalizedTab || (normalizedTab === 'registrar-gasto' && dataTab === 'mi-economia');
    if (isActive) {
      btn.classList.add('active', 'bg-[#143628]', 'text-white', 'font-semibold', 'shadow-2xs');
      btn.classList.remove('text-stone-700', 'text-stone-600', 'font-medium', 'hover:bg-stone-100', 'hover:text-stone-900');
      const icon = btn.querySelector('svg, span');
      if (icon) {
        icon.classList.remove('text-stone-500', 'text-stone-600');
        icon.classList.add('text-white');
      }
    } else {
      btn.classList.remove('active', 'bg-[#143628]', 'text-white', 'font-semibold', 'shadow-2xs');
      btn.classList.add('text-stone-700', 'hover:bg-stone-100', 'hover:text-stone-900', 'font-medium');
      const icon = btn.querySelector('svg, span');
      if (icon) {
        icon.classList.remove('text-white');
        if (icon.tagName && icon.tagName.toLowerCase() === 'svg') {
          icon.classList.add('text-stone-500');
        } else {
          icon.classList.add('text-stone-600');
        }
      }
    }
  });

  // Actualizar breadcrumb y ejecutar inicializaciones contextuales
  const breadcrumbEl = document.getElementById('producer-breadcrumb');
  if (breadcrumbEl) {
    if (normalizedTab === 'mis-productos') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mis productos</span>`;
      if (producerProducts && producerProducts.length > 0) {
        renderProducerProducts();
      }
    } else if (normalizedTab === 'nuevo-producto') {
      const actionName = productFormMode === 'edit' ? `Modificar ${currentEditingCode || 'producto'}` : 'Publicar nuevo producto';
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="handleCancelNewProduct()">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">${actionName}</span>`;
    } else if (normalizedTab === 'mi-economia') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mi economía</span>`;
      renderEconomyDashboard();
    } else if (normalizedTab === 'registrar-gasto') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <button type="button" onclick="switchProducerTab('mi-economia')" class="text-stone-500 hover:text-stone-800 cursor-pointer">Mi economía</button> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">Registrar gasto</span>`;
      resetExpenseForm();
    } else if (normalizedTab === 'perfil-seguridad') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mi perfil y seguridad</span>`;
    }
  }

  // Sincronizar URL con ?tab=... y #... sin recargar la página
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', normalizedTab);
    url.hash = normalizedTab;
    window.history.replaceState({ tab: normalizedTab }, '', url.toString());
  } catch (_) {
    window.location.hash = normalizedTab;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// GESTIÓN DE FECHAS DINÁMICAS DE ENTREGA
// =============================================================================

function populateUpcomingDeliveryDates() {
  const select = document.getElementById('new-form-delivery-date');
  if (!select) return;

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const now = new Date();
  let current = new Date(now);
  current.setHours(0, 0, 0, 0);

  const options = [];
  for (let i = 1; i <= 35 && options.length < 5; i++) {
    const candidate = new Date(current);
    candidate.setDate(current.getDate() + i);
    const day = candidate.getDay();
    // Miércoles (3) y Sábado (6)
    if (day === 3 || day === 6) {
      const dayName = daysOfWeek[day];
      const dayNum = candidate.getDate();
      const monthName = months[candidate.getMonth()];
      options.push(`${dayName}, ${dayNum} de ${monthName}`);
    }
  }

  select.innerHTML = options.map((opt, idx) =>
    `<option value="${opt}" ${idx === 0 ? 'selected' : ''}>${opt}</option>`
  ).join('');
}

// =============================================================================
// SUBIDA DE FOTOS: DRAG & DROP, GALERÍA Y SUPABASE STORAGE
// =============================================================================

function setupDragAndDrop() {
  const dropzone = document.getElementById('product-dropzone');
  const fileInput = document.getElementById('product-images-input');

  if (!dropzone || !fileInput) return;

  if (dropzone.dataset.hasDropListeners) return;
  dropzone.dataset.hasDropListeners = 'true';

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      fileInput.value = ''; // permitir re-selección
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-[#1a3d2f]', 'bg-emerald-50/50', 'ring-2', 'ring-[#1a3d2f]/20');
    });
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-[#1a3d2f]', 'bg-emerald-50/50', 'ring-2', 'ring-[#1a3d2f]/20');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('border-[#1a3d2f]', 'bg-emerald-50/50', 'ring-2', 'ring-[#1a3d2f]/20');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  });
}

function handleFilesAdded(fileList) {
  const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 5 * 1024 * 1024; // 5 MB

  const availableSlots = 5 - uploadedImages.length;
  if (availableSlots <= 0) {
    showProducerToast('Ya has alcanzado el límite máximo de 5 fotografías.', true);
    return;
  }

  const filesToAdd = Array.from(fileList).slice(0, availableSlots);
  let addedCount = 0;

  for (const file of filesToAdd) {
    if (!validExtensions.includes(file.type)) {
      showProducerToast(`"${file.name}" no es válido. Solo se admiten archivos JPG, PNG o WebP.`, true);
      continue;
    }
    if (file.size > maxBytes) {
      showProducerToast(`"${file.name}" supera el límite de 5 MB por imagen.`, true);
      continue;
    }

    const localUrl = URL.createObjectURL(file);
    const isFirst = uploadedImages.length === 0;

    uploadedImages.push({
      file: file,
      url: localUrl,
      isCover: isFirst,
      isExisting: false
    });
    addedCount++;
  }

  if (addedCount > 0) {
    formDirty = true;
    renderProductImagesGallery();
    updateLivePreview();
  }
}

function renderProductImagesGallery() {
  const grid = document.getElementById('product-thumbnails-grid');
  const dropzone = document.getElementById('product-dropzone');
  const countBadge = document.getElementById('photo-count-badge');

  if (!grid || !dropzone) return;

  if (countBadge) {
    countBadge.textContent = `Puedes añadir hasta 5 fotografías · ${uploadedImages.length} de 5`;
  }

  if (uploadedImages.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    dropzone.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  grid.innerHTML = uploadedImages.map((img, idx) => {
    const isCover = idx === 0 || img.isCover;
    return `
      <div class="relative rounded-xl overflow-hidden ${isCover ? 'border-2 border-[#1a3d2f] shadow-xs' : 'border border-stone-200'} group aspect-[4/3] bg-stone-100 shadow-2xs">
        <img src="${img.url}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">
        
        ${isCover ? `
          <span class="absolute bottom-2 left-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
            ✓ Portada
          </span>
        ` : `
          <button type="button" onclick="setCoverImage(${idx})" class="absolute bottom-2 left-2 text-[10px] font-bold text-stone-700 bg-white/95 px-2 py-0.5 rounded-md border border-stone-200 shadow hover:bg-white hover:text-[#1a3d2f] transition cursor-pointer">
            Establecer como portada
          </button>
        `}

        <button type="button" onclick="removeProductImage(${idx})" class="absolute top-2 right-2 text-[10px] font-bold text-red-600 bg-white/95 px-1.5 py-0.5 rounded shadow hover:bg-white transition cursor-pointer" title="Eliminar foto">
          Eliminar foto
        </button>
      </div>
    `;
  }).join('');

  if (uploadedImages.length >= 5) {
    dropzone.classList.add('hidden');
  } else {
    dropzone.classList.remove('hidden');
  }
}

function setCoverImage(index) {
  if (index < 0 || index >= uploadedImages.length) return;
  const [picked] = uploadedImages.splice(index, 1);
  uploadedImages.unshift(picked);
  uploadedImages.forEach((img, idx) => {
    img.isCover = (idx === 0);
  });
  formDirty = true;
  renderProductImagesGallery();
  updateLivePreview();
}

function removeProductImage(index) {
  if (index < 0 || index >= uploadedImages.length) return;
  uploadedImages.splice(index, 1);
  if (uploadedImages.length > 0) {
    uploadedImages.forEach((img, idx) => {
      img.isCover = (idx === 0);
    });
  }
  formDirty = true;
  renderProductImagesGallery();
  updateLivePreview();
}

async function uploadProductImageFiles() {
  for (let i = 0; i < uploadedImages.length; i++) {
    const item = uploadedImages[i];
    if (item.file) {
      try {
        const ext = (item.file.name.split('.').pop() || 'jpg').toLowerCase();
        const rand = Math.random().toString(36).substring(2, 8);
        const fileName = `prod_${Date.now()}_${rand}.${ext}`;
        const storagePath = `products/${fileName}`;

        let uploadRes = null;
        const storageClient = window.supabase?.storage;

        if (storageClient && typeof storageClient.from === 'function') {
          // Intentar primero en bucket 'assets'
          try {
            uploadRes = await storageClient.from('assets').upload(storagePath, item.file, {
              contentType: item.file.type || 'image/jpeg',
              upsert: true
            });
            if (uploadRes && uploadRes.data) {
              const pubUrlRes = storageClient.from('assets').getPublicUrl(storagePath);
              item.url = pubUrlRes?.data?.publicUrl || `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/${storagePath}`;
            }
          } catch (assetsErr) {
            console.warn('Fallo subida en bucket assets, intentando avatars:', assetsErr);
          }

          // Fallback a bucket 'avatars' si 'assets' no respondió
          if (!item.url && storageClient) {
            try {
              const avatarPath = `products_${fileName}`;
              const avatarRes = await storageClient.from('avatars').upload(avatarPath, item.file, {
                contentType: item.file.type || 'image/jpeg',
                upsert: true
              });
              if (avatarRes && avatarRes.data) {
                const pubUrlRes = storageClient.from('avatars').getPublicUrl(avatarPath);
                item.url = pubUrlRes?.data?.publicUrl || `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/avatars/${avatarPath}`;
              }
            } catch (avatarsErr) {
              console.warn('Fallo subida en bucket avatars:', avatarsErr);
            }
          }
        }

        // Si no se obtuvo URL pública remota, usar object URL local o fallback seguro
        if (!item.url) {
          try {
            item.url = URL.createObjectURL(item.file);
          } catch (_) {
            item.url = `${SUPABASE_STORAGE_URL}/rabanos.jpg`;
          }
        }
        item.file = null;
      } catch (err) {
        console.warn('Error subiendo imagen a Supabase Storage, usando fallback:', err);
        if (!item.url) item.url = `${SUPABASE_STORAGE_URL}/rabanos.jpg`;
        item.file = null;
      }
    }
  }
}

// =============================================================================
// GESTIÓN DE TIPO DE PRODUCTO, ESTACIONALIDAD Y CANASTAS SEMANALES
// =============================================================================

function setProductType(type) {
  productType = type === 'basket' ? 'basket' : 'individual';

  const btnIndiv = document.getElementById('type-btn-individual');
  const btnBasket = document.getElementById('type-btn-basket');
  const basketPanel = document.getElementById('basket-builder-panel');
  const unitSelect = document.getElementById('new-form-unit');

  if (productType === 'individual') {
    if (btnIndiv) {
      btnIndiv.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition border-[#143628] bg-[#143628] text-white shadow-2xs cursor-pointer';
    }
    if (btnBasket) {
      btnBasket.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-stone-200 bg-stone-50 hover:bg-white text-stone-700 text-xs font-bold transition cursor-pointer';
    }
    if (basketPanel) {
      basketPanel.classList.add('hidden');
    }
  } else {
    if (btnBasket) {
      btnBasket.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition border-[#143628] bg-[#143628] text-white shadow-2xs cursor-pointer';
    }
    if (btnIndiv) {
      btnIndiv.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-stone-200 bg-stone-50 hover:bg-white text-stone-700 text-xs font-bold transition cursor-pointer';
    }
    if (basketPanel) {
      basketPanel.classList.remove('hidden');
    }
    if (unitSelect) {
      for (let i = 0; i < unitSelect.options.length; i++) {
        if (unitSelect.options[i].value.includes('Canasta')) {
          unitSelect.selectedIndex = i;
          break;
        }
      }
    }
    populateBasketProductSelect();
    calculateBasketSavings();
  }

  updateLivePreview();
}

function handleSeasonChange() {
  const seasonSelect = document.getElementById('new-form-season-label');
  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonSelect && seasonCheck) {
    if (seasonSelect.value !== 'Disponible todo el año') {
      seasonCheck.checked = true;
    }
  }
  updateLivePreview();
}

function handleSeasonCheckboxChange() {
  const seasonSelect = document.getElementById('new-form-season-label');
  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonSelect && seasonCheck) {
    if (seasonCheck.checked && seasonSelect.value === 'Disponible todo el año') {
      seasonSelect.value = 'Cosecha de temporada';
    }
  }
  updateLivePreview();
}

function populateBasketProductSelect() {
  const select = document.getElementById('basket-item-product-select');
  if (!select) return;

  const sourceProducts = (producerProducts && producerProducts.length > 0)
    ? producerProducts
    : (allLoadedProducts && allLoadedProducts.length > 0 ? allLoadedProducts : []);

  const filtered = sourceProducts.filter(p => !p.is_basket && String(p.code) !== String(currentEditingCode));

  if (filtered.length === 0) {
    select.innerHTML = '<option value="">No hay productos individuales disponibles</option>';
    return;
  }

  select.innerHTML = filtered.map(p => {
    const unitLabel = p.unitLabel || p.unit || 'unidad';
    const priceVal = formatUSD(p.price);
    return `<option value="${p.id || p.numericId}" data-name="${p.title}" data-price="${p.price}" data-unit="${unitLabel}">${p.title} · $${priceVal} / ${unitLabel}</option>`;
  }).join('');

  updateBasketPortionDefault();
}

function updateBasketPortionDefault() {
  const select = document.getElementById('basket-item-product-select');
  const portionInput = document.getElementById('basket-item-portion');
  if (!select || !portionInput) return;

  const opt = select.options[select.selectedIndex];
  if (opt && opt.dataset && opt.dataset.unit) {
    portionInput.placeholder = `Ej. 1 ${opt.dataset.unit}`;
  }
}

function addBasketItemFromForm() {
  const select = document.getElementById('basket-item-product-select');
  const portionInput = document.getElementById('basket-item-portion');
  if (!select || select.selectedIndex < 0) return;

  const opt = select.options[select.selectedIndex];
  if (!opt || !opt.value) {
    showProducerToast('Selecciona un producto para agregarlo a la canasta.', true);
    return;
  }

  const prodId = opt.value;
  const prodName = opt.dataset.name || opt.text.split('·')[0].trim();
  const prodPrice = parseFloat(opt.dataset.price) || 0;
  const unitLabel = opt.dataset.unit || 'un';
  const portionVal = portionInput && portionInput.value.trim() ? portionInput.value.trim() : `1 ${unitLabel}`;

  basketItems.push({
    product_id: prodId,
    name: prodName,
    quantity_label: portionVal,
    price: prodPrice,
    units: 1
  });

  if (portionInput) portionInput.value = '';

  renderBasketItemsList();
  calculateBasketSavings();
  updateLivePreview();
  formDirty = true;
  showProducerToast(`✓ ${prodName} agregado a la canasta.`);
}

function removeBasketItem(idx) {
  if (idx >= 0 && idx < basketItems.length) {
    const removed = basketItems.splice(idx, 1);
    renderBasketItemsList();
    calculateBasketSavings();
    updateLivePreview();
    formDirty = true;
    if (removed && removed[0]) {
      showProducerToast(`Item ${removed[0].name} removido de la canasta.`);
    }
  }
}

function renderBasketItemsList() {
  const listEl = document.getElementById('basket-items-list');
  const countBadge = document.getElementById('basket-items-count-badge');
  if (!listEl) return;

  if (countBadge) {
    countBadge.textContent = `${basketItems.length} alimento${basketItems.length === 1 ? '' : 's'}`;
  }

  if (basketItems.length === 0) {
    listEl.innerHTML = `
      <div id="basket-items-empty" class="text-center py-5 bg-white/70 rounded-xl border border-dashed border-emerald-200 text-stone-400 text-xs">
        Aún no has agregado productos a esta canasta. Selecciona arriba para comenzar.
      </div>
    `;
    return;
  }

  listEl.innerHTML = basketItems.map((item, index) => {
    return `
      <div class="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-200 text-xs shadow-2xs hover:border-emerald-300 transition">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">🌱</span>
          <div class="truncate">
            <span class="font-bold text-stone-800">${item.name}</span>
            <span class="text-stone-400 text-[11px] ml-1.5 font-medium">(${item.quantity_label || '1 un'})</span>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-2">
          <span class="font-semibold text-stone-700 text-xs">$${formatUSD(item.price)}</span>
          <button type="button" onclick="removeBasketItem(${index})" class="text-red-500 hover:text-red-700 font-bold text-xs p-1 rounded-md hover:bg-red-50 transition cursor-pointer" title="Eliminar de la canasta">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function calculateBasketSavings() {
  const sumIndivEl = document.getElementById('basket-individual-sum');
  const sellingPriceEl = document.getElementById('basket-selling-price');
  const savingsBadge = document.getElementById('basket-savings-badge');
  const priceInput = document.getElementById('new-form-price');

  const totalIndividual = basketItems.reduce((acc, it) => acc + (parseFloat(it.price) || 0), 0);
  if (sumIndivEl) sumIndivEl.textContent = `$${formatUSD(totalIndividual)}`;

  const rawSellingPrice = (priceInput ? priceInput.value : '').replace(/[^0-9.]/g, '');
  const sellingPrice = parseFloat(rawSellingPrice) || 0;
  if (sellingPriceEl) sellingPriceEl.textContent = `$${formatUSD(sellingPrice)}`;

  if (totalIndividual > 0 && sellingPrice > 0 && sellingPrice < totalIndividual) {
    const savings = Math.round(((totalIndividual - sellingPrice) / totalIndividual) * 100);
    basketSavingsPercent = savings;
    if (savingsBadge) {
      savingsBadge.textContent = `Ahorra ${savings}%`;
      savingsBadge.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#c85a32] text-white shadow-2xs';
    }
  } else {
    basketSavingsPercent = 0;
    if (savingsBadge) {
      savingsBadge.textContent = 'Sin descuento adicional';
      savingsBadge.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200';
    }
  }
}

async function adjustProducerStock(code, delta, event) {
  if (event) event.stopPropagation();

  const prod = producerProducts.find(p => p.code === code || String(p.id) === String(code) || String(p.numericId) === String(code));
  if (!prod) return;

  const currentStock = parseInt(prod.stock, 10) || 0;
  const newStock = Math.max(0, currentStock + delta);
  prod.stock = newStock;

  if (newStock === 0) {
    prod.status = 'agotado';
    prod.statusText = 'Agotado';
  } else if (prod.status === 'agotado') {
    prod.status = 'publicado';
    prod.statusText = 'Publicado';
  }

  renderProducerProducts();

  try {
    if (window.supabase && typeof window.supabase.from === 'function') {
      const targetId = prod.numericId || prod.id;
      if (targetId) {
        await window.supabase.from('products').update({ stock: newStock }).eq('id', targetId);
      }
    }
  } catch (err) {
    console.warn('Error actualizando stock en Supabase:', err);
  }

  showProducerToast(`✓ Stock de ${prod.title} ajustado a ${newStock} ${prod.unitLabel || 'unidades'}.`);
}

async function quickRestockProduct(code, amount = 15, event) {
  await adjustProducerStock(code, amount, event);
}

// =============================================================================
// PREVISUALIZACIÓN EN VIVO ("Así lo verá tu barrio")
// =============================================================================

function updateLivePreview() {
  const prevImg = document.getElementById('new-preview-img');
  const prevPlaceholder = document.getElementById('new-preview-placeholder');
  const prevTitle = document.getElementById('new-preview-title');
  const prevOrigin = document.getElementById('new-preview-origin');
  const prevPrice = document.getElementById('new-preview-price');
  const agroBadge = document.getElementById('new-preview-agro-badge');

  // 1. Imagen de Portada
  if (uploadedImages.length > 0) {
    const coverItem = uploadedImages.find(img => img.isCover) || uploadedImages[0];
    if (prevImg) {
      prevImg.src = coverItem.url;
      prevImg.classList.remove('hidden');
    }
    if (prevPlaceholder) prevPlaceholder.classList.add('hidden');
  } else {
    if (prevImg) {
      prevImg.src = '';
      prevImg.classList.add('hidden');
    }
    if (prevPlaceholder) prevPlaceholder.classList.remove('hidden');
  }

  // 2. Distintivo Agroecológico
  const agroCheck = document.getElementById('new-agroeco');
  if (agroBadge) {
    if (agroCheck && agroCheck.checked) {
      agroBadge.classList.remove('hidden');
    } else {
      agroBadge.classList.add('hidden');
    }
  }

  // 3. Título del Producto
  const nameInput = document.getElementById('new-form-name');
  const nameVal = (nameInput ? nameInput.value : '').trim();
  if (prevTitle) {
    prevTitle.textContent = nameVal || (productFormMode === 'edit' ? (currentEditingTitle || 'Nombre del producto') : 'Nombre del producto');
  }

  // 4. Origen / Finca
  const originInput = document.getElementById('new-form-origin');
  const originVal = (originInput ? originInput.value : '').trim();
  if (prevOrigin) {
    prevOrigin.textContent = originVal || 'Hacienda San José · Daule';
  }

  // 5. Precio en USD y Unidad
  const priceInput = document.getElementById('new-form-price');
  const rawPrice = (priceInput ? priceInput.value : '').replace(/[^0-9.]/g, '');
  const priceNum = parseFloat(rawPrice) || 0;

  const unitSelect = document.getElementById('new-form-unit');
  const unitText = unitSelect ? (unitSelect.options[unitSelect.selectedIndex]?.text.split('·')[0].trim().toLowerCase() || 'kg') : 'manojo';

  if (prevPrice) {
    prevPrice.textContent = `$${formatUSD(priceNum)} / ${unitText}`;
  }

  // 6. Badges de Canasta y Estacionalidad en Preview
  const basketBadge = document.getElementById('new-preview-basket-badge');
  const seasonBadge = document.getElementById('new-preview-season-badge');
  const savingsBadge = document.getElementById('new-preview-savings-badge');
  const basketBreakdown = document.getElementById('new-preview-basket-breakdown');
  const basketBreakdownText = document.getElementById('new-preview-basket-items-text');

  const seasonSelect = document.getElementById('new-form-season-label');
  const seasonCheck = document.getElementById('new-form-is-seasonal');
  const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
  const seasonLabel = seasonSelect ? seasonSelect.value : 'Cosecha de temporada';

  if (basketBadge) {
    if (productType === 'basket') basketBadge.classList.remove('hidden');
    else basketBadge.classList.add('hidden');
  }

  if (seasonBadge) {
    if (isSeasonal) {
      seasonBadge.textContent = `🌿 ${seasonLabel}`;
      seasonBadge.classList.remove('hidden');
    } else {
      seasonBadge.classList.add('hidden');
    }
  }

  if (savingsBadge) {
    if (productType === 'basket' && basketSavingsPercent > 0) {
      savingsBadge.textContent = `Ahorra ${basketSavingsPercent}%`;
      savingsBadge.classList.remove('hidden');
    } else {
      savingsBadge.classList.add('hidden');
    }
  }

  if (basketBreakdown && basketBreakdownText) {
    if (productType === 'basket' && basketItems.length > 0) {
      basketBreakdown.classList.remove('hidden');
      basketBreakdownText.textContent = basketItems.map(it => `${it.quantity_label || '1 un'} de ${it.name}`).join(', ');
    } else {
      basketBreakdown.classList.add('hidden');
    }
  }
}

function setupPreviewListeners() {
  const nameInput = document.getElementById('new-form-name');
  const priceInput = document.getElementById('new-form-price');
  const stockInput = document.getElementById('new-form-stock');
  const descInput = document.getElementById('new-form-desc');
  const unitSelect = document.getElementById('new-form-unit');
  const catSelect = document.getElementById('new-form-category');
  const originInput = document.getElementById('new-form-origin');
  const agroCheck = document.getElementById('new-agroeco');
  const statusSelect = document.getElementById('new-form-status');

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      formDirty = true;
      updateLivePreview();
    });
  }

  if (priceInput) {
    priceInput.addEventListener('input', () => {
      formDirty = true;
      updateLivePreview();
    });
    priceInput.addEventListener('blur', (e) => {
      const val = e.target.value.replace(/[^0-9.]/g, '');
      if (val && !isNaN(val)) {
        e.target.value = `$ ${formatUSD(val)}`;
      }
      updateLivePreview();
    });
  }

  if (stockInput) {
    stockInput.addEventListener('input', () => {
      formDirty = true;
    });
  }

  if (descInput) {
    descInput.addEventListener('input', () => {
      formDirty = true;
    });
  }

  if (unitSelect) {
    unitSelect.addEventListener('change', () => {
      formDirty = true;
      updateLivePreview();
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      formDirty = true;
    });
  }

  if (originInput) {
    originInput.addEventListener('input', () => {
      formDirty = true;
      updateLivePreview();
    });
  }

  if (agroCheck) {
    agroCheck.addEventListener('change', () => {
      formDirty = true;
      updateLivePreview();
    });
  }

  const seasonSelect = document.getElementById('new-form-season-label');
  if (seasonSelect) {
    seasonSelect.addEventListener('change', () => {
      formDirty = true;
      handleSeasonChange();
    });
  }

  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonCheck) {
    seasonCheck.addEventListener('change', () => {
      formDirty = true;
      handleSeasonCheckboxChange();
    });
  }

  const basketSelect = document.getElementById('basket-item-product-select');
  if (basketSelect) {
    basketSelect.addEventListener('change', () => {
      updateBasketPortionDefault();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      formDirty = true;
      const statusPill = document.getElementById('new-status-pill');
      if (statusPill) {
        if (statusSelect.value === 'published') {
          statusPill.textContent = '• Publicar en la tienda';
          statusPill.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
        } else {
          statusPill.textContent = '• Guardar como borrador';
          statusPill.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f7f3eb] text-[#92400e] border border-[#eedfc9]';
        }
      }
    });
  }
}

// =============================================================================
// RESET, EDICIÓN Y CANCELACIÓN
// =============================================================================

function resetNewProductForm() {
  productFormMode = 'new';
  editingProductId = null;
  currentEditingCode = '';
  currentEditingTitle = '';

  const tagEl = document.getElementById('form-product-tag');
  if (tagEl) tagEl.textContent = 'PUBLICAR NUEVO PRODUCTO';

  const headingEl = document.getElementById('form-product-heading');
  if (headingEl) headingEl.textContent = 'Comparte una nueva cosecha';

  const subEl = document.getElementById('form-product-subtitle');
  if (subEl) subEl.innerHTML = 'De <span class="producer-farm-display">Hacienda San José · Daule</span> al barrio. Completa la información de tu nuevo producto.';

  const publishLabel = document.getElementById('btn-publish-label');
  if (publishLabel) publishLabel.textContent = 'Publicar producto';
  const publishIcon = document.getElementById('btn-publish-icon');
  if (publishIcon) publishIcon.textContent = '↗';

  const statusPill = document.getElementById('new-status-pill');
  if (statusPill) {
    statusPill.textContent = '• Sin publicar';
    statusPill.className = 'text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full';
  }

  const nameInput = document.getElementById('new-form-name');
  if (nameInput) nameInput.value = '';

  const descInput = document.getElementById('new-form-desc');
  if (descInput) descInput.value = '';

  const catSelect = document.getElementById('new-form-category');
  if (catSelect) catSelect.value = '2';

  const unitSelect = document.getElementById('new-form-unit');
  if (unitSelect) unitSelect.selectedIndex = 0;

  const priceInput = document.getElementById('new-form-price');
  if (priceInput) priceInput.value = '';

  const stockInput = document.getElementById('new-form-stock');
  if (stockInput) stockInput.value = '';

  const originInput = document.getElementById('new-form-origin');
  if (originInput) originInput.value = 'Hacienda San José · Daule';

  const dateInput = document.getElementById('new-form-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const agroCheck = document.getElementById('new-agroeco');
  if (agroCheck) agroCheck.checked = true;

  const seasonSelect = document.getElementById('new-form-season-label');
  if (seasonSelect) seasonSelect.value = 'Disponible todo el año';

  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonCheck) seasonCheck.checked = false;

  const statusSelect = document.getElementById('new-form-status');
  if (statusSelect) statusSelect.value = 'published';

  // Reiniciar recomendador de precios
  const costInput = document.getElementById('new-form-production-cost');
  if (costInput) costInput.value = '';
  const marginInput = document.getElementById('new-form-margin-percent');
  if (marginInput) marginInput.value = '35';
  const logisticsInput = document.getElementById('new-form-delivery-logistics');
  if (logisticsInput) logisticsInput.value = '1.50';
  if (typeof setAdvisorMargin === 'function') {
    setAdvisorMargin(35);
  } else if (typeof recalculatePricingAdvisor === 'function') {
    recalculatePricingAdvisor();
  }

  setProductType('individual');
  basketItems = [];
  basketSavingsPercent = 0;
  renderBasketItemsList();
  calculateBasketSavings();

  uploadedImages = [];
  renderProductImagesGallery();
  updateLivePreview();
  populateUpcomingDeliveryDates();
  formDirty = false;
}

function openNewProductForm() {
  resetNewProductForm();
  switchProducerTab('nuevo-producto');
}

async function loadProductForEditing(codeOrId) {
  if (producerProducts.length === 0) {
    await loadProducerProductsFromSupabase();
  }

  const prod = producerProducts.find(p =>
    p.code === codeOrId ||
    String(p.id) === String(codeOrId) ||
    String(p.numericId) === String(codeOrId)
  );

  if (!prod) {
    showProducerToast('No se encontró el producto a modificar.', true);
    return;
  }

  productFormMode = 'edit';
  editingProductId = prod.id || prod.numericId;
  currentEditingCode = prod.code || `PR-${prod.id}`;
  currentEditingTitle = prod.title;

  const tagEl = document.getElementById('form-product-tag');
  if (tagEl) tagEl.textContent = `EDITAR PRODUCTO · ${currentEditingCode}`;

  const headingEl = document.getElementById('form-product-heading');
  if (headingEl) headingEl.textContent = `Modificar ${prod.title}`;

  const subEl = document.getElementById('form-product-subtitle');
  if (subEl) {
    subEl.innerHTML = `${prod.statusText || 'Publicado'} · <span class="producer-farm-display">${prod.origin || 'Hacienda San José'}</span> · Última actualización: ${prod.lastUpdate || 'Hoy'}`;
  }

  const publishLabel = document.getElementById('btn-publish-label');
  if (publishLabel) publishLabel.textContent = 'Guardar cambios';
  const publishIcon = document.getElementById('btn-publish-icon');
  if (publishIcon) publishIcon.textContent = '✓';

  const nameInput = document.getElementById('new-form-name');
  if (nameInput) nameInput.value = prod.title || '';

  const descInput = document.getElementById('new-form-desc');
  if (descInput) descInput.value = prod.description || '';

  const priceInput = document.getElementById('new-form-price');
  if (priceInput) priceInput.value = `$ ${formatUSD(prod.price)}`;

  const stockInput = document.getElementById('new-form-stock');
  if (stockInput) stockInput.value = prod.stock || 0;

  // Restaurar costo de producción y recalcular recomendador
  const costInput = document.getElementById('new-form-production-cost');
  if (costInput) {
    costInput.value = (prod.production_cost && prod.production_cost > 0) ? prod.production_cost : '';
  }
  if (typeof recalculatePricingAdvisor === 'function') {
    recalculatePricingAdvisor();
  }

  const originInput = document.getElementById('new-form-origin');
  if (originInput) originInput.value = prod.origin || 'Hacienda San José · Daule';

  const dateInput = document.getElementById('new-form-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const agroCheck = document.getElementById('new-agroeco');
  if (agroCheck) agroCheck.checked = true;

  // Restaurar tipo y canasta
  if (prod.is_basket) {
    setProductType('basket');
    basketItems = Array.isArray(prod.basket_items) ? JSON.parse(JSON.stringify(prod.basket_items)) : [];
    basketSavingsPercent = Number(prod.basket_savings_percent || 0);
  } else {
    setProductType('individual');
    basketItems = [];
    basketSavingsPercent = 0;
  }
  renderBasketItemsList();
  calculateBasketSavings();

  // Restaurar estacionalidad
  const seasonSelect = document.getElementById('new-form-season-label');
  if (seasonSelect) seasonSelect.value = prod.season_label || 'Disponible todo el año';
  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonCheck) seasonCheck.checked = Boolean(prod.is_seasonal || (prod.season_label && prod.season_label !== 'Disponible todo el año'));

  const catSelect = document.getElementById('new-form-category');
  if (catSelect) {
    const prodCatLower = (prod.category || '').toLowerCase();
    for (let opt of catSelect.options) {
      if (opt.text.toLowerCase().includes(prodCatLower) || prodCatLower.includes(opt.text.toLowerCase())) {
        catSelect.value = opt.value;
        break;
      }
    }
  }

  const unitSelect = document.getElementById('new-form-unit');
  if (unitSelect) {
    const unitLower = (prod.unit || prod.unitLabel || '').toLowerCase();
    for (let opt of unitSelect.options) {
      if (opt.value.toLowerCase().includes(unitLower) || opt.text.toLowerCase().includes(unitLower)) {
        unitSelect.value = opt.value;
        break;
      }
    }
  }

  const statusSelect = document.getElementById('new-form-status');
  if (statusSelect) {
    statusSelect.value = prod.status === 'borrador' ? 'draft' : 'published';
  }

  const statusPill = document.getElementById('new-status-pill');
  if (statusPill) {
    statusPill.textContent = `• ${prod.statusText || (prod.status === 'borrador' ? 'Borrador' : 'Publicado')}`;
    if (prod.status === 'publicado') {
      statusPill.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (prod.status === 'borrador') {
      statusPill.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#f7f3eb] text-[#92400e] border border-[#eedfc9]';
    } else {
      statusPill.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#faece6] text-[#c85a32] border border-[#f3d9ce]';
    }
  }

  const existingImage = prod.image || prod.image_url;
  if (existingImage) {
    uploadedImages = [{
      file: null,
      url: existingImage,
      isCover: true,
      isExisting: true
    }];
  } else {
    uploadedImages = [];
  }

  renderProductImagesGallery();
  updateLivePreview();
  populateUpcomingDeliveryDates();
  switchProducerTab('nuevo-producto');
  formDirty = false;
}

function editProductFromCard(code) {
  openEditProductModal(code);
}

function handleCancelNewProduct() {
  if (formDirty) {
    const confirmLeave = confirm('¿Deseas descartar los cambios sin guardar y volver a mis productos?');
    if (!confirmLeave) return;
  }
  formDirty = false;
  switchProducerTab('mis-productos');
}

// =============================================================================
// PUBLICACIÓN Y GUARDADO (Supabase Database + Storage)
// =============================================================================

function getActiveProducerId() {
  try {
    if (typeof getCurrentUser === 'function') {
      const u = getCurrentUser();
      if (u && u.id) return u.id;
    }
    if (typeof window.getCurrentUser === 'function') {
      const u = window.getCurrentUser();
      if (u && u.id) return u.id;
    }
  } catch (_) { }
  return PRODUCER_USER_ID;
}

async function publishNewProduct() {
  const nameInput = document.getElementById('new-form-name');
  const priceInput = document.getElementById('new-form-price');
  const stockInput = document.getElementById('new-form-stock');
  const descInput = document.getElementById('new-form-desc');
  const unitSelect = document.getElementById('new-form-unit');
  const catSelect = document.getElementById('new-form-category');
  const originInput = document.getElementById('new-form-origin');
  const statusSelect = document.getElementById('new-form-status');
  const publishBtn = document.getElementById('btn-publish-product');
  const publishLabel = document.getElementById('btn-publish-label');
  const publishIcon = document.getElementById('btn-publish-icon');

  const title = (nameInput ? nameInput.value : '').trim();
  if (!title) {
    showProducerToast('Por favor escribe el nombre del producto.', true);
    if (nameInput) nameInput.focus();
    return;
  }

  const rawPrice = (priceInput ? priceInput.value : '').replace(/[^0-9.]/g, '');
  const priceNum = parseFloat(rawPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    showProducerToast('Por favor ingresa un precio de venta válido en dólares (USD).', true);
    if (priceInput) priceInput.focus();
    return;
  }

  const rawStock = (stockInput ? stockInput.value : '').replace(/[^0-9]/g, '');
  const stockNum = parseInt(rawStock, 10);
  if (isNaN(stockNum) || stockNum < 0) {
    showProducerToast('Por favor ingresa las existencias numéricas disponibles.', true);
    if (stockInput) stockInput.focus();
    return;
  }

  if (uploadedImages.length === 0) {
    showProducerToast('Por favor añade al menos 1 fotografía de la cosecha.', true);
    return;
  }

  if (publishBtn) publishBtn.disabled = true;
  if (publishLabel) publishLabel.innerHTML = 'Subiendo imágenes y publicando...';
  if (publishIcon) publishIcon.innerHTML = '⏳';

  try {
    // 1. Subir archivos nuevos a Supabase Storage (con degradación elegante)
    if (uploadedImages.length > 0) {
      await uploadProductImageFiles();
    }

    // 2. URL de portada
    const coverImg = uploadedImages.find(img => img.isCover) || uploadedImages[0];
    const coverUrl = coverImg ? coverImg.url : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';

    // 3. Preparar campos
    const desc = (descInput ? descInput.value : '').trim() || 'Cosecha fresca agroecológica de la hacienda.';
    const unit = unitSelect ? unitSelect.value : 'Kilogramo (kg)';
    const categoryId = catSelect ? parseInt(catSelect.value, 10) : 2;
    const origin = (originInput ? originInput.value : '').trim() || 'Hacienda San José · Daule';
    const isSavePublished = !statusSelect || statusSelect.value === 'published';
    const unitLabel = unit.split('·')[0].trim().toLowerCase() || 'kg';
    const activeProducerId = getActiveProducerId();
    const costInput = document.getElementById('new-form-production-cost');
    const costNum = costInput ? (parseFloat(costInput.value) || 0) : 0;

    if (productFormMode === 'new') {
      const newCode = `PR-${String(producerProducts.length + 1).padStart(3, '0')}`;
      const seasonSelect = document.getElementById('new-form-season-label');
      const seasonCheck = document.getElementById('new-form-is-seasonal');
      const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
      const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
      const isBasket = productType === 'basket';

      const payload = {
        producer_id: activeProducerId,
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        production_cost: costNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: isSavePublished,
        status: isSavePublished ? 'published' : 'draft',
        image_url: coverUrl,
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? basketItems : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0
      };

      let createdRow = null;
      if (window.supabase && typeof window.supabase.createProduct === 'function') {
        const resp = await window.supabase.createProduct(payload);
        createdRow = Array.isArray(resp) ? resp[0] : resp;
      }

      const newId = (createdRow && createdRow.id) ? createdRow.id : (Date.now() % 100000 + 100);

      const localProduct = {
        id: newId,
        numericId: newId,
        code: newCode,
        title: title,
        category: catSelect ? catSelect.options[catSelect.selectedIndex].text : (isBasket ? 'Canastas Familiares' : 'Verduras & Raíces'),
        unit: unit,
        price: priceNum,
        production_cost: costNum,
        stock: stockNum,
        unitLabel: unitLabel,
        status: isSavePublished ? (stockNum > 0 ? 'publicado' : 'agotado') : 'borrador',
        statusText: isSavePublished ? (stockNum > 0 ? 'Publicado' : 'Agotado') : 'Borrador',
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? [...basketItems] : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0,
        subtitle: desc.slice(0, 45),
        image: coverUrl,
        description: desc,
        origin: origin,
        harvestDate: 'Hoy',
        lastUpdate: 'Hoy · recién creado'
      };

      producerProducts.unshift(localProduct);
      showProducerToast(`¡Cosecha "${title}" publicada con éxito en la tienda!`);
    } else {
      const prod = producerProducts.find(p => (p.id == editingProductId || p.code === currentEditingCode || p.numericId == editingProductId));
      const seasonSelect = document.getElementById('new-form-season-label');
      const seasonCheck = document.getElementById('new-form-is-seasonal');
      const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
      const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
      const isBasket = productType === 'basket';

      const payload = {
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        production_cost: costNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: isSavePublished,
        status: isSavePublished ? 'published' : 'draft',
        image_url: coverUrl,
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? basketItems : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0
      };

      if (window.supabase && typeof window.supabase.updateProduct === 'function' && editingProductId) {
        await window.supabase.updateProduct(editingProductId, payload);
      }

      if (prod) {
        prod.title = title;
        prod.description = desc;
        prod.price = priceNum;
        prod.production_cost = costNum;
        prod.unit = unit;
        prod.unitLabel = unitLabel;
        prod.stock = stockNum;
        prod.origin = origin;
        prod.image = coverUrl;
        prod.category = catSelect ? catSelect.options[catSelect.selectedIndex].text : prod.category;
        prod.status = isSavePublished ? (stockNum > 0 ? 'publicado' : 'agotado') : 'borrador';
        prod.statusText = isSavePublished ? (stockNum > 0 ? 'Publicado' : 'Agotado') : 'Borrador';
        prod.is_seasonal = isSeasonal;
        prod.season_label = seasonLabel;
        prod.is_basket = isBasket;
        prod.basket_items = isBasket ? [...basketItems] : [];
        prod.basket_savings_percent = isBasket ? basketSavingsPercent : 0;
        prod.lastUpdate = 'Hoy · recién guardado';
      }

      showProducerToast(`¡Los cambios de "${title}" se han guardado con éxito!`);
    }

    formDirty = false;
    renderProducerProducts();
    updateKPIs();
    switchProducerTab('mis-productos');
  } catch (err) {
    console.error('Error publicando producto en Supabase:', err);
    showProducerToast('Ocurrió un error al guardar en Supabase: ' + (err.message || 'Inténtalo de nuevo.'), true);
  } finally {
    if (publishBtn) publishBtn.disabled = false;
    if (publishLabel) publishLabel.innerHTML = productFormMode === 'edit' ? 'Guardar cambios' : 'Publicar producto';
    if (publishIcon) publishIcon.innerHTML = productFormMode === 'edit' ? '✓' : '↗';
  }
}

async function saveProductDraft() {
  const nameInput = document.getElementById('new-form-name');
  const priceInput = document.getElementById('new-form-price');
  const stockInput = document.getElementById('new-form-stock');
  const descInput = document.getElementById('new-form-desc');
  const unitSelect = document.getElementById('new-form-unit');
  const catSelect = document.getElementById('new-form-category');
  const originInput = document.getElementById('new-form-origin');
  const draftBtn = document.getElementById('btn-save-draft');

  const title = (nameInput ? nameInput.value : '').trim() || 'Nuevo borrador de cosecha';
  const rawPrice = (priceInput ? priceInput.value : '').replace(/[^0-9.]/g, '');
  const priceNum = parseFloat(rawPrice) || 0.00;
  const rawStock = (stockInput ? stockInput.value : '').replace(/[^0-9]/g, '');
  const stockNum = parseInt(rawStock, 10) || 0;
  const desc = (descInput ? descInput.value : '').trim() || 'Borrador en preparación.';
  const unit = unitSelect ? unitSelect.value : 'Kilogramo (kg)';
  const categoryId = catSelect ? parseInt(catSelect.value, 10) : 2;
  const origin = (originInput ? originInput.value : '').trim() || 'Hacienda San José · Daule';

  if (draftBtn) draftBtn.disabled = true;

  try {
    if (uploadedImages.length > 0) {
      try {
        await uploadProductImageFiles();
      } catch (uploadErr) {
        console.warn('Advertencia subiendo imágenes en borrador:', uploadErr);
      }
    }
    const coverImg = uploadedImages.find(img => img.isCover) || uploadedImages[0];
    const coverUrl = coverImg ? coverImg.url : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';
    const unitLabel = unit.split('·')[0].trim().toLowerCase() || 'kg';

    const seasonSelect = document.getElementById('new-form-season-label');
    const seasonCheck = document.getElementById('new-form-is-seasonal');
    const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
    const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
    const isBasket = productType === 'basket';
    const activeProducerId = getActiveProducerId();
    const costInput = document.getElementById('new-form-production-cost');
    const costNum = costInput ? (parseFloat(costInput.value) || 0) : 0;

    if (productFormMode === 'new') {
      const newCode = `PR-${String(producerProducts.length + 1).padStart(3, '0')}`;
      const payload = {
        producer_id: activeProducerId,
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        production_cost: costNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: false,
        status: 'draft',
        image_url: coverUrl,
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? basketItems : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0
      };

      let createdRow = null;
      if (window.supabase && typeof window.supabase.createProduct === 'function') {
        const resp = await window.supabase.createProduct(payload);
        createdRow = Array.isArray(resp) ? resp[0] : resp;
      }

      const newId = (createdRow && createdRow.id) ? createdRow.id : (Date.now() % 100000 + 100);

      const localProduct = {
        id: newId,
        numericId: newId,
        code: newCode,
        title: title,
        category: catSelect ? catSelect.options[catSelect.selectedIndex].text : (isBasket ? 'Canastas Familiares' : 'Verduras & Raíces'),
        unit: unit,
        price: priceNum,
        production_cost: costNum,
        stock: stockNum,
        unitLabel: unitLabel,
        status: 'borrador',
        statusText: 'Borrador',
        is_available: false,
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? [...basketItems] : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0,
        subtitle: 'Guardado como borrador',
        image: coverUrl,
        description: desc,
        origin: origin,
        harvestDate: 'Hoy',
        lastUpdate: 'Hoy · borrador'
      };

      producerProducts.unshift(localProduct);
      showProducerToast(`"${title}" se ha guardado como borrador.`);
    } else {
      const prod = producerProducts.find(p => (p.id == editingProductId || p.code === currentEditingCode || p.numericId == editingProductId));
      const payload = {
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        production_cost: costNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: false,
        status: 'draft',
        image_url: coverUrl,
        is_seasonal: isSeasonal,
        season_label: seasonLabel,
        is_basket: isBasket,
        basket_items: isBasket ? basketItems : [],
        basket_savings_percent: isBasket ? basketSavingsPercent : 0
      };

      if (window.supabase && typeof window.supabase.updateProduct === 'function' && editingProductId) {
        await window.supabase.updateProduct(editingProductId, payload);
      }

      if (prod) {
        prod.title = title;
        prod.description = desc;
        prod.price = priceNum;
        prod.production_cost = costNum;
        prod.unit = unit;
        prod.stock = stockNum;
        prod.origin = origin;
        prod.image = coverUrl;
        prod.status = 'borrador';
        prod.statusText = 'Borrador';
        prod.is_available = false;
        prod.is_seasonal = isSeasonal;
        prod.season_label = seasonLabel;
        prod.is_basket = isBasket;
        prod.basket_items = isBasket ? [...basketItems] : [];
        prod.basket_savings_percent = isBasket ? basketSavingsPercent : 0;
        prod.lastUpdate = 'Hoy · recién guardado';
      }

      showProducerToast(`"${title}" guardado en borradores.`);
    }

    formDirty = false;
    renderProducerProducts();
    updateKPIs();
    switchProducerTab('mis-productos');
    setProductFilter('borradores');
  } catch (err) {
    console.error('Error guardando borrador:', err);
    showProducerToast('Error guardando borrador: ' + (err.message || 'Error al conectar con Supabase'), true);
  } finally {
    if (draftBtn) draftBtn.disabled = false;
  }
}

async function publishProductDirectly(code) {
  const prod = producerProducts.find(p => p.code === code || p.id == code);
  if (!prod) return;

  if (!prod.title || prod.title === 'Nuevo borrador de cosecha') {
    showProducerToast('Completa el nombre del producto antes de publicarlo.', true);
    loadProductForEditing(code);
    return;
  }
  if (!prod.price || prod.price <= 0) {
    showProducerToast('Define un precio válido antes de publicar el producto.', true);
    loadProductForEditing(code);
    return;
  }

  prod.status = 'publicado';
  prod.statusText = 'Publicado';
  prod.is_available = true;
  prod.lastUpdate = 'Hoy · recién publicado';

  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, { is_available: true, status: 'published' });
    } catch (err) {
      console.warn('Error al actualizar disponibilidad en Supabase:', err);
    }
  }

  showProducerToast(`¡"${prod.title}" publicado con éxito en la tienda!`);
  renderProducerProducts();
  updateKPIs();
}

// =============================================================================
// GESTIÓN DE MODALES: ELIMINAR Y EDICIÓN RÁPIDA DE PRODUCTOS
// =============================================================================

let productToDeleteCode = null;
let editModalNewImageFile = null;

function openDeleteProductModal(code, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const prod = producerProducts.find(p => p.code === code || p.id == code);
  if (!prod) return;

  productToDeleteCode = prod.code;

  const modal = document.getElementById('delete-product-modal');
  const nameEl = document.getElementById('delete-modal-product-name');
  const codeEl = document.getElementById('delete-modal-product-code');

  if (nameEl) nameEl.textContent = prod.title || 'este producto';
  if (codeEl) codeEl.textContent = prod.code || 'PR-???';

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeDeleteProductModal() {
  productToDeleteCode = null;
  const modal = document.getElementById('delete-product-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

async function confirmDeleteProduct() {
  if (!productToDeleteCode) return;
  const prod = producerProducts.find(p => p.code === productToDeleteCode || p.id == productToDeleteCode);
  if (!prod) {
    closeDeleteProductModal();
    return;
  }

  const deleteBtn = document.getElementById('btn-confirm-delete-product');
  const originalHtml = deleteBtn ? deleteBtn.innerHTML : 'Sí, eliminar producto';
  if (deleteBtn) {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `
      <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Eliminando...</span>
    `;
  }

  try {
    if (window.supabase && typeof window.supabase.deleteProduct === 'function' && prod.id) {
      await window.supabase.deleteProduct(prod.id);
    }

    // Remover localmente del arreglo de productos
    const deletedTitle = prod.title;
    producerProducts = producerProducts.filter(p => p.code !== prod.code && p.id != prod.id);

    closeDeleteProductModal();
    renderProducerProducts();
    updateKPIs();
    showProducerToast(`✓ Producto "${deletedTitle}" eliminado correctamente`);
  } catch (err) {
    console.error('Error al eliminar producto en Supabase:', err);
    showProducerToast('Error al eliminar producto: ' + (err.message || 'Error en base de datos'), true);
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalHtml;
    }
  }
}

function deleteProducerDraft(code, event) {
  openDeleteProductModal(code, event);
}

function openEditProductModal(code) {
  const prod = producerProducts.find(p => p.code === code || p.id == code);
  if (!prod) return;

  editModalNewImageFile = null;

  const modal = document.getElementById('edit-product-modal');
  const codeBadge = document.getElementById('edit-modal-code-badge');
  const codeHidden = document.getElementById('edit-modal-product-code');
  const idHidden = document.getElementById('edit-modal-product-id');
  const imgPreview = document.getElementById('edit-modal-image-preview');
  const imgInput = document.getElementById('edit-modal-image-input');
  const nameInput = document.getElementById('edit-modal-name');
  const descInput = document.getElementById('edit-modal-desc');
  const catSelect = document.getElementById('edit-modal-category');
  const unitSelect = document.getElementById('edit-modal-unit');
  const priceInput = document.getElementById('edit-modal-price');
  const stockInput = document.getElementById('edit-modal-stock');
  const seasonSelect = document.getElementById('edit-modal-season');
  const statusSelect = document.getElementById('edit-modal-status');

  if (codeBadge) codeBadge.textContent = `EDICIÓN RÁPIDA · ${prod.code}`;
  if (codeHidden) codeHidden.value = prod.code;
  if (idHidden) idHidden.value = prod.id || '';

  const currentImg = prod.image || prod.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';
  if (imgPreview) imgPreview.src = currentImg;
  if (imgInput) imgInput.value = '';

  if (nameInput) nameInput.value = prod.title || '';
  if (descInput) descInput.value = prod.description || prod.subtitle || '';

  // Seleccionar categoría correspondiente
  if (catSelect) {
    const prodCatLower = (prod.category || '').toLowerCase();
    let found = false;
    for (let opt of catSelect.options) {
      if (opt.text.toLowerCase().includes(prodCatLower) || prodCatLower.includes(opt.text.toLowerCase())) {
        catSelect.value = opt.value;
        found = true;
        break;
      }
    }
    if (!found) catSelect.selectedIndex = 0;
  }

  // Seleccionar unidad de venta
  if (unitSelect) {
    const unitLower = (prod.unit || prod.unitLabel || '').toLowerCase();
    let found = false;
    for (let opt of unitSelect.options) {
      if (opt.value.toLowerCase().includes(unitLower) || opt.text.toLowerCase().includes(unitLower)) {
        unitSelect.value = opt.value;
        found = true;
        break;
      }
    }
    if (!found) unitSelect.selectedIndex = 0;
  }

  if (priceInput) priceInput.value = Number(prod.price || 0).toFixed(2);
  if (stockInput) stockInput.value = parseInt(prod.stock || 0, 10);

  if (seasonSelect) {
    seasonSelect.value = prod.season_label || 'Disponible todo el año';
  }

  if (statusSelect) {
    statusSelect.value = prod.status === 'borrador' ? 'draft' : 'published';
  }

  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeEditProductModal() {
  editModalNewImageFile = null;
  const modal = document.getElementById('edit-product-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function handleEditModalImageChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showProducerToast('La imagen supera los 5 MB permitidos.', true);
    return;
  }

  editModalNewImageFile = file;
  const imgPreview = document.getElementById('edit-modal-image-preview');
  if (imgPreview) {
    imgPreview.src = URL.createObjectURL(file);
  }
}

async function saveEditedProductModal(event) {
  if (event) {
    event.preventDefault();
  }

  const codeInput = document.getElementById('edit-modal-product-code');
  const code = codeInput ? codeInput.value : '';
  const prod = producerProducts.find(p => p.code === code || p.id == code);
  if (!prod) return;

  const nameInput = document.getElementById('edit-modal-name');
  const descInput = document.getElementById('edit-modal-desc');
  const catSelect = document.getElementById('edit-modal-category');
  const unitSelect = document.getElementById('edit-modal-unit');
  const priceInput = document.getElementById('edit-modal-price');
  const stockInput = document.getElementById('edit-modal-stock');
  const seasonSelect = document.getElementById('edit-modal-season');
  const statusSelect = document.getElementById('edit-modal-status');
  const saveBtn = document.getElementById('btn-save-edit-modal');
  const saveLabel = document.getElementById('btn-save-edit-modal-label');
  const saveIcon = document.getElementById('btn-save-edit-modal-icon');

  const title = (nameInput ? nameInput.value : '').trim();
  if (!title) {
    showProducerToast('Por favor escribe el nombre del producto.', true);
    if (nameInput) nameInput.focus();
    return;
  }

  const rawPrice = (priceInput ? priceInput.value : '').replace(/[^0-9.]/g, '');
  const priceNum = parseFloat(rawPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    showProducerToast('Ingresa un precio de venta válido en dólares (USD).', true);
    if (priceInput) priceInput.focus();
    return;
  }

  const rawStock = (stockInput ? stockInput.value : '').replace(/[^0-9]/g, '');
  const stockNum = parseInt(rawStock, 10);
  if (isNaN(stockNum) || stockNum < 0) {
    showProducerToast('Ingresa las existencias disponibles.', true);
    if (stockInput) stockInput.focus();
    return;
  }

  const desc = (descInput ? descInput.value : '').trim();
  const categoryId = catSelect ? parseInt(catSelect.value, 10) : 2;
  const unit = unitSelect ? unitSelect.value : 'Kilogramo (kg)';
  const unitLabel = unit.split('·')[0].trim().toLowerCase() || 'kg';
  const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
  const isSeasonal = seasonLabel !== 'Disponible todo el año';
  const isPublished = statusSelect ? statusSelect.value === 'published' : true;

  if (saveBtn) saveBtn.disabled = true;
  if (saveLabel) saveLabel.textContent = 'Guardando cambios...';
  if (saveIcon) saveIcon.textContent = '⏳';

  try {
    let finalImageUrl = prod.image || prod.image_url;

    // Si se subió un nuevo archivo de imagen
    if (editModalNewImageFile && window.supabase && typeof window.supabase.uploadFile === 'function') {
      try {
        const fileExt = editModalNewImageFile.name.split('.').pop() || 'jpg';
        const cleanName = editModalNewImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `products/prod_${Date.now()}_${cleanName}`;
        const uploadRes = await window.supabase.uploadFile('assets', fileName, editModalNewImageFile);
        if (uploadRes && uploadRes.publicUrl) {
          finalImageUrl = uploadRes.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Fallo al subir a assets, intentando avatars:', uploadErr);
        try {
          const fileName = `prod_${Date.now()}.${editModalNewImageFile.name.split('.').pop() || 'jpg'}`;
          const uploadRes = await window.supabase.uploadFile('avatars', fileName, editModalNewImageFile);
          if (uploadRes && uploadRes.publicUrl) {
            finalImageUrl = uploadRes.publicUrl;
          }
        } catch (_) {
          console.warn('Fallback imagen previa');
        }
      }
    }

    const payload = {
      category_id: categoryId,
      title: title,
      description: desc,
      price: priceNum,
      unit: unit,
      stock_quantity: stockNum,
      is_available: isPublished,
      image_url: finalImageUrl,
      is_seasonal: isSeasonal,
      season_label: seasonLabel
    };

    if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
      await window.supabase.updateProduct(prod.id, payload);
    }

    // Actualizar datos del producto en memoria
    prod.title = title;
    prod.description = desc;
    prod.subtitle = desc.slice(0, 45);
    prod.price = priceNum;
    prod.unit = unit;
    prod.unitLabel = unitLabel;
    prod.stock = stockNum;
    prod.origin = prod.origin || 'Hacienda San José · Daule';
    prod.image = finalImageUrl;
    prod.image_url = finalImageUrl;
    prod.category = catSelect ? catSelect.options[catSelect.selectedIndex].text : prod.category;
    prod.status = isPublished ? (stockNum > 0 ? 'publicado' : 'agotado') : 'borrador';
    prod.statusText = isPublished ? (stockNum > 0 ? 'Publicado' : 'Agotado') : 'Borrador';
    prod.is_available = isPublished;
    prod.is_seasonal = isSeasonal;
    prod.season_label = seasonLabel;
    prod.lastUpdate = 'Hoy · recién guardado';

    closeEditProductModal();
    renderProducerProducts();
    updateKPIs();
    showProducerToast('✓ Producto actualizado con éxito');
  } catch (err) {
    console.error('Error actualizando producto desde modal:', err);
    showProducerToast('Error al guardar cambios: ' + (err.message || 'Error de conexión'), true);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveLabel) saveLabel.textContent = 'Guardar cambios';
    if (saveIcon) saveIcon.textContent = '✓';
  }
}

// Cierre de modales con clic en backdrop y tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDeleteProductModal();
    closeEditProductModal();
  }
});

async function reponerStockDirectly(code) {
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  const newStock = prompt(`Ingresa las nuevas existencias disponibles para "${prod.title}" (${prod.unitLabel}):`, '25');
  if (newStock === null) return;
  const num = parseInt(newStock, 10);
  if (isNaN(num) || num <= 0) {
    showProducerToast('Cantidad inválida.', true);
    return;
  }

  prod.stock = num;
  prod.status = 'publicado';
  prod.statusText = 'Publicado';
  prod.lastUpdate = 'Hoy · stock actualizado';

  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, {
        stock_quantity: num,
        is_available: true
      });
    } catch (_) { }
  }

  showProducerToast(`Stock actualizado a ${num} ${prod.unitLabel}.`);
  renderProducerProducts();
  updateKPIs();
}

// =============================================================================
// FORMATEO DE MONEDA EN USD ($0.00)
// =============================================================================

function formatUSD(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toFixed(2);
}

function formatCOP(num) {
  // Alias de compatibilidad hacia formatUSD
  return formatUSD(num);
}

// Exponer funciones globales del panel de productor
window.switchProducerTab = switchProducerTab;
window.normalizeProducerTabName = normalizeProducerTabName;
window.openNewProductForm = openNewProductForm;
window.resetNewProductForm = resetNewProductForm;
window.handleCancelNewProduct = handleCancelNewProduct;
window.editProductFromCard = editProductFromCard;
window.loadProductForEditing = loadProductForEditing;
window.publishNewProduct = publishNewProduct;
window.saveProductDraft = saveProductDraft;
window.publishProductDirectly = publishProductDirectly;
window.deleteProducerDraft = deleteProducerDraft;
window.openDeleteProductModal = openDeleteProductModal;
window.closeDeleteProductModal = closeDeleteProductModal;
window.confirmDeleteProduct = confirmDeleteProduct;
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.handleEditModalImageChange = handleEditModalImageChange;
window.saveEditedProductModal = saveEditedProductModal;
window.getActiveProducerId = getActiveProducerId;
window.setProductFilter = setProductFilter;
window.handleProducerSearch = handleProducerSearch;
window.renderProducerProducts = renderProducerProducts;
window.showProducerToast = showProducerToast;

// Exponer funciones globales para el flujo de cambio de correo electrónico
window.requestProducerEmailChange = requestProducerEmailChange;
window.resendProducerEmailVerification = resendProducerEmailVerification;
window.changeProducerEmailAddress = changeProducerEmailAddress;
window.confirmProducerEmailVerification = confirmProducerEmailVerification;

// Exponer funciones para estacionalidad, canastas y stock
window.setProductType = setProductType;
window.handleSeasonChange = handleSeasonChange;
window.handleSeasonCheckboxChange = handleSeasonCheckboxChange;
window.addBasketItemFromForm = addBasketItemFromForm;
window.removeBasketItem = removeBasketItem;
window.adjustProducerStock = adjustProducerStock;
window.quickRestockProduct = quickRestockProduct;
window.calculateBasketSavings = calculateBasketSavings;
window.populateBasketProductSelect = populateBasketProductSelect;

// =============================================================================
// RECOMENDADOR INTELIGENTE DE PRECIOS (ACORDEÓN Y CALCULADORA DINÁMICA)
// =============================================================================

let activeAdvisorMarginPercent = 35;

function togglePricingAdvisorAccordion() {
  const content = document.getElementById('advisor-accordion-content');
  const chevron = document.getElementById('advisor-accordion-chevron');
  if (!content) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    void content.offsetHeight;
    content.classList.remove('opacity-0', 'max-h-0');
    content.classList.add('opacity-100', 'max-h-[1200px]');
    if (chevron) chevron.classList.add('rotate-180');
    recalculatePricingAdvisor();
  } else {
    content.classList.remove('opacity-100', 'max-h-[1200px]');
    content.classList.add('opacity-0', 'max-h-0');
    if (chevron) chevron.classList.remove('rotate-180');
    setTimeout(() => {
      content.classList.add('hidden');
    }, 300);
  }
}

function setAdvisorMargin(percent) {
  activeAdvisorMarginPercent = Number(percent) || 35;
  const marginInput = document.getElementById('new-form-margin-percent');
  if (marginInput) marginInput.value = activeAdvisorMarginPercent;

  [25, 35, 50].forEach(p => {
    const btn = document.getElementById(`advisor-margin-btn-${p}`);
    if (btn) {
      if (p === activeAdvisorMarginPercent) {
        btn.className = 'advisor-margin-btn py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#143628] text-white border border-[#143628] shadow-2xs transition cursor-pointer';
      } else {
        btn.className = 'advisor-margin-btn py-1.5 px-2 rounded-lg text-[11px] font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer';
      }
    }
  });

  recalculatePricingAdvisor();
}

function handleCustomMarginInput(val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    activeAdvisorMarginPercent = num;
    [25, 35, 50].forEach(p => {
      const btn = document.getElementById(`advisor-margin-btn-${p}`);
      if (btn) {
        if (p === Math.round(num)) {
          btn.className = 'advisor-margin-btn py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#143628] text-white border border-[#143628] shadow-2xs transition cursor-pointer';
        } else {
          btn.className = 'advisor-margin-btn py-1.5 px-2 rounded-lg text-[11px] font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer';
        }
      }
    });
    recalculatePricingAdvisor();
  }
}

function recalculatePricingAdvisor() {
  const costInput = document.getElementById('new-form-production-cost');
  const logisticsInput = document.getElementById('new-form-delivery-logistics');

  const rawCost = costInput ? parseFloat(costInput.value) : 0;
  const cost = (!isNaN(rawCost) && rawCost > 0) ? rawCost : 0.30;
  const marginPercent = activeAdvisorMarginPercent || 35;
  const logisticsFee = (logisticsInput && !isNaN(parseFloat(logisticsInput.value))) ? parseFloat(logisticsInput.value) : 1.50;

  const profit = cost * (marginPercent / 100);

  // Opción A: Tienda / Retiro en Nodo ($0.00 logística)
  const subtotalShop = cost + profit;
  const ivaShop = subtotalShop * 0.15;
  const priceShop = subtotalShop + ivaShop;

  // Opción B: Entrega a Domicilio ($1.50 logística)
  const subtotalDelivery = cost + logisticsFee + profit;
  const ivaDelivery = subtotalDelivery * 0.15;
  const priceDelivery = subtotalDelivery + ivaDelivery;

  // Actualizar DOM Opción A
  const elShopCost = document.getElementById('advisor-shop-cost');
  const elShopMargin = document.getElementById('advisor-shop-margin-label');
  const elShopProfit = document.getElementById('advisor-shop-profit');
  const elShopIva = document.getElementById('advisor-shop-iva');
  const elShopPrice = document.getElementById('advisor-shop-price');

  if (elShopCost) elShopCost.textContent = `$${cost.toFixed(2)}`;
  if (elShopMargin) elShopMargin.textContent = `+${marginPercent}%`;
  if (elShopProfit) elShopProfit.textContent = `+$${profit.toFixed(2)}`;
  if (elShopIva) elShopIva.textContent = `$${ivaShop.toFixed(2)}`;
  if (elShopPrice) elShopPrice.textContent = `$${priceShop.toFixed(2)}`;

  // Actualizar DOM Opción B
  const elDelCost = document.getElementById('advisor-delivery-cost');
  const elDelMargin = document.getElementById('advisor-delivery-margin-label');
  const elDelProfit = document.getElementById('advisor-delivery-profit');
  const elDelIva = document.getElementById('advisor-delivery-iva');
  const elDelPrice = document.getElementById('advisor-delivery-price');

  if (elDelCost) elDelCost.textContent = `$${cost.toFixed(2)}`;
  if (elDelMargin) elDelMargin.textContent = `+${marginPercent}%`;
  if (elDelProfit) elDelProfit.textContent = `+$${profit.toFixed(2)}`;
  if (elDelIva) elDelIva.textContent = `$${ivaDelivery.toFixed(2)}`;
  if (elDelPrice) elDelPrice.textContent = `$${priceDelivery.toFixed(2)}`;
}

function applySuggestedPrice(mode) {
  recalculatePricingAdvisor();
  const costInput = document.getElementById('new-form-production-cost');
  const logisticsInput = document.getElementById('new-form-delivery-logistics');
  const rawCost = costInput ? parseFloat(costInput.value) : 0;
  const cost = (!isNaN(rawCost) && rawCost > 0) ? rawCost : 0.30;
  const marginPercent = activeAdvisorMarginPercent || 35;
  const logisticsFee = (logisticsInput && !isNaN(parseFloat(logisticsInput.value))) ? parseFloat(logisticsInput.value) : 1.50;
  const profit = cost * (marginPercent / 100);

  let targetPrice = 0;
  let modeName = '';
  if (mode === 'shop') {
    const subtotalShop = cost + profit;
    targetPrice = subtotalShop * 1.15;
    modeName = 'Venta en Tienda ($0.00 envío)';
  } else {
    const subtotalDelivery = cost + logisticsFee + profit;
    targetPrice = subtotalDelivery * 1.15;
    modeName = 'Venta a Domicilio ($1.50 envío)';
  }

  const priceInput = document.getElementById('new-form-price');
  if (priceInput) {
    priceInput.value = `$ ${targetPrice.toFixed(2)}`;
    priceInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (typeof updateLivePreview === 'function') {
    updateLivePreview();
  }

  showProducerToast(`✓ Precio sugerido para ${modeName} aplicado: $${targetPrice.toFixed(2)}`);
}

window.togglePricingAdvisorAccordion = togglePricingAdvisorAccordion;
window.setAdvisorMargin = setAdvisorMargin;
window.handleCustomMarginInput = handleCustomMarginInput;
window.recalculatePricingAdvisor = recalculatePricingAdvisor;
window.applySuggestedPrice = applySuggestedPrice;


// =============================================================================
// MÓDULO FINANCIERO: MI ECONOMÍA, GASTOS Y FLUJO DE CAJA
// =============================================================================

let currentEconomyPeriod = '30d'; // '7d' | '30d' | '1y' | 'custom'
let customDateRange = { start: null, end: null };
let currentMovementsFilter = 'todos'; // 'todos' | 'ventas' | 'gastos' | 'devoluciones'
let currentMovementsSearch = '';
let expensePaymentStatus = 'pending';
let uploadedExpenseReceiptFile = null;

function formatUSDWithCommas(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Datos base de ventas para Max Productor
let economySalesData = {
  '7d': {
    rangeLabel: '31 oct. – 6 nov. 2026',
    ventasBrutas: 420.00,
    devoluciones: 0.00,
    ventasNetas: 420.00,
    comision: 21.00,
    presentaciones: 110,
    presentacionesSub: '80 paquetes de 1 kg + 30 manojos',
    porCobrar: 120.00,
    porCobrarCount: 3,
    cobroPrevistoDate: '7–10 nov. 2026',
    bars: [
      { label: '31 oct.–1 nov.', amount: 90.00 },
      { label: '2–3 nov.', amount: 110.00 },
      { label: '4–5 nov.', amount: 100.00 },
      { label: '6 nov.', amount: 120.00, active: true }
    ],
    soldProducts: [
      { product: 'Zanahoria de tierra', presentation: 'Paquete de 1 kg', quantity: 80, unitPrice: 4.00, total: 320.00 },
      { product: 'Acelga de la huerta', presentation: 'Manojo', quantity: 30, unitPrice: 3.50, total: 100.00 }
    ]
  },
  '30d': {
    rangeLabel: '8 oct. – 6 nov. 2026',
    ventasBrutas: 1620.00,
    devoluciones: 20.00,
    ventasNetas: 1600.00,
    comision: 80.00,
    presentaciones: 420,
    presentacionesSub: '300 paquetes de 1 kg + 120 manojos',
    porCobrar: 240.00,
    porCobrarCount: 6,
    cobroPrevistoDate: '7–10 nov. 2026',
    bars: [
      { label: '8–14 oct.', amount: 280.00 },
      { label: '15–21 oct.', amount: 360.00 },
      { label: '22–28 oct.', amount: 410.00 },
      { label: '29 oct.–6 nov.', amount: 550.00, active: true }
    ],
    soldProducts: [
      { product: 'Zanahoria de tierra', presentation: 'Paquete de 1 kg', quantity: 300, unitPrice: 4.00, total: 1200.00 },
      { product: 'Acelga de la huerta', presentation: 'Manojo', quantity: 120, unitPrice: 3.50, total: 420.00 }
    ]
  },
  '1y': {
    rangeLabel: '7 nov. 2025 – 6 nov. 2026',
    ventasBrutas: 18450.00,
    devoluciones: 250.00,
    ventasNetas: 18200.00,
    comision: 910.00,
    presentaciones: 4800,
    presentacionesSub: '3,400 paquetes + 1,400 manojos',
    porCobrar: 240.00,
    porCobrarCount: 6,
    cobroPrevistoDate: '7–10 nov. 2026',
    bars: [
      { label: 'Nov–Ene', amount: 4200.00 },
      { label: 'Feb–Abr', amount: 4600.00 },
      { label: 'May–Jul', amount: 4500.00 },
      { label: 'Ago–Oct', amount: 4900.00, active: true }
    ],
    soldProducts: [
      { product: 'Zanahoria de tierra', presentation: 'Paquete de 1 kg', quantity: 3400, unitPrice: 4.00, total: 13600.00 },
      { product: 'Acelga de la huerta', presentation: 'Manojo', quantity: 1400, unitPrice: 3.50, total: 4850.00 }
    ]
  }
};

// Gastos registrados
let defaultProducerExpenses = [
  { id: 1, date: '2026-10-18', category: 'Insumos y cultivo', concept: 'Semillas agroecológicas certificadas', amount: 120.00, supplier: 'AgroBio Daule', status: 'paid', invoiceRef: 'FACT-0062' },
  { id: 2, date: '2026-10-24', category: 'Insumos y cultivo', concept: 'Compost orgánico y biol fermentado', amount: 170.00, supplier: 'Finca La Esperanza', status: 'paid', invoiceRef: 'FACT-0071' },
  { id: 3, date: '2026-10-28', category: 'Transporte', concept: 'Flete de cosecha hacia centro de acopio', amount: 150.00, supplier: 'Cooperativa Daule Express', status: 'paid', invoiceRef: 'FAC-0988' },
  { id: 4, date: '2026-11-03', category: 'Empaques', concept: 'Compra de cajas de cartón y atados de yute', amount: 50.00, supplier: 'Empaques Ecológicos del Guayas', status: 'paid', invoiceRef: 'FACT-0079' },
  { id: 5, date: '2026-11-03', category: 'Empaques', concept: 'Compra de empaques biodegradables', amount: 30.00, supplier: 'Suministros Agrícolas Guayas', status: 'paid', invoiceRef: 'GAS-023' },
  { id: 6, date: '2026-11-04', category: 'Insumos y cultivo', concept: 'Mangueras de riego por goteo', amount: 70.00, supplier: 'Agroinsumos La Semilla', status: 'pending', dueDate: '2026-11-09', invoiceRef: 'FACT-0081' },
  { id: 7, date: '2026-11-05', category: 'Transporte', concept: 'Transporte al nodo Urdesa', amount: 30.00, supplier: 'Logística local Express', status: 'pending', dueDate: '2026-11-15', invoiceRef: 'GAS-038' }
];

let producerExpensesList = [...defaultProducerExpenses];

// Movimientos cronológicos
let defaultEconomyMovements = [
  { id: 'mov-1', type: 'venta', date: '6 nov.', concept: 'Venta de zanahoria', ref: 'PED-1042 · 15 paquetes de 1 kg', amount: 60.00, status: 'Por cobrar', statusClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'mov-2', type: 'gasto', date: '5 nov.', concept: 'Transporte al nodo', ref: 'GAS-038 · Logística local', amount: -60.00, status: 'Pagado', statusClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  { id: 'mov-3', type: 'venta', date: '4 nov.', concept: 'Venta de acelga', ref: 'PED-1038 · 24 manojos', amount: 84.00, status: 'Cobrado', statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'mov-4', type: 'gasto', date: '3 nov.', concept: 'Compra de empaques', ref: 'GAS-023 · Suministros', amount: -30.00, status: 'Pagado', statusClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  { id: 'mov-5', type: 'devolucion', date: '2 nov.', concept: 'Devolución a comprador', ref: 'DEV-008 · Ajuste de pedido', amount: -20.00, status: 'Reembolsado', statusClass: 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]' }
];

let economyMovementsList = [...defaultEconomyMovements];

async function initEconomyModule() {
  await loadProducerExpensesFromSupabase();
  if (currentEconomyPeriod) {
    renderEconomyDashboard();
  }
}

async function loadProducerExpensesFromSupabase() {
  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const dbExpenses = await window.supabase.fetchApi(`producer_expenses?producer_id=eq.${PRODUCER_USER_ID}&order=expense_date.desc`);
      if (Array.isArray(dbExpenses) && dbExpenses.length > 0) {
        producerExpensesList = dbExpenses.map(e => ({
          id: e.id,
          date: e.expense_date,
          category: e.category || 'Otros',
          concept: e.concept || 'Gasto registrado',
          amount: Number(e.amount || 0),
          supplier: e.supplier || '',
          status: e.payment_status || 'paid',
          dueDate: e.due_date,
          invoiceRef: e.invoice_ref,
          receiptUrl: e.receipt_url,
          notes: e.notes
        }));
        console.log(`[Economía] ${producerExpensesList.length} gastos cargados desde Supabase.`);
      }
    }
  } catch (err) {
    console.warn('Aviso cargando gastos de Supabase:', err);
  }
}

function setEconomyPeriod(period) {
  currentEconomyPeriod = period;

  const btnIds = ['7d', '30d', '1y', 'custom'];
  btnIds.forEach(id => {
    const el = document.getElementById(`econ-period-${id}`);
    if (el) {
      if (id === period) {
        el.className = 'econ-period-btn px-3.5 py-1.5 rounded-lg font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
      } else {
        el.className = 'econ-period-btn px-3.5 py-1.5 rounded-lg font-bold text-stone-600 hover:text-stone-900 transition cursor-pointer';
      }
    }
  });

  renderEconomyDashboard();
}

function toggleCustomPeriodModal() {
  const startPrompt = prompt('Ingresa fecha inicial (AAAA-MM-DD):', '2026-10-01');
  if (!startPrompt) return;
  const endPrompt = prompt('Ingresa fecha final (AAAA-MM-DD):', '2026-11-06');
  if (!endPrompt) return;

  customDateRange = { start: startPrompt, end: endPrompt };
  currentEconomyPeriod = 'custom';

  const rangeDisplay = document.getElementById('econ-period-range-display');
  if (rangeDisplay) {
    rangeDisplay.textContent = `${startPrompt} – ${endPrompt}`;
  }

  setEconomyPeriod('custom');
}

function renderEconomyDashboard() {
  const sales = economySalesData[currentEconomyPeriod] || economySalesData['30d'];

  // 1. Rango de fechas
  const rangeDisplay = document.getElementById('econ-period-range-display');
  if (rangeDisplay && currentEconomyPeriod !== 'custom') {
    rangeDisplay.textContent = sales.rangeLabel;
  }

  // 2. Gastos filtrados por período
  let relevantExpenses = [...producerExpensesList];
  if (currentEconomyPeriod === '7d') {
    relevantExpenses = producerExpensesList.filter(e => {
      const d = new Date(e.date);
      return (new Date('2026-11-06') - d) <= (7 * 24 * 60 * 60 * 1000);
    });
    if (relevantExpenses.length === 0) {
      relevantExpenses = producerExpensesList.slice(0, 3);
    }
  }

  const gastosTotal = relevantExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const comision = sales.comision || (Math.round(sales.ventasNetas * 0.05 * 100) / 100);
  const gastosMasComision = gastosTotal + comision;
  const gananciaEstimada = Math.max(0, sales.ventasNetas - gastosMasComision);
  const margen = sales.ventasNetas > 0 ? ((gananciaEstimada / sales.ventasNetas) * 100).toFixed(1) : '0.0';

  const porPagar = relevantExpenses
    .filter(e => e.status === 'pending')
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const pagado = relevantExpenses
    .filter(e => e.status === 'paid')
    .reduce((acc, e) => acc + Number(e.amount || 0), 0) + comision;

  const cobrado = sales.ventasNetas - sales.porCobrar;
  const flujoCaja = cobrado - pagado;

  // 3. Tarjetas KPI
  const kpiVentas = document.getElementById('econ-kpi-ventas-netas');
  const kpiVentasSub = document.getElementById('econ-kpi-ventas-sub');
  if (kpiVentas) kpiVentas.textContent = `$${formatUSDWithCommas(sales.ventasNetas)}`;
  if (kpiVentasSub) kpiVentasSub.textContent = `Tras $${formatUSDWithCommas(sales.devoluciones)} en devoluciones`;

  const kpiGanancia = document.getElementById('econ-kpi-ganancia');
  const kpiGananciaSub = document.getElementById('econ-kpi-ganancia-sub');
  if (kpiGanancia) kpiGanancia.textContent = `$${formatUSDWithCommas(gananciaEstimada)}`;
  if (kpiGananciaSub) kpiGananciaSub.textContent = `Margen del ${margen}% · antes de impuestos`;

  const kpiPresentaciones = document.getElementById('econ-kpi-presentaciones');
  const kpiPresentacionesSub = document.getElementById('econ-kpi-presentaciones-sub');
  if (kpiPresentaciones) kpiPresentaciones.textContent = sales.presentaciones;
  if (kpiPresentacionesSub) kpiPresentacionesSub.textContent = sales.presentacionesSub;

  const kpiPorCobrar = document.getElementById('econ-kpi-por-cobrar');
  const kpiPorCobrarSub = document.getElementById('econ-kpi-por-cobrar-sub');
  if (kpiPorCobrar) kpiPorCobrar.textContent = `$${formatUSDWithCommas(sales.porCobrar)}`;
  if (kpiPorCobrarSub) kpiPorCobrarSub.textContent = `${sales.porCobrarCount} pedidos pendientes de pago`;

  // 4. Gráfico de barras de ventas
  renderSalesBarChart(sales.bars, sales.ventasNetas);

  // 5. Desglose de Inversión por Categoría
  const catInsumos = relevantExpenses.filter(e => e.category === 'Insumos y cultivo').reduce((a, e) => a + Number(e.amount || 0), 0);
  const catTransporte = relevantExpenses.filter(e => e.category === 'Transporte').reduce((a, e) => a + Number(e.amount || 0), 0);
  const catEmpaques = relevantExpenses.filter(e => e.category === 'Empaques').reduce((a, e) => a + Number(e.amount || 0), 0);
  const catOtros = relevantExpenses.filter(e => !['Insumos y cultivo', 'Transporte', 'Empaques'].includes(e.category)).reduce((a, e) => a + Number(e.amount || 0), 0);

  const maxExpense = Math.max(1, gastosTotal);

  const elInsumos = document.getElementById('econ-cat-insumos-amount');
  const barInsumos = document.getElementById('econ-cat-insumos-bar');
  if (elInsumos) elInsumos.textContent = `$${formatUSDWithCommas(catInsumos)}`;
  if (barInsumos) barInsumos.style.width = `${Math.min(100, Math.round((catInsumos / maxExpense) * 100))}%`;

  const elTransporte = document.getElementById('econ-cat-transporte-amount');
  const barTransporte = document.getElementById('econ-cat-transporte-bar');
  if (elTransporte) elTransporte.textContent = `$${formatUSDWithCommas(catTransporte)}`;
  if (barTransporte) barTransporte.style.width = `${Math.min(100, Math.round((catTransporte / maxExpense) * 100))}%`;

  const elEmpaques = document.getElementById('econ-cat-empaques-amount');
  const barEmpaques = document.getElementById('econ-cat-empaques-bar');
  if (elEmpaques) elEmpaques.textContent = `$${formatUSDWithCommas(catEmpaques)}`;
  if (barEmpaques) barEmpaques.style.width = `${Math.min(100, Math.round((catEmpaques / maxExpense) * 100))}%`;

  const elOtros = document.getElementById('econ-cat-otros-amount');
  const barOtros = document.getElementById('econ-cat-otros-bar');
  if (elOtros) elOtros.textContent = `$${formatUSDWithCommas(catOtros)}`;
  if (barOtros) barOtros.style.width = `${Math.min(100, Math.round((catOtros / maxExpense) * 100))}%`;

  const elTotalGastos = document.getElementById('econ-total-gastos');
  if (elTotalGastos) elTotalGastos.textContent = `$${formatUSDWithCommas(gastosTotal)}`;

  const elComisionNota = document.getElementById('econ-comision-nota');
  if (elComisionNota) elComisionNota.textContent = `Comisión de la plataforma: $${formatUSDWithCommas(comision)} adicionales.`;

  // 6. Tablas
  renderPerspectiveTable(gastosMasComision, gananciaEstimada);
  renderSoldProductsTable(sales.soldProducts, sales.ventasBrutas, sales.devoluciones, sales.ventasNetas);

  // 7. Movimientos y Cuentas por atender
  renderMovementsList();
  renderPendingAccounts(sales.porCobrar, sales.porCobrarCount, sales.cobroPrevistoDate, porPagar, cobrado, pagado, flujoCaja, relevantExpenses);
}

function renderSalesBarChart(bars, totalAmount) {
  const container = document.getElementById('econ-bar-chart-container');
  const totalDisplay = document.getElementById('econ-chart-total');
  const subtitle = document.getElementById('econ-chart-subtitle');

  if (totalDisplay) totalDisplay.textContent = `Total · $${formatUSDWithCommas(totalAmount || 0)}`;
  if (subtitle) {
    const label = currentEconomyPeriod === '7d' ? 'últimos 7 días' : currentEconomyPeriod === '1y' ? 'último año' : 'últimos 30 días';
    subtitle.textContent = `Ventas netas por tramo · ${label}`;
  }

  if (!container) return;
  if (!Array.isArray(bars) || bars.length === 0 || Number(totalAmount || 0) <= 0) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center text-xs text-stone-400 py-8">
        <span class="text-xl mb-1">🌱</span>
        <span>Aún no hay ventas registradas en este período.</span>
      </div>
    `;
    return;
  }

  const maxVal = Math.max(...bars.map(b => b.amount), 100);

  container.innerHTML = bars.map(bar => {
    const heightPercent = Math.max(15, Math.min(100, Math.round((bar.amount / maxVal) * 100)));
    const isHighlight = bar.active || bar.amount === maxVal;
    const barBg = isHighlight ? 'bg-[#143628]' : 'bg-[#A3B899]';
    const textColor = isHighlight ? 'text-stone-900 font-extrabold' : 'text-stone-600 font-bold';

    return `
      <div class="flex-1 flex flex-col items-center h-full justify-end group">
        <!-- Monto USD sobre la barra -->
        <span class="text-[11px] ${textColor} mb-1.5 transition group-hover:scale-105">
          $${formatUSDWithCommas(bar.amount)}
        </span>
        <!-- Barra vertical -->
        <div class="w-full max-w-[48px] ${barBg} rounded-t-lg transition-all duration-500 hover:opacity-90 shadow-2xs" style="height: ${heightPercent}%;"></div>
        <!-- Etiqueta de fecha -->
        <span class="text-[10px] text-stone-500 font-medium mt-2 whitespace-nowrap">
          ${bar.label}
        </span>
      </div>
    `;
  }).join('');
}

function renderPerspectiveTable(currentGastosMasCom, currentGanancia) {
  const tbody = document.getElementById('econ-perspective-tbody');
  if (!tbody) return;

  const periods = [
    { key: '7d', label: '7 días · 31 oct. – 6 nov.', ventas: 420.00, gastos: 180.00, ganancia: 240.00, pres: 110 },
    { key: '30d', label: '30 días · 8 oct. – 6 nov.', ventas: 1600.00, gastos: currentGastosMasCom || 700.00, ganancia: currentGanancia || 900.00, pres: 420 },
    { key: '1y', label: '1 año · 7 nov. 2025 – 6 nov. 2026', ventas: 18200.00, gastos: 8000.00, ganancia: 10200.00, pres: 4800 }
  ];

  tbody.innerHTML = periods.map(p => {
    const isActive = p.key === currentEconomyPeriod || (currentEconomyPeriod === 'custom' && p.key === '30d');
    const rowClass = isActive ? 'bg-[#f2f6f3] font-bold text-stone-900' : 'text-stone-700 hover:bg-stone-50';
    const tagActive = isActive ? '<span class="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-[#143628] text-white">Activo</span>' : '';

    return `
      <tr class="${rowClass} transition">
        <td class="py-3 px-2 font-medium">${p.label} ${tagActive}</td>
        <td class="py-3 px-2">$${formatUSDWithCommas(p.ventas)}</td>
        <td class="py-3 px-2 text-stone-500">$${formatUSDWithCommas(p.gastos)}</td>
        <td class="py-3 px-2 font-bold ${isActive ? 'text-emerald-900' : 'text-stone-900'}">$${formatUSDWithCommas(p.ganancia)}</td>
        <td class="py-3 px-2 text-right font-medium">${p.pres.toLocaleString()}</td>
      </tr>
    `;
  }).join('');
}

function renderSoldProductsTable(products, brutas, devoluciones, netas) {
  const tbody = document.getElementById('econ-sold-products-tbody');
  const countBadge = document.getElementById('econ-sold-products-count');
  const formulaResumen = document.getElementById('econ-formula-resumen');

  if (countBadge) {
    countBadge.textContent = `${currentEconomyPeriod === '7d' ? '7 días' : currentEconomyPeriod === '1y' ? '1 año' : '30 días'} · ${products.length} productos con ventas`;
  }

  if (formulaResumen) {
    formulaResumen.innerHTML = `Ventas brutas: <span class="font-bold">$${formatUSDWithCommas(brutas)}</span> − Devoluciones: <span class="font-bold text-[#c85a32]">$${formatUSDWithCommas(devoluciones)}</span> = Ventas netas: <span class="font-extrabold text-stone-900">$${formatUSDWithCommas(netas)}</span>`;
  }

  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-stone-400">No se registraron ventas en este período.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="text-stone-700 hover:bg-stone-50 transition">
      <td class="py-3 px-2 font-bold text-stone-900">${escapeHtml(p.product)}</td>
      <td class="py-3 px-2 text-stone-500">${escapeHtml(p.presentation)}</td>
      <td class="py-3 px-2 text-center font-bold">${p.quantity}</td>
      <td class="py-3 px-2 text-stone-600">$${formatUSDWithCommas(p.unitPrice)}</td>
      <td class="py-3 px-2 text-right font-bold text-stone-900">$${formatUSDWithCommas(p.total)}</td>
    </tr>
  `).join('');
}

function handleMovementsSearch(val) {
  currentMovementsSearch = (val || '').toLowerCase().trim();
  renderMovementsList();
}

function handleMovementsTypeFilter(type) {
  currentMovementsFilter = type || 'todos';
  renderMovementsList();
}

function renderMovementsList() {
  const container = document.getElementById('econ-movements-list');
  const countLabel = document.getElementById('econ-movements-count-label');
  if (!container) return;

  let filtered = economyMovementsList.filter(m => {
    if (currentMovementsFilter !== 'todos') {
      if (currentMovementsFilter === 'ventas' && m.type !== 'venta') return false;
      if (currentMovementsFilter === 'gastos' && m.type !== 'gasto') return false;
      if (currentMovementsFilter === 'devoluciones' && m.type !== 'devolucion') return false;
    }
    if (currentMovementsSearch) {
      const c = m.concept.toLowerCase();
      const r = m.ref.toLowerCase();
      return c.includes(currentMovementsSearch) || r.includes(currentMovementsSearch);
    }
    return true;
  });

  if (countLabel) {
    countLabel.textContent = `${Math.min(5, filtered.length)} de ${filtered.length} · 30 días`;
  }

  const displayed = filtered.slice(0, 5);

  if (displayed.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-xs text-stone-400">
        No se encontraron movimientos con los filtros aplicados.
      </div>
    `;
    return;
  }

  container.innerHTML = displayed.map(m => {
    const isPositive = m.amount > 0;
    const amountText = isPositive ? `+$${formatUSDWithCommas(m.amount)}` : `-$${formatUSDWithCommas(Math.abs(m.amount))}`;
    const amountClass = isPositive ? 'text-emerald-800 font-extrabold' : 'text-[#c85a32] font-extrabold';

    return `
      <div class="py-3 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="font-bold text-stone-800 flex items-center gap-1.5">
            <span class="text-stone-400 font-medium">${m.date} ·</span>
            <span>${escapeHtml(m.concept)}</span>
          </div>
          <span class="text-[11px] text-stone-400 block mt-0.5">${escapeHtml(m.ref)}</span>
        </div>
        <div class="text-right shrink-0">
          <div class="${amountClass} text-sm">${amountText}</div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${m.statusClass || 'bg-stone-100 text-stone-700'}">
            ${m.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderPendingAccounts(porCobrarVal, porCobrarCount, cobroDate, porPagarVal, cobradoVal, pagadoVal, flujoCajaVal, expenses) {
  // 1. Por cobrar
  const porCobrarBadge = document.getElementById('econ-por-cobrar-badge');
  const porCobrarAmt = document.getElementById('econ-por-cobrar-amount');
  const porCobrarDate = document.getElementById('econ-por-cobrar-date');
  if (porCobrarBadge) porCobrarBadge.textContent = `Por cobrar · ${porCobrarCount} pedidos`;
  if (porCobrarAmt) porCobrarAmt.textContent = `$${formatUSDWithCommas(porCobrarVal)}`;
  if (porCobrarDate) porCobrarDate.textContent = `Cobro previsto: ${cobroDate}`;

  // 2. Por pagar
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const porPagarBadge = document.getElementById('econ-por-pagar-badge');
  const porPagarAmt = document.getElementById('econ-por-pagar-amount');
  const pendingList = document.getElementById('econ-pending-expenses-list');

  if (porPagarBadge) porPagarBadge.textContent = `Por pagar · ${pendingExpenses.length} gastos`;
  if (porPagarAmt) porPagarAmt.textContent = `$${formatUSDWithCommas(porPagarVal)}`;

  if (pendingList) {
    if (pendingExpenses.length === 0) {
      pendingList.innerHTML = `<p class="text-stone-400 text-xs italic">¡Al día! No tienes gastos pendientes de pago.</p>`;
    } else {
      pendingList.innerHTML = pendingExpenses.map(e => `
        <div class="flex items-center justify-between bg-white/70 p-2 rounded-xl border border-stone-200/60 shadow-2xs">
          <div>
            <span class="font-bold text-stone-800">${escapeHtml(e.category)} · $${formatUSDWithCommas(e.amount)}</span>
            <span class="text-[10px] text-stone-500 block">vence ${e.dueDate ? formatDateShort(e.dueDate) : 'próximamente'} (${escapeHtml(e.concept)})</span>
          </div>
          <button type="button" onclick="markExpenseAsPaid(${e.id})" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 cursor-pointer transition shrink-0" title="Marcar como pagado">
            ✓ Pagado
          </button>
        </div>
      `).join('');
    }
  }

  // 3. Flujo de caja
  const flujoSub = document.getElementById('econ-flujo-caja-sub');
  const flujoAmt = document.getElementById('econ-flujo-caja-amount');
  if (flujoSub) flujoSub.textContent = `Cobrado $${formatUSDWithCommas(cobradoVal)} − pagado $${formatUSDWithCommas(pagadoVal)}`;
  if (flujoAmt) {
    const isPos = flujoCajaVal >= 0;
    flujoAmt.textContent = `${isPos ? '+' : ''}$${formatUSDWithCommas(flujoCajaVal)}`;
    flujoAmt.className = `font-serif text-2xl font-bold mt-1 ${isPos ? 'text-emerald-800' : 'text-[#c85a32]'}`;
  }
}

async function markExpenseAsPaid(expenseId) {
  const expense = producerExpensesList.find(e => e.id == expenseId);
  if (!expense) return;

  expense.status = 'paid';

  // Buscar en movimientos y actualizar badge
  const mov = economyMovementsList.find(m => m.concept === expense.concept || m.ref.includes(expense.invoiceRef || ''));
  if (mov) {
    mov.status = 'Pagado';
    mov.statusClass = 'bg-stone-100 text-stone-700 border-stone-200';
  }

  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      await window.supabase.fetchApi(`producer_expenses?id=eq.${expenseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: 'paid' })
      });
    } catch (e) {
      console.warn('Aviso actualizando estado en Supabase:', e);
    }
  }

  showProducerToast(`✓ Gasto "${expense.concept}" marcado como pagado.`);
  renderEconomyDashboard();
}

function formatDateShort(dateStr) {
  if (!dateStr) return 'Hoy';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (_) {
    return dateStr;
  }
}

// =============================================================================
// FORMULARIO: REGISTRAR GASTO
// =============================================================================

function openExpenseForm() {
  resetExpenseForm();
  switchProducerTab('registrar-gasto');
}

function resetExpenseForm() {
  const dateInput = document.getElementById('expense-form-date');
  const catSelect = document.getElementById('expense-form-category');
  const conceptInput = document.getElementById('expense-form-concept');
  const amountInput = document.getElementById('expense-form-amount');
  const supplierInput = document.getElementById('expense-form-supplier');
  const dueDateInput = document.getElementById('expense-form-due-date');
  const invoiceRefInput = document.getElementById('expense-form-invoice-ref');
  const notesInput = document.getElementById('expense-form-notes');
  const filenameEl = document.getElementById('expense-receipt-filename');

  const today = new Date().toISOString().split('T')[0];
  if (dateInput) dateInput.value = today;
  if (dueDateInput) {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dueDateInput.value = nextWeek;
  }

  if (catSelect) catSelect.selectedIndex = 0;
  if (conceptInput) conceptInput.value = '';
  if (amountInput) amountInput.value = '85.00';
  if (supplierInput) supplierInput.value = '';
  if (invoiceRefInput) invoiceRefInput.value = '';
  if (notesInput) notesInput.value = '';
  if (filenameEl) filenameEl.textContent = 'Ningún archivo seleccionado';

  uploadedExpenseReceiptFile = null;
  setExpensePaymentStatus('pending');
  updateExpenseLivePreview(85.00);
}

function setExpensePaymentStatus(status) {
  expensePaymentStatus = status;

  const btnPaid = document.getElementById('expense-btn-paid');
  const btnPending = document.getElementById('expense-btn-pending');
  const pendingFields = document.getElementById('expense-pending-fields');

  if (status === 'paid') {
    if (btnPaid) {
      btnPaid.className = 'py-2.5 px-3 rounded-lg text-xs font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
    }
    if (btnPending) {
      btnPending.className = 'py-2.5 px-3 rounded-lg text-xs font-bold text-stone-700 hover:text-stone-900 transition cursor-pointer';
    }
    if (pendingFields) pendingFields.classList.add('hidden');
  } else {
    if (btnPending) {
      btnPending.className = 'py-2.5 px-3 rounded-lg text-xs font-bold bg-[#143628] text-white shadow-2xs transition cursor-pointer';
    }
    if (btnPaid) {
      btnPaid.className = 'py-2.5 px-3 rounded-lg text-xs font-bold text-stone-700 hover:text-stone-900 transition cursor-pointer';
    }
    if (pendingFields) pendingFields.classList.remove('hidden');
  }

  const amountInput = document.getElementById('expense-form-amount');
  const val = parseFloat((amountInput ? amountInput.value : '').replace(/[^0-9.]/g, '')) || 0;
  updateExpenseLivePreview(val);
}

function handleExpenseAmountChange(val) {
  const clean = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean) || 0;
  updateExpenseLivePreview(num);
}

function updateExpenseLivePreview(newExpenseAmount) {
  const previewNew = document.getElementById('expense-preview-new-amount');
  const previewTotal = document.getElementById('expense-preview-total-comp');
  const previewProfit = document.getElementById('expense-preview-profit-comp');
  const previewPending = document.getElementById('expense-preview-pending-comp');

  if (previewNew) previewNew.textContent = `$${formatUSDWithCommas(newExpenseAmount)}`;

  const currentTotal = producerExpensesList.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const nextTotal = currentTotal + newExpenseAmount;

  if (previewTotal) {
    previewTotal.innerHTML = `
      <span class="text-stone-500">$${formatUSDWithCommas(currentTotal)}</span>
      <span class="text-stone-400">→</span>
      <span class="text-stone-900 font-extrabold">$${formatUSDWithCommas(nextTotal)}</span>
    `;
  }

  const currentNetSales = 1600.00;
  const currentProfit = Math.max(0, currentNetSales - currentTotal - 80.00);
  const nextProfit = Math.max(0, currentNetSales - nextTotal - 80.00);

  if (previewProfit) {
    previewProfit.innerHTML = `
      <span class="text-stone-500">$${formatUSDWithCommas(currentProfit)}</span>
      <span class="text-stone-400">→</span>
      <span class="text-emerald-800 font-extrabold">$${formatUSDWithCommas(nextProfit)}</span>
    `;
  }

  const currentPending = producerExpensesList.filter(e => e.status === 'pending').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const nextPending = expensePaymentStatus === 'pending' ? currentPending + newExpenseAmount : currentPending;

  if (previewPending) {
    previewPending.innerHTML = `
      <span class="text-stone-500">$${formatUSDWithCommas(currentPending)}</span>
      <span class="text-stone-400">→</span>
      <span class="text-[#c85a32] font-extrabold">$${formatUSDWithCommas(nextPending)}</span>
    `;
  }
}

function handleExpenseReceiptFile(input) {
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];

  if (file.size > 10 * 1024 * 1024) {
    showProducerToast('El comprobante excede el tamaño máximo permitido de 10 MB.', true);
    input.value = '';
    return;
  }

  uploadedExpenseReceiptFile = file;
  const filenameEl = document.getElementById('expense-receipt-filename');
  if (filenameEl) {
    filenameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    filenameEl.className = 'text-xs text-emerald-800 font-bold';
  }
}

async function saveProducerExpense() {
  const dateInput = document.getElementById('expense-form-date');
  const catSelect = document.getElementById('expense-form-category');
  const conceptInput = document.getElementById('expense-form-concept');
  const amountInput = document.getElementById('expense-form-amount');
  const supplierInput = document.getElementById('expense-form-supplier');
  const dueDateInput = document.getElementById('expense-form-due-date');
  const invoiceRefInput = document.getElementById('expense-form-invoice-ref');
  const notesInput = document.getElementById('expense-form-notes');
  const saveBtn = document.getElementById('btn-save-expense');
  const saveLabel = document.getElementById('btn-save-expense-label');
  const saveIcon = document.getElementById('btn-save-expense-icon');

  const concept = (conceptInput ? conceptInput.value : '').trim();
  if (!concept) {
    showProducerToast('Por favor escribe el concepto del gasto.', true);
    if (conceptInput) conceptInput.focus();
    return;
  }

  const rawAmount = (amountInput ? amountInput.value : '').replace(/[^0-9.]/g, '');
  const amountNum = parseFloat(rawAmount);
  if (isNaN(amountNum) || amountNum <= 0) {
    showProducerToast('Ingresa un importe numérico válido en dólares (USD).', true);
    if (amountInput) amountInput.focus();
    return;
  }

  const expenseDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const category = catSelect ? catSelect.value : 'Insumos y cultivo';
  const supplier = supplierInput ? supplierInput.value.trim() : '';
  const invoiceRef = invoiceRefInput ? invoiceRefInput.value.trim() : `GAS-${Date.now() % 1000}`;
  const dueDate = (expensePaymentStatus === 'pending' && dueDateInput) ? dueDateInput.value : null;
  const notes = notesInput ? notesInput.value.trim() : '';

  if (saveBtn) saveBtn.disabled = true;
  if (saveLabel) saveLabel.textContent = 'Guardando gasto...';
  if (saveIcon) saveIcon.textContent = '⏳';

  try {
    let receiptUrl = null;

    // 1. Subida a Supabase Storage (bucket: expense-receipts)
    if (uploadedExpenseReceiptFile && window.supabase && window.supabase.storage) {
      try {
        const ext = uploadedExpenseReceiptFile.name.split('.').pop() || 'png';
        const storagePath = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadRes = await window.supabase.storage.from('expense-receipts').upload(storagePath, uploadedExpenseReceiptFile, {
          contentType: uploadedExpenseReceiptFile.type,
          upsert: true
        });

        if (uploadRes && !uploadRes.error) {
          receiptUrl = `${SUPABASE_STORAGE_URL}/expense-receipts/${storagePath}`;
        }
      } catch (uploadErr) {
        console.warn('Aviso subiendo comprobante a Storage:', uploadErr);
      }
    }

    // 2. Inserción en Supabase Database (tabla: producer_expenses)
    const payload = {
      producer_id: PRODUCER_USER_ID,
      expense_date: expenseDate,
      category: category,
      concept: concept,
      amount: amountNum,
      supplier: supplier,
      payment_status: expensePaymentStatus,
      due_date: dueDate,
      invoice_ref: invoiceRef,
      receipt_url: receiptUrl,
      notes: notes
    };

    let insertedId = Date.now() % 100000;
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        const resp = await window.supabase.fetchApi('producer_expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (resp && resp[0] && resp[0].id) {
          insertedId = resp[0].id;
        }
      } catch (dbErr) {
        console.warn('Aviso guardando en tabla producer_expenses:', dbErr);
      }
    }

    // 3. Agregar a memoria local
    const newExpenseObj = {
      id: insertedId,
      date: expenseDate,
      category: category,
      concept: concept,
      amount: amountNum,
      supplier: supplier,
      status: expensePaymentStatus,
      dueDate: dueDate,
      invoiceRef: invoiceRef,
      receiptUrl: receiptUrl,
      notes: notes
    };

    producerExpensesList.unshift(newExpenseObj);

    // 4. Agregar a movimientos recientes
    economyMovementsList.unshift({
      id: `mov-${insertedId}`,
      type: 'gasto',
      date: formatDateShort(expenseDate),
      concept: concept,
      ref: invoiceRef ? `${invoiceRef} · ${category}` : `GAS-${insertedId} · ${category}`,
      amount: -amountNum,
      status: expensePaymentStatus === 'paid' ? 'Pagado' : 'Pendiente',
      statusClass: expensePaymentStatus === 'paid' ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-amber-50 text-amber-800 border-amber-200'
    });

    showProducerToast(`✓ Gasto de $${formatUSD(amountNum)} guardado con éxito.`);
    switchProducerTab('mi-economia');
  } catch (err) {
    console.error('Error guardando gasto:', err);
    showProducerToast('Ocurrió un error al guardar el gasto.', true);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveLabel) saveLabel.textContent = 'Guardar gasto';
    if (saveIcon) saveIcon.textContent = '✓';
  }
}

// =============================================================================
// EXPORTACIÓN DE MOVIMIENTOS A CSV REAL
// =============================================================================

function exportEconomyCSV() {
  try {
    const periodLabel = currentEconomyPeriod;
    const header = ['Fecha', 'Tipo', 'Concepto', 'Referencia', 'Monto USD', 'Estado', 'Categoría'];
    const rows = [header];

    economyMovementsList.forEach(m => {
      const tipo = m.type === 'venta' ? 'Venta' : m.type === 'gasto' ? 'Gasto' : 'Devolución';
      rows.push([
        `"${m.date}"`,
        `"${tipo}"`,
        `"${m.concept.replace(/"/g, '""')}"`,
        `"${m.ref.replace(/"/g, '""')}"`,
        m.amount.toFixed(2),
        `"${m.status}"`,
        `"Finanzas Hacienda San José"`
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `economia_hacienda_san_jose_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showProducerToast('✓ Archivo CSV descargado con éxito.');
  } catch (err) {
    console.error('Error exportando CSV:', err);
    showProducerToast('No fue posible generar el CSV.', true);
  }
}

function toggleAllMovementsModal() {
  const count = economyMovementsList.length;
  alert(`Historial completo: ${count} movimientos registrados en Hacienda San José durante este ciclo de cultivo.`);
}

function showPendingOrdersModal() {
  const sales = economySalesData[currentEconomyPeriod] || economySalesData['30d'];
  alert(`Cuentas por cobrar: ${sales.porCobrarCount} pedidos entregados a la red de nodos comunitarios. Cobro programado para el próximo corte: ${sales.cobroPrevistoDate}.`);
}

// Exponer funciones globales para el módulo de economía (solo como fallback si economia.js no está presente)
if (!window.__rb_real_economy) {
  window.initEconomyModule = window.initEconomyModule || initEconomyModule;
  window.setEconomyPeriod = window.setEconomyPeriod || setEconomyPeriod;
  window.toggleCustomPeriodModal = window.toggleCustomPeriodModal || toggleCustomPeriodModal;
  window.renderEconomyDashboard = window.renderEconomyDashboard || renderEconomyDashboard;
  window.openExpenseForm = window.openExpenseForm || openExpenseForm;
  window.resetExpenseForm = window.resetExpenseForm || resetExpenseForm;
  window.setExpensePaymentStatus = window.setExpensePaymentStatus || setExpensePaymentStatus;
  window.handleExpenseAmountChange = window.handleExpenseAmountChange || handleExpenseAmountChange;
  window.handleExpenseReceiptFile = window.handleExpenseReceiptFile || handleExpenseReceiptFile;
  window.saveProducerExpense = window.saveProducerExpense || saveProducerExpense;
  window.markExpenseAsPaid = window.markExpenseAsPaid || markExpenseAsPaid;
  window.exportEconomyCSV = window.exportEconomyCSV || exportEconomyCSV;
  window.handleMovementsSearch = window.handleMovementsSearch || handleMovementsSearch;
  window.handleMovementsTypeFilter = window.handleMovementsTypeFilter || handleMovementsTypeFilter;
  window.toggleAllMovementsModal = window.toggleAllMovementsModal || toggleAllMovementsModal;
  window.showPendingOrdersModal = window.showPendingOrdersModal || showPendingOrdersModal;
}
