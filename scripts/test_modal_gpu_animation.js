// scripts/test_modal_gpu_animation.js
// Validación de estilos GPU, ausencia de saltos de layout y clases 60fps en modales

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FALLÓ:', message);
    process.exit(1);
  }
  console.log('✔', message);
}

console.log('=== TEST GPU MODAL ANIMATIONS & ZERO LAYOUT SHIFT ===');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const authJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf-8');

// 1. Validar CSS de GPU en styles.css
assert(stylesCss.includes('.modal-overlay-gpu'), 'styles.css contiene .modal-overlay-gpu');
assert(stylesCss.includes('.modal-card-gpu'), 'styles.css contiene .modal-card-gpu');
assert(stylesCss.includes('transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out;'), 'Curva cúbica 220ms cubic-bezier(0.16, 1, 0.3, 1) y 180ms ease-out configurada');
assert(stylesCss.includes('will-change: transform, opacity;'), 'will-change: transform, opacity presente para aceleración GPU');

// 2. Validar que en index.html el modal de login utiliza las clases GPU
assert(indexHtml.includes('id="login-auth-modal" class="modal-overlay-gpu'), '#login-auth-modal utiliza modal-overlay-gpu');
assert(indexHtml.includes('class="modal-card-gpu relative w-full max-w-md'), 'Tarjeta de login utiliza modal-card-gpu');
assert(!indexHtml.includes('id="login-auth-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onclick="if(event.target === this) closeLoginModal()"><div class="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-xl my-auto z-10 animate-slide-up'), 'Se eliminó animate-slide-up que causaba el salto vertical');

// 3. Validar que en js/auth.js se previene el scroll automático de focus()
assert(authJs.includes('preventScroll: true'), 'focus() usa { preventScroll: true } para evitar saltos de scroll');
assert(authJs.includes('modal.scrollTop = 0'), 'modal.scrollTop = 0 asegura centrado sin desplazamiento residual');
assert(authJs.includes('modal.classList.add(\'is-open\')'), 'Se aplica clase is-open tras doble RAF');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE ANIMACIÓN GPU PASARON EXITOSAMENTE!');
