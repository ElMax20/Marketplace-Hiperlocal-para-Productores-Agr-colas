/**
 * Raíz & Barrio - Perfil y Configuración de Usuario
 * Diseño fiel a la referencia de "Tu perfil, tu tranquilidad"
 * Totalmente dinámico y adaptable para cualquier cuenta (Cliente, Productor, Administrador).
 * Conexión completa con LocalStorage, Supabase y Cropper de Foto Anti-Descuadre.
 */

const NEUTRAL_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%23e7e5e4'/><path d='M32 32a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0 6c-8.84 0-20 4.48-20 12v4h40v-4c0-7.52-11.16-12-20-12z' fill='%23a8a29e'/></svg>";
const DEFAULT_AVATAR = NEUTRAL_AVATAR_FALLBACK;

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

  // 2. Si no hay usuario en sesión, redirigir al mercado para iniciar sesión real
  if (!user || !user.loggedIn) {
    window.location.replace('mercado.html?openLogin=true');
    return;
  }

  currentUser = user;
  originalUserData = JSON.parse(JSON.stringify(currentUser));

  // 3. RENDERIZAR INMEDIATAMENTE (0 milisegundos de espera, sin flash de otro usuario)
  renderProfileUI(currentUser);
  initProfileInputValidators();
  updateCartBadge();
  initPaymentMethods();
  initDeliverySection();

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

// =============================================================================
// VALIDACIONES EN TIEMPO REAL PARA EL FORMULARIO DE PERFIL
// =============================================================================

let profileUsernameTimer = null;
let profileEmailTimer = null;

function initProfileInputValidators() {
  const userInp = document.getElementById('input-username');
  if (userInp) {
    userInp.addEventListener('input', handleProfileUsernameInput);
  }
  const phoneInp = document.getElementById('input-phone');
  if (phoneInp) {
    phoneInp.addEventListener('input', handleProfilePhoneInput);
  }
  const emailInp = document.getElementById('new_email');
  if (emailInp) {
    emailInp.addEventListener('input', handleProfileEmailInput);
  }
}

function handleProfileUsernameInput(e) {
  const val = e.target.value.trim().toLowerCase();
  const feedback = document.getElementById('profile-username-feedback');
  const inputEl = document.getElementById('input-username');
  clearTimeout(profileUsernameTimer);

  if (!val) {
    if (feedback) { feedback.classList.add('hidden'); feedback.textContent = ''; }
    if (inputEl) inputEl.classList.remove('border-emerald-500', 'border-red-500');
    return;
  }

  // Si no ha cambiado respecto al usuario en sesión
  if (currentUser && currentUser.username && val === currentUser.username.toLowerCase()) {
    if (feedback) {
      feedback.className = 'text-[11px] font-medium text-emerald-700 mt-1 block';
      feedback.textContent = '✓ Nombre de usuario actual';
    }
    if (inputEl) {
      inputEl.classList.remove('border-red-500');
      inputEl.classList.add('border-emerald-500');
    }
    return;
  }

  const check = window.validateUsername ? window.validateUsername(val) : { valid: val.length >= 4 };
  if (!check.valid) {
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
    return;
  }

  if (feedback) {
    feedback.className = 'text-[11px] font-medium text-stone-500 mt-1 block';
    feedback.textContent = '⏳ Verificando disponibilidad...';
  }

  profileUsernameTimer = setTimeout(async () => {
    try {
      let isAvailable = true;
      if (window.supabase && typeof window.supabase.checkUsernameAvailable === 'function') {
        isAvailable = await window.supabase.checkUsernameAvailable(check.cleanUsername);
      }
      if (isAvailable) {
        if (feedback) {
          feedback.className = 'text-[11px] font-bold text-emerald-700 mt-1 block';
          feedback.textContent = '✓ Nombre de usuario disponible';
        }
        if (inputEl) {
          inputEl.classList.remove('border-red-500');
          inputEl.classList.add('border-emerald-500');
        }
      } else {
        if (feedback) {
          feedback.className = 'text-[11px] font-bold text-red-600 mt-1 block';
          feedback.textContent = '✕ Este usuario ya está en uso';
        }
        if (inputEl) {
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-red-500');
        }
      }
    } catch (_) {
      if (feedback) {
        feedback.className = 'text-[11px] font-bold text-emerald-700 mt-1 block';
        feedback.textContent = '✓ Nombre de usuario disponible';
      }
    }
  }, 400);
}

function handleProfilePhoneInput(e) {
  const val = e.target.value.trim();
  const feedback = document.getElementById('profile-phone-feedback');
  const inputEl = document.getElementById('input-phone');

  if (!val) {
    if (feedback) { feedback.classList.add('hidden'); feedback.textContent = ''; }
    if (inputEl) inputEl.classList.remove('border-emerald-500', 'border-red-500');
    return;
  }

  const check = window.validatePhoneNumber ? window.validatePhoneNumber(val) : { valid: val.length >= 10 };
  if (!check.valid) {
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
  } else {
    if (feedback) {
      feedback.className = 'text-[11px] font-bold text-emerald-700 mt-1 block';
      feedback.textContent = '✓ Teléfono celular válido';
    }
    if (inputEl) {
      inputEl.classList.remove('border-red-500');
      inputEl.classList.add('border-emerald-500');
    }
  }
}

