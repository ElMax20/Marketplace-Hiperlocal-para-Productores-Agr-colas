/**
 * Tipos TypeScript para Autenticación, Registro y Perfil de Usuario
 * Proyecto: Raíz & Barrio Marketplace
 */

export type UserRole = 'cliente' | 'productor' | 'administrador';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  farm_name?: string | null;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avatar_url?: string | null;
  preferred_pickup_node_id?: string | null;
  active_delivery_mode?: 'node' | 'home' | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerRegistrationInput {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface ProducerApplicationInput {
  farm_name: string;
  location: string;
  products: string;
  whatsapp: string;
}

export interface ProducerApplicationRecord extends ProducerApplicationInput {
  id: string;
  status: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  created_at: string;
}

export interface PasswordValidationRules {
  minLength: boolean;    // >= 8 caracteres
  hasUppercase: boolean; // Al menos 1 mayúscula
  hasLowercase: boolean; // Al menos 1 minúscula
  hasNumber: boolean;    // Al menos 1 número
  hasSpecial: boolean;   // Al menos 1 símbolo/especial
  isValid: boolean;      // Todas las anteriores cumplidas
}

export type UsernameValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export interface FieldValidationResult {
  valid: boolean;
  message?: string;
  cleanValue?: string;
}


