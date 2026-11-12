/**
 * Raíz & Barrio - Portal del Productor
 * Lógica de navegación entre pestañas, edición y publicación de productos,
 * gestión de perfil y sincronización con Supabase.
 */

// Base CDN de assets en Supabase Storage
const SUPABASE_STORAGE_URL = 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images';

// Estado del catálogo local de la finca
let producerProducts = [
  {
    code: 'PR-003',
    id: 3,
    title: 'Zanahoria de tierra',
    category: 'Verduras & Raíces',
    unit: 'Kilogramo (kg)',
    price: 0.40,
    stock: 60,
    unitLabel: 'kg',
    status: 'publicado',
    statusText: 'Publicado',
    subtitle: 'Cosecha del día · entrega 7 nov.',
    image: `${SUPABASE_STORAGE_URL}/zanahorias.jpg`,
    description: 'Zanahorias frescas cultivadas en nuestra hacienda en Daule. Cosechadas a mano, con su tallo y toda la frescura de la tierra. Ideales para sopas, ensaladas y jugos.',
    origin: 'Hacienda San José · Daule',
    harvestDate: '06 / 11 / 2026',
    lastUpdate: 'Hoy · 10:42 a. m.'
  },
  {
    code: 'PR-012',
    id: 5,
    title: 'Canasta Agroecológica',
    category: 'Canastas Familiares',
    unit: 'Canasta',
    price: 0.70,
    stock: 8,
    unitLabel: 'canasta',
    status: 'borrador',
    statusText: 'Borrador',
    subtitle: '4-5 kg · selección semanal',
    image: `${SUPABASE_STORAGE_URL}/canasta_esencial.jpg`,
    description: 'Selección de 5 a 6 variedades agroecológicas cosechadas al punto perfecto. Hacienda San José.',
    origin: 'Hacienda San José · Daule',
    harvestDate: '06 / 11 / 2026',
    lastUpdate: 'Ayer · 4:15 p. m.'
  },
  {
    code: 'PR-018',
    id: 6,
    title: 'Acelga de la huerta',
    category: 'Verduras & Raíces',
    unit: 'Manojo',
    price: 0.35,
    stock: 0,
    unitLabel: 'manojo',
    status: 'agotado',
    statusText: 'Agotado',
    subtitle: 'Próxima cosecha · 13 nov.',
    image: `${SUPABASE_STORAGE_URL}/acelgas.jpg`,
    description: 'Acelgas de hoja ancha y penca blanca tierna. Cosechadas en la madrugada en Daule.',
    origin: 'Hacienda San José · Daule',
    harvestDate: '13 / 11 / 2026',
    lastUpdate: 'Hoy · 8:20 a. m.'
  }
];

// Producto actualmente en edición
let currentEditingCode = 'PR-003';

// Filtro activo en Mis Productos (todos, publicado, borrador, agotado)
let currentFilter = 'todos';

document.addEventListener('DOMContentLoaded', () => {
  initProducerSession();
  setupPreviewListeners();
  renderProducerProducts();
  updateKPIs();

  // Leer pestaña desde hash de URL si está presente
  const hash = window.location.hash.replace('#', '');
  if (['mis-productos', 'nuevo-producto', 'modificar-producto', 'perfil-seguridad'].includes(hash)) {
    switchProducerTab(hash);
  } else {
    switchProducerTab('mis-productos');
  }
});

/**
 * Inicializa la sesión del productor y actualiza la UI con sus datos
 */
function initProducerSession() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user || (user.role !== 'productor' && user.role !== 'admin')) {
    console.warn('Modo previsualización activa del portal de productor (sin sesión activa o modo desarrollo).');
  }

  // Nombre y finca en cabecera y sidebar
  const producerName = (user && user.name) ? user.name : 'Elena Moreno';
  const producerFarm = (user && user.finca) ? user.finca : 'Huerta El Renacer';

  const nameEls = document.querySelectorAll('.producer-name-display');
  nameEls.forEach(el => el.textContent = producerName);

  const farmEls = document.querySelectorAll('.producer-farm-display');
  farmEls.forEach(el => el.textContent = producerFarm);

  // Iniciales en el avatar
  const initials = producerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM';
  const avatarInitialsEl = document.getElementById('header-user-initials');
  if (avatarInitialsEl) avatarInitialsEl.textContent = initials;

  // Cargar nombre en formulario de perfil si existe
  const profileNameInput = document.getElementById('producer-profile-name');
  if (profileNameInput && user.name) profileNameInput.value = user.name;

  const profileFarmInput = document.getElementById('producer-profile-farm');
  if (profileFarmInput && user.finca) profileFarmInput.value = user.finca;
}

