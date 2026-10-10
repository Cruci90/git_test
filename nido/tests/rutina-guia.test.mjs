import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido(['data.js', 'core.js', 'charts.js', 'ui.js', 'actions.js', 'views-daily.js', 'sleep.js', 'guide.js', 'demo.js', 'blwplan.js', 'reminders.js']);
const { U, S, Store } = N;
const A = N.actions;
N.UI.toast = () => {}; N.UI.closeSheet = () => {};
const realNow = Date.now;
after(() => { Date.now = realNow; });
const MIN = U.MIN, HOUR = U.HOUR, DAY = U.DAY;
const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

test('tendencias: medias por semana y horas de acostarse pasada la medianoche', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = at(2026, 9, 30, 12); // miércoles
  const nights = [];
  // Semana del 21 sep: se acuesta a las 23:30 y a las 00:30 en días alternos → media 00:00
  for (let i = 0; i < 7; i++) {
    const d0 = at(2026, 9, 21 + i);
    const bed = d0 + (i % 2 ? 24.5 : 23.5) * HOUR;
    nights.push({ id: 'n' + i, babyId: 'b1', type: 'night', start: bed, end: d0 + 31 * HOUR });
  }
  // Un registro anterior: el primer día con datos (a medias) no cuenta.
  nights.push({ id: 'prev', babyId: 'b1', type: 'nap', start: at(2026, 9, 19, 13), end: at(2026, 9, 19, 14) });
  Store.state.sleeps = nights;
  const w = S.sleepWeeks(2, now);
  assert.equal(w[0].start, '2026-09-21');
  assert.equal(w[0].nights, 7);
  assert.ok(Math.abs(w[0].bed - 0) < 5 || Math.abs(w[0].bed - 1440) < 5, `media 00:00, no 12:00 (${w[0].bed})`);
  assert.equal(Math.round(w[0].wake), 7 * 60);
  // La semana en curso solo cuenta días ya terminados: una noche de hoy no entra todavía.
  Store.state.sleeps.push({ id: 'hoy', babyId: 'b1', type: 'night', start: at(2026, 9, 30, 20), end: at(2026, 10, 1, 7) });
  Store.state.sleeps.push({ id: 'lun', babyId: 'b1', type: 'night', start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 7) });
  assert.equal(S.sleepWeeks(2, now)[1].nights, 1);
  // Sin datos anteriores, el primer día queda fuera.
  Store.state.sleeps = Store.state.sleeps.filter((x) => x.id !== 'prev');
  assert.equal(S.sleepWeeks(2, now)[0].nights, 6);
});

test('rutina: pasos, actividades anotadas y sueño marcado con rutina', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = []; Store.state.activities = []; Store.state.timers = {};
  let T = at(2026, 9, 10, 18, 50); Date.now = () => T;
  assert.equal(S.routineTotal(), 45);
  A['routine-start']();
  T += 12 * MIN; A['routine-next'](); // baño 12 min
  T += 5 * MIN; A['routine-next'](); // masaje
  T += 4 * MIN; A['routine-finish'](); // termina en el pijama: el resto se salta
  assert.equal(S.activeRoutine(), null);
  const kinds = [...Store.state.activities].map((a) => `${a.kind}:${a.dur}`);
  assert.deepEqual(kinds, ['bath:12', 'massage:5']);
  const t = S.activeSleep();
  assert.equal(t.phase, 'down'); assert.equal(t.routine, true);
  T += 8 * MIN; A['sleep-start']();
  T += 3 * HOUR; A['sleep-stop']();
  const s = Store.state.sleeps[0];
  assert.equal(s.routine, true); assert.equal(S.latency(s), 8);
  // Rutina editada
  S.prefs().routine = [{ id: 'bano', on: false, min: 10 }, { id: 'cuento', on: true, min: 10 }, { id: 'c_x', name: 'Dientes', on: true, min: 3 }];
  assert.equal(S.routineTotal(), 13);
  assert.deepEqual([...S.routine()].map((x) => x.name), ['Cuento', 'Dientes']);
  Date.now = realNow;
});

test('aviso de rutina antes de la hora de dormir', () => {
  N.seedDemo();
  delete Store.state.timers.sleep;
  const bed = S.dayPlan().bed;
  const list = [...N.Reminders.list(Date.now() - 12 * HOUR, DAY)];
  const r = list.find((x) => x.kind === 'routine');
  if (bed > Date.now()) { assert.ok(r); assert.equal(r.at, bed - S.routineTotal() * MIN); }
});

test('guía: fichas según la edad y lo que está pasando', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = []; Store.state.skips = [];
  let ids = [...S.guideFor(at(2026, 9, 26, 12))].map((x) => x.a.id);
  assert.ok(ids.includes('seguro') && !ids.includes('dos-una'), 'a los 6 meses: sueño seguro sí, paso a 1 siesta no');
  // Dientes
  S.prefs().hard = [{ from: U.today(), to: null, reason: 'dientes' }];
  assert.equal(S.guideFor()[0].a.id, 'dientes');
  S.prefs().hard = [];
  // Cambio de hora
  const g = [...S.guideFor(at(2026, 10, 20, 12))];
  assert.equal(g[0].a.id, 'cambio-hora'); assert.match(g[0].why, /5 días/);
  // Transición detectada en la demo
  N.seedDemo();
  assert.equal(S.guideFor()[0].a.id, 'tres-dos');
});
