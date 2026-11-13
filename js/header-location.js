/**
 * Raíz & Barrio - Módulo de Selector de Ubicación en Cabecera (Header Location Selector)
 * Permite alternar interactivamente entre Nodos Comunitarios y Direcciones a Domicilio,
 * actualiza la píldora visual en el navbar, sincroniza con Supabase y adapta el catálogo.
 * 
 * Regla de Oro: Usuarios sin sesión activa (invitados) SIEMPRE verán por defecto
 * un nodo oficial de recolección (Sede Urdesa) y nunca direcciones personales residuales.
 */

const OFFICIAL_PICKUP_NODES = [
  {
    id: 'e0177a54-9cbc-4426-a538-1d630f852ac1',
    name: 'Sede Urdesa · Espacio Verde',
    short_name: 'Sede Urdesa',
    address: 'Av. Víctor Emilio Estrada y Bálsamos',
    city: 'Guayaquil',
    schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
    pickup_schedule: 'Miércoles y Viernes: 3:00 PM – 7:30 PM',
    is_active: true
  },
  {
    id: '65925730-63b5-486f-9dd0-aaac13a0ffe9',
    name: 'Sede Puerto Santa Ana · Café del Río',
    short_name: 'Sede Puerto Santa Ana',
    address: 'Numa Pompilio Llona, Edificio The Point',
    city: 'Guayaquil',
    schedule: 'Jueves y Sábado: 8:30 AM – 1:30 PM',
    pickup_schedule: 'Jueves y Sábado: 8:30 AM – 1:30 PM',
    is_active: true
  },
  {
    id: '7a6f8f1f-ad1b-4f87-9d7f-58f1d3c5053c',
    name: 'Sede Ceibos · Mercado Sostenible',
    short_name: 'Sede Ceibos',
    address: 'Av. del Bombero Km 6.5, Plaza Ceibos',
    city: 'Guayaquil',
    schedule: 'Sábados: 8:00 AM – 2:00 PM',
    pickup_schedule: 'Sábados: 8:00 AM – 2:00 PM',
    is_active: true
  }
];

const DEFAULT_OFFICIAL_NODE = {
  type: 'node',
  id: 'e0177a54-9cbc-4426-a538-1d630f852ac1',
  name: 'Sede Urdesa · Espacio Verde',
  shortName: 'Sede Urdesa',
  detail: 'Av. Víctor Emilio Estrada y Bálsamos · Guayaquil',
  address: 'Av. Víctor Emilio Estrada y Bálsamos',
  city: 'Guayaquil'
};

let headerPickupNodes = [...OFFICIAL_PICKUP_NODES];
let headerDeliveryAddresses = [];
let activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };

/**
 * Determina si un nodo por ID o nombre pertenece a la red de nodos oficiales
 */
function isOfficialNode(id, name) {
  if (!id && !name) return false;
  return OFFICIAL_PICKUP_NODES.some(node => 
    (id && node.id === id) || 
    (name && (node.name === name || node.short_name === name || name.includes(node.short_name)))
  );
}

/**
 * Determina síncronamente si existe una sesión de usuario válida activa
 */
function isUserAuthenticated() {
  try {
    if (typeof getCurrentUser === 'function') {
      const u = getCurrentUser();
      if (u && (u.loggedIn || u.id)) return true;
    }
    const raw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.loggedIn || u.id)) return true;
    }
    const cached = localStorage.getItem('rb_cached_profile');
    if (cached) {
      const p = JSON.parse(cached);
      if (p && (p.id || p.full_name)) return true;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && ((k.startsWith('sb-') && k.includes('auth-token')) || k === 'supabase.auth.token')) {
        const val = localStorage.getItem(k);
        if (val) return true;
      }
    }
  } catch (_) {}
  return false;
}
window.isUserAuthenticated = isUserAuthenticated;

/**
 * Limpia cualquier dato o clave residual de direcciones personales de sesiones anteriores
 */
