import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido(['data.js', 'core.js', 'charts.js', 'ui.js', 'actions.js', 'views-daily.js', 'sleep.js']);
const { U, S, Store } = N;
const A = N.actions;
N.UI.toast = () => {}; N.UI.closeSheet = () => {};
const realNow = Date.now;
after(() => { Date.now = realNow; });
const MIN = U.MIN, HOUR = U.HOUR, DAY = U.DAY;
const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('pausas y latencia', () => {
  withBaby(N, { birth: '2026-03-12' });
  const s = { id: 'n', babyId: 'b1', type: 'nap', start: at(2026, 9, 1, 9), end: at(2026, 9, 1, 10), down: at(2026, 9, 1, 8, 48), pauses: [{ a: at(2026, 9, 1, 9, 30), b: at(2026, 9, 1, 9, 40) }] };
  Store.state.sleeps = [s];
  assert.equal(S.sleepMin(s), 50);
  assert.equal(S.latency(s), 12);
  assert.equal(S.segments(s).length, 2);
  const d = S.sleepDay('2026-09-01');
  assert.equal(d.day, 50); assert.equal(d.blocks.length, 2, 'el patrón muestra el hueco de la pausa');
});

test('la noche: despertares con motivo y cómo volvió a dormirse', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = [
    { id: 'a', babyId: 'b1', type: 'night', start: at(2026, 9, 1, 19, 45), end: at(2026, 9, 2, 1, 0), down: at(2026, 9, 1, 19, 35), how: 'pecho' },
    { id: 'b', babyId: 'b1', type: 'night', start: at(2026, 9, 2, 1, 20), end: at(2026, 9, 2, 4, 0), after: { reason: 'hambre', soothe: 'pecho' } },
    { id: 'c', babyId: 'b1', type: 'night', start: at(2026, 9, 2, 4, 10), end: at(2026, 9, 2, 7, 0), after: { reason: 'consuelo', soothe: 'brazos' } }
  ];
  const n = S.nightOf('2026-09-01');
  assert.equal(n.wakes, 2); assert.equal(n.awake, 30); assert.equal(n.latency, 10); assert.equal(n.how, 'pecho');
  assert.deepEqual([...n.wakings].map((w) => `${w.reason}/${w.soothe}/${w.min}`), ['hambre/pecho/20', 'consuelo/brazos/10']);
  assert.equal(n.total, 315 + 160 + 170);
});

/* 7 días idénticos: despierta 7:00, siestas 9:00–10:00, 12:30–14:00, 16:30–17:00, cama 19:30 */
function regularWeek(now) {
  const out = [];
  for (let i = 7; i >= 1; i--) {
    const d = U.addDays(U.dayStart(now), -i), h = (x) => d + x * HOUR;
    out.push({ type: 'night', start: h(-4.5), end: h(7) }, { type: 'nap', start: h(9), end: h(10) }, { type: 'nap', start: h(12.5), end: h(14) }, { type: 'nap', start: h(16.5), end: h(17) });
  }
  return out;
}
const load = (list) => { Store.state.sleeps = list.map((s, i) => Object.assign({ id: 's' + i, babyId: 'b1' }, s)); Store.state.skips = []; };

test('presión de sueño: siesta corta acorta la siguiente ventana; larga la alarga', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = at(2026, 9, 26, 10, 0), d0 = U.dayStart(now);
  const base = regularWeek(now);
  // Hoy: noche normal y primera siesta de solo 25 min (lo habitual son 60)
  load([...base, { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }, { type: 'nap', start: d0 + 9 * HOUR, end: d0 + 9 * HOUR + 25 * MIN }]);
  const r = S.learnRhythm(now);
  let p = S.dayPlan(now);
  assert.equal(p.next.adj, Math.round(-35 / 2), 'la mitad del déficit de 35 min');
  assert.equal(p.next.window, r.windows[1] + Math.round(-35 / 2));
  assert.match(p.next.why, /corta/);
  assert.ok(p.next.from < p.next.start && p.next.to > p.next.start, 'se da como rango');
  // Primera siesta de 100 min → alarga, con tope del 15 %
  load([...base, { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }, { type: 'nap', start: d0 + 9 * HOUR, end: d0 + 10 * HOUR + 40 * MIN }]);
  p = S.dayPlan(at(2026, 9, 26, 11, 0));
  assert.equal(p.next.adj, Math.min(12, Math.round(0.15 * r.windows[1])));
});

