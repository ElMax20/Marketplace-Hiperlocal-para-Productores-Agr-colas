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

  // 9. Leer pestaña desde hash de URL si está presente
  const hash = window.location.hash.replace('#', '');
  if (['mis-productos', 'nuevo-producto', 'modificar-producto', 'perfil-seguridad'].includes(hash)) {
    if (hash === 'nuevo-producto') {
      openNewProductForm();
    } else {
      switchProducerTab(hash);
    }
  } else {
    switchProducerTab('mis-productos');
  }
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
  } catch (e) {}

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
    } catch (_) {}
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
        const row = eventPayload.new || eventPayload;
        if (row && row.id) {
          const prod = producerProducts.find(p => p.id == row.id || p.numericId == row.id);
          if (prod) {
            if (row.stock_quantity !== undefined) {
              prod.stock = Number(row.stock_quantity);
              const isAvail = row.is_available !== false && prod.stock > 0;
              prod.status = isAvail ? 'publicado' : 'agotado';
              prod.statusText = isAvail ? 'Publicado' : 'Agotado';
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
  } catch (_) {}

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
  } catch (_) {}

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
      } catch (_) {}

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
    } catch (_) {}

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
      } catch (_) {}

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
        } catch (_) {}
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
      } catch (_) {}

      // Actualizar sesión y UI
      try {
        const raw = localStorage.getItem('rb_cached_profile') || localStorage.getItem('rb_current_user');
        const u = raw ? JSON.parse(raw) : {};
        u.email = targetEmail;
        localStorage.setItem('rb_cached_profile', JSON.stringify(u));
        localStorage.setItem('rb_current_user', JSON.stringify(u));
      } catch (_) {}

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
      } catch (_) {}
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
      } catch (_) {}

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
    } catch (_) {}

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
    } catch (_) {}

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
    } catch (_) {}

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
  } catch (_) {}

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
  } catch (_) {}

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
  } catch (_) {}

  initPayoutMethod();
  closePayoutMethodModal();
  showProducerToast('Preferencia de cobro guardada (Vista previa).');
}