/**
 * Cambia de pestaña en el portal del productor
 */
function switchProducerTab(tabName) {
  // Ocultar todas las vistas
  const views = ['mis-productos', 'nuevo-producto', 'modificar-producto', 'perfil-seguridad'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  // Mostrar vista solicitada
  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) activeView.classList.remove('hidden');

  // Actualizar estado activo en la barra lateral
  const navBtns = document.querySelectorAll('.nav-producer-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Actualizar breadcrumbs
  const breadcrumbEl = document.getElementById('producer-breadcrumb');
  if (breadcrumbEl) {
    if (tabName === 'mis-productos') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mis productos</span>`;
    } else if (tabName === 'nuevo-producto') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="switchProducerTab('mis-productos')">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">Nuevo producto</span>`;
    } else if (tabName === 'modificar-producto') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="hover:underline cursor-pointer" onclick="switchProducerTab('mis-productos')">Mis productos</span> <span class="text-stone-300">/</span> <span class="text-stone-800 font-semibold">Modificar ${currentEditingCode}</span>`;
    } else if (tabName === 'perfil-seguridad') {
      breadcrumbEl.innerHTML = `<span>Mi espacio</span> <span class="text-stone-300">›</span> <span class="text-stone-800 font-semibold">Mi perfil y seguridad</span>`;
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Renderiza la lista de tarjetas de productos en "Mis productos"
 */
function renderProducerProducts() {
  const container = document.getElementById('producer-products-grid');
  if (!container) return;

  const filtered = producerProducts.filter(p => {
    if (currentFilter === 'todos') return true;
    return p.status === currentFilter;
  });

  container.innerHTML = filtered.map(prod => {
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let badgeDot = 'bg-emerald-500';
    if (prod.status === 'borrador') {
      badgeClass = 'bg-[#f7f3eb] text-[#92400e] border-[#eedfc9]';
      badgeDot = 'bg-amber-500';
    } else if (prod.status === 'agotado') {
      badgeClass = 'bg-[#faece6] text-[#c85a32] border-[#f3d9ce]';
      badgeDot = 'bg-[#c85a32]';
    }

    const isAgotado = prod.status === 'agotado';
    const isBorrador = prod.status === 'borrador';

    return `
      <div class="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <!-- Imagen y Badge Superior -->
          <div class="relative aspect-[16/10] overflow-hidden bg-stone-100">
            <img src="${prod.image}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute top-3 left-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full ${badgeDot}"></span>
                <span>${prod.statusText}</span>
              </span>
            </div>
          </div>

          <!-- Contenido de la Tarjeta -->
          <div class="p-4 sm:p-5">
            <div class="text-[11px] font-medium text-stone-400 mb-1">
              ${prod.code} · ${prod.origin.split('·')[0].trim()}
            </div>
            <h3 class="font-serif font-bold text-lg text-stone-900 leading-snug mb-1">
              ${prod.title}
            </h3>
            <p class="text-xs text-stone-500 mb-4">
              ${prod.subtitle}
            </p>

            <div class="flex items-baseline gap-1 mb-3">
              <span class="text-xl font-bold text-stone-900">$${formatCOP(prod.price)}</span>
              <span class="text-xs text-stone-400 font-medium">/ ${prod.unitLabel} · USD</span>
            </div>

            <div class="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
              <span class="text-stone-400 font-medium">Existencias</span>
              <span class="${isAgotado ? 'text-[#c85a32] font-bold' : 'text-stone-800 font-bold'}">
                ${isAgotado ? '0 manojos' : `${prod.stock} ${prod.unitLabel}${prod.stock > 1 && !prod.unitLabel.endsWith('s') ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción de la Tarjeta -->
        <div class="p-4 sm:p-5 pt-0 border-t border-stone-100/80 flex items-center justify-between gap-2 mt-2">
          <button onclick="editProductFromCard('${prod.code}')" class="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5">
            <span>📝</span>
            <span>Modificar</span>
          </button>

          ${isBorrador ? `
            <button onclick="publishProductDirectly('${prod.code}')" class="bg-[#1a3d2f] hover:bg-[#255440] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition">
              Publicar
            </button>
          ` : isAgotado ? `
            <button onclick="reponerStockDirectly('${prod.code}')" class="border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl transition">
              Reponer stock
            </button>
          ` : `
            <span class="text-[11px] text-stone-400">${prod.lastUpdate || 'Hoy · 10:42 a. m.'}</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Filtra los productos de la finca
 */
function setProductFilter(filterType) {
  currentFilter = filterType;
  
  // Actualizar botones de filtro
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active', 'border-b-2', 'border-[#1a3d2f]', 'text-[#1a3d2f]', 'font-bold');
      btn.classList.remove('text-stone-500');
    } else {
      btn.classList.remove('active', 'border-b-2', 'border-[#1a3d2f]', 'text-[#1a3d2f]', 'font-bold');
      btn.classList.add('text-stone-500');
    }
  });

  renderProducerProducts();
}

/**
 * Actualiza los indicadores numéricos KPI
 */
function updateKPIs() {
  const total = producerProducts.length;
  const publicados = producerProducts.filter(p => p.status === 'publicado').length;
  const borradores = producerProducts.filter(p => p.status === 'borrador').length;
  const agotados = producerProducts.filter(p => p.status === 'agotado').length;

  const totalEl = document.getElementById('kpi-total');
  const pubEl = document.getElementById('kpi-publicados');
  const borEl = document.getElementById('kpi-borradores');
  const agotEl = document.getElementById('kpi-agotados');

  if (totalEl) totalEl.textContent = total;
  if (pubEl) pubEl.textContent = publicados;
  if (borEl) borEl.textContent = borradores;
  if (agotEl) agotEl.textContent = agotados;

  const countPills = document.querySelectorAll('.kpi-count-total');
  countPills.forEach(el => el.textContent = total);
  const countPubPills = document.querySelectorAll('.kpi-count-pub');
  countPubPills.forEach(el => el.textContent = publicados);
  const countBorPills = document.querySelectorAll('.kpi-count-bor');
  countBorPills.forEach(el => el.textContent = borradores);
  const countAgotPills = document.querySelectorAll('.kpi-count-agot');
  countAgotPills.forEach(el => el.textContent = agotados);
}

/**
 * Carga un producto en la vista de modificación
 */
function editProductFromCard(code) {
  currentEditingCode = code;
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  // Actualizar títulos e info en la vista "modificar-producto"
  const tagEl = document.getElementById('edit-product-tag');
  if (tagEl) tagEl.textContent = `EDITAR PRODUCTO · ${prod.code}`;

  const titleEl = document.getElementById('edit-product-heading');
  if (titleEl) titleEl.textContent = `Modificar ${prod.title}`;

  const subEl = document.getElementById('edit-product-subtitle');
  if (subEl) subEl.textContent = `${prod.statusText} · ${prod.origin.split('·')[0].trim()} · Última actualización: ${prod.lastUpdate || 'hoy'}`;

  // Formulario
  const nameInput = document.getElementById('edit-form-name');
  if (nameInput) nameInput.value = prod.title;

  const descInput = document.getElementById('edit-form-desc');
  if (descInput) descInput.value = prod.description;

  const priceInput = document.getElementById('edit-form-price');
  if (priceInput) priceInput.value = `$ ${formatCOP(prod.price)}`;

  const stockInput = document.getElementById('edit-form-stock');
  if (stockInput) stockInput.value = `${prod.stock} ${prod.unitLabel}`;

  const originInput = document.getElementById('edit-form-origin');
  if (originInput) originInput.value = prod.origin;

  const statusPill = document.getElementById('edit-form-status-pill');
  if (statusPill) {
    statusPill.textContent = `• ${prod.statusText}`;
    if (prod.status === 'publicado') {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (prod.status === 'borrador') {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-[#f7f3eb] text-[#92400e] border border-[#eedfc9]';
    } else {
      statusPill.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-[#faece6] text-[#c85a32] border border-[#f3d9ce]';
    }
  }

  const statusSelect = document.getElementById('edit-form-status-select');
  if (statusSelect) {
    statusSelect.value = prod.status === 'publicado' ? 'Publicado' : (prod.status === 'borrador' ? 'Borrador' : 'Agotado');
  }

  // Previsualización lateral
  const prevImg = document.getElementById('edit-preview-img');
  if (prevImg) prevImg.src = prod.image;

  const prevTitle = document.getElementById('edit-preview-title');
  if (prevTitle) prevTitle.textContent = prod.title;

  const prevOrigin = document.getElementById('edit-preview-origin');
  if (prevOrigin) prevOrigin.textContent = prod.origin;

  const prevPrice = document.getElementById('edit-preview-price');
  if (prevPrice) prevPrice.textContent = `$${formatCOP(prod.price)} / ${prod.unitLabel}`;

  // Miniatura de portada
  const thumbImg = document.getElementById('edit-thumbnail-img');
  if (thumbImg) thumbImg.src = prod.image;

  switchProducerTab('modificar-producto');
}

/**
 * Guarda los cambios realizados en "Modificar producto" y sincroniza con Supabase
 */
async function saveProductModifications() {
  const prod = producerProducts.find(p => p.code === currentEditingCode);
  if (!prod) return;

  const nameInput = document.getElementById('edit-form-name');
  const priceInput = document.getElementById('edit-form-price');
  const stockInput = document.getElementById('edit-form-stock');
  const descInput = document.getElementById('edit-form-desc');
  const statusSelect = document.getElementById('edit-form-status-select');

  if (nameInput && nameInput.value.trim()) prod.title = nameInput.value.trim();
  if (descInput && descInput.value.trim()) prod.description = descInput.value.trim();
  
  if (priceInput) {
    const rawNum = priceInput.value.replace(/[^0-9]/g, '');
    if (rawNum) prod.price = Number(rawNum);
  }

  if (stockInput) {
    const rawNum = stockInput.value.replace(/[^0-9]/g, '');
    if (rawNum !== '') prod.stock = Number(rawNum);
  }

  if (statusSelect) {
    const val = statusSelect.value.toLowerCase();
    if (val.includes('public')) {
      prod.status = 'publicado';
      prod.statusText = 'Publicado';
    } else if (val.includes('borrador')) {
      prod.status = 'borrador';
      prod.statusText = 'Borrador';
    } else if (val.includes('agotad')) {
      prod.status = 'agotado';
      prod.statusText = 'Agotado';
    }
  }

  prod.lastUpdate = 'Hoy · recién guardado';

  // Sincronizar en base de datos Supabase
  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, {
        title: prod.title,
        description: prod.description,
        price: prod.price,
        stock_quantity: prod.stock,
        is_available: prod.status === 'publicado'
      });
      console.log(`Producto ${prod.code} sincronizado en Supabase con éxito.`);
    } catch (e) {
      console.warn('Error al actualizar producto en Supabase:', e);
    }
  }

  alert(`¡Los cambios de "${prod.title}" se han guardado y sincronizado con éxito!`);
  renderProducerProducts();
  updateKPIs();
  switchProducerTab('mis-productos');
}

/**
 * Publicar directamente desde la tarjeta (ej. Canasta Agroecológica en borrador)
 */
async function publishProductDirectly(code) {
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  prod.status = 'publicado';
  prod.statusText = 'Publicado';
  prod.lastUpdate = 'Hoy · recién publicado';

  // Ocultar banner de canasta en borrador si era esa
  const alertBanner = document.getElementById('producer-draft-alert');
  if (alertBanner && code === 'PR-012') {
    alertBanner.classList.add('hidden');
  }

  // Sincronizar en Supabase
  if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
    try {
      await window.supabase.updateProduct(prod.id, { is_available: true });
    } catch (e) {
      console.warn('Error publicando en Supabase:', e);
    }
  }

  alert(`¡"${prod.title}" ahora está publicado y visible para los compradores en el mercado!`);
  renderProducerProducts();
  updateKPIs();
}

