// scripts/test_checkout_delivery_sync.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== TEST SUITE: Checkout Step 1 Delivery & mis-pedidos.html Sync ===');

// 1. Verificación Estática en checkout.html
const checkoutHtmlPath = path.join(__dirname, '..', 'checkout.html');
const checkoutHtml = fs.readFileSync(checkoutHtmlPath, 'utf8');

assert(!checkoutHtml.includes('$8.000'), 'checkout.html no debe contener $8.000');
assert(!checkoutHtml.includes('Carrera 7'), 'checkout.html no debe contener Carrera 7');
assert(!checkoutHtml.includes('Bogotá'), 'checkout.html no debe contener Bogotá');
assert(checkoutHtml.includes('$2.50'), 'checkout.html debe contener la tarifa de $2.50');
assert(checkoutHtml.includes('checkout-delivery-alert'), 'checkout.html debe tener el contenedor de alerta de entrega');
assert(checkoutHtml.includes('checkout-no-address-view'), 'checkout.html debe tener el contenedor para usuario sin direcciones');
assert(checkoutHtml.includes('Aún no tienes una dirección registrada. Agrega tu dirección en Guayaquil para recibir tus cosechas en casa.'), 'Debe contener el texto de estado sin dirección');
console.log('✔ checkout.html pasa todas las verificaciones estáticas de marcado y tarifas ($2.50 y Guayaquil)');

// 2. Verificación Estática en mis-pedidos.html
const misPedidosHtmlPath = path.join(__dirname, '..', 'mis-pedidos.html');
const misPedidosHtml = fs.readFileSync(misPedidosHtmlPath, 'utf8');

assert(misPedidosHtml.includes('Gratis en recogida en nodo o $2.50 a domicilio en Guayaquil'), 'mis-pedidos.html debe reflejar la nota actualizada de envío');
console.log('✔ mis-pedidos.html tiene la nota explicativa actualizada con tarifa de nodo y domicilio');

// 3. Simulación de Comportamiento en js/checkout.js
const checkoutJsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'checkout.js'), 'utf8');

function createMockEnvironment() {
  const elements = {};
  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        classList: {
          classes: new Set(['hidden']),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); },
          toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
        },
        style: {},
        textContent: '',
        innerHTML: '',
        value: '',
        checked: false,
        disabled: false,
        scrollIntoView: () => {}
      };
    }
    return elements[id];
  }

  // Pre-crear elementos requeridos
  [
    'card-delivery-node', 'card-delivery-home', 'radio-delivery-node', 'radio-delivery-home',
    'checkout-delivery-alert', 'checkout-delivery-alert-text',
    'checkout-no-address-view', 'checkout-selected-address-view', 'checkout-home-schedule-box',
    'checkout-home-label', 'checkout-home-neighborhood', 'checkout-home-instructions',
    'checkout-home-schedule', 'checkout-home-estimate', 'checkout-home-fee-badge',
    'checkout-node-name', 'checkout-node-address', 'checkout-node-schedule', 'checkout-node-estimate',
    'checkout-nodes-dropdown', 'checkout-nodes-options', 'btn-toggle-node-label',
    'checkout-addresses-dropdown', 'btn-toggle-addresses', 'btn-toggle-addresses-label',
    'modal-new-address', 'modal-addr-label', 'modal-addr-street', 'modal-addr-neighborhood',
    'modal-addr-city', 'modal-addr-instructions',
    'summary-items-list', 'summary-cart-count', 'summary-subtotal', 'summary-shipping-label',
    'summary-shipping-cost', 'summary-total', 'btn-total-display',
    'summary-delivery-name', 'summary-delivery-schedule', 'summary-delivery-label-kicker',
    'summary-delivery-fee-badge', 'checkout-step-1', 'checkout-step-2',
    'step-badge-1', 'step-badge-2', 'step-circle-2', 'step-2-indicator',
    'banking-processing-overlay'
  ].forEach(id => getEl(id));

  // Inicializar estado de radio
  elements['radio-delivery-node'].checked = true;

  const mockLocalStorage = {
    store: {
      rb_cart: JSON.stringify([
        { id: 'p1', title: 'Canasta Agroecológica', price: 20.00, quantity: 1, unit: 'canasta' }
      ]),
      rb_cached_profile: JSON.stringify({
        id: 'usr-123',
        full_name: 'Mateo Noboa',
        email: 'mateo@raizybarrio.com',
        role: 'consumer'
      })
    },
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };

  const sandbox = {
    document: {
      addEventListener: () => {},
      getElementById: (id) => getEl(id),
      querySelector: () => null,
      querySelectorAll: () => []
    },
    window: {
      location: { href: '', search: '' },
      supabase: {
        fetchApi: async (endpoint) => {
          if (endpoint.startsWith('pickup_nodes')) {
            return [{ id: 'n1', name: 'Sede Urdesa', address: 'Av. Víctor Emilio', city: 'Guayaquil', pickup_schedule: 'Miér 3pm' }];
          }
          if (endpoint.startsWith('delivery_addresses')) {
            return []; // Por defecto sin direcciones para escenario 1
          }
          if (endpoint.startsWith('payment_methods')) {
            return [{ id: 'c1', brand: 'visa', last4: '1234', is_default: true }];
          }
          return [];
        }
      }
    },
    localStorage: mockLocalStorage,
    console: console,
    setTimeout: (cb) => cb(),
    Number,
    String,
    Math,
    Date,
    JSON,
    Array,
    isNaN,
    alert: () => {}
  };

  const context = vm.createContext(sandbox);
  const script = new vm.Script(checkoutJsCode);
  script.runInContext(context);

  return { context, elements, sandbox, mockLocalStorage };
}

