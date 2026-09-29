import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadNido, withBaby } from './load.mjs';

const FILES = ['data.js', 'core.js', 'ui.js', 'demo.js', 'sync.js'];
let server, base, dir;

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'nido-relay-'));
  process.env.DATA_DIR = dir;
  const { createServer } = await import('../server/relay.mjs?' + Date.now());
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

const device = () => { const N = loadNido(FILES); N.Sync.autoRun = false; return N; };

test('dos dispositivos: crear, unirse, cambios, borrados y conflictos', async () => {
  const A = device(), B = device();
  A.seedDemo();
  const code = await A.Sync.create(base);
  assert.match(code, /^http:\/\/127\.0\.0\.1:\d+#nido1\.[\w-]{22}\.[\w-]{43}$/);

  // B tenía otro bebé; al unirse adopta los datos de la familia.
  withBaby(B, { birth: '2025-01-01', name: 'Otro' });
  await B.Sync.join(code, 'replace');
  assert.deepEqual([...B.Store.state.babies].map((b) => b.name), ['Lucía']);
  assert.equal(B.Store.state.activeBabyId, 'lucia');
  for (const col of ['sleeps', 'feeds', 'meals', 'measures', 'appointments', 'activities']) assert.equal(B.Store.state[col].length, A.Store.state[col].length, col);
  assert.deepEqual({ ...B.Store.state.milestones.lucia }, { ...A.Store.state.milestones.lucia });

  // B añade una toma → A la recibe con quién la registró
  B.Store.state.settings.caregiver = 'Papá';
  const feed = B.Store.add('feeds', { time: Date.now(), kind: 'bottle', ml: 150, milk: 'materna' });
  await B.Sync.push();
  assert.equal(await A.Sync.pull(), 1);
  const got = A.Store.get('feeds', feed.id);
  assert.equal(got.ml, 150); assert.equal(got.by, 'Papá');

  // A borra un pañal → desaparece en B
  const dp = A.Store.state.diapers[0].id;
  A.Store.remove('diapers', dp);
  await A.Sync.push(); await B.Sync.pull();
  assert.equal(B.Store.get('diapers', dp), undefined);

  // Conflicto: los dos editan la misma medida; gana el cambio más reciente.
  const m = A.Store.state.measures[1].id;
  A.Store.update('measures', m, { note: 'de A' });
  await A.Sync.push();
  await new Promise((r) => setTimeout(r, 5));
  B.Store.update('measures', m, { note: 'de B (más tarde)' });
  await B.Sync.push();
  await A.Sync.pull(); await B.Sync.pull();
  assert.equal(A.Store.get('measures', m).note, 'de B (más tarde)');
  assert.equal(B.Store.get('measures', m).note, 'de B (más tarde)');

  // Cronómetro compartido: si B pone a dormir a la bebé, A lo ve.
  B.Store.state.timers.sleep = { babyId: 'lucia', start: Date.now() };
  B.Store.commit(); await B.Sync.push(); await A.Sync.pull();
  assert.ok(A.S.activeSleep());

  // Sin cambios no se envía nada
  assert.equal(await A.Sync.push(), 0);
});

test('el servidor solo guarda datos cifrados y exige el token', async () => {
  const space = readdirSync(dir)[0];
  const raw = readFileSync(path.join(dir, space, 'ops.jsonl'), 'utf8');
  for (const word of ['Lucía', 'Marta', 'Delicias', 'sleeps', 'babies', 'lucia']) assert.ok(!raw.includes(word), `el servidor no debe ver "${word}"`);
  assert.ok(!readFileSync(path.join(dir, space, 'auth'), 'utf8').includes('nido'));
  let res = await fetch(`${base}/v1/spaces/${space}/ops?after=0`, { headers: { Authorization: 'Bearer ' + 'x'.repeat(43) } });
  assert.equal(res.status, 401);
  res = await fetch(`${base}/v1/spaces/${space}/ops?after=0`);
  assert.equal(res.status, 401);
  res = await fetch(`${base}/v1/health`); assert.equal((await res.json()).service, 'nido-relay');
});

test('cambiar la clave deja fuera el código anterior', async () => {
  const A = device(), B = device();
  withBaby(A, { birth: '2026-01-01', name: 'Leo' });
  const code1 = await A.Sync.create(base);
  await B.Sync.join(code1);
  const code2 = await A.Sync.rotate();
  assert.notEqual(code1, code2);
  await assert.rejects(B.Sync.pull(), (e) => e.status === 410);
  const C = device(); await C.Sync.join(code2);
  assert.equal(C.Store.state.babies[0].name, 'Leo');
  assert.throws(() => { if (!A.Sync.parseInvite('hola')) throw new Error('inválido'); });
});
