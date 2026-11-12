/**
 * Raíz & Barrio - Cliente Supabase y Servicios de Base de Datos
 * Conexión directa a base de datos Supabase:
 * URL: https://hvjqgvplbmshpucnuzfy.supabase.co
 */

const SUPABASE_CONFIG = {
  url: 'https://hvjqgvplbmshpucnuzfy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU'
};

// =============================================================================
// CACHÉ EN MEMORIA Y SESSIONSTORAGE (TTL 5 minutos para pickup_nodes y categories)
// =============================================================================
const STATIC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getSessionDataCache(key) {
  try {
    const raw = sessionStorage.getItem(`rb_cache_${key}`);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (item && item.expiry && Date.now() < item.expiry) {
      return item.data;
    }
    sessionStorage.removeItem(`rb_cache_${key}`);
  } catch (e) {}
  return null;
}

function setSessionDataCache(key, data) {
  try {
    const item = {
      data,
      expiry: Date.now() + STATIC_CACHE_TTL_MS
    };
    sessionStorage.setItem(`rb_cache_${key}`, JSON.stringify(item));
  } catch (e) {}
}

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

    // Sub-módulo auth compatible con Supabase Auth (@supabase/supabase-js)
    // Centraliza la sesión en una única promesa compartida (window.__rbSessionPromise)
    this.auth = {
      getSession: async () => {
        if (window.__rbSessionPromise) {
          return window.__rbSessionPromise;
        }
        window.__rbSessionPromise = (async () => {
          try {
            const tokenInfo = typeof getSupabaseAuthTokenInfo === 'function' 
              ? getSupabaseAuthTokenInfo() 
              : null;
            if (!tokenInfo || !tokenInfo.session) {
              return { data: { session: null }, error: null };
            }
            const session = tokenInfo.session;
            if (session && session.expires_at && session.expires_at * 1000 < Date.now()) {
              if (typeof clearAllAuthTokens === 'function') clearAllAuthTokens();
              return { data: { session: null }, error: new Error('Session expired') };
            }
            return { data: { session }, error: null };
          } catch (err) {
            return { data: { session: null }, error: err };
          } finally {
            setTimeout(() => { window.__rbSessionPromise = null; }, 300);
          }
        })().catch(err => ({ data: { session: null }, error: err }));
        return window.__rbSessionPromise;
      },
      getUser: async () => {
        const res = await this.auth.getSession();
        return { data: { user: res.data?.session?.user || null }, error: res.error };
      },
      signOut: async () => {
        window.__rbSessionPromise = null;
        if (typeof clearAllAuthTokens === 'function') {
          clearAllAuthTokens();
        } else {
          localStorage.removeItem('rb_cached_profile');
          localStorage.removeItem('rb_current_user');
          localStorage.removeItem('raiz_user');
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && ((k.startsWith('sb-') && k.includes('auth-token')) || k === 'supabase.auth.token')) {
                keysToRemove.push(k);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
          } catch (_) {}
        }
        return { error: null };
      },
      onAuthStateChange: (callback) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };

    // Sub-módulo storage compatible con Supabase Storage (@supabase/supabase-js)
    this.storage = {
      from: (bucket = 'avatars') => {
        return {
          upload: async (path, file, options = {}) => {
            try {
              const cleanPath = path.replace(/^\/+/, '');
              let uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${bucket}/${cleanPath}`;
              let resp = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_CONFIG.anonKey,
                  'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                  'Content-Type': file.type || 'image/webp',
                  'x-upsert': 'true'
                },
                body: file
              });

              let usedBucket = bucket;
              let usedPath = cleanPath;

              // Fallback automático al bucket 'assets' con prefijo 'avatars/'
              if (!resp.ok) {
                usedBucket = 'assets';
                usedPath = bucket === 'assets' ? cleanPath : `avatars/${cleanPath}`;
                uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${usedBucket}/${usedPath}`;
                resp = await fetch(uploadUrl, {
                  method: 'POST',
                  headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Content-Type': file.type || 'image/webp',
                    'x-upsert': 'true'
                  },
                  body: file
                });
              }

              if (!resp.ok) {
                const errTxt = await resp.text().catch(() => '');
                return { data: null, error: new Error(`Error en storage.upload (${resp.status}): ${errTxt}`) };
              }

              return {
                data: {
                  path: usedPath,
                  fullPath: `${usedBucket}/${usedPath}`
                },
                error: null
              };
            } catch (err) {
              return { data: null, error: err };
            }
          },
          getPublicUrl: (path) => {
            const cleanPath = path.replace(/^\/+/, '');
            const targetPath = cleanPath.startsWith('avatars/') ? cleanPath : `avatars/${cleanPath}`;
            const pubUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/assets/${targetPath}`;
            return {
              data: {
                publicUrl: `${pubUrl}?t=${Date.now()}`
              }
            };
          }
        };
      }
    };
  }

  async fetchApi(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isCacheable = (method === 'GET') && 
      (endpoint.startsWith('pickup_nodes') || endpoint.startsWith('categories'));

    if (isCacheable) {
      const cached = getSessionDataCache(endpoint);
      if (cached !== null) {
        return cached;
      }
    }

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
    const result = text ? JSON.parse(text) : null;

    if (isCacheable && result) {
      setSessionDataCache(endpoint, result);
    }

    return result;
  }

  /**
   * Supabase Client Query Builder compatible con la sintaxis de @supabase/supabase-js:
   * const { data, error } = await supabase.from('pickup_nodes').select('*');
   */
  from(table) {
    const service = this;
    let selectedCols = '*';
    const queryParams = [];
    let method = 'GET';
    let bodyData = null;

    const builder = {
      select(cols = '*') {
        selectedCols = cols;
        return builder;
      },
      eq(col, val) {
        queryParams.push(`${col}=eq.${encodeURIComponent(val)}`);
        return builder;
      },
      order(col, options = {}) {
        const asc = (options && options.ascending === false) ? 'desc' : 'asc';
        queryParams.push(`order=${col}.${asc}`);
        return builder;
      },
      limit(n) {
        queryParams.push(`limit=${n}`);
        return builder;
      },
      insert(values) {
        method = 'POST';
        bodyData = values;
        return builder;
      },
      update(values) {
        method = 'PATCH';
        bodyData = values;
        return builder;
      },
      delete() {
        method = 'DELETE';
        return builder;
      },
      then(resolve, reject) {
        const qs = [];
        if (selectedCols && method === 'GET') qs.push(`select=${selectedCols}`);
        if (queryParams.length) qs.push(...queryParams);
        const endpoint = `${table}${qs.length ? '?' + qs.join('&') : ''}`;

        return service.fetchApi(endpoint, {
          method,
          body: bodyData ? JSON.stringify(bodyData) : undefined
        })
          .then(data => {
            const res = { data, error: null };
            if (resolve) resolve(res);
            return res;
          })
          .catch(error => {
            console.error(`Error en supabase.from('${table}'):`, error);
            const res = { data: null, error };
            if (resolve) resolve(res);
            return res;
          });
      }
    };

    return builder;
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
   * Obtiene todos los productos de la base de datos de forma limpia y directa sin joins inexistentes
   */
  async getProducts() {
    try {
      return await this.fetchApi('products?select=*&order=created_at.desc');
    } catch (e) {
      console.warn('Fallo consultando products con order=created_at.desc, reintentando con fallback:', e);
      try {
        return await this.fetchApi('products?select=*');
      } catch (e2) {
        console.error('Error al obtener productos de Supabase:', e2);
        return [];
      }
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
  // NODOS DE RECOGIDA (pickup_nodes)
  // =========================================================================

  /**
   * Obtiene los nodos de entrega activos con caché instantánea en sessionStorage
   */
  async getPickupNodes() {
    try {
      return await this.fetchApi('pickup_nodes?select=*&is_active=eq.true&order=created_at.asc');
    } catch (e) {
      console.warn('Error al obtener pickup_nodes de Supabase:', e);
      return [];
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

