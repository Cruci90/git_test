import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNido, withBaby } from './load.mjs';

const N = loadNido(['data.js', 'core.js', 'ui.js', 'demo.js', 'blwplan.js', 'importers.js', 'reminders.js']);
const { U, S, Store } = N;
const DAY = U.DAY;
const meal = (daysAgo, ids, extra = {}) => ({ id: 'm' + Math.random(), babyId: 'b1', time: Date.now() - daysAgo * DAY, mealType: 'comida', foods: ids.map((id) => Object.assign({ id, amount: 2, liked: 1, reaction: 'none' }, extra[id])) });

test('hierro: hemo, vegetal y vitamina C', () => {
  assert.deepEqual({ ...S.mealIron({ foods: [{ id: 'pollo' }] }) }, { iron: true, heme: true, plant: false, vc: false, boosted: false });
  assert.equal(S.mealIron({ foods: [{ id: 'lentejas' }, { id: 'pimiento' }] }).boosted, true);
  assert.equal(S.mealIron({ foods: [{ id: 'platano' }] }).iron, false);
  withBaby(N, { birth: '2026-03-12' });
  Store.state.meals = [meal(1, ['pollo', 'calabacin']), meal(2, ['lentejas', 'fresa']), meal(3, ['platano'])];
  assert.deepEqual({ ...S.ironStats(7) }, { meals: 3, iron: 2, heme: 1, boosted: 1 });
});

test('volver a ofrecer: rechazados o apenas probados, sin reacciones', () => {
  withBaby(N, { birth: '2026-03-12' });
  Store.state.meals = [
    meal(5, ['brocoli', 'platano', 'fresa', 'kiwi'], { brocoli: { liked: -1 }, kiwi: { amount: 0, liked: 0 }, fresa: { liked: -1, reaction: 'mild' } }),
    meal(2, ['brocoli'], { brocoli: { liked: -1 } })
  ];
  const ids = [...S.retryFoods()].map((x) => x.id);
  assert.ok(ids.includes('brocoli') && ids.includes('kiwi'));
  assert.ok(!ids.includes('platano'), 'le gusta y lo come bien');
  assert.ok(!ids.includes('fresa'), 'con reacción: no se insiste, se consulta');
  assert.equal(ids[0], 'kiwi', 'primero el que hace más que no se ofrece');
});

test('plan semanal de BLW: reglas de seguridad y hierro', () => {
  N.seedDemo();
  const stats = S.foodStats();
  const plan = N.BlwPlan.build(N.BlwPlan.weekStart(), 1);
  assert.equal(plan.days.length, 7);
  const reacted = new Set(Object.keys(stats).filter((id) => stats[id].reaction !== 'none'));
  let meals = 0, iron = 0;
  plan.days.forEach((d) => {
    const items = d.meals.flatMap((m) => m.items);
    assert.ok(items.filter((x) => x.tag === 'new').length <= 1, `${d.date}: como mucho 1 alimento nuevo`);
    assert.ok(items.filter((x) => x.tag === 'allergen').length <= 1, `${d.date}: como mucho 1 alérgeno en introducción`);
    assert.ok(!items.some((x) => reacted.has(x.id)), `${d.date}: nada que haya dado reacción`);
    items.filter((x) => x.tag === 'new').forEach((x) => assert.ok(!N.FOOD_BY_ID[x.id].a, 'un alimento nuevo nunca es un alérgeno'));
    const al = d.meals[0].items.find((x) => x.tag === 'allergen');
    if (d.allergen) assert.ok(al, `${d.date}: el alérgeno va en la primera comida`);
    assert.notEqual(d.meals[d.meals.length - 1].type === 'cena' && d.meals[d.meals.length - 1].items.some((x) => x.tag === 'new'), true, 'nada nuevo en la cena');
    d.meals.forEach((m) => { meals++; if (m.iron.iron) iron++; });
  });
  assert.ok(iron / meals >= 0.9, `hierro en casi todas las comidas (${iron}/${meals})`);
  // El alérgeno en curso de la demo (pescado 2/3) se completa al principio de la semana.
  const inProgress = S.allergenStatus().find((a) => a.state === 'progress');
  if (inProgress) assert.equal(plan.days[0].allergen && plan.days[0].allergen.name, inProgress.name);
  // Determinista: misma semana y semilla, mismo plan; otra semilla, otro plan.
  assert.deepEqual(JSON.stringify(N.BlwPlan.build(plan.week, 1).days), JSON.stringify(plan.days));
  assert.notDeepEqual(JSON.stringify(N.BlwPlan.build(plan.week, 2).days), JSON.stringify(plan.days));
});

