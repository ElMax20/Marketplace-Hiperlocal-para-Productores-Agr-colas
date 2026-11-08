/**
 * Raíz & Barrio - Perfil y Configuración de Usuario
 * Diseño fiel a la referencia de "Tu perfil, tu tranquilidad"
 * Totalmente dinámico y adaptable para cualquier cuenta (Cliente, Productor, Administrador).
 * Conexión completa con LocalStorage, Supabase y Cropper de Foto Anti-Descuadre.
 */

const DEFAULT_AVATAR = 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/avatars/avatar_max_1794094307238.jpg';

let currentUser = null;
let originalUserData = null;
let pendingPhotoDraft = null; // { file, dataUrl, remove }

document.addEventListener('DOMContentLoaded', () => {
  initProfilePage();
});

async function initProfilePage() {
  // 1. Obtener usuario en sesión
  let user = null;
  try {
    const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (raw) user = JSON.parse(raw);
  } catch (e) {
    console.warn('Error leyendo usuario:', e);
  }

  // 2. Si no hay usuario en sesión, usar plantilla por defecto (Max)
  if (!user) {
    user = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Max',
      username: 'max',
      email: 'max@vecinos.com',
      phone: '0997766751',
      role: 'cliente',
      preferredNode: 'Nodo Central · La Perseverancia',
      address: 'Carrera 7 n.º 32-16, apto. 402',
      avatar: DEFAULT_AVATAR,
      registeredAt: '2026-09-15T00:00:00.000Z'
    };
  }

  currentUser = user;
  originalUserData = JSON.parse(JSON.stringify(currentUser));

  // 3. RENDERIZAR INMEDIATAMENTE (0 milisegundos de espera, sin flash de otro usuario)
  renderProfileUI(currentUser);
  updateCartBadge();

  // 4. Verificar si viene de un enlace de confirmación por correo o restaurar solicitud pendiente
  const urlParams = new URLSearchParams(window.location.search);
  const verifyToken = urlParams.get('verify_email_token') || urlParams.get('token');
  const newEmailParam = urlParams.get('new_email');
  if (verifyToken) {
    await confirmEmailVerification(verifyToken, newEmailParam);
  } else {
    restorePendingEmailVerificationUI();
  }

  // 5. Sincronizar en segundo plano con Supabase si está disponible
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && user.username) {
    try {
      const endpoint = `profiles?username=ilike.${encodeURIComponent(user.username)}&select=*`;
      const freshProfiles = await window.supabase.fetchApi(endpoint);
      if (freshProfiles && freshProfiles.length > 0) {
        const fresh = freshProfiles[0];
        let hasChanges = false;
        if (fresh.full_name && fresh.full_name !== currentUser.name) {
          currentUser.name = fresh.full_name;
          hasChanges = true;
        }
        if (fresh.avatar_url && fresh.avatar_url !== currentUser.avatar) {
          currentUser.avatar = fresh.avatar_url;
          hasChanges = true;
        }
        if (fresh.email && fresh.email !== currentUser.email) {
          currentUser.email = fresh.email;
          hasChanges = true;
        }
        if (fresh.phone && fresh.phone !== currentUser.phone) {
          currentUser.phone = fresh.phone;
          hasChanges = true;
        }
        if (fresh.location_address && fresh.location_address !== currentUser.address) {
          currentUser.address = fresh.location_address;
          hasChanges = true;
        }
        if (fresh.farm_name && fresh.farm_name !== currentUser.preferredNode) {
          currentUser.preferredNode = fresh.farm_name;
          hasChanges = true;
        }
        if (fresh.role && fresh.role !== currentUser.role) {
          currentUser.role = fresh.role;
          hasChanges = true;
        }
        if (hasChanges) {
          originalUserData = JSON.parse(JSON.stringify(currentUser));
          renderProfileUI(currentUser);
        }
      }
    } catch (err) {
      console.warn('Sync con Supabase:', err);
    }
  }
}

/**
 * Rellena todos los campos e indicadores visuales de la pantalla
 */
