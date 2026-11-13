// scripts/test_dom_forgot_password.js
// Test con mock DOM nativo en Node para validar el comportamiento sin dependencias externas

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

console.log('=== TEST 1: Verificaciones Estáticas de Integración HTML ===');
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FALLÓ:', message);
    process.exit(1);
  }
  console.log('✔', message);
}

assert(indexHtml.includes('id="producer-forgot-password-view"'), 'Existe #producer-forgot-password-view en index.html');
assert(indexHtml.includes('campomax82@gmail.com'), 'Existe campomax82@gmail.com en index.html');
assert(indexHtml.includes('SOPORTE PORTAL PRODUCTORES'), 'Existe badge "SOPORTE PORTAL PRODUCTORES"');
assert(indexHtml.includes('Contacta al Directorio Técnico'), 'Existe título "Contacta al Directorio Técnico"');
assert(indexHtml.includes('Enviar correo al equipo de soporte'), 'Existe botón "Enviar correo al equipo de soporte"');
assert(indexHtml.includes('copyProducerSupportEmail()'), 'Existe llamada a copyProducerSupportEmail()');
assert(indexHtml.includes('sendProducerSupportMail()'), 'Existe llamada a sendProducerSupportMail()');

const mercadoHtml = fs.readFileSync(path.join(__dirname, '..', 'mercado.html'), 'utf-8');
assert(mercadoHtml.includes('id="producer-forgot-password-view-market"'), 'Existe vista de soporte en mercado.html');
assert(mercadoHtml.includes('campomax82@gmail.com'), 'Existe campomax82@gmail.com en mercado.html');

console.log('\n=== TEST 2: Validación de Lógica y Detección Estricta de Roles ===');

// Mock DOM class
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...tokens) { tokens.forEach(t => this.classes.add(t)); }
  remove(...tokens) { tokens.forEach(t => this.classes.delete(t)); }
  contains(token) { return this.classes.has(token); }
}

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.attributes = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.style = {};
  }
  getAttribute(attr) { return this.attributes[attr] || null; }
  setAttribute(attr, val) { this.attributes[attr] = String(val); }
  removeAttribute(attr) { delete this.attributes[attr]; }
  focus() {}
  addEventListener() {}
  removeEventListener() {}
}

const elements = {};
function getElementById(id) {
  if (!elements[id]) {
    elements[id] = new MockElement(id);
  }
  return elements[id];
}

global.document = {
  getElementById,
  body: new MockElement('body'),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window = {
  location: { href: '' },
  document: global.document,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Cargar auth.js
const authCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf-8');
eval(authCode);

const modal = getElementById('login-auth-modal');
const clientForgot = getElementById('forgot-password-panel');
const producerForgot = getElementById('producer-forgot-password-view');
const modalHeader = getElementById('auth-modal-header');
const titleEl = getElementById('auth-modal-title');
const badgeEl = getElementById('auth-modal-badge');
const tabCli = getElementById('tab-login-cliente');
const tabProd = getElementById('tab-login-productor');
const usernameInput = getElementById('auth-username');

console.log('\n--- CASO A: Usuario en Rol "Comprador / Vecino" ---');
window.openLoginModal('cliente');
assert(!window.isProducerAuthActive(), 'isProducerAuthActive() devuelve FALSE en modo cliente');
assert(modal.getAttribute('data-role') === 'cliente', 'modal tiene data-role="cliente"');

// Simular clic en "¿Olvidaste tu contraseña?"
window.switchToForgotPasswordView();
assert(clientForgot.classList.contains('hidden') === false, 'El panel de recuperación de clientes está VISIBLE');
assert(producerForgot.classList.contains('hidden') === true, 'El panel de productores está OCULTO');
assert(titleEl.textContent === 'Recuperar contraseña', 'Título es "Recuperar contraseña"');

console.log('\n--- CASO B: Usuario en Rol "Soy Productor" ---');
// Regresar a login y cambiar a productor
window.switchToLoginView('productor');
usernameInput.value = 'Finca Don Pedro';
assert(window.isProducerAuthActive(), 'isProducerAuthActive() devuelve TRUE en modo productor');
assert(modal.getAttribute('data-role') === 'productor', 'modal tiene data-role="productor"');

// Simular clic en "¿Olvidaste tu contraseña?"
window.switchToForgotPasswordView();
assert(clientForgot.classList.contains('hidden') === true, 'REGLA ESTRICTA: El formulario verde/cliente está OCULTO');
assert(producerForgot.classList.contains('hidden') === false, 'El panel de soporte de productores está VISIBLE');

// Validar generación de correo hacia campomax82@gmail.com con username incluido
window.sendProducerSupportMail();
assert(window.location.href.startsWith('mailto:campomax82@gmail.com'), 'mailto apunta a campomax82@gmail.com');
assert(window.location.href.includes(encodeURIComponent('Restablecimiento de contraseña - Portal Productores (Raíz & Barrio)')), 'Asunto correcto');
assert(window.location.href.includes(encodeURIComponent('- Usuario o correo registrado: Finca Don Pedro')), 'Cuerpo incluye el usuario ingresado previamente');

// Simular regreso a login
window.switchToLoginView('productor');
assert(producerForgot.classList.contains('hidden') === true, 'Panel de soporte se oculta al volver a login');
assert(modal.getAttribute('data-role') === 'productor', 'Vuelve correctamente a la pestaña Soy Productor');

console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE!');
