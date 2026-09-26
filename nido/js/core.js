/* ==========================================================================
   Nido · Núcleo
   Utilidades, almacenamiento persistente, selectores de dominio e iconos.
   ========================================================================== */
(function (N) {
  'use strict';

  /* ======================= Utilidades ======================= */
  const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const pad = (n) => String(n).padStart(2, '0');
  const U = {
    MIN, HOUR, DAY, MONTHS, MONTHS_LONG, WEEKDAYS, WEEKDAYS_LONG,
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    sum: (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0),
    avg: (arr, f) => (arr.length ? U.sum(arr, f) / arr.length : 0),
    num: (v, d = 1) => (v == null || isNaN(v) ? '–' : Number(v).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d })),

    /* Fechas: marcas de tiempo en ms para eventos, 'YYYY-MM-DD' para días. */
    dayKey: (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    parseDay: (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); },
    dayStart: (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); },
    addDays: (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); },
    today: () => U.dayKey(Date.now()),
    time: (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; },
    timeInput: (t) => U.time(t),
    dateInput: (t) => U.dayKey(t),
    fromInputs: (day, hm) => { const [h, m] = (hm || '00:00').split(':').map(Number); const d = new Date(U.parseDay(day)); d.setHours(h, m, 0, 0); return d.getTime(); },
    date: (t, withYear) => { const d = new Date(typeof t === 'string' ? U.parseDay(t) : t); return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`; },
    dateLong: (t) => { const d = new Date(typeof t === 'string' ? U.parseDay(t) : t); return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`; },
    relDay: (k) => {
      const diff = Math.round((U.parseDay(k) - U.dayStart(Date.now())) / DAY);
      if (diff === 0) return 'hoy';
      if (diff === 1) return 'mañana';
      if (diff === -1) return 'ayer';
      if (diff > 1 && diff < 7) return `en ${diff} días`;
      if (diff < -1 && diff > -7) return `hace ${-diff} días`;
      return U.date(k, new Date(U.parseDay(k)).getFullYear() !== new Date().getFullYear());
    },
    dur: (min, compact) => {
      min = Math.max(0, Math.round(min));
      const h = Math.floor(min / 60), m = min % 60;
      if (compact) return h ? `${h}h${m ? pad(m) : ''}` : `${m}m`;
      if (!h) return `${m} min`;
      return m ? `${h} h ${m} min` : `${h} h`;
    },
    clock: (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); return (h ? h + ':' : '') + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); },
    ago: (t) => {
      const m = Math.round((Date.now() - t) / MIN);
      if (m < 1) return 'ahora';
      if (m < 60) return `hace ${m} min`;
      const h = Math.floor(m / 60);
      if (h < 24) return `hace ${U.dur(m)}`;
      return `hace ${Math.floor(h / 24)} d`;
    },
    /* Edad exacta en meses y días (calendario, no 30 días fijos). */
    age: (birthKey, at = Date.now()) => {
      const b = new Date(U.parseDay(birthKey)), d = new Date(at);
      let months = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth();
      if (d.getDate() < b.getDate()) months--;
      const anchor = new Date(b); anchor.setMonth(b.getMonth() + months);
      const days = Math.floor((U.dayStart(at) - anchor.getTime()) / DAY);
      const totalDays = Math.floor((U.dayStart(at) - b.getTime()) / DAY);
      return { months, days, totalDays, weeks: Math.floor(totalDays / 7), decimal: totalDays / 30.4375 };
    },
    ageText: (birthKey, at) => {
      const a = U.age(birthKey, at);
      if (a.totalDays < 0) return 'aún no ha nacido';
      if (a.months < 1) return a.totalDays < 14 ? `${a.totalDays} días` : `${a.weeks} semanas`;
      if (a.months < 24) return `${a.months} ${a.months === 1 ? 'mes' : 'meses'}${a.days ? ` y ${a.days} ${a.days === 1 ? 'día' : 'días'}` : ''}`;
      const y = Math.floor(a.months / 12), m = a.months % 12;
      return `${y} años${m ? ` y ${m} ${m === 1 ? 'mes' : 'meses'}` : ''}`;
    },
    ageShort: (birthKey, at) => { const a = U.age(birthKey, at); return a.months < 1 ? `${a.weeks} sem` : `${a.months}m ${a.days}d`; },
    /* Normal estándar acumulada (Abramowitz‑Stegun 26.2.17). */
    phi: (z) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? 1 - p : p;
    }
  };
  N.U = U;

  /* ======================= Almacenamiento ======================= */
  const KEY = 'nido.v1';
  const COLLECTIONS = ['sleeps', 'feeds', 'diapers', 'meals', 'measures', 'appointments', 'vaccines', 'meds', 'temps', 'diary', 'events', 'pumps'];

  const empty = () => ({
    version: 1, activeBabyId: null,
    settings: { theme: 'auto', caregiver: 'Mamá' },
    babies: [], milestones: {}, teeth: {}, timers: {},
    ...Object.fromEntries(COLLECTIONS.map((c) => [c, []]))
  });

  const listeners = new Set();
  const Store = {
    state: empty(),
    persistent: true,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.state = Object.assign(empty(), JSON.parse(raw));
      } catch (e) { this.persistent = false; }
      return this.state;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); }
      catch (e) { this.persistent = false; }
    },
    replace(next) { this.state = Object.assign(empty(), next); this.commit(); },
    reset() { this.state = empty(); this.commit(); },
    commit() { this.save(); listeners.forEach((fn) => fn(this.state)); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /* CRUD genérico sobre colecciones del bebé activo. */
    add(col, rec) {
      const item = Object.assign({ id: U.uid(), babyId: this.state.activeBabyId, by: this.state.settings.caregiver }, rec);
      this.state[col].push(item); this.commit(); return item;
    },
    update(col, id, patch) {
      const it = this.state[col].find((x) => x.id === id);
      if (it) { Object.assign(it, patch); this.commit(); }
      return it;
    },
    remove(col, id) { this.state[col] = this.state[col].filter((x) => x.id !== id); this.commit(); },
    get(col, id) { return this.state[col].find((x) => x.id === id); },
    list(col) { const b = this.state.activeBabyId; return this.state[col].filter((x) => x.babyId === b); },
    babyMap(key) { const b = this.state.activeBabyId; return (this.state[key][b] = this.state[key][b] || {}); },
    COLLECTIONS
  };
  N.Store = Store;

  /* ======================= Selectores de dominio ======================= */
  const S = {};
  N.S = S;

  S.baby = () => Store.state.babies.find((b) => b.id === Store.state.activeBabyId) || null;
  S.ageMonths = (at) => { const b = S.baby(); return b ? U.age(b.birth, at).decimal : 0; };

  /* ---- Sueño ---- */
  S.sleeps = () => Store.list('sleeps').filter((s) => s.end).sort((a, b) => a.start - b.start);
  S.sleepNorm = (m = S.ageMonths()) => N.SLEEP_BY_AGE.find((r) => m < r.upTo) || N.SLEEP_BY_AGE[N.SLEEP_BY_AGE.length - 1];

  /* Minutos de sueño dentro de un día natural, separando siestas y noche. */
  S.sleepDay = (key) => {
    const from = U.parseDay(key), to = U.addDays(from, 1);
    const out = { key, day: 0, night: 0, naps: 0, wakes: 0, longest: 0, blocks: [] };
    S.sleeps().forEach((s) => {
      const a = Math.max(s.start, from), b = Math.min(s.end, to);
      if (b <= a) return;
      const min = (b - a) / MIN;
      if (s.type === 'nap') { out.day += min; if (s.start >= from) out.naps++; }
      else out.night += min;
      out.longest = Math.max(out.longest, (s.end - s.start) / MIN);
      out.blocks.push({ a, b, type: s.type, id: s.id });
    });
    out.total = out.day + out.night;
    return out;
  };

  /* Noche que comienza en la tarde del día `key`: bloques nocturnos entre 17:00 y 12:00. */
  S.nightOf = (key) => {
    const from = U.parseDay(key) + 17 * HOUR, to = U.parseDay(key) + 36 * HOUR;
    const blocks = S.sleeps().filter((s) => s.type === 'night' && s.start >= from && s.start < to);
    if (!blocks.length) return null;
    const total = U.sum(blocks, (s) => (s.end - s.start) / MIN);
    return { start: blocks[0].start, end: blocks[blocks.length - 1].end, total, wakes: blocks.length - 1, longest: Math.max(...blocks.map((s) => (s.end - s.start) / MIN)) };
  };

  S.activeSleep = () => { const t = Store.state.timers.sleep; return t && t.babyId === Store.state.activeBabyId ? t : null; };
  S.activeBreast = () => { const t = Store.state.timers.breast; return t && t.babyId === Store.state.activeBabyId ? t : null; };

  /* Predicción de próxima siesta y hora de dormir a partir de la última
     vigilia y de las ventanas típicas para la edad, ajustadas con la media
     real de los últimos 7 días. */
  S.predict = () => {
    const now = Date.now();
    const norm = S.sleepNorm();
    const sleeps = S.sleeps();
    const last = sleeps[sleeps.length - 1];
    if (!last || S.activeSleep()) return null;
    // Ventanas reales recientes (vigilia entre sueños, solo de día)
    const recent = sleeps.filter((s) => s.start > now - 7 * DAY);
    const gaps = [];
    for (let i = 1; i < recent.length; i++) {
      const g = (recent[i].start - recent[i - 1].end) / MIN;
      const h = new Date(recent[i].start).getHours();
      if (g > 30 && g < 360 && h >= 7 && h < 21) gaps.push(g);
    }
    const typical = (norm.ww[0] + norm.ww[1]) / 2;
    const learned = gaps.length >= 5 ? U.avg(gaps) : typical;
    const ww = Math.round(U.clamp(learned * 0.6 + typical * 0.4, norm.ww[0], norm.ww[1] + 20));
    const todayKey = U.today();
    const napsToday = S.sleeps().filter((s) => s.type === 'nap' && U.dayKey(s.start) === todayKey).length;
    const expectedNaps = Math.round((norm.naps[0] + norm.naps[1]) / 2);
    // La última ventana del día suele ser la más larga (+20 %)
    const bedtimeWW = Math.round(ww * 1.2);
    const nextNap = last.end + ww * MIN;
    const napsLeft = Math.max(0, expectedNaps - napsToday);
    const bedtime = napsLeft > 0
      ? nextNap + (napsLeft * 55 + (napsLeft - 1) * ww + bedtimeWW) * MIN
      : last.end + bedtimeWW * MIN;
    const bed = new Date(bedtime); const bh = bed.getHours() + bed.getMinutes() / 60;
    const bedClamped = bh < 18.5 ? U.dayStart(bedtime) + 18.5 * HOUR : bh > 21 ? U.dayStart(bedtime) + 21 * HOUR : bedtime;
    const awakeMin = (now - last.end) / MIN;
    const lastWasNight = last.type === 'night' && new Date(last.end).getHours() < 12;
    return {
      awakeSince: last.end, awakeMin, ww, windowRange: norm.ww,
      nextNap: napsLeft > 0 ? nextNap : null, bedtime: bedClamped, napsToday, expectedNaps,
      progress: U.clamp(awakeMin / ww, 0, 1.4), lastWasNight, learned: gaps.length >= 5
    };
  };

  /* ---- Tomas y pañales ---- */
  S.feeds = () => Store.list('feeds').sort((a, b) => a.time - b.time);
  S.diapers = () => Store.list('diapers').sort((a, b) => a.time - b.time);
  S.onDay = (arr, key, f = 'time') => arr.filter((x) => U.dayKey(x[f]) === key);
  S.lastBreastSide = () => {
    const f = S.feeds().filter((x) => x.kind === 'breast').pop();
    if (!f) return null;
    return f.lastSide || (f.durR > f.durL ? 'R' : 'L');
  };

  /* ---- BLW ---- */
  S.meals = () => Store.list('meals').sort((a, b) => a.time - b.time);
  /* Estado derivado de cada alimento a partir del registro de comidas. */
  S.foodStats = () => {
    const map = {};
    S.meals().forEach((m) => (m.foods || []).forEach((f) => {
      const st = map[f.id] || (map[f.id] = { tries: 0, first: m.time, last: m.time, likes: 0, dislikes: 0, reaction: 'none', amount: 0, reactions: [] });
      st.tries++; st.last = m.time; st.amount += f.amount || 0;
      if (f.liked === 1) st.likes++;
      if (f.liked === -1) st.dislikes++;
      if (f.reaction && f.reaction !== 'none') {
        st.reactions.push({ time: m.time, level: f.reaction });
        if (f.reaction === 'strong' || st.reaction === 'none') st.reaction = f.reaction;
      }
    }));
    Object.values(map).forEach((st) => {
      st.amountAvg = st.amount / st.tries;
      st.status = st.reaction !== 'none' ? 'reaction' : st.likes > st.dislikes ? 'liked' : st.dislikes > st.likes ? 'disliked' : 'tried';
    });
    return map;
  };
  /* Alérgenos: 3 exposiciones sin reacción = introducido; después
     conviene mantenerlo en la dieta (al menos 1‑2 veces por semana). */
  S.allergenStatus = (stats = S.foodStats()) => N.ALLERGENS.map((al) => {
    const foods = N.FOODS.filter((f) => f.a === al.id);
    const exposures = [];
    S.meals().forEach((m) => (m.foods || []).forEach((f) => { if (foods.some((x) => x.id === f.id)) exposures.push({ time: m.time, reaction: f.reaction || 'none' }); }));
    const reacted = exposures.some((e) => e.reaction !== 'none');
    const last = exposures.length ? exposures[exposures.length - 1].time : null;
    const daysSince = last ? Math.floor((Date.now() - last) / DAY) : null;
    let state = 'pending';
    if (reacted) state = 'reaction';
    else if (exposures.length >= 3) state = daysSince > 7 ? 'maintain' : 'done';
    else if (exposures.length) state = 'progress';
    return { ...al, foods, exposures: exposures.length, last, daysSince, state };
  });

  /* ---- Crecimiento ---- */
  S.measures = () => Store.list('measures').sort((a, b) => U.parseDay(a.date) - U.parseDay(b.date));
  S.lastMeasure = (metric) => S.measures().filter((m) => m[metric] != null).pop();
  S.lms = (metric, sex, months) => {
    const tbl = N.WHO[metric][sex === 'm' ? 'm' : 'f'];
    const m = U.clamp(months, 0, tbl.length - 1);
    const i = Math.floor(m), f = m - i, a = tbl[i], b = tbl[Math.min(i + 1, tbl.length - 1)];
    return [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * f);
  };
  S.zscore = (metric, sex, months, x) => {
    const [L, M, Sg] = S.lms(metric, sex, months);
    return Math.abs(L) < 1e-6 ? Math.log(x / M) / Sg : (Math.pow(x / M, L) - 1) / (L * Sg);
  };
  S.percentile = (metric, sex, months, x) => U.phi(S.zscore(metric, sex, months, x)) * 100;
  S.valueAtZ = (metric, sex, months, z) => {
    const [L, M, Sg] = S.lms(metric, sex, months);
    return Math.abs(L) < 1e-6 ? M * Math.exp(Sg * z) : M * Math.pow(1 + L * Sg * z, 1 / L);
  };
  S.measureAge = (m) => { const b = S.baby(); return U.age(b.birth, U.parseDay(m.date)).decimal; };

  /* ---- Salud y agenda ---- */
  S.appointments = () => Store.list('appointments').sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  S.upcoming = () => S.appointments().filter((a) => a.date >= U.today() && !a.done);
  S.vaccineMap = () => Object.fromEntries(Store.list('vaccines').map((v) => [v.code, v]));
  S.vaccinePlan = () => {
    const b = S.baby(); const given = S.vaccineMap();
    return N.VACCINES.map((v) => {
      const due = new Date(U.parseDay(b.birth)); due.setMonth(due.getMonth() + v.m);
      const dueKey = U.dayKey(due.getTime());
      const g = given[v.id];
      const state = g ? 'done' : dueKey < U.today() ? (v.id === 'gripe' ? 'due' : 'late') : dueKey <= U.dayKey(U.addDays(Date.now(), 45)) ? 'soon' : 'future';
      return { ...v, due: dueKey, given: g, state };
    });
  };

  /* Agenda unificada para el calendario: citas, eventos, vacunas previstas, hitos. */
  S.agenda = () => {
    const items = [];
    S.appointments().forEach((a) => items.push({ date: a.date, time: a.time, title: a.title, kind: a.type === 'vacuna' ? 'health' : 'appt', ref: { col: 'appointments', id: a.id }, done: a.done }));
    Store.list('events').forEach((e) => items.push({ date: e.date, time: e.time, title: e.title, kind: 'event', ref: { col: 'events', id: e.id } }));
    S.vaccinePlan().filter((v) => !v.given && v.state !== 'late').forEach((v) => items.push({ date: v.due, title: v.name, kind: 'vaccine', planned: true }));
    const ms = Store.state.milestones[Store.state.activeBabyId] || {};
    Object.entries(ms).forEach(([id, date]) => { const m = N.MILESTONES.find((x) => x.id === id); if (m) items.push({ date, title: m.name, kind: 'milestone' }); });
    const teeth = Store.state.teeth[Store.state.activeBabyId] || {};
    Object.entries(teeth).forEach(([, date]) => items.push({ date, title: 'Nuevo diente', kind: 'milestone' }));
    return items.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  };

  /* ---- Línea de tiempo de un día ---- */
  S.timeline = (key) => {
    const out = [];
    S.sleeps().forEach((s) => { if (U.dayKey(s.end) === key || U.dayKey(s.start) === key) out.push({ t: s.start, kind: 'sleep', rec: s, col: 'sleeps' }); });
    S.onDay(S.feeds(), key).forEach((f) => out.push({ t: f.time, kind: 'feed', rec: f, col: 'feeds' }));
    S.onDay(S.diapers(), key).forEach((d) => out.push({ t: d.time, kind: 'diaper', rec: d, col: 'diapers' }));
    S.onDay(S.meals(), key).forEach((m) => out.push({ t: m.time, kind: 'meal', rec: m, col: 'meals' }));
    S.onDay(Store.list('meds'), key).forEach((m) => out.push({ t: m.time, kind: 'med', rec: m, col: 'meds' }));
    S.onDay(Store.list('temps'), key).forEach((m) => out.push({ t: m.time, kind: 'temp', rec: m, col: 'temps' }));
    return out.filter((x) => U.dayKey(x.t) === key || x.kind === 'sleep').sort((a, b) => b.t - a.t);
  };

  /* ======================= Iconos (trazo 1.75, 24×24) ======================= */
  const P = {
    home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
    bottle: '<path d="M9 3h6"/><path d="M10 3v3l-2 3v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9l-2-3V3"/><path d="M8 13h8"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19 13 11"/>',
    ruler: '<path d="m3 16 13-13 5 5L8 21Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z"/>',
    book: '<path d="M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2Z"/><path d="M5 19V5M9 7h5"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="M8 5v14l11-7Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    diaper: '<path d="M3 7h18v3a9 9 0 0 1-18 0Z"/><path d="M8 10.5c1 2 2.5 3 4 3s3-1 4-3"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13 7 4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    alert: '<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4M12 17v.5"/>',
    tooth: '<path d="M7 4c-2 0-3 2-3 4 0 3 1.5 4 2 7s1 5 2 5 1.5-4 4-4 3 4 4 4 1.5-2 2-5 2-4 2-7c0-2-1-4-3-4s-3 1-5 1-3-1-5-1Z"/>',
    syringe: '<path d="m18 3 3 3M16 5l3 3M17.5 6.5 8 16l-3 .5.5-3L15 4Z"/><path d="m5.5 18.5-2.5 2.5M11 10l2 2M8.5 12.5l2 2"/>',
    thermo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
    pill: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="m9.5 9 5 7"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 17v3h16v-3"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 17v3h16v-3"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    breast: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/>',
    pump: '<path d="M7 4h10l-2 5H9Z"/><path d="M9 9v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    menu: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    bed: '<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>'
  };
  N.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
})(window.Nido = window.Nido || {});