/**
 * Reponer stock directamente desde la tarjeta (ej. Acelga de la huerta agotada)
 */
async function reponerStockDirectly(code) {
  const prod = producerProducts.find(p => p.code === code);
  if (!prod) return;

  const cantidad = prompt(`Ingresa la cantidad de ${prod.unitLabel}s disponibles para reponer en ${prod.title}:`, "25");
  if (cantidad !== null && Number(cantidad) > 0) {
    prod.stock = Number(cantidad);
    prod.status = 'publicado';
    prod.statusText = 'Publicado';
    prod.lastUpdate = 'Hoy · stock repuesto';

    if (window.supabase && typeof window.supabase.updateProduct === 'function' && prod.id) {
      try {
        await window.supabase.updateProduct(prod.id, {
          stock_quantity: prod.stock,
          is_available: true
        });
      } catch (e) {
        console.warn('Error reponiendo stock en Supabase:', e);
      }
    }

    alert(`¡Stock de "${prod.title}" repuesto a ${prod.stock} ${prod.unitLabel}s! El producto vuelve a estar disponible.`);
    renderProducerProducts();
    updateKPIs();
  }
}

/**
 * Publicar un nuevo producto desde la vista "Nuevo producto"
 */
async function publishNewProduct() {
  const nameInput = document.getElementById('new-form-name');
  const descInput = document.getElementById('new-form-desc');
  const priceInput = document.getElementById('new-form-price');
  const stockInput = document.getElementById('new-form-stock');
  const unitSelect = document.getElementById('new-form-unit');
  const originInput = document.getElementById('new-form-origin');

  const title = nameInput ? nameInput.value.trim() : 'Rábanos de temporada';
  const desc = descInput ? descInput.value.trim() : 'Rábanos frescos y crujientes de nuestra huerta.';
  const cleanPrice = priceInput ? priceInput.value.replace(/[^0-9.]/g, '') : '0.28';
  const price = parseFloat(cleanPrice) || 0.28;
  const rawStock = stockInput ? stockInput.value.replace(/[^0-9]/g, '') : '30';
  const stock = Number(rawStock) || 30;
  const unit = unitSelect ? unitSelect.value.split('·')[0].trim() : 'Manojo';
  const origin = originInput ? originInput.value.trim() : 'Hacienda San José · Daule';

  const newCode = `PR-0${Math.floor(20 + Math.random() * 80)}`;

  const newProd = {
    code: newCode,
    id: 13,
    title: title,
    category: 'Verduras & Raíces',
    unit: unit,
    unitLabel: 'manojo',
    price: price,
    stock: stock,
    status: 'publicado',
    statusText: 'Publicado',
    subtitle: 'Cosecha fresca · entrega próxima',
    image: `${SUPABASE_STORAGE_URL}/rabanos.jpg`,
    description: desc,
    origin: origin,
    harvestDate: '06 / 11 / 2026',
    lastUpdate: 'Hoy · recién creado'
  };

  producerProducts.unshift(newProd);

  // Sincronizar en Supabase
  if (window.supabase && typeof window.supabase.createProduct === 'function') {
    try {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      await window.supabase.createProduct({
        producer_id: (user && user.id) ? user.id : '00000000-0000-0000-0000-000000000004',
        category_id: 2,
        title: title,
        description: desc,
        price: price,
        unit: unit,
        stock_quantity: stock,
        is_available: true,
        image_url: `${SUPABASE_STORAGE_URL}/rabanos.jpg`
      });
      console.log('Nuevo producto creado en Supabase con éxito.');
    } catch (e) {
      console.warn('Error al crear producto en Supabase:', e);
    }
  }

  alert(`¡Cosecha "${title}" publicada con éxito en la tienda y en la base de datos de Supabase!`);
  renderProducerProducts();
  updateKPIs();
  switchProducerTab('mis-productos');
}

