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

  // Leer tab de URL hash si existe
  const hash = window.location.hash.replace('#', '');
  if (['productos', 'agregar', 'cuentas', 'roles', 'auditoria', 'perfil'].includes(hash)) {
    switchAdminTab(hash);
  } else {
    switchAdminTab('productos');
  }

  updatePreviewCard();
});

const BREADCRUMB_MAP = {
  productos: 'Tienda / Productos',
  agregar: 'Tienda / Agregar producto',
  cuentas: 'Gestionar cuentas',
  roles: 'Roles y permisos',
  auditoria: 'Auditoría',
  perfil: 'Mi perfil y seguridad'
};

/**
 * Cambia la pestaña activa del panel de administración
 * @param {'productos' | 'agregar' | 'cuentas' | 'roles' | 'auditoria' | 'perfil'} tabId 
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
    if (!p.startsWith('$')) p = '$' + p;
    previewPrice.textContent = p || '$0';
  }

  if (previewUnit && unitSelect) {
    const unitText = unitSelect.value.split('·')[0].trim().toLowerCase();
    previewUnit.textContent = `/ ${unitText}`;
  }
}

/**
 * Carga los datos de una cuenta en el panel lateral de "Gestionar cuentas"
 */
function selectAccountForEdit(name, email, role, status, initials) {
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
 * =============================================================================
 * Lógica de "Mi Perfil y Seguridad"
 * =============================================================================
 */

// Guardar datos personales
function savePersonalData() {
  const nameInput = document.getElementById('profile-name-input');
  if (!nameInput) return;

  const newName = nameInput.value.trim();
  if (!newName) {
    alert('Por favor ingresa un nombre válido.');
    return;
  }

  // Actualizar tarjeta de perfil
  const cardName = document.getElementById('profile-card-name');
  if (cardName) cardName.textContent = newName;

  // Actualizar en localStorage si existe usuario conectado
  const user = getCurrentUser();
  if (user) {
    user.name = newName;
    setCurrentUser(user);
  }

  alert('¡Datos personales actualizados correctamente!');
}

// Previsualizar nueva foto de perfil
function previewProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;

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