function purgeResidualPersonalAddresses() {
  try {
    localStorage.removeItem('selected_address');
    localStorage.removeItem('delivery_address');
    localStorage.removeItem('active_node');

    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('rb_delivery_addresses') || k.startsWith('selected_address') || k.startsWith('delivery_address'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {}

  try {
    sessionStorage.removeItem('selected_address');
    sessionStorage.removeItem('delivery_address');
    sessionStorage.removeItem('active_node');
  } catch (_) {}
}
window.purgeResidualPersonalAddresses = purgeResidualPersonalAddresses;

/**
 * Inicializa el selector de ubicación del header (nodos y domicilios)
 */
async function initHeaderLocationSelector() {
  const isAuth = isUserAuthenticated();

  if (!isAuth) {
    // 1. Limpieza rigurosa de direcciones personales residuales si no hay sesión
    purgeResidualPersonalAddresses();

    // 2. Para invitados: permitir únicamente uno de los 3 nodos oficiales de recolección
    try {
      const saved = localStorage.getItem('raiz_delivery_preference');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.type === 'node' && isOfficialNode(parsed.id, parsed.name)) {
          activeDeliveryPreference = parsed;
        } else {
          // Si era domicilio (ej: 'Casa · ...') o dato inválido, FORZAR Sede Urdesa
          activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };
          localStorage.setItem('raiz_delivery_preference', JSON.stringify(activeDeliveryPreference));
        }
      } else {
        activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };
        localStorage.setItem('raiz_delivery_preference', JSON.stringify(activeDeliveryPreference));
      }
    } catch (_) {
      activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };
    }
  } else {
    // Usuario autenticado: cargar su preferencia previa si existe
    try {
      const saved = localStorage.getItem('raiz_delivery_preference');
      if (saved) {
        activeDeliveryPreference = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error leyendo raiz_delivery_preference:', e);
    }
  }

  // 3. Actualizar inmediatamente la píldora en el navbar (zero-flicker)
  updateHeaderLocationPillUI(activeDeliveryPreference.shortName || activeDeliveryPreference.name);

  // 4. Cargar datos desde Supabase (si aplica)
  await loadHeaderLocationData();

  // 5. Listener global para cerrar dropdown al hacer clic fuera
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('header-location-dropdown');
    const btn = document.getElementById('header-location-btn');
    if (!dropdown || dropdown.classList.contains('hidden')) return;

    if (btn && (btn === e.target || btn.contains(e.target))) return;
    if (dropdown.contains(e.target)) return;

    closeHeaderLocationDropdown();
  });
}

/**
 * Carga nodos activos y direcciones del usuario desde Supabase
 */