/**
 * Guardar producto como borrador
 */
function saveProductDraft() {
  const nameInput = document.getElementById('new-form-name');
  const title = nameInput ? nameInput.value.trim() : 'Nuevo producto';
  alert(`"${title}" se ha guardado en Borradores. Podrás terminar de completarlo y publicarlo cuando lo desees.`);
  switchProducerTab('mis-productos');
}

/**
 * Guarda los datos personales del perfil del productor y sincroniza con Supabase
 */
async function saveProducerPersonalData() {
  const nameInput = document.getElementById('producer-profile-name');
  const farmInput = document.getElementById('producer-profile-farm');

  const newName = nameInput ? nameInput.value.trim() : 'Elena Moreno';
  const newFarm = farmInput ? farmInput.value.trim() : 'Huerta El Renacer';

  // Actualizar UI
  const nameDisplays = document.querySelectorAll('.producer-name-display');
  nameDisplays.forEach(el => el.textContent = newName);

  const farmDisplays = document.querySelectorAll('.producer-farm-display');
  farmDisplays.forEach(el => el.textContent = newFarm);

  // Actualizar sesión local
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (user) {
    user.name = newName;
    user.finca = newFarm;
    if (typeof setCurrentUser === 'function') setCurrentUser(user);
  }

  // Actualizar en base de datos Supabase
  if (window.supabase && typeof window.supabase.updateProfile === 'function') {
    try {
      const producerId = (user && user.id) ? user.id : '00000000-0000-0000-0000-000000000004';
      await window.supabase.updateProfile(producerId, {
        full_name: newName,
        farm_name: newFarm
      });
      console.log('Perfil de productor sincronizado en Supabase.');
    } catch (e) {
      console.warn('Error al actualizar perfil en Supabase:', e);
    }
  }

  alert('¡Datos personales actualizados y guardados en Supabase correctamente!');
}

