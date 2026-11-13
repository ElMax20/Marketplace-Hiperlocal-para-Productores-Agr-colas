// scripts/test_mis_pedidos_ui.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: Mis pedidos UI & Logic ---');

// 1. Verificar existencia y estructura de mis-pedidos.html
const htmlPath = path.join(__dirname, '..', 'mis-pedidos.html');
assert(fs.existsSync(htmlPath), 'mis-pedidos.html debe existir');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Verificaciones de marcado clave
assert(htmlContent.includes('raíz & barrio'), 'Debe incluir el logo de raíz & barrio');
assert(htmlContent.includes('Volver al mercado'), 'Debe incluir botón/enlace Volver al mercado');
assert(htmlContent.includes('Entregar en:'), 'Debe incluir selector de entrega');
assert(htmlContent.includes('MIS PEDIDOS'), 'Debe incluir el kicker MIS PEDIDOS');
assert(htmlContent.includes('Mis pedidos'), 'Debe incluir título principal Mis pedidos');
assert(htmlContent.includes('Tu información está protegida'), 'Debe incluir badge de seguridad');
assert(htmlContent.includes('Tu historial de compras'), 'Debe incluir cabecera de bloque Tu historial de compras');
assert(htmlContent.includes('#F5EFE6'), 'Cabecera de tabla debe tener fondo cálido #F5EFE6');
assert(htmlContent.includes('Fecha de compra'), 'Debe tener columna Fecha de compra');
assert(htmlContent.includes('Producto'), 'Debe tener columna Producto');
assert(htmlContent.includes('Precio'), 'Debe tener columna Precio');
assert(htmlContent.includes('Método de pago'), 'Debe tener columna Método de pago');
assert(htmlContent.includes('Aún no tienes pedidos'), 'Debe incluir texto de estado vacío');
assert(htmlContent.includes('Explorar el mercado'), 'Debe incluir botón Explorar el mercado');
assert(htmlContent.includes('Tus pagos, siempre privados'), 'Debe incluir banner de privacidad');
assert(htmlContent.includes('© 2026 Raíz & Barrio · Guayaquil y su tierra cercana.'), 'Debe incluir copyright en footer');

console.log('✓ mis-pedidos.html cuenta con todos los elementos y estilos requeridos');

// 2. Verificar redirección de pedidos.html
const pedidosPath = path.join(__dirname, '..', 'pedidos.html');
const pedidosContent = fs.readFileSync(pedidosPath, 'utf8');
assert(pedidosContent.includes('mis-pedidos.html'), 'pedidos.html debe redirigir a mis-pedidos.html');
console.log('✓ pedidos.html redirige limpiamente a mis-pedidos.html');

// 3. Verificar enlaces en auth.js, checkout-success.html y perfil.html
const authPath = path.join(__dirname, '..', 'js', 'auth.js');
const authContent = fs.readFileSync(authPath, 'utf8');
assert(authContent.includes('mis-pedidos.html'), 'js/auth.js debe enlazar a mis-pedidos.html en el menú de usuario');

const checkoutSuccessPath = path.join(__dirname, '..', 'checkout-success.html');
const checkoutSuccessContent = fs.readFileSync(checkoutSuccessPath, 'utf8');
assert(checkoutSuccessContent.includes('mis-pedidos.html'), 'checkout-success.html debe enlazar a mis-pedidos.html');

const perfilPath = path.join(__dirname, '..', 'perfil.html');
const perfilContent = fs.readFileSync(perfilPath, 'utf8');
assert(perfilContent.includes('mis-pedidos.html'), 'perfil.html debe enlazar a mis-pedidos.html');
console.log('✓ Navegación conectada transversalmente a mis-pedidos.html');

// 4. Probar lógica de js/mis-pedidos.js en entorno simulado
const jsPath = path.join(__dirname, '..', 'js', 'mis-pedidos.js');
const jsCode = fs.readFileSync(jsPath, 'utf8');

// Simulación ligera del DOM
const elements = {};
function mockElement(id) {
  return {
    id,
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {},
    textContent: '',
    innerHTML: '',
    value: ''
  };
}

