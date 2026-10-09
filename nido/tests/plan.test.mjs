import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido(['data.js', 'core.js', 'ui.js', 'demo.js']);
const { U, S, Store } = N;
const MIN = U.MIN, HOUR = U.HOUR;
const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

function week(now, opts = {}) {
  const out = [];
  for (let i = 7; i >= 1; i--) {
    const d = U.addDays(U.dayStart(now), -i), h = (x) => d + x * HOUR;
    out.push({ type: 'night', start: h(-4.5), end: h(7) }, { type: 'nap', start: h(9), end: h(10) }, { type: 'nap', start: h(12.5), end: h(14) });
    const third = opts.third || [16.5, 17];
    out.push(Object.assign({ type: 'nap', start: h(third[0]), end: h(third[1]) }, opts.lastDown ? { down: h(third[0]) - opts.lastDown * MIN } : {}));
  }
  return out;
}
const setup = (list, prefs = {}) => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = list.map((s, i) => Object.assign({ id: 's' + i, babyId: 'b1' }, s));
  Store.state.skips = [];
  Store.state.sleepPrefs = { b1: prefs };
};

test('ajuste manual: suma minutos a cada ventana', () => {
  const now = at(2026, 9, 26, 7, 30), d0 = U.dayStart(now);
  const base = [...week(now), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }];
  setup(base);
  const a = S.dayPlan(now);
  setup(base, { shift: 20 });
  const b = S.dayPlan(now);
  assert.equal(b.next.window, a.next.window + 20);
  assert.match(b.next.tweaks.join(), /ajuste manual \+20/);
  assert.equal(b.items.at(-1).window, a.items.at(-1).window + 20);
});

test('horas fijas de despertar y de dormir', () => {
  const now = at(2026, 9, 26, 6, 0);
  setup(week(now), { wakeTarget: '07:30', bedTarget: '20:00' });
  const p = S.dayPlan(now);
  assert.equal(p.items[0].state, 'fixed');
  assert.equal(U.time(p.items[0].t), '07:30');
  const bed = p.items.at(-1);
  assert.equal(bed.state, 'fixed'); assert.equal(U.time(bed.t), '20:00');
  assert.ok(bed.natural, 'guarda la hora natural para comparar');
});

test('día difícil: ventanas más cortas y no se aprende de él', () => {
  const now = at(2026, 9, 26, 7, 30), d0 = U.dayStart(now);
  const base = [...week(now), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }];
  setup(base);
  const normal = S.dayPlan(now);
  setup(base, { hard: [{ from: '2026-09-26', to: null, reason: 'dientes' }] });
  const hard = S.dayPlan(now);
  assert.equal(hard.next.window, normal.next.window - Math.round(normal.rhythm.windows[0] * 0.15));
  assert.match(hard.next.tweaks.join(), /dientes/);
  // Un día raro marcado como difícil no cambia lo aprendido
  const odd = U.dayStart(at(2026, 9, 24)), weird = [...base, { type: 'nap', start: odd + 17.5 * HOUR, end: odd + 18 * HOUR }];
  setup(weird); const learnedWithOdd = S.learnRhythm(now).days;
  setup(weird, { hard: [{ from: '2026-09-24', to: '2026-09-24', reason: 'enfermedad' }] });
  assert.equal(S.learnRhythm(now).days, learnedWithOdd - 1);
  assert.equal(S.hardDay('2026-09-25'), null);
});

test('transición: detecta señales y alarga ventanas al elegir menos siestas', () => {
  const now = at(2026, 9, 26, 7, 30), d0 = U.dayStart(now);
  // Tercera siesta corta (20 min) y le cuesta dormirse (25 min)
  const base = [...week(now, { third: [16.5, 16.83], lastDown: 25 }), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }];
  setup(base);
  const tr = S.napTransition(now);
  assert.equal(tr.from, 3); assert.equal(tr.to, 2); assert.ok(tr.ready);
  assert.equal(tr.signals.length, 2);
  const before = S.learnRhythm(now);
  setup(base, { targetNaps: 2 });
  const after = S.learnRhythm(now);
  assert.equal(after.expected, 2); assert.ok(after.transition);
  assert.ok(after.windows[0] >= before.windows[0], 'ventanas más largas');
  assert.equal(S.dayPlan(now).expectedToday, 2);
  // Sin señales no propone nada
  setup([...week(now), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }]);
  assert.equal(S.napTransition(now).ready, false);
});

test('cambio de hora: fechas UE y plan gradual', () => {
  assert.deepEqual([...S.dstChanges(2026)].map((c) => c.date), ['2026-03-29', '2026-10-25']);
  assert.equal(S.dstChanges(2027)[0].date, '2027-03-28');
  const up = S.dstUpcoming(at(2026, 10, 20, 10));
  assert.equal(up.date, '2026-10-25'); assert.equal(up.dir, 'back'); assert.equal(up.days, 5);
  assert.deepEqual([...up.plan].map((p) => `${p.date}:${p.shift}`), ['2026-10-21:15', '2026-10-22:30', '2026-10-23:45', '2026-10-24:60']);
  assert.equal(S.dstUpcoming(at(2026, 10, 1)), null);
  assert.equal(S.dstUpcoming(at(2027, 3, 26)).plan[3].shift, -60, 'en primavera se adelanta');
  // Aplicado: ese día la hora de dormir se retrasa
  const now = at(2026, 10, 23, 7, 30), d0 = U.dayStart(now);
  const base = [...week(now), { type: 'night', start: d0 - 4.5 * HOUR, end: d0 + 7 * HOUR }];
  setup(base); const a = S.dayPlan(now);
  setup(base, { dst: { date: '2026-10-25', mode: 'gradual' } });
  assert.equal(S.dstShift('2026-10-23'), 45);
  const b = S.dayPlan(now);
  assert.ok(b.bed - a.bed >= 40 * MIN && b.bed - a.bed <= 50 * MIN, `la noche se retrasa ~45 min (${(b.bed - a.bed) / MIN})`);
});