test('una noche movida adelanta la primera siesta', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = at(2026, 9, 26, 7, 30), d0 = U.dayStart(now);
  // anoche: 4 despertares
  const night = [[-4.5, -2], [-1.7, 0.5], [0.8, 2.5], [2.8, 4.5], [4.8, 7]].map(([a, b], i) => ({ type: 'night', start: d0 + a * HOUR, end: d0 + b * HOUR, after: i ? { reason: 'dientes' } : undefined }));
  load([...regularWeek(now), ...night]);
  const r = S.learnRhythm(now);
  const p = S.dayPlan(now);
  assert.equal(p.next.idx, 0);
  assert.equal(p.next.adj, -Math.round(r.windows[0] * 0.1));
  assert.match(p.next.why, /noche/);
});

test('saltar una siesta recoloca el día', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = at(2026, 9, 26, 10, 30), d0 = U.dayStart(now);
  load([...regularWeek(now), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }]);
  const before = S.dayPlan(now);
  assert.equal(before.expectedToday, 3);
  Store.state.skips = [{ id: 'k', babyId: 'b1', date: U.dayKey(now), time: d0 + 10 * HOUR }];
  const p = S.dayPlan(now);
  assert.equal(p.expectedToday, 2);
  assert.deepEqual([...p.items].slice(0, 4).map((x) => `${x.kind}:${x.state}`), ['wake:done', 'nap:skipped', 'nap:overdue', 'nap:planned']);
  assert.ok(p.bed <= before.bed, 'con una siesta menos, a la cama antes');
  const r = p.rhythm;
  assert.equal(p.items[3].window, r.windows[2], 'la siesta que queda usa la ventana de la última posición');
});

test('cronómetro: a la cuna, dormida, despertar nocturno y buenos días', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = []; Store.state.feeds = []; Store.state.timers = {};
  let T = at(2026, 9, 10, 19, 30); Date.now = () => T;
  A['sleep-down']();
  assert.equal(S.activeSleep().phase, 'down');
  T += 12 * MIN; A['sleep-start']();
  A['sleep-how']({ dataset: { how: 'pecho' } });
  assert.equal(S.timerType(S.activeSleep()), 'night');
  T += 4 * HOUR; A['night-wake']();
  assert.ok(S.activeNightWake());
  A['nw-reason']({ dataset: { v: 'hambre' } }); A['nw-soothe']({ dataset: { v: 'pecho' } });
  T += 15 * MIN; A['nw-sleep']();
  assert.equal(Store.state.feeds.length, 1, 'la toma nocturna se anota');
  assert.equal(Store.state.feeds[0].sideUnknown, true);
  T += 7 * HOUR; A['sleep-stop']();
  const n = S.nightOf('2026-09-10');
  assert.equal(n.wakes, 1); assert.equal(n.latency, 12); assert.equal(n.how, 'pecho');
  assert.equal(n.wakings[0].reason, 'hambre'); assert.equal(n.wakings[0].min, 15);
  assert.equal(n.total, 4 * 60 + 7 * 60);
  assert.equal(S.activeSleep(), null);
  Date.now = realNow;
});

test('cronómetro de siesta con pausa', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = []; Store.state.timers = {};
  let T = at(2026, 9, 10, 12, 0); Date.now = () => T;
  A['sleep-start']();
  T += 30 * MIN; A['sleep-pause']();
  T += 6 * MIN; A['sleep-resume']();
  T += 40 * MIN; A['sleep-pause']();
  T += 10 * MIN; A['sleep-stop'](); // se despierta en la pausa: la siesta acaba al empezar la pausa
  const s = Store.state.sleeps[0];
  assert.equal(s.type, 'nap'); assert.equal(s.pauses.length, 1);
  assert.equal(S.sleepMin(s), 70);
  assert.equal(s.end, at(2026, 9, 10, 13, 16));
  Date.now = realNow;
});
