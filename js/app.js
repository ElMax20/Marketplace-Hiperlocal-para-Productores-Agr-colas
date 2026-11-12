/**
 * Raíz & Barrio - Mercado Campesino Hiperlocal
 * Lógica de Interacción, Carrito, Mapa y Contador
 */

document.addEventListener('DOMContentLoaded', () => {
  try { initCountdown(); } catch (e) { console.warn('Error initCountdown:', e); }
  try { initCart(); } catch (e) { console.warn('Error initCart:', e); }
  try {
    if (window.google && window.google.maps) {
      initGoogleMap();
    }
  } catch (e) { console.warn('Error initGoogleMap:', e); }
  try { initQuantitySteppers(); } catch (e) { console.warn('Error initQuantitySteppers:', e); }
  try { initRoleModal(); } catch (e) { console.warn('Error initRoleModal:', e); }
  try { initSmoothScroll(); } catch (e) { console.warn('Error initSmoothScroll:', e); }
  try { initCosechaDeHoy(); } catch (e) { console.warn('Error initCosechaDeHoy:', e); }
});

/* ==========================================================================
   1. Contador Regresivo para "La cosecha de hoy"
   ========================================================================== */
function initCountdown() {
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  // 8 horas, 42 minutos, 15 segundos iniciales
  let totalSeconds = 8 * 3600 + 42 * 60 + 15;

  function updateTimer() {
    if (totalSeconds <= 0) {
      totalSeconds = 24 * 3600; // reiniciar ciclo diario
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');

    totalSeconds--;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. Sistema de Carrito de Compras
   ========================================================================== */
let cart = [];

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem('raiz_cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error leyendo carrito:', e);
  }
  return [];
}

function saveCartToStorage() {
  try {
    localStorage.setItem('raiz_cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('Error guardando carrito:', e);
  }
}

function initCart() {
  const cartBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const closeCartBtn = document.getElementById('cart-close-btn');
  const cartBackdrop = document.getElementById('cart-backdrop');

  if (cartBtn && !cartBtn.dataset.listenerAttached) {
    cartBtn.dataset.listenerAttached = 'true';
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }
  if (closeCartBtn && !closeCartBtn.dataset.listenerAttached) {
    closeCartBtn.dataset.listenerAttached = 'true';
    closeCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeCart();
    });
  }
  if (cartBackdrop && !cartBackdrop.dataset.listenerAttached) {
    cartBackdrop.dataset.listenerAttached = 'true';
    cartBackdrop.addEventListener('click', (e) => {
      e.preventDefault();
      closeCart();
    });
  }

  // Delivery toggle inside cart
  try {
    const deliveryOptions = document.querySelectorAll('input[name="cart-delivery"]');
    deliveryOptions.forEach(opt => {
      opt.addEventListener('change', updateCartUI);
    });
  } catch (e) {}

  try {
    cart = loadCartFromStorage();
    renderCartItems();
    updateCartBadge();
  } catch (e) {}
}

function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer) {
    drawer.classList.remove('translate-x-full', 'pointer-events-none');
    drawer.classList.add('pointer-events-auto');
  }
  if (backdrop) {
    backdrop.classList.remove('hidden', 'pointer-events-none');
    backdrop.classList.add('pointer-events-auto');
  }
  document.body.classList.add('modal-open');
  if (typeof window.pauseHeroSliderForModal === 'function') window.pauseHeroSliderForModal();
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer) {
    drawer.classList.add('translate-x-full', 'pointer-events-none');
    drawer.classList.remove('pointer-events-auto');
  }
  if (backdrop) {
    backdrop.classList.add('hidden', 'pointer-events-none');
    backdrop.classList.remove('pointer-events-auto');
  }
  document.body.classList.remove('modal-open');
  if (typeof window.resumeHeroSliderFromModal === 'function') window.resumeHeroSliderFromModal();
  document.body.style.overflow = '';
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += product.quantity;
  } else {
    cart.push({ ...product });
  }

  saveCartToStorage();
  renderCartItems();
  updateCartBadge();
  showToast(`¡Agregado al carrito: ${product.title}!`);
  openCart();
}

function updateCartQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCartToStorage();
  renderCartItems();
  updateCartBadge();
}

function removeCartItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCartToStorage();
  renderCartItems();
  updateCartBadge();
}

function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}

function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-stone-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p class="font-medium text-stone-700">Tu canasta está vacía</p>
        <p class="text-sm mt-1">Explora los productos cosechados hoy para agregar frescura local.</p>
        <button onclick="document.getElementById('cart-close-btn').click();" class="mt-4 px-4 py-2 bg-[#1a3d2f] text-white text-xs font-semibold rounded-lg hover:bg-[#255440] transition">
          Explorar cosecha
        </button>
      </div>
    `;
    updateCartUI();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="flex items-center gap-3 py-3 border-b border-stone-200">
      <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-cover rounded-lg border border-stone-200">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-stone-800 truncate">${item.title}</h4>
        <p class="text-xs text-stone-500 truncate">${item.origin || 'Origen verificado'}</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-bold text-[#1a3d2f]">$${formatCOP(item.price * item.quantity)}</span>
          <div class="flex items-center border border-stone-200 rounded-md bg-stone-50">
            <button onclick="updateCartQuantity('${item.id}', -1)" class="px-2 py-0.5 text-stone-600 hover:text-stone-900 text-xs">-</button>
            <span class="px-2 py-0.5 text-xs font-medium text-stone-800">${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.id}', 1)" class="px-2 py-0.5 text-stone-600 hover:text-stone-900 text-xs">+</button>
          </div>
        </div>
      </div>
      <button onclick="removeCartItem('${item.id}')" class="text-stone-400 hover:text-red-500 p-1" title="Eliminar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  `).join('');

  updateCartUI();
}

function updateCartUI() {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const selectedDelivery = document.querySelector('input[name="cart-delivery"]:checked')?.value || 'pickup';
  
  // Si no hay productos en el carrito, envío y total son $0
  let shippingCost = 0;
  if (subtotal > 0 && selectedDelivery === 'home') {
    shippingCost = subtotal >= 4 ? 0 : 0.35;
  }

  const total = subtotal > 0 ? (subtotal + shippingCost) : 0;

  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const freeShippingHint = document.getElementById('cart-free-shipping-hint');

  if (subtotalEl) subtotalEl.textContent = `$${formatCOP(subtotal)}`;
  if (shippingEl) {
    if (subtotal === 0) {
      shippingEl.innerHTML = '<span class="text-stone-400 font-normal">$0,00</span>';
    } else if (selectedDelivery === 'pickup') {
      shippingEl.innerHTML = '<span class="text-emerald-700 font-semibold">Gratis (Retiro en Nodo)</span>';
    } else {
      shippingEl.innerHTML = shippingCost === 0 
        ? '<span class="text-emerald-700 font-semibold">Gratis</span>' 
        : `$${formatCOP(shippingCost)}`;
    }
  }
  if (totalEl) totalEl.textContent = `$${formatCOP(total)}`;

  if (freeShippingHint) {
    if (subtotal === 0) {
      freeShippingHint.innerHTML = '🌱 Tu canasta está vacía. Selecciona productos frescos de nuestros agricultores.';
    } else if (subtotal >= 4) {
      freeShippingHint.innerHTML = '✨ ¡Felicidades! Tienes <strong>envío gratis</strong> garantizado.';
    } else {
      const rest = 4 - subtotal;
      freeShippingHint.innerHTML = `🌱 Agrega <strong>$${formatCOP(rest)}</strong> más para entrega a domicilio gratis.`;
    }
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  if (badge) {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  }
}

function handleCartCheckout() {
  if (!cart || cart.length === 0) {
    showToast('Tu canasta de compra está vacía. Agrega productos para continuar.');
    return;
  }
  saveCartToStorage();
  window.location.href = 'mercado.html';
}

/* ==========================================================================
   3. Mapa Interactivo de Nodos de Recolección (Google Maps API)
   ========================================================================== */
let googleMapInstance = null;
let googleMarkers = [];
let activeInfoWindow = null;

const pickupNodes = [
  {
    id: 'node-1',
    name: 'Sede Urdesa · Espacio Verde',
    venue: 'Sede Urdesa · Espacio Verde',
    address: 'Av. Víctor Emilio Estrada y Bálsamos · Guayaquil',
    schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
    lat: -2.1698,
    lng: -79.9142,
    status: 'Punto verificado con refrigeración',
    quota: '18 canastas asignadas'
  },
  {
    id: 'node-2',
    name: 'Sede Puerto Santa Ana · Café del Río',
    venue: 'Sede Puerto Santa Ana · Café del Río',
    address: 'Numa Pompilio Llona, Edificio The Point · Guayaquil',
    schedule: 'Jueves y Sábado: 8:30 AM – 1:30 PM',
    lat: -2.1804,
    lng: -79.8767,
    status: 'Acopio comunitario fresco',
    quota: '12 canastas asignadas'
  },
  {
    id: 'node-3',
    name: 'Sede Ceibos · Mercado Sostenible',
    venue: 'Sede Ceibos · Mercado Sostenible',
    address: 'Av. del Bombero Km 6.5, Plaza Ceibos · Guayaquil',
    schedule: 'Sábados: 8:00 AM – 2:00 PM',
    lat: -2.1729,
    lng: -79.9546,
    status: 'Punto de recolección fin de semana',
    quota: '25 canastas asignadas'
  }
];

function getPinIcon(isActive) {
  const bgColor = isActive ? '#c85a32' : '#1a3d2f';
  const scale = isActive ? 1.15 : 1.0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <circle cx="20" cy="18" r="16" fill="${bgColor}" stroke="#ffffff" stroke-width="2.5" filter="url(#pinShadow)"/>
    <path d="M20 10c-3.3 0-6 2.7-6 6 0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.7-6-6-6zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" fill="#ffffff"/>
  </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(40 * scale, 40 * scale),
    anchor: new google.maps.Point(20 * scale, 36 * scale)
  };
}

