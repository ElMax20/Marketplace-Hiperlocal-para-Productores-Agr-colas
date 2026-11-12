import React, { useEffect, useState } from 'react';
import { Product, MarketFilterState } from '../../../types/products';

interface MarketGridProps {
  supabaseClient?: any;
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleFavorite?: (productId: string | number) => void;
  favoriteIds?: (string | number)[];
  initialCategory?: string;
  selectedProducerId?: string | null;
}

const DEFAULT_MARKET_PRODUCTS: Product[] = [
  {
    id: '1',
    numericId: 1,
    producer_id: '00000000-0000-0000-0000-000000000005',
    category_id: 2,
    title: 'Tomate de huerta',
    category: 'verduras',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
    price: 0.64,
    originalPrice: 0.85,
    subtitle: '1 kg · Cosecha fresca',
    origin: 'Hacienda San José · Daule · a 45 km',
    is_available: true,
    is_active: true,
    stock_quantity: 85,
    unit: 'kg'
  },
  {
    id: '2',
    numericId: 2,
    producer_id: '00000000-0000-0000-0000-000000000004',
    category_id: 3,
    title: 'Aguacate Hass',
    category: 'frutas',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/aguacates.jpg',
    price: 0.85,
    originalPrice: 0.98,
    subtitle: '1 kg · 4 a 5 unidades aprox.',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    is_available: true,
    is_active: true,
    stock_quantity: 42,
    unit: 'kg'
  },
  {
    id: '3',
    numericId: 3,
    producer_id: '00000000-0000-0000-0000-000000000005',
    category_id: 2,
    title: 'Zanahoria de tierra',
    category: 'verduras',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/zanahorias.jpg',
    price: 0.40,
    originalPrice: 0.48,
    subtitle: '1 kg · Cosechadas a mano',
    origin: 'Hacienda San José · Daule · a 45 km',
    is_available: true,
    is_active: true,
    stock_quantity: 60,
    unit: 'kg'
  },
  {
    id: '4',
    numericId: 4,
    producer_id: '00000000-0000-0000-0000-000000000004',
    category_id: 3,
    title: 'Fresas de temporada',
    category: 'frutas',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/fresas.jpg',
    price: 0.80,
    originalPrice: 0.95,
    subtitle: '500g · Selección especial',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    is_available: true,
    is_active: true,
    stock_quantity: 35,
    unit: '500g'
  },
  {
    id: '5',
    numericId: 5,
    producer_id: '00000000-0000-0000-0000-000000000005',
    category_id: 2,
    title: 'Papa criolla nativa',
    category: 'verduras',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/papa_criolla.jpg',
    price: 0.52,
    originalPrice: 0.65,
    subtitle: '1 kg · Lavada y seleccionada',
    origin: 'Hacienda San José · Daule · a 45 km',
    is_available: true,
    is_active: true,
    stock_quantity: 50,
    unit: 'kg'
  },
  {
    id: '6',
    numericId: 6,
    producer_id: '00000000-0000-0000-0000-000000000004',
    category_id: 3,
    title: 'Banano criollo de ladera',
    category: 'frutas',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/banano_criollo.jpg',
    price: 0.38,
    originalPrice: 0.45,
    subtitle: '1 kg · Maduración natural',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    is_available: true,
    is_active: true,
    stock_quantity: 40,
    unit: 'kg'
  },
  {
    id: '7',
    numericId: 7,
    producer_id: '00000000-0000-0000-0000-000000000006',
    category_id: 4,
    title: 'Queso campesino artesanal',
    category: 'lacteos',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/queso_campesino.jpg',
    price: 0.75,
    originalPrice: 0.90,
    subtitle: '500g · Leche de pastoreo',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    is_available: true,
    is_active: true,
    stock_quantity: 20,
    unit: '500g'
  },
  {
    id: '8',
    numericId: 8,
    producer_id: '00000000-0000-0000-0000-000000000006',
    category_id: 4,
    title: 'Yogur de pastoreo',
    category: 'lacteos',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/yogur_pastoreo.jpg',
    price: 0.65,
    originalPrice: 0.80,
    subtitle: '1 L · Sin azúcar añadida',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    is_available: true,
    is_active: true,
    stock_quantity: 18,
    unit: '1L'
  },
  {
    id: '9',
    numericId: 9,
    producer_id: '00000000-0000-0000-0000-000000000006',
    category_id: 5,
    title: 'Miel de abeja silvestre',
    category: 'despensa',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/miel_silvestre.jpg',
    price: 0.88,
    originalPrice: 1.10,
    subtitle: '350g · Bosque nativo',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    is_available: true,
    is_active: true,
    stock_quantity: 15,
    unit: '350g'
  },
  {
    id: '10',
    numericId: 10,
    producer_id: '00000000-0000-0000-0000-000000000006',
    category_id: 5,
    title: 'Mermelada artesanal de mora',
    category: 'despensa',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/mermelada_mora.jpg',
    price: 0.60,
    originalPrice: 0.75,
    subtitle: '280g · Paila artesanal',
    origin: 'Asociación Don Jorge · Naranjal · a 78 km',
    is_available: true,
    is_active: true,
    stock_quantity: 22,
    unit: '280g'
  },
  {
    id: '11',
    numericId: 11,
    producer_id: '00000000-0000-0000-0000-000000000005',
    category_id: 1,
    title: 'Canasta Huerto Familiar',
    category: 'canastas',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_familiar.jpg',
    price: 0.95,
    originalPrice: 1.20,
    subtitle: 'Canasta semanal · 3 a 5 personas',
    origin: 'Hacienda San José · Daule · a 45 km',
    is_available: true,
    is_active: true,
    stock_quantity: 12,
    unit: 'canasta'
  },
  {
    id: '12',
    numericId: 12,
    producer_id: '00000000-0000-0000-0000-000000000004',
    category_id: 1,
    title: 'Canasta Agroecológica Esencial',
    category: 'canastas',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/canasta_esencial.jpg',
    price: 0.70,
    originalPrice: 0.88,
    subtitle: 'Canasta semanal · 1 a 2 personas',
    origin: 'Huerta Agroecológica El Guayacán · Milagro · a 42 km',
    is_available: true,
    is_active: true,
    stock_quantity: 8,
    unit: 'canasta'
  },
  {
    id: '13',
    numericId: 13,
    producer_id: '00000000-0000-0000-0000-000000000005',
    category_id: 2,
    title: 'Rábanos de temporada',
    category: 'verduras',
    image: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/rabanos.jpg',
    price: 0.28,
    originalPrice: 0.35,
    subtitle: '1 manojo · Cosecha del día',
    origin: 'Hacienda San José · Daule · a 45 km',
    is_available: true,
    is_active: true,
    stock_quantity: 30,
    unit: 'manojo'
  }
];