async function loadHeaderLocationData() {
  const isAuth = isUserAuthenticated();
  const user = isAuth ? ((typeof getCurrentUser === 'function') ? getCurrentUser() : null) : null;
  const userId = user?.id;

  // A. Nodos comunitarios activos con Supabase Client
  if (window.supabase) {
    try {
      const { data, error } = await window.supabase.from('pickup_nodes').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        headerPickupNodes = data.filter(n => n.is_active !== false);
      } else if (typeof window.supabase.fetchApi === 'function') {
        const nodes = await window.supabase.fetchApi('pickup_nodes?select=*');
        if (Array.isArray(nodes) && nodes.length > 0) {
          headerPickupNodes = nodes.filter(n => n.is_active !== false);
        }
      }
    } catch (err) {
      console.warn('Error cargando pickup_nodes para header:', err);
    }
  }

  if (!headerPickupNodes || headerPickupNodes.length === 0) {
    headerPickupNodes = [...OFFICIAL_PICKUP_NODES];
  }

  // B. Direcciones del usuario si está autenticado
  if (isAuth && userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&order=is_preferred.desc,created_at.desc`);
      if (Array.isArray(addrs)) {
        headerDeliveryAddresses = addrs;
      }
    } catch (err) {
      console.warn('Error cargando delivery_addresses para header:', err);
    }
  } else {
    // Si no está autenticado, JAMÁS cargar direcciones de entrega
    headerDeliveryAddresses = [];
  }

  // C. Si el usuario está autenticado y no había preferencia explícita en localStorage pero tiene perfil en Supabase
  if (isAuth && userId && !localStorage.getItem('raiz_delivery_preference') && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const profs = await window.supabase.fetchApi(`profiles?id=eq.${userId}&select=*`);
      if (profs && profs.length > 0) {
        const p = profs[0];
        if (p.active_delivery_mode === 'home' && headerDeliveryAddresses.length > 0) {
          const prefAddr = headerDeliveryAddresses.find(a => a.id === p.preferred_delivery_address_id) || headerDeliveryAddresses[0];
          activeDeliveryPreference = {
            type: 'home',
            id: prefAddr.id,
            name: `${prefAddr.label || 'Casa'} · ${prefAddr.street_address}`,
            detail: `${prefAddr.neighborhood || ''} · ${prefAddr.city || 'Guayaquil'}`
          };
          updateHeaderLocationPillUI(activeDeliveryPreference.name);
        } else if (p.preferred_pickup_node_id && headerPickupNodes.length > 0) {
          const prefNode = headerPickupNodes.find(n => n.id === p.preferred_pickup_node_id) || headerPickupNodes[0];
          activeDeliveryPreference = {
            type: 'node',
            id: prefNode.id,
            name: prefNode.name,
            detail: prefNode.address
          };
          updateHeaderLocationPillUI(activeDeliveryPreference.name);
        }
      }
    } catch (_) {}
  } else if (!isAuth) {
    // Si no está autenticado, asegurar que la preferencia activa no sea a domicilio
    if (!activeDeliveryPreference || activeDeliveryPreference.type !== 'node' || !isOfficialNode(activeDeliveryPreference.id, activeDeliveryPreference.name)) {
      activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };
      updateHeaderLocationPillUI(activeDeliveryPreference.name);
    }
  }

  // Renderizar contenido del dropdown
  renderHeaderLocationDropdown();
}

/**
 * Alterna visibilidad del dropdown del header
 */
function toggleHeaderLocationDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('header-location-dropdown');
  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    if (!headerPickupNodes || headerPickupNodes.length === 0) {
      loadHeaderLocationData();
    }
    renderHeaderLocationDropdown();
    dropdown.classList.remove('hidden');
  } else {
    dropdown.classList.add('hidden');
  }
}

/**
 * Cierra el dropdown del header
 */
function closeHeaderLocationDropdown() {
  const dropdown = document.getElementById('header-location-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/**
 * Renderiza las listas de nodos y domicilios en el dropdown según el estado de sesión
 */
function renderHeaderLocationDropdown() {
  const nodesContainer = document.getElementById('header-dropdown-nodes-list');
  const addrsContainer = document.getElementById('header-dropdown-addrs-list');
  const isAuth = isUserAuthenticated();

  // 1. Renderizar Nodos Comunitarios (Los 3 oficiales de Guayaquil)
  if (nodesContainer) {
    if (!headerPickupNodes || headerPickupNodes.length === 0) {
      nodesContainer.innerHTML = `
        <div class="p-3 text-center">
          <p class="text-[11px] text-stone-500 mb-2">Cargando nodos comunitarios de Guayaquil...</p>
          <button type="button" onclick="loadHeaderLocationData()" class="text-[11px] font-bold text-[#143628] hover:underline cursor-pointer">
            🔄 Reintentar conexión
          </button>
        </div>
      `;
      loadHeaderLocationData();
    } else {
      nodesContainer.innerHTML = headerPickupNodes.map(node => {
        const isSelected = activeDeliveryPreference.type === 'node' && (
          activeDeliveryPreference.id === node.id || 
          (!activeDeliveryPreference.id && node.name.includes('Urdesa'))
        );

        const nodeSched = node.schedule || node.pickup_schedule || 'Miércoles y Viernes: 3:00 PM – 7:30 PM';

        return `
          <button 
            type="button" 
            onclick="selectHeaderLocation('node', '${node.id}', '${escapeHtml(node.name).replace(/'/g, "\\'")}', '${escapeHtml(node.address).replace(/'/g, "\\'")}')"
            class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
              isSelected 
                ? 'bg-[#f0f6f2] border-[#143628] text-stone-900 font-bold shadow-2xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
            } cursor-pointer group"
          >
            <div class="min-w-0 flex-1 pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">🏛️</span>
                <span class="font-bold text-xs truncate ${isSelected ? 'text-[#143628]' : 'text-stone-800'}">${escapeHtml(node.name)}</span>
              </div>
              <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(node.address)} · ${escapeHtml(node.city || 'Guayaquil')}</p>
              <p class="text-[10px] text-emerald-700 font-medium ml-4">🕒 ${escapeHtml(nodeSched)}</p>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">Gratis</span>
              ${isSelected ? '<span class="text-[#143628] font-bold text-xs">✓</span>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }

  // 2. Renderizar Direcciones a Domicilio (Restringido según estado de sesión)
  if (addrsContainer) {
    const addrsSection = addrsContainer.closest('.border-t') || addrsContainer.parentElement;
    const adminLink = addrsSection ? addrsSection.querySelector('a[href="perfil.html"]') : null;

    if (!isAuth) {
      // Sin sesión activa: Ocultar enlace de administrar y jamás mostrar direcciones privadas
      if (adminLink) adminLink.style.display = 'none';

      addrsContainer.innerHTML = `
        <div class="p-3 bg-stone-50/80 border border-stone-200/80 rounded-2xl text-center">
          <p class="text-[11px] text-stone-600 font-medium">Inicia sesión para recibir pedidos a domicilio</p>
          <button 
            type="button" 
            onclick="closeHeaderLocationDropdown(); if (typeof openAuthModal === 'function') openAuthModal('login'); else if (typeof openLoginModal === 'function') openLoginModal('cliente');" 
            class="mt-1.5 inline-block text-[11px] font-bold text-[#143628] hover:underline cursor-pointer"
          >
            Iniciar sesión aquí →
          </button>
        </div>
      `;
    } else {
      if (adminLink) adminLink.style.display = 'inline';

      if (headerDeliveryAddresses.length === 0) {
        addrsContainer.innerHTML = `
          <div class="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center">
            <p class="text-[11px] text-stone-500">No tienes direcciones guardadas.</p>
            <a 
              href="perfil.html" 
              class="inline-block mt-1 text-[11px] font-bold text-[#143628] hover:underline"
            >
              + Agregar dirección en mi perfil
            </a>
          </div>
        `;
      } else {
        addrsContainer.innerHTML = headerDeliveryAddresses.map(addr => {
          const isSelected = activeDeliveryPreference.type === 'home' && activeDeliveryPreference.id === addr.id;
          const displayName = `${addr.label || 'Domicilio'} · ${addr.street_address}`;
          const feeDisplay = Number(addr.delivery_fee ?? 2.50).toFixed(2);

          return `
            <button 
              type="button" 
              onclick="selectHeaderLocation('home', '${addr.id}', '${escapeHtml(displayName).replace(/'/g, "\\'")}', '${escapeHtml(addr.neighborhood || addr.city).replace(/'/g, "\\'")}')"
              class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
                isSelected 
                  ? 'bg-[#f0f6f2] border-[#143628] text-stone-900 font-bold shadow-2xs' 
                  : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
              } cursor-pointer group"
            >
              <div class="min-w-0 flex-1 pr-2">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs">🏡</span>
                  <span class="font-bold text-xs truncate ${isSelected ? 'text-[#143628]' : 'text-stone-800'}">${escapeHtml(addr.label || 'Casa')}</span>
                </div>
                <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(addr.street_address)}</p>
                <p class="text-[10px] text-stone-400 ml-4">${escapeHtml(addr.neighborhood ? addr.neighborhood + ' · ' : '')}${escapeHtml(addr.city || 'Guayaquil')}</p>
              </div>
              <div class="shrink-0 flex items-center gap-1.5">
                <span class="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">$${feeDisplay}</span>
                ${isSelected ? '<span class="text-[#143628] font-bold text-xs">✓</span>' : ''}
              </div>
            </button>
          `;
        }).join('');
      }
    }
  }
}

