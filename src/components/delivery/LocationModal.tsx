import React, { useState, useEffect } from 'react';
import { PickupNode } from '../../../types/delivery';

declare const window: any;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId?: string | null;
  onSelectNode: (node: PickupNode) => void;
  supabaseClient?: any;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  selectedNodeId,
  onSelectNode,
  supabaseClient,
}) => {
  const [nodes, setNodes] = useState<PickupNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar nodos de recogida directamente de Supabase
  const fetchPickupNodes = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const client = supabaseClient || (typeof window !== 'undefined' ? window.supabase : null);

    if (!client) {
      setErrorMsg('Cliente de Supabase no disponible.');
      setIsLoading(false);
      return;
    }

    try {
      // Requerimiento explícito: const { data } = await supabase.from('pickup_nodes').select('*');
      const { data, error } = await client.from('pickup_nodes').select('*');

      if (error) {
        console.error('Error al consultar pickup_nodes:', error);
        setErrorMsg('Error al conectar con la base de datos de Supabase.');
      } else if (Array.isArray(data) && data.length > 0) {
        // Filtrar nodos activos
        const activeNodes = data.filter((node: any) => node.is_active !== false);
        setNodes(activeNodes);
      } else {
        setNodes([]);
      }
    } catch (err: any) {
      console.error('Excepción al cargar nodos:', err);
      setErrorMsg('No se pudieron cargar los nodos de entrega.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPickupNodes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Puntos de Entrega · Guayaquil
            </span>
            <h3 id="location-modal-title" className="text-lg font-serif font-bold text-stone-900 mt-1.5">
              Elige dónde recibir tu mercado
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Adaptamos las cosechas frescas y días de entrega a tu zona comunitaria.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer text-sm"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Contenido: Listado de Nodos */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1a3d2f] uppercase tracking-wider flex items-center gap-1.5">
              <span>🏛️</span> Nodos Comunitarios de Guayaquil
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Recogida Gratis
            </span>
          </div>

          {isLoading ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-7 h-7 border-2 border-[#1a3d2f] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-medium">Consultando nodos activos en Supabase...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-6 px-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
              <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchPickupNodes}
                className="text-xs font-bold text-red-800 hover:underline cursor-pointer"
              >
                🔄 Reintentar consulta
              </button>
            </div>
          ) : nodes.length === 0 ? (
            <div className="py-8 px-4 bg-stone-50 border border-stone-200/80 rounded-2xl text-center space-y-2">
              <p className="text-xs text-stone-500">No hay nodos disponibles en este momento.</p>
              <button
                type="button"
                onClick={fetchPickupNodes}
                className="text-xs font-bold text-[#1a3d2f] hover:underline cursor-pointer"
              >
                🔄 Actualizar listado
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const schedule = node.schedule || node.pickup_schedule || 'Miércoles y Viernes: 3:00 PM – 7:30 PM';

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      onSelectNode(node);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-[#f0f6f2] border-[#1a3d2f] ring-1 ring-[#1a3d2f] shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📍</span>
                        <span className={`font-bold text-sm truncate ${isSelected ? 'text-[#1a3d2f]' : 'text-stone-900 group-hover:text-emerald-900'}`}>
                          {node.name}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 ml-5">
                        {node.address} · <span className="font-medium text-stone-700">{node.city || 'Guayaquil'}</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-1 ml-5 flex items-center gap-1">
                        <span>🕒</span> {schedule}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Gratis
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>✨ 3 nodos estratégicos en Guayaquil</span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

