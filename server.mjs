import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releases, analyze, analyzeTrace, compare } from './src/analysis.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT || 4180);
const send = (res, status, data, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' }); res.end(type.startsWith('application/json') ? JSON.stringify(data) : data); };
function staticFile(res, pathname) { const file = path.normalize(path.join(publicDir, pathname === '/' ? '/index.html' : pathname)); if (!file.startsWith(`${publicDir}${path.sep}`)) return send(res, 403, { error: 'forbidden' }); fs.readFile(file, (error, content) => error ? send(res, 404, { error: 'not-found' }) : send(res, 200, content, ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[path.extname(file)] || 'text/plain')); }
async function readBody(req) { let raw = ''; for await (const chunk of req) raw += chunk; if (raw.length > 500_000) throw new Error('payload-too-large'); return JSON.parse(raw || '{}'); }
const server = http.createServer(async (req, res) => { const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); try {
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, service: 'runtime-codescape', release: 'v2.5.0', backend: 'portable-json' });
  if (req.method === 'GET' && url.pathname === '/api/analysis') { const version = url.searchParams.get('release') || 'v2.5.0'; const item = releases[version]; if (!item) return send(res, 404, { error: 'unknown-release' }); return send(res, 200, { analysis: analyze(item), releases: Object.keys(releases), comparison: version === 'v2.5.0' ? compare(releases['v2.5.0'], releases['v2.4.3']) : compare(releases['v2.4.3'], releases['v2.4.3']) }); }
  if (req.method === 'POST' && url.pathname === '/api/analyze') { const input = await readBody(req); return send(res, 200, { analysis: analyze(analyzeTrace(input)), backend: 'portable-json', accepted: ['spans', 'metadata', 'files', 'tests'] }); }
  if (req.method === 'GET') return staticFile(res, url.pathname);
  return send(res, 405, { error: 'method-not-allowed' });
} catch (error) { return send(res, error.message === 'payload-too-large' ? 413 : 400, { error: error.message }); } });
server.listen(port, '0.0.0.0', () => console.log(`Runtime Codescape listening on ${port}`));
