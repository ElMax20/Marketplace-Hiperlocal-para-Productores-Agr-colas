import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeroSlide } from '../../../types/hero';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'canastas',
    badge: 'CANASTAS DE TEMPORADA · AHORRA HASTA 25%',
    badgeClass: 'bg-[#faece6] text-[#c85a32] border-[#f0d5ca]',
    title: 'Canastas familiares frescas, directo de la finca a tu mesa.',
    description: 'Recibe cada semana una selección balanceada de hortalizas, frutas y lácteos cosechados horas antes de la entrega. Sin intermediarios y a precio justo.',
    primaryButton: { text: 'Explorar Canastas →', link: '/mercado?categoria=canastas' },
    secondaryButton: { text: 'Ver Puntos de Recolección', link: '/nodos' },
    benefits: ['Ahorro garantizado', 'Cosecha semanal programada', 'Apoyo directo al productor'],
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Canasta familiar campesina llena de verduras y frutas frescas',
    floatingBadge: {
      icon: '🧺',
      text: 'Canasta Semanal',
      subtext: 'Cosechada el mismo día'
    }
  },
  {
    id: 'mercado',
    badge: 'PRODUCTOS FRESCOS BAJO DEMANDA',
    badgeClass: 'bg-[#e8f5ec] text-[#1a3d2f] border-[#c4e5ce]',
    title: 'El mercado campesino, ahora a la vuelta de tu casa.',
    description: 'Arma tu pedido eligiendo producto por producto entre decenas de pequeños agricultores locales. Calidad artesanal y entrega en tu nodo más cercano.',
    primaryButton: { text: 'Comprar en el Mercado →', link: '/mercado' },
    secondaryButton: { text: 'Conoce a los Agricultores', link: '/productores' },
    benefits: ['Cero intermediarios', 'Cosechado bajo pedido', 'Precios fijos y transparentes'],
    imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Cosecha fresca de tomates, legumbres y hortalizas recién recolectadas',
    floatingBadge: {
      icon: '🌱',
      text: '+40 Agricultores',
      subtext: 'Cosechado bajo pedido'
    }
  }
];

