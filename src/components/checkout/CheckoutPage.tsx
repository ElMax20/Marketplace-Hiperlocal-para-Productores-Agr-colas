import React, { useState } from 'react';
import { DeliveryStep } from './DeliveryStep';
import { PaymentStep } from './PaymentStep';
import { OrderSummary } from './OrderSummary';
import { ProcessingOverlay } from './ProcessingOverlay';
import { useCheckout } from './useCheckout';

export const CheckoutPage: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    items,
    pickupNodes,
    addresses,
    savedCards,
    deliveryType,
    setDeliveryType,
    selectedNode,
    setSelectedNode,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
    selectedCardId,
    setSelectedCardId,
    isUsingNewCard,
    setIsUsingNewCard,
    newCardData,
    setNewCardData,
    subtotal,
    deliveryFee,
    total,
    isProcessing,
    processingMessage,
    error,
    confirmPurchase,
  } = useCheckout();

  const [isAddingAddressModal, setIsAddingAddressModal] = useState(false);

  const estimatedDeliveryDate =
    deliveryType === 'NODE_PICKUP'
      ? selectedNode?.pickup_schedule
      : selectedAddress?.delivery_schedule || 'Sábado · 2:00 – 6:00 p. m.';

  const locationName =
    deliveryType === 'NODE_PICKUP'
      ? selectedNode?.name
      : `${selectedAddress?.label || 'Casa'}: ${selectedAddress?.street_address || ''}`;

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-800 antialiased pb-16">
      <ProcessingOverlay isVisible={isProcessing} message={processingMessage} />

      {/* Header dedicado de Checkout */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <a href="mercado.html" className="flex items-center gap-2 group">
            <span className="text-xl">🌱</span>
            <span className="font-serif font-black text-xl text-[#1a3d2f] tracking-tight group-hover:text-[#255440] transition">
              raíz & barrio
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c85a32] bg-[#faece6] px-2 py-0.5 rounded-full ml-1">
              Checkout Seguro
            </span>
          </a>

          {/* Stepper horizontal */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className={`flex items-center gap-1.5 ${currentStep === 'delivery' ? 'text-[#1a3d2f] font-bold' : 'text-stone-400'}`}>
              <span className="w-5 h-5 rounded-full bg-[#1a3d2f] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Entrega</span>
            </span>
            <span className="text-stone-300">───</span>
            <span className={`flex items-center gap-1.5 ${currentStep === 'payment' ? 'text-[#1a3d2f] font-bold' : 'text-stone-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'payment' ? 'bg-[#1a3d2f] text-white' : 'bg-stone-200 text-stone-600'}`}>2</span>
              <span>Pago</span>
            </span>
          </div>

          <a href="mercado.html" className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition font-medium">
            <span>←</span> Volver al mercado
          </a>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Pasos de Checkout */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Paso 1: Selección y Confirmación de Entrega */}
            {currentStep === 'delivery' && (
              <DeliveryStep
                deliveryType={deliveryType}
                selectedNode={selectedNode}
                selectedAddress={selectedAddress}
                pickupNodes={pickupNodes}
                addresses={addresses}
                onSelectDeliveryType={setDeliveryType}
                onSelectNode={setSelectedNode}
                onSelectAddress={setSelectedAddress}
                onAddNewAddress={() => setIsAddingAddressModal(true)}
                onProceedToPayment={() => {
                  setCurrentStep('payment');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Paso 2: Selección y Simulación Real de Pago */}
            {currentStep === 'payment' && (
              <PaymentStep
                paymentMethod={paymentMethod}
                savedCards={savedCards}
                selectedCardId={selectedCardId}
                isUsingNewCard={isUsingNewCard}
                newCardData={newCardData}
                totalAmount={total}
                onSelectPaymentMethod={setPaymentMethod}
                onSelectCardId={setSelectedCardId}
                onToggleNewCard={setIsUsingNewCard}
                onUpdateNewCardData={(patch) => setNewCardData((prev) => ({ ...prev, ...patch }))}
                onConfirmPurchase={confirmPurchase}
                onBackToDelivery={() => {
                  setCurrentStep('delivery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Columna Derecha: Order Summary Sticky */}
          <div className="lg:col-span-5 xl:col-span-4">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              deliveryType={deliveryType}
              deliveryFee={deliveryFee}
              total={total}
              estimatedDeliveryDate={estimatedDeliveryDate}
              deliveryLocationName={locationName}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;

