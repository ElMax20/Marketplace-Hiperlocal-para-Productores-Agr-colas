/**
 * Raíz & Barrio - Controlador Principal de Checkout Dedicado
 * Migración a página completa paso a paso con simulación bancaria real y persistencia en Supabase.
 */

// Estado del Checkout
let checkoutCart = [];
let checkoutUser = null;
let checkoutPickupNodes = [];
let checkoutAddresses = [];
let checkoutSavedCards = [];

let activeDeliveryMode = 'NODE_PICKUP'; // 'NODE_PICKUP' | 'HOME_DELIVERY'
window.getActiveDeliveryMode = () => activeDeliveryMode;
let activeNode = null;
let activeAddress = null;
window.getActiveAddress = () => activeAddress;
window.getCheckoutAddresses = () => checkoutAddresses;

let activePaymentMethod = 'CARD'; // 'CARD' | 'CASH_ON_DELIVERY'
let activeCardId = null;
let isUsingNewCard = false;

// Inicialización en DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  await initCheckout();
});

async function initCheckout() {
  // 1. Obtener usuario autenticado
  try {
    const rawUser = localStorage.getItem('rb_cached_profile') || 
                    localStorage.getItem('rb_current_user') || 
                    localStorage.getItem('raiz_user');
    if (rawUser) {
      checkoutUser = JSON.parse(rawUser);
    } else if (typeof getCachedProfile === 'function') {
      const cached = getCachedProfile();
      if (cached && (cached.id || cached.full_name)) {
        checkoutUser = {
          id: cached.id,
          name: cached.full_name,
          role: cached.role,
          avatar: cached.avatar_url,
          loggedIn: true
        };
      }
    }
  } catch (e) {
    console.warn('Error leyendo usuario:', e);
  }

  // 2. Obtener productos del carrito
  try {
    const rawCart = localStorage.getItem('rb_cart') || localStorage.getItem('raiz_cart');
    if (rawCart) {
      checkoutCart = JSON.parse(rawCart);
    }
  } catch (e) {
    console.warn('Error leyendo carrito:', e);
  }

  // Si el carrito está vacío, mostrar mensaje amigable
  if (!checkoutCart || checkoutCart.length === 0) {
    const emptyEl = document.getElementById('checkout-empty-cart');
    const gridEl = document.getElementById('checkout-content-grid');
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (gridEl) gridEl.classList.add('hidden');
    return;
  }

  // 3. Consultar datos de Supabase en paralelo
  await loadSupabaseCheckoutData();

  // 4. Renderizar estado inicial
  renderSummaryItems();
  updateOrderTotals();
  renderPickupNodes();
  renderDeliveryAddresses();
  renderSavedCards();
  validateCheckoutPayment();
}

/**
 * Carga nodos, direcciones y tarjetas del usuario desde Supabase
 */
