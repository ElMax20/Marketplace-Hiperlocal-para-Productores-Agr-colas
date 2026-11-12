/**
 * Raíz & Barrio - Controlador del Carrusel de Cabecera (Hero Slider)
 * Alterna dinámicamente y de forma continua cada 6 segundos entre las promociones destacadas.
 * 
 * Configuración:
 * - Rotación automática continua cada 6 segundos (6000 ms).
 * - Sin pausa por hover ni botón play/pause.
 * - Únicos controles visibles: puntos circulares (dots) y flechas laterales (← / →).
 */

const HERO_SLIDES = [
  {
    id: 'canastas',
    badge: 'CANASTAS DE TEMPORADA · AHORRA HASTA 25%',
    title: 'Canastas familiares frescas, directo de la finca a tu mesa.',
    description: 'Recibe cada semana una selección balanceada de hortalizas, frutas y lácteos cosechados horas antes de la entrega. Sin intermediarios y a precio justo.',
    primaryButton: { text: 'Explorar Canastas →', link: 'mercado.html?categoria=canastas' },
    secondaryButton: { text: 'Ver Puntos de Recolección', link: '#nodos' },
    benefits: ['Ahorro garantizado', 'Cosecha semanal programada', 'Apoyo directo al productor'],
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Canasta familiar campesina llena de verduras y frutas frescas',
    floatingBadge: {
      icon: '🧺',
      title: 'Canasta Semanal',
      subtitle: 'Cosechada el mismo día'
    },
    tag: '🧺 Semanal'
  },
  {
    id: 'mercado',
    badge: 'PRODUCTOS FRESCOS BAJO DEMANDA',
    title: 'El mercado campesino, ahora a la vuelta de tu casa.',
    description: 'Arma tu pedido eligiendo producto por producto entre decenas de pequeños agricultores locales. Calidad artesanal y entrega en tu nodo más cercano.',
    primaryButton: { text: 'Comprar en el Mercado →', link: 'mercado.html' },
    secondaryButton: { text: 'Conoce a los Agricultores', link: 'productor.html' },
    benefits: ['Cero intermediarios', 'Cosechado bajo pedido', 'Precios fijos y transparentes'],
    imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Cosecha fresca de tomates, legumbres y hortalizas recién recolectadas',
    floatingBadge: {
      icon: '🌱',
      title: '+40 Agricultores',
      subtitle: 'Cosechado bajo pedido'
    },
    tag: '🥕 Bajo Demanda'
  }
];

let heroCurrentIndex = 0;
const HERO_INTERVAL = 6000; // ms por diapositiva (6 segundos continuos)

let heroTimer = null;
let heroTouchStartX = null;
let isHeroPausedForModal = false;

/**
 * Inicialización al cargar la página
 */
function initHeroSlider() {
  const sliderSection = document.getElementById('hero-slider-section');
  if (!sliderSection) return;

  // 1. Mostrar primer slide y sincronizar dots
  renderHeroSlide(heroCurrentIndex);

  // 2. Iniciar autoplay continuo de 6 segundos
  startHeroTimer();

  // 3. Soporte para gestos táctiles (Swipe en móviles/tablets)
  sliderSection.addEventListener('touchstart', (e) => {
    heroTouchStartX = e.touches[0].clientX;
  }, { passive: true });

  sliderSection.addEventListener('touchend', (e) => {
    if (heroTouchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = heroTouchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) nextHeroSlide();
      else prevHeroSlide();
    }
    heroTouchStartX = null;
  }, { passive: true });

  // 4. Navegación por teclado (Flechas)
  document.addEventListener('keydown', (e) => {
    const rect = sliderSection.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      if (e.key === 'ArrowRight') nextHeroSlide();
      if (e.key === 'ArrowLeft') prevHeroSlide();
    }
  });
}

/**
 * Inicia el temporizador de auto-rotación continua
 */
function startHeroTimer() {
  stopHeroTimer();
  if (isHeroPausedForModal) return;
  heroTimer = setInterval(() => {
    nextHeroSlide();
  }, HERO_INTERVAL);
}

/**
 * Detiene el temporizador
 */
function stopHeroTimer() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

/**
 * Pausa las transiciones y el temporizador mientras un modal esté abierto
 */
function pauseHeroSliderForModal() {
  if (isHeroPausedForModal) return;
  isHeroPausedForModal = true;
  stopHeroTimer();
  document.body.classList.add('modal-open');
}

