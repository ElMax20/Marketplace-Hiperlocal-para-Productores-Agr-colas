export interface Product {
  id: string | number;
  numericId?: number;
  producer_id?: string;
  category_id?: number;
  title: string;
  category: 'canastas' | 'verduras' | 'frutas' | 'lacteos' | 'despensa' | string;
  tag?: string;
  discount?: string | null;
  image: string;
  subtitle?: string;
  origin?: string;
  description?: string;
  rating?: string | number;
  reviews?: number;
  price: number;
  originalPrice?: number | null;
  availability?: string;
  is_available?: boolean;
  is_active?: boolean;
  stock_quantity?: number;
  unit?: string;
  distanceKm?: number;
  isOffer?: boolean;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface MarketFilterState {
  category: string;
  producerId: string | null;
  search: string;
  offersOnly: boolean;
  favoritesOnly: boolean;
  weeklyOnly: boolean;
  maxDistance: number;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'destacados' | 'precio-menor' | 'precio-mayor' | 'calificacion';
}
