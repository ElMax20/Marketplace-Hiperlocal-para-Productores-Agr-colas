import React from 'react';

export interface Producer {
  id: string;
  name: string;
  subtitle: string;
  locationTag: string;
  description: string;
  categoryTag: string;
  categoryIcon: string;
  imageUrl: string;
}

export const PRODUCERS_GUAYAS: Producer[] = [
  {
    id: 'hacienda-san-jose',
    name: 'Hacienda San José',
    subtitle: 'Familia Alvarado',
    locationTag: 'DAULE · 45 KM',
    description: 'Pioneros en cultivos de hortalizas biointensivas y arroz agroecológico sin pesticidas. Riego tradicional con agua fresca de cuenca.',
    categoryTag: 'Hortalizas & Granos',
    categoryIcon: '🌱',
    imageUrl: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_1.jpg'
  },
  {
    id: 'el-guayacan',
    name: 'Huerta Agroecológica El Guayacán',
    subtitle: 'Tres Generaciones',
    locationTag: 'MILAGRO · 42 KM',
    description: 'Tres generaciones dedicadas a frutas tropicales, piña de exportación, cítricos dulces y hojas verdes recolectadas a mano al amanecer.',
    categoryTag: 'Frutas Tropicales & Hojas',
    categoryIcon: '🍍',
    imageUrl: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_2.jpg'
  },
  {
    id: 'don-jorge',
    name: 'Asociación Don Jorge',
    subtitle: 'Cacaoteros y Frutícolas de Naranjal',
    locationTag: 'NARANJAL · 78 KM',
    description: 'Cacao fino de aroma nacional, plátano verde barraganete y miel pura de abeja de bosque seco tropical.',
    categoryTag: 'Cacao, Plátano & Despensa',
    categoryIcon: '🍫',
    imageUrl: 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/agricultor_3.jpg'
  }
];

interface FarmersSectionProps {
  onSelectProducer?: (producerId: string) => void;
}

export const FarmersSection: React.FC<FarmersSectionProps> = ({ onSelectProducer }) => {
  const handleFilterByProducer = (producerId: string) => {
    if (onSelectProducer) {
      onSelectProducer(producerId);
    } else {
      window.location.href = `mercado.html?productor=${producerId}`;
    }
  };

  return (
    <section id="agricultores" className="py-16 md:py-24 bg-[#FAF7F2] border-t border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c85a32]">
              Transparencia y origen garantizado
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1a3d2f] font-normal mt-1">
              Conoce a nuestros agricultores.
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Detrás de cada alimento hay familias campesinas, saberes ancestrales y amor por la tierra.
            </p>
          </div>
          <a
            href="mercado.html"
            className="text-xs font-bold text-[#1a3d2f] hover:text-[#c85a32] flex items-center gap-1 transition"
          >
            Nuestros agricultores (24) ➔
          </a>
        </div>

        {/* Grid de Productores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRODUCERS_GUAYAS.map((producer) => (
            <div
              key={producer.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={producer.imageUrl}
                  alt={producer.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#1a3d2f] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  {producer.locationTag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">{producer.name}</h3>
                  <p className="text-xs font-semibold text-[#c85a32] mt-0.5">{producer.subtitle}</p>
                  <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                    {producer.description}
                  </p>
                </div>

                {/* Pie de tarjeta flexible y responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-stone-200 w-full mt-6">
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 self-start">
                    {producer.categoryIcon} {producer.categoryTag}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFilterByProducer(producer.id)}
                    className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group whitespace-nowrap self-end sm:self-auto cursor-pointer transition-colors"
                  >
                    Ver cosecha de esta finca <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FarmersSection;