async function loadSupabaseCheckoutData() {
  const userId = checkoutUser?.id || (typeof getCachedProfile === 'function' ? getCachedProfile()?.id : null);

  // A. Nodos comunitarios activos
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const nodes = await window.supabase.fetchApi('pickup_nodes?is_active=eq.true&order=created_at.asc');
      if (Array.isArray(nodes) && nodes.length > 0) {
        checkoutPickupNodes = nodes;
        activeNode = nodes[0];
        updateNodeUI(activeNode);
      }
    } catch (errNodes) {
      console.warn('Error consultando pickup_nodes:', errNodes);
    }
  }

  // Nodos por defecto para Guayaquil
  if (checkoutPickupNodes.length === 0) {
    checkoutPickupNodes = [
      {
        id: 'node-urdesa',
        name: 'Sede Urdesa · Espacio Verde',
        address: 'Av. Víctor Emilio Estrada y Bálsamos',
        city: 'Guayaquil',
        pickup_schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM'
      },
      {
        id: 'node-puerto-santa-ana',
        name: 'Sede Puerto Santa Ana · La Perla',
        address: 'Numa Pompilio Llona, Edificio The Point',
        city: 'Guayaquil',
        pickup_schedule: 'Jueves y Sábados: 10:00 AM – 4:00 PM'
      },
      {
        id: 'node-ceibos',
        name: 'Sede Ceibos · Parque Campesino',
        address: 'Av. del Bombero Km 6.5, Plaza Ceibos',
        city: 'Guayaquil',
        pickup_schedule: 'Viernes: 2:00 PM – 7:00 PM'
      }
    ];
    activeNode = checkoutPickupNodes[0];
    updateNodeUI(activeNode);
  }

  // B. Direcciones del usuario desde Supabase (Tabla delivery_addresses)
  checkoutAddresses = [];
  activeAddress = null;

  if (window.supabase && typeof window.supabase.fetchApi === 'function' && userId) {
    try {
      const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&order=is_preferred.desc,created_at.desc`);
      if (Array.isArray(addrs) && addrs.length > 0) {
        checkoutAddresses = addrs;
      }
    } catch (errAddrs) {
      console.warn('Error consultando delivery_addresses:', errAddrs);
    }
  }

  // Respaldo local de direcciones
  if (checkoutAddresses.length === 0 && userId) {
    try {
      const localAddrs = localStorage.getItem(`rb_delivery_addresses_${userId}`) || localStorage.getItem('rb_delivery_addresses');
      if (localAddrs) {
        const parsed = JSON.parse(localAddrs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          checkoutAddresses = parsed;
        }
      }
    } catch (_) {}
  }

  // Respaldo desde el perfil activo si contiene dirección en Guayaquil
  if (checkoutAddresses.length === 0 && checkoutUser) {
    const rawAddr = checkoutUser.address || checkoutUser.location_address;
    if (rawAddr && !rawAddr.includes('Carrera 7') && !rawAddr.includes('Bogot')) {
      checkoutAddresses = [{
        id: 'profile-addr-default',
        user_id: userId,
        label: 'Casa',
        street_address: rawAddr,
        neighborhood: checkoutUser.neighborhood || 'Guayaquil',
        city: 'Guayaquil',
        delivery_instructions: '',
        delivery_fee: 2.50,
        delivery_schedule: 'Sáb. 14 nov. · 2:00 – 6:00 p. m.',
        is_preferred: true
      }];
    }
  }

  // Configuración de Estados A y B
  if (checkoutAddresses.length > 0) {
    // Caso B: El usuario SÍ tiene direcciones
    const preferredAddr = checkoutAddresses.find(a => a.is_preferred) || checkoutAddresses[0];
    activeAddress = preferredAddr;
    updateAddressUI(activeAddress);
  } else {
    // Caso A: El usuario NO tiene direcciones guardadas
    activeAddress = null;
    updateAddressUI(null);
    // Por defecto, la opción inicial debe ser Recogida en Nodo (Gratis)
    activeDeliveryMode = 'NODE_PICKUP';
    selectDeliveryMode('NODE_PICKUP');
  }

  // C. Métodos de pago guardados del usuario
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && userId) {
    try {
      const cards = await window.supabase.fetchApi(`payment_methods?user_id=eq.${userId}&order=is_default.desc,created_at.desc`);
      if (Array.isArray(cards) && cards.length > 0) {
        checkoutSavedCards = cards;
        activeCardId = cards[0].id;
        isUsingNewCard = false;
      } else {
        isUsingNewCard = true;
      }
    } catch (errCards) {
      console.warn('Error consultando payment_methods:', errCards);
    }
  }
}

// =============================================================================
// PASO 1: LÓGICA DE ENTREGA Y UBICACIÓN
// =============================================================================

function selectDeliveryMode(mode) {
  const cardNode = document.getElementById('card-delivery-node');
  const cardHome = document.getElementById('card-delivery-home');
  const radioNode = document.getElementById('radio-delivery-node');
  const radioHome = document.getElementById('radio-delivery-home');

  if (mode === 'NODE_PICKUP') {
    activeDeliveryMode = 'NODE_PICKUP';
    if (radioNode) radioNode.checked = true;
    if (cardNode) {
      cardNode.className = 'cursor-pointer rounded-2xl p-5 border-2 transition-all relative border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-xs';
    }
    if (cardHome) {
      cardHome.className = 'cursor-pointer rounded-2xl p-5 border-2 transition-all relative border-stone-200 bg-white hover:border-stone-300';
    }
    // Ocultar alerta de dirección si estaba visible
    const alertBanner = document.getElementById('checkout-delivery-alert');
    if (alertBanner) alertBanner.classList.add('hidden');
  } else {
    activeDeliveryMode = 'HOME_DELIVERY';
    if (radioHome) radioHome.checked = true;
    if (cardHome) {
      cardHome.className = 'cursor-pointer rounded-2xl p-5 border-2 transition-all relative border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-xs';
    }
    if (cardNode) {
      cardNode.className = 'cursor-pointer rounded-2xl p-5 border-2 transition-all relative border-stone-200 bg-white hover:border-stone-300';
    }

    // Si no hay dirección y se selecciona domicilio, abrir el formulario para agregarla
    if (!activeAddress && checkoutAddresses.length === 0) {
      openNewAddressModal();
    }
  }

  updateOrderTotals();
}

function updateNodeUI(node) {
  if (!node) return;
  const nameEl = document.getElementById('checkout-node-name');
  const addrEl = document.getElementById('checkout-node-address');
  const schedEl = document.getElementById('checkout-node-schedule');
  const estEl = document.getElementById('checkout-node-estimate');

  if (nameEl) nameEl.textContent = node.name;
  if (addrEl) addrEl.textContent = `${node.address} · ${node.city || 'Guayaquil'}`;
  if (schedEl) schedEl.textContent = node.pickup_schedule;
  if (estEl) {
    estEl.innerHTML = `🌿 <strong>Tiempo de preparación:</strong> Tu canasta estará lista para retiro el ${node.pickup_schedule}.`;
  }

  // Resumen lateral
  const sumName = document.getElementById('summary-delivery-name');
  const sumSched = document.getElementById('summary-delivery-schedule');
  if (sumName) sumName.textContent = node.name;
  if (sumSched) sumSched.textContent = node.pickup_schedule;
}

function updateAddressUI(addr) {
  const noAddrView = document.getElementById('checkout-no-address-view');
  const selAddrView = document.getElementById('checkout-selected-address-view');
  const schedBox = document.getElementById('checkout-home-schedule-box');
  const btnToggle = document.getElementById('btn-toggle-addresses');
  const feeBadge = document.getElementById('checkout-home-fee-badge');

  if (feeBadge) {
    feeBadge.textContent = '$2.50';
  }

  // Caso A: Sin dirección guardada
  if (!addr) {
    if (noAddrView) noAddrView.classList.remove('hidden');
    if (selAddrView) selAddrView.classList.add('hidden');
    if (schedBox) schedBox.classList.add('hidden');
    if (btnToggle) btnToggle.classList.add('hidden');
    return;
  }

  // Caso B: Con dirección seleccionada
  if (noAddrView) noAddrView.classList.add('hidden');
  if (selAddrView) selAddrView.classList.remove('hidden');
  if (schedBox) schedBox.classList.remove('hidden');

  const labelEl = document.getElementById('checkout-home-label');
  const neighEl = document.getElementById('checkout-home-neighborhood');
  const schedEl = document.getElementById('checkout-home-schedule');
  const estEl = document.getElementById('checkout-home-estimate');
  const instEl = document.getElementById('checkout-home-instructions');

  if (labelEl) labelEl.textContent = `${addr.label || 'Casa'} · ${addr.street_address}`;
  if (neighEl) neighEl.textContent = `${addr.neighborhood || 'Sector'} · ${addr.city || 'Guayaquil'}`;
  if (schedEl) schedEl.textContent = addr.delivery_schedule || 'Sáb. 14 nov. · 2:00 – 6:00 p. m.';
  if (estEl) {
    estEl.innerHTML = `🚚 <strong>Tiempo de entrega:</strong> Entrega en tu puerta el Sábado entre 2:00 p. m. y 6:00 p. m.`;
  }
  if (instEl) {
    if (addr.delivery_instructions) {
      instEl.textContent = `"${addr.delivery_instructions}"`;
      instEl.classList.remove('hidden');
    } else {
      instEl.classList.add('hidden');
    }
  }

  if (checkoutAddresses.length > 1) {
    if (btnToggle) btnToggle.classList.remove('hidden');
  } else {
    if (btnToggle) btnToggle.classList.add('hidden');
  }

  // Resumen lateral si está en modo domicilio
  if (activeDeliveryMode === 'HOME_DELIVERY') {
    const sumName = document.getElementById('summary-delivery-name');
    const sumSched = document.getElementById('summary-delivery-schedule');
    if (sumName) sumName.textContent = `${addr.label || 'Casa'}: ${addr.street_address}`;
    if (sumSched) sumSched.textContent = addr.delivery_schedule || 'Sáb. 14 nov. · 2:00 – 6:00 p. m.';
  }
}

function toggleNodeSelector() {
  const dropdown = document.getElementById('checkout-nodes-dropdown');
  const btnLabel = document.getElementById('btn-toggle-node-label');
  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    dropdown.classList.remove('hidden');
    if (btnLabel) btnLabel.textContent = '✕ Cerrar lista de nodos';
  } else {
    dropdown.classList.add('hidden');
    if (btnLabel) btnLabel.textContent = '⇄ Cambiar nodo';
  }
}

function renderPickupNodes() {
  const container = document.getElementById('checkout-nodes-options');
  if (!container) return;

  if (checkoutPickupNodes.length === 0) {
    container.innerHTML = '<p class="text-stone-400 text-xs">Cargando nodos comunitarios...</p>';
    return;
  }

  container.innerHTML = checkoutPickupNodes.map(node => {
    const isSelected = activeNode?.id === node.id;
    return `
      <div 
        onclick="choosePickupNode('${node.id}')"
        class="p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
          isSelected 
            ? 'border-[#1a3d2f] bg-emerald-50 text-stone-900 font-bold' 
            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
        }"
      >
        <div>
          <p class="font-bold text-xs">${node.name}</p>
          <p class="text-[10px] text-stone-400 mt-0.5">${node.address} · ${node.pickup_schedule}</p>
        </div>
        ${isSelected ? '<span class="text-emerald-700 font-bold">✓</span>' : ''}
      </div>
    `;
  }).join('');
}

function choosePickupNode(nodeId) {
  const node = checkoutPickupNodes.find(n => n.id === nodeId);
  if (node) {
    activeNode = node;
    updateNodeUI(node);
    renderPickupNodes();
    toggleNodeSelector();
    updateOrderTotals();
  }
}

function toggleAddressesSelector() {
  const dropdown = document.getElementById('checkout-addresses-dropdown');
  const btnLabel = document.getElementById('btn-toggle-addresses-label');
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    dropdown.classList.remove('hidden');
    if (btnLabel) btnLabel.textContent = '✕ Cerrar lista';
  } else {
    dropdown.classList.add('hidden');
    if (btnLabel) btnLabel.textContent = '⇄ Cambiar dirección';
  }
}

function renderDeliveryAddresses() {
  const container = document.getElementById('checkout-addresses-dropdown');
  const btnToggle = document.getElementById('btn-toggle-addresses');
  if (!container) return;

  if (checkoutAddresses.length > 1) {
    if (btnToggle) btnToggle.classList.remove('hidden');
    container.innerHTML = `
      <div class="text-[11px] text-stone-500 font-semibold mb-1">Elige una de tus direcciones registradas:</div>
      ${checkoutAddresses.map(addr => {
        const isSelected = activeAddress?.id === addr.id;
        return `
          <div 
            onclick="chooseDeliveryAddress('${addr.id}')"
            class="p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
              isSelected 
                ? 'border-[#1a3d2f] bg-emerald-50 text-stone-900 font-bold ring-1 ring-[#1a3d2f]/20' 
                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
            }"
          >
            <div>
              <p class="font-bold text-xs">${addr.label || 'Casa'}: <span class="font-normal text-stone-800">${addr.street_address}</span></p>
              <p class="text-[10px] text-stone-400 mt-0.5">${addr.neighborhood || 'Sector'} · ${addr.city || 'Guayaquil'}</p>
            </div>
            ${isSelected ? '<span class="text-emerald-700 font-bold text-sm">✓</span>' : ''}
          </div>
        `;
      }).join('')}
    `;
  } else {
    if (btnToggle) btnToggle.classList.add('hidden');
    container.innerHTML = '';
  }
}

function chooseDeliveryAddress(addrId) {
  const addr = checkoutAddresses.find(a => a.id === addrId);
  if (addr) {
    activeAddress = addr;
    updateAddressUI(addr);
    renderDeliveryAddresses();
    const dropdown = document.getElementById('checkout-addresses-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const btnLabel = document.getElementById('btn-toggle-addresses-label');
    if (btnLabel) btnLabel.textContent = '⇄ Cambiar dirección';
    updateOrderTotals();
  }
}

// Modal para agregar nueva dirección
function openNewAddressModal() {
  const modal = document.getElementById('modal-new-address');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Regla estricta de seguridad/UX:
 * Advertencia y fallback automático a Recogida en Nodo (Gratis)
 */
function triggerAddressMissingFallback() {
  // Cambiar automáticamente a Recogida en Nodo (Gratis) y recalcular total ($0.00 de envío)
  selectDeliveryMode('NODE_PICKUP');

  const alertBanner = document.getElementById('checkout-delivery-alert');
  const alertText = document.getElementById('checkout-delivery-alert-text');
  const msg = 'No has seleccionado una dirección de entrega. Se seleccionó automáticamente Recogida en Nodo.';
  if (alertBanner && alertText) {
    alertText.textContent = msg;
    alertBanner.classList.remove('hidden');
  }
  showCheckoutToast(msg, 'warning');
}

function closeNewAddressModal() {
  const modal = document.getElementById('modal-new-address');
  if (modal) modal.classList.add('hidden');

  // Si el usuario cancela o cierra sin haber guardado dirección y tiene marcado A Domicilio
  if (activeDeliveryMode === 'HOME_DELIVERY' && !activeAddress) {
    triggerAddressMissingFallback();
  }
}

async function handleSaveNewAddress(event) {
  event.preventDefault();
  const labelInput = document.getElementById('modal-addr-label');
  const streetInput = document.getElementById('modal-addr-street');
  const neighInput = document.getElementById('modal-addr-neighborhood');
  const cityInput = document.getElementById('modal-addr-city');
  const instInput = document.getElementById('modal-addr-instructions');

  const userId = checkoutUser?.id || (typeof getCachedProfile === 'function' ? getCachedProfile()?.id : null);

  const newAddrObj = {
    user_id: userId,
    label: labelInput ? labelInput.value.trim() : 'Casa',
    street_address: streetInput ? streetInput.value.trim() : '',
    neighborhood: neighInput ? neighInput.value.trim() : 'Urdesa',
    city: cityInput ? cityInput.value.trim() : 'Guayaquil',
    delivery_instructions: instInput ? instInput.value.trim() : '',
    delivery_fee: 2.50,
    delivery_schedule: 'Sáb. 14 nov. · 2:00 – 6:00 p. m.',
    is_preferred: true
  };

  try {
    if (window.supabase && typeof window.supabase.fetchApi === 'function' && userId) {
      const res = await window.supabase.fetchApi('delivery_addresses', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(newAddrObj)
      });
      if (Array.isArray(res) && res.length > 0) {
        newAddrObj.id = res[0].id;
      }
    }
  } catch (e) {
    console.warn('Error guardando dirección en Supabase:', e);
  }

  if (!newAddrObj.id) {
    newAddrObj.id = 'addr-' + Date.now();
  }

  // Guardar en localStorage para persistencia inmediata del usuario
  if (userId) {
    try {
      const userKey = `rb_delivery_addresses_${userId}`;
      const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
      existing.unshift(newAddrObj);
      localStorage.setItem(userKey, JSON.stringify(existing));
    } catch (_) {}
  }

  checkoutAddresses.unshift(newAddrObj);
  activeAddress = newAddrObj;
  updateAddressUI(newAddrObj);
  renderDeliveryAddresses();

  // Cerrar modal sin disparar fallback
  const modal = document.getElementById('modal-new-address');
  if (modal) modal.classList.add('hidden');

  const alertBanner = document.getElementById('checkout-delivery-alert');
  if (alertBanner) alertBanner.classList.add('hidden');

  selectDeliveryMode('HOME_DELIVERY');
  showCheckoutToast('Dirección agregada y seleccionada correctamente.', 'success');
}

// Continuar al Paso 2
function proceedToStep2() {
  // Validación estricta: si está en A Domicilio pero sin dirección
  if (activeDeliveryMode === 'HOME_DELIVERY' && !activeAddress) {
    triggerAddressMissingFallback();
    return;
  }

  // Actualizar indicadores visuales
  const badge1 = document.getElementById('step-badge-1');
  const badge2 = document.getElementById('step-badge-2');
  const circle2 = document.getElementById('step-circle-2');
  const step2Indicator = document.getElementById('step-2-indicator');

  if (badge1) badge1.className = 'flex items-center gap-1.5 text-stone-500 font-medium';
  if (badge2) badge2.className = 'flex items-center gap-1.5 text-[#1a3d2f] font-bold';
  if (circle2) circle2.className = 'w-6 h-6 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center text-xs shadow-xs';
  if (step2Indicator) step2Indicator.className = 'w-8 h-8 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center font-bold text-sm shrink-0';

  // Scroll suave al Paso 2
  const step2 = document.getElementById('checkout-step-2');
  if (step2) {
    step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function backToStep1() {
  const step1 = document.getElementById('checkout-step-1');
  if (step1) {
    step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// =============================================================================
// PASO 2: LÓGICA DE PAGO Y PASARELA BANCARIA
// =============================================================================

function selectPaymentTab(method) {
  activePaymentMethod = method;

  const tabCard = document.getElementById('pay-tab-card');
  const tabCod = document.getElementById('pay-tab-cod');
  const panelCard = document.getElementById('panel-payment-card');
  const panelCod = document.getElementById('panel-payment-cod');

  if (method === 'CARD') {
    if (tabCard) {
      tabCard.className = 'cursor-pointer rounded-2xl p-4 border-2 transition border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-xs flex items-center gap-3';
    }
    if (tabCod) {
      tabCod.className = 'cursor-pointer rounded-2xl p-4 border-2 transition border-stone-200 bg-white hover:border-stone-300 flex items-center gap-3';
    }
    if (panelCard) panelCard.classList.remove('hidden');
    if (panelCod) panelCod.classList.add('hidden');
  } else {
    if (tabCod) {
      tabCod.className = 'cursor-pointer rounded-2xl p-4 border-2 transition border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-xs flex items-center gap-3';
    }
    if (tabCard) {
      tabCard.className = 'cursor-pointer rounded-2xl p-4 border-2 transition border-stone-200 bg-white hover:border-stone-300 flex items-center gap-3';
    }
    if (panelCard) panelCard.classList.add('hidden');
    if (panelCod) panelCod.classList.remove('hidden');
  }

  validateCheckoutPayment();
}

function renderSavedCards() {
  const container = document.getElementById('checkout-saved-cards-list');
  const wrapperSaved = document.getElementById('wrapper-saved-cards');
  const wrapperNew = document.getElementById('wrapper-new-card-form');
  if (!container) return;

  if (checkoutSavedCards.length === 0) {
    if (wrapperSaved) wrapperSaved.classList.add('hidden');
    if (wrapperNew) wrapperNew.classList.remove('hidden');
    isUsingNewCard = true;
    return;
  }

  if (wrapperSaved) wrapperSaved.classList.remove('hidden');

  container.innerHTML = checkoutSavedCards.map(card => {
    const isSelected = (!isUsingNewCard && activeCardId === card.id);
    const brand = (card.brand || 'VISA').toUpperCase();
    const expM = String(card.exp_month || 1).padStart(2, '0');
    const expY = String(card.exp_year || 28).slice(-2);

    return `
      <label 
        onclick="chooseSavedCard('${card.id}')"
        class="flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
          isSelected 
            ? 'border-[#1a3d2f] bg-emerald-50/40' 
            : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
        }"
      >
        <div class="flex items-center gap-3">
          <input 
            type="radio" 
            name="saved-card-radio" 
            value="${card.id}" 
            ${isSelected ? 'checked' : ''} 
            class="w-4 h-4 text-[#1a3d2f] focus:ring-[#1a3d2f] accent-[#1a3d2f]"
          >
          <div>
            <span class="font-bold text-xs text-stone-800 tracking-wider">
              ${brand} terminada en •••• ${card.last4}
            </span>
            <span class="text-[11px] text-stone-400 block">
              Titular: ${card.cardholder_name} · Vence: ${expM}/${expY}
            </span>
          </div>
        </div>
        ${card.is_default ? `
          <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            Predeterminada
          </span>
        ` : ''}
      </label>
    `;
  }).join('');
}

function chooseSavedCard(cardId) {
  activeCardId = cardId;
  isUsingNewCard = false;
  const wrapperNew = document.getElementById('wrapper-new-card-form');
  if (wrapperNew) wrapperNew.classList.add('hidden');
  renderSavedCards();
  validateCheckoutPayment();
}

function toggleNewCardForm() {
  isUsingNewCard = !isUsingNewCard;
  const wrapperNew = document.getElementById('wrapper-new-card-form');
  const icon = document.getElementById('btn-toggle-new-card-icon');
  const label = document.getElementById('btn-toggle-new-card-label');

  if (wrapperNew) {
    if (isUsingNewCard) {
      wrapperNew.classList.remove('hidden');
      if (icon) icon.textContent = '✕';
      if (label) label.textContent = 'Usar una de mis tarjetas guardadas';
      // Desmarcar selección de tarjetas guardadas
      document.querySelectorAll('input[name="saved-card-radio"]').forEach(r => r.checked = false);
    } else {
      wrapperNew.classList.add('hidden');
      if (icon) icon.textContent = '+';
      if (label) label.textContent = 'Usar otra tarjeta para este pedido';
      if (checkoutSavedCards.length > 0) {
        activeCardId = checkoutSavedCards[0].id;
        renderSavedCards();
      }
    }
  }

  validateCheckoutPayment();
}

// Algoritmo de Luhn en Javascript
function isValidLuhn(str) {
  const digits = str.replace(/\D/g, '');
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

function detectCardBrand(numStr) {
  const digits = numStr.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'DISCOVER';
  return 'CARD';
}

function handleNewCardNumber(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 19);
  const brand = detectCardBrand(val);

  // Formato con espacios
  let formatted = '';
  if (brand === 'AMEX') {
    const p1 = val.slice(0, 4);
    const p2 = val.slice(4, 10);
    const p3 = val.slice(10, 15);
    formatted = [p1, p2, p3].filter(Boolean).join(' ');
  } else {
    formatted = val.match(/.{1,4}/g)?.join(' ') || val;
  }
  input.value = formatted;

  const brandTag = document.getElementById('new-card-brand-tag');
  if (brandTag) brandTag.textContent = brand;

  const luhnBadge = document.getElementById('new-card-luhn-badge');
  if (luhnBadge) {
    if (val.length >= 13) {
      if (isValidLuhn(val)) {
        luhnBadge.innerHTML = '<span class="text-emerald-700 flex items-center gap-0.5">✓ Válida</span>';
      } else {
        luhnBadge.innerHTML = '<span class="text-amber-600">Número inválido</span>';
      }
    } else {
      luhnBadge.innerHTML = '';
    }
  }

  validateCheckoutPayment();
}

function handleNewCardExpiry(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 3) {
    val = val.slice(0, 2) + '/' + val.slice(2);
  }
  input.value = val;
  validateCheckoutPayment();
}

function validateCheckoutPayment() {
  const btn = document.getElementById('btn-confirm-purchase');
  if (!btn) return false;

  if (activePaymentMethod === 'CASH_ON_DELIVERY') {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    return true;
  }

  // Si usa tarjeta guardada
  if (!isUsingNewCard && activeCardId) {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    return true;
  }

  // Si usa tarjeta nueva
  const holderInput = document.getElementById('new-card-holder');
  const numberInput = document.getElementById('new-card-number');
  const expiryInput = document.getElementById('new-card-expiry');
  const cvvInput = document.getElementById('new-card-cvv');

  const holder = holderInput ? holderInput.value.trim() : '';
  const numClean = numberInput ? numberInput.value.replace(/\D/g, '') : '';
  const expiry = expiryInput ? expiryInput.value.trim() : '';
  const cvv = cvvInput ? cvvInput.value.trim() : '';

  const isLuhnOk = isValidLuhn(numClean);
  const isHolderOk = holder.length >= 3;
  const isExpOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const isCvvOk = cvv.length >= 3;

  const valid = isLuhnOk && isHolderOk && isExpOk && isCvvOk;

  btn.disabled = !valid;
  if (!valid) {
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  return valid;
}

// =============================================================================
// RESUMEN DE ORDEN Y CÁLCULOS
// =============================================================================

function renderSummaryItems() {
  const container = document.getElementById('summary-items-list');
  const countBadge = document.getElementById('summary-cart-count');
  if (!container) return;

  const totalUnits = checkoutCart.reduce((sum, it) => sum + (it.quantity || 1), 0);
  if (countBadge) countBadge.textContent = `${totalUnits} artículo${totalUnits === 1 ? '' : 's'}`;

  container.innerHTML = checkoutCart.map(item => `
    <div class="py-3 flex items-center gap-3 text-xs">
      ${item.image ? `
        <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0">
      ` : `
        <div class="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">🌱</div>
      `}
      <div class="flex-1 min-w-0">
        <p class="font-bold text-stone-800 truncate">${item.title}</p>
        <p class="text-[11px] text-stone-400">
          ${item.quantity || 1} ${item.unit || 'unidad(es)'} × $${Number(item.price || 0).toFixed(2)}
        </p>
      </div>
      <span class="font-bold text-stone-900 shrink-0">
        $${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </span>
    </div>
  `).join('');
}

function updateOrderTotals() {
  const subtotal = checkoutCart.reduce((sum, it) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0);
  const deliveryFee = activeDeliveryMode === 'NODE_PICKUP' ? 0.00 : 2.50;
  const total = subtotal + deliveryFee;

  const subtotalEl = document.getElementById('summary-subtotal');
  const feeLabelEl = document.getElementById('summary-shipping-label');
  const feeCostEl = document.getElementById('summary-shipping-cost');
  const totalEl = document.getElementById('summary-total');
  const btnTotal = document.getElementById('btn-total-display');

  const kickerEl = document.getElementById('summary-delivery-label-kicker');
  const badgeEl = document.getElementById('summary-delivery-fee-badge');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  
  if (activeDeliveryMode === 'NODE_PICKUP') {
    if (feeLabelEl) feeLabelEl.textContent = 'Recogida en nodo:';
    if (feeCostEl) {
      feeCostEl.textContent = 'Gratis';
      feeCostEl.className = 'font-semibold text-emerald-700';
    }
    if (kickerEl) kickerEl.textContent = 'Punto de recogida:';
    if (badgeEl) {
      badgeEl.textContent = 'Gratis';
      badgeEl.className = 'text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full';
    }
    if (activeNode) updateNodeUI(activeNode);
  } else {
    if (feeLabelEl) feeLabelEl.textContent = 'Envío a domicilio:';
    if (feeCostEl) {
      feeCostEl.textContent = `$${deliveryFee.toFixed(2)}`;
      feeCostEl.className = 'font-semibold text-stone-800';
    }
    if (kickerEl) kickerEl.textContent = 'Entrega a domicilio:';
    if (badgeEl) {
      badgeEl.textContent = `$${deliveryFee.toFixed(2)}`;
      badgeEl.className = 'text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full';
    }
    if (activeAddress) updateAddressUI(activeAddress);
  }

  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  if (btnTotal) btnTotal.textContent = `$${total.toFixed(2)}`;
}

// =============================================================================
// CONFIRMACIÓN DE COMPRA CON OVERLAY BANCARIO Y PERSISTENCIA SUPABASE
// =============================================================================

async function executePurchase() {
  if (!validateCheckoutPayment()) {
    alert('Por favor verifica los datos de pago requeridos.');
    return;
  }

  // 1. Desplegar Overlay Bancario durante 2.5 segundos
  const overlay = document.getElementById('banking-processing-overlay');
  if (overlay) overlay.classList.remove('hidden');

  const userId = checkoutUser?.id || '00000000-0000-0000-0000-000000000001';
  const customerName = checkoutUser?.full_name || checkoutUser?.name || (
    activePaymentMethod === 'CARD' && isUsingNewCard 
      ? (document.getElementById('new-card-holder')?.value.trim() || 'Comprador Raíz & Barrio') 
      : 'Cliente Raíz & Barrio'
  );
  const customerEmail = checkoutUser?.email || 'facturacion@raizybarrio.co';

  const subtotal = checkoutCart.reduce((sum, it) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0);
  const deliveryFee = activeDeliveryMode === 'NODE_PICKUP' ? 0.00 : 2.50;
  const totalAmount = subtotal + deliveryFee;

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `#RB-${randomNum}`;
  const transactionId = `TXN-REAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const authCode = Math.floor(100000 + Math.random() * 900000).toString();

  const deliveryLocation = activeDeliveryMode === 'NODE_PICKUP'
    ? (activeNode?.name || 'Sede Urdesa · Espacio Verde')
    : `${activeAddress?.street_address || ''}, ${activeAddress?.neighborhood || ''}, ${activeAddress?.city || 'Guayaquil'}`;

  const estimatedDate = activeDeliveryMode === 'NODE_PICKUP'
    ? (activeNode?.pickup_schedule || 'Sáb. 14 nov. · 8:00 a. m. – 12:00 p. m.')
    : (activeAddress?.delivery_schedule || 'Sáb. 14 nov. · 2:00 – 6:00 p. m.');

  const prepEstimate = activeDeliveryMode === 'NODE_PICKUP'
    ? 'Tu canasta estará lista para retiro el Sábado de 8:00 AM a 12:00 PM'
    : 'Entrega programada en tu puerta para el Sábado entre 2:00 PM y 6:00 PM';

  const orderItems = checkoutCart.map(item => ({
    id: item.id,
    title: item.title,
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
    unit: item.unit || 'kg',
    farmer: item.farmer || 'Huerta Campesina',
    subtotal: Number(item.price || 0) * Number(item.quantity || 1),
    image: item.image || ''
  }));

  // Generar datos de tarjeta para detalles
  let cardBrand = 'VISA';
  let cardLast4 = '4821';
  if (activePaymentMethod === 'CARD') {
    if (isUsingNewCard) {
      const numInput = document.getElementById('new-card-number');
      const cleanNum = numInput ? numInput.value.replace(/\D/g, '') : '';
      cardBrand = detectCardBrand(cleanNum);
      cardLast4 = cleanNum.slice(-4) || '9999';
    } else if (activeCardId) {
      const found = checkoutSavedCards.find(c => c.id === activeCardId);
      if (found) {
        cardBrand = found.brand.toUpperCase();
        cardLast4 = found.last4;
      }
    }
  }

  // Estructura completa para Supabase
  const orderRecord = {
    order_number: orderNumber,
    user_id: userId,
    customer_name: customerName,
    customer_email: customerEmail,
    items: orderItems,
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    shipping_cost: deliveryFee,
    total_amount: totalAmount,
    total_price: totalAmount,
    delivery_type: activeDeliveryMode === 'NODE_PICKUP' ? 'nodo' : 'domicilio',
    delivery_type_code: activeDeliveryMode,
    delivery_location: deliveryLocation,
    delivery_address: deliveryLocation,
    delivery_estimated_date: estimatedDate,
    preparation_time_estimate: prepEstimate,
    delivery_address_or_node_id: activeDeliveryMode === 'NODE_PICKUP' ? activeNode?.id : activeAddress?.id,
    payment_method: activePaymentMethod,
    payment_method_type: activePaymentMethod === 'CARD' ? 'card' : 'cash_on_delivery',
    payment_status: 'COMPLETED',
    payment_details: {
      transaction_id: transactionId,
      payment_method: activePaymentMethod,
      brand: activePaymentMethod === 'CARD' ? cardBrand : 'CASH',
      last4: activePaymentMethod === 'CARD' ? cardLast4 : 'N/A',
      cardholder_name: customerName,
      authorization_code: authCode,
      simulated: true,
      timestamp: new Date().toISOString()
    },
    delivery_details: {
      delivery_type: activeDeliveryMode === 'NODE_PICKUP' ? 'nodo' : 'domicilio',
      location_name: deliveryLocation,
      address: deliveryLocation,
      city: activeAddress?.city || activeNode?.city || 'Guayaquil',
      delivery_fee: deliveryFee,
      shipping_cost: deliveryFee,
      schedule: estimatedDate
    },
    status: 'confirmed'
  };

  // 2. Simulación Bancaria de 2.5 segundos con procesamiento real en Supabase
  setTimeout(async () => {
    let createdOrderId = null;

    if (window.supabase && typeof window.supabase.fetchApi === 'function') {
      // Inserción en tabla orders
      try {
        const res = await window.supabase.fetchApi('orders', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(orderRecord)
        });
        if (Array.isArray(res) && res.length > 0) {
          createdOrderId = res[0].id;
        }
      } catch (errDb) {
        console.error('Error insertando pedido en Supabase:', errDb);
      }

      // Descuento inmediato de existencias en Supabase products
      for (const it of checkoutCart) {
        try {
          const prods = await window.supabase.fetchApi(`products?id=eq.${it.id}&select=stock_quantity`);
          if (prods && prods.length > 0) {
            const currentStock = prods[0].stock_quantity || 0;
            const newStock = Math.max(0, currentStock - (it.quantity || 1));
            await window.supabase.fetchApi(`products?id=eq.${it.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ stock_quantity: newStock })
            });
          }
        } catch (_) {}
      }

      // Si el usuario marcó guardar tarjeta y era tarjeta nueva
      const saveCardChk = document.getElementById('chk-save-card');
      if (activePaymentMethod === 'CARD' && isUsingNewCard && saveCardChk && saveCardChk.checked && userId) {
        try {
          const expInput = document.getElementById('new-card-expiry');
          const [m, y] = (expInput ? expInput.value : '12/28').split('/');
          await window.supabase.fetchApi('payment_methods', {
            method: 'POST',
            body: JSON.stringify({
              user_id: userId,
              brand: cardBrand,
              last4: cardLast4,
              cardholder_name: customerName,
              exp_month: parseInt(m, 10) || 12,
              exp_year: parseInt('20' + y, 10) || 2028,
              is_default: false
            })
          });
        } catch (_) {}
      }
    }

    // 3. Guardar orden en localStorage para respaldo y vaciar carrito
    const savedOrder = {
      ...orderRecord,
      id: createdOrderId || transactionId,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('rb_last_order', JSON.stringify(savedOrder));
    try {
      const historyKey = userId ? `rb_orders_${userId}` : 'rb_orders_history';
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existingHistory.unshift(savedOrder);
      localStorage.setItem(historyKey, JSON.stringify(existingHistory));
    } catch (_) {}
    localStorage.removeItem('rb_cart');
    localStorage.setItem('raiz_cart', '[]');

    // 4. Redirección a éxito
    const targetOrderId = createdOrderId || transactionId;
    window.location.href = `checkout-success.html?order_id=${encodeURIComponent(targetOrderId)}&order_number=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}`;
  }, 2500);
}

// Toast helper
function showCheckoutToast(msg, icon = '✓') {
  const toast = document.getElementById('checkout-toast');
  const msgEl = document.getElementById('checkout-toast-msg');
  const iconEl = document.getElementById('checkout-toast-icon');
  if (!toast) return;

  if (msgEl) msgEl.textContent = msg;
  if (iconEl) iconEl.textContent = icon;

  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3500);
}

