const https = require('https');

const SUPABASE_CONFIG = {
  url: 'https://hvjqgvplbmshpucnuzfy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU'
};

async function fetchApi(endpoint, options = {}) {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }
  return response.json();
}

async function testNonExistentEmail() {
  console.log('\n--- Test 1: Correo Inexistente ---');
  const email = 'correo_totalmente_falso_12345@noexiste.com';
  const cleanEmail = email.trim().toLowerCase();
  const encodedEmail = encodeURIComponent(cleanEmail);

  const users = await fetchApi(`profiles?email=ilike.${encodedEmail}&select=id,full_name,email,username`);
  if (!users || users.length === 0) {
    console.log('✓ Correcto: No existe el usuario');
    const expectedMsg = 'No encontramos ninguna cuenta registrada con ese correo electrónico.';
    console.log('✓ Mensaje retornado:', expectedMsg);
  } else {
    console.error('X Error: El usuario falso apareció en la BD');
  }
}

async function testExistentEmailAndWebhook() {
  console.log('\n--- Test 2: Correo Existente y Webhook n8n ---');
  const email = 'max@vecinos.com';
  const cleanEmail = email.trim().toLowerCase();
  const encodedEmail = encodeURIComponent(cleanEmail);

  const users = await fetchApi(`profiles?email=ilike.${encodedEmail}&select=id,full_name,email,username`);
  if (users && users.length > 0) {
    const targetUser = users[0];
    console.log('✓ Usuario encontrado en Supabase:', targetUser);

    const token = 'test-token-' + Date.now();
    const resetUrl = `https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas/reset-password.html?token=${token}`;

    const payload = {
      email: targetUser.email,
      full_name: targetUser.full_name || targetUser.username || 'Usuario',
      token: token,
      reset_url: resetUrl
    };

    console.log('✓ Payload a enviar a n8n:', JSON.stringify(payload, null, 2));

    const webhookRes = await fetch('https://elmaxi.app.n8n.cloud/webhook/recuperar-contrasena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('✓ Respuesta de n8n Status:', webhookRes.status);
    const text = await webhookRes.text();
    console.log('✓ Respuesta de n8n Body:', text);
  } else {
    console.warn('Usuario de prueba no encontrado, buscando cualquier usuario para verificar...');
    const all = await fetchApi('profiles?select=id,email,full_name,username&limit=1');
    console.log('Primer usuario:', all[0]);
  }
}

async function run() {
  await testNonExistentEmail();
  await testExistentEmailAndWebhook();
}

run().catch(console.error);
