/**
 * Raíz & Barrio - Cliente Supabase y Servicios de Base de Datos
 * Conexión directa a base de datos Supabase:
 * URL: https://hvjqgvplbmshpucnuzfy.supabase.co
 */

const SUPABASE_CONFIG = {
  url: 'https://hvjqgvplbmshpucnuzfy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU'
};

/**
 * Cliente REST ligero para Supabase (funciona sin dependencias externas)
 */
class SupabaseService {
  constructor() {
    this.baseUrl = `${SUPABASE_CONFIG.url}/rest/v1`;
    this.headers = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async fetchApi(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase Error (${response.status}):`, errorText);
      throw new Error(`Error Supabase: ${response.statusText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // =========================================================================
  // AUTENTICACIÓN / USUARIOS (profiles)
  // =========================================================================

  /**
   * Valida credenciales contra la tabla 'profiles' en Supabase
   */
  async login(username, password) {
    try {
      const cleanUser = encodeURIComponent(username.trim());
      const cleanPass = encodeURIComponent(password.trim());
      
      const query = `profiles?username=eq.${cleanUser}&password=eq.${cleanPass}&select=*`;
      const users = await this.fetchApi(query);

      if (users && users.length > 0) {
        return users[0];
      }
      return null;
    } catch (e) {
      console.warn('Fallo consulta login en Supabase, verificando offline...', e);
      return null;
    }
  }

  /**
   * Obtiene todos los perfiles de la base de datos
   */
  async getProfiles() {
    try {
      return await this.fetchApi('profiles?select=*&order=created_at.asc');
    } catch (e) {
      console.error('Error al obtener perfiles de Supabase:', e);
      return [];
    }
  }

  /**
   * Actualiza un perfil en Supabase
   */
  async updateProfile(id, updates) {
    try {
      return await this.fetchApi(`profiles?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error(`Error al actualizar perfil ${id}:`, e);
      throw e;
    }
  }

  // =========================================================================
  // PRODUCTOS (products)
  // =========================================================================

  /**
   * Obtiene todos los productos de la base de datos
   */
  async getProducts() {
    try {
      return await this.fetchApi('products?select=*&order=id.asc');
    } catch (e) {
      console.error('Error al obtener productos de Supabase:', e);
      return [];
    }
  }

  /**
   * Agrega un nuevo producto a Supabase
   */
  async createProduct(productData) {
    try {
      return await this.fetchApi('products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    } catch (e) {
      console.error('Error al crear producto en Supabase:', e);
      throw e;
    }
  }

  /**
   * Actualiza precio, stock o disponibilidad de un producto en Supabase
   */
  async updateProduct(id, updates) {
    try {
      return await this.fetchApi(`products?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error(`Error al actualizar producto ${id}:`, e);
      throw e;
    }
  }

  // =========================================================================
  // CATEGORÍAS (categories)
  // =========================================================================

  /**
   * Obtiene las categorías de la base de datos
   */
  async getCategories() {
    try {
      return await this.fetchApi('categories?select=*&order=id.asc');
    } catch (e) {
      console.error('Error al obtener categorías de Supabase:', e);
      return [];
    }
  }
}

// Instancia global disponible en toda la aplicación
window.supabase = new SupabaseService();

