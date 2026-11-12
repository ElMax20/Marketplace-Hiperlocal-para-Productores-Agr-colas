/**
 * Raíz & Barrio - Módulo de Selector de Ubicación en Cabecera (Header Location Selector)
 * Permite alternar interactivamente entre Nodos Comunitarios y Direcciones a Domicilio,
 * actualiza la píldora visual en el navbar, sincroniza con Supabase y adapta el catálogo.
 */

let headerPickupNodes = [];
let headerDeliveryAddresses = [];
let activeDeliveryPreference = {
  type: 'node', // 'node' | 'home'
  id: null,
  name: 'Sede Urdesa · Espacio Verde',
  detail: 'Av. Víctor Emilio Estrada y Bálsamos · Guayaquil'
};

/**
 * Inicializa el selector de ubicación del header (nodos y domicilios)
 */
async function initHeaderLocationSelector() {
  // 1. Cargar preferencia guardada en localStorage
  try {
    const saved = localStorage.getItem('raiz_delivery_preference');
    if (saved) {
      activeDeliveryPreference = JSON.parse(saved);
      updateHeaderLocationPillUI(activeDeliveryPreference.name);
    }
  } catch (e) {
    console.warn('Error leyendo raiz_delivery_preference:', e);
  }

  // 2. Cargar datos desde Supabase
  await loadHeaderLocationData();

  // 3. Listener global para cerrar dropdown al hacer clic fuera
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
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const userId = user?.id;

  // A. Nodos comunitarios activos
  if (window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const nodes = await window.supabase.fetchApi('pickup_nodes?is_active=eq.true&order=created_at.asc');
      if (Array.isArray(nodes) && nodes.length > 0) {
        headerPickupNodes = nodes;
      }
    } catch (err) {
      console.warn('Error cargando pickup_nodes para header:', err);
    }
  }

  if (headerPickupNodes.length === 0) {
    headerPickupNodes = [
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

  // B. Direcciones del usuario si está autenticado
  if (userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${userId}&order=is_preferred.desc,created_at.desc`);
      if (Array.isArray(addrs)) {
        headerDeliveryAddresses = addrs;
      }
    } catch (err) {
      console.warn('Error cargando delivery_addresses para header:', err);
    }
  }

  // Si no había preferencia explícita en localStorage pero el usuario tiene perfil con preferencias en Supabase
  if (!localStorage.getItem('raiz_delivery_preference') && userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
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
            detail: `${prefAddr.neighborhood || ''} · ${prefAddr.city || 'Bogotá'}`
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
 * Renderiza las listas de nodos y domicilios en el dropdown
 */
function renderHeaderLocationDropdown() {
  const nodesContainer = document.getElementById('header-dropdown-nodes-list');
  const addrsContainer = document.getElementById('header-dropdown-addrs-list');

  // 1. Renderizar Nodos Comunitarios
  if (nodesContainer) {
    if (headerPickupNodes.length === 0) {
      nodesContainer.innerHTML = '<p class="text-[11px] text-stone-400 p-2">No hay nodos disponibles.</p>';
    } else {
      nodesContainer.innerHTML = headerPickupNodes.map(node => {
        const isSelected = activeDeliveryPreference.type === 'node' && (
          activeDeliveryPreference.id === node.id || 
          (!activeDeliveryPreference.id && node.name.includes('Nodo Central'))
        );

        return `
          <button 
            type="button" 
            onclick="selectHeaderLocation('node', '${node.id}', '${escapeHtml(node.name).replace(/'/g, "\\'")}', '${escapeHtml(node.address).replace(/'/g, "\\'")}')"
            class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
              isSelected 
                ? 'bg-[#f0f6f2] border-[#1a3d2f] text-stone-900 font-bold shadow-2xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
            } cursor-pointer group"
          >
            <div class="min-w-0 flex-1 pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">🏛️</span>
                <span class="font-bold text-xs truncate ${isSelected ? 'text-[#1a3d2f]' : 'text-stone-800'}">${escapeHtml(node.name)}</span>
              </div>
              <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(node.address)} · ${escapeHtml(node.city || 'Bogotá')}</p>
              <p class="text-[10px] text-emerald-700 font-medium ml-4">${escapeHtml(node.pickup_schedule || 'Sábados')}</p>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">Gratis</span>
              ${isSelected ? '<span class="text-[#1a3d2f] font-bold text-xs">✓</span>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }

  // 2. Renderizar Direcciones a Domicilio
  if (addrsContainer) {
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (!user || !user.loggedIn) {
      addrsContainer.innerHTML = `
        <div class="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-center">
          <p class="text-[11px] text-stone-600 font-medium">Inicia sesión para seleccionar tus domicilios</p>
          <button 
            type="button" 
            onclick="closeHeaderLocationDropdown(); if (typeof openAuthModal === 'function') openAuthModal('login'); else if (typeof openLoginModal === 'function') openLoginModal('cliente');" 
            class="mt-1.5 text-[11px] font-bold text-[#1a3d2f] hover:underline cursor-pointer"
          >
            Iniciar sesión →
          </button>
        </div>
      `;
    } else if (headerDeliveryAddresses.length === 0) {
      addrsContainer.innerHTML = `
        <div class="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center">
          <p class="text-[11px] text-stone-500">No tienes direcciones guardadas.</p>
          <a 
            href="perfil.html" 
            class="inline-block mt-1 text-[11px] font-bold text-[#1a3d2f] hover:underline"
          >
            + Agregar dirección en mi perfil
          </a>
        </div>
      `;
    } else {
      addrsContainer.innerHTML = headerDeliveryAddresses.map(addr => {
        const isSelected = activeDeliveryPreference.type === 'home' && activeDeliveryPreference.id === addr.id;
        const displayName = `${addr.label || 'Domicilio'} · ${addr.street_address}`;

        return `
          <button 
            type="button" 
            onclick="selectHeaderLocation('home', '${addr.id}', '${escapeHtml(displayName).replace(/'/g, "\\'")}', '${escapeHtml(addr.neighborhood || addr.city).replace(/'/g, "\\'")}')"
            class="w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between border ${
              isSelected 
                ? 'bg-[#f0f6f2] border-[#1a3d2f] text-stone-900 font-bold shadow-2xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200/70 text-stone-700'
            } cursor-pointer group"
          >
            <div class="min-w-0 flex-1 pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs">🏡</span>
                <span class="font-bold text-xs truncate ${isSelected ? 'text-[#1a3d2f]' : 'text-stone-800'}">${escapeHtml(addr.label || 'Casa')}</span>
              </div>
              <p class="text-[10px] text-stone-500 truncate mt-0.5 ml-4">${escapeHtml(addr.street_address)}</p>
              <p class="text-[10px] text-stone-400 ml-4">${escapeHtml(addr.neighborhood ? addr.neighborhood + ' · ' : '')}${escapeHtml(addr.city || 'Bogotá')}</p>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">$8.000</span>
              ${isSelected ? '<span class="text-[#1a3d2f] font-bold text-xs">✓</span>' : ''}
            </div>
          </button>
        `;
      }).join('');
    }
  }
}

/**
 * Selecciona una ubicación (nodo o domicilio), actualiza UI y persiste
 */
async function selectHeaderLocation(type, id, name, detail) {
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

  if (userId && window.supabase && typeof window.supabase.fetchApi === 'function') {
    try {
      const updateData = { active_delivery_mode: type };
      if (type === 'node') {
        updateData.preferred_pickup_node_id = id;
      } else if (type === 'home') {
        updateData.preferred_delivery_address_id = id;
      }
      await window.supabase.fetchApi(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    } catch (errSupabase) {
      console.warn('Error guardando preferencia en Supabase profiles:', errSupabase);
    }
  }

  // 6. Actualizar visualmente badges de entrega en las fichas de productos
  updateCatalogDeliveryCues(name);
}

/**
 * Actualiza el texto de la píldora del header
 */
function updateHeaderLocationPillUI(name) {
  const pillLabels = [
    document.getElementById('header-node-name'),
    document.getElementById('index-header-node-name')
  ];
  pillLabels.forEach(lbl => {
    if (lbl) {
      const short = name.length > 24 ? name.substring(0, 22) + '...' : name;
      lbl.textContent = short;
      lbl.title = name;
    }
  });
}

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