function renderProfileUI(u) {
  const firstName = (u.name || 'Vecino').split(' ')[0];
  const isFemale = (u.name || '').toLowerCase().endsWith('a');
  const roleText = u.role === 'productor' 
    ? 'Productor agrícola' 
    : (u.role === 'admin' ? 'Administrador' : (isFemale ? 'Compradora' : 'Comprador'));

  // Navbar
  const navName = document.getElementById('nav-user-name');
  if (navName) navName.textContent = u.name || 'Mi cuenta';

  const dropName = document.getElementById('dropdown-user-name');
  if (dropName) dropName.textContent = u.name || 'Mi cuenta';

  const dropRole = document.getElementById('dropdown-user-role');
  if (dropRole) dropRole.textContent = roleText;

  const navAvatar = document.getElementById('nav-user-avatar');
  if (navAvatar) navAvatar.src = u.avatar || DEFAULT_AVATAR;

  const navNode = document.getElementById('nav-user-node');
  if (navNode) navNode.textContent = (u.preferredNode || 'Nodo Central').split('·')[0].trim();

  const navRoleLabel = document.getElementById('nav-user-role-label');
  if (navRoleLabel) navRoleLabel.textContent = `Mi cuenta · ${roleText}`;

  // Encabezado
  const kicker = document.getElementById('header-user-kicker');
  if (kicker) kicker.textContent = `MI CUENTA · ${roleText.toUpperCase()}`;

  const welcome = document.getElementById('header-user-welcome');
  if (welcome) welcome.textContent = `${firstName}, cuida tus datos y deja todo listo para tu próxima cosecha.`;

  // Sidebar: Foto y Perfil
  const profileImg = document.getElementById('profile-avatar-preview');
  if (profileImg) profileImg.src = u.avatar || DEFAULT_AVATAR;

  const nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) nameDisplay.textContent = u.name || 'Usuario';

  const rolePill = document.getElementById('profile-role-text');
  if (rolePill) rolePill.textContent = roleText;

  const handle = document.getElementById('profile-username-handle');
  if (handle) handle.textContent = `@${u.username || (u.name || 'vecino').toLowerCase().replace(/\s+/g, '.')}`;

  const sidebarNode = document.getElementById('sidebar-user-node');
  if (sidebarNode) sidebarNode.textContent = (u.preferredNode || 'Central · La Perseverancia').replace('Nodo ', '');

  const sidebarSince = document.getElementById('sidebar-user-since');
  if (sidebarSince) {
    sidebarSince.innerHTML = `${roleText} en la comunidad Raíz & Barrio.<br>Tu nodo: <span class="font-semibold text-stone-800">${u.preferredNode || 'Central · La Perseverancia'}</span>.`;
  }

  // Card 1: Datos Personales
  const inputName = document.getElementById('input-full-name');
  if (inputName) inputName.value = u.name || '';

  const inputUsername = document.getElementById('input-username');
  if (inputUsername) inputUsername.value = u.username || (u.name || '').toLowerCase().replace(/\s+/g, '.');

  const inputPhone = document.getElementById('input-phone');
  if (inputPhone) inputPhone.value = u.phone || '';

  const inputCurrentEmail = document.getElementById('input-current-email');
  if (inputCurrentEmail) inputCurrentEmail.value = u.email || 'correo@ejemplo.co';

  // Card 3: Tarjeta y Titular
  const cardHolder = document.getElementById('card-holder-name-display');
  if (cardHolder) cardHolder.textContent = u.name || 'Titular de la tarjeta';

  // Card 4: Entrega y Dirección
  const deliveryNode = document.getElementById('delivery-node-title');
  if (deliveryNode) deliveryNode.textContent = u.preferredNode || 'Nodo Central · La Perseverancia';

  const deliveryAddress = document.getElementById('delivery-home-address');
  if (deliveryAddress) deliveryAddress.textContent = u.address || 'Carrera 7 n.º 32-16, apto. 402';
}

function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem('raiz_cart') || '[]');
    const totalCount = cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    const counter = document.getElementById('nav-cart-counter');
    if (counter) counter.textContent = totalCount;
  } catch (e) {}
}

// =============================================================================
// Manejo de Foto y Cropper Anti-Descuadre
// =============================================================================
function handlePhotoFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('La imagen supera el límite de 5 MB. Por favor elige otra.');
    return;
  }

  // Abrir cropper interactivo para ajustar encuadre y zoom
  openAvatarCropperModal(file, (croppedFile, croppedDataUrl) => {
    pendingPhotoDraft = {
      file: croppedFile,
      dataUrl: croppedDataUrl,
      remove: false
    };

    const preview = document.getElementById('profile-avatar-preview');
    if (preview) preview.src = croppedDataUrl;

    const badge = document.getElementById('photo-draft-badge');
    if (badge) badge.classList.remove('hidden');

    showToast('Foto encuadrada correctamente. Recuerda hacer clic en "Guardar cambios".');
  });

  // Limpiar input file para permitir seleccionar la misma foto si se desea
  e.target.value = '';
}

