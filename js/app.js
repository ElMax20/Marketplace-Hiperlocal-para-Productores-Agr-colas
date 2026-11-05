/**
 * Raíz & Barrio - Mercado Campesino Hiperlocal
 * Lógica de Interacción, Carrito, Mapa y Contador
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initCart();
  initMap();
  initQuantitySteppers();
  initRoleModal();
  initSmoothScroll();
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
let cart = [
  {
    id: 'canasta-esencial',
    title: 'Canasta Agroecológica Esencial',
    price: 38000,
    unit: 'canasta semanal',
    quantity: 1,
    image: 'assets/images/canasta_esencial.jpg',
    origin: 'Huerta El Renacer & Coop. La Unión'
  }
];

function initCart() {
  const cartBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const closeCartBtn = document.getElementById('cart-close-btn');
  const cartBackdrop = document.getElementById('cart-backdrop');

  if (cartBtn && cartDrawer && closeCartBtn && cartBackdrop) {
    cartBtn.addEventListener('click', () => openCart());
    closeCartBtn.addEventListener('click', () => closeCart());
    cartBackdrop.addEventListener('click', () => closeCart());
  }

  // Delivery toggle inside cart
  const deliveryOptions = document.querySelectorAll('input[name="cart-delivery"]');
  deliveryOptions.forEach(opt => {
    opt.addEventListener('change', updateCartUI);
  });

  renderCartItems();
  updateCartBadge();
}

function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += product.quantity;
  } else {
    cart.push({ ...product });
  }

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
  renderCartItems();
  updateCartBadge();
}

function removeCartItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCartItems();
  updateCartBadge();
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
          <span class="text-xs font-bold text-[#1a3d2f]">$${(item.price * item.quantity).toLocaleString('es-CO')}</span>
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
  
  // Si es retiro en punto de recolección es $0, si es domicilio directo $6.500 (o gratis si supera $40.000)
  let shippingCost = 0;
  if (selectedDelivery === 'home') {
    shippingCost = subtotal >= 40000 ? 0 : 6500;
  }

  const total = subtotal + shippingCost;

  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const freeShippingHint = document.getElementById('cart-free-shipping-hint');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CO')}`;
  if (shippingEl) {
    if (selectedDelivery === 'pickup') {
      shippingEl.innerHTML = '<span class="text-emerald-700 font-semibold">Gratis (Retiro en Nodo)</span>';
    } else {
      shippingEl.innerHTML = shippingCost === 0 
        ? '<span class="text-emerald-700 font-semibold">Gratis</span>' 
        : `$${shippingCost.toLocaleString('es-CO')}`;
    }
  }
  if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO')}`;

  if (freeShippingHint) {
    if (subtotal >= 40000) {
      freeShippingHint.innerHTML = '✨ ¡Felicidades! Tienes <strong>envío gratis</strong> garantizado.';
    } else {
      const rest = 40000 - subtotal;
      freeShippingHint.innerHTML = `🌱 Agrega <strong>$${rest.toLocaleString('es-CO')}</strong> más para entrega a domicilio gratis.`;
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

/* ==========================================================================
   3. Mapa Interactivo de Nodos de Recolección (Leaflet)
   ========================================================================== */
let mapInstance = null;
let mapMarkers = [];

const pickupNodes = [
  {
    id: 'node-1',
    name: 'Sede Barrio San Fernando / Chapinero Alto',
    venue: 'Café del Bosque',
    address: 'Calle 58 # 3-21, Bogotá',
    schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
    lat: 4.6465,
    lng: -74.0578,
    status: 'Punto verificado con refrigeración',
    quota: '14 canastas asignadas'
  },
  {
    id: 'node-2',
    name: 'Sede Teusaquillo · Casa Taller',
    venue: 'Librería & Huerto Central',
    address: 'Carrera 19 # 34-12, Bogotá',
    schedule: 'Miércoles: 2:30 PM – 7:00 PM',
    lat: 4.6295,
    lng: -74.0735,
    status: 'Acopio comunitario',
    quota: '8 canastas asignadas'
  },
  {
    id: 'node-3',
    name: 'Sede Usaquén · Mercado Verde',
    venue: 'Café & Despensa Agroecológica',
    address: 'Calle 119 # 6-18, Bogotá',
    schedule: 'Sábados: 9:00 AM – 2:00 PM',
    lat: 4.6948,
    lng: -74.0305,
    status: 'Punto de recolección fin de semana',
    quota: '22 canastas asignadas'
  }
];

function initMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  // Centro en Bogotá (zona Chapinero/Teusaquillo)
  mapInstance = L.map('leaflet-map', {
    center: [4.655, -74.055],
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: false
  });

  // Mapa claro y minimalista (CartoDB Positron / OSM)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  // Agregar pines para cada nodo
  pickupNodes.forEach((node, index) => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="custom-map-marker ${index === 0 ? 'active' : ''}" id="marker-${node.id}">
          <svg style="width:18px;height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    const marker = L.marker([node.lat, node.lng], { icon: icon }).addTo(mapInstance);
    
    marker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; max-width: 220px; line-height: 1.4;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #c85a32; letter-spacing: 0.5px;">Punto de Recolección</span>
        <h4 style="font-size: 14px; font-weight: 700; color: #1a3d2f; margin: 4px 0 2px 0;">${node.venue}</h4>
        <p style="color: #4b5563; margin-bottom: 4px;">${node.address}</p>
        <p style="font-size: 11px; color: #15803d; font-weight: 600;">🕒 ${node.schedule}</p>
        <button onclick="selectPickupNode('${node.id}')" style="margin-top: 8px; width: 100%; background: #1a3d2f; color: white; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
          Elegir este nodo
        </button>
      </div>
    `);

    mapMarkers.push({ id: node.id, marker });
  });

  // Interacción con las tarjetas laterales
  pickupNodes.forEach(node => {
    const cardEl = document.getElementById(`card-${node.id}`);
    if (cardEl) {
      cardEl.addEventListener('click', () => {
        selectPickupNode(node.id);
      });
    }
  });
}

window.selectPickupNode = function(nodeId) {
  const node = pickupNodes.find(n => n.id === nodeId);
  if (!node) return;

  // Actualizar clases de tarjetas
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

    const markerEl = document.getElementById(`marker-${n.id}`);
    if (markerEl) {
      if (n.id === nodeId) {
        markerEl.classList.add('active');
      } else {
        markerEl.classList.remove('active');
      }
    }
  });

  // Centrar mapa
  if (mapInstance) {
    mapInstance.flyTo([node.lat, node.lng], 14, {
      duration: 1.2
    });

    const targetMarker = mapMarkers.find(m => m.id === nodeId);
    if (targetMarker) {
      setTimeout(() => {
        targetMarker.marker.openPopup();
      }, 700);
    }
  }

  showToast(`Punto seleccionado: ${node.venue} (${node.name.split('/')[0].trim()})`);
};

/* ==========================================================================
   4. Selectores de Cantidad en Tarjetas de Productos
   ========================================================================== */
function initQuantitySteppers() {
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

  // Botones "Añadir" en productos de temporada
  document.querySelectorAll('.btn-add-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('[data-product-id]');
      if (!card) return;

      const id = card.getAttribute('data-product-id');
      const title = card.getAttribute('data-product-title');
      const price = parseInt(card.getAttribute('data-product-price'));
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
      const basketCard = e.target.closest('[data-basket-id]');
      if (!basketCard) return;

      const id = basketCard.getAttribute('data-basket-id');
      const title = basketCard.getAttribute('data-basket-title');
      const price = parseInt(basketCard.getAttribute('data-basket-price'));
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
   5. Modal de Perfiles / Roles (Productor, Consumidor, Administrador)
   ========================================================================== */
function initRoleModal() {
  const modal = document.getElementById('role-modal');
  const openButtons = document.querySelectorAll('.open-role-modal');
  const closeButton = document.getElementById('close-role-modal');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
}

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