/**
 * Escucha cambios en tiempo real en los inputs para actualizar las tarjetas de previsualización
 */
function setupPreviewListeners() {
  // Previsualización en Nuevo Producto
  const newName = document.getElementById('new-form-name');
  const newPrice = document.getElementById('new-form-price');
  const newUnit = document.getElementById('new-form-unit');

  if (newName) {
    newName.addEventListener('input', (e) => {
      const prev = document.getElementById('new-preview-title');
      if (prev) prev.textContent = e.target.value.trim() || 'Rábanos de temporada';
    });
  }

  if (newPrice) {
    newPrice.addEventListener('input', (e) => {
      const prev = document.getElementById('new-preview-price');
      const val = e.target.value.replace(/[^0-9.]/g, '');
      const unit = newUnit ? newUnit.value.split('·')[0].trim().toLowerCase() : 'manojo';
      if (prev) prev.textContent = `$${val ? formatCOP(Number(val)) : '0,28'} / ${unit}`;
    });
  }

  // Previsualización en Modificar Producto
  const editName = document.getElementById('edit-form-name');
  const editPrice = document.getElementById('edit-form-price');
  const editUnit = document.getElementById('edit-form-unit');

  if (editName) {
    editName.addEventListener('input', (e) => {
      const prev = document.getElementById('edit-preview-title');
      if (prev) prev.textContent = e.target.value.trim() || 'Zanahoria de tierra';
    });
  }

  if (editPrice) {
    editPrice.addEventListener('input', (e) => {
      const prev = document.getElementById('edit-preview-price');
      const val = e.target.value.replace(/[^0-9.]/g, '');
      const unit = editUnit ? editUnit.value.replace(/[^a-zA-Z]/g, '').toLowerCase() : 'kg';
      if (prev) prev.textContent = `$${val ? formatCOP(Number(val)) : '0,40'} / ${unit}`;
    });
  }
}

/**
 * Formatea números a pesos colombianos COP con exactamente dos decimales
 */
function formatCOP(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intPart},${parts[1]}`;
}