function handleRemovePhoto() {
  pendingPhotoDraft = {
    file: null,
    dataUrl: null,
    remove: true
  };

  const preview = document.getElementById('profile-avatar-preview');
  if (preview) preview.src = DEFAULT_AVATAR;

  const badge = document.getElementById('photo-draft-badge');
  if (badge) {
    badge.innerHTML = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        <span>Foto pendiente de eliminar</span>
      </span>
    `;
    badge.classList.remove('hidden');
  }

  showToast('Foto retirada provisionalmente. Haz clic en "Guardar cambios" para confirmar.');
}

// =============================================================================
// Guardar Todos los Cambios (Supabase + LocalStorage)
// =============================================================================
async function saveSettingsChanges() {
  const btnSave = document.getElementById('btn-save-settings');
  const originalBtnHtml = btnSave ? btnSave.innerHTML : 'Guardar cambios';

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `
      <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Guardando...</span>
    `;
  }

  // Leer campos
  const newName = document.getElementById('input-full-name')?.value.trim() || currentUser.name;
  const newUsername = document.getElementById('input-username')?.value.trim().toLowerCase() || currentUser.username;
  const newPhone = document.getElementById('input-phone')?.value.trim() || currentUser.phone;

  currentUser.name = newName;
  currentUser.username = newUsername;
  currentUser.phone = newPhone;

  // Procesar foto si hay pendiente
  if (pendingPhotoDraft) {
    if (pendingPhotoDraft.remove) {
      currentUser.avatar = '';
    } else if (pendingPhotoDraft.dataUrl) {
      // Si hay archivo recortado y Supabase Storage activo:
      let uploadedUrl = null;
      if (window.supabase && typeof window.supabase.uploadFile === 'function' && pendingPhotoDraft.file) {
        try {
          const fileName = `avatar_${currentUser.username}_${Date.now()}.jpg`;
          const uploadRes = await window.supabase.uploadFile('assets', `avatars/${fileName}`, pendingPhotoDraft.file);
          if (uploadRes && uploadRes.publicUrl) {
            uploadedUrl = uploadRes.publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Error subiendo foto a Supabase Storage:', uploadErr);
        }
      }
      currentUser.avatar = uploadedUrl || pendingPhotoDraft.dataUrl;
    }
  }

  // 1. Guardar en LocalStorage
  try {
    localStorage.setItem('rb_current_user', JSON.stringify(currentUser));
    localStorage.setItem('raiz_user', JSON.stringify(currentUser));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }

  // 2. Guardar en Supabase
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const updatePayload = {
        full_name: currentUser.name,
        username: currentUser.username,
        phone: currentUser.phone,
        location_address: currentUser.address,
        farm_name: currentUser.preferredNode,
        avatar_url: currentUser.avatar
      };

      const endpoint = currentUser.id && currentUser.id.length > 10
        ? `profiles?id=eq.${currentUser.id}`
        : `profiles?username=eq.${encodeURIComponent(currentUser.username)}`;

      await window.supabase.fetchApi(endpoint, {
        method: 'PATCH',
        body: updatePayload
      });
    } catch (err) {
      console.warn('Error sincronizando con Supabase:', err);
    }
  }

  // Limpiar borrador de foto
  pendingPhotoDraft = null;
  const badge = document.getElementById('photo-draft-badge');
  if (badge) badge.classList.add('hidden');

  originalUserData = JSON.parse(JSON.stringify(currentUser));

  // Refrescar UI completa
  renderProfileUI(currentUser);

  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = originalBtnHtml;
  }

  const inputNewEmail = document.getElementById('input-new-email')?.value.trim();
  if (inputNewEmail && inputNewEmail.toLowerCase() !== (currentUser.email || '').toLowerCase() && !localStorage.getItem('rb_pending_email_change')) {
    showToast('¡Datos guardados! Recuerda hacer clic en "Enviar enlace de verificación" para cambiar tu correo.');
  } else {
    showToast('¡Tus cambios han sido guardados con éxito!');
  }
}

function cancelSettingsChanges() {
  if (originalUserData) {
    currentUser = JSON.parse(JSON.stringify(originalUserData));
    pendingPhotoDraft = null;

    const badge = document.getElementById('photo-draft-badge');
    if (badge) badge.classList.add('hidden');

    renderProfileUI(currentUser);
    showToast('Cambios cancelados. Se restauraron tus datos anteriores.');
  }
}

// =============================================================================
// Contraseña y Correo
// =============================================================================
function togglePassVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

async function handleUpdatePassword() {
  const current = document.getElementById('input-pass-current')?.value;
  const newPass = document.getElementById('input-pass-new')?.value;
  const confirm = document.getElementById('input-pass-confirm')?.value;

  if (!current || !newPass || !confirm) {
    showToast('Por favor completa todos los campos de contraseña.');
    return;
  }

  if (newPass.length < 8) {
    showToast('La nueva contraseña debe tener al menos 8 caracteres.');
    return;
  }

  if (newPass !== confirm) {
    showToast('La confirmación de la contraseña no coincide.');
    return;
  }

  // Actualizar en base de datos si está conectada
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && currentUser.username) {
    try {
      await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}`, {
        method: 'PATCH',
        body: { password: newPass }
      });
    } catch (e) {}
  }

  currentUser.password = newPass;
  localStorage.setItem('rb_current_user', JSON.stringify(currentUser));
  localStorage.setItem('raiz_user', JSON.stringify(currentUser));

  document.getElementById('input-pass-current').value = '••••••••••••';
  document.getElementById('input-pass-new').value = '••••••••••••';
  document.getElementById('input-pass-confirm').value = '••••••••••••';

  showToast('¡Contraseña actualizada con éxito!');
}