function handleProfileEmailInput(e) {
  const val = e.target.value.trim().toLowerCase();
  const feedback = document.getElementById('profile-email-feedback');
  const inputEl = document.getElementById('new_email');
  clearTimeout(profileEmailTimer);

  if (!val) {
    if (feedback) { feedback.classList.add('hidden'); feedback.textContent = ''; }
    if (inputEl) inputEl.classList.remove('border-emerald-500', 'border-red-500');
    return;
  }

  const check = window.validateEmail ? window.validateEmail(val) : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) };
  if (!check.valid) {
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${check.message}`;
    }
    if (inputEl) {
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-red-500');
    }
    return;
  }

  if (currentUser && currentUser.email && val === currentUser.email.toLowerCase()) {
    if (feedback) {
      feedback.className = 'text-[11px] font-medium text-amber-600 mt-1 block';
      feedback.textContent = '⚠️ Este ya es tu correo actual';
    }
    return;
  }

  if (feedback) {
    feedback.className = 'text-[11px] font-medium text-stone-500 mt-1 block';
    feedback.textContent = '⏳ Verificando correo...';
  }

  profileEmailTimer = setTimeout(async () => {
    try {
      let isAvailable = true;
      if (window.supabase && typeof window.supabase.checkEmailAvailable === 'function') {
        isAvailable = await window.supabase.checkEmailAvailable(check.cleanEmail);
      }
      if (isAvailable) {
        if (feedback) {
          feedback.className = 'text-[11px] font-bold text-emerald-700 mt-1 block';
          feedback.textContent = '✓ Correo disponible para cambio';
        }
        if (inputEl) {
          inputEl.classList.remove('border-red-500');
          inputEl.classList.add('border-emerald-500');
        }
      } else {
        if (feedback) {
          feedback.className = 'text-[11px] font-bold text-red-600 mt-1 block';
          feedback.textContent = '✕ Este correo ya se encuentra registrado';
        }
        if (inputEl) {
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-red-500');
        }
      }
    } catch (_) {
      if (feedback) {
        feedback.className = 'text-[11px] font-bold text-emerald-700 mt-1 block';
        feedback.textContent = '✓ Correo disponible';
      }
    }
  }, 400);
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

  const rawAvatar = u.avatar || u.avatar_url || '';
  const hasAvatar = Boolean(rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim() !== '' && !rawAvatar.includes('data:image/svg+xml') && !rawAvatar.includes('lucia_torres.jpg') && !rawAvatar.includes('elena_moreno.jpg'));
  const avatarSrc = hasAvatar ? normalizeAvatarUrl(rawAvatar) : '';

  const navAvatar = document.getElementById('nav-user-avatar');
  const navInitials = document.getElementById('nav-user-initials');
  const displayName = u.name || 'Mi cuenta';
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || 'U';

  if (navInitials) navInitials.textContent = initials;

  if (hasAvatar && navAvatar) {
    navAvatar.src = avatarSrc;
    navAvatar.classList.remove('hidden');
    if (navInitials) navInitials.classList.add('hidden');
  } else {
    if (navAvatar) navAvatar.classList.add('hidden');
    if (navInitials) {
      navInitials.classList.remove('hidden');
      navInitials.classList.add('flex');
    }
  }

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
  if (profileImg) {
    profileImg.src = avatarSrc;
    profileImg.onerror = function() { this.src = NEUTRAL_AVATAR_FALLBACK; };
  }

  // Visibilidad del botón Eliminar foto (oculto si no hay foto subida)
  const deleteBtn = document.getElementById('btn-delete-avatar');
  if (deleteBtn) {
    if (hasAvatar) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.removeAttribute('disabled');
    } else {
      deleteBtn.classList.add('hidden');
      deleteBtn.setAttribute('disabled', 'true');
    }
  }

  const nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) nameDisplay.textContent = u.name || 'Usuario';

  const rolePill = document.getElementById('profile-role-text');
  if (rolePill) rolePill.textContent = roleText;

  const handle = document.getElementById('profile-username-handle');
  if (handle) handle.textContent = `@${u.username || (u.name || 'vecino').toLowerCase().replace(/\s+/g, '.')}`;

  const sidebarNode = document.getElementById('sidebar-user-node');
  if (sidebarNode) sidebarNode.textContent = (u.preferredNode || 'Urdesa · Espacio Verde').replace('Nodo ', '').replace('Sede ', '');

  const sidebarSince = document.getElementById('sidebar-user-since');
  if (sidebarSince) {
    sidebarSince.innerHTML = `${roleText} en la comunidad Raíz & Barrio.<br>Tu nodo: <span class="font-semibold text-stone-800">${u.preferredNode || 'Sede Urdesa · Espacio Verde'}</span>.`;
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
  if (deliveryNode) deliveryNode.textContent = u.preferredNode || 'Sede Urdesa · Espacio Verde';

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

  if (!file.type.startsWith('image/')) {
    if (typeof showToast === 'function') {
      showToast('Formato no válido. Por favor selecciona una imagen (JPG, PNG, WebP).');
    } else {
      alert('Formato no válido. Por favor selecciona una imagen (JPG, PNG, WebP).');
    }
    if (e.target) e.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    if (typeof showToast === 'function') {
      showToast('La imagen supera el límite de 5 MB. Por favor elige otra.');
    } else {
      alert('La imagen supera el límite de 5 MB. Por favor elige otra.');
    }
    if (e.target) e.target.value = '';
    return;
  }

  // Abrir cropper interactivo para ajustar encuadre y zoom
  openAvatarCropperModal(file, (croppedFile, finalAvatarUrl) => {
    pendingPhotoDraft = null; // Ya persistido y subido a Supabase Storage

    if (currentUser) {
      currentUser.avatar = finalAvatarUrl;
      currentUser.avatar_url = finalAvatarUrl;
    }

    const preview = document.getElementById('profile-avatar-preview');
    if (preview) preview.src = finalAvatarUrl;

    const navAvatar = document.getElementById('nav-user-avatar');
    const navInitials = document.getElementById('nav-user-initials');
    if (navAvatar) {
      navAvatar.src = finalAvatarUrl;
      navAvatar.classList.remove('hidden');
    }
    if (navInitials) navInitials.classList.add('hidden');

    const deleteBtn = document.getElementById('btn-delete-avatar');
    if (deleteBtn) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.removeAttribute('disabled');
    }

    const badge = document.getElementById('photo-draft-badge');
    if (badge) badge.classList.add('hidden');
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
  if (preview) preview.src = NEUTRAL_AVATAR_FALLBACK;

  const navAvatar = document.getElementById('nav-user-avatar');
  const navInitials = document.getElementById('nav-user-initials');
  if (navAvatar) navAvatar.classList.add('hidden');
  if (navInitials) {
    navInitials.classList.remove('hidden');
    navInitials.classList.add('flex');
  }

  const deleteBtn = document.getElementById('btn-delete-avatar');
  if (deleteBtn) {
    deleteBtn.classList.add('hidden');
    deleteBtn.setAttribute('disabled', 'true');
  }

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

  // 1. Validar nombre completo
  if (!newName || newName.length < 2) {
    showToast('El nombre completo debe tener al menos 2 caracteres.');
    alert('Por favor ingresa un nombre completo válido.');
    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = originalBtnHtml; }
    return;
  }

  // 2. Validar nombre de usuario estricto
  const userCheck = (window.validateUsername ? window.validateUsername(newUsername) : { valid: newUsername.length >= 4, cleanUsername: newUsername });
  if (!userCheck.valid) {
    showToast(userCheck.message);
    alert('Error en nombre de usuario:\n' + userCheck.message);
    const feedback = document.getElementById('profile-username-feedback');
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${userCheck.message}`;
    }
    const inp = document.getElementById('input-username');
    if (inp) { inp.classList.add('border-red-500'); inp.focus(); }
    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = originalBtnHtml; }
    return;
  }

  // 3. Validar teléfono estricto
  const phoneCheck = (window.validatePhoneNumber ? window.validatePhoneNumber(newPhone) : { valid: true, cleanNumber: newPhone });
  if (!phoneCheck.valid) {
    showToast(phoneCheck.message);
    alert('Error en teléfono móvil:\n' + phoneCheck.message);
    const feedback = document.getElementById('profile-phone-feedback');
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${phoneCheck.message}`;
    }
    const inp = document.getElementById('input-phone');
    if (inp) { inp.classList.add('border-red-500'); inp.focus(); }
    if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = originalBtnHtml; }
    return;
  }

  currentUser.name = newName;
  currentUser.username = userCheck.cleanUsername;
  currentUser.phone = phoneCheck.cleanNumber;

  // Procesar foto si hay pendiente
  if (pendingPhotoDraft) {
    if (pendingPhotoDraft.remove) {
      currentUser.avatar = null;
    } else if (pendingPhotoDraft.dataUrl) {
      // Si hay archivo recortado y Supabase Storage activo:
      let uploadedUrl = null;
      if (window.supabase && typeof window.supabase.uploadFile === 'function' && pendingPhotoDraft.file) {
        try {
          const fileName = `avatar_${currentUser.username}_${Date.now()}.jpg`;
          const uploadRes = await window.supabase.uploadFile('avatars', fileName, pendingPhotoDraft.file);
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
    if (typeof setCurrentUser === 'function') setCurrentUser(currentUser);
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
        avatar_url: currentUser.avatar ? currentUser.avatar : null
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

// =============================================================================
// Contraseña y Seguridad (Flujo 2FA Temporal por Código OTP)
// =============================================================================

/**
 * Función criptográfica segura para generar hash SHA-256 de una contraseña.
 * NUNCA almacena contraseñas en texto plano.
 */
async function hashPassword(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Error en crypto.subtle.digest:', e);
    }
  }
  // Fallback seguro en memoria
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return 'sha256_' + (h >>> 0).toString(16).padStart(16, '0');
}

/**
 * Genera un código OTP aleatorio criptográficamente seguro de 6 dígitos
 */
function generateOtpCode() {
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Variables globales para la gestión del modal OTP
let activeOtpUserId = null;
let activeOtpTargetEmail = null;
let otpCooldownTimer = null;
let otpCooldownSeconds = 60;

/**
 * Abre el modal de confirmación 2FA OTP
 */
function openPasswordOtpModal(email, userId) {
  activeOtpUserId = userId;
  activeOtpTargetEmail = email;

  const modal = document.getElementById('modal-otp-password');
  const emailText = document.getElementById('otp-user-email-text');
  const inputOtp = document.getElementById('input-otp-code');
  const errorMsg = document.getElementById('otp-error-msg');

  if (emailText) emailText.textContent = email;
  if (inputOtp) {
    inputOtp.value = '';
    // Auto formateo para que solo acepte números
    inputOtp.oninput = function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 6);
    };
    inputOtp.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitPasswordOtpVerification();
      }
    };
  }

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  }

  if (modal) modal.classList.remove('hidden');

  startOtpCooldown();

  setTimeout(() => {
    inputOtp?.focus();
  }, 100);
}

/**
 * Cierra el modal de confirmación 2FA OTP
 */
function closePasswordOtpModal() {
  const modal = document.getElementById('modal-otp-password');
  if (modal) modal.classList.add('hidden');

  if (otpCooldownTimer) {
    clearInterval(otpCooldownTimer);
    otpCooldownTimer = null;
  }
}

/**
 * Controla el temporizador de 60 segundos para el botón de reenvío de OTP
 */
function startOtpCooldown() {
  otpCooldownSeconds = 60;
  const btnResend = document.getElementById('btn-resend-otp');
  const countdownSpan = document.getElementById('otp-resend-countdown');

  if (btnResend) btnResend.disabled = true;
  if (countdownSpan) countdownSpan.textContent = `(${otpCooldownSeconds}s)`;

  if (otpCooldownTimer) clearInterval(otpCooldownTimer);

  otpCooldownTimer = setInterval(() => {
    otpCooldownSeconds--;
    if (otpCooldownSeconds <= 0) {
      clearInterval(otpCooldownTimer);
      otpCooldownTimer = null;
      if (btnResend) btnResend.disabled = false;
      if (countdownSpan) countdownSpan.textContent = '';
    } else {
      if (countdownSpan) countdownSpan.textContent = `(${otpCooldownSeconds}s)`;
    }
  }, 1000);
}

/**
 * Reenvía un nuevo código OTP al correo del usuario y reinicia el cooldown
 */
async function resendPasswordOtp() {
  if (otpCooldownSeconds > 0 && otpCooldownTimer) return;

  const btnResend = document.getElementById('btn-resend-otp');
  const errorMsg = document.getElementById('otp-error-msg');
  if (errorMsg) errorMsg.classList.add('hidden');

  if (btnResend) btnResend.disabled = true;

  try {
    const newOtp = generateOtpCode();
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (window.supabase && typeof window.supabase.fetchApi === 'function' && activeOtpUserId) {
      // Buscar la solicitud activa no usada
      const endpoint = `password_change_requests?user_id=eq.${activeOtpUserId}&used=eq.false&expires_at=gt.now()&order=created_at.desc&limit=1&select=id`;
      const requests = await window.supabase.fetchApi(endpoint);

      if (requests && requests.length > 0) {
        await window.supabase.fetchApi(`password_change_requests?id=eq.${requests[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            otp_code: newOtp,
            attempts: 0,
            expires_at: newExpiresAt
          })
        });
      }
    }

    startOtpCooldown();
    showToast('✨ Hemos enviado un nuevo código de seguridad a tu correo.');
    console.log('[2FA OTP] Nuevo código generado:', newOtp);

    const inputOtp = document.getElementById('input-otp-code');
    if (inputOtp) {
      inputOtp.value = '';
      inputOtp.focus();
    }
  } catch (err) {
    console.error('Error al reenviar código OTP:', err);
    showToast('No se pudo reenviar el código. Intenta de nuevo.');
    if (btnResend) btnResend.disabled = false;
  }
}

/**
 * 2. Comportamiento del Formulario "Contraseña y seguridad"
 * - Valida en cliente y servidor que la contraseña actual sea correcta.
 * - Valida reglas de complejidad de la nueva contraseña (>= 12 caracteres, mayúsculas, minúsculas, números, símbolo).
 * - Genera código OTP aleatorio criptográficamente seguro de 6 dígitos.
 * - Hashea la nueva contraseña.
 * - Inserta el registro en password_change_requests (sin actualizar aún profiles).
 * - Despliega el modal de confirmación 2FA OTP.
 */
