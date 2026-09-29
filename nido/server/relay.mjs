/* ==========================================================================
   Nido · Servidor de sincronización (relé cifrado)
   Guarda y reenvía cambios cifrados de extremo a extremo. El servidor no
   tiene la clave: solo ve bloques opacos {iv, ct} numerados por familia.
   Sin dependencias: Node 18+.

   API (JSON, CORS abierto; la autorización va en la cabecera):
     GET    /v1/health
     POST   /v1/spaces/:space/ops            Authorization: Bearer <token>
            { ops: [{ iv, ct }] }         →  { first, last }
     GET    /v1/spaces/:space/ops?after=N[&limit=500][&wait=25]
                                          →  { ops: [{ seq, iv, ct }], last }
            wait=S espera hasta S segundos a que lleguen cambios (long‑poll).
     DELETE /v1/spaces/:space                borra los datos de la familia; su id queda
                                             cerrado (410) para los códigos antiguos

   La primera escritura en una familia registra la huella (SHA‑256) de su
   token; a partir de ahí solo quien tenga el token puede leer o escribir.

   Variables de entorno: PORT (8787), DATA_DIR (./data),
   MAX_OP_BYTES (4 MB), MAX_SPACE_BYTES (300 MB), ALLOW_ORIGIN (*).
   ========================================================================== */
import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const MAX_OP = Number(process.env.MAX_OP_BYTES || 4 * 1024 * 1024);
const MAX_SPACE = Number(process.env.MAX_SPACE_BYTES || 300 * 1024 * 1024);
const MAX_BODY = MAX_OP * 4;
const ORIGIN = process.env.ALLOW_ORIGIN || '*';
const SPACE_RE = /^[A-Za-z0-9_-]{16,64}$/;

const sha = (s) => createHash('sha256').update(s).digest('hex');
const spaces = new Map(); // id → { auth, ops: [{seq, iv, ct}], bytes, waiters: Set }

async function load(id) {
  if (spaces.has(id)) return spaces.get(id);
  const dir = path.join(DATA_DIR, id);
  const sp = { id, auth: null, ops: [], bytes: 0, waiters: new Set(), dir };
  try {
    sp.auth = (await fs.readFile(path.join(dir, 'auth'), 'utf8')).trim();
    if (sp.auth === 'deleted') { sp.deleted = true; spaces.set(id, sp); return sp; }
    const rl = readline.createInterface({ input: createReadStream(path.join(dir, 'ops.jsonl')), crlfDelay: Infinity });
    for await (const line of rl) { if (!line) continue; const op = JSON.parse(line); sp.ops.push(op); sp.bytes += line.length; }
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  spaces.set(id, sp);
  return sp;
}

function authorized(sp, req) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(req.headers.authorization || '');
  if (!m) return false;
  if (!sp.auth) return 'new';
  const a = Buffer.from(sha(m[1])), b = Buffer.from(sp.auth);
  return a.length === b.length && timingSafeEqual(a, b);
}

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(Object.assign(e, { code: 400 })); } });
    req.on('error', reject);
  });
}

// Límite simple por IP: 240 peticiones por minuto.
const hits = new Map();
setInterval(() => hits.clear(), 60000).unref();
const limited = (req) => { const ip = req.socket.remoteAddress; const n = (hits.get(ip) || 0) + 1; hits.set(ip, n); return n > 240; };

async function handle(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/v1/health') return send(res, 200, { ok: true, service: 'nido-relay', version: 1 });
  if (limited(req)) return send(res, 429, { error: 'Demasiadas peticiones' });

  const m = /^\/v1\/spaces\/([^/]+)(\/ops)?$/.exec(url.pathname);
  if (!m || !SPACE_RE.test(m[1])) return send(res, 404, { error: 'No encontrado' });
  const sp = await load(m[1]);
  // Una familia cerrada (o que cambió de clave) no se puede volver a usar.
  if (sp.deleted) return send(res, 410, { error: 'Esta familia se cerró o cambió de clave' });
  const auth = authorized(sp, req);
  if (!auth) return send(res, 401, { error: 'Token no válido' });

  if (m[2] && req.method === 'POST') {
    const body = await readBody(req);
    const ops = Array.isArray(body.ops) ? body.ops : [];
    if (!ops.length || ops.length > 500) return send(res, 400, { error: 'Entre 1 y 500 cambios por envío' });
    for (const op of ops) {
      if (typeof op.iv !== 'string' || typeof op.ct !== 'string' || op.iv.length > 32 || op.ct.length > MAX_OP) return send(res, 400, { error: 'Cambio mal formado o demasiado grande' });
    }
    const add = ops.reduce((n, o) => n + o.ct.length + 64, 0);
    if (sp.bytes + add > MAX_SPACE) return send(res, 507, { error: 'La familia ha llegado al límite de espacio' });
    if (auth === 'new') {
      await fs.mkdir(sp.dir, { recursive: true });
      sp.auth = sha(/^Bearer\s+(.+)$/.exec(req.headers.authorization)[1]);
      await fs.writeFile(path.join(sp.dir, 'auth'), sp.auth, { mode: 0o600 });
    }
    const first = sp.ops.length + 1;
    const lines = ops.map((o, i) => JSON.stringify({ seq: first + i, iv: o.iv, ct: o.ct, at: Date.now() }));
    await fs.appendFile(path.join(sp.dir, 'ops.jsonl'), lines.join('\n') + '\n');
    lines.forEach((l) => { sp.ops.push(JSON.parse(l)); sp.bytes += l.length; });
    sp.waiters.forEach((w) => w()); sp.waiters.clear();
    return send(res, 200, { first, last: sp.ops.length });
  }

  if (m[2] && req.method === 'GET') {
    if (auth === 'new') return send(res, 200, { ops: [], last: 0 });
    const after = Math.max(0, Number(url.searchParams.get('after')) || 0);
    const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit')) || 500));
    const wait = Math.min(30, Math.max(0, Number(url.searchParams.get('wait')) || 0));
    const reply = () => send(res, 200, { ops: sp.ops.slice(after, after + limit).map(({ seq, iv, ct }) => ({ seq, iv, ct })), last: sp.ops.length });
    if (sp.ops.length > after || !wait) return reply();
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); sp.waiters.delete(finish); reply(); };
    const timer = setTimeout(finish, wait * 1000);
    sp.waiters.add(finish);
    req.on('close', () => { done = true; clearTimeout(timer); sp.waiters.delete(finish); });
    return;
  }

  if (!m[2] && req.method === 'DELETE') {
    if (auth === 'new') return send(res, 200, { deleted: false });
    await fs.rm(path.join(sp.dir, 'ops.jsonl'), { force: true });
    await fs.writeFile(path.join(sp.dir, 'auth'), 'deleted');
    Object.assign(sp, { deleted: true, ops: [], bytes: 0, auth: 'deleted' });
    sp.waiters.forEach((w) => w()); sp.waiters.clear();
    return send(res, 200, { deleted: true });
  }
  return send(res, 405, { error: 'Método no permitido' });
}

export function createServer() {
  return http.createServer((req, res) => {
    handle(req, res).catch((e) => { if (!res.headersSent) send(res, e.code >= 400 && e.code < 600 ? e.code : 500, { error: e.code === 413 ? 'Demasiado grande' : 'Error del servidor' }); });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  createServer().listen(PORT, () => console.log(`Nido relay en http://localhost:${PORT} · datos en ${DATA_DIR}`));
}