const mockIds = [
  'cart-badge', 'orders-count-badge', 'orders-empty-state', 'orders-table-rows',
  'orders-footer-count', 'orders-bottom-bar', 'orders-kicker', 'orders-title',
  'orders-subtitle', 'trust-badge-below', 'trust-badge-right', 'orders-block-title',
  'demo-badge-container'
];
mockIds.forEach(id => { elements[id] = mockElement(id); });

const mockDocument = {
  addEventListener: () => {},
  getElementById: (id) => elements[id] || null
};

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const mockWindow = {
  location: { search: '?demo=1', replace: () => {}, href: '' },
  supabase: null
};

const sandbox = {
  document: mockDocument,
  window: mockWindow,
  localStorage: mockLocalStorage,
  console: console,
  URLSearchParams,
  Number,
  String,
  Math,
  Date,
  JSON,
  Array,
  isNaN
};

const vm = require('vm');
const script = new vm.Script(jsCode);
const context = vm.createContext(sandbox);
script.runInContext(context);

async function runTests() {
  // Ejecutar initMisPedidos en modo DEMO
  await context.initMisPedidos();

  assert.strictEqual(elements['orders-count-badge'].textContent, '5 pedidos', 'Badge debe indicar 5 pedidos en demo');
  assert.strictEqual(elements['orders-title'].textContent, 'Mis pedidos · Demostración', 'Título debe coincidir con demostración');
  assert(!elements['orders-empty-state'].classList.contains('hidden') === false, 'Empty state debe estar oculto');
  assert(!elements['orders-table-rows'].classList.contains('hidden') === true, 'Table rows debe estar visible');
  assert(elements['orders-table-rows'].innerHTML.includes('Canasta Huerto Familiar'), 'Debe incluir Canasta Huerto Familiar');
  assert(elements['orders-table-rows'].innerHTML.includes('Tomate de huerta'), 'Debe incluir Tomate de huerta');
  assert(elements['orders-table-rows'].innerHTML.includes('Aguacate Hass'), 'Debe incluir Aguacate Hass');
  assert(elements['orders-table-rows'].innerHTML.includes('Fresas de temporada'), 'Debe incluir Fresas de temporada');
  assert(elements['orders-table-rows'].innerHTML.includes('Queso campesino'), 'Debe incluir Queso campesino');
  assert(elements['orders-table-rows'].innerHTML.includes('Tarjeta de crédito'), 'Debe incluir método de pago Tarjeta de crédito');
  assert(elements['orders-table-rows'].innerHTML.includes('Transferencia PSE'), 'Debe incluir método de pago Transferencia PSE');
  assert(elements['orders-table-rows'].innerHTML.includes('Nequi'), 'Debe incluir método de pago Nequi');
  assert(elements['orders-table-rows'].innerHTML.includes('Tarjeta de débito'), 'Debe incluir método de pago Tarjeta de débito');

  console.log('✓ Modo DEMO validado correctamente con los 5 pedidos de referencia');

  // Ahora probar renderizado de ESTADO VACÍO (0 pedidos)
  mockWindow.location.search = '';
  context.renderOrdersView([]);

  assert.strictEqual(elements['orders-count-badge'].textContent, '0 pedidos', 'Badge debe indicar 0 pedidos');
  assert.strictEqual(elements['orders-title'].textContent, 'Mis pedidos', 'Título debe ser Mis pedidos');
  assert(elements['orders-empty-state'].classList.contains('hidden') === false, 'Empty state debe estar visible');
  assert(elements['orders-table-rows'].classList.contains('hidden') === true, 'Table rows debe estar oculto');
  assert.strictEqual(elements['orders-footer-count'].textContent, 'No hay compras registradas', 'Footer count debe indicar sin compras');
  assert(elements['orders-bottom-bar'].classList.contains('hidden') === true, 'Bottom bar debe estar oculta en estado vacío');

  console.log('✓ Modo VACÍO validado correctamente');

  console.log('--- TODOS LOS TESTS DE MIS PEDIDOS PASARON EXITOSAMENTE ---');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