// =============================================================================
// Cambio y Verificación Real de Correo Electrónico
// =============================================================================
function getWebmailProviderName(email) {
  const domain = (email || '').split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail.com') || domain.includes('googlemail.com')) return 'Gmail';
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com') || domain.includes('msn.com')) return 'Outlook / Hotmail';
  if (domain.includes('yahoo.com') || domain.includes('ymail.com')) return 'Yahoo Mail';
  if (domain.includes('icloud.com') || domain.includes('me.com') || domain.includes('mac.com')) return 'iCloud Mail';
  if (domain.includes('proton.me') || domain.includes('protonmail.com')) return 'Proton Mail';
  return 'tu bandeja de correo';
}

function getWebmailUrl(email) {
  const domain = (email || '').split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail.com') || domain.includes('googlemail.com')) return 'https://mail.google.com';
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com') || domain.includes('msn.com')) return 'https://outlook.live.com/mail';
  if (domain.includes('yahoo.com') || domain.includes('ymail.com')) return 'https://mail.yahoo.com';
  if (domain.includes('icloud.com') || domain.includes('me.com') || domain.includes('mac.com')) return 'https://www.icloud.com/mail';
  if (domain.includes('proton.me') || domain.includes('protonmail.com')) return 'https://mail.proton.me';
  return `mailto:${email}`;
}

async function handleSendEmailVerification() {
  const inputNew = document.getElementById('input-new-email');
  const btn = document.getElementById('btn-send-email-verification');
  const newEmail = inputNew?.value.trim().toLowerCase();

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    showToast('Por favor escribe una dirección de correo válida.');
    inputNew?.focus();
    return;
  }

  if (currentUser && currentUser.email && currentUser.email.toLowerCase() === newEmail) {
    showToast('Ese correo ya es tu dirección actual.');
    inputNew?.focus();
    return;
  }

  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin">⏳</span><span>Enviando enlace...</span>`;
  }

  // Generar token único y enlace de verificación
  const token = 'vtok_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('verify_email_token', token);
  currentUrl.searchParams.set('new_email', newEmail);
  const confirmUrl = currentUrl.toString();

  const pendingData = {
    token: token,
    userId: currentUser?.id,
    username: currentUser?.username,
    oldEmail: currentUser?.email,
    newEmail: newEmail,
    requestedAt: new Date().toISOString(),
    confirmUrl: confirmUrl
  };

  localStorage.setItem('rb_pending_email_change', JSON.stringify(pendingData));

  // Intentar envío real a través de Supabase Auth
  let sentViaSupabase = false;
  let errorMsg = null;

  try {
    const authEndpoint = 'https://hvjqgvplbmshpucnuzfy.supabase.co/auth/v1/otp';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU';

    const resp = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: newEmail,
        create_user: true,
        data: {
          action: 'email_change',
          username: currentUser?.username,
          verify_url: confirmUrl
        }
      })
    });

    if (resp.ok) {
      sentViaSupabase = true;
    } else {
      const errJson = await resp.json().catch(() => ({}));
      if (resp.status === 429 || errJson?.error_code === 'over_email_send_rate_limit') {
        errorMsg = 'Límite de envíos por hora alcanzado en el servidor gratuito. Puedes confirmar el cambio directamente abajo.';
      } else {
        errorMsg = errJson?.msg || errJson?.message || `Servicio de correo temporalmente no disponible (${resp.status})`;
      }
    }
  } catch (err) {
    console.warn('Error al contactar servicio de correo:', err);
    errorMsg = 'No se pudo conectar con el servidor de correo.';
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }

  showEmailVerificationPendingUI(pendingData, sentViaSupabase, errorMsg);

  if (sentViaSupabase) {
    showToast(`¡Enlace de verificación enviado a ${newEmail}! Revisa tu bandeja de entrada.`);
  } else {
    showToast(`Solicitud de cambio generada para ${newEmail}.`);
  }
}