window.initGoogleMap = function() {
  const mapElement = document.getElementById('google-map') || document.getElementById('leaflet-map');
  if (!mapElement || !window.google || !window.google.maps) return;

  activeInfoWindow = new google.maps.InfoWindow();

  // Estilos orgánicos y armónicos con la estética de Raíz & Barrio en Guayaquil
  googleMapInstance = new google.maps.Map(mapElement, {
    center: { lat: -2.1894, lng: -79.8891 },
    zoom: 12.5,
    renderingType: 'VECTOR',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      { "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] },
      { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#9c9c9c" }] },
      { "featureType": "all", "elementType": "labels.text", "stylers": [{ "color": "#4b5563" }] },
      { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f5f1eb" }] },
      { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#fcfbf9" }] },
      { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "color": "#eef4ec" }] },
      { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
      { "featureType": "poi.business", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
      { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#d7e8d0" }] },
      { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 40 }] },
      { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }, { "color": "#e2ded6" }] },
      { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
      { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
      { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#cde5e8" }, { "visibility": "on" }] }
    ]
  });

  googleMarkers = [];

  pickupNodes.forEach((node, index) => {
    const isDefault = index === 0;
    const marker = new google.maps.Marker({
      position: { lat: node.lat, lng: node.lng },
      map: googleMapInstance,
      title: node.venue,
      icon: getPinIcon(isDefault),
      animation: google.maps.Animation.DROP
    });

    const infoContent = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 13px; max-width: 220px; line-height: 1.4; padding: 4px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #c85a32; letter-spacing: 0.5px;">Punto de Recolección</span>
        <h4 style="font-size: 14px; font-weight: 700; color: #1a3d2f; margin: 4px 0 2px 0;">${node.venue}</h4>
        <p style="color: #4b5563; margin-bottom: 4px; font-size: 12px;">${node.address}</p>
        <p style="font-size: 11px; color: #15803d; font-weight: 600; margin-bottom: 6px;">🕒 ${node.schedule}</p>
        <button onclick="selectPickupNode('${node.id}')" style="width: 100%; background: #1a3d2f; color: white; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
          Elegir este nodo
        </button>
      </div>
    `;

    marker.addListener('click', () => {
      selectPickupNode(node.id);
    });

    googleMarkers.push({ id: node.id, marker, infoContent });

    if (isDefault) {
      activeInfoWindow.setContent(infoContent);
      activeInfoWindow.open(googleMapInstance, marker);
    }
  });

  // Interacción al hacer clic en las tarjetas laterales
  pickupNodes.forEach(node => {
    const cardEl = document.getElementById(`card-${node.id}`);
    if (cardEl) {
      cardEl.onclick = () => selectPickupNode(node.id);
    }
  });
};

window.selectPickupNode = function(nodeId) {
  const node = pickupNodes.find(n => n.id === nodeId);
  if (!node) return;

  // Actualizar estilos de tarjetas
  pickupNodes.forEach(n => {
    const el = document.getElementById(`card-${n.id}`);
    if (el) {
      if (n.id === nodeId) {
        el.classList.add('border-[#1a3d2f]', 'bg-[#f4f7f4]', 'ring-2', 'ring-[#1a3d2f]/20');
        el.classList.remove('border-stone-200', 'bg-white');
      } else {
        el.classList.remove('border-[#1a3d2f]', 'bg-[#f4f7f4]', 'ring-2', 'ring-[#1a3d2f]/20');
        el.classList.add('border-stone-200', 'bg-white');
      }
    }
  });

  // Actualizar pines e InfoWindow en Google Maps
  googleMarkers.forEach(item => {
    const isActive = item.id === nodeId;
    if (item.marker && item.marker.setIcon) {
      item.marker.setIcon(getPinIcon(isActive));
      if (isActive && googleMapInstance && activeInfoWindow) {
        googleMapInstance.panTo({ lat: node.lat, lng: node.lng });
        googleMapInstance.setZoom(14);
        activeInfoWindow.setContent(item.infoContent);
        activeInfoWindow.open(googleMapInstance, item.marker);
      }
    }
  });

  showToast(`Punto seleccionado: ${node.venue} (${node.name.split('/')[0].trim()})`);
};

/* ==========================================================================
   4. Selectores de Cantidad en Tarjetas de Productos
   ========================================================================== */
function initQuantitySteppers() {
  if (document.body.dataset.steppersInitialized === 'true') return;
  document.body.dataset.steppersInitialized = 'true';

  document.querySelectorAll('.qty-stepper').forEach(stepper => {
    const input = stepper.querySelector('input');
    const minusBtn = stepper.querySelector('.btn-minus');
    const plusBtn = stepper.querySelector('.btn-plus');

    if (minusBtn && input) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
      });
    }

    if (plusBtn && input) {
      plusBtn.addEventListener('click', () => {
        let val = parseInt(input.value) || 1;
        input.value = val + 1;
      });
    }
  });

  // Click en tarjetas de productos para ver detalle (excepto si hace clic en botón o stepper)
  document.querySelectorAll('[data-product-id]').forEach(card => {
    card.classList.add('cursor-pointer');
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.qty-stepper')) return;
      const id = card.getAttribute('data-product-id');
      if (id) {
        window.location.href = `producto.html?id=${encodeURIComponent(id)}`;
      }
    });
  });

  // Click en tarjetas de canastas para ver detalle
  document.querySelectorAll('[data-basket-id]').forEach(card => {
    card.classList.add('cursor-pointer');
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = card.getAttribute('data-basket-id');
      const mappedId = id === 'canasta-familiar' ? 'canasta-huerto-familiar' : (id === 'canasta-esencial' ? 'canasta-agroecologica' : id);
      window.location.href = `producto.html?id=${encodeURIComponent(mappedId)}`;
    });
  });

  // Botones "Añadir" en productos de temporada
  document.querySelectorAll('.btn-add-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('[data-product-id]');
      if (!card) return;

      const id = card.getAttribute('data-product-id');
      const title = card.getAttribute('data-product-title');
      const price = parseFloat(card.getAttribute('data-product-price')) || 0;
      const unit = card.getAttribute('data-product-unit');
      const image = card.getAttribute('data-product-image');
      const origin = card.getAttribute('data-product-origin');
      const qtyInput = card.querySelector('.qty-stepper input');
      const quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      addToCart({
        id,
        title,
        price,
        unit,
        quantity,
        image,
        origin
      });
    });
  });

  // Botones de Canastas Semanales
  document.querySelectorAll('.btn-add-basket').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const basketCard = e.target.closest('[data-basket-id]');
      if (!basketCard) return;

      const id = basketCard.getAttribute('data-basket-id');
      const title = basketCard.getAttribute('data-basket-title');
      const price = parseFloat(basketCard.getAttribute('data-basket-price')) || 0;
      const image = basketCard.getAttribute('data-basket-image');

      addToCart({
        id,
        title,
        price,
        unit: 'canasta semanal',
        quantity: 1,
        image,
        origin: 'Selección de agricultores aliados'
      });
    });
  });
}

/* ==========================================================================
   5. Modal de Perfiles / Roles -> Ahora redirigido a Login Segmentado
   ========================================================================== */
function initRoleModal() {
  const openButtons = document.querySelectorAll('.open-role-modal');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof openLoginModal === 'function') {
        openLoginModal('cliente');
      }
    });
  });
}

// Exportar utilidades del carrito globalmente para handlers inline y módulos
window.openCart = openCart;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;
window.showToast = showToast;

/* ==========================================================================
   6. Notificaciones Toast Flotantes
   ========================================================================== */
function showToast(message) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'animate-slide-up pointer-events-auto bg-[#1a3d2f] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm border border-emerald-800/40';
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
    <span class="font-medium">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   7. Desplazamiento Suave
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Exportar utilidades del carrito globalmente para handlers inline y módulos
window.openCart = openCart;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeCartItem = removeCartItem;
window.showToast = showToast;

/* ==========================================================================
   8. Sincronización Real de "La cosecha de hoy" (Top 4 Productos Mejor Valorados)
   ========================================================================== */

/**
 * Normaliza la URL de imagen de un producto para garantizar que apunte al Storage de Supabase
 */
function normalizeCosechaImageUrl(img) {
  if (!img) return 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const clean = img.replace(/^\/+/, '');
  return `https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/${clean}`;
}

/**
 * Extrae la valoración y número de opiniones reales de un producto,
 * combinando las columnas de Supabase (si existen) y las opiniones verificadas
 * en localStorage almacenadas por el sistema de detalle de producto.
 */
function getProductRealRating(p) {
  // 1. Columnas en Supabase (si existen en la base de datos)
  const dbRating = (p.rating !== undefined && p.rating !== null && !isNaN(Number(p.rating))) ? Number(p.rating) : 0;
  const dbReviews = (p.reviews_count !== undefined && p.reviews_count !== null && !isNaN(Number(p.reviews_count)))
    ? Number(p.reviews_count)
    : ((p.reviews !== undefined && p.reviews !== null && !isNaN(Number(p.reviews))) ? Number(p.reviews) : 0);

  // 2. Reseñas reales persistidas de usuarios (localStorage por id / numericId / slug)
  let localReviews = [];
  try {
    const keys = [
      p.id ? `product_reviews_${p.id}` : null,
      p.numericId ? `product_reviews_${p.numericId}` : null
    ].filter(Boolean);

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localReviews = parsed.filter(r => !String(r.id).startsWith('mock-'));
          if (localReviews.length > 0) break;
        }
      }
    }
  } catch (_) {}

  let localRating = 0;
  let localCount = localReviews.length;
  if (localCount > 0) {
    const sum = localReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    localRating = Number((sum / localCount).toFixed(1));
  }

  // Prioridad 1: Si Supabase tiene rating > 0 o reviews_count > 0 en la BD
  if (dbRating > 0 || dbReviews > 0) {
    return {
      rating: dbRating,
      reviewsCount: dbReviews || 1,
      hasRating: true
    };
  }

  // Prioridad 2: Si existen opiniones reales de usuarios registradas en el marketplace
  if (localRating > 0 || localCount > 0) {
    return {
      rating: localRating,
      reviewsCount: localCount,
      hasRating: true
    };
  }

  return {
    rating: 0,
    reviewsCount: 0,
    hasRating: false
  };
}

/**
 * Consulta la tabla 'products' en Supabase y renderiza como máximo
 * los 4 productos mejor valorados con calificación > 0.
 * Cumple la regla estricta: Si solo 1 tiene valoración, muestra solo ese 1.
 */
async function initCosechaDeHoy() {
  const grid = document.getElementById('cosecha-grid');
  if (!grid) return;

  let products = [];

  // Consulta a Supabase
  if (window.supabase) {
    try {
      if (typeof window.supabase.from === 'function') {
        const { data, error } = await window.supabase
          .from('products')
          .select('*')
          .eq('is_available', true);
        if (!error && Array.isArray(data) && data.length > 0) {
          products = data;
        }
      }
      if (products.length === 0 && typeof window.supabase.getProducts === 'function') {
        const all = await window.supabase.getProducts();
        if (Array.isArray(all)) {
          products = all.filter(p => p.is_available !== false);
        }
      }
    } catch (err) {
      console.warn('Advertencia al consultar Supabase para "La cosecha de hoy":', err);
    }
  }

  // Fallback si no hay conexión o no cargó de Supabase
  if (products.length === 0 && typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(PRODUCTS_DATA)) {
    products = PRODUCTS_DATA.filter(p => !p.availability || !p.availability.includes('Agotado'));
  }

  // 1. Filtrar únicamente los productos disponibles con valoración válida (rating > 0 o reviews_count > 0)
  const ratedProducts = [];
  for (const p of products) {
    if (p.is_available === false || p.is_active === false) continue;
    const stats = getProductRealRating(p);
    if (stats.hasRating && (stats.rating > 0 || stats.reviewsCount > 0)) {
      ratedProducts.push({
        ...p,
        realRating: stats.rating,
        realReviewsCount: stats.reviewsCount
      });
    }
  }

  // 2. Ordenar de mayor a menor calificación (rating DESC)
  ratedProducts.sort((a, b) => b.realRating - a.realRating || b.realReviewsCount - a.realReviewsCount);

  // 3. Tomar como máximo los 4 mejores productos
  const top4 = ratedProducts.slice(0, 4);

  // 4. Regla estricta: Si no hay productos con valoración válida, mostrar mensaje limpio
  if (top4.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-serif">🌱</div>
        <h3 class="font-serif text-lg text-stone-900 font-semibold">Cosechas en proceso de valoración</h3>
        <p class="text-xs text-stone-500 mt-1 max-w-md mx-auto">
          Los productos con valoraciones y opiniones verificadas de nuestros clientes aparecerán aquí automáticamente según su calificación.
        </p>
        <a href="mercado.html" class="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-full bg-[#1a3d2f] hover:bg-[#255440] text-white text-xs font-semibold shadow-sm transition">
          <span>Explorar catálogo completo en el Mercado</span>
          <span>→</span>
        </a>
      </div>
    `;
    return;
  }

  // 5. Renderizar exactamente los productos calificados (1 si hay 1, 2 si hay 2, etc. sin tarjetas de relleno)
  grid.innerHTML = top4.map(p => {
    const priceNum = typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0);
    const priceDisplay = priceNum.toFixed(2).replace('.', ',');
    const unitStr = p.unit || 'kg';
    const titleStr = p.title || 'Producto campesino';
    const rawImg = p.image_url || p.image || '';
    const imgUrl = normalizeCosechaImageUrl(rawImg);

    // Origen de finca y cantón
    let originStr = 'Finca campesina aliada';
    if (p.description) {
      const parts = p.description.split('·');
      if (parts.length >= 2) {
        originStr = `${parts[0].trim()} • ${parts[1].trim()}`;
      } else {
        originStr = p.description.trim();
      }
    }

    // Estrellas y formato numérico
    const roundedStars = Math.min(5, Math.max(1, Math.round(p.realRating)));
    const starsHtml = '★'.repeat(roundedStars) + '☆'.repeat(5 - roundedStars);
    const scoreStr = p.realRating.toFixed(1);
    const reviewWord = p.realReviewsCount === 1 ? 'reseña' : 'reseñas';
    const prodId = p.id || p.numericId;

    return `
      <div 
        class="card-hover bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-stone-300 relative"
        data-product-id="${prodId}"
        data-product-title="${titleStr}"
        data-product-price="${priceNum}"
        data-product-unit="${unitStr}"
        data-product-image="${imgUrl}"
        data-product-origin="${originStr}"
      >
        <div class="relative aspect-square overflow-hidden bg-stone-100">
          <img 
            src="${imgUrl}" 
            alt="${titleStr}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy" 
            decoding="async"
            onerror="this.src='https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/hero_basket.jpg'"
          >
          <span class="absolute top-3 left-3 bg-[#c85a32] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            Cosecha destacada
          </span>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-[11px] text-stone-500 font-medium truncate">${originStr}</p>
            <h3 class="font-serif text-lg text-stone-900 font-semibold mt-0.5">${titleStr}</h3>
            <div class="flex items-center gap-1 text-[11px] text-amber-500 mt-1">
              <span>${starsHtml}</span>
              <span class="text-stone-500 font-medium">(${scoreStr} · ${p.realReviewsCount} ${reviewWord})</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span class="text-lg font-bold text-[#1a3d2f]">$${priceDisplay}</span>
              <span class="text-xs text-stone-500">/ ${unitStr}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="qty-stepper flex items-center border border-stone-200 rounded-lg bg-stone-50">
                <button class="btn-minus px-2 py-1 text-stone-600 hover:text-stone-900 text-xs font-bold">-</button>
                <input type="text" value="1" readonly class="w-7 text-center bg-transparent text-xs font-bold text-stone-800">
                <button class="btn-plus px-2 py-1 text-stone-600 hover:text-stone-900 text-xs font-bold">+</button>
              </div>
              <button class="btn-add-product bg-[#1a3d2f] hover:bg-[#255440] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition">
                + Añadir
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 6. Asignar interactividad a las tarjetas dinámicas
  attachCosechaCardListeners(grid);
}

/**
 * Conecta los eventos de Stepper (+/-), botón "+ Añadir" y clic de navegación
 */
function attachCosechaCardListeners(container) {
  if (!container) return;

  // Steppers
  container.querySelectorAll('.qty-stepper').forEach(stepper => {
    const minus = stepper.querySelector('.btn-minus');
    const plus = stepper.querySelector('.btn-plus');
    const input = stepper.querySelector('input');
    if (minus && input && !minus.dataset.hasListener) {
      minus.dataset.hasListener = 'true';
      minus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
      });
    }
    if (plus && input && !plus.dataset.hasListener) {
      plus.dataset.hasListener = 'true';
      plus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(input.value) || 1;
        input.value = val + 1;
      });
    }
  });

  // Botón "+ Añadir" al carrito
  container.querySelectorAll('.btn-add-product').forEach(btn => {
    if (btn.dataset.hasListener) return;
    btn.dataset.hasListener = 'true';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('[data-product-id]');
      if (!card) return;

      const id = card.getAttribute('data-product-id');
      const title = card.getAttribute('data-product-title');
      const price = parseFloat(card.getAttribute('data-product-price')) || 0;
      const unit = card.getAttribute('data-product-unit');
      const image = card.getAttribute('data-product-image');
      const origin = card.getAttribute('data-product-origin');
      const qtyInput = card.querySelector('.qty-stepper input');
      const quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      addToCart({
        id,
        title,
        price,
        unit,
        quantity,
        image,
        origin
      });
    });
  });

  // Clic en la tarjeta para abrir ficha de producto
  container.querySelectorAll('[data-product-id]').forEach(card => {
    if (card.dataset.hasClickListener) return;
    card.dataset.hasClickListener = 'true';
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.qty-stepper')) return;
      const id = card.getAttribute('data-product-id');
      if (id) {
        window.location.href = `producto.html?id=${encodeURIComponent(id)}`;
      }
    });
  });
}

// Reactividad ante cambios en localStorage (cuando el usuario opina o valora en otra pestaña)
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('product_reviews_')) {
    initCosechaDeHoy();
  }
});
window.addEventListener('focus', () => {
  initCosechaDeHoy();
});
window.initCosechaDeHoy = initCosechaDeHoy;
window.getProductRealRating = getProductRealRating;
