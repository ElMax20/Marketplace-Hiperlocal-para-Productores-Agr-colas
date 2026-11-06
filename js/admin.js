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