export const MarketGrid: React.FC<MarketGridProps> = ({
  supabaseClient,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  initialCategory = 'todos',
  selectedProducerId = null,
}) => {
  const [products, setProducts] = useState<Product[]>(DEFAULT_MARKET_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const client = supabaseClient || (window as any).supabase;

        if (client && typeof client.from === 'function') {
          // 1. Consulta limpia y directa según requerimiento:
          const { data, error } = await client
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Aviso en supabase.from("products"):', error);
          }

          const productsData = (!error && Array.isArray(data) && data.length > 0) ? data : null;

          if (isMounted && productsData) {
            const categoryMap: Record<number, string> = {
              1: 'canastas',
              2: 'verduras',
              3: 'frutas',
              4: 'lacteos',
              5: 'despensa'
            };

            const formatted: Product[] = productsData.map((dbP: any) => {
              const priceNum = Number(dbP.price);
              return {
                id: String(dbP.id),
                numericId: dbP.id,
                producer_id: dbP.producer_id,
                category_id: dbP.category_id,
                title: dbP.title,
                category: categoryMap[dbP.category_id] || 'verduras',
                image: dbP.image_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
                price: priceNum,
                originalPrice: Math.round(priceNum * 1.15 * 100) / 100,
                subtitle: `${dbP.unit || 'kg'} · Cosecha fresca`,
                origin: dbP.description || 'Finca local de Guayas',
                description: dbP.description,
                is_available: dbP.is_available ?? true,
                is_active: dbP.is_active ?? true,
                stock_quantity: dbP.stock_quantity || 0,
                unit: dbP.unit || 'kg',
                created_at: dbP.created_at
              };
            });

            setProducts(formatted);
          }
        } else if (client && typeof client.getProducts === 'function') {
          const productsData = await client.getProducts();
          if (isMounted && productsData) {
            const categoryMap: Record<number, string> = {
              1: 'canastas',
              2: 'verduras',
              3: 'frutas',
              4: 'lacteos',
              5: 'despensa'
            };

            const formatted: Product[] = productsData.map((dbP: any) => {
              const priceNum = Number(dbP.price);
              return {
                id: String(dbP.id),
                numericId: dbP.id,
                producer_id: dbP.producer_id,
                category_id: dbP.category_id,
                title: dbP.title,
                category: categoryMap[dbP.category_id] || 'verduras',
                image: dbP.image_url || 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg',
                price: priceNum,
                originalPrice: Math.round(priceNum * 1.15 * 100) / 100,
                subtitle: `${dbP.unit || 'kg'} · Cosecha fresca`,
                origin: dbP.description || 'Finca local de Guayas',
                description: dbP.description,
                is_available: dbP.is_available ?? dbP.is_active ?? true,
                is_active: dbP.is_active ?? true,
                stock_quantity: dbP.stock_quantity || 0,
                unit: dbP.unit || 'kg',
                created_at: dbP.created_at
              };
            });

            setProducts(formatted);
          }
        }
      } catch (err: any) {
        console.error('Error al consultar productos de Supabase:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Error al conectar con el catálogo de Supabase');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [supabaseClient]);

  // Filtrado de productos sin requerir llaves de nodo huérfanas
  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 'todos' && p.category !== activeCategory) {
      return false;
    }
    if (selectedProducerId && p.producer_id !== selectedProducerId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchOrigin = (p.origin || '').toLowerCase().includes(q);
      if (!matchTitle && !matchOrigin) return false;
    }
    return true;
  });

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Barra de Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          {['todos', 'canastas', 'verduras', 'frutas', 'lacteos', 'despensa'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition capitalize cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1a3d2f] text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat === 'todos' ? 'Todas las cosechas' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por cosecha o finca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:border-[#1a3d2f]"
          />
          <span className="absolute left-3 top-2.5 text-stone-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin text-2xl text-emerald-700 mb-2">🌿</div>
          <p className="text-xs text-stone-500 font-medium">Cargando cosechas frescas desde Guayaquil...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center mb-6">
          <p className="font-semibold">Aviso del servidor</p>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Grid de Productos */}
      {!isLoading && (
        <>
          <div className="mb-4 text-xs font-bold text-stone-600">
            {filteredProducts.length} productos disponibles para tu entrega
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
              <span className="text-3xl block mb-2">🌱</span>
              <h4 className="font-serif text-lg font-bold text-stone-800">No encontramos cosechas en esta selección</h4>
              <p className="text-xs text-stone-500 mt-1">Prueba seleccionando otra categoría o limpiando la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p, index) => {
                const isFav = favoriteIds.includes(p.id) || (p.numericId && favoriteIds.includes(p.numericId));

                return (
                  <article
                    key={p.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
                    style={{ contain: 'content' }}
                  >
                    <div>
                      {/* Imagen y Badges */}
                      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading={index < 4 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        <button
                          onClick={() => onToggleFavorite && onToggleFavorite(p.id)}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/95 border border-stone-200/80 shadow-xs transition ${
                            isFav ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'
                          }`}
                          aria-label="Agregar a favoritos"
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>

                        <span className="absolute bottom-3 left-3 bg-[#1a3d2f]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {p.subtitle}
                        </span>
                      </div>

                      {/* Detalles */}
                      <div className="p-4">
                        <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                          {p.category}
                        </p>
                        <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-[#1a3d2f] transition-colors leading-snug">
                          {p.title}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {p.origin}
                        </p>
                      </div>
                    </div>

                    {/* Precios y Acción */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold text-stone-900">
                              ${p.price.toFixed(2)}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-stone-400 line-through">
                                ${p.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400">USD por {p.unit || 'unidad'}</span>
                        </div>

                        <button
                          onClick={() => onAddToCart && onAddToCart(p, 1)}
                          className="px-3.5 py-2 bg-[#1a3d2f] hover:bg-[#255240] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Agregar</span>
                          <span>+</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default MarketGrid;

