/**
 * Tipos TypeScript para el flujo de Checkout y Pasarela de Pago
 * Proyecto: Raíz & Barrio Marketplace
 */

import { PickupNode, DeliveryAddress } from './delivery';
import { DeliveryType, PaymentMethod, PaymentStatus, OrderRecord, OrderItemDetail } from './orders';

export type CheckoutStep = 'delivery' | 'payment' | 'processing' | 'success';

export interface CartProduct {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  farmer?: string;
}

export interface SavedPaymentCard {
  id: string;
  user_id: string;
  brand: string;
  last4: string;
  cardholder_name: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at?: string;
}

export interface NewCardPayload {
  cardholderName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  saveCard?: boolean;
}

export interface CheckoutFormState {
  currentStep: CheckoutStep;
  // Paso 1: Entrega
  deliveryType: DeliveryType;
  selectedNode: PickupNode | null;
  selectedAddress: DeliveryAddress | null;
  // Paso 2: Pago
  paymentMethod: PaymentMethod;
  selectedCardId: string | null;
  isUsingNewCard: boolean;
  newCard: NewCardPayload;
  // Totales
  subtotal: number;
  deliveryFee: number;
  total: number;
  // Estados de proceso
  isProcessing: boolean;
  processingMessage: string;
  error: string | null;
}

export interface BankSimulationResponse {
  success: boolean;
  transaction_id: string;
  authorization_code: string;
  status: PaymentStatus;
  message: string;
}

export { DeliveryType, PaymentMethod, PaymentStatus, OrderRecord, OrderItemDetail };
