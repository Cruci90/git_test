import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido();
const { U, S, Store } = N;
const at = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} no está a ±${tol} de ${b}`);

test('edad en meses y días de calendario', () => {
  assert.deepEqual(pick(U.age('2026-03-12', at(2026, 9, 26))), { months: 6, days: 14 });
  // Nacido un 31: el mes siguiente sin día 31 no cuenta como mes cumplido.
  assert.deepEqual(pick(U.age('2026-01-31', at(2026, 2, 28))), { months: 0, days: 28 });
  assert.deepEqual(pick(U.age('2026-01-31', at(2026, 3, 31))), { months: 2, days: 0 });
  assert.equal(U.ageText('2026-03-12', at(2026, 9, 26)), '6 meses y 14 días');
  assert.equal(U.ageText('2026-09-20', at(2026, 9, 26)), '6 días');
  function pick(a) { return { months: a.months, days: a.days }; }
});

test('edad corregida en prematuros', () => {
  withBaby(N, { birth: '2026-01-01', gestWeeks: 32, gestDays: 0 });
  assert.equal(S.prematureDays(), 56, '8 semanas de corrección');
  const chrono = S.chronoMonths(at(2026, 7, 1)), corr = S.ageMonths(at(2026, 7, 1));
  near(chrono - corr, 56 / 30.4375, 1e-9, 'diferencia');
  assert.equal(S.dueDate(), '2026-02-26');
  assert.match(S.correctedText(at(2026, 2, 10)), /semanas? antes de su fecha prevista/);
  assert.equal(S.correctedText(at(2026, 7, 1)), U.ageText('2026-02-26', at(2026, 7, 1)));
  // A término (≥ 37 semanas) no se corrige
  withBaby(N, { birth: '2026-01-01', gestWeeks: 37, gestDays: 0 });
  assert.equal(S.prematureDays(), 0);
  assert.equal(S.correctedText(), '');
  // A partir de los 2 años tampoco
  withBaby(N, { birth: '2024-01-01', gestWeeks: 30 });
  assert.equal(S.ageMonths(at(2026, 6, 1)), S.chronoMonths(at(2026, 6, 1)));
});

test('percentiles OMS (método LMS)', () => {
  // La mediana es el percentil 50 en cualquier mes y medida
  for (const metric of ['weight', 'length', 'head']) for (const sex of ['f', 'm']) for (const m of [0, 3.5, 6, 12, 24]) {
    const [, M] = S.lms(metric, sex, m);
    near(S.percentile(metric, sex, m, M), 50, 0.01, `${metric} ${sex} ${m}m`);
  }
  // valueAtZ es la inversa de zscore
  for (const z of [-2, -1, 0, 1.5, 2]) near(S.zscore('weight', 'm', 9, S.valueAtZ('weight', 'm', 9, z)), z, 1e-9, `z=${z}`);
  // Tabla de puntuaciones z publicada por la OMS (peso niñas 12 m: −2 DE = 7,0 kg; +2 DE = 11,5 kg;
  // longitud niños 24 m: −2 DE = 81,7 cm; +2 DE = 93,9 cm)
  near(S.valueAtZ('weight', 'f', 12, -2), 7.0, 0.05, '−2 DE peso niñas 12 m');
  near(S.valueAtZ('weight', 'f', 12, 2), 11.5, 0.05, '+2 DE peso niñas 12 m');
  near(S.valueAtZ('length', 'm', 24, -2), 81.7, 0.1, '−2 DE longitud niños 24 m');
  near(S.valueAtZ('length', 'm', 24, 2), 93.9, 0.1, '+2 DE longitud niños 24 m');
  // Más peso, más percentil
  assert.ok(S.percentile('weight', 'f', 6, 8) > S.percentile('weight', 'f', 6, 7));
  // Φ: valores conocidos de la normal
  near(U.phi(0), 0.5, 1e-6, 'Φ(0)'); near(U.phi(1.96), 0.975, 1e-4, 'Φ(1.96)'); near(U.phi(-1.881), 0.03, 5e-4, 'Φ(-1.881)');
});

test('sueño: minutos por día recortados en la medianoche', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.sleeps = [
    { id: 'n', babyId: 'b1', type: 'night', start: at(2026, 9, 20, 20), end: at(2026, 9, 21, 7) },
    { id: 'a', babyId: 'b1', type: 'nap', start: at(2026, 9, 21, 9), end: at(2026, 9, 21, 10) }
  ];
  const d = S.sleepDay('2026-09-21');
  assert.equal(d.night, 7 * 60); assert.equal(d.day, 60); assert.equal(d.naps, 1);
  assert.equal(S.sleepDay('2026-09-20').night, 4 * 60);
  const n = S.nightOf('2026-09-20'); assert.equal(n.total, 11 * 60); assert.equal(n.wakes, 0);
});

test('plan del día: aprende ventanas y duraciones por posición', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = at(2026, 9, 26, 11, 0);
  // 7 días idénticos: despierta 7:00, siestas 9:00–10:00, 12:30–14:00, 16:30–17:00, cama 19:30
  const sleeps = [];
  for (let i = 7; i >= 1; i--) {
    const d = U.addDays(U.dayStart(now), -i), h = (x) => d + x * U.HOUR;
    sleeps.push({ type: 'night', start: h(-4.5), end: h(7) }, { type: 'nap', start: h(9), end: h(10) }, { type: 'nap', start: h(12.5), end: h(14) }, { type: 'nap', start: h(16.5), end: h(17) });
  }
  const d0 = U.dayStart(now);
  sleeps.push({ type: 'night', start: d0 - 4.5 * U.HOUR, end: d0 + 7 * U.HOUR }, { type: 'nap', start: d0 + 9 * U.HOUR, end: d0 + 10 * U.HOUR });
  Store.state.sleeps = sleeps.map((s, i) => Object.assign({ id: 's' + i, babyId: 'b1' }, s));

  const r = S.learnRhythm(now);
  assert.equal(r.expected, 3); assert.ok(r.learned);
  assert.deepEqual([...r.durations], [60, 90, 30]);
  // Ventanas reales 120, 150, 150 y 150 antes de la cama, mezcladas 70/30 con la tabla por edad,
  // que va de la ventana mínima (primera del día) a la máxima (antes de dormir).
  const [lo, hi] = [...r.norm.ww];
  near(r.windows[0], 0.7 * 120 + 0.3 * lo, 1, 'primera ventana');
  near(r.windows[3], 0.7 * 150 + 0.3 * hi, 1, 'ventana antes de dormir');
  assert.ok(r.windows[0] < r.windows[3], 'la vigilia se alarga a lo largo del día');

  const p = S.dayPlan(now);
  const kinds = [...p.items].map((x) => `${x.kind}:${x.state}`);
  assert.deepEqual(kinds, ['wake:done', 'nap:done', 'nap:planned', 'nap:planned', 'bed:planned']);
  near((p.next.start - (d0 + 10 * U.HOUR)) / U.MIN, r.windows[1], 0.5, 'siesta 2 = fin siesta 1 + ventana');
  const bh = new Date(p.bed).getHours() + new Date(p.bed).getMinutes() / 60;
  assert.ok(bh >= 18.5 && bh <= 21, `hora de dormir razonable: ${bh}`);

  // Si ya ha superado la ventana, la siesta toca "ahora"
  const late = S.dayPlan(d0 + 13.5 * U.HOUR);
  assert.equal(late.next.state, 'overdue'); assert.equal(late.next.start, d0 + 13.5 * U.HOUR);
});

test('BLW: estado de alimentos y alérgenos', () => {
  withBaby(N, { birth: '2026-03-12' });
  const day = (n) => U.addDays(Date.now(), -n);
  const meal = (n, foods) => ({ id: 'm' + n + foods[0].id, babyId: 'b1', time: day(n), foods });
  Store.state.meals = [
    meal(20, [{ id: 'huevo', liked: 1, reaction: 'none' }]), meal(18, [{ id: 'huevo', liked: 1, reaction: 'none' }]), meal(15, [{ id: 'huevo', liked: 0, reaction: 'none' }]),
    meal(3, [{ id: 'pan', liked: 1, reaction: 'none' }]), meal(2, [{ id: 'pasta', liked: 1, reaction: 'none' }]), meal(1, [{ id: 'pan', liked: 1, reaction: 'none' }]),
    meal(5, [{ id: 'fresa', liked: 0, reaction: 'mild' }]),
    meal(4, [{ id: 'yogur', liked: -1, reaction: 'none' }])
  ];
  const st = S.foodStats();
  assert.equal(st.huevo.tries, 3); assert.equal(st.huevo.status, 'liked');
  assert.equal(st.fresa.status, 'reaction'); assert.equal(st.yogur.status, 'disliked');
  const al = Object.fromEntries(S.allergenStatus(st).map((a) => [a.id, a]));
  assert.equal(al.huevo.state, 'maintain', '3 exposiciones y más de una semana sin ofrecerlo');
  assert.equal(al.gluten.state, 'done', 'pan + pasta cuentan para el gluten');
  assert.equal(al.leche.state, 'progress');
  assert.equal(al.pescado.state, 'pending');
});

test('los datos de ejemplo son coherentes', () => {
  N.seedDemo();
  const b = S.baby();
  assert.equal(U.age(b.birth).months, 6);
  assert.equal(S.prematureDays(), 0, 'Lucía nació a término (39+4)');
  assert.ok(S.sleeps().length > 80);
  assert.ok(Object.keys(S.foodStats()).length >= 25);
  for (const s of S.sleeps()) assert.ok(s.end > s.start, 'sueños con fin posterior al inicio');
  const p = S.dayPlan();
  assert.ok(p.items.length >= 3 && p.items[p.items.length - 1].kind === 'bed');
});