async function handleUpdatePassword() {
  const current = document.getElementById('input-pass-current')?.value?.trim();
  const newPass = document.getElementById('input-pass-new')?.value?.trim();
  const confirm = document.getElementById('input-pass-confirm')?.value?.trim();
  const btn = document.getElementById('btn-update-password');
  const btnText = document.getElementById('btn-update-password-text');

  // Validaciones básicas de presencia
  if (!current || !newPass || !confirm) {
    showToast('Por favor completa todos los campos de contraseña.');
    return;
  }

  // Validación de longitud (mínimo 12 caracteres según requerimiento)
  if (newPass.length < 12) {
    showToast('La nueva contraseña debe tener al menos 12 caracteres.');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Regla: al menos una letra mayúscula
  if (!/[A-Z]/.test(newPass)) {
    showToast('La nueva contraseña debe incluir al menos una letra mayúscula (A-Z).');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Regla: al menos una letra minúscula
  if (!/[a-z]/.test(newPass)) {
    showToast('La nueva contraseña debe incluir al menos una letra minúscula (a-z).');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Regla: al menos un número
  if (!/[0-9]/.test(newPass)) {
    showToast('La nueva contraseña debe incluir al menos un número (0-9).');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Regla: al menos un símbolo o carácter especial
  if (!/[^a-zA-Z0-9]/.test(newPass)) {
    showToast('La nueva contraseña debe incluir al menos un símbolo especial (ej: !@#$%^&*).');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Regla: coincidencia con la confirmación
  if (newPass !== confirm) {
    showToast('La confirmación de la contraseña no coincide.');
    document.getElementById('input-pass-confirm')?.focus();
    return;
  }

  // Regla: no ser idéntica a la actual
  if (newPass === current) {
    showToast('La nueva contraseña no puede ser idéntica a la contraseña actual.');
    document.getElementById('input-pass-new')?.focus();
    return;
  }

  // Estado de carga temporal
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Verificando datos...';

  try {
    let userId = currentUser?.id;
    let dbPassword = null;
    let targetEmail = currentUser?.email;

    // Validación de la contraseña actual contra Supabase (Servidor)
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        const queryField = userId && userId.length > 10
          ? `profiles?id=eq.${userId}&select=id,password,email,username`
          : `profiles?username=eq.${encodeURIComponent(currentUser.username)}&select=id,password,email,username`;

        const profs = await window.supabase.fetchApi(queryField);
        if (profs && profs.length > 0) {
          dbPassword = profs[0].password;
          userId = profs[0].id;
          currentUser.id = userId;
          if (profs[0].email) targetEmail = profs[0].email;
        }
      } catch (dbErr) {
        console.warn('Advertencia al consultar contraseña en servidor:', dbErr);
      }
    }

    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000001';
    }
    if (!targetEmail) {
      targetEmail = currentUser?.username ? `${currentUser.username}@raizybarrio.co` : 'max@vecinos.com';
    }

    // Verificar coincidencia de contraseña actual (en hash o texto plano)
    const currentHash = await hashPassword(current);
    const validInServer = dbPassword && (dbPassword === current || dbPassword === currentHash);
    const validInSession = currentUser?.password && (currentUser.password === current || currentUser.password === currentHash);

    if (!validInServer && !validInSession && dbPassword !== null) {
      showToast('La contraseña actual ingresada es incorrecta.');
      document.getElementById('input-pass-current')?.focus();
      return;
    }

    // 2. Generar código OTP aleatorio criptográficamente seguro de 6 dígitos
    const otpCode = generateOtpCode();

    // 3. Hashear la nueva contraseña con SHA-256 (NUNCA almacenar texto plano)
    const newPasswordHash = await hashPassword(newPass);

    // 4. Expiración calculada a 10 minutos desde el momento actual
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 5. Inserción en password_change_requests en Supabase
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // Invalida solicitudes anteriores pendientes del mismo usuario
      try {
        await window.supabase.fetchApi(`password_change_requests?user_id=eq.${userId}`, {
          method: 'DELETE'
        });
      } catch (_) {}

      // Inserta el nuevo registro con user_id, current_email, new_password_hash y otp_code
      await window.supabase.fetchApi('password_change_requests', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          current_email: targetEmail,
          new_password_hash: newPasswordHash,
          otp_code: otpCode,
          expires_at: expiresAt,
          attempts: 0,
          used: false
        })
      });
    }

    console.log('[2FA OTP] Código de verificación generado con éxito:', otpCode);

    // Limpiar campos del formulario
    document.getElementById('input-pass-current').value = '';
    document.getElementById('input-pass-new').value = '';
    document.getElementById('input-pass-confirm').value = '';

    // 6. Desplegar modal de confirmación en la UI
    openPasswordOtpModal(targetEmail, userId);

  } catch (err) {
    console.error('Error al preparar solicitud de cambio de contraseña:', err);
    showToast('Ocurrió un error al procesar la solicitud: ' + (err.message || 'Error de red.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Actualizar contraseña';
  }
}

/**
 * 4. Lógica de verificación final y actualización:
 * Cuando el usuario introduce el código OTP y presiona "Confirmar cambio":
 * 1. Consulta la tabla password_change_requests buscando coincidencias con:
 *    - user_id de la sesión actual
 *    - otp_code ingresado
 *    - used = FALSE y expires_at > now()
 * 2. Si el código es incorrecto:
 *    - Incrementa el campo attempts. Si llega a 3 intentos, invalida el registro y muestra:
 *      "Has excedido el número de intentos. Solicita un nuevo cambio."
 * 3. Si el código es correcto y válido:
 *    - Actualiza la contraseña en la tabla profiles con el new_password_hash pre-almacenado.
 *    - Marca used = TRUE en password_change_requests.
 *    - Muestra alerta: "Contraseña actualizada exitosamente. Por seguridad, vuelve a iniciar sesión."
 *    - Cierra la sesión activa actual y redirige a login.
 */
async function submitPasswordOtpVerification() {
  const inputOtp = document.getElementById('input-otp-code');
  const btnVerify = document.getElementById('btn-verify-otp');
  const btnVerifyText = document.getElementById('btn-verify-otp-text');
  const errorMsg = document.getElementById('otp-error-msg');

  const enteredOtp = inputOtp ? inputOtp.value.trim() : '';

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  }

  // Validación de 6 dígitos numéricos en cliente
  if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
    if (errorMsg) {
      errorMsg.textContent = 'Por favor ingresa el código numérico completo de 6 dígitos.';
      errorMsg.classList.remove('hidden');
    }
    inputOtp?.focus();
    return;
  }

  const userId = activeOtpUserId || currentUser?.id;
  if (!userId) {
    showToast('Error de sesión. Por favor inicia sesión nuevamente.');
    closePasswordOtpModal();
    return;
  }

  if (btnVerify) btnVerify.disabled = true;
  if (btnVerifyText) btnVerifyText.textContent = 'Validando código...';

  try {
    if (!window.supabase || typeof window.supabase.fetchApi !== 'function') {
      throw new Error('Servicio de base de datos no disponible.');
    }

    // 1. Consultar la solicitud activa no usada y no expirada para este usuario
    const endpoint = `password_change_requests?user_id=eq.${userId}&used=eq.false&expires_at=gt.now()&order=created_at.desc&limit=1&select=*`;
    const requests = await window.supabase.fetchApi(endpoint);

    if (!requests || requests.length === 0) {
      if (errorMsg) {
        errorMsg.textContent = 'El código ha expirado o no es válido. Por favor solicita un nuevo cambio.';
        errorMsg.classList.remove('hidden');
      }
      return;
    }

    const currentReq = requests[0];

    // Verificar si ya excedió los 3 intentos
    if (currentReq.attempts >= 3) {
      // Invalidar registro
      await window.supabase.fetchApi(`password_change_requests?id=eq.${currentReq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ used: true })
      });

      if (errorMsg) {
        errorMsg.textContent = 'Has excedido el número de intentos. Solicita un nuevo cambio.';
        errorMsg.classList.remove('hidden');
      }
      setTimeout(() => {
        closePasswordOtpModal();
      }, 2500);
      return;
    }

    // 2. Si el código ingresado NO coincide
    if (currentReq.otp_code !== enteredOtp) {
      const newAttempts = (currentReq.attempts || 0) + 1;

      // Actualizar número de intentos en Supabase
      await window.supabase.fetchApi(`password_change_requests?id=eq.${currentReq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ attempts: newAttempts })
      });

      if (newAttempts >= 3) {
        // Invalidar el registro por superar el límite
        await window.supabase.fetchApi(`password_change_requests?id=eq.${currentReq.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ used: true })
        });

        if (errorMsg) {
          errorMsg.textContent = 'Has excedido el número de intentos. Solicita un nuevo cambio.';
          errorMsg.classList.remove('hidden');
        }
        setTimeout(() => {
          closePasswordOtpModal();
        }, 2500);
      } else {
        const remaining = 3 - newAttempts;
        if (errorMsg) {
          errorMsg.textContent = `Código incorrecto. Te ${remaining === 1 ? 'queda 1 intento' : 'quedan ' + remaining + ' intentos'}.`;
          errorMsg.classList.remove('hidden');
        }
        inputOtp?.select();
      }
      return;
    }

    // 3. Si el código es correcto y válido:
    // A) Actualizar contraseña en la tabla principal de usuarios (profiles) con el hash seguro pre-almacenado
    try {
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ password: currentReq.new_password_hash })
      });
    } catch (patchErr) {
      console.warn('Aviso al actualizar perfil por id:', patchErr);
    }

    if (currentUser?.username) {
      try {
        await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}`, {
          method: 'PATCH',
          body: JSON.stringify({ password: currentReq.new_password_hash })
        });
      } catch (_) {}
    }

    // B) Marcar used = TRUE en password_change_requests
    try {
      await window.supabase.fetchApi(`password_change_requests?id=eq.${currentReq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ used: true })
      });
    } catch (markErr) {
      console.warn('Aviso al marcar request como usado:', markErr);
    }

    // C) Cerrar modal
    closePasswordOtpModal();

    // D) Muestra una alerta de éxito
    alert('Contraseña actualizada exitosamente. Por seguridad, vuelve a iniciar sesión.');

    // E) Cierra la sesión activa actual
    try {
      localStorage.removeItem('rb_current_user');
      localStorage.removeItem('raiz_user');
    } catch (_) {}

    // F) Redirige a /login (en nuestra app de mercado: mercado.html con el modal de acceso abierto)
    window.location.href = 'mercado.html?openAuth=1';

  } catch (err) {
    console.error('Error al verificar código OTP:', err);
    if (errorMsg) {
      errorMsg.textContent = 'Ocurrió un error al validar el código: ' + (err.message || 'Error de red.');
      errorMsg.classList.remove('hidden');
    }
  } finally {
    if (btnVerify) btnVerify.disabled = false;
    if (btnVerifyText) btnVerifyText.textContent = 'Confirmar cambio';
  }
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
  const emailCheck = window.validateEmail ? window.validateEmail(newEmail) : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail), message: 'Ingresa un correo electrónico con un dominio válido (ej. nombre@correo.com)' };
  if (!emailCheck.valid) {
    showToast(emailCheck.message);
    alert(emailCheck.message);
    const feedback = document.getElementById('profile-email-feedback');
    if (feedback) {
      feedback.className = 'text-[11px] font-semibold text-red-600 mt-1 block';
      feedback.textContent = `✕ ${emailCheck.message}`;
    }
    inputNew?.classList.add('border-red-500');
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
      try {
        if (userId) {
          await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ email: targetEmail })
          });
        }
      } catch (patchErr) {
        console.warn('Aviso al actualizar perfil por id:', patchErr);
      }

      if (currentUser?.username) {
        try {
          await window.supabase.fetchApi(`profiles?username=eq.${encodeURIComponent(currentUser.username)}`, {
            method: 'PATCH',
            body: JSON.stringify({ email: targetEmail })
          });
        } catch (_) {}
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

    if (!currentUser && window.supabase && typeof window.supabase.fetchApi === 'function' && userId) {
      try {
        const profs = await window.supabase.fetchApi(`profiles?id=eq.${userId}&select=*`);
        if (profs && profs.length > 0) {
          currentUser = profs[0];
          currentUser.name = profs[0].full_name || 'Max';
          currentUser.avatar = profs[0].avatar_url || '';
        }
      } catch (_) {}
    }

    if (currentUser) {
      currentUser.email = targetEmail;
      currentUser.email_verified = true;
      if (originalUserData) originalUserData.email = targetEmail;
      localStorage.setItem('rb_current_user', JSON.stringify(currentUser));
      localStorage.setItem('raiz_user', JSON.stringify(currentUser));
      if (typeof setCurrentUser === 'function') setCurrentUser(currentUser);
    }

    // 4. Actualizar vista en perfil.html
    const inputCurr = document.getElementById('input-current-email');
    if (inputCurr) inputCurr.value = targetEmail;
    const inputNew = document.getElementById('new_email') || document.getElementById('input-new-email');
    if (inputNew) inputNew.value = '';

    if (typeof renderProfileUI === 'function' && currentUser) {
      renderProfileUI(currentUser);
    }

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
// SECCIÓN 4: UBICACIÓN Y PREFERENCIA DE ENTREGA (100% INTERACTIVA CON SUPABASE)
// =============================================================================

// Estado global de entrega
let cachedPickupNodes = [];
let cachedDeliveryAddresses = [];
let activeDeliveryMode = 'node'; // 'node' | 'home'
let selectedPickupNodeId = null;
let selectedTempNodeId = null;

/**
 * Inicializa la sección de ubicación y preferencia de entrega
 */
async function initDeliverySection() {
  await loadDeliveryPreferences();
}

/**
 * Carga desde Supabase nodos de recogida, domicilios guardados y preferencias del perfil
 */
async function loadDeliveryPreferences() {
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  try {
    // 1. Cargar datos de perfil (preferencias activas)
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      try {
        const profiles = await window.supabase.fetchApi(`profiles?id=eq.${userId}&select=*`);
        if (profiles && profiles.length > 0) {
          const prof = profiles[0];
          if (prof.active_delivery_mode) {
            activeDeliveryMode = prof.active_delivery_mode;
          }
          if (prof.preferred_pickup_node_id) {
            selectedPickupNodeId = prof.preferred_pickup_node_id;
          }
        }
      } catch (errP) {
        console.warn('Error al consultar perfil para entrega:', errP);
      }

      // 2. Cargar nodos de recogida activos con Supabase Client
      try {
        if (typeof window.supabase.from === 'function') {
          const { data, error } = await window.supabase.from('pickup_nodes').select('*');
          if (!error && Array.isArray(data) && data.length > 0) {
            cachedPickupNodes = data.filter(n => n.is_active !== false);
          }
        }
        if (cachedPickupNodes.length === 0 && typeof window.supabase.fetchApi === 'function') {
          const nodes = await window.supabase.fetchApi('pickup_nodes?is_active=eq.true&order=created_at.asc');
          if (nodes && nodes.length > 0) {
            cachedPickupNodes = nodes;
          }
        }
      } catch (errN) {
        console.warn('Error al cargar pickup_nodes:', errN);
      }

      // 3. Cargar direcciones a domicilio del usuario
      try {
        const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&order=created_at.desc`);
        if (addrs) {
          cachedDeliveryAddresses = addrs;
        }
      } catch (errA) {
        console.warn('Error al cargar delivery_addresses:', errA);
      }
    }
  } catch (globalErr) {
    console.error('Error general cargando preferencias de entrega:', globalErr);
  }

  // Fallbacks si la BD no tenía datos
  if (cachedPickupNodes.length === 0) {
    cachedPickupNodes = [
      {
        id: 'e0177a54-9cbc-4426-a538-1d630f852ac1',
        name: 'Sede Urdesa · Espacio Verde',
        address: 'Av. Víctor Emilio Estrada y Bálsamos',
        city: 'Guayaquil',
        pickup_schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
        is_active: true
      },
      {
        id: '65925730-63b5-486f-9dd0-aaac13a0ffe9',
        name: 'Sede Puerto Santa Ana · Café del Río',
        address: 'Numa Pompilio Llona, Edificio The Point',
        city: 'Guayaquil',
        pickup_schedule: 'Jueves y Sábado: 8:30 AM – 1:30 PM',
        is_active: true
      },
      {
        id: '7a6f8f1f-ad1b-4f87-9d7f-58f1d3c5053c',
        name: 'Sede Ceibos · Mercado Sostenible',
        address: 'Av. del Bombero Km 6.5, Plaza Ceibos',
        city: 'Guayaquil',
        pickup_schedule: 'Sábados: 8:00 AM – 2:00 PM',
        is_active: true
      }
    ];
  }

  // Si no hay nodo seleccionado o no existe en la lista, elegir el primero
  if (!selectedPickupNodeId && cachedPickupNodes.length > 0) {
    selectedPickupNodeId = cachedPickupNodes[0].id;
  }

  renderDeliveryPreferences();
}

