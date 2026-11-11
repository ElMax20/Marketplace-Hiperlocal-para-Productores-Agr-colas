/**
 * Definiciones de tipos TypeScript para Órdenes y Facturación (n8n Webhook Ready)
 * Proyecto: Raíz & Barrio Marketplace
 */

export type DeliveryType = 'NODE_PICKUP' | 'HOME_DELIVERY';
export type PaymentMethod = 'CARD' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItemDetail {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  unit?: string;
  farmer?: string;
  subtotal: number;
  image?: string;
}

export interface PaymentDetails {
  transaction_id: string;
  payment_method: PaymentMethod;
  brand?: string;
  last4?: string;
  cardholder_name?: string;
  authorization_code?: string;
  simulated: boolean;
  timestamp: string;
}

export interface DeliveryDetails {
  delivery_type: DeliveryType;
  location_name: string;
  address: string;
  neighborhood?: string;
  city: string;
  delivery_fee: number;
  schedule: string;
  instructions?: string;
}

export interface OrderRecord {
  id?: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  items: OrderItemDetail[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_type: DeliveryType;
  delivery_location: string;
  delivery_estimated_date: string;
  preparation_time_estimate: string;
  delivery_address_or_node_id?: string | null;
  payment_method: PaymentMethod;
  payment_method_type?: string;
  payment_status: PaymentStatus;
  payment_details?: PaymentDetails;
  delivery_details?: DeliveryDetails;
  status: OrderStatus;
  created_at?: string;
}

/**
 * Payload preparado para el webhook de facturación en n8n
 */
export interface WebhookFacturacionPayload {
  event: 'order.payment_completed';
  order_id: string;
  order_number: string;
  timestamp: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  delivery: {
    type: DeliveryType;
    location: string;
    fee: number;
    estimated_date: string;
    preparation_estimate: string;
    instructions?: string;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transaction_id: string;
    total: number;
    subtotal: number;
  };
  items: OrderItemDetail[];
}
