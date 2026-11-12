import React from 'react';
import { CartProduct, DeliveryType } from '../../types/checkout';

interface OrderSummaryProps {
  items: CartProduct[];
  subtotal: number;
  deliveryType: DeliveryType;
  deliveryFee: number;
  total: number;
  estimatedDeliveryDate?: string;
  deliveryLocationName?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  deliveryType,
  deliveryFee,
  total,
  estimatedDeliveryDate,
  deliveryLocationName,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-sm sticky top-6">
      <h3 className="font-serif text-xl font-bold text-stone-900 pb-4 border-b border-stone-100 flex items-center justify-between">
        <span>Resumen de tu pedido</span>
        <span className="text-xs font-normal text-stone-500 font-sans">
          {items.reduce((acc, it) => acc + it.quantity, 0)} artículos
        </span>
      </h3>

      {/* Lista de productos */}
      <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1 my-3">
        {items.map((item) => (
          <div key={item.id} className="py-3 flex items-center gap-3 text-xs">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">
                🌿
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-800 truncate">{item.title}</p>
              <p className="text-[11px] text-stone-400">
                {item.quantity} {item.unit || 'unidad(es)'} × ${item.price.toLocaleString('es-CO')}
              </p>
            </div>
            <span className="font-bold text-stone-900 shrink-0">
              ${(item.price * item.quantity).toLocaleString('es-CO')}
            </span>
          </div>
        ))}
      </div>

      {/* Estimación de entrega en resumen */}
      {deliveryLocationName && (
        <div className="my-3 p-3 rounded-2xl bg-[#f7f5f0] border border-stone-200/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-[#c85a32] block">
            {deliveryType === 'NODE_PICKUP' ? 'Punto de recogida:' : 'Entrega a domicilio:'}
          </span>
          <p className="font-semibold text-stone-800 truncate mt-0.5">{deliveryLocationName}</p>
          {estimatedDeliveryDate && (
            <p className="text-[11px] text-stone-500 mt-0.5">
              📅 {estimatedDeliveryDate}
            </p>
          )}
        </div>
      )}

      {/* Desglose de costos */}
      <div className="space-y-2.5 pt-4 border-t border-stone-100 text-xs">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal productos:</span>
          <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>
            {deliveryType === 'NODE_PICKUP' ? 'Recogida en nodo:' : 'Costo de envío a domicilio:'}
          </span>
          <span className="font-medium">
            {deliveryFee === 0 ? (
              <strong className="text-emerald-700">Gratis</strong>
            ) : (
              `$${deliveryFee.toLocaleString('es-CO')}`
            )}
          </span>
        </div>
        <div className="flex justify-between text-stone-900 pt-3 border-t border-stone-200 text-base font-bold">
          <span>Total a pagar:</span>
          <span className="text-xl text-[#1a3d2f] font-serif">
            ${total.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Badges de confianza */}
      <div className="mt-6 pt-5 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
        <div className="flex items-center gap-2">
          <span className="text-emerald-700">🌱</span>
          <span>100% origen agroecológico certificado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700">🔒</span>
          <span>Pago seguro encriptado SSL y tokenización PCI-DSS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700">👨‍🌾</span>
          <span>Comercio justo directo sin intermediarios</span>
        </div>
      </div>
    </div>
  );
};

