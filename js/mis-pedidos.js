// js/mis-pedidos.js
// Lógica de carga, formateo y renderizado reactivo de la vista "Mis pedidos"
// Conectada a Supabase (tabla orders) y respaldada con el perfil activo

document.addEventListener('DOMContentLoaded', () => {
  initMisPedidos();
});

// Pedidos de demostración extraídos fielmente de "Mis pedidos · Demostración.png"
const DEMO_ORDERS = [
  {
    id: "demo-ord-001",
    order_number: "RB-261106",
    created_at: "2026-11-06T14:30:00Z",
    status: "delivered",
    payment_method: "Tarjeta de crédito",
    total_amount: 58.00,
    items: [
      {
        title: "Canasta Huerto Familiar",
        name: "Canasta Huerto Familiar",
        producer_name: "Red de Familias de Choachí",
        quantity: 1,
        unit: "canasta · 8–10 kg",
        price: 58.00,
        subtotal: 58.00,
        image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    id: "demo-ord-002",
    order_number: "RB-261030",
    created_at: "2026-10-30T10:15:00Z",
    status: "delivered",
    payment_method: "Transferencia PSE",
    total_amount: 12.80,
    items: [
      {
        title: "Tomate de huerta",
        name: "Tomate de huerta",
        producer_name: "Finca La Esperanza",
        quantity: 2,
        unit: "1 kg",
        price: 6.40,
        subtotal: 12.80,
        image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    id: "demo-ord-003",
    order_number: "RB-261023",
    created_at: "2026-10-23T11:45:00Z",
    status: "delivered",
    payment_method: "Nequi",
    total_amount: 10.20,
    items: [
      {
        title: "Aguacate Hass",
        name: "Aguacate Hass",
        producer_name: "Familia Rojas",
        quantity: 1,
        unit: "1 kg",
        price: 10.20,
        subtotal: 10.20,
        image_url: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    id: "demo-ord-004",
    order_number: "RB-261016",
    created_at: "2026-10-16T16:20:00Z",
    status: "delivered",
    payment_method: "Tarjeta de débito",
    total_amount: 16.00,
    items: [
      {
        title: "Fresas de temporada",
        name: "Fresas de temporada",
        producer_name: "Cooperativa La Colina",
        quantity: 2,
        unit: "500 g",
        price: 8.00,
        subtotal: 16.00,
        image_url: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    id: "demo-ord-005",
    order_number: "RB-261009",
    created_at: "2026-10-09T09:10:00Z",
    status: "delivered",
    payment_method: "Transferencia PSE",
    total_amount: 14.50,
    items: [
      {
        title: "Queso campesino",
        name: "Queso campesino",
        producer_name: "Lácteos La Pradera",
        quantity: 1,
        unit: "500 g",
        price: 14.50,
        subtotal: 14.50,
        image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80"
      }
    ]
  }
];

/**
 * Obtiene el usuario activo en sesión
 */
function getActiveUser() {
  try {
    const raw = localStorage.getItem('rb_cached_profile') || 
                localStorage.getItem('rb_current_user') || 
                localStorage.getItem('raiz_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error parseando usuario activo:', e);
  }
  return null;
}

/**
 * Actualiza el contador del carrito en el navbar
 */
function updateCartBadge() {
  try {
    const raw = localStorage.getItem('rb_cart') || localStorage.getItem('raiz_cart');
    const cart = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch (e) {}
}

/**
 * Formatea fechas al estilo: "Vie. 6 nov." y año "2026"
 */
function formatPurchaseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { dayDate: 'Fecha reciente', year: '2026' };
  }

  const days = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
  const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return {
    dayDate: `${dayName} ${dayNum} ${monthName}`,
    year: `${year}`
  };
}

/**
 * Formatea valores numéricos a moneda USD ($XX.XX)
 */
function formatUSD(num) {
  const val = Number(num) || 0;
  return val.toFixed(2);
}

/**
 * Limpia y normaliza el método de pago para proteger la privacidad
 */
function cleanPaymentMethodName(method, details) {
  if (!method) return 'Tarjeta de crédito';
  const m = String(method).toLowerCase();
  if (m.includes('debito') || m.includes('débito')) {
    return 'Tarjeta de débito';
  }
  if (m.includes('card') || m.includes('tarjeta') || m.includes('crédito') || m.includes('credito')) {
    return 'Tarjeta de crédito';
  }
  if (m.includes('nequi')) {
    return 'Nequi';
  }
  if (m.includes('pse')) {
    return 'Transferencia PSE';
  }
  if (m.includes('transferencia') || m.includes('bancaria')) {
    return 'Transferencia bancaria';
  }
  if (m.includes('nodo') || m.includes('cash') || m.includes('efectivo')) {
    return 'Efectivo en nodo';
  }
  return method;
}

/**
 * Retorna estilos y badges según el estado del pedido
 */
function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered' || s === 'entregado') {
    return {
      label: 'Entregado',
      icon: '✓',
      badgeClass: 'bg-[#E8F3EC] text-[#143628] border border-[#c3dfcc]'
    };
  }
  if (s === 'ready_at_node' || s === 'listo_en_nodo' || s === 'listo') {
    return {
      label: 'Listo en nodo',
      icon: '📍',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200'
    };
  }
  if (s === 'in_preparation' || s === 'en_preparacion' || s === 'preparando' || s === 'confirmed' || s === 'confirmado') {
    return {
      label: 'En preparación',
      icon: '⏳',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200'
    };
  }
  if (s === 'cancelled' || s === 'cancelado') {
    return {
      label: 'Cancelado',
      icon: '✕',
      badgeClass: 'bg-red-50 text-red-700 border border-red-200'
    };
  }
  return {
    label: 'Confirmado',
    icon: '✓',
    badgeClass: 'bg-[#E8F3EC] text-[#143628] border border-[#c3dfcc]'
  };
}

/**
 * Consulta pedidos en Supabase con fallback local ordenados descendentemente
 */
async function loadOrders(userId) {
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === '1';

  if (isDemo) {
    return DEMO_ORDERS;
  }

  let orders = [];

  // 1. Consulta en Supabase
  if (window.supabase && typeof window.supabase.fetchApi === 'function' && userId && userId !== 'demo-user') {
    try {
      const remoteOrders = await window.supabase.fetchApi(
        `orders?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`
      );
      if (Array.isArray(remoteOrders)) {
        orders = remoteOrders;
      }
    } catch (errDb) {
      console.warn('Advertencia al consultar orders en Supabase:', errDb);
    }
  }

  // 2. Consulta en historial local de pedidos (por si se acaba de completar un checkout)
  try {
    const rawLocalHistory = localStorage.getItem(`rb_orders_${userId}`) || localStorage.getItem('rb_orders_history');
    if (rawLocalHistory) {
      const localList = JSON.parse(rawLocalHistory);
      if (Array.isArray(localList)) {
        localList.forEach(lo => {
          if (!orders.some(o => (o.id && o.id === lo.id) || (o.order_number && o.order_number === lo.order_number))) {
            orders.push(lo);
          }
        });
      }
    }

    const rawLast = localStorage.getItem('rb_last_order');
    if (rawLast) {
      const lastOrder = JSON.parse(rawLast);
      if (lastOrder && (!lastOrder.user_id || lastOrder.user_id === userId)) {
        if (!orders.some(o => (o.id && o.id === lastOrder.id) || (o.order_number && o.order_number === lastOrder.order_number))) {
          orders.unshift(lastOrder);
        }
      }
    }
  } catch (errLocal) {
    console.warn('Error leyendo historial local de pedidos:', errLocal);
  }

  // Ordenar por fecha de creación descendente
  orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return orders;
}

/**
 * Renderiza la interfaz reactiva según los pedidos encontrados
 */
function renderOrdersView(orders) {
  const countBadge = document.getElementById('orders-count-badge');
  const emptyState = document.getElementById('orders-empty-state');
  const tableRowsContainer = document.getElementById('orders-table-rows');
  const footerCount = document.getElementById('orders-footer-count');
  const ordersBottomBar = document.getElementById('orders-bottom-bar');
  const kickerEl = document.getElementById('orders-kicker');
  const titleEl = document.getElementById('orders-title');
  const subtitleEl = document.getElementById('orders-subtitle');
  const trustBadgeBelow = document.getElementById('trust-badge-below');
  const trustBadgeRight = document.getElementById('trust-badge-right');
  const blockTitleEl = document.getElementById('orders-block-title');
  const demoBadgeContainer = document.getElementById('demo-badge-container');

  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === '1';

  if (isDemo) {
    if (kickerEl) kickerEl.textContent = 'MIS PEDIDOS · DEMO';
    if (titleEl) titleEl.textContent = 'Mis pedidos · Demostración';
    if (subtitleEl) subtitleEl.textContent = 'Revisa tus compras consolidadas, fechas de entrega y métodos de pago sin datos sensibles.';
    if (trustBadgeBelow) trustBadgeBelow.classList.remove('hidden');
    if (trustBadgeRight) trustBadgeRight.classList.add('hidden');
    if (blockTitleEl) blockTitleEl.textContent = 'Historial de compras';
    if (demoBadgeContainer) demoBadgeContainer.classList.remove('hidden');
  } else {
    if (kickerEl) kickerEl.textContent = 'MIS PEDIDOS';
    if (titleEl) titleEl.textContent = 'Mis pedidos';
    if (subtitleEl) subtitleEl.textContent = 'Aquí encontrarás tus pedidos, fechas de compra, productos y métodos de pago.';
    if (trustBadgeBelow) trustBadgeBelow.classList.add('hidden');
    if (trustBadgeRight) trustBadgeRight.classList.remove('hidden');
    if (blockTitleEl) blockTitleEl.textContent = 'Tu historial de compras';
    if (demoBadgeContainer) demoBadgeContainer.classList.add('hidden');
  }

  // Desglosar pedidos en filas de productos (como en las imágenes de referencia)
  const rows = [];
  orders.forEach(order => {
    const rawItems = order.items || [];
    const itemsList = Array.isArray(rawItems) ? rawItems : (typeof rawItems === 'string' ? JSON.parse(rawItems) : []);
    
    if (itemsList.length === 0) {
      rows.push({
        order,
        item: {
          title: 'Pedido de productos frescos',
          producer_name: 'Productores agroecológicos locales',
          quantity: 1,
          unit: 'canasta campesina',
          price: order.total_amount,
          subtotal: order.total_amount,
          image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
        }
      });
    } else {
      itemsList.forEach(item => {
        rows.push({
          order,
          item
        });
      });
    }
  });

  const totalCount = rows.length;

  // Actualizar conteo en la cabecera
  if (countBadge) {
    countBadge.textContent = totalCount === 1 ? '1 pedido' : `${totalCount} pedidos`;
  }

  // ESTADO 2: Sin pedidos (Mis pedidos · Vacío.png)
  if (totalCount === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (tableRowsContainer) tableRowsContainer.classList.add('hidden');
    if (footerCount) footerCount.textContent = 'No hay compras registradas';
    if (ordersBottomBar) ordersBottomBar.classList.add('hidden');
    return;
  }

  // ESTADO 1: Con pedidos (Mis pedidos · Demostración.png)
  if (emptyState) emptyState.classList.add('hidden');
  if (tableRowsContainer) tableRowsContainer.classList.remove('hidden');
  if (footerCount) footerCount.textContent = totalCount === 1 ? 'Mostrando el único pedido de tu cuenta' : `Mostrando los ${totalCount} pedidos de tu cuenta`;
  if (ordersBottomBar) ordersBottomBar.classList.remove('hidden');

  let rowsHtml = '';
  rows.forEach(({ order, item }) => {
    const { dayDate, year } = formatPurchaseDate(order.created_at);
    const orderCode = order.order_number || ('RB-' + String(order.id || '261106').slice(0, 6).toUpperCase());
    
    const productTitle = item.title || item.name || 'Producto agroecológico';
    const producerName = item.producer_name || item.farm_name || 'Red de Familias Campesinas';
    
    let quantityPresentation = '';
    const q = Number(item.quantity) || 1;
    const u = String(item.unit || 'unidad').trim();
    if (u.includes('canasta')) {
      quantityPresentation = `${q} canasta · 8–10 kg`;
    } else if (u === '1 kg' || u === '500 g' || u === '250 g') {
      quantityPresentation = `${q} × ${u}`;
    } else if (u.includes('kg') || u.includes('g') || u.includes('lb')) {
      quantityPresentation = `${q} × ${u}`;
    } else {
      quantityPresentation = `${q} ${u}${q > 1 ? 'es' : ''}`;
    }

    const statusObj = getStatusBadge(order.status);
    
    const unitPrice = item.price || (order.total_amount / Math.max(1, q));
    const totalPrice = item.subtotal || (unitPrice * q);
    
    const paymentMethodName = cleanPaymentMethodName(order.payment_method, order.payment_details);
    const productImage = item.image_url || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

    rowsHtml += `
      <div class="grid grid-cols-12 px-6 py-5 sm:py-6 items-center border-b border-stone-100 last:border-b-0 hover:bg-[#FAF8F5]/60 transition text-left">
        
        <!-- Columna 1: Fecha de compra -->
        <div class="col-span-12 sm:col-span-2 mb-3 sm:mb-0">
          <p class="font-bold text-stone-900 text-xs sm:text-sm leading-snug">${dayDate}</p>
          <p class="text-xs text-stone-400 mt-0.5">${year}</p>
          <p class="text-[11px] text-stone-400 font-mono mt-0.5">${orderCode}</p>
        </div>

        <!-- Columna 2: Producto -->
        <div class="col-span-12 sm:col-span-5 flex items-center gap-3.5 sm:gap-4 mb-4 sm:mb-0 pr-2 sm:pr-4">
          <img 
            src="${productImage}" 
            alt="${productTitle}" 
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-stone-100 shadow-2xs"
            onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'"
          >
          <div class="min-w-0">
            <h4 class="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug truncate hover:text-[#143628] transition">${productTitle}</h4>
            <p class="text-xs text-stone-500 font-medium mt-0.5 truncate">${producerName}</p>
            <p class="text-xs text-stone-400 mt-0.5">${quantityPresentation}</p>
            <div class="mt-1.5">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusObj.badgeClass}">
                <span>${statusObj.icon}</span>
                <span>${statusObj.label}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Columna 3: Precio -->
        <div class="col-span-6 sm:col-span-3">
          <p class="font-bold text-stone-900 text-sm sm:text-base leading-snug">$${formatUSD(totalPrice)}</p>
          <p class="text-[11px] text-stone-400 uppercase tracking-wider mt-0.5">USD · total</p>
          <p class="text-[11px] text-stone-500 font-medium mt-0.5">$${formatUSD(unitPrice)} / unidad</p>
        </div>

        <!-- Columna 4: Método de pago -->
        <div class="col-span-6 sm:col-span-2 text-right sm:text-left">
          <p class="text-xs sm:text-sm font-medium text-stone-700">${paymentMethodName}</p>
        </div>

      </div>
    `;
  });

  if (tableRowsContainer) {
    tableRowsContainer.innerHTML = rowsHtml;
  }
}

/**
 * Inicialización principal
 */
async function initMisPedidos() {
  updateCartBadge();

  const user = getActiveUser();
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === '1';
  const allowGuest = urlParams.get('guest') === '1' || urlParams.get('empty') === '1';

  // 1. Verifica la sesión activa del usuario; si no está autenticado, redirige a index.html
  if (!user && !isDemo && !allowGuest) {
    window.location.replace('index.html?openLogin=true');
    return;
  }

  const userId = user ? (user.id || user.user_id) : 'demo-user';
  
  try {
    const orders = await loadOrders(userId);
    renderOrdersView(orders);
  } catch (err) {
    console.error('Error al inicializar Mis pedidos:', err);
    renderOrdersView([]);
  }
}

window.initMisPedidos = initMisPedidos;
window.loadOrders = loadOrders;