/**
 * Reanuda las transiciones y el temporizador al cerrarse los modales
 */
function resumeHeroSliderFromModal() {
  if (!isHeroPausedForModal) return;
  isHeroPausedForModal = false;
  document.body.classList.remove('modal-open');
  startHeroTimer();
}

/**
 * Función de compatibilidad para evitar observadores recursivos sobre el DOM
 */
function setupModalPauseObserver() {
  // Sin observadores recursivos para garantizar cero latencia y evitar bloqueo del hilo principal
}

/**
 * Avanza a la siguiente diapositiva
 */
function nextHeroSlide() {
  heroCurrentIndex = (heroCurrentIndex + 1) % HERO_SLIDES.length;
  renderHeroSlide(heroCurrentIndex);
  startHeroTimer();
}

/**
 * Retrocede a la diapositiva anterior
 */
function prevHeroSlide() {
  heroCurrentIndex = (heroCurrentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  renderHeroSlide(heroCurrentIndex);
  startHeroTimer();
}

/**
 * Salta directamente a una diapositiva mediante un dot o acción
 */
function goToHeroSlide(idx) {
  if (idx < 0 || idx >= HERO_SLIDES.length) return;
  heroCurrentIndex = idx;
  renderHeroSlide(heroCurrentIndex);
  startHeroTimer();
}

/**
 * Aplica transiciones suaves y actualiza los indicadores (dots)
 */
function renderHeroSlide(index) {
  const slide0 = document.getElementById('hero-slide-0');
  const slide1 = document.getElementById('hero-slide-1');
  const dot0 = document.getElementById('hero-dot-0');
  const dot1 = document.getElementById('hero-dot-1');

  if (index === 0) {
    if (slide0) {
      slide0.className = 'w-full transition-opacity duration-700 ease-in-out absolute inset-0 flex items-center opacity-100 pointer-events-auto z-10';
      slide0.setAttribute('aria-hidden', 'false');
    }
    if (slide1) {
      slide1.className = 'w-full transition-opacity duration-700 ease-in-out absolute inset-0 flex items-center opacity-0 pointer-events-none z-0';
      slide1.setAttribute('aria-hidden', 'true');
    }

    // Dot 0 Activo (w-8 h-3 rounded-full bg-emerald-700)
    if (dot0) {
      dot0.className = 'w-8 h-3 rounded-full bg-emerald-700 transition-all duration-300 cursor-pointer shadow-2xs';
      dot0.setAttribute('aria-selected', 'true');
    }
    // Dot 1 Inactivo (w-3 h-3 rounded-full bg-stone-300 hover:bg-stone-400)
    if (dot1) {
      dot1.className = 'w-3 h-3 rounded-full bg-stone-300 hover:bg-stone-400 transition-all duration-300 cursor-pointer';
      dot1.setAttribute('aria-selected', 'false');
    }
  } else {
    if (slide1) {
      slide1.className = 'w-full transition-opacity duration-700 ease-in-out absolute inset-0 flex items-center opacity-100 pointer-events-auto z-10';
      slide1.setAttribute('aria-hidden', 'false');
    }
    if (slide0) {
      slide0.className = 'w-full transition-opacity duration-700 ease-in-out absolute inset-0 flex items-center opacity-0 pointer-events-none z-0';
      slide0.setAttribute('aria-hidden', 'true');
    }

    // Dot 1 Activo (w-8 h-3 rounded-full bg-emerald-700)
    if (dot1) {
      dot1.className = 'w-8 h-3 rounded-full bg-emerald-700 transition-all duration-300 cursor-pointer shadow-2xs';
      dot1.setAttribute('aria-selected', 'true');
    }
    // Dot 0 Inactivo (w-3 h-3 rounded-full bg-stone-300 hover:bg-stone-400)
    if (dot0) {
      dot0.className = 'w-3 h-3 rounded-full bg-stone-300 hover:bg-stone-400 transition-all duration-300 cursor-pointer';
      dot0.setAttribute('aria-selected', 'false');
    }
  }
}

// Inicialización reactiva al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
});

// Funciones expuestas globalmente
window.nextHeroSlide = nextHeroSlide;
window.prevHeroSlide = prevHeroSlide;
window.goToHeroSlide = goToHeroSlide;
window.pauseHeroSliderForModal = pauseHeroSliderForModal;
window.resumeHeroSliderFromModal = resumeHeroSliderFromModal;
window.HERO_SLIDES = HERO_SLIDES;
