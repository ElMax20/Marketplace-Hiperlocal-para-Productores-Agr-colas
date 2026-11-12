/**
 * Contratos de datos para el carrusel de cabecera (Hero Slider)
 */

export interface HeroButton {
  text: string;
  link: string;
}

export interface HeroSlide {
  id: string;
  badge: string;
  badgeClass?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  primaryButton: HeroButton;
  secondaryButton: HeroButton;
  benefits: string[];
  imageUrl: string;
  alt: string;
  floatingBadge?: {
    icon: string;
    text: string;
    subtext: string;
  };
}

