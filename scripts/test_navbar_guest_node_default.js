/**
 * Test de Verificación: Selector de Entrega en Navbar para Visitantes Invitados y Cierre de Sesión
 * Ejecutar con: node scripts/test_navbar_guest_node_default.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockEnvironment() {
  const store = {};
  const sessionStore = {};

  const localStorageMock = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; },
    _store: store
  };

  const sessionStorageMock = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(sessionStore, k) ? sessionStore[k] : null),
    setItem: (k, v) => { sessionStore[k] = String(v); },
    removeItem: (k) => { delete sessionStore[k]; },
    clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); },
    key: (i) => Object.keys(sessionStore)[i] || null,
    get length() { return Object.keys(sessionStore).length; },
    _store: sessionStore
  };

  // DOM Mock
  const elements = {};
  function createElement(id, tagName = 'div') {
    elements[id] = {
      id,
      tagName,
      textContent: '',
      innerHTML: '',
      title: '',
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      style: {},
      querySelector(sel) {
        if (sel === 'a[href="perfil.html"]') {
          return elements['admin-link'] || null;
        }
        return null;
      },
      querySelectorAll() { return []; },
      closest() {
        return elements['addrs-section'] || null;
      },
      parentElement: null
    };
    return elements[id];
  }

  // Pre-crear elementos estándar del navbar
  createElement('header-node-name', 'span');
  createElement('index-header-node-name', 'span');
  createElement('mis-pedidos-header-node-name', 'span');
  createElement('nav-user-node', 'span');
  createElement('header-dropdown-nodes-list', 'div');
  createElement('header-dropdown-addrs-list', 'div');
  createElement('header-location-dropdown', 'div');
  createElement('header-location-btn', 'button');
  elements['header-location-dropdown'].classList.add('hidden');

  createElement('admin-link', 'a');
  createElement('addrs-section', 'div');
  elements['addrs-section'].parentElement = null;
  elements['header-dropdown-addrs-list'].parentElement = elements['addrs-section'];

  const documentMock = {
    readyState: 'complete',
    getElementById: (id) => elements[id] || null,
    addEventListener: () => {},
    querySelectorAll: () => []
  };

  const windowMock = {
    location: { href: '' },
    document: documentMock,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    addEventListener: () => {},
    supabase: {
      auth: { signOut: async () => ({ error: null }) },
      from: () => ({ select: async () => ({ data: null, error: new Error('mock') }) }),
      fetchApi: async () => []
    }
  };

  const context = vm.createContext({
    window: windowMock,
    document: documentMock,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  });

  return { context, elements, localStorageMock, sessionStorageMock };
}

function runScriptsInContext(context) {
  const authCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  const headerCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'header-location.js'), 'utf8');

  vm.runInContext(authCode, context);
  vm.runInContext(headerCode, context);
}

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

async function testGuestNoStorage() {
  console.log('\n--- Test 1: Visitante Invitado Sin Sesión Ni Datos Previos ---');
  const { context, elements } = createMockEnvironment();
  runScriptsInContext(context);

  await vm.runInContext('initHeaderLocationSelector()', context);

  const pillIndex = elements['index-header-node-name'].textContent;
  const pillHeader = elements['header-node-name'].textContent;
  const pillPedidos = elements['mis-pedidos-header-node-name'].textContent;
  const pref = vm.runInContext('window.getActiveDeliveryPreference()', context);

  assert(pref.type === 'node', 'Preferencia activa es de tipo "node"');
  assert(pref.name.includes('Urdesa'), 'Preferencia activa es Sede Urdesa');
  assert(pillIndex === 'Sede Urdesa', `Píldora index muestra "Sede Urdesa" (obtenido: "${pillIndex}")`);
  assert(pillHeader === 'Sede Urdesa', `Píldora mercado muestra "Sede Urdesa" (obtenido: "${pillHeader}")`);
  assert(pillPedidos === 'Sede Urdesa', `Píldora mis-pedidos muestra "Sede Urdesa" (obtenido: "${pillPedidos}")`);

  const nodesHtml = elements['header-dropdown-nodes-list'].innerHTML;
  assert(nodesHtml.includes('Sede Urdesa'), 'Lista de nodos incluye Sede Urdesa');
  assert(nodesHtml.includes('Sede Puerto Santa Ana'), 'Lista de nodos incluye Sede Puerto Santa Ana');
  assert(nodesHtml.includes('Sede Ceibos'), 'Lista de nodos incluye Sede Ceibos');

  const addrsHtml = elements['header-dropdown-addrs-list'].innerHTML;
  assert(addrsHtml.includes('Inicia sesión para recibir pedidos a domicilio'), 'Dropdown invita a iniciar sesión para domicilios');
  assert(!addrsHtml.includes('Casa'), 'No hay direcciones personales mostradas');
}

async function testGuestWithResidualHomeAddress() {
  console.log('\n--- Test 2: Visitante Invitado con Dirección Personal Residual en localStorage ---');
  const { context, elements, localStorageMock, sessionStorageMock } = createMockEnvironment();

  // Simular residuales de una sesión previa que no se limpió bien
  localStorageMock.setItem('selected_address', 'El Cóndor Mz M Villa 12');
  localStorageMock.setItem('delivery_address', 'El Cóndor Mz M Villa 12');
  localStorageMock.setItem('active_node', 'Sede Personal');
  localStorageMock.setItem('rb_delivery_addresses_usr-999', JSON.stringify([{ id: 'a1', label: 'Casa', street_address: 'El Cóndor Mz M' }]));
  localStorageMock.setItem('raiz_delivery_preference', JSON.stringify({
    type: 'home',
    id: 'a1',
    name: 'Casa · El Cóndor Mz M',
    detail: 'Guayaquil'
  }));
  sessionStorageMock.setItem('selected_address', 'El Cóndor');

  runScriptsInContext(context);
  await vm.runInContext('initHeaderLocationSelector()', context);

  assert(localStorageMock.getItem('selected_address') === null, 'Clave residual "selected_address" fue eliminada de localStorage');
  assert(localStorageMock.getItem('delivery_address') === null, 'Clave residual "delivery_address" fue eliminada de localStorage');
  assert(localStorageMock.getItem('rb_delivery_addresses_usr-999') === null, 'Clave residual "rb_delivery_addresses_*" fue eliminada');
  assert(sessionStorageMock.getItem('selected_address') === null, 'Clave residual eliminada de sessionStorage');

  const pref = vm.runInContext('window.getActiveDeliveryPreference()', context);
  assert(pref.type === 'node', 'Preferencia reseteada a tipo "node"');
  assert(pref.name.includes('Urdesa'), 'Preferencia reseteada a Sede Urdesa');

  const pillIndex = elements['index-header-node-name'].textContent;
  assert(pillIndex === 'Sede Urdesa', `Píldora restablecida a "Sede Urdesa" y no muestra dirección personal (obtenido: "${pillIndex}")`);

  const addrsHtml = elements['header-dropdown-addrs-list'].innerHTML;
  assert(!addrsHtml.includes('El Cóndor'), 'Dropdown NO filtra la dirección personal residual "El Cóndor"');
}

async function testGuestCanSwitchOfficialNodes() {
  console.log('\n--- Test 3: Invitado Puede Alternar Entre los 3 Nodos Oficiales Pero No Domicilios ---');
  const { context, elements } = createMockEnvironment();
  runScriptsInContext(context);
  await vm.runInContext('initHeaderLocationSelector()', context);

  // Cambiar a Sede Puerto Santa Ana
  await vm.runInContext("selectHeaderLocation('node', '65925730-63b5-486f-9dd0-aaac13a0ffe9', 'Sede Puerto Santa Ana · Café del Río', 'Edificio The Point')", context);

  let pref = vm.runInContext('window.getActiveDeliveryPreference()', context);
  assert(pref.type === 'node', 'Sigue siendo tipo nodo');
  assert(pref.name.includes('Puerto Santa Ana'), 'Preferencia cambiada a Sede Puerto Santa Ana');
  assert(elements['index-header-node-name'].textContent === 'Sede Puerto Santa Ana', 'Píldora muestra "Sede Puerto Santa Ana"');

  // Intentar seleccionar un domicilio sin estar autenticado
  await vm.runInContext("selectHeaderLocation('home', 'fake-home-id', 'Casa · Calle Falsa 123', 'Guayaquil')", context);

  pref = vm.runInContext('window.getActiveDeliveryPreference()', context);
  assert(pref.type === 'node', 'Intento de seleccionar domicilio sin sesión bloqueado');
  assert(pref.name.includes('Puerto Santa Ana'), 'Mantiene el nodo oficial');
}

async function testLogoutCleansAllAndResetsNode() {
  console.log('\n--- Test 4: Cierre de Sesión (clearAllAuthTokens / logoutUser) Limpia Todo y Resetea ---');
  const { context, elements, localStorageMock, sessionStorageMock } = createMockEnvironment();

  // Simular usuario autenticado con sesión activa y domicilio seleccionado
  localStorageMock.setItem('rb_current_user', JSON.stringify({ id: 'u-123', name: 'Carlos', loggedIn: true }));
  localStorageMock.setItem('rb_cached_profile', JSON.stringify({ id: 'u-123', full_name: 'Carlos', role: 'cliente' }));
  localStorageMock.setItem('sb-hvjqgvplbmshpucnuzfy-auth-token', JSON.stringify({ access_token: 'valid-token' }));
  localStorageMock.setItem('selected_address', 'Av. Las Lomas 456');
  localStorageMock.setItem('delivery_address', 'Av. Las Lomas 456');
  localStorageMock.setItem('rb_delivery_addresses_u-123', JSON.stringify([{ id: 'h1', label: 'Casa' }]));
  localStorageMock.setItem('raiz_delivery_preference', JSON.stringify({
    type: 'home',
    id: 'h1',
    name: 'Casa · Av. Las Lomas 456',
    detail: 'Urdesa'
  }));
  sessionStorageMock.setItem('selected_address', 'Av. Las Lomas 456');

  runScriptsInContext(context);

  // Verificar que mientras está autenticado se cargó su preferencia
  await vm.runInContext('initHeaderLocationSelector()', context);
  let pref = vm.runInContext('window.getActiveDeliveryPreference()', context);
  assert(pref.type === 'home', 'Usuario autenticado cargó preferencia home');

  // Ejecutar clearAllAuthTokens (como ocurre en logoutUser)
  vm.runInContext('clearAllAuthTokens()', context);

  assert(localStorageMock.getItem('rb_current_user') === null, 'rb_current_user eliminado');
  assert(localStorageMock.getItem('rb_cached_profile') === null, 'rb_cached_profile eliminado');
  assert(localStorageMock.getItem('sb-hvjqgvplbmshpucnuzfy-auth-token') === null, 'Token Supabase eliminado');
  assert(localStorageMock.getItem('selected_address') === null, 'selected_address eliminado');
  assert(localStorageMock.getItem('delivery_address') === null, 'delivery_address eliminado');
  assert(localStorageMock.getItem('rb_delivery_addresses_u-123') === null, 'rb_delivery_addresses_* eliminado');
  assert(sessionStorageMock.getItem('selected_address') === null, 'sessionStorage limpiado');

  const prefAfterLogout = vm.runInContext('window.getActiveDeliveryPreference()', context);
  assert(prefAfterLogout.type === 'node', 'Preferencia restablecida a "node" tras logout');
  assert(prefAfterLogout.name.includes('Urdesa'), 'Preferencia restablecida a Sede Urdesa tras logout');

  const pill = elements['index-header-node-name'].textContent;
  assert(pill === 'Sede Urdesa', `Píldora del navbar reseteada de inmediato a "Sede Urdesa" (obtenido: "${pill}")`);
}

async function runAllTests() {
  console.log('Iniciando tests para Selector de Ubicación en Navbar...');
  await testGuestNoStorage();
  await testGuestWithResidualHomeAddress();
  await testGuestCanSwitchOfficialNodes();
  await testLogoutCleansAllAndResetsNode();

  console.log(`\n========================================`);
  console.log(`Resultados: ${passed} pasados, ${failed} fallidos`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Error ejecutando tests:', err);
  process.exit(1);
});
