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
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      body = JSON.stringify(body);
    }
    const response = await fetch(url, {
      ...options,
      body: body,
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
   * Genera el hash criptográfico SHA-256 de una contraseña en el navegador
   */
  async hashPassword(password) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (_) {}
    return password;
  }

  /**
   * Valida credenciales contra la tabla 'profiles' en Supabase (por usuario o correo)
   * Admite tanto contraseñas en texto plano como contraseñas hasheadas con SHA-256.
   */
  async login(username, password) {
    try {
      const cleanUser = encodeURIComponent(username.trim());
      const rawPass = password.trim();
      const hashedPass = await this.hashPassword(rawPass);
      
      const query = `profiles?or=(username.ilike.${cleanUser},email.ilike.${cleanUser})&select=*`;
      const users = await this.fetchApi(query);

      if (users && users.length > 0) {
        const matched = users.find(u => u.password === rawPass || u.password === hashedPass);
        if (matched) {
          return matched;
        }
      }
      return null;
    } catch (e) {
      console.error('Error al consultar autenticación en Supabase:', e);
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

  /**
   * Verifica disponibilidad de un nombre de usuario en Supabase
   */
  async checkUsernameAvailable(username) {
    try {
      if (!username || username.trim().length < 3) return false;
      const cleanUser = encodeURIComponent(username.trim().toLowerCase());
      const res = await this.fetchApi(`profiles?username=ilike.${cleanUser}&select=id`);
      return (!res || res.length === 0);
    } catch (e) {
      console.warn('Error verificando username en Supabase:', e);
      return true;
    }
  }

  /**
   * Verifica disponibilidad de un correo electrónico en Supabase
   */
  async checkEmailAvailable(email) {
    try {
      if (!email || !email.includes('@')) return false;
      const cleanEmail = encodeURIComponent(email.trim().toLowerCase());
      const res = await this.fetchApi(`profiles?email=ilike.${cleanEmail}&select=id`);
      return (!res || res.length === 0);
    } catch (e) {
      console.warn('Error verificando email en Supabase:', e);
      return true;
    }
  }

  /**
   * Registra un nuevo cliente en la tabla profiles de Supabase
   * Por defecto avatar_url es estrictamente NULL (sin fotos mockeadas)
   */
  async registerCustomer({ full_name, username, email, phone, password }) {
    try {
      const hashedPassword = await this.hashPassword(password.trim());
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      const newRecord = {
        full_name: full_name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: phone.trim(),
        password: hashedPassword,
        role: 'cliente',
        avatar_url: null
      };

      const res = await this.fetchApi('profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(newRecord)
      });

      if (res && res.length > 0) {
        return res[0];
      }
      return newRecord;
    } catch (e) {
      console.error('Error al registrar usuario en Supabase:', e);
      throw e;
    }
  }

  /**
   * Envía solicitud de acreditación técnica de un productor agrícola
   */
  async submitProducerApplication({ farm_name, location, products, whatsapp }) {
    try {
      const record = {
        farm_name: farm_name.trim(),
        location: location.trim(),
        products: products.trim(),
        whatsapp: whatsapp.trim(),
        status: 'pendiente'
      };

      const res = await this.fetchApi('producer_applications', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(record)
      });

      return (res && res.length > 0) ? res[0] : record;
    } catch (e) {
      console.error('Error enviando solicitud de productor:', e);
      throw e;
    }
  }

  /**
   * Sube un archivo a un bucket de Supabase Storage (por defecto 'avatars' o 'assets')
   */
  async uploadFile(bucket = 'avatars', path, file) {
    try {
      const cleanPath = path.replace(/^\/+/, '');
      const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${bucket}/${cleanPath}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        // Fallback al bucket 'assets' si 'avatars' no responde
        if (bucket === 'avatars') {
          return await this.uploadFile('assets', `avatars/${cleanPath}`, file);
        }
        throw new Error(`Error en subida de archivo (${response.status}): ${response.statusText}`);
      }

      const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${bucket}/${cleanPath}`;
      return { publicUrl, path: `${bucket}/${cleanPath}` };
    } catch (e) {
      console.error(`Error al subir archivo a bucket ${bucket}:`, e);
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

  // =========================================================================
  // ALMACENAMIENTO DE ASSETS (Supabase Storage & tabla 'assets')
  // =========================================================================

  /**
   * Convierte una ruta relativa de imagen o nombre de archivo en su URL pública en Supabase Storage
   * Ejemplo: 'assets/images/tomates.jpg' -> 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/images/tomates.jpg'
   * Ejemplo avatar: 'avatars/avatar_max.jpg' -> 'https://hvjqgvplbmshpucnuzfy.supabase.co/storage/v1/object/public/assets/avatars/avatar_max.jpg'
   */
  getPublicAssetUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Normalizar posibles rutas previas con duplicación errónea de images/avatars
      return path.replace('/assets/images/avatars/', '/assets/avatars/');
    }
    // Limpiar prefijo assets/ o /assets/ si está presente
    let cleanPath = path.replace(/^\/?assets\//, '').replace(/^\/+/, '');
    // Si no contiene subcarpeta (ej: 'tomates.jpg'), asumir 'images/'
    if (!cleanPath.includes('/')) {
      cleanPath = `images/${cleanPath}`;
    }
    return `${SUPABASE_CONFIG.url}/storage/v1/object/public/assets/${cleanPath}`;
  }

  /**
   * Obtiene la lista completa de todos los assets registrados en la base de datos
   */
  async getAssets() {
    try {
      return await this.fetchApi('assets?select=*&order=filename.asc');
    } catch (e) {
      console.error('Error al obtener catálogo de assets de Supabase:', e);
      return [];
    }
  }

  /**
   * Sube un archivo a Supabase Storage y lo registra en la tabla 'assets'
   */
  async uploadAsset(file, filename, folder = 'images') {
    try {
      const storagePath = folder ? `${folder}/${filename}` : filename;
      const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/assets/${storagePath}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        throw new Error(`Error subiendo asset: ${response.statusText}`);
      }

      // La URL pública directa en el bucket 'assets'
      const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/assets/${storagePath}`;

      // Registrar o actualizar en la tabla public.assets
      try {
        await this.fetchApi('assets', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            filename: filename,
            folder: folder || 'images',
            path: `assets/${storagePath}`,
            mime_type: file.type || 'image/jpeg',
            size_bytes: file.size || 0,
            public_url: publicUrl
          })
        });
      } catch (assetErr) {
        console.warn('Registro en tabla assets no crítico:', assetErr);
      }

      return publicUrl;
    } catch (e) {
      console.error(`Error al subir asset ${filename} a Supabase:`, e);
      throw e;
    }
  }
}

// Instancia global disponible en toda la aplicación
window.supabase = new SupabaseService();

