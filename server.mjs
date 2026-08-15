import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'src');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = createServer(async (req, res) => {
  const pathname = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(body); }
  catch { res.writeHead(404); res.end('Not found'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '0.0.0.0', () => console.log(`Runtime Codescape listening on ${port}`));
