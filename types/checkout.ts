/**
 * Tipos TypeScript para el flujo de compra y Checkout
 * Proyecto: Raíz & Barrio Marketplace
 */

import { PickupNode, DeliveryAddress } from './delivery';

export type DeliveryType = 'node' | 'home';
export type PaymentMethodType = 'card' | 'cash_on_delivery' | 'pse';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  farmer?: string;
}

export interface PaymentCard {
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

export interface NewCardData {
  cardholderName: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface PSEBank {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  unit?: string;
  farmer?: string;
  subtotal: number;
}

export interface Order {
  id?: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_type: DeliveryType;
  delivery_address_or_node_id: string;
  payment_method_type: PaymentMethodType;
  payment_method_id?: string | null;
  payment_details: Record<string, any>;
  delivery_details: Record<string, any>;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: string;
}

export interface CheckoutState {
  deliveryType: DeliveryType;
  selectedNode: PickupNode | null;
  selectedAddress: DeliveryAddress | null;
  paymentMethodType: PaymentMethodType;
  selectedCardId: string | null;
  isUsingNewCard: boolean;
  newCard: NewCardData;
  selectedPseBank: string;
  termsConfirmed: boolean;
  isSubmitting: boolean;
  error: string | null;
}