function removePayoutMethod() {
  if (!confirm('¿Deseas eliminar esta cuenta de cobro?')) return;
  try {
    localStorage.removeItem('rb_producer_payout');
  } catch (_) {}
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
        const stock = Number(p.stock_quantity ?? (p.stock ?? 30));
        let status = 'publicado';
        let statusText = 'Publicado';
        if (!isAvailable || stock <= 0) {
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
      const matchTitle = p.title.toLowerCase().includes(currentSearchQuery);
      const matchCode = p.code.toLowerCase().includes(currentSearchQuery);
      const matchCat = p.category.toLowerCase().includes(currentSearchQuery);
      const matchOrigin = p.origin.toLowerCase().includes(currentSearchQuery);
      return matchTitle || matchCode || matchCat || matchOrigin;
    }
    return true;
  });

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
      badgeText = 'Borrador';
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
      <div class="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <!-- Imagen y Badges Superiores -->
          <div class="relative aspect-[16/10] overflow-hidden bg-stone-100">
            <img src="${prod.image}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
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
              ${prod.code} · ${prod.origin.split('·')[0].trim()}
            </div>
            <h3 class="font-serif font-bold text-lg text-stone-900 leading-snug mb-1">
              ${prod.title}
            </h3>
            <p class="text-xs text-stone-500 mb-4 line-clamp-1">
              ${prod.subtitle}
            </p>

            <div class="flex items-baseline gap-1 mb-3">
              <span class="text-xl font-bold text-stone-900">$${formatUSD(prod.price)}</span>
              <span class="text-xs text-stone-400 font-medium">/ ${prod.unitLabel} · USD</span>
            </div>

            <!-- Existencias y Gestión Rápida de Stock -->
            <div class="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span class="text-stone-500 font-medium">Existencias</span>
              <div class="flex items-center gap-1">
                <button type="button" onclick="adjustProducerStock('${prod.code}', -1, event)" class="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer transition select-none" title="Disminuir 1 stock">-</button>
                <span class="font-bold min-w-[55px] text-center ${prod.stock <= 0 ? 'text-red-600' : prod.stock <= 5 ? 'text-amber-600' : 'text-stone-800'}">
                  ${prod.stock} ${prod.unitLabel}
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
            <button onclick="editProductFromCard('${prod.code}')" class="text-xs font-bold text-[#1a3d2f] hover:text-[#255440] flex items-center gap-1 transition cursor-pointer">
              <span>Modificar</span>
              <span>→</span>
            </button>

            ${isBorrador ? `
              <button onclick="publishProductDirectly('${prod.code}')" class="bg-[#1a3d2f] hover:bg-[#255440] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer">
                Publicar
              </button>
            ` : isAgotado ? `
              <button onclick="quickRestockProduct('${prod.code}', 15, event)" class="border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
                Reponer stock
              </button>
            ` : `
              <span class="text-[11px] text-stone-400">${prod.lastUpdate || 'Hoy'}</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setProductFilter(filterType) {
  currentFilter = filterType;

  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active', 'border-b-2', 'border-[#1a3d2f]', 'text-[#1a3d2f]', 'font-bold');
      btn.classList.remove('text-stone-500');
    } else {
      btn.classList.remove('active', 'border-b-2', 'border-[#1a3d2f]', 'text-[#1a3d2f]', 'font-bold');
      btn.classList.add('text-stone-500');
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

function switchProducerTab(tabName) {
  if (tabName === 'modificar-producto') {
    tabName = 'nuevo-producto';
  }

  const views = ['mis-productos', 'nuevo-producto', 'perfil-seguridad'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) activeView.classList.remove('hidden');

  const navBtns = document.querySelectorAll('.nav-producer-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const breadcrumbEl = document.getElementById('producer-breadcrumb');
  if (breadcrumbEl) {
    if (tabName === 'mis-productos') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mis productos</span>`;
    } else if (tabName === 'nuevo-producto') {
      const actionName = productFormMode === 'edit' ? `Modificar ${currentEditingCode || 'producto'}` : 'Nuevo producto';
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="handleCancelNewProduct()">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">${actionName}</span>`;
    } else if (tabName === 'perfil-seguridad') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mi perfil y seguridad</span>`;
    }
  }

  try {
    window.location.hash = tabName;
  } catch (_) {}

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
        if (window.supabase && window.supabase.storage) {
          uploadRes = await window.supabase.storage.from('assets').upload(storagePath, item.file, {
            contentType: item.file.type || 'image/jpeg'
          });
        }

        if (uploadRes && uploadRes.data && uploadRes.data.publicUrl) {
          item.url = uploadRes.data.publicUrl;
        } else {
          item.url = `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/${storagePath}`;
        }
        item.file = null;
      } catch (err) {
        console.warn('Error subiendo imagen a Supabase Storage:', err);
      }
    }
  }
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

  const seasonSelect = document.getElementById('new-form-season-label');
  if (seasonSelect) seasonSelect.value = 'Disponible todo el año';

  const seasonCheck = document.getElementById('new-form-is-seasonal');
  if (seasonCheck) seasonCheck.checked = false;

  const statusSelect = document.getElementById('new-form-status');
  if (statusSelect) statusSelect.value = 'published';

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
  loadProductForEditing(code);
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
    // 1. Subir archivos nuevos a Supabase Storage
    await uploadProductImageFiles();

    // 2. URL de portada
    const coverImg = uploadedImages.find(img => img.isCover) || uploadedImages[0];
    const coverUrl = coverImg ? coverImg.url : `${SUPABASE_STORAGE_URL}/rabanos.jpg`;

    // 3. Preparar campos
    const desc = (descInput ? descInput.value : '').trim() || 'Cosecha fresca agroecológica de la hacienda.';
    const unit = unitSelect ? unitSelect.value : 'Kilogramo (kg)';
    const categoryId = catSelect ? parseInt(catSelect.value, 10) : 2;
    const origin = (originInput ? originInput.value : '').trim() || 'Hacienda San José · Daule';
    const isSavePublished = !statusSelect || statusSelect.value === 'published';
    const unitLabel = unit.split('·')[0].trim().toLowerCase() || 'kg';

    if (productFormMode === 'new') {
      const newCode = `PR-${String(producerProducts.length + 1).padStart(3, '0')}`;
      const seasonSelect = document.getElementById('new-form-season-label');
      const seasonCheck = document.getElementById('new-form-is-seasonal');
      const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
      const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
      const isBasket = productType === 'basket';

      const payload = {
        producer_id: PRODUCER_USER_ID,
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: isSavePublished,
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
        unit: unit,
        stock_quantity: stockNum,
        is_available: isSavePublished,
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
    console.error('Error publicando producto:', err);
    showProducerToast('Ocurrió un error al guardar en Supabase. Inténtalo de nuevo.', true);
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
  const priceNum = parseFloat(rawPrice) || 0.50;
  const rawStock = (stockInput ? stockInput.value : '').replace(/[^0-9]/g, '');
  const stockNum = parseInt(rawStock, 10) || 0;
  const desc = (descInput ? descInput.value : '').trim() || 'Borrador en preparación.';
  const unit = unitSelect ? unitSelect.value : 'Kilogramo (kg)';
  const categoryId = catSelect ? parseInt(catSelect.value, 10) : 2;
  const origin = (originInput ? originInput.value : '').trim() || 'Hacienda San José · Daule';

  if (draftBtn) draftBtn.disabled = true;

  try {
    await uploadProductImageFiles();
    const coverImg = uploadedImages.find(img => img.isCover) || uploadedImages[0];
    const coverUrl = coverImg ? coverImg.url : `${SUPABASE_STORAGE_URL}/rabanos.jpg`;
    const unitLabel = unit.split('·')[0].trim().toLowerCase() || 'kg';

    const seasonSelect = document.getElementById('new-form-season-label');
    const seasonCheck = document.getElementById('new-form-is-seasonal');
    const isSeasonal = (seasonCheck && seasonCheck.checked) || (seasonSelect && seasonSelect.value !== 'Disponible todo el año');
    const seasonLabel = seasonSelect ? seasonSelect.value : 'Disponible todo el año';
    const isBasket = productType === 'basket';

    if (productFormMode === 'new') {
      const newCode = `PR-${String(producerProducts.length + 1).padStart(3, '0')}`;
      const payload = {
        producer_id: PRODUCER_USER_ID,
        category_id: categoryId,
        title: title,
        description: desc,
        price: priceNum,
        unit: unit,
        stock_quantity: stockNum,
        is_available: false,
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
        stock: stockNum,
        unitLabel: unitLabel,
        status: 'borrador',
        statusText: 'Borrador',
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
        unit: unit,
        stock_quantity: stockNum,
        is_available: false,
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
        prod.unit = unit;
        prod.stock = stockNum;
        prod.origin = origin;
        prod.image = coverUrl;
        prod.status = 'borrador';
        prod.statusText = 'Borrador';
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
  } catch (err) {
    console.error('Error guardando borrador:', err);
    showProducerToast('Error guardando borrador.', true);
  } finally {
    if (draftBtn) draftBtn.disabled = false;
  }
}

async function publishProductDirectly(code) {
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  prod.status = 'publicado';
  prod.statusText = 'Publicado';
  prod.lastUpdate = 'Hoy · recién publicado';

  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, { is_available: true });
    } catch (_) {}
  }

  showProducerToast(`¡"${prod.title}" publicado en la tienda!`);
  renderProducerProducts();
  updateKPIs();
}

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
    } catch (_) {}
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

// Exponer funciones globales para el flujo de cambio de correo electrónico
window.requestProducerEmailChange = requestProducerEmailChange;
window.resendProducerEmailVerification = resendProducerEmailVerification;
window.changeProducerEmailAddress = changeProducerEmailAddress;
window.confirmProducerEmailVerification = confirmProducerEmailVerification;


window.setProductType = setProductType;
window.handleSeasonChange = handleSeasonChange;
window.handleSeasonCheckboxChange = handleSeasonCheckboxChange;
window.addBasketItemFromForm = addBasketItemFromForm;
window.removeBasketItem = removeBasketItem;
window.adjustProducerStock = adjustProducerStock;
window.quickRestockProduct = quickRestockProduct;
window.calculateBasketSavings = calculateBasketSavings;
window.populateBasketProductSelect = populateBasketProductSelect;