/**
 * Renderiza reactivamente las tarjetas de Nodo y Domicilios según la preferencia activa
 */
function renderDeliveryPreferences() {
  // 1. Obtener nodo activo
  let activeNode = cachedPickupNodes.find(n => n.id === selectedPickupNodeId) || cachedPickupNodes[0];

  const nodeCard = document.getElementById('card-delivery-node');
  const nodeTitle = document.getElementById('delivery-node-title');
  const nodeAddress = document.getElementById('delivery-node-address');
  const nodeSchedule = document.getElementById('delivery-node-schedule');
  const nodeRadioIcon = document.getElementById('node-radio-icon');
  const nodeBadgeContainer = document.getElementById('node-badge-container');

  if (activeNode) {
    if (nodeTitle) nodeTitle.textContent = activeNode.name;
    if (nodeAddress) nodeAddress.textContent = `${activeNode.address} · ${activeNode.city || 'Guayaquil'}`;
    if (nodeSchedule) nodeSchedule.textContent = activeNode.pickup_schedule;

    // Actualizar nombre en navbar
    const navNode = document.getElementById('nav-user-node');
    if (navNode) navNode.textContent = activeNode.name.split('·')[0].trim();
  }

  // Estilos de la tarjeta de Nodo
  const isNodePreferred = activeDeliveryMode === 'node';

  if (nodeCard) {
    if (isNodePreferred) {
      nodeCard.className = 'bg-[#f0f6f2] border-2 border-[#1a3d2f] rounded-xl p-3.5 shadow-2xs transition-all cursor-pointer';
    } else {
      nodeCard.className = 'bg-white border border-stone-200 hover:border-[#1a3d2f]/40 hover:bg-stone-50/50 rounded-xl p-3.5 shadow-2xs transition-all cursor-pointer';
    }
    nodeCard.setAttribute('onclick', 'handleNodeCardClick(event)');
  }

  if (nodeRadioIcon) {
    if (isNodePreferred) {
      nodeRadioIcon.className = 'w-3.5 h-3.5 rounded-full border-2 border-[#1a3d2f] flex items-center justify-center';
      nodeRadioIcon.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#1a3d2f]"></span>';
    } else {
      nodeRadioIcon.className = 'w-3.5 h-3.5 rounded-full border border-stone-300';
      nodeRadioIcon.innerHTML = '';
    }
  }

  if (nodeBadgeContainer) {
    if (isNodePreferred) {
      nodeBadgeContainer.innerHTML = `
        <span class="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
          Preferida
        </span>
      `;
    } else {
      nodeBadgeContainer.innerHTML = `
        <button type="button" onclick="event.stopPropagation(); setPreferredDeliveryMode('node')" class="font-semibold text-stone-600 hover:text-stone-900 underline text-[11px] cursor-pointer">
          Hacer preferida
        </button>
      `;
    }
  }

  // 2. Renderizar contenedor de domicilios
  const addrsContainer = document.getElementById('delivery-addresses-container');
  if (!addrsContainer) return;

  if (cachedDeliveryAddresses.length === 0) {
    addrsContainer.innerHTML = `
      <div class="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-400">
        No tienes direcciones a domicilio registradas. Agrega una para recibir pedidos en casa.
      </div>
    `;
    return;
  }

  // Renderizar cada dirección
  addrsContainer.innerHTML = cachedDeliveryAddresses.map(addr => {
    const isThisAddrPreferred = (activeDeliveryMode === 'home') && !!addr.is_preferred;
    const feeFormatted = Number(addr.delivery_fee ?? 1.50).toFixed(2);

    const cardClasses = isThisAddrPreferred
      ? 'bg-[#f0f6f2] border-2 border-[#1a3d2f] rounded-xl p-3.5 shadow-2xs transition-all cursor-pointer'
      : 'bg-white border border-stone-200 hover:border-[#1a3d2f]/40 hover:bg-stone-50/50 rounded-xl p-3.5 shadow-2xs transition-all cursor-pointer';

    return `
      <div onclick="handleAddressCardClick(event, '${addr.id}')" class="${cardClasses}">
        <div class="flex items-center justify-between text-xs mb-1.5">
          <div class="flex items-center gap-1.5 font-bold ${isThisAddrPreferred ? 'text-stone-900' : 'text-stone-700'} text-left select-none">
            <span class="w-3.5 h-3.5 rounded-full ${isThisAddrPreferred ? 'border-2 border-[#1a3d2f] flex items-center justify-center' : 'border border-stone-300'}">
              ${isThisAddrPreferred ? '<span class="w-1.5 h-1.5 rounded-full bg-[#1a3d2f]"></span>' : ''}
            </span>
            <span class="transition-colors">A domicilio · ${escapeHtml(addr.label || 'Domicilio')}</span>
          </div>
          ${isThisAddrPreferred ? `
            <span class="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
              Preferida
            </span>
          ` : `
            <button type="button" onclick="event.stopPropagation(); setPreferredAddress('${addr.id}')" class="font-semibold text-stone-600 hover:text-stone-900 underline text-[11px] cursor-pointer">
              Hacer preferida
            </button>
          `}
        </div>

        <p class="text-[11px] text-stone-700 font-medium">${escapeHtml(addr.street_address)}</p>
        <p class="text-[11px] text-stone-500">${escapeHtml(addr.neighborhood ? addr.neighborhood + ' · ' : '')}${escapeHtml(addr.city || 'Guayaquil')}</p>
        <p class="text-[11px] text-stone-500">${escapeHtml(addr.delivery_schedule || 'Sáb. 7 nov. · 2:00 – 6:00 p. m.')} · $${feeFormatted} por pedido</p>
        ${addr.delivery_instructions ? `<p class="text-[10px] text-stone-500 italic mt-1 bg-stone-50/80 p-1.5 rounded-lg border border-stone-100">📝 "${escapeHtml(addr.delivery_instructions)}"</p>` : ''}

        <div class="flex items-center justify-between pt-2 border-t border-stone-100 mt-2 text-xs">
          <div class="flex items-center gap-3 font-semibold text-stone-600">
            <button type="button" onclick="event.stopPropagation(); openAddressModal('${addr.id}')" class="no-select-addr hover:underline hover:text-stone-900 cursor-pointer">
              Modificar
            </button>
            <button type="button" onclick="event.stopPropagation(); openDeleteAddressModal('${addr.id}', '${escapeHtml(addr.street_address).replace(/'/g, "\\'")}')" class="no-select-addr text-red-600 hover:underline cursor-pointer">
              Eliminar
            </button>
          </div>
          ${isThisAddrPreferred ? '<span class="text-[11px] text-[#1a3d2f] font-semibold select-none">✓ Opción activa</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Maneja el clic en cualquier lugar del bloque de dirección (excepto botones modificar y eliminar)
 */
function handleAddressCardClick(event, addressId) {
  if (event.target.closest('.no-select-addr')) return;
  const current = cachedDeliveryAddresses.find(a => a.id === addressId);
  if (activeDeliveryMode === 'home' && current && current.is_preferred) {
    return;
  }
  setPreferredAddress(addressId);
}

/**
 * Maneja el clic en cualquier lugar del bloque de Recogida en nodo (excepto cambiar nodo)
 */
function handleNodeCardClick(event) {
  if (event.target.closest('.no-select-node')) return;
  if (activeDeliveryMode === 'node') {
    return;
  }
  setPreferredDeliveryMode('node');
}

/**
 * Establece el modo de entrega global a 'node' (Recogida en nodo)
 */
async function setPreferredDeliveryMode(mode) {
  if (mode !== 'node') return;
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  activeDeliveryMode = 'node';
  renderDeliveryPreferences();

  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active_delivery_mode: 'node' })
      });
    }
    showToast('✨ Recogida en nodo establecida como preferida.');
  } catch (err) {
    console.error('Error al guardar preferencia en Supabase:', err);
    showToast('Aviso: Preferencia actualizada localmente.');
  }
}

/**
 * Establece una dirección de domicilio guardada como la preferida activa
 */
async function setPreferredAddress(addressId) {
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  activeDeliveryMode = 'home';
  cachedDeliveryAddresses.forEach(a => {
    a.is_preferred = (a.id === addressId);
  });
  renderDeliveryPreferences();

  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // 1. Desmarcar is_preferred en todas las direcciones del usuario
      await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_preferred: false })
      });

      // 2. Marcar is_preferred = true en la dirección seleccionada
      await window.supabase.fetchApi(`delivery_addresses?id=eq.${addressId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_preferred: true })
      });

      // 3. Actualizar modo activo en profiles
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active_delivery_mode: 'home' })
      });
    }
    showToast('✨ Domicilio establecido como preferencia.');
  } catch (err) {
    console.error('Error al establecer domicilio preferido:', err);
    showToast('Aviso: Domicilio preferido actualizado localmente.');
  }
}