interface HeroSliderProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number; // ms, default: 6000 (6 segundos continuos)
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides = HERO_SLIDES,
  autoPlayInterval = 6000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Timer de autoplay continuo cada 6 segundos sin pausa por hover
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, nextSlide]);

  // Teclado (flechas izq / der)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  // Gestos táctiles (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section 
      className="relative pt-6 pb-12 md:pt-10 md:pb-16 overflow-hidden bg-gradient-to-b from-[#f7f5f0] via-[#faf8f4] to-[#f7f5f0] select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promociones y cosechas destacadas"
    >
      {/* Contenedor Exterior Symmetrical & Centered */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Contenedor relativo de altura flexible para los slides */}
        <div className="relative min-h-[580px] sm:min-h-[480px] lg:min-h-[500px] flex items-center w-full">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;

            return (
              <div
                key={slide.id}
                className={`w-full transition-opacity duration-700 ease-in-out absolute inset-0 flex items-center ${
                  isActive
                    ? 'opacity-100 pointer-events-auto z-10'
                    : 'opacity-0 pointer-events-none z-0'
                }`}
                aria-hidden={!isActive}
              >
                <div className="w-full max-w-7xl mx-auto">
                  {/* Grid de 2 columnas proporcional exacto en ambos slides */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
                    
                    {/* Columna Izquierda: Información Comercial */}
                    <div className="w-full space-y-5 text-left">
                      
                      {/* Badge Promocional */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${slide.id === 'canastas' ? 'bg-[#c85a32] animate-pulse' : 'bg-[#1a3d2f] animate-pulse'}`}></span>
                        <span className={slide.id === 'canastas' ? 'text-[#c85a32]' : 'text-[#1a3d2f]'}>
                          {slide.badge}
                        </span>
                      </div>

                      {/* Título Principal */}
                      <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1a3d2f] font-normal tracking-tight leading-[1.14]">
                        {slide.title}
                      </h1>

                      {/* Descripción Comercial */}
                      <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                        {slide.description}
                      </p>

                      {/* Botones de Acción */}
                      <div className="flex flex-wrap items-center gap-3.5 pt-1">
                        <a
                          href={slide.primaryButton.link}
                          className={`${
                            slide.id === 'canastas'
                              ? 'bg-[#1a3d2f] hover:bg-[#255440]'
                              : 'bg-[#c85a32] hover:bg-[#b04a25]'
                          } text-white text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3.5 rounded-full shadow-md hover:shadow-xl transition-all duration-200 flex items-center gap-2 group active:scale-95`}
                        >
                          <span>{slide.primaryButton.text}</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                          </svg>
                        </a>

                        <a
                          href={slide.secondaryButton.link}
                          className="border border-stone-300 hover:border-[#1a3d2f] bg-white/80 hover:bg-white text-stone-800 text-xs sm:text-sm font-semibold px-5 sm:px-6 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-2xs hover:shadow active:scale-95"
                        >
                          <svg className="w-4 h-4 text-[#c85a32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          <span>{slide.secondaryButton.text}</span>
                        </a>
                      </div>

                      {/* Beneficios Garantizados */}
                      <div className="pt-4 border-t border-stone-200/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-600 font-medium">
                        {slide.benefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Columna Derecha: Tarjeta Fotográfica con Efectos */}
                    <div className="w-full relative">
                      <div className="relative mx-auto max-w-lg lg:max-w-none w-full">
                        
                        {/* Fondo decorativo estilizado */}
                        <div className={`absolute -inset-2 bg-gradient-to-r ${slide.id === 'canastas' ? 'from-emerald-100/60 to-amber-100/40 -rotate-1' : 'from-amber-100/60 to-emerald-100/40 rotate-1'} rounded-3xl transform scale-102 filter blur-sm`}></div>

                        {/* Imagen con Aspect Ratio y Zoom Suave */}
                        <div className="relative overflow-hidden rounded-3xl shadow-xl border-4 border-white aspect-[4/3] sm:aspect-[16/11] bg-stone-100 w-full group">
                          <img
                            src={slide.imageUrl}
                            alt={slide.alt}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                            loading={idx === 0 ? 'eager' : 'lazy'}
                          />

                          {/* Gradiente sutil inferior */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>

                          {/* Floating Badge sobre la imagen */}
                          {slide.floatingBadge && (
                            <div className="absolute bottom-4 left-4 bg-white/95 border border-white/60 shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2.5">
                              <span className="text-xl">{slide.floatingBadge.icon}</span>
                              <div>
                                <p className="text-xs font-bold text-stone-900 leading-tight">
                                  {slide.floatingBadge.text}
                                </p>
                                <p className="text-[10px] text-stone-500 font-medium">
                                  {slide.floatingBadge.subtext}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Tag de Categoría Superior */}
                          <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {slide.id === 'canastas' ? '🧺 Semanal' : '🥕 Bajo Demanda'}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =====================================================================
            BARRA INFERIOR: PUNTOS INTERACTIVOS (DOTS) Y FLECHAS LATERALES
            ===================================================================== */}
        <div className="mt-8 pt-4 border-t border-stone-200/70 flex items-center justify-center gap-4 sm:gap-6">
          
          {/* Botón Diapositiva Anterior */}
          <button
            type="button"
            onClick={prevSlide}
            className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-[#1a3d2f] flex items-center justify-center transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs"
            aria-label="Diapositiva anterior"
          >
            ←
          </button>

          {/* Indicadores Circulares Mínimos y Elegantes (Dots) */}
          <div className="flex items-center gap-2.5" role="tablist" aria-label="Selector de diapositivas">
            {slides.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Diapositiva ${idx + 1}: ${s.title}`}
                  onClick={() => goToSlide(idx)}
                  className={
                    isActive
                      ? 'w-8 h-3 rounded-full bg-emerald-700 transition-all duration-300 cursor-pointer shadow-2xs'
                      : 'w-3 h-3 rounded-full bg-stone-300 hover:bg-stone-400 transition-all duration-300 cursor-pointer'
                  }
                />
              );
            })}
          </div>

          {/* Botón Diapositiva Siguiente */}
          <button
            type="button"
            onClick={nextSlide}
            className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-[#1a3d2f] flex items-center justify-center transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs"
            aria-label="Diapositiva siguiente"
          >
            →
          </button>

        </div>

      </div>
    </section>
  );
};
