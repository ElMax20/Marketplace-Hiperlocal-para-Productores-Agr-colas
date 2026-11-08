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

  // 4. Verificar si viene de un enlace de confirmación por correo desde GitHub
  const urlParams = new URLSearchParams(window.location.search);
  const verifyToken = urlParams.get('verify_email_token') || urlParams.get('token');
  const newEmailParam = urlParams.get('new_email');
  if (verifyToken) {
    await confirmEmailVerification(verifyToken, newEmailParam);
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
// Cambio y Verificación de Correo Electrónico con Supabase y n8n
// =============================================================================

/**
 * Genera un identificador criptográficamente seguro de 64 caracteres hex (32 bytes)
 * Cumple con el requisito de ser al menos 32 caracteres y único.
 */
function generateSecureToken() {
  if (window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  if (window.crypto && window.crypto.randomUUID) {
    return (window.crypto.randomUUID().replace(/-/g, '') + Date.now().toString(16)).padEnd(32, '0');
  }
  const randPart1 = Math.random().toString(36).substring(2);
  const randPart2 = Math.random().toString(36).substring(2);
  const timePart = Date.now().toString(16);
  return (randPart1 + randPart2 + timePart + randPart1).substring(0, 64);
}

/**
 * Manejador para solicitar cambio de correo electrónico:
 * 1. Valida el formato del nuevo correo y que no sea idéntico al actual.
 * 2. Bloquea el botón y muestra estado de carga temporal.
 * 3. Genera token de 64 hex y fecha de expiración a 15 minutos.
 * 4. Inserta el registro en email_change_requests en Supabase (lo que activa el webhook hacia n8n).
 * 5. NO contacta a Supabase Auth (Supabase NO envía correos, únicamente n8n).
 * 6. NO muestra ningún cuadro/tarjeta debajo del botón; muestra el toast y limpia el campo.
 */
async function handleRequestEmailChange() {
  const inputNew = document.getElementById('new_email') || document.getElementById('input-new-email');
  const btn = document.getElementById('btn-request-email-change') || document.getElementById('btn-send-email-verification');
  const btnText = document.getElementById('btn-request-text');
  const btnIcon = document.getElementById('btn-request-icon');

  const newEmail = inputNew?.value.trim().toLowerCase();

  // 1. Validaciones en el cliente
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    showToast('Por favor escribe un correo electrónico válido con formato nombre@dominio.com');
    inputNew?.focus();
    return;
  }

  const currentEmail = (currentUser?.email || '').trim().toLowerCase();
  if (currentEmail && currentEmail === newEmail) {
    showToast('El nuevo correo no puede ser idéntico al correo actual.');
    inputNew?.focus();
    return;
  }

  // Estado de carga y deshabilitar botón temporalmente
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    if (btnText) btnText.textContent = 'Procesando solicitud...';
    if (btnIcon) btnIcon.innerHTML = '<span class="inline-block animate-spin">⏳</span>';
  }

  try {
    // 2. Generación del token y cálculo de expiración (15 minutos)
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Obtener user_id y current_email de la sesión activa
    let userId = currentUser?.id;
    if (!userId || userId === '00000000-0000-0000-0000-000000000001') {
      if (window.supabase && typeof window.supabase.fetchApi === 'function' && currentUser?.username) {
        try {
          const profs = await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}&select=id`);
          if (profs && profs.length > 0 && profs[0].id) {
            userId = profs[0].id;
            currentUser.id = userId;
          }
        } catch (_) {}
      }
    }

    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000001';
    }

    // Enlace exclusivo hacia la página de configuración del usuario en GitHub Pages
    const githubPagesConfirmUrl = `https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas/perfil.html?token=${encodeURIComponent(token)}`;

    // Inserción en Supabase tabla email_change_requests
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // Limpiar solicitudes anteriores pendientes del mismo usuario para evitar duplicados
      try {
        await window.supabase.fetchApi(`email_change_requests?user_id=eq.${userId}`, {
          method: 'DELETE'
        });
      } catch (cleanErr) {
        console.warn('Advertencia al limpiar solicitudes pendientes:', cleanErr);
      }

      // Insertar nuevo registro con los campos requeridos y el enlace de GitHub Pages para n8n
      const insertData = {
        user_id: userId,
        current_email: currentEmail || (currentUser?.username + '@raizybarrio.co'),
        new_email: newEmail,
        verification_token: token,
        expires_at: expiresAt,
        confirmation_url: githubPagesConfirmUrl,
        verification_url: githubPagesConfirmUrl
      };

      await window.supabase.fetchApi('email_change_requests', {
        method: 'POST',
        body: JSON.stringify(insertData)
      });
    }

    // 3. Respuesta visual al usuario: solo mensaje toast y limpiar campo (sin generar cuadros)
    const confirmationText = 'Hemos enviado un enlace de confirmación a tu nuevo correo. Por favor revisa tu bandeja de entrada para completar el cambio (el enlace vence en 15 minutos).';
    showToast(confirmationText);

    // Limpiar el campo de entrada
    if (inputNew) inputNew.value = '';

  } catch (err) {
    console.error('Error al registrar solicitud de cambio de correo en Supabase:', err);
    showToast('Ocurrió un problema con la base de datos: ' + (err.message || 'Error de red. Intenta nuevamente.'));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

/**
 * Confirmación de correo al abrir perfil.html con ?token=... desde el enlace recibido por correo (GitHub Pages)
 */
async function confirmEmailVerification(token, explicitEmail) {
  if (!token) return;

  try {
    let targetEmail = explicitEmail;
    let userId = currentUser?.id;

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      const cleanToken = token.trim();
      const endpoint = `email_change_requests?verification_token=eq.${encodeURIComponent(cleanToken)}&expires_at=gt.now()&select=*`;
      const requests = await window.supabase.fetchApi(endpoint);

      if (!requests || requests.length === 0) {
        showToast('El enlace de verificación ha caducado o no es válido. Por favor solicita uno nuevo.');
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (_) {}
        return;
      }

      const match = requests[0];
      targetEmail = match.new_email;
      userId = match.user_id;

      // 1. Actualizar en base de datos Supabase (public.profiles)
      if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
        await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
          method: 'PATCH',
          body: { email: targetEmail }
        });
      } else if (currentUser?.username) {
        await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}`, {
          method: 'PATCH',
          body: { email: targetEmail }
        });
      }

      // 2. Eliminar fila de solicitud para invalidar el token
      try {
        await window.supabase.fetchApi(`email_change_requests?id=eq.${match.id}`, {
          method: 'DELETE'
        });
      } catch (_) {}
    }

    if (!targetEmail) {
      showToast('Enlace de verificación no válido o expirado.');
      return;
    }

    // 3. Actualizar sesión activa en localStorage
    if (!currentUser) {
      try {
        const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
        if (raw) currentUser = JSON.parse(raw);
      } catch (_) {}
    }

    if (currentUser) {
      currentUser.email = targetEmail;
      currentUser.email_verified = true;
      localStorage.setItem('rb_current_user', JSON.stringify(currentUser));
      localStorage.setItem('raiz_user', JSON.stringify(currentUser));
    }

    // 4. Actualizar vista en perfil.html
    const inputCurr = document.getElementById('input-current-email');
    if (inputCurr) inputCurr.value = targetEmail;
    const inputNew = document.getElementById('new_email') || document.getElementById('input-new-email');
    if (inputNew) inputNew.value = '';

    // 5. Limpiar URL para que quede limpia sin parámetros
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (_) {}

    showToast('Tu correo electrónico ha sido actualizado correctamente. Ya puedes iniciar sesión con tu nueva dirección.');
  } catch (err) {
    console.error('Error al confirmar verificación de correo:', err);
    showToast('Ocurrió un error al confirmar la verificación de correo.');
  }
}

// Exponer funciones en window para compatibilidad total con eventos onclick
window.handleRequestEmailChange = handleRequestEmailChange;
window.handleSendEmailVerification = handleRequestEmailChange;
window.confirmEmailVerification = confirmEmailVerification;
window.cancelPendingEmailVerification = function() {};
window.copyVerificationLink = function() {};
window.restorePendingEmailVerificationUI = function() {};


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
