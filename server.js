const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/login' || reqPath === '/login/' || reqPath === '/login.html') {
    res.writeHead(302, {
      'Location': 'https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas/mercado.html?openAuth=1'
    });
    res.end();
    return;
  } else if (reqPath === '/verify-email' || reqPath === '/verify-email/' || reqPath === '/verify-email.html') {
    // Redirigir de inmediato a la página de perfil en GitHub Pages con los parámetros del token
    const searchParams = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.writeHead(302, {
      'Location': `https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas/perfil.html${searchParams}`
    });
    res.end();
    return;
  }

  const filePath = path.join(__dirname, reqPath);

  // Seguridad básica: evitar directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 No Encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor local activo en http://localhost:${PORT}`);
});

