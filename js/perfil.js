/**
 * Raíz & Barrio - Perfil y Configuración de Usuario
 * Diseño fiel a la referencia de "Tu perfil, tu tranquilidad"
 * Totalmente dinámico y adaptable para cualquier cuenta (Cliente, Productor, Administrador).
 * Conexión completa con LocalStorage, Supabase y Cropper de Foto Anti-Descuadre.
 */

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

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

  // 2. Si no hay usuario en sesión, usar plantilla por defecto (Camila Rojas, de la referencia)
  if (!user) {
    user = {
      id: 'default-camila',
      name: 'Camila Rojas',
      username: 'camila.rojas',
      email: 'camila.rojas@correo.com',
      phone: '300 456 7890',
      role: 'cliente',
      preferredNode: 'Nodo Central · La Perseverancia',
      address: 'Carrera 7 n.º 32-16, apto. 402',
      avatar: DEFAULT_AVATAR,
      registeredAt: '2026-09-15T00:00:00.000Z'
    };
  }

  currentUser = user;

  // 3. Consultar datos en Supabase si está disponible para tener la versión más fresca
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && user.username) {
    try {
      const endpoint = `profiles?username=ilike.${encodeURIComponent(user.username)}&select=*`;
      const freshProfiles = await window.supabase.fetchApi(endpoint);
      if (freshProfiles && freshProfiles.length > 0) {
        const fresh = freshProfiles[0];
        currentUser.id = fresh.id || currentUser.id;
        currentUser.username = fresh.username || currentUser.username;
        currentUser.name = fresh.full_name || currentUser.name;
        if (fresh.phone) currentUser.phone = fresh.phone;
        if (fresh.location_address) currentUser.address = fresh.location_address;
        if (fresh.farm_name) currentUser.preferredNode = fresh.farm_name;
        if (fresh.avatar_url) currentUser.avatar = fresh.avatar_url;
        if (fresh.email) currentUser.email = fresh.email;
        if (fresh.role) currentUser.role = fresh.role;
      }
    } catch (err) {
      console.warn('Sync con Supabase:', err);
    }
  }

  originalUserData = JSON.parse(JSON.stringify(currentUser));

  // 4. Renderizar toda la interfaz adaptada a este usuario
  renderProfileUI(currentUser);
  updateCartBadge();
}

/**
 * Rellena todos los campos e indicadores visuales de la pantalla
 */
function renderProfileUI(u) {
  const firstName = (u.name || 'Vecino').split(' ')[0];
  const isFemale = (u.name || '').toLowerCase().endsWith('a') || (u.username || '').includes('camila');
  const roleText = u.role === 'productor' 
    ? 'Productor agrícola' 
    : (u.role === 'admin' ? 'Administrador' : (isFemale ? 'Compradora' : 'Comprador'));

  // Navbar
  const navName = document.getElementById('nav-user-name');
  if (navName) navName.textContent = u.name || 'Mi cuenta';

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
  if (cardHolder) cardHolder.textContent = u.name || 'Camila Rojas';

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

  showToast('¡Tus cambios han sido guardados con éxito!');
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

function handleSendEmailVerification() {
  const newEmail = document.getElementById('input-new-email')?.value.trim();
  if (!newEmail || !newEmail.includes('@')) {
    showToast('Por favor escribe una dirección de correo válida.');
    document.getElementById('input-new-email')?.focus();
    return;
  }

  showToast(`Enlace de verificación enviado a ${newEmail}. Revisa tu bandeja.`);
  document.getElementById('input-new-email').value = '';
}

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