/**
 * Selecciona una ubicación (nodo o domicilio), actualiza UI y persiste
 */
async function selectHeaderLocation(type, id, name, detail) {
  const isAuth = isUserAuthenticated();

  // Si no está autenticado y trata de seleccionar entrega a domicilio: bloquear y abrir modal login
  if (!isAuth && type === 'home') {
    closeHeaderLocationDropdown();
    if (typeof openAuthModal === 'function') {
      openAuthModal('login');
    } else if (typeof openLoginModal === 'function') {
      openLoginModal('cliente');
    }
    return;
  }

  // Si no está autenticado, garantizar que el nodo elegido sea oficial
  if (!isAuth) {
    type = 'node';
    if (!isOfficialNode(id, name)) {
      id = DEFAULT_OFFICIAL_NODE.id;
      name = DEFAULT_OFFICIAL_NODE.name;
      detail = DEFAULT_OFFICIAL_NODE.detail;
    }
  }

  activeDeliveryPreference = { type, id, name, detail };

  // 1. Guardar en localStorage
  try {
    localStorage.setItem('raiz_delivery_preference', JSON.stringify(activeDeliveryPreference));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }

  // 2. Actualizar texto de la píldora en Navbar
  updateHeaderLocationPillUI(name);

  // 3. Cerrar dropdown
  closeHeaderLocationDropdown();

  // 4. Mostrar feedback toast si la función existe
  if (typeof showToast === 'function') {
    showToast(`📍 Entregas configuradas en: ${name}`);
  }

  // 5. Persistir en Supabase si el usuario está autenticado
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const userId = user?.id;

  if (isAuth && userId && window.supabase) {
    try {
      const updateData = { active_delivery_mode: type };
      if (type === 'node') {
        updateData.preferred_pickup_node_id = id;
      } else if (type === 'home') {
        updateData.preferred_delivery_address_id = id;
      }
      if (typeof window.supabase.from === 'function') {
        await window.supabase.from('profiles').update(updateData).eq('id', userId);
      } else if (typeof window.supabase.fetchApi === 'function') {
        await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData)
        });
      }
    } catch (errSupabase) {
      console.warn('Error guardando preferencia en Supabase profiles:', errSupabase);
    }
  }

  // 6. Actualizar visualmente badges de entrega en las fichas de productos
  updateCatalogDeliveryCues(name);
}

