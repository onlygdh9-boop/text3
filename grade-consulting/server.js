import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/main.js', ['main.js', 'text/javascript; charset=utf-8']],
  ['/payload0.js', ['payload0.js', 'text/javascript; charset=utf-8']],
  ['/payload1.js', ['payload1.js', 'text/javascript; charset=utf-8']],
  ['/payload2.js', ['payload2.js', 'text/javascript; charset=utf-8']]
]);

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Method Not Allowed');
  }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const item = files.get(pathname);
  if (!item) {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Not Found');
  }
  const [name, type] = item;
  const body = fs.readFileSync(path.join(root, name));
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'none'; connect-src 'none'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'"
  });
  if (req.method === 'HEAD') return res.end();
  res.end(body);
}).listen(port, '0.0.0.0', () => {
  console.log('Grade consulting static app listening on', port);
});
