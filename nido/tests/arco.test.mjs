import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido(['data.js', 'core.js', 'charts.js', 'ui.js', 'actions.js', 'views-daily.js', 'sleep.js', 'guide.js', 'demo.js', 'blwplan.js', 'reminders.js']);
const { U, S, Store, W } = N;
N.UI.toast = () => {};
const realNow = Date.now;
after(() => { Date.now = realNow; });
const MIN = U.MIN, HOUR = U.HOUR;
const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

test('arco: el sol va de la izquierda (despertar) a la derecha (dormir)', () => {
  const from = at(2026, 10, 10, 7), to = at(2026, 10, 10, 19);
  const pos = (now) => {
    const svg = N.Charts.arc({ from, to, now, marker: 'sun' });
    const [, x, y] = svg.match(/arc-sun" transform="translate\(([\d.]+),([\d.]+)\)/);
    return [Number(x), Number(y)];
  };
  const [x0, y0] = pos(from), [xm, ym] = pos(at(2026, 10, 10, 13)), [x1, y1] = pos(to);
  assert.ok(x0 < xm && xm < x1, 'avanza de izquierda a derecha');
  assert.ok(ym < y0 && ym < y1, 'a mitad del día está arriba');
  assert.ok(Math.abs(xm - 160) < 1);
  // Antes de despertar o después de la hora de dormir no se sale del arco
  assert.equal(pos(from - HOUR).join(), [x0, y0].join());
});

test('noche: tramos encadenados, despertares y hora prevista de despertar', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.timers = {};
  Store.state.sleeps = [
    { id: 'prev', babyId: 'b1', type: 'night', start: at(2026, 10, 9, 19, 30), end: at(2026, 10, 10, 7) },
    { id: 'a', babyId: 'b1', type: 'night', start: at(2026, 10, 10, 19, 20), end: at(2026, 10, 10, 23, 40) },
    { id: 'b', babyId: 'b1', type: 'night', start: at(2026, 10, 10, 23, 55), end: at(2026, 10, 11, 2, 10) }
  ];
  Date.now = () => at(2026, 10, 11, 3);
  Store.state.timers.sleep = { babyId: 'b1', phase: 'asleep', start: at(2026, 10, 11, 2, 30), type: 'night', pauses: [] };
  assert.equal(S.tonight().map((x) => x.id).join(), 'a,b');
  const wake = S.expectedWake(at(2026, 10, 10, 19, 20));
  assert.equal(U.dayKey(wake), '2026-10-11');
  const html = W.nightArc('');
  assert.equal((html.match(/arc-seg gap/g) || []).length, 2, 'dos despertares');
  assert.ok(html.includes('arc-moon'));
});

test('cronómetro olvidado: se detecta y se guarda con la hora elegida', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = [];
  const start = at(2026, 9, 29, 20);
  Date.now = () => at(2026, 10, 10, 22, 54);
  Store.state.timers = { sleep: { babyId: 'b1', phase: 'asleep', start, type: 'night', pauses: [] } };
  assert.ok(W.isStale(S.activeSleep()));
  assert.match(W.liveSleep(), /sin parar/);
  const end = at(2026, 9, 30, 7, 10);
  const doc = N._ctx.document, orig = doc.getElementById;
  doc.getElementById = () => ({ value: `${U.dayKey(end)}T${U.time(end)}` });
  N.actions['sleep-stop-at']();
  doc.getElementById = orig;
  assert.equal(S.activeSleep(), null);
  assert.equal(Store.state.sleeps[0].end, end);
  // Una noche normal no es un olvido
  Store.state.timers = { sleep: { babyId: 'b1', phase: 'asleep', start: Date.now() - 3 * HOUR, type: 'night', pauses: [] } };
  assert.ok(!W.isStale(S.activeSleep()));
});

test('demo: se marca como tocada al registrar algo', () => {
  N.seedDemo();
  assert.ok(Store.state.demoAt);
  assert.ok(!Store.state.demoTouched);
  Store.add('diapers', { time: Date.now(), kind: 'wet' });
  assert.equal(Store.state.demoTouched, true);
});
