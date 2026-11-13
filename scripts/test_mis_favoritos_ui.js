/**
 * Test Suite: Verificación Integral de "Mis favoritos" UI, Sincronización y Supabase
 * Ejecutar con: node scripts/test_mis_favoritos_ui.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

function testHtmlStructure() {
  console.log('\n--- 1. Verificación de Estructura HTML (mis-favoritos.html) ---');
  const htmlPath = path.join(__dirname, '..', 'mis-favoritos.html');
  assert(fs.existsSync(htmlPath), 'mis-favoritos.html existe en la raíz');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Metadatos y fuentes
  assert(html.includes('Playfair+Display'), 'Incluye fuente serif Playfair Display');
  assert(html.includes('Plus+Jakarta+Sans'), 'Incluye fuente sans Plus Jakarta Sans');

  // Breadcrumb y Kicker
  assert(html.includes('Mercado') && html.includes('Mis favoritos'), 'Migas de pan: Mercado › Mis favoritos');
  assert(html.includes('MIS FAVORITOS'), 'Etiqueta superior terracota MIS FAVORITOS');
  assert(html.includes('Favoritos guardados'), 'Título principal: Favoritos guardados');
  assert(html.includes('Tu información está protegida'), 'Badge de confianza: Tu información está protegida');

  // Encabezado de sección
  assert(html.includes('Tus productos guardados'), 'Encabezado: Tus productos guardados');
  assert(html.includes('id="fav-count-pill"'), 'Píldora dinámica de conteo fav-count-pill presente');

  // Contenedores de Estado 1 (Grid) y Estado 2 (Vacío)
  assert(html.includes('id="favorites-grid-container"'), 'Contenedor de grid con productos presente');
  assert(html.includes('id="favorites-empty-container"'), 'Contenedor de estado vacío presente');
  assert(html.includes('id="favorites-products-grid"'), 'Grid responsivo id="favorites-products-grid" presente');

  // Elementos de Estado Vacío (Mis favoritos · Vacío.png)
  assert(html.includes('Tu selección del mercado'), 'Texto de cabecera en estado vacío: Tu selección del mercado');
  assert(html.includes('0 productos guardados'), 'Texto de cabecera en estado vacío: 0 productos guardados');
  assert(html.includes('Aún no tienes favoritos guardados'), 'Título estado vacío: Aún no tienes favoritos guardados');
  assert(html.includes('Explorar el mercado'), 'Botón hacia el catálogo: Explorar el mercado');
  assert(html.includes('Guardar un producto no lo añade al carrito'), 'Nota aclaratoria en franja inferior');

  // Pie de listado y notas
  assert(html.includes('Precios en dólares estadounidenses (USD)'), 'Moneda adaptada a USD');
  assert(html.includes('Guardar un producto no reserva unidades'), 'Nota sobre reserva de unidades presente');
  assert(html.includes('© 2026 Raíz & Barrio · Guayaquil y su tierra cercana'), 'Pie de página adaptado a Guayaquil');
}

function testSchemaTable() {
  console.log('\n--- 2. Verificación de Esquema SQL (supabase_schema.sql) ---');
  const sqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.favorites'), 'Tabla public.favorites definida');
  assert(sql.includes('user_id uuid NOT NULL REFERENCES public.profiles(id)'), 'user_id como FK hacia profiles');
  assert(sql.includes('product_id text NOT NULL'), 'product_id definido');
  assert(sql.includes('unique_user_product_favorite UNIQUE (user_id, product_id)'), 'Restricción UNIQUE (user_id, product_id)');
  assert(sql.includes('ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY'), 'RLS habilitado en favorites');
  assert(sql.includes('Permitir select favorites para usuarios'), 'Política RLS para SELECT');
  assert(sql.includes('Permitir insert favorites para usuarios'), 'Política RLS para INSERT');
  assert(sql.includes('Permitir delete favorites para usuarios'), 'Política RLS para DELETE');
}

function createMockEnv(initialUser = null, initialFavorites = []) {
  const store = {};
  if (initialUser) {
    store['rb_current_user'] = JSON.stringify(initialUser);
    store['rb_cached_profile'] = JSON.stringify(initialUser);
  }
  if (initialFavorites && initialFavorites.length > 0) {
    store['raiz_favorites'] = JSON.stringify(initialFavorites);
  }

  const localStorageMock = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _store: store
  };

  const elements = {};
  function getOrCreateEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        textContent: '',
        innerHTML: '',
        style: {},
        focus() {},
        setAttribute(k, v) { this[k] = v; },
        removeAttribute(k) { delete this[k]; },
        classList: {
          _set: new Set(),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); }
        }
      };
    }
    return elements[id];
  }

  ['favorites-grid-container', 'favorites-empty-container', 'fav-count-pill', 
   'favorites-count-footer', 'favorites-products-grid', 'cart-badge', 'toast', 'toast-message',
   'auth-modal', 'login-auth-modal'].forEach(id => {
    const el = getOrCreateEl(id);
    if (id === 'auth-modal' || id === 'login-auth-modal') {
      el.classList.add('hidden');
    }
  });

  const documentMock = {
    readyState: 'complete',
    body: getOrCreateEl('body'),
    getElementById: (id) => getOrCreateEl(id),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    location: { href: '', replace(url) { this.href = url; } },
    document: documentMock,
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    addEventListener: () => {},
    dispatchEvent: () => {},
    PRODUCTS_DATA: null,
    supabase: {
      fetchApi: async (endpoint, options = {}) => {
        if (endpoint.startsWith('favorites')) {
          if (options.method === 'DELETE' || options.method === 'POST') {
            return { success: true };
          }
          return initialFavorites.map(pid => ({ product_id: pid }));
        }
        return [];
      }
    }
  };

  const context = vm.createContext({
    window: windowMock,
    document: documentMock,
    localStorage: localStorageMock,
    console: console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {}
  });

  // Cargar scripts
  const authCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  const productsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'products-data.js'), 'utf8');
  const favServiceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'favorites-service.js'), 'utf8');
  const misFavsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'mis-favoritos.js'), 'utf8');

  vm.runInContext(authCode, context);
  vm.runInContext(productsCode, context);
  vm.runInContext(favServiceCode, context);
  vm.runInContext(misFavsCode, context);

  return { context, windowMock, elements, store };
}

async function testUnauthenticatedRedirect() {
  console.log('\n--- 3. Verificación de Protección de Ruta (Sin Sesión) ---');
  const { context, windowMock } = createMockEnv(null);

  await vm.runInContext('initMisFavoritos()', context);

  assert(windowMock.location.href.includes('index.html?openLogin=true'), 'Usuario invitado es redirigido a index.html con modal de login');
}

async function testPopulatedFavoritesView() {
  console.log('\n--- 4. Verificación de Estado Poblado (Con Productos Guardados) ---');
  const mockUser = { id: 'usr-buyer-001', name: 'Camila Rojas', loggedIn: true };
  const favList = ['tomate-de-huerta', 'aguacate-hass', 'canasta-huerto-familiar'];
  const { context, elements } = createMockEnv(mockUser, favList);

  await vm.runInContext('initMisFavoritos()', context);

  const gridContainer = elements['favorites-grid-container'];
  const emptyContainer = elements['favorites-empty-container'];
  const pill = elements['fav-count-pill'];
  const grid = elements['favorites-products-grid'];

  assert(!gridContainer.classList.contains('hidden'), 'favorites-grid-container es visible');
  assert(emptyContainer.classList.contains('hidden'), 'favorites-empty-container está oculto');
  assert(pill.textContent === '3 favoritos', `Píldora muestra conteo correcto: "${pill.textContent}"`);
  assert(grid.innerHTML.includes('Tomate de huerta'), 'Grid renderiza tarjeta de Tomate de huerta');
  assert(grid.innerHTML.includes('Aguacate Hass'), 'Grid renderiza tarjeta de Aguacate Hass');
  assert(grid.innerHTML.includes('Canasta Huerto Familiar'), 'Grid renderiza tarjeta de Canasta Huerto Familiar');
  assert(grid.innerHTML.includes('+ Añadir al carrito'), 'Tarjetas contienen botón pill "+ Añadir al carrito"');
  assert(grid.innerHTML.includes('✕ Quitar de favoritos'), 'Tarjetas contienen botón secundario "✕ Quitar de favoritos"');
  assert(grid.innerHTML.includes('USD'), 'Precios formateados en USD');
}

async function testEmptyFavoritesView() {
  console.log('\n--- 5. Verificación de Estado Vacío (0 Productos Guardados) ---');
  const mockUser = { id: 'usr-buyer-002', name: 'David Vera', loggedIn: true };
  const { context, elements } = createMockEnv(mockUser, []);

  await vm.runInContext('initMisFavoritos()', context);

  const gridContainer = elements['favorites-grid-container'];
  const emptyContainer = elements['favorites-empty-container'];
  const pill = elements['fav-count-pill'];

  assert(gridContainer.classList.contains('hidden'), 'favorites-grid-container está oculto');
  assert(!emptyContainer.classList.contains('hidden'), 'favorites-empty-container es visible');
  assert(pill.textContent === '0 favoritos', `Píldora muestra "0 favoritos" (obtenido: "${pill.textContent}")`);
}

async function testAddToCartAction() {
  console.log('\n--- 6. Verificación de Acción "+ Añadir al carrito" ---');
  const mockUser = { id: 'usr-buyer-001', name: 'Camila Rojas', loggedIn: true };
  const favList = ['tomate-de-huerta'];
  const { context, elements, store } = createMockEnv(mockUser, favList);

  await vm.runInContext('initMisFavoritos()', context);
  await vm.runInContext("handleAddToCart('tomate-de-huerta')", context);

  const rawCart = store['raiz_cart'];
  assert(rawCart !== undefined && rawCart !== null, 'raiz_cart se actualiza en localStorage');
  const cart = JSON.parse(rawCart);
  assert(cart.length === 1, 'Carrito contiene 1 producto');
  assert(cart[0].title === 'Tomate de huerta', 'Producto correcto agregado al carrito');
  assert(elements['cart-badge'].textContent === '1', 'Contador del navbar cart-badge se actualiza a 1');
}

async function testRemoveFavoriteAction() {
  console.log('\n--- 7. Verificación de Acción "✕ Quitar de favoritos" ---');
  const mockUser = { id: 'usr-buyer-001', name: 'Camila Rojas', loggedIn: true };
  const favList = ['tomate-de-huerta'];
  const { context, elements, store } = createMockEnv(mockUser, favList);

  await vm.runInContext('initMisFavoritos()', context);
  await vm.runInContext("handleRemoveFavorite('tomate-de-huerta')", context);

  const updatedFavs = JSON.parse(store['raiz_favorites'] || '[]');
  assert(updatedFavs.length === 0, 'Producto eliminado de raiz_favorites');
  assert(elements['fav-count-pill'].textContent === '0 favoritos', 'Contador de píldora pasa a 0 favoritos');
  assert(!elements['favorites-empty-container'].classList.contains('hidden'), 'Al quedar en 0 transiciona automáticamente a Estado Vacío');
}

async function testGlobalHeartToggleAuthGuard() {
  console.log('\n--- 8. Verificación de Protección de Login en Botón Corazón ---');
  const { context, windowMock, elements } = createMockEnv(null);

  const res = await vm.runInContext("window.FavoritesService.toggleFavorite('tomate-de-huerta')", context);
  assert(res.success === false && res.reason === 'unauthenticated', 'Visitante anónimo no puede guardar favoritos sin login');
  const modalOpened = !elements['auth-modal'].classList.contains('hidden') || !elements['login-auth-modal'].classList.contains('hidden');
  assert(modalOpened || windowMock.location.href.includes('openLogin=true') || windowMock.location.href.includes('index.html'), 'Redirige o activa modal de login');
}

async function runAll() {
  console.log('=== INICIANDO SUITE DE PRUEBAS: MIS FAVORITOS ===');
  testHtmlStructure();
  testSchemaTable();
  await testUnauthenticatedRedirect();
  await testPopulatedFavoritesView();
  await testEmptyFavoritesView();
  await testAddToCartAction();
  await testRemoveFavoriteAction();
  await testGlobalHeartToggleAuthGuard();

  console.log('\n========================================');
  console.log(`Resultados: ${passed} pasados, ${failed} fallidos`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch(e => {
  console.error('Error en suite:', e);
  process.exit(1);
});
