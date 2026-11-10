/**
 * Definiciones de tipos TypeScript para Ubicación y Preferencia de Entrega
 * Proyecto: Raíz Campesina Marketplace
 */

export type DeliveryMode = 'node' | 'home';

export interface PickupNode {
  id: string;
  name: string;
  address: string;
  city: string;
  pickup_schedule: string;
  is_active: boolean;
  created_at?: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  neighborhood: string;
  city: string;
  delivery_instructions?: string;
  delivery_fee: number;
  delivery_schedule: string;
  is_preferred: boolean;
  created_at?: string;
}

export interface AddressFormData {
  id?: string;
  label: string;
  street_address: string;
  neighborhood: string;
  city: string;
  delivery_instructions?: string;
  delivery_fee: number;
  delivery_schedule: string;
  is_preferred: boolean;
}

export interface DeliveryPreferencesState {
  activeMode: DeliveryMode;
  selectedNodeId: string | null;
  selectedNode: PickupNode | null;
  pickupNodes: PickupNode[];
  addresses: DeliveryAddress[];
  isLoading: boolean;
  error: string | null;
}

