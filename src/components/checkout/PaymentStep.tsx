import React, { useState } from 'react';
import { SavedPaymentCard, NewCardPayload, PaymentMethod } from '../../types/checkout';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  savedCards: SavedPaymentCard[];
  selectedCardId: string | null;
  isUsingNewCard: boolean;
  newCardData: NewCardPayload;
  totalAmount: number;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onSelectCardId: (cardId: string) => void;
  onToggleNewCard: (usingNew: boolean) => void;
  onUpdateNewCardData: (data: Partial<NewCardPayload>) => void;
  onConfirmPurchase: () => void;
  onBackToDelivery: () => void;
  isProcessing: boolean;
}

// Algoritmo de Luhn para validación real en cliente
export function isValidLuhn(numberStr: string): boolean {
  const digits = numberStr.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  paymentMethod,
  savedCards,
  selectedCardId,
  isUsingNewCard,
  newCardData,
  totalAmount,
  onSelectPaymentMethod,
  onSelectCardId,
  onToggleNewCard,
  onUpdateNewCardData,
  onConfirmPurchase,
  onBackToDelivery,
  isProcessing,
}) => {
  const [luhnValid, setLuhnValid] = useState<boolean | null>(null);

  const isCard = paymentMethod === 'CARD';
  const isCOD = paymentMethod === 'CASH_ON_DELIVERY';

  const handleCardNumberChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 19);
    // Formatting 4-4-4-4
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    onUpdateNewCardData({ cardNumber: formatted });

    if (cleaned.length >= 13) {
      setLuhnValid(isValidLuhn(cleaned));
    } else {
      setLuhnValid(null);
    }
  };

  const handleExpiryChange = (raw: string) => {
    let cleaned = raw.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    onUpdateNewCardData({
      expMonth: cleaned.slice(0, 2),
      expYear: cleaned.slice(3, 5),
    });
  };

  const isCardReady = () => {
    if (!isCard) return true;
    if (!isUsingNewCard && selectedCardId) return true;
    if (isUsingNewCard) {
      const numClean = newCardData.cardNumber.replace(/\D/g, '');
      return (
        isValidLuhn(numClean) &&
        newCardData.cardholderName.trim().length >= 3 &&
        newCardData.cvv.length >= 3 &&
        newCardData.expMonth &&
        newCardData.expYear
      );
    }
    return false;
  };

  const canConfirm = !isProcessing && (isCOD || isCardReady());

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between pb-5 border-b border-stone-100">
        <div>
          <span className="text-[11px] font-bold text-[#c85a32] uppercase tracking-wider block">Paso 2 de 2</span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
            Selección y Simulación de Pago
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Simula la pasarela de pago bancaria conectada directamente con Supabase y n8n.
          </p>
        </div>
        <span className="w-8 h-8 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center font-bold text-sm">
          2
        </span>
      </div>

      {/* Métodos de Pago disponibles (Tarjeta vs Contraentrega) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        
        {/* Opción 1: Tarjeta */}
        <div
          onClick={() => onSelectPaymentMethod('CARD')}
          className={`cursor-pointer rounded-2xl p-4 border-2 transition ${
            isCard
              ? 'border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={isCard}
              onChange={() => onSelectPaymentMethod('CARD')}
              className="w-4 h-4 text-[#1a3d2f] focus:ring-[#1a3d2f]"
            />
            <div>
              <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>💳</span> Tarjeta de Crédito / Débito
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">Visa, Mastercard, American Express</span>
            </div>
          </div>
        </div>

        {/* Opción 2: En Nodo / Contraentrega */}
        <div
          onClick={() => onSelectPaymentMethod('CASH_ON_DELIVERY')}
          className={`cursor-pointer rounded-2xl p-4 border-2 transition ${
            isCOD
              ? 'border-[#1a3d2f] bg-emerald-50/30 ring-2 ring-[#1a3d2f]/10 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={isCOD}
              onChange={() => onSelectPaymentMethod('CASH_ON_DELIVERY')}
              className="w-4 h-4 text-[#1a3d2f] focus:ring-[#1a3d2f]"
            />
            <div>
              <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>🤝</span> En Nodo / Contraentrega
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">Paga al recibir tus productos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido según método de pago */}
      {isCard && (
        <div className="mt-6 pt-5 border-t border-stone-100">
          
          {/* Tarjetas guardadas en Supabase */}
          {savedCards.length > 0 && !isUsingNewCard && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700">Tus tarjetas guardadas:</label>
              <div className="space-y-2">
                {savedCards.map((card) => (
                  <label
                    key={card.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      selectedCardId === card.id
                        ? 'border-[#1a3d2f] bg-emerald-50/40'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="savedCard"
                        checked={selectedCardId === card.id}
                        onChange={() => onSelectCardId(card.id)}
                        className="w-4 h-4 text-[#1a3d2f]"
                      />
                      <div>
                        <span className="font-bold text-xs text-stone-800 tracking-wider">
                          {card.brand.toUpperCase()} terminada en •••• {card.last4}
                        </span>
                        <span className="text-[11px] text-stone-400 block">
                          Titular: {card.cardholder_name} · Exp: {card.exp_month}/{card.exp_year}
                        </span>
                      </div>
                    </div>
                    {card.is_default && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onToggleNewCard(true)}
                className="mt-2 text-xs font-bold text-[#1a3d2f] hover:underline flex items-center gap-1"
              >
                <span>+ Usar otra tarjeta para este pedido</span>
              </button>
            </div>
          )}

          {/* Formulario de nueva tarjeta */}
          {(isUsingNewCard || savedCards.length === 0) && (
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-stone-800">Datos de la tarjeta</h4>
                {savedCards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleNewCard(false)}
                    className="text-xs text-[#c85a32] font-semibold hover:underline"
                  >
                    Volver a tarjetas guardadas
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Nombre en la tarjeta *</label>
                <input
                  type="text"
                  placeholder="Ej. CARLOS CAMPOVERDE"
                  value={newCardData.cardholderName}
                  onChange={(e) => onUpdateNewCardData({ cardholderName: e.target.value.toUpperCase() })}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#1a3d2f]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-stone-700">Número de tarjeta (Luhn verificado) *</label>
                  {luhnValid === true && (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <span>✓</span> Tarjeta válida
                    </span>
                  )}
                  {luhnValid === false && (
                    <span className="text-[10px] font-semibold text-amber-700">
                      Número inválido
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  value={newCardData.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#1a3d2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Expiración (MM/AA) *</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/AA"
                    value={
                      newCardData.expMonth && newCardData.expYear
                        ? `${newCardData.expMonth}/${newCardData.expYear}`
                        : ''
                    }
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    className="w-full text-xs font-mono text-center p-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#1a3d2f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">CVV / CVC *</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={newCardData.cvv}
                    onChange={(e) => onUpdateNewCardData({ cvv: e.target.value.replace(/\D/g, '') })}
                    className="w-full text-xs font-mono text-center p-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#1a3d2f]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newCardData.saveCard || false}
                  onChange={(e) => onUpdateNewCardData({ saveCard: e.target.checked })}
                  className="w-3.5 h-3.5 text-[#1a3d2f] rounded"
                />
                <span>Guardar esta tarjeta de forma segura para futuras compras</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Información para En Nodo / Contraentrega */}
      {isCOD && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
          <p className="font-bold flex items-center gap-1.5">
            <span>📦</span> Pago en el momento de entrega
          </p>
          <p className="mt-1 text-stone-600 leading-relaxed">
            Puedes pagar en efectivo o tarjeta física cuando recibas tu pedido en el nodo comunitario o al repartidor en tu puerta. Te recomendamos tener el valor exacto si pagas en efectivo.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDelivery}
          className="text-xs font-bold text-stone-500 hover:text-stone-800 transition"
        >
          ← Cambiar forma de entrega
        </button>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirmPurchase}
          className={`px-8 py-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
            canConfirm
              ? 'bg-[#1a3d2f] hover:bg-[#255440] text-white cursor-pointer hover:shadow-lg'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>Confirmar compra</span>
          <span>·</span>
          <span>${totalAmount.toLocaleString('es-CO')}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

