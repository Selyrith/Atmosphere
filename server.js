#!/usr/bin/env node
// Локальный сервер для разработки или Cloudflare-туннеля.
// ВАЖНО: Telegram Mini App требует HTTPS. Одного `npm start` недостаточно —
// нужен либо cloudflared-туннель, либо деплой на GitHub Pages.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav'
};

function safeJoin(root, urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); }
  catch (e) { return null; }
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = safeJoin(ROOT, urlPath);
  if (!filePath) { res.writeHead(403); return res.end('403'); }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err2, buf) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found: ' + urlPath);
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(buf);
    });
  });
});

function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name in nets) {
    for (const n of nets[name] || []) {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    }
  }
  return out;
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n  Порт ' + PORT + ' занят. Останови старый сервер или: PORT=8081 npm start\n');
    process.exit(1);
  }
  console.error(e); process.exit(1);
});

server.listen(PORT, HOST, () => {
  const ips = lanAddresses();
  console.log('');
  console.log('  Атмосфера запущена');
  console.log('  ───────────────────────────────────────────');
  console.log('  Локально:  http://localhost:' + PORT);
  for (const ip of ips) console.log('  По Wi-Fi:  http://' + ip + ':' + PORT);
  console.log('  ───────────────────────────────────────────');
  console.log('  Для Telegram Mini App нужен HTTPS:');
  console.log('    cloudflared tunnel --url http://localhost:' + PORT);
  console.log('  или деплой на GitHub Pages.');
  console.log('');
});
