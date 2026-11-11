import { useState, useEffect } from 'react';
import { PickupNode, DeliveryAddress } from '../../types/delivery';
import {
  CartProduct,
  SavedPaymentCard,
  NewCardPayload,
  CheckoutStep,
  DeliveryType,
  PaymentMethod,
  BankSimulationResponse,
} from '../../types/checkout';
import { OrderRecord, OrderItemDetail } from '../../types/orders';

// Interface para el cliente Supabase
declare const window: any;

export function useCheckout() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [items, setItems] = useState<CartProduct[]>([]);
  const [pickupNodes, setPickupNodes] = useState<PickupNode[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [savedCards, setSavedCards] = useState<SavedPaymentCard[]>([]);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('NODE_PICKUP');
  const [selectedNode, setSelectedNode] = useState<PickupNode | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isUsingNewCard, setIsUsingNewCard] = useState(false);
  const [newCardData, setNewCardData] = useState<NewCardPayload>({
    cardholderName: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    saveCard: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Procesando pago seguro con el banco emisor...');
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de datos desde LocalStorage y Supabase
  useEffect(() => {
    loadCart();
    loadSupabaseData();
  }, []);

  const loadCart = () => {
    try {
      const raw = localStorage.getItem('rb_cart') || localStorage.getItem('raiz_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('Error leyendo carrito:', e);
    }
  };

  const loadSupabaseData = async () => {
    if (!window.supabase) return;

    try {
      // 1. Cargar nodos comunitarios
      const nodes = await window.supabase.fetchApi('pickup_nodes?is_active=eq.true&order=created_at.asc');
      if (Array.isArray(nodes) && nodes.length > 0) {
        setPickupNodes(nodes);
        setSelectedNode(nodes[0]);
      }

      // 2. Obtener usuario autenticado
      const userRaw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user && user.id) {
        // Direcciones
        const addrs = await window.supabase.fetchApi(`delivery_addresses?user_id=eq.${user.id}&order=is_preferred.desc,created_at.desc`);
        if (Array.isArray(addrs) && addrs.length > 0) {
          setAddresses(addrs);
          setSelectedAddress(addrs[0]);
        }

        // Tarjetas
        const cards = await window.supabase.fetchApi(`payment_methods?user_id=eq.${user.id}&order=is_default.desc,created_at.desc`);
        if (Array.isArray(cards) && cards.length > 0) {
          setSavedCards(cards);
          setSelectedCardId(cards[0].id);
        } else {
          setIsUsingNewCard(true);
        }
      }
    } catch (err) {
      console.warn('Advertencia cargando datos de checkout:', err);
    }
  };

  // Cálculos de subtotal y total
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'NODE_PICKUP' ? 0 : (selectedAddress?.delivery_fee ?? 8000);
  const total = subtotal + deliveryFee;

  // Confirmar compra y simular pasarela bancaria
  const confirmPurchase = async (): Promise<BankSimulationResponse> => {
    setIsProcessing(true);
    setProcessingMessage('Procesando pago seguro con el banco emisor...');
    setError(null);

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const userRaw = localStorage.getItem('rb_current_user') || localStorage.getItem('raiz_user');
          const user = userRaw ? JSON.parse(userRaw) : null;
          const userId = user?.id || '00000000-0000-0000-0000-000000000001';
          const customerName = user?.name || user?.full_name || (paymentMethod === 'CARD' ? (newCardData.cardholderName || 'Comprador Raíz & Barrio') : 'Cliente Raíz & Barrio');
          const customerEmail = user?.email || 'facturacion@raizybarrio.co';

          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const orderNumber = `#RB-${randomNum}`;
          const transactionId = `TXN-REAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          const authCode = Math.floor(100000 + Math.random() * 900000).toString();

          const orderItems: OrderItemDetail[] = items.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
            unit: i.unit || 'unidad',
            farmer: i.farmer || 'Productor Local',
            subtotal: i.price * i.quantity,
            image: i.image,
          }));

          const deliveryLocation =
            deliveryType === 'NODE_PICKUP'
              ? (selectedNode?.name || 'Nodo Central · La Perseverancia')
              : `${selectedAddress?.street_address || ''}, ${selectedAddress?.neighborhood || ''}, ${selectedAddress?.city || ''}`;

          const estimatedDate =
            deliveryType === 'NODE_PICKUP'
              ? (selectedNode?.pickup_schedule || 'Sábado 14 de Noviembre · 8:00 a. m. – 12:00 p. m.')
              : (selectedAddress?.delivery_schedule || 'Sábado 14 de Noviembre · 2:00 p. m. – 6:00 p. m.');

          const prepEstimate =
            deliveryType === 'NODE_PICKUP'
              ? 'Tu canasta estará lista para retiro el Sábado de 8:00 AM a 12:00 PM'
              : 'Entrega programada en tu puerta para el Sábado entre 2:00 PM y 6:00 PM';

          // Registro para Supabase
          const orderData: OrderRecord = {
            order_number: orderNumber,
            user_id: userId,
            customer_name: customerName,
            customer_email: customerEmail,
            items: orderItems,
            subtotal,
            delivery_fee: deliveryFee,
            total_amount: total,
            delivery_type: deliveryType,
            delivery_location: deliveryLocation,
            delivery_estimated_date: estimatedDate,
            preparation_time_estimate: prepEstimate,
            delivery_address_or_node_id: deliveryType === 'NODE_PICKUP' ? selectedNode?.id : selectedAddress?.id,
            payment_method: paymentMethod,
            payment_method_type: paymentMethod === 'CARD' ? 'card' : 'cash_on_delivery',
            payment_status: 'COMPLETED',
            payment_details: {
              transaction_id: transactionId,
              payment_method: paymentMethod,
              brand: paymentMethod === 'CARD' ? 'VISA' : 'CASH',
              last4: paymentMethod === 'CARD' ? (isUsingNewCard ? newCardData.cardNumber.replace(/\D/g, '').slice(-4) : '4821') : 'N/A',
              cardholder_name: customerName,
              authorization_code: authCode,
              simulated: true,
              timestamp: new Date().toISOString(),
            },
            delivery_details: {
              delivery_type: deliveryType,
              location_name: deliveryLocation,
              address: deliveryLocation,
              city: selectedAddress?.city || selectedNode?.city || 'Bogotá',
              delivery_fee: deliveryFee,
              schedule: estimatedDate,
            },
            status: 'confirmed',
          };

          // 1. Insertar orden en Supabase
          let createdOrder = null;
          if (window.supabase) {
            try {
              const res = await window.supabase.fetchApi('orders', {
                method: 'POST',
                headers: { Prefer: 'return=representation' },
                body: JSON.stringify(orderData),
              });
              createdOrder = Array.isArray(res) ? res[0] : res;
            } catch (errDb) {
              console.error('Error insertando orden en Supabase:', errDb);
            }

            // 2. Descontar stock de productos
            for (const it of items) {
              try {
                const prod = await window.supabase.fetchApi(`products?id=eq.${it.id}&select=stock_quantity`);
                if (prod && prod.length > 0) {
                  const currentStock = prod[0].stock_quantity || 0;
                  const newStock = Math.max(0, currentStock - it.quantity);
                  await window.supabase.fetchApi(`products?id=eq.${it.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ stock_quantity: newStock }),
                  });
                }
              } catch (_) {}
            }
          }

          // 3. Limpiar carrito
          localStorage.removeItem('rb_cart');
          localStorage.setItem('raiz_cart', '[]');

          setIsProcessing(false);
          const response: BankSimulationResponse = {
            success: true,
            transaction_id: transactionId,
            authorization_code: authCode,
            status: 'COMPLETED',
            message: 'Pago autorizado exitosamente.',
          };

          resolve(response);

          // 4. Redirección a /checkout/success
          const orderId = createdOrder?.id || transactionId;
          window.location.href = `checkout-success.html?order_id=${encodeURIComponent(orderId)}&order_number=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}`;
        } catch (err: any) {
          setIsProcessing(false);
          setError(err.message || 'Error procesando la transacción.');
          reject(err);
        }
      }, 2500);
    });
  };

  return {
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
  };
}