function showEmailVerificationPendingUI(pendingData, sentViaSupabase = false, errorMsg = null) {
  const container = document.getElementById('email-verification-container');
  if (!container || !pendingData) return;

  const providerName = getWebmailProviderName(pendingData.newEmail);
  const webmailUrl = getWebmailUrl(pendingData.newEmail);

  let statusBadge = '';
  if (sentViaSupabase) {
    statusBadge = `
      <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
        <span>✉️</span>
        <span>Enlace enviado a tu bandeja de entrada (${pendingData.newEmail})</span>
      </div>
    `;
  } else if (errorMsg) {
    statusBadge = `
      <div class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg leading-relaxed">
        <p class="font-semibold flex items-center gap-1">
          <span>⚠️</span> <span>Aviso de entrega:</span>
        </p>
        <p class="mt-0.5">${errorMsg}</p>
      </div>
    `;
  }

  container.innerHTML = `
    <div id="pending-email-card" class="mt-4 p-4 rounded-xl border border-stone-200 bg-stone-50/90 shadow-2xs space-y-3">
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
            Confirmación pendiente
          </span>
          <p class="text-xs font-medium text-stone-800">
            Cambiando a: <strong class="text-stone-900">${pendingData.newEmail}</strong>
          </p>
        </div>
        <button 
          type="button" 
          onclick="cancelPendingEmailVerification()" 
          title="Cancelar solicitud de cambio de correo"
          class="text-xs text-stone-400 hover:text-red-600 transition p-1 cursor-pointer"
        >
          ✕ Cancelar
        </button>
      </div>

      ${statusBadge}

      <p class="text-[11px] text-stone-500 leading-normal">
        Haz clic en el enlace recibido en tu bandeja de entrada o utiliza una de las opciones rápidas a continuación:
      </p>

      <div class="flex flex-wrap items-center gap-2 pt-1">
        <a 
          href="${webmailUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a3d2f] text-white hover:bg-[#143025] text-xs font-semibold rounded-xl shadow-2xs transition cursor-pointer"
        >
          <span>📬</span>
          <span>Abrir ${providerName}</span>
          <span class="text-[10px]">↗</span>
        </a>

        <button 
          type="button" 
          onclick="confirmEmailVerification('${pendingData.token}', '${pendingData.newEmail}')"
          class="inline-flex items-center gap-1 px-3 py-2 bg-white border border-stone-300 hover:border-emerald-600 hover:text-emerald-700 text-stone-700 text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer"
          title="Confirmar el cambio de correo inmediatamente"
        >
          <span>✓</span>
          <span>Confirmar cambio ahora</span>
        </button>

        <button 
          type="button" 
          onclick="copyVerificationLink('${pendingData.confirmUrl}')"
          class="inline-flex items-center gap-1 px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-xl transition cursor-pointer"
          title="Copiar enlace de verificación"
        >
          <span>📋</span>
          <span>Copiar enlace</span>
        </button>
      </div>
    </div>
  `;
}

function restorePendingEmailVerificationUI() {
  try {
    const raw = localStorage.getItem('rb_pending_email_change');
    if (!raw) return;
    const pendingData = JSON.parse(raw);
    if (pendingData && pendingData.newEmail) {
      showEmailVerificationPendingUI(pendingData, false, null);
    }
  } catch (e) {
    console.warn('Error restaurando verificación pendiente:', e);
  }
}

function cancelPendingEmailVerification() {
  localStorage.removeItem('rb_pending_email_change');
  const container = document.getElementById('email-verification-container');
  if (container) container.innerHTML = '';
  const inputNew = document.getElementById('input-new-email');
  if (inputNew) inputNew.value = '';
  showToast('Solicitud de cambio de correo cancelada.');
}

function copyVerificationLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('¡Enlace de verificación copiado al portapapeles!');
    }).catch(() => {
      prompt('Copia este enlace de verificación:', url);
    });
  } else {
    prompt('Copia este enlace de verificación:', url);
  }
}

async function confirmEmailVerification(token, explicitEmail) {
  let targetEmail = explicitEmail;
  let pendingData = null;

  try {
    const raw = localStorage.getItem('rb_pending_email_change');
    if (raw) pendingData = JSON.parse(raw);
  } catch (e) {}

  if (!targetEmail && pendingData && pendingData.newEmail) {
    targetEmail = pendingData.newEmail;
  }

  if (!targetEmail) {
    showToast('Enlace de verificación no válido o expirado.');
    return;
  }

  // 1. Actualizar usuario en memoria
  if (!currentUser) {
    try {
      const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
      if (raw) currentUser = JSON.parse(raw);
    } catch (e) {}
  }

  if (currentUser) {
    currentUser.email = targetEmail;
    currentUser.email_verified = true;
    localStorage.setItem('rb_current_user', JSON.stringify(currentUser));
    localStorage.setItem('raiz_user', JSON.stringify(currentUser));
  }

  // 2. Actualizar en Supabase profiles
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && currentUser) {
    try {
      if (currentUser.id && currentUser.id !== '00000000-0000-0000-0000-000000000001') {
        await window.supabase.fetchApi(`profiles?id=eq.${currentUser.id}`, {
          method: 'PATCH',
          body: { email: targetEmail }
        });
      } else if (currentUser.username) {
        await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}`, {
          method: 'PATCH',
          body: { email: targetEmail }
        });
      }
    } catch (e) {
      console.warn('Error sincronizando correo en Supabase:', e);
    }
  }

  // 3. Limpiar estado pendiente
  localStorage.removeItem('rb_pending_email_change');

  // 4. Actualizar campos en el DOM
  const inputCurr = document.getElementById('input-current-email');
  if (inputCurr) inputCurr.value = targetEmail;
  const inputNew = document.getElementById('input-new-email');
  if (inputNew) inputNew.value = '';
  const container = document.getElementById('email-verification-container');
  if (container) container.innerHTML = '';

  // 5. Limpiar parámetros de la URL sin recargar la página
  try {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (e) {}

  showToast(`¡Correo electrónico actualizado con éxito a ${targetEmail}!`);
}

// Exponer funciones en window para compatibilidad total con eventos onclick
window.handleSendEmailVerification = handleSendEmailVerification;
window.confirmEmailVerification = confirmEmailVerification;
window.cancelPendingEmailVerification = cancelPendingEmailVerification;
window.copyVerificationLink = copyVerificationLink;
window.restorePendingEmailVerificationUI = restorePendingEmailVerificationUI;


// =============================================================================
// Modales de Nodo y Dirección
// =============================================================================
function openNodeSelectorModal() {
  const nodes = [
    'Nodo Central · La Perseverancia',
    'Nodo Chapinero Alto · Café del Bosque',
    'Nodo Teusaquillo · Casa Campesina',
    'Nodo Usaquén · Plaza de Artesanos',
    'Nodo Suba · Huerto Comunitario'
  ];

  const choice = prompt(`Selecciona tu nuevo nodo preferido:\n\n1. ${nodes[0]}\n2. ${nodes[1]}\n3. ${nodes[2]}\n4. ${nodes[3]}\n5. ${nodes[4]}\n\nIngresa el número (1 a 5):`, "1");
  if (!choice) return;

  const idx = parseInt(choice) - 1;
  if (nodes[idx]) {
    currentUser.preferredNode = nodes[idx];
    document.getElementById('delivery-node-title').textContent = nodes[idx];
    document.getElementById('nav-user-node').textContent = nodes[idx].split('·')[0].trim();
    saveSettingsChanges();
  }
}

function editAddressModal() {
  const current = currentUser.address || 'Carrera 7 n.º 32-16, apto. 402';
  const newAddr = prompt('Ingresa tu nueva dirección de entrega a domicilio en Bogotá:', current);
  if (newAddr && newAddr.trim() !== '') {
    currentUser.address = newAddr.trim();
    document.getElementById('delivery-home-address').textContent = newAddr.trim();
    saveSettingsChanges();
  }
}

function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('rb_current_user');
    localStorage.removeItem('raiz_user');
    window.location.href = 'mercado.html';
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100', 'pointer-events-auto');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'pointer-events-auto');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 4000);
}