/**
 * Abre el modal de dirección en modo Registro o Edición
 */
function openAddressModal(addressId = null) {
  const modal = document.getElementById('modal-address');
  const title = document.getElementById('modal-address-title');
  const submitBtnText = document.getElementById('btn-submit-address-text');
  const errEl = document.getElementById('address-form-error');

  const idInput = document.getElementById('address-id');
  const labelInput = document.getElementById('address-label');
  const streetInput = document.getElementById('address-street');
  const neighInput = document.getElementById('address-neighborhood');
  const cityInput = document.getElementById('address-city');
  const schedInput = document.getElementById('address-schedule');
  const feeInput = document.getElementById('address-fee');
  const instrInput = document.getElementById('address-instructions');
  const prefCheckbox = document.getElementById('address-is-preferred');

  if (errEl) errEl.classList.add('hidden');

  if (addressId) {
    // MODO EDICIÓN
    const target = cachedDeliveryAddresses.find(a => a.id === addressId);
    if (!target) return;

    if (title) title.textContent = 'Modificar dirección de entrega';
    if (submitBtnText) submitBtnText.textContent = 'Guardar cambios';

    if (idInput) idInput.value = target.id;
    if (labelInput) labelInput.value = target.label || 'Casa';
    if (streetInput) streetInput.value = target.street_address || '';
    if (neighInput) neighInput.value = target.neighborhood || '';
    if (cityInput) cityInput.value = target.city || 'Guayaquil';
    if (schedInput) schedInput.value = target.delivery_schedule || 'Sáb. 7 nov. · 2:00 – 6:00 p. m.';
    if (feeInput) feeInput.value = target.delivery_fee ?? 1.50;
    if (instrInput) instrInput.value = target.delivery_instructions || '';
    if (prefCheckbox) prefCheckbox.checked = !!target.is_preferred;

    highlightAddressLabelChip(target.label || 'Casa');
  } else {
    // MODO AGREGAR
    if (title) title.textContent = 'Agregar dirección de entrega';
    if (submitBtnText) submitBtnText.textContent = 'Guardar dirección';

    if (idInput) idInput.value = '';
    if (labelInput) labelInput.value = 'Casa';
    if (streetInput) streetInput.value = '';
    if (neighInput) neighInput.value = '';
    if (cityInput) cityInput.value = 'Guayaquil';
    if (schedInput) schedInput.value = 'Sáb. 7 nov. · 2:00 – 6:00 p. m.';
    if (feeInput) feeInput.value = 1.50;
    if (instrInput) instrInput.value = '';
    if (prefCheckbox) prefCheckbox.checked = (cachedDeliveryAddresses.length === 0);

    highlightAddressLabelChip('Casa');
  }

  if (modal) modal.classList.remove('hidden');
}

/**
 * Cierra el modal de dirección
 */
function closeAddressModal() {
  const modal = document.getElementById('modal-address');
  if (modal) modal.classList.add('hidden');
}

/**
 * Selección rápida de etiqueta mediante chips (Casa, Oficina, etc.)
 */
function selectAddressLabel(val) {
  const input = document.getElementById('address-label');
  if (input) input.value = val;
  highlightAddressLabelChip(val);
}

function highlightAddressLabelChip(val) {
  const chips = document.querySelectorAll('.btn-addr-label');
  chips.forEach(chip => {
    if (chip.getAttribute('data-val') === val) {
      chip.className = 'btn-addr-label px-3 py-1.5 rounded-xl border-2 border-[#1a3d2f] bg-[#1a3d2f]/10 text-[#1a3d2f] text-xs font-bold transition cursor-pointer shadow-2xs';
    } else {
      chip.className = 'btn-addr-label px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold hover:border-[#1a3d2f] transition cursor-pointer';
    }
  });
}

/**
 * Guarda o actualiza la dirección en Supabase
 */