async function runScenarioTests() {
  console.log('\n--- ESCENARIO 1: Usuario SIN direcciones registradas ---');
  const env1 = createMockEnvironment();
  await env1.context.initCheckout();

  // Caso A: Debe haber seleccionado inicialmente Recogida en Nodo (Gratis)
  assert.strictEqual(env1.sandbox.window.getActiveDeliveryMode(), 'NODE_PICKUP', 'Debe iniciar en NODE_PICKUP');
  assert.strictEqual(env1.elements['summary-shipping-cost'].textContent, 'Gratis', 'Costo de envío inicial debe ser Gratis');
  assert.strictEqual(env1.elements['summary-total'].textContent, '$20.00', 'Total debe ser sólo subtotal ($20.00)');
  assert(!env1.elements['checkout-no-address-view'].classList.contains('hidden'), 'Debe mostrar el mensaje de sin dirección registrada');
  console.log('✔ Estado inicial sin direcciones: selecciona Nodo (Gratis), total $20.00');

  // Usuario hace clic en A Domicilio y el modal de nueva dirección se abre
  env1.context.selectDeliveryMode('HOME_DELIVERY');
  assert(!env1.elements['modal-new-address'].classList.contains('hidden'), 'El modal de dirección debe abrirse');

  // Usuario pulsa Cancelar o cierra el modal sin guardar
  env1.context.closeNewAddressModal();

  // REGLA ESTRICTA: Fallback automático a Recogida en Nodo y alerta visual
  assert.strictEqual(env1.sandbox.window.getActiveDeliveryMode(), 'NODE_PICKUP', 'Debe regresar automáticamente a NODE_PICKUP');
  assert(!env1.elements['checkout-delivery-alert'].classList.contains('hidden'), 'Debe mostrar el banner de alerta');
  assert(env1.elements['checkout-delivery-alert-text'].textContent.includes('No has seleccionado una dirección de entrega'), 'Texto de advertencia exacto');
  assert.strictEqual(env1.elements['summary-shipping-cost'].textContent, 'Gratis', 'Envío debe ser Gratis');
  assert.strictEqual(env1.elements['summary-total'].textContent, '$20.00', 'Total debe mantenerse sin recargo ($20.00)');
  console.log('✔ Cancelar modal sin dirección ejecuta advertencia y fallback automático a Nodo ($0.00)');

  // Intento de continuar al Paso 2 sin dirección
  env1.context.selectDeliveryMode('HOME_DELIVERY'); // Cambiar a domicilio
  env1.context.proceedToStep2();
  assert.strictEqual(env1.sandbox.window.getActiveDeliveryMode(), 'NODE_PICKUP', 'proceedToStep2 sin dirección revierte a Nodo');
  console.log('✔ proceedToStep2 sin dirección revierte automáticamente a Nodo y no deja pasar');

  console.log('\n--- ESCENARIO 2: Usuario CON direcciones registradas ---');
  const env2 = createMockEnvironment();
  // Simular que Supabase devuelve 2 direcciones reales en Guayaquil
  env2.sandbox.window.supabase.fetchApi = async (endpoint) => {
    if (endpoint.startsWith('pickup_nodes')) {
      return [{ id: 'n1', name: 'Sede Urdesa', address: 'Av. Víctor Emilio', city: 'Guayaquil', pickup_schedule: 'Miér 3pm' }];
    }
    if (endpoint.startsWith('delivery_addresses')) {
      return [
        { id: 'addr-1', label: 'Casa', street_address: 'Av. Las Monjas 204', neighborhood: 'Urdesa', city: 'Guayaquil', is_preferred: true, delivery_fee: 2.50 },
        { id: 'addr-2', label: 'Oficina', street_address: 'Malecón 2000 Torre B', neighborhood: 'Centro', city: 'Guayaquil', is_preferred: false, delivery_fee: 2.50 }
      ];
    }
    if (endpoint.startsWith('payment_methods')) {
      return [{ id: 'c1', brand: 'visa', last4: '4821', is_default: true }];
    }
    return [];
  };

  await env2.context.initCheckout();
  assert(env2.sandbox.window.getCheckoutAddresses().length === 2, 'Debe cargar las 2 direcciones');
  assert.strictEqual(env2.sandbox.window.getActiveAddress().id, 'addr-1', 'Debe pre-seleccionar la dirección preferida');
  assert(env2.elements['checkout-no-address-view'].classList.contains('hidden'), 'No-address view debe estar oculta');
  assert(!env2.elements['checkout-selected-address-view'].classList.contains('hidden'), 'Selected-address view debe estar visible');
  assert.strictEqual(env2.elements['checkout-home-fee-badge'].textContent, '$2.50', 'Badge de tarifa a domicilio debe ser $2.50');

  // Al seleccionar A Domicilio, se debe sumar $2.50 automáticamente
  env2.context.selectDeliveryMode('HOME_DELIVERY');
  assert.strictEqual(env2.sandbox.window.getActiveDeliveryMode(), 'HOME_DELIVERY');
  assert.strictEqual(env2.elements['summary-shipping-cost'].textContent, '$2.50', 'Resumen debe mostrar $2.50');
  assert.strictEqual(env2.elements['summary-total'].textContent, '$22.50', 'Total debe ser $20.00 + $2.50 = $22.50');
  console.log('✔ Usuario con direcciones: preselección correcta y cálculo de $2.50 (Total: $22.50)');

  // Al volver a cambiar a Recogida en Nodo, vuelve a $0.00
  env2.context.selectDeliveryMode('NODE_PICKUP');
  assert.strictEqual(env2.elements['summary-shipping-cost'].textContent, 'Gratis');
  assert.strictEqual(env2.elements['summary-total'].textContent, '$20.00');
  console.log('✔ Cambio a Nodo: costo vuelve a Gratis y total a $20.00');

  console.log('\n--- ESCENARIO 3: Sincronización en mis-pedidos.html con desglose de $2.50 ---');
  const misPedidosJsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'mis-pedidos.js'), 'utf8');
  
  // Probar desglose de precio en mis-pedidos con orden a domicilio
  const mockOrderHome = {
    id: 'ord-test-home',
    order_number: 'RB-9988',
    created_at: '2026-11-13T10:00:00Z',
    status: 'delivered',
    payment_method: 'Tarjeta de crédito',
    delivery_type: 'domicilio',
    delivery_fee: 2.50,
    shipping_cost: 2.50,
    total_amount: 22.50,
    items: [
      { title: 'Canasta Agroecológica', price: 20.00, quantity: 1, unit: 'canasta' }
    ]
  };

  const mockOrderNode = {
    id: 'ord-test-node',
    order_number: 'RB-9989',
    created_at: '2026-11-12T10:00:00Z',
    status: 'delivered',
    payment_method: 'Efectivo',
    delivery_type: 'nodo',
    delivery_fee: 0.00,
    shipping_cost: 0.00,
    total_amount: 15.00,
    items: [
      { title: 'Tomate de huerta', price: 15.00, quantity: 1, unit: 'kg' }
    ]
  };

  // Evaluar en mis-pedidos
  const tableRowsEl = { innerHTML: '', classList: { remove: () => {}, add: () => {} } };
  const mpSandbox = {
    document: {
      addEventListener: () => {},
      getElementById: (id) => {
        if (id === 'orders-table-rows') return tableRowsEl;
        return { textContent: '', classList: { remove: () => {}, add: () => {} } };
      }
    },
    window: { location: { search: '' } },
    localStorage: { getItem: () => null },
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

  const mpContext = vm.createContext(mpSandbox);
  new vm.Script(misPedidosJsCode).runInContext(mpContext);

  mpContext.renderOrdersView([mockOrderHome, mockOrderNode]);
  const renderedHtml = tableRowsEl.innerHTML;

  assert(renderedHtml.includes('+$2.50 envío a domicilio'), 'Debe mostrar +$2.50 envío a domicilio para orden a domicilio');
  assert(renderedHtml.includes('Envío gratis (Recogida en nodo)'), 'Debe mostrar Envío gratis para orden en nodo');
  assert(renderedHtml.includes('$22.50'), 'Debe mostrar total de $22.50 con envío');
  assert(renderedHtml.includes('$15.00'), 'Debe mostrar total de $15.00 sin envío');

  console.log('✔ mis-pedidos.html desglosa correctamente +$2.50 envío a domicilio y Envío gratis');
  console.log('\n🎉 ¡TODOS LOS TESTS DE LA INTEGRACIÓN DE CHECKOUT Y MIS PEDIDOS PASARON EXITOSAMENTE!');
}

runScenarioTests().catch(err => {
  console.error(err);
  process.exit(1);
});
