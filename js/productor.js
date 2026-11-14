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

// Producto actualmente en edición
let currentEditingCode = 'PR-003';

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
    await confirmProducerEmailVerification(verifyToken);
  }

  // 3. Inicializar tarjeta y cuenta para recibir pagos
  initPayoutMethod();

  // 4. Configurar escuchadores de previsualización en vivo
  setupPreviewListeners();

  // 5. Cargar todos los 48 productos desde Supabase asignados a Max Productor
  await loadProducerProductsFromSupabase();

  // 6. Leer pestaña desde hash de URL si está presente
  const hash = window.location.hash.replace('#', '');
  if (['mis-productos', 'nuevo-producto', 'modificar-producto', 'perfil-seguridad'].includes(hash)) {
    switchProducerTab(hash);
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
// CAMBIO DE CORREO ELECTRÓNICO (SUPABASE + WEBHOOK N8N)
// =============================================================================

async function requestProducerEmailChange() {
  const inputNew = document.getElementById('producer-new-email');
  const newEmail = inputNew ? inputNew.value.trim().toLowerCase() : '';
  const currentEmailEl = document.getElementById('producer-current-email');
  const currentEmail = currentEmailEl ? currentEmailEl.value.trim().toLowerCase() : 'campomax46@gmail.com';
  const btn = document.getElementById('btn-producer-email');
  const btnText = document.getElementById('btn-producer-email-text');

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

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Enviando solicitud...';

  try {
    // Generar token criptográfico único
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

    showProducerToast('Hemos enviado un enlace de confirmación a tu nuevo correo (vence en 15 min).');
    if (inputNew) inputNew.value = '';

  } catch (err) {
    console.error('Error al solicitar cambio de correo:', err);
    showProducerToast('Error al procesar la solicitud: ' + (err.message || 'Error de red'), true);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Enviar enlace de verificación';
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

      const curInput = document.getElementById('producer-current-email');
      if (curInput) curInput.value = targetEmail;
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
    if (prod.status === 'borrador') {
      badgeClass = 'bg-[#f7f3eb] text-[#92400e] border-[#eedfc9]';
      badgeDot = 'bg-amber-500';
    } else if (prod.status === 'agotado') {
      badgeClass = 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]';
      badgeDot = 'bg-[#c85a32]';
    }

    const isAgotado = prod.status === 'agotado';
    const isBorrador = prod.status === 'borrador';

    return `
      <div class="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <!-- Imagen y Badge Superior -->
          <div class="relative aspect-[16/10] overflow-hidden bg-stone-100">
            <img src="${prod.image}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            <div class="absolute top-3 left-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full ${badgeDot}"></span>
                <span>${prod.statusText}</span>
              </span>
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
              <span class="text-xl font-bold text-stone-900">$${formatCOP(prod.price)}</span>
              <span class="text-xs text-stone-400 font-medium">/ ${prod.unitLabel} · USD</span>
            </div>

            <div class="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span class="text-stone-500">Existencias</span>
              <span class="font-bold ${isAgotado ? 'text-red-600' : 'text-stone-800'}">
                ${prod.stock} ${prod.unitLabel}
              </span>
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
              <button onclick="reponerStockDirectly('${prod.code}')" class="border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer">
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
  const views = ['mis-productos', 'nuevo-producto', 'modificar-producto', 'perfil-seguridad'];
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
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="switchProducerTab('mis-productos')">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">Nuevo producto</span>`;
    } else if (tabName === 'modificar-producto') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="switchProducerTab('mis-productos')">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">Modificar ${currentEditingCode}</span>`;
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
// EDICIÓN Y MODIFICACIÓN DE PRODUCTOS
// =============================================================================

function editProductFromCard(code) {
  currentEditingCode = code;
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  const tagEl = document.getElementById('edit-product-tag');
  if (tagEl) tagEl.textContent = `EDITAR PRODUCTO · ${prod.code}`;

  const titleEl = document.getElementById('edit-product-heading');
  if (titleEl) titleEl.textContent = `Modificar ${prod.title}`;

  const subEl = document.getElementById('edit-product-subtitle');
  if (subEl) subEl.textContent = `${prod.statusText} · ${prod.origin.split('·')[0].trim()} · Última actualización: ${prod.lastUpdate || 'hoy'}`;

  const nameInput = document.getElementById('edit-form-name');
  if (nameInput) nameInput.value = prod.title;

  const descInput = document.getElementById('edit-form-desc');
  if (descInput) descInput.value = prod.description;

  const priceInput = document.getElementById('edit-form-price');
  if (priceInput) priceInput.value = `$ ${formatCOP(prod.price)}`;

  const stockInput = document.getElementById('edit-form-stock');
  if (stockInput) stockInput.value = `${prod.stock} ${prod.unitLabel}`;

  const originInput = document.getElementById('edit-form-origin');
  if (originInput) originInput.value = prod.origin;

  const statusPill = document.getElementById('edit-form-status-pill');
  if (statusPill) {
    statusPill.textContent = `• ${prod.statusText}`;
    if (prod.status === 'publicado') {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (prod.status === 'borrador') {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-[#f7f3eb] text-[#92400e] border border-[#eedfc9]';
    } else {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-[#faece6] text-[#c85a32] border border-[#f3d9ce]';
    }
  }

  const statusSelect = document.getElementById('edit-form-status-select');
  if (statusSelect) {
    statusSelect.value = prod.status === 'publicado' ? 'Publicado' : (prod.status === 'borrador' ? 'Borrador' : 'Agotado');
  }

  const prevImg = document.getElementById('edit-preview-img');
  if (prevImg) prevImg.src = prod.image;

  const prevTitle = document.getElementById('edit-preview-title');
  if (prevTitle) prevTitle.textContent = prod.title;

  const prevOrigin = document.getElementById('edit-preview-origin');
  if (prevOrigin) prevOrigin.textContent = prod.origin;

  const prevPrice = document.getElementById('edit-preview-price');
  if (prevPrice) prevPrice.textContent = `$${formatCOP(prod.price)} / ${prod.unitLabel}`;

  const thumbImg = document.getElementById('edit-thumbnail-img');
  if (thumbImg) thumbImg.src = prod.image;

  switchProducerTab('modificar-producto');
}

async function saveProductModifications() {
  const prod = producerProducts.find(p => p.code === currentEditingCode);
  if (!prod) return;

  const nameInput = document.getElementById('edit-form-name');
  const priceInput = document.getElementById('edit-form-price');
  const stockInput = document.getElementById('edit-form-stock');
  const descInput = document.getElementById('edit-form-desc');
  const statusSelect = document.getElementById('edit-form-status-select');

  if (nameInput && nameInput.value.trim()) prod.title = nameInput.value.trim();
  if (descInput && descInput.value.trim()) prod.description = descInput.value.trim();
  
  if (priceInput) {
    const rawNum = priceInput.value.replace(/[^0-9.]/g, '');
    if (rawNum) prod.price = Number(rawNum);
  }

  if (stockInput) {
    const rawNum = stockInput.value.replace(/[^0-9]/g, '');
    if (rawNum !== '') prod.stock = Number(rawNum);
  }

  if (statusSelect) {
    const val = statusSelect.value.toLowerCase();
    if (val.includes('public')) {
      prod.status = 'publicado';
      prod.statusText = 'Publicado';
    } else if (val.includes('borrador')) {
      prod.status = 'borrador';
      prod.statusText = 'Borrador';
    } else if (val.includes('agotad')) {
      prod.status = 'agotado';
      prod.statusText = 'Agotado';
    }
  }

  prod.lastUpdate = 'Hoy · recién guardado';

  // Sincronizar en Supabase
  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, {
        title: prod.title,
        description: prod.description,
        price: prod.price,
        stock_quantity: prod.stock,
        is_available: prod.status === 'publicado'
      });
      console.log(`Producto ${prod.code} sincronizado en Supabase.`);
    } catch (e) {
      console.warn('Error al actualizar producto en Supabase:', e);
    }
  }

  showProducerToast(`¡Los cambios de "${prod.title}" se han guardado con éxito!`);
  renderProducerProducts();
  updateKPIs();
  switchProducerTab('mis-productos');
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

async function publishNewProduct() {
  const nameInput = document.getElementById('new-form-name');
  const priceInput = document.getElementById('new-form-price');
  const stockInput = document.getElementById('new-form-stock');
  const descInput = document.getElementById('new-form-desc');
  const unitSelect = document.getElementById('new-form-unit');
  const catSelect = document.getElementById('new-form-category');

  const title = nameInput ? nameInput.value.trim() : '';
  if (!title) {
    showProducerToast('Por favor escribe el nombre del producto.', true);
    return;
  }

  const rawPrice = priceInput ? priceInput.value.replace(/[^0-9.]/g, '') : '0.50';
  const price = Number(rawPrice) || 0.50;
  const rawStock = stockInput ? stockInput.value.replace(/[^0-9]/g, '') : '20';
  const stock = Number(rawStock) || 20;
  const desc = descInput ? descInput.value.trim() : 'Cosecha fresca agroecológica de la hacienda.';
  const unit = unitSelect ? unitSelect.value.split('·')[0].trim() : 'Kilogramo (kg)';
  const category = catSelect ? catSelect.value : 'Verduras & Raíces';
  const unitLabel = unit.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'kg';

  const newCode = `PR-${String(producerProducts.length + 1).padStart(3, '0')}`;
  const newProd = {
    code: newCode,
    id: Date.now(),
    title: title,
    category: category,
    unit: unit,
    price: price,
    stock: stock,
    unitLabel: unitLabel,
    status: 'publicado',
    statusText: 'Publicado',
    subtitle: 'Cosecha recién publicada',
    image: `${SUPABASE_STORAGE_URL}/rabanos.jpg`,
    description: desc,
    origin: 'Hacienda San José · Daule',
    harvestDate: 'Hoy',
    lastUpdate: 'Hoy · recién creado'
  };

  producerProducts.unshift(newProd);

  if (window.supabase && typeof window.supabase.createProduct === 'function') {
    try {
      await window.supabase.createProduct({
        producer_id: PRODUCER_USER_ID,
        title: title,
        description: desc,
        price: price,
        unit: unit,
        stock_quantity: stock,
        is_available: true,
        image_url: `${SUPABASE_STORAGE_URL}/rabanos.jpg`
      });
    } catch (e) {
      console.warn('Error al crear producto en Supabase:', e);
    }
  }

  showProducerToast(`¡Cosecha "${title}" publicada con éxito!`);
  renderProducerProducts();
  updateKPIs();
  switchProducerTab('mis-productos');
}

function saveProductDraft() {
  const nameInput = document.getElementById('new-form-name');
  const title = nameInput ? nameInput.value.trim() : 'Nuevo producto';
  showProducerToast(`"${title}" se ha guardado en Borradores.`);
  switchProducerTab('mis-productos');
}

function setupPreviewListeners() {
  const newName = document.getElementById('new-form-name');
  const newPrice = document.getElementById('new-form-price');
  const newUnit = document.getElementById('new-form-unit');

  if (newName) {
    newName.addEventListener('input', (e) => {
      const prev = document.getElementById('new-preview-title');
      if (prev) prev.textContent = e.target.value.trim() || 'Rábanos de temporada';
    });
  }

  if (newPrice) {
    newPrice.addEventListener('input', (e) => {
      const prev = document.getElementById('new-preview-price');
      const val = e.target.value.replace(/[^0-9.]/g, '');
      const unit = newUnit ? newUnit.value.split('·')[0].trim().toLowerCase() : 'manojo';
      if (prev) prev.textContent = `$${val ? formatCOP(Number(val)) : '0,28'} / ${unit}`;
    });
  }

  const editName = document.getElementById('edit-form-name');
  const editPrice = document.getElementById('edit-form-price');
  const editUnit = document.getElementById('edit-form-unit');

  if (editName) {
    editName.addEventListener('input', (e) => {
      const prev = document.getElementById('edit-preview-title');
      if (prev) prev.textContent = e.target.value.trim() || 'Zanahoria de tierra';
    });
  }

  if (editPrice) {
    editPrice.addEventListener('input', (e) => {
      const prev = document.getElementById('edit-preview-price');
      const val = e.target.value.replace(/[^0-9.]/g, '');
      const unit = editUnit ? editUnit.value.replace(/[^a-zA-Z]/g, '').toLowerCase() : 'kg';
      if (prev) prev.textContent = `$${val ? formatCOP(Number(val)) : '0,40'} / ${unit}`;
    });
  }
}

function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}