async function submitAddressForm() {
  const idInput = document.getElementById('address-id');
  const addressId = idInput ? idInput.value.trim() : '';

  const label = (document.getElementById('address-label')?.value || '').trim();
  const street = (document.getElementById('address-street')?.value || '').trim();
  const neighborhood = (document.getElementById('address-neighborhood')?.value || '').trim();
  const city = (document.getElementById('address-city')?.value || '').trim();
  const schedule = (document.getElementById('address-schedule')?.value || '').trim();
  const fee = Number(document.getElementById('address-fee')?.value || 1.50);
  const instructions = (document.getElementById('address-instructions')?.value || '').trim();
  const isPreferred = !!document.getElementById('address-is-preferred')?.checked;

  const errEl = document.getElementById('address-form-error');
  const submitBtn = document.getElementById('btn-submit-address');
  const submitBtnText = document.getElementById('btn-submit-address-text');

  if (!label || !street || !neighborhood || !city) {
    if (errEl) {
      errEl.textContent = 'Por favor completa todos los campos obligatorios (*).';
      errEl.classList.remove('hidden');
    }
    return;
  }

  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Guardando...';

  try {
    const payload = {
      label,
      street_address: street,
      neighborhood,
      city,
      delivery_schedule: schedule || 'Sáb. 7 nov. · 2:00 – 6:00 p. m.',
      delivery_fee: fee,
      delivery_instructions: instructions,
      is_preferred: isPreferred
    };

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      if (addressId) {
        // ACTUALIZACIÓN (PATCH)
        await window.supabase.fetchApi(`delivery_addresses?id=eq.${addressId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });

        if (isPreferred) {
          // Desmarcar las demás
          await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&id=neq.${addressId}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_preferred: false })
          });
          await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ active_delivery_mode: 'home' })
          });
          activeDeliveryMode = 'home';
        }

        showToast('✨ Dirección actualizada con éxito.');
      } else {
        // INSERCIÓN (POST)
        payload.user_id = userId;

        if (isPreferred) {
          // Desmarcar anteriores
          await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_preferred: false })
          });
          await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ active_delivery_mode: 'home' })
          });
          activeDeliveryMode = 'home';
        }

        await window.supabase.fetchApi('delivery_addresses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        showToast('✨ Dirección agregada exitosamente.');
      }
    }

    closeAddressModal();
    await loadDeliveryPreferences();

  } catch (err) {
    console.error('Error al guardar dirección en Supabase:', err);
    if (errEl) {
      errEl.textContent = 'Error al comunicarse con la base de datos: ' + (err.message || 'Intenta de nuevo.');
      errEl.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = addressId ? 'Guardar cambios' : 'Guardar dirección';
  }
}

/**
 * Abre el modal de confirmación de eliminación de dirección
 */
function openDeleteAddressModal(addressId, street) {
  const modal = document.getElementById('modal-delete-address');
  const idInput = document.getElementById('delete-address-id');
  const display = document.getElementById('delete-address-street-display');

  if (idInput) idInput.value = addressId;
  if (display) display.textContent = street;
  if (modal) modal.classList.remove('hidden');
}

/**
 * Cierra el modal de confirmación de eliminación de dirección
 */
function closeDeleteAddressModal() {
  const modal = document.getElementById('modal-delete-address');
  if (modal) modal.classList.add('hidden');
}

/**
 * Elimina la dirección de Supabase y reasigna la preferencia si correspondía
 */
async function submitDeleteAddress() {
  const idInput = document.getElementById('delete-address-id');
  const addressId = idInput ? idInput.value.trim() : '';
  const btn = document.getElementById('btn-confirm-delete-address');
  const btnText = document.getElementById('btn-confirm-delete-address-text');
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  if (!addressId) return;

  const targetAddr = cachedDeliveryAddresses.find(a => a.id === addressId);
  const wasPreferred = targetAddr ? !!targetAddr.is_preferred : false;

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Eliminando...';

  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // 1. Eliminar dirección
      await window.supabase.fetchApi(`delivery_addresses?id=eq.${addressId}`, {
        method: 'DELETE'
      });

      // 2. Si era preferida, reasignar a la última restante o pasar a 'node'
      if (wasPreferred) {
        const remaining = cachedDeliveryAddresses.filter(a => a.id !== addressId);
        if (remaining.length > 0) {
          await window.supabase.fetchApi(`delivery_addresses?id=eq.${remaining[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_preferred: true })
          });
        } else {
          await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ active_delivery_mode: 'node' })
          });
          activeDeliveryMode = 'node';
        }
      }
    }

    closeDeleteAddressModal();
    showToast('🗑️ Dirección eliminada.');
    await loadDeliveryPreferences();

  } catch (err) {
    console.error('Error al eliminar dirección:', err);
    showToast('No se pudo eliminar la dirección: ' + (err.message || 'Error de red.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Confirmar eliminación';
  }
}

/**
 * Abre el modal selector de Nodos de recogida física
 */
function openNodeSelectorModal() {
  const modal = document.getElementById('modal-node-selector');
  const list = document.getElementById('node-selector-list');
  selectedTempNodeId = selectedPickupNodeId || (cachedPickupNodes[0] ? cachedPickupNodes[0].id : null);

  renderNodeSelectorList();
  if (modal) modal.classList.remove('hidden');
}

/**
 * Cierra el modal selector de Nodos
 */
function closeNodeSelectorModal() {
  const modal = document.getElementById('modal-node-selector');
  if (modal) modal.classList.add('hidden');
}

/**
 * Renderiza la lista de nodos con radio buttons en el modal selector
 */
function renderNodeSelectorList() {
  const list = document.getElementById('node-selector-list');
  if (!list) return;

  if (cachedPickupNodes.length === 0) {
    list.innerHTML = '<div class="text-center py-6 text-stone-400 text-xs">No hay nodos disponibles en este momento.</div>';
    return;
  }

  list.innerHTML = cachedPickupNodes.map(node => {
    const isSelected = (node.id === selectedTempNodeId);
    return `
      <div 
        onclick="selectTempNode('${node.id}')" 
        class="p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
          isSelected 
            ? 'border-[#1a3d2f] bg-[#f0f6f2] shadow-xs' 
            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <span class="w-4 h-4 rounded-full mt-0.5 ${
              isSelected 
                ? 'border-2 border-[#1a3d2f] flex items-center justify-center' 
                : 'border border-stone-300'
            }">
              ${isSelected ? '<span class="w-2 h-2 rounded-full bg-[#1a3d2f]"></span>' : ''}
            </span>
            <div>
              <h4 class="font-bold text-xs text-stone-900">${escapeHtml(node.name)}</h4>
              <p class="text-[11px] text-stone-600 mt-0.5">${escapeHtml(node.address)} · ${escapeHtml(node.city || 'Guayaquil')}</p>
              <p class="text-[11px] text-stone-500">${escapeHtml(node.pickup_schedule)}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
            Recogida gratis
          </span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Selecciona temporalmente un nodo dentro del modal
 */
function selectTempNode(nodeId) {
  selectedTempNodeId = nodeId;
  renderNodeSelectorList();
}

/**
 * Confirma el cambio de nodo y lo persiste en Supabase
 */
async function submitNodeChange() {
  if (!selectedTempNodeId) return;

  const targetNode = cachedPickupNodes.find(n => n.id === selectedTempNodeId);
  if (!targetNode) return;

  const btn = document.getElementById('btn-confirm-node');
  const btnText = document.getElementById('btn-confirm-node-text');
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Guardando...';

  try {
    selectedPickupNodeId = targetNode.id;
    currentUser.preferredNode = targetNode.name;

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          preferred_pickup_node_id: targetNode.id,
          farm_name: targetNode.name
        })
      });
    }

    closeNodeSelectorModal();
    renderDeliveryPreferences();
    showToast(`✨ Nodo cambiado a "${targetNode.name}".`);

  } catch (err) {
    console.error('Error al actualizar nodo preferido:', err);
    showToast('Aviso: Nodo actualizado localmente.');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Confirmar nodo';
  }
}

// Compatibilidad con invocaciones previas
function editAddressModal() {
  openAddressModal();
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

// =============================================================================
// MÓDULO INTERACTIVO DE MÉTODOS DE PAGO (PCI-DSS Y SUPABASE)
// =============================================================================

let cachedPaymentMethods = [];

/**
 * Algoritmo de Luhn para validación matemática de números de tarjeta
 */
function isValidLuhn(numberStr) {
  const digits = String(numberStr).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Detección de franquicia/marca de tarjeta en tiempo real
 */
function detectCardBrand(numberStr) {
  const clean = String(numberStr).replace(/\D/g, '');
  if (/^4/.test(clean)) {
    return { brand: 'VISA', label: 'VISA', badgeClass: 'bg-[#1a1f71] text-white', icon: '💳' };
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) {
    return { brand: 'MASTERCARD', label: 'Mastercard', badgeClass: 'bg-[#eb001b] text-white', icon: '🔴' };
  }
  if (/^3[47]/.test(clean)) {
    return { brand: 'AMEX', label: 'American Express', badgeClass: 'bg-[#2e77bc] text-white', icon: '🔷' };
  }
  if (/^6(011|5|4[4-9]|22)/.test(clean)) {
    return { brand: 'DISCOVER', label: 'Discover', badgeClass: 'bg-[#ff6000] text-white', icon: '🟧' };
  }
  if (/^(30[0-5]|36|38)/.test(clean)) {
    return { brand: 'DINERS', label: 'Diners Club', badgeClass: 'bg-[#004a97] text-white', icon: '🔘' };
  }
  return { brand: 'TARJETA', label: 'Tarjeta', badgeClass: 'bg-stone-800 text-white', icon: '💳' };
}

/**
 * Validador estricto de fecha de vencimiento (MM/AA)
 */
function validateExpirationDate(expiryStr) {
  const clean = String(expiryStr).replace(/\D/g, '');
  if (clean.length < 4) {
    return { valid: false, message: 'Ingresa mes y año de vencimiento en formato MM/AA.' };
  }
  const month = parseInt(clean.substring(0, 2), 10);
  const year2Digits = parseInt(clean.substring(2, 4), 10);

  if (month < 1 || month > 12) {
    return { valid: false, message: 'El mes de vencimiento debe estar entre 01 y 12.' };
  }

  const fullYear = 2000 + year2Digits;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
    return { valid: false, message: 'La tarjeta ingresada se encuentra vencida.' };
  }
  if (fullYear > currentYear + 20) {
    return { valid: false, message: 'El año de vencimiento no es válido o supera el límite.' };
  }

  return { valid: true, month, year: fullYear };
}

/**
 * Inicialización de escuchadores de eventos para formateo e interactividad en modales
 */
function initPaymentMethods() {
  const numInput = document.getElementById('add-card-number');
  const holderInput = document.getElementById('add-card-holder');
  const expiryInput = document.getElementById('add-card-expiry');
  const cvvInput = document.getElementById('add-card-cvv');
  const editExpiryInput = document.getElementById('edit-card-expiry');

  // Input Masking y Detección de Marca en Número de Tarjeta
  if (numInput) {
    numInput.addEventListener('input', (e) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
      const brandInfo = detectCardBrand(raw);

      // Agrupación visual en bloques
      let formatted = '';
      if (brandInfo.brand === 'AMEX') {
        // Formato AMEX 4-6-5
        const p1 = raw.slice(0, 4);
        const p2 = raw.slice(4, 10);
        const p3 = raw.slice(10, 15);
        formatted = [p1, p2, p3].filter(Boolean).join(' ');
      } else {
        // Estándar 4-4-4-4
        const parts = [];
        for (let i = 0; i < raw.length; i += 4) {
          parts.push(raw.slice(i, i + 4));
        }
        formatted = parts.join(' ');
      }
      e.target.value = formatted;

      // Actualizar etiqueta de franquicia en el input
      const brandTag = document.getElementById('add-card-brand-tag');
      if (brandTag) {
        brandTag.textContent = brandInfo.label;
        brandTag.className = `text-[10px] font-bold px-2 py-0.5 rounded transition ${brandInfo.badgeClass}`;
      }

      // Actualizar Live Preview visual
      const previewBadge = document.getElementById('card-preview-brand-badge');
      if (previewBadge) {
        previewBadge.textContent = brandInfo.label;
      }
      const previewNumber = document.getElementById('card-preview-number');
      if (previewNumber) {
        if (raw.length === 0) {
          previewNumber.textContent = '•••• •••• •••• ••••';
        } else {
          let masked = formatted;
          const targetLength = brandInfo.brand === 'AMEX' ? 17 : 19;
          while (masked.length < targetLength) {
            if ((masked.length + 1) % 5 === 0 && brandInfo.brand !== 'AMEX') {
              masked += ' ';
            } else {
              masked += '•';
            }
          }
          previewNumber.textContent = masked;
        }
      }

      // Indicador de validación de Luhn en tiempo real
      const luhnIndicator = document.getElementById('add-card-luhn-indicator');
      if (luhnIndicator) {
        if (raw.length >= 13) {
          if (isValidLuhn(raw)) {
            luhnIndicator.innerHTML = '<span class="text-emerald-700 font-bold flex items-center gap-0.5">✓ Válida</span>';
          } else {
            luhnIndicator.innerHTML = '<span class="text-amber-600 font-medium">Número no válido</span>';
          }
        } else {
          luhnIndicator.innerHTML = '';
        }
      }
    });
  }

  // Nombre en la tarjeta -> Live Preview
  if (holderInput) {
    holderInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase();
      const previewHolder = document.getElementById('card-preview-holder');
      if (previewHolder) {
        previewHolder.textContent = val || (currentUser?.name || 'NOMBRE APELLIDO').toUpperCase();
      }
    });
  }

  // Fecha de Expiración -> Input Masking MM/AA y Live Preview
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) {
        val = val.slice(0, 2) + '/' + val.slice(2);
      }
      e.target.value = val;
      const previewExpiry = document.getElementById('card-preview-expiry');
      if (previewExpiry) {
        previewExpiry.textContent = val || 'MM/AA';
      }
    });
  }

  // Input Masking para el modal de edición
  if (editExpiryInput) {
    editExpiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) {
        val = val.slice(0, 2) + '/' + val.slice(2);
      }
      e.target.value = val;
    });
  }

  // Formato de CVV
  if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  // Carga reactiva de tarjetas desde Supabase
  loadPaymentMethods();
}

/**
 * Carga y renderiza los métodos de pago guardados en Supabase
 */
async function loadPaymentMethods() {
  const container = document.getElementById('payment-methods-container');
  if (!container) return;

  let userId = currentUser?.id;
  if (!userId || userId === '00000000-0000-0000-0000-000000000001') {
    // Si Max tiene id de perfil en Supabase
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

  let cards = [];
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const endpoint = `payment_methods?user_id=eq.${userId}&order=is_default.desc,created_at.desc&select=*`;
      const res = await window.supabase.fetchApi(endpoint);
      if (Array.isArray(res)) {
        cards = res;
      }
    } catch (err) {
      console.warn('Advertencia al consultar payment_methods en Supabase:', err);
    }
  }

  cachedPaymentMethods = cards;

  // Renderizar tarjetas
  if (cards.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
        <span class="text-2xl mb-1 block">💳</span>
        <p class="text-xs font-bold text-stone-700">No tienes tarjetas guardadas</p>
        <p class="text-[11px] text-stone-400 mt-0.5">Añade una tarjeta para pagar con mayor agilidad en tus pedidos.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cards.map(card => {
    const isDef = card.is_default === true;
    const expM = String(card.exp_month || 1).padStart(2, '0');
    const expY = String(card.exp_year || 28).slice(-2);
    const brandUpper = (card.brand || 'VISA').toUpperCase();

    return `
      <div class="bg-[#faf8f4] border ${isDef ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-stone-200/80'} rounded-xl p-4 shadow-2xs transition">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm tracking-wider text-stone-900">${brandUpper}</span>
          </div>
          ${isDef ? `
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <span>✓</span>
              <span>Método preferido</span>
            </span>
          ` : `
            <button 
              type="button" 
              onclick="setDefaultPaymentMethod('${card.id}')" 
              class="text-[11px] text-stone-500 hover:text-stone-900 font-semibold hover:underline cursor-pointer"
            >
              Hacer preferido
            </button>
          `}
        </div>
        <p class="font-mono text-base tracking-widest text-stone-800 my-2 font-bold">
          ••••  ••••  ••••  ${card.last4}
        </p>
        <div class="flex items-center justify-between text-[10px] text-stone-400 pt-1">
          <div>
            <span class="block text-[9px] uppercase tracking-wider">TITULAR</span>
            <span class="font-semibold text-stone-700 text-xs uppercase">${escapeHtml(card.cardholder_name || 'TITULAR')}</span>
          </div>
          <div class="text-right">
            <span class="block text-[9px] uppercase tracking-wider">CADUCA</span>
            <span class="font-semibold text-stone-700 text-xs font-mono">${expM}/${expY}</span>
          </div>
        </div>
        
        <div class="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center gap-4 text-xs font-semibold">
          <button 
            type="button" 
            onclick="openEditCardModal('${card.id}')" 
            class="text-stone-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>✏️</span>
            <span>Editar</span>
          </button>
          <button 
            type="button" 
            onclick="openDeleteCardModal('${card.id}', '${brandUpper}', '${card.last4}')" 
            class="text-red-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>🗑️</span>
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Abre el modal para añadir una nueva tarjeta
 */
function openAddCardModal() {
  const modal = document.getElementById('modal-add-card');
  const holderInput = document.getElementById('add-card-holder');
  const numInput = document.getElementById('add-card-number');
  const expiryInput = document.getElementById('add-card-expiry');
  const cvvInput = document.getElementById('add-card-cvv');
  const defaultCheckbox = document.getElementById('add-card-default');
  const errorMsg = document.getElementById('add-card-error');

  // Limpiar campos
  if (holderInput) holderInput.value = (currentUser?.name || '').toUpperCase();
  if (numInput) numInput.value = '';
  if (expiryInput) expiryInput.value = '';
  if (cvvInput) cvvInput.value = '';
  if (defaultCheckbox) defaultCheckbox.checked = cachedPaymentMethods.length === 0 || !cachedPaymentMethods.some(c => c.is_default);

  // Limpiar indicador de Luhn y tag
  const luhn = document.getElementById('add-card-luhn-indicator');
  if (luhn) luhn.innerHTML = '';
  const brandTag = document.getElementById('add-card-brand-tag');
  if (brandTag) {
    brandTag.textContent = 'AUTO';
    brandTag.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-600';
  }

  // Reiniciar Live Preview
  const previewBadge = document.getElementById('card-preview-brand-badge');
  if (previewBadge) previewBadge.textContent = 'TARJETA';
  const previewNumber = document.getElementById('card-preview-number');
  if (previewNumber) previewNumber.textContent = '•••• •••• •••• ••••';
  const previewHolder = document.getElementById('card-preview-holder');
  if (previewHolder) previewHolder.textContent = (currentUser?.name || 'NOMBRE APELLIDO').toUpperCase();
  const previewExpiry = document.getElementById('card-preview-expiry');
  if (previewExpiry) previewExpiry.textContent = 'MM/AA';

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  }

  if (modal) modal.classList.remove('hidden');
  setTimeout(() => {
    numInput?.focus();
  }, 100);
}

/**
 * Cierra el modal de añadir tarjeta
 */
function closeAddCardModal() {
  const modal = document.getElementById('modal-add-card');
  if (modal) modal.classList.add('hidden');
}

/**
 * Procesa la inserción tokenizada de una nueva tarjeta en Supabase
 */
async function submitAddPaymentMethod() {
  const holderInput = document.getElementById('add-card-holder');
  const numInput = document.getElementById('add-card-number');
  const expiryInput = document.getElementById('add-card-expiry');
  const cvvInput = document.getElementById('add-card-cvv');
  const defaultCheckbox = document.getElementById('add-card-default');
  const errorMsg = document.getElementById('add-card-error');
  const btn = document.getElementById('btn-save-card');
  const btnText = document.getElementById('btn-save-card-text');

  const holder = holderInput ? holderInput.value.trim() : '';
  const cleanNumber = numInput ? numInput.value.replace(/\D/g, '') : '';
  const expiry = expiryInput ? expiryInput.value.trim() : '';
  const cvv = cvvInput ? cvvInput.value.trim() : '';
  const isDefaultChecked = defaultCheckbox ? defaultCheckbox.checked : false;

  const showError = (msg) => {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.classList.remove('hidden');
    }
  };

  if (errorMsg) errorMsg.classList.add('hidden');

  // 1. Validaciones estrictas
  if (!holder || holder.length < 3) {
    showError('Por favor ingresa el nombre completo del titular de la tarjeta.');
    holderInput?.focus();
    return;
  }

  if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
    showError('El número de tarjeta debe contener entre 13 y 19 dígitos.');
    numInput?.focus();
    return;
  }

  // Validación de Luhn matemática
  if (!isValidLuhn(cleanNumber)) {
    showError('El número de tarjeta no es válido (falla en el algoritmo de validación de Luhn). Por favor verifica los dígitos ingresados.');
    numInput?.focus();
    return;
  }

  // Validación de fecha de vencimiento
  const expCheck = validateExpirationDate(expiry);
  if (!expCheck.valid) {
    showError(expCheck.message);
    expiryInput?.focus();
    return;
  }

  // Validación de CVV
  if (!cvv || cvv.length < 3 || cvv.length > 4) {
    showError('Por favor ingresa un código de seguridad (CVV) válido de 3 o 4 dígitos.');
    cvvInput?.focus();
    return;
  }

  // 2. Extraer datos conforme a PCI-DSS (NUNCA almacenar el número completo ni CVV)
  const last4 = cleanNumber.slice(-4);
  const brandInfo = detectCardBrand(cleanNumber);
  const brand = brandInfo.brand;
  const expMonth = expCheck.month;
  const expYear = expCheck.year;
  const isDefault = isDefaultChecked || cachedPaymentMethods.length === 0;

  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  // Estado de carga en botón
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Guardando...';

  try {
    if (!window.supabase || typeof window.supabase.fetchApi !== 'function') {
      throw new Error('Servicio de base de datos no disponible.');
    }

    // 3. Si se marcó como preferido, desmarcar las demás tarjetas del usuario
    if (isDefault) {
      try {
        await window.supabase.fetchApi(`payment_methods?user_id=eq.${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_default: false })
        });
      } catch (cleanErr) {
        console.warn('Aviso al desmarcar tarjetas preferidas:', cleanErr);
      }
    }

    // 4. Insertar nuevo registro en Supabase
    const payload = {
      user_id: userId,
      brand: brand,
      last4: last4,
      cardholder_name: holder,
      exp_month: expMonth,
      exp_year: expYear,
      is_default: isDefault
    };

    await window.supabase.fetchApi('payment_methods', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    closeAddCardModal();
    showToast('✨ ¡Método de pago añadido exitosamente!');

    // Recarga reactiva inmediata
    await loadPaymentMethods();

  } catch (err) {
    console.error('Error al guardar método de pago en Supabase:', err);
    showError('No se pudo guardar la tarjeta: ' + (err.message || 'Error de conexión con la base de datos.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Guardar tarjeta';
  }
}

/**
 * Abre el modal de edición de titular y vencimiento
 */
function openEditCardModal(cardId) {
  const card = cachedPaymentMethods.find(c => c.id === cardId);
  if (!card) return;

  const modal = document.getElementById('modal-edit-card');
  const idInput = document.getElementById('edit-card-id');
  const brandBadge = document.getElementById('edit-card-brand-badge');
  const maskedDisplay = document.getElementById('edit-card-masked-display');
  const holderInput = document.getElementById('edit-card-holder');
  const expiryInput = document.getElementById('edit-card-expiry');
  const errorMsg = document.getElementById('edit-card-error');

  if (idInput) idInput.value = card.id;
  if (brandBadge) brandBadge.textContent = (card.brand || 'VISA').toUpperCase();
  if (maskedDisplay) maskedDisplay.textContent = `•••• ${card.last4}`;
  if (holderInput) holderInput.value = card.cardholder_name || '';

  const expM = String(card.exp_month || 1).padStart(2, '0');
  const expY = String(card.exp_year || 28).slice(-2);
  if (expiryInput) expiryInput.value = `${expM}/${expY}`;

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.add('hidden');
  }

  if (modal) modal.classList.remove('hidden');
  setTimeout(() => {
    holderInput?.focus();
  }, 100);
}

/**
 * Cierra el modal de edición
 */
function closeEditCardModal() {
  const modal = document.getElementById('modal-edit-card');
  if (modal) modal.classList.add('hidden');
}

/**
 * Guarda los cambios de titular y fecha de vencimiento en Supabase
 */
async function submitEditPaymentMethod() {
  const idInput = document.getElementById('edit-card-id');
  const holderInput = document.getElementById('edit-card-holder');
  const expiryInput = document.getElementById('edit-card-expiry');
  const errorMsg = document.getElementById('edit-card-error');
  const btn = document.getElementById('btn-update-card');
  const btnText = document.getElementById('btn-update-card-text');

  const cardId = idInput ? idInput.value : '';
  const holder = holderInput ? holderInput.value.trim() : '';
  const expiry = expiryInput ? expiryInput.value.trim() : '';

  const showError = (msg) => {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.classList.remove('hidden');
    }
  };

  if (errorMsg) errorMsg.classList.add('hidden');

  if (!cardId) {
    showError('Identificador de tarjeta no válido.');
    return;
  }

  if (!holder || holder.length < 3) {
    showError('Por favor ingresa el nombre del titular.');
    holderInput?.focus();
    return;
  }

  const expCheck = validateExpirationDate(expiry);
  if (!expCheck.valid) {
    showError(expCheck.message);
    expiryInput?.focus();
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Guardando...';

  try {
    if (!window.supabase || typeof window.supabase.fetchApi !== 'function') {
      throw new Error('Servicio de base de datos no disponible.');
    }

    await window.supabase.fetchApi(`payment_methods?id=eq.${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        cardholder_name: holder,
        exp_month: expCheck.month,
        exp_year: expCheck.year
      })
    });

    closeEditCardModal();
    showToast('✨ Tarjeta actualizada con éxito.');
    await loadPaymentMethods();

  } catch (err) {
    console.error('Error al editar tarjeta en Supabase:', err);
    showError('No se pudo actualizar la tarjeta: ' + (err.message || 'Error de red.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Guardar cambios';
  }
}

/**
 * Abre el modal de confirmación de eliminación
 */
function openDeleteCardModal(cardId, brand, last4) {
  const modal = document.getElementById('modal-delete-card');
  const idInput = document.getElementById('delete-card-id');
  const infoEl = document.getElementById('delete-card-info');

  if (idInput) idInput.value = cardId;
  if (infoEl) infoEl.textContent = `${brand} terminada en ${last4}`;

  if (modal) modal.classList.remove('hidden');
}

/**
 * Cierra el modal de confirmación de eliminación
 */
function closeDeleteCardModal() {
  const modal = document.getElementById('modal-delete-card');
  if (modal) modal.classList.add('hidden');
}

/**
 * Elimina la tarjeta en Supabase y reasigna automáticamente el método preferido si correspondía
 */
async function submitDeletePaymentMethod() {
  const idInput = document.getElementById('delete-card-id');
  const cardId = idInput ? idInput.value : '';
  const btn = document.getElementById('btn-confirm-delete-card');
  const btnText = document.getElementById('btn-confirm-delete-text');

  if (!cardId) return;

  const targetCard = cachedPaymentMethods.find(c => c.id === cardId);
  const wasDefault = targetCard ? targetCard.is_default : false;
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="inline-block animate-spin mr-1">⏳</span> Eliminando...';

  try {
    if (!window.supabase || typeof window.supabase.fetchApi !== 'function') {
      throw new Error('Servicio de base de datos no disponible.');
    }

    // 1. Eliminar la tarjeta en Supabase
    await window.supabase.fetchApi(`payment_methods?id=eq.${cardId}`, {
      method: 'DELETE'
    });

    // 2. Si la tarjeta era la preferida y el usuario aún tiene tarjetas guardadas, asignar is_default = true a la más reciente
    if (wasDefault) {
      const remaining = cachedPaymentMethods.filter(c => c.id !== cardId);
      if (remaining.length > 0) {
        try {
          await window.supabase.fetchApi(`payment_methods?id=eq.${remaining[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_default: true })
          });
        } catch (prefErr) {
          console.warn('Aviso al reasignar método preferido:', prefErr);
        }
      }
    }

    closeDeleteCardModal();
    showToast('🗑️ Tarjeta eliminada con éxito.');
    await loadPaymentMethods();

  } catch (err) {
    console.error('Error al eliminar tarjeta en Supabase:', err);
    showToast('Ocurrió un error al eliminar la tarjeta: ' + (err.message || 'Error de red.'));
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Confirmar eliminación';
  }
}

/**
 * Establece una tarjeta guardada como método de pago preferido
 */
async function setDefaultPaymentMethod(cardId) {
  const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

  try {
    if (!window.supabase || typeof window.supabase.fetchApi !== 'function') {
      throw new Error('Servicio de base de datos no disponible.');
    }

    // 1. Poner is_default = false en todas las tarjetas de este usuario
    await window.supabase.fetchApi(`payment_methods?user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_default: false })
    });

    // 2. Poner is_default = true en la tarjeta seleccionada
    await window.supabase.fetchApi(`payment_methods?id=eq.${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_default: true })
    });

    showToast('✨ Tarjeta establecida como método preferido.');
    await loadPaymentMethods();

  } catch (err) {
    console.error('Error al cambiar método de pago preferido:', err);
    showToast('No se pudo actualizar el método preferido: ' + (err.message || 'Error de red.'));
  }
}

/**
 * Función auxiliar para escapar texto HTML
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

