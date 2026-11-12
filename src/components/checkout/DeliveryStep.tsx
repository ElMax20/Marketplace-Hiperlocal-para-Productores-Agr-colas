import React, { useState } from 'react';
import { PickupNode, DeliveryAddress } from '../../types/delivery';
import { DeliveryType } from '../../types/checkout';

interface DeliveryStepProps {
  deliveryType: DeliveryType;
  selectedNode: PickupNode | null;
  selectedAddress: DeliveryAddress | null;
  pickupNodes: PickupNode[];
  addresses: DeliveryAddress[];
  onSelectDeliveryType: (type: DeliveryType) => void;
  onSelectNode: (node: PickupNode) => void;
  onSelectAddress: (address: DeliveryAddress) => void;
  onAddNewAddress: () => void;
  onProceedToPayment: () => void;
}

export const DeliveryStep: React.FC<DeliveryStepProps> = ({
  deliveryType,
  selectedNode,
  selectedAddress,
  pickupNodes,
  addresses,
  onSelectDeliveryType,
  onSelectNode,
  onSelectAddress,
  onAddNewAddress,
  onProceedToPayment,
}) => {
  const [isChangingNode, setIsChangingNode] = useState(false);

  const isNode = deliveryType === 'NODE_PICKUP';
  const isHome = deliveryType === 'HOME_DELIVERY';

  const canContinue = isNode ? !!selectedNode : !!selectedAddress;

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between pb-5 border-b border-stone-100">
        <div>
          <span className="text-[11px] font-bold text-[#c85a32] uppercase tracking-wider block">Paso 1 de 2</span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
            Selecciona tu forma de entrega
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Debes definir dónde recibirás tus cosechas antes de proceder al pago seguro.
          </p>
        </div>
        <span className="w-8 h-8 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center font-bold text-sm">
          1
        </span>
      </div>

      {/* Radio Cards Mutuamente Excluyentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        
        {/* Opción 1: Recogida en Nodo Comunitario */}
        <div
          onClick={() => onSelectDeliveryType('NODE_PICKUP')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
            isNode
              ? 'border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="deliveryType"
                checked={isNode}
                onChange={() => onSelectDeliveryType('NODE_PICKUP')}
                className="w-4 h-4 text-[#1a3d2f] focus:ring-[#1a3d2f]"
              />
              <div>
                <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span>🏛️</span> Recogida en Nodo
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Punto físico de entrega comunitaria</span>
              </div>
            </div>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Gratis
            </span>
          </div>

          {/* Información del nodo seleccionado */}
          {selectedNode && (
            <div className="mt-4 pt-3 border-t border-emerald-100/60 text-xs">
              <p className="font-bold text-stone-800">{selectedNode.name}</p>
              <p className="text-stone-500 text-[11px] mt-0.5">{selectedNode.address} · {selectedNode.city}</p>
              
              <div className="mt-2.5 bg-white/80 rounded-xl p-2.5 border border-emerald-200/50">
                <span className="text-[10px] font-semibold text-[#1a3d2f] block uppercase tracking-wide">
                  Horario de entrega:
                </span>
                <p className="text-stone-700 text-xs font-medium mt-0.5">{selectedNode.pickup_schedule}</p>
                <p className="text-[11px] text-stone-500 mt-1 italic">
                  🌿 <strong>Tiempo de preparación:</strong> Tu canasta estará lista para retiro el {selectedNode.pickup_schedule}.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChangingNode(!isChangingNode);
                }}
                className="mt-3 text-xs font-bold text-[#c85a32] hover:underline flex items-center gap-1"
              >
                <span>{isChangingNode ? '✕ Cerrar lista' : '⇄ Cambiar nodo comunitario'}</span>
              </button>
            </div>
          )}

          {/* Selector de Nodos desplegable */}
          {isChangingNode && isNode && (
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              {pickupNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node);
                    setIsChangingNode(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedNode?.id === node.id
                      ? 'border-[#1a3d2f] bg-emerald-100/60 font-semibold'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <p className="font-bold text-stone-800">{node.name}</p>
                  <p className="text-[11px] text-stone-500">{node.address} · {node.pickup_schedule}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Opción 2: Entrega a Domicilio */}
        <div
          onClick={() => onSelectDeliveryType('HOME_DELIVERY')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
            isHome
              ? 'border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="deliveryType"
                checked={isHome}
                onChange={() => onSelectDeliveryType('HOME_DELIVERY')}
                className="w-4 h-4 text-[#1a3d2f] focus:ring-[#1a3d2f]"
              />
              <div>
                <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span>🏡</span> Entrega a Domicilio
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Directo hasta tu puerta</span>
              </div>
            </div>
            <span className="inline-block bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              $8.000
            </span>
          </div>

          {/* Información de la dirección seleccionada */}
          {isHome && (
            <div className="mt-4 pt-3 border-t border-emerald-100/60 text-xs">
              {selectedAddress ? (
                <div>
                  <p className="font-bold text-stone-800">
                    {selectedAddress.label} · {selectedAddress.street_address}
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5">
                    {selectedAddress.neighborhood}, {selectedAddress.city}
                  </p>
                  {selectedAddress.delivery_instructions && (
                    <p className="text-stone-500 text-[11px] italic mt-1 bg-white/70 p-1.5 rounded-lg border border-stone-200">
                      "{selectedAddress.delivery_instructions}"
                    </p>
                  )}
                  
                  <div className="mt-2.5 bg-white/80 rounded-xl p-2.5 border border-emerald-200/50">
                    <span className="text-[10px] font-semibold text-[#1a3d2f] block uppercase tracking-wide">
                      Estimación de llegada:
                    </span>
                    <p className="text-stone-700 text-xs font-medium mt-0.5">
                      {selectedAddress.delivery_schedule || 'Sábado de cosecha · 2:00 p. m. – 6:00 p. m.'}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      🚚 <strong>Tiempo de entrega:</strong> Entrega en tu puerta el Sábado entre 2:00 p. m. y 6:00 p. m.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  <p className="text-stone-600 text-xs">No tienes una dirección seleccionada.</p>
                </div>
              )}

              {/* Lista rápida de direcciones o botón agregar */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNewAddress();
                  }}
                  className="text-xs font-bold text-[#1a3d2f] hover:text-[#255440] flex items-center gap-1"
                >
                  <span>+ Agregar nueva dirección</span>
                </button>
              </div>

              {addresses.length > 1 && (
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAddress(addr);
                      }}
                      className={`p-2 rounded-lg border text-[11px] cursor-pointer ${
                        selectedAddress?.id === addr.id ? 'border-[#1a3d2f] bg-emerald-50' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <strong>{addr.label}:</strong> {addr.street_address} ({addr.neighborhood})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botón para avanzar al paso 2 */}
      <div className="mt-8 pt-5 border-t border-stone-100 flex justify-end">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onProceedToPayment}
          className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
            canContinue
              ? 'bg-[#1a3d2f] hover:bg-[#255440] text-white cursor-pointer hover:shadow-md'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>Continuar al método de pago</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