/**
 * Restablece de inmediato la ubicación activa al nodo oficial predeterminado (Sede Urdesa)
 */
function resetHeaderLocationToDefault() {
  activeDeliveryPreference = { ...DEFAULT_OFFICIAL_NODE };
  headerDeliveryAddresses = [];
  purgeResidualPersonalAddresses();
  try {
    localStorage.setItem('raiz_delivery_preference', JSON.stringify(activeDeliveryPreference));
  } catch (_) {}
  updateHeaderLocationPillUI(DEFAULT_OFFICIAL_NODE.name);
  renderHeaderLocationDropdown();
}
window.resetHeaderLocationToDefault = resetHeaderLocationToDefault;

/**
 * Actualiza el texto de la píldora del header en todas las páginas
 */
function updateHeaderLocationPillUI(name) {
  if (!name) name = DEFAULT_OFFICIAL_NODE.name;

  const pillLabels = [
    document.getElementById('header-node-name'),
    document.getElementById('index-header-node-name'),
    document.getElementById('mis-pedidos-header-node-name'),
    document.getElementById('nav-user-node')
  ];

  let displayName = name;
  if (displayName.includes(' · ') && displayName.startsWith('Sede ')) {
    displayName = displayName.split(' · ')[0];
  } else if (displayName.length > 24) {
    displayName = displayName.substring(0, 22) + '...';
  }

  pillLabels.forEach(lbl => {
    if (lbl) {
      lbl.textContent = displayName;
      lbl.title = name;
    }
  });
}
window.updateHeaderLocationPillUI = updateHeaderLocationPillUI;

/**
 * Actualiza la información de entrega en el catálogo según la zona
 */
function updateCatalogDeliveryCues(locationName) {
  const deliveryCueElements = document.querySelectorAll('.product-delivery-cue');
  deliveryCueElements.forEach(el => {
    el.textContent = `Disponible para entrega en ${locationName}`;
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.toggleHeaderLocationDropdown = toggleHeaderLocationDropdown;
window.closeHeaderLocationDropdown = closeHeaderLocationDropdown;
window.selectHeaderLocation = selectHeaderLocation;
window.initHeaderLocationSelector = initHeaderLocationSelector;
window.loadHeaderLocationData = loadHeaderLocationData;
window.getActiveDeliveryPreference = () => activeDeliveryPreference;

// Auto-inicialización inmediata para que el selector de ubicación cargue en todas las vistas
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderLocationSelector();
  });
} else {
  initHeaderLocationSelector();
}
