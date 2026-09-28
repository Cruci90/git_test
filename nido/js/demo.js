/* ==========================================================================
   Nido · Datos de ejemplo
   Genera tres semanas realistas de una bebé de 6 meses y medio que acaba de
   empezar con BLW. Todas las fechas son relativas a hoy, así que la demo
   siempre parece recién usada.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store } = N;
  const { MIN, HOUR, DAY } = U;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  N.seedDemo = function () {
    const r = rng(20260312);
    const jit = (m) => (r() * 2 - 1) * m * MIN;
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const now = Date.now();
    const today0 = U.dayStart(now);

    const birthD = new Date(today0); birthD.setMonth(birthD.getMonth() - 6); birthD.setDate(birthD.getDate() - 14);
    const birth = U.dayKey(birthD.getTime());
    const at = (months, days = 0) => { const d = new Date(birthD); d.setMonth(d.getMonth() + months); d.setDate(d.getDate() + days); return d.getTime(); };

    const babyId = 'lucia';
    const st = {
      version: 1, activeBabyId: babyId,
      settings: { theme: 'auto', caregiver: 'Mamá' },
      babies: [{ id: babyId, name: 'Lucía', sex: 'f', birth, birthTime: '04:37', gestWeeks: 39, gestDays: 4, birthWeight: 3.28, birthLength: 50, birthHead: 34, blood: 'A+', allergies: '', pediatrician: 'Dra. Marta Ruiz', center: 'Centro de Salud Delicias', healthCard: 'MRUIZ 1203 4478 90', notes: 'Parto vaginal, semana 39+4. Lactancia materna exclusiva hasta los 6 meses.' }],
      milestones: {}, teeth: {}, timers: {},
      sleeps: [], feeds: [], diapers: [], meals: [], measures: [], appointments: [], vaccines: [], meds: [], temps: [], diary: [], events: [], pumps: []
    };
    const add = (col, rec) => st[col].push(Object.assign({ id: U.uid() + st[col].length, babyId, by: r() < 0.7 ? 'Mamá' : 'Papá' }, rec));

    /* ---------- Sueño, tomas y pañales: 21 días hasta ahora ---------- */
    const DAYS = 21;
    let side = 'L';
    const breast = (t, night) => {
      const a = Math.round(5 + r() * (night ? 7 : 10)), b = Math.round(r() < 0.25 ? 0 : 4 + r() * 9);
      const first = side; side = side === 'L' ? 'R' : 'L';
      const rec = { time: t, kind: 'breast', durL: first === 'L' ? a : b, durR: first === 'R' ? a : b, lastSide: b ? (first === 'L' ? 'R' : 'L') : first };
      if (t < now) add('feeds', rec);
    };
    for (let d = -DAYS; d <= 0; d++) {
      const day0 = today0 + d * DAY;
      // Mañana: despertar
      let wake = day0 + 7 * HOUR + jit(25);
      breast(wake + 5 * MIN);
      const naps = [[120, 55, 20], [135, 85, 25], [140, 38, 10]];
      let cur = wake;
      naps.forEach(([ww, dur, dj], i) => {
        const s = cur + ww * MIN + jit(15), e = s + dur * MIN + jit(dj);
        if (s <= now && e > now) st.timers.sleep = { babyId, start: s }; // siesta en curso
        if (e < now) add('sleeps', { start: s, end: e, type: 'nap', place: i === 2 && r() < 0.5 ? 'Carrito' : pick(['Cuna', 'Cuna', 'Brazos', 'Cuna']), quality: pick([2, 3, 3]) });
        breast(s - 10 * MIN);
        cur = e;
      });
      // Tarde: toma extra, baño y noche
      breast(cur + 70 * MIN);
      const bed = cur + 150 * MIN + jit(12);
      breast(bed - 20 * MIN);
      const nextWake = day0 + DAY + 7 * HOUR + jit(25);
      const wakesN = r() < 0.35 ? 1 : r() < 0.8 ? 2 : 3;
      const pts = [bed];
      for (let i = 1; i <= wakesN; i++) pts.push(bed + (nextWake - bed) * (i / (wakesN + 1)) + jit(40));
      pts.push(nextWake);
      for (let i = 0; i < pts.length - 1; i++) {
        const s = i === 0 ? pts[0] : pts[i] + (12 + r() * 18) * MIN;
        const e = pts[i + 1];
        if (s <= now && e > now) st.timers.sleep = { babyId, start: s }; // noche en curso
        if (e < now) add('sleeps', { start: s, end: e, type: 'night', place: pick(['Cuna', 'Cuna', 'Colecho']), quality: 3 });
        if (i > 0) breast(pts[i] + 2 * MIN, true);
      }
      // Pañales
      const nd = 5 + Math.floor(r() * 3);
      for (let i = 0; i < nd; i++) {
        const t = wake + (i / nd) * 13 * HOUR + jit(30);
        const k = r(); const kind = k < 0.55 ? 'wet' : k < 0.8 ? 'mixed' : 'dirty';
        if (t < now) add('diapers', { time: t, kind, color: kind === 'wet' ? null : pick(['amarillo', 'amarillo', 'marron']) });
      }
      // Leche extraída en biberón algunos días (Papá)
      if (r() < 0.3) { const t = day0 + 17.5 * HOUR; if (t < now) st.feeds.push({ id: U.uid() + 'b' + d, babyId, by: 'Papá', time: t, kind: 'bottle', ml: pick([90, 120, 120, 150]), milk: 'materna' }); }
      // Vitamina D cada mañana
      const vd = wake + 40 * MIN; if (vd < now) add('meds', { time: vd, name: 'Vitamina D', dose: 400, unit: 'UI', reason: 'Suplemento diario' });
    }
    // Extracciones
    for (let d = -10; d <= -1; d += 2) add('pumps', { time: today0 + d * DAY + 10.5 * HOUR, ml: 80 + Math.round(r() * 60), side: 'B' });

    /* ---------- BLW: desde los 6 meses ---------- */
    const blwStart = U.dayStart(at(6));
    const plan = [
      [['aguacate', 2, 1]],
      [['platano', 2, 1], ['boniato', 1, 0]],
      [['brocoli', 1, 0], ['pera', 2, 1]],
      [['huevo', 1, 0], ['calabacin', 1, 0], ['aguacate', 3, 1]],
      [['huevo', 2, 1], ['pollo', 1, 0], ['zanahoria', 2, 1]],
      [['platano', 3, 1], ['avena', 2, 1], ['huevo', 2, 1]],
      [['yogur', 2, 1], ['fresa', 1, 0, 'mild'], ['arroz', 1, 0]],
      [['merluza', 2, 1], ['patata', 2, 0], ['judia_verde', 1, -1]],
      [['pan', 1, 1], ['aguacate', 3, 1], ['mango', 3, 1]],
      [['cacahuete', 1, 0], ['platano', 3, 1], ['brocoli', 1, -1]],
      [['lentejas', 2, 1], ['calabaza', 3, 1], ['pan', 2, 1]],
      [['cacahuete', 2, 1], ['yogur', 3, 1], ['pera', 2, 0]],
      [['salmon', 2, 1], ['boniato', 3, 1], ['pan', 2, 0]],
      [['cacahuete', 2, 1], ['avena', 3, 1], ['sandia', 2, 1]],
      [['ternera', 1, 0], ['pimiento', 1, -1], ['melon', 2, 1]],
      [['merluza', 2, 1], ['yogur', 2, 1], ['kiwi', 1, 0]]
    ];
    const secondMeal = [
      [['platano', 2, 1]], [['pera', 2, 1], ['yogur', 2, 1]], [['mango', 2, 1]], [['avena', 2, 1], ['arandanos', 1, 0]],
      [['queso_fresco', 2, 1], ['tomate', 1, 0]], [['huevo', 3, 1], ['aguacate', 2, 1]], [['melocoton', 2, 1]]
    ];
    const notes = ['Mucho interés, se lo lleva todo a la boca', 'Arcada al principio, se resolvió sola', 'Muy concentrada', 'Tiró casi todo al suelo', 'Primera vez con cuchara precargada', ''];
    for (let i = 0; i < plan.length; i++) {
      const day0 = blwStart + i * DAY;
      if (day0 > today0) break;
      const t = day0 + 13 * HOUR + jit(20);
      if (t < now) add('meals', {
        time: t, mealType: 'comida',
        foods: plan[i].map(([id, amount, liked, reaction]) => ({ id, amount, liked, reaction: reaction || 'none' })),
        gag: i < 6 && r() < 0.5, choke: false, note: i === 6 ? 'Rojez alrededor de la boca tras la fresa. Desapareció en 30 min.' : pick(notes)
      });
      if (i >= 5) {
        const m = secondMeal[(i - 5) % secondMeal.length];
        const t2 = day0 + 17 * HOUR + jit(20);
        if (t2 < now) add('meals', { time: t2, mealType: 'merienda', foods: m.map(([id, amount, liked]) => ({ id, amount, liked, reaction: 'none' })), gag: false, choke: false, note: '' });
      }
    }

    /* ---------- Crecimiento ---------- */
    Store.state = st; // S.* necesita el estado para calcular percentiles
    const points = [[0, 0, 0.02, 0.0, 0.0], [0, 15, -0.25, 0.1, 0.05], [1, 0, 0.05, 0.25, 0.1], [2, 0, 0.25, 0.35, 0.15], [4, 0, 0.4, 0.4, 0.2], [6, 2, 0.45, 0.5, 0.25]];
    points.forEach(([m, dd, zw, zl, zh], i) => {
      const t = at(m, dd); const age = U.age(birth, t).decimal;
      add('measures', {
        date: U.dayKey(t),
        weight: i === 0 ? 3.28 : +S.valueAtZ('weight', 'f', age, zw).toFixed(2),
        length: i === 0 ? 50 : +S.valueAtZ('length', 'f', age, zl).toFixed(1),
        head: i === 0 ? 34 : +S.valueAtZ('head', 'f', age, zh).toFixed(1),
        note: i === 0 ? 'Al nacer' : i === 1 ? 'Recuperado el peso de nacimiento' : ''
      });
    });
    // Peso en farmacia hace unos días
    add('measures', { date: U.dayKey(today0 - 3 * DAY), weight: +S.valueAtZ('weight', 'f', U.age(birth, today0 - 3 * DAY).decimal, 0.47).toFixed(2), note: 'Báscula de farmacia, con body' });

    /* ---------- Citas y vacunas ---------- */
    const center = 'Centro de Salud Delicias';
    const past = [
      [at(0, 4), '09:30', 'Primera visita', 'revision', 'Prueba del talón hecha. Ictericia leve, vigilar.'],
      [at(0, 15), '10:00', 'Revisión 15 días', 'revision', 'Ha recuperado peso de nacimiento.'],
      [at(1), '09:45', 'Revisión 1 mes', 'revision', 'Todo bien. Iniciar vitamina D 400 UI/día.'],
      [at(2), '11:00', 'Revisión 2 meses + vacunas', 'vacuna', 'Vacunas bien toleradas.'],
      [at(4), '10:30', 'Revisión 4 meses + vacunas', 'vacuna', 'Febrícula por la noche (37,9 ºC). Paracetamol una dosis.'],
      [at(6, 2), '09:15', 'Revisión 6 meses', 'revision', 'Inicio de alimentación complementaria con BLW. Introducir alérgenos de uno en uno.']
    ];
    past.forEach(([t, time, title, type, outcome]) => add('appointments', { date: U.dayKey(t), time, title, type, place: center, doctor: 'Dra. Marta Ruiz', done: true, outcome, questions: [] }));
    add('appointments', {
      date: U.dayKey(today0 + 4 * DAY), time: '12:40', title: 'Pediatría · piel seca en mejillas', type: 'especialista', place: center, doctor: 'Dra. Marta Ruiz', done: false, outcome: '',
      questions: [{ text: '¿La rojez con la fresa puede ser alergia o solo contacto?', done: false }, { text: '¿Qué crema usar para las mejillas?', done: false }, { text: '¿Cuándo pasar de 3 a 2 siestas?', done: false }]
    });
    add('appointments', { date: U.dayKey(today0 + 12 * DAY), time: '10:15', title: 'Vacuna de la gripe', type: 'vacuna', place: center, doctor: 'Enfermería · Pablo', done: false, outcome: '', questions: [{ text: 'Llevar cartilla de vacunación', done: true }] });
    add('appointments', { date: U.dayKey(at(9)), time: '09:30', title: 'Revisión 9 meses', type: 'revision', place: center, doctor: 'Dra. Marta Ruiz', done: false, outcome: '', questions: [] });

    add('vaccines', { code: 'vrs', date: U.dayKey(at(0, 1)), lot: 'NV2291', note: 'En el hospital' });
    ['hexa1', 'vnc1', 'menb1', 'rota1'].forEach((c) => add('vaccines', { code: c, date: U.dayKey(at(2)), lot: '', note: '' }));
    ['hexa2', 'vnc2', 'menb2', 'menc1', 'rota2'].forEach((c) => add('vaccines', { code: c, date: U.dayKey(at(4)), lot: '', note: '' }));
    add('temps', { time: at(4) + 22 * HOUR, value: 37.9, method: 'Axilar' });
    add('meds', { time: at(4) + 22 * HOUR + 10 * MIN, name: 'Paracetamol 100 mg/ml', dose: 0.8, unit: 'ml', reason: 'Febrícula tras vacunas' });

    /* ---------- Hitos, dientes y diario ---------- */
    const ms = { mira: at(0, 20), sonrisa: at(1, 12), gorjeo: at(2, 10), cabeza: at(3), manos: at(3, 5), risa: at(3, 18), agarra: at(4), volteo: at(4, 24), sentado_apoyo: at(5, 16), balbuceo: at(6, 8) };
    st.milestones[babyId] = Object.fromEntries(Object.entries(ms).map(([k, t]) => [k, U.dayKey(t)]));
    st.teeth[babyId] = { 81: U.dayKey(at(6, 6)) };

    const diary = [
      [at(1, 12), 'feliz', 'Primera sonrisa de verdad, mirándonos a los dos. Nos hemos quedado sin palabras.'],
      [at(3, 18), 'feliz', 'Carcajada con las pedorretas de papá en la tripa. La hemos grabado 20 veces.'],
      [at(4, 24), 'tranquilo', 'Se ha dado la vuelta sola en la manta de juegos. Ella tan sorprendida como nosotros.'],
      [at(6), 'feliz', 'Primer día de BLW: aguacate. Muchas caras raras, pero ha repetido.'],
      [at(6, 6), 'molesto', 'Ha salido el primer diente (incisivo inferior). Dos noches movidas, ya más tranquila.'],
      [today0 - DAY + 19 * HOUR, 'tranquilo', 'Día de parque con la abuela. Siesta larga en el carrito.']
    ];
    diary.forEach(([t, mood, text]) => { if (t < now) add('diary', { date: U.dayKey(t), mood, text, photo: null }); });

    add('events', { date: U.dayKey(today0 + 8 * DAY), time: '17:00', title: 'Cumpleaños de la abuela Carmen' });
    add('events', { date: U.dayKey(today0 + 19 * DAY), time: '09:00', title: 'Escuela infantil · día de adaptación' });
    add('events', { date: U.dayKey(today0 - 5 * DAY), time: '11:00', title: 'Taller de masaje infantil' });

    Store.replace(st);
  };
})(window.Nido = window.Nido || {});