const CSV = `date,event_type,start,end,start_time,end_time,duration_min,skipped,comment,how_baby_slept,created_by
2026-09-01,BED_TIME,2026-09-01T19:30:00.000+02:00,,19:30,,,False,,,u1
2026-09-02,NIGHT_WAKING,2026-09-02T01:00:00.000+02:00,2026-09-02T01:20:00.000+02:00,01:00,01:20,20.0,False,,,u1
2026-09-02,NIGHT_WAKING,2026-09-02T04:00:00.000+02:00,2026-09-02T04:10:00.000+02:00,04:00,04:10,10.0,False,,,u1
2026-09-02,WOKE_UP,2026-09-02T07:00:00.000+02:00,,07:00,,,False,,,u1
2026-09-02,NAP,2026-09-02T09:15:00.000+02:00,2026-09-02T10:05:00.000+02:00,09:15,10:05,50.0,False,"cuna, bien",,u1
2026-09-02,NAP,2026-09-02T13:00:00.000+02:00,,13:00,,,True,,,u1
2026-09-02,NURSING,2026-09-02T07:05:00.000+02:00,2026-09-02T07:20:00.000+02:00,07:05,07:20,15.0,False,,,u1
2026-09-02,BOTTLE,2026-09-02T17:00:00.000+02:00,,17:00,,,False,120 ml leche materna,,u1
2026-09-02,MEDICINE,2026-09-02T08:00:00.000+02:00,,08:00,,,False,Vitamina D,,u1
2026-09-02,SOLIDS,2026-09-02T12:00:00.000+02:00,,12:00,,,False,,,u1`;

test('importar napper_events.csv', () => {
  withBaby(N, { birth: '2026-03-12' });
  const ev = N.Import.events(CSV);
  assert.equal(ev.length, 10);
  const res = N.Import.convert(ev);
  const night = res.out.sleeps.filter((s) => s.type === 'night');
  assert.equal(night.length, 3, 'la noche se parte en 3 tramos por los 2 despertares');
  assert.equal(night[0].start, Date.parse('2026-09-01T19:30:00+02:00'));
  assert.equal(night[1].start, Date.parse('2026-09-02T01:20:00+02:00'));
  assert.equal(night[2].end, Date.parse('2026-09-02T07:00:00+02:00'));
  assert.equal(res.out.sleeps.filter((s) => s.type === 'nap').length, 1, 'la siesta saltada no cuenta');
  assert.equal(res.out.feeds.length, 2);
  const bottle = res.out.feeds.find((f) => f.kind === 'bottle');
  assert.equal(bottle.ml, 120);
  const nursing = res.out.feeds.find((f) => f.kind === 'breast');
  assert.equal(nursing.durL + nursing.durR, 15); assert.equal(nursing.sideUnknown, true);
  assert.equal(res.out.meds[0].name, 'Vitamina D');
  assert.equal(res.skipped.unsupported.SOLIDS, 1);
  // Importar dos veces no duplica
  N.Import.apply(res);
  const again = N.Import.convert(N.Import.events(CSV));
  assert.equal(again.total, 0); assert.equal(again.skipped.dup, res.total);
  // El lado sin registrar no cuenta para sugerir el siguiente pecho
  assert.equal(S.lastBreastSide(), null);
});

test('importar all_events.json y CSV con comillas', () => {
  withBaby(N, { birth: '2026-03-12' });
  const json = JSON.stringify([{ category: 'NAP', start: '2026-09-03T09:00:00Z', end: '2026-09-03T10:00:00Z', comment: 'con "comillas"' }, { category: 'BOTTLE', start: '2026-09-03T12:00:00Z', amount: 90 }]);
  const r = N.Import.convert(N.Import.events(json));
  assert.equal(r.out.sleeps.length, 1); assert.equal(r.out.feeds[0].ml, 90);
  const rows = N.Import.parseCSV('a,b\n"x, y","dijo ""hola"""\n');
  assert.equal(rows[0].a, 'x, y'); assert.equal(rows[0].b, 'dijo "hola"');
  assert.throws(() => N.Import.events('nombre,apellido\nana,garcia'));
});

test('avisos: cita, dosis y marca de enviados', () => {
  withBaby(N, { birth: '2026-03-12' });
  const now = Date.now();
  const tomorrow = U.dayKey(now + DAY);
  Store.state.appointments = [{ id: 'a1', babyId: 'b1', date: tomorrow, time: '10:00', title: 'Revisión', questions: [], done: false }];
  Store.state.reminders = [{ id: 'r1', babyId: 'b1', at: now - 60000, title: 'Próxima dosis: Paracetamol' }];
  const list = [...N.Reminders.list(now - U.HOUR, 3 * DAY)];
  assert.ok(list.some((x) => x.key === 'appt:a1:1h'));
  assert.ok(list.some((x) => x.key === 'appt:a1:eve'));
  const fired = [];
  N.Reminders.fire = (it) => fired.push(it.key);
  N.Reminders.check(now);
  assert.ok(fired.includes('rem:r1'));
  N.Reminders.check(now + 1000);
  assert.equal(fired.filter((k) => k === 'rem:r1').length, 1, 'no se repite');
});
