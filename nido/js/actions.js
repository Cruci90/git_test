/* ==========================================================================
   Nido · Acciones y formularios
   Cada registro se crea y edita desde una hoja inferior. Las acciones se
   disparan por delegación con `data-act`.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const { f } = UI;
  const A = N.actions;
  const F = {};
  N.Forms = F;

  const splitDT = (t) => [U.dateInput(t), U.timeInput(t)];

  /* ======================= Sueño ======================= */
  F.sleep = (rec) => {
    const now = Date.now();
    const s = rec || { start: now - 60 * U.MIN, end: now, type: new Date(now).getHours() >= 19 || new Date(now).getHours() < 7 ? 'night' : 'nap', place: 'Cuna', quality: 3 };
    const [d0, t0] = splitDT(s.start);
    UI.sheet({
      title: rec ? 'Editar sueño' : 'Registrar sueño',
      body: f.chips('type', 'Tipo', [['nap', 'Siesta'], ['night', 'Noche']], s.type) +
        f.row(f.date('d0', 'Empezó', d0), f.time('t0', 'Hora', t0), f.time('t1', 'Se despertó', U.timeInput(s.end))) +
        f.row(f.select('place', 'Dónde', N.SLEEP_PLACES.map((p) => [p, p]), s.place), f.select('quality', 'Cómo durmió', [[3, 'Bien'], [2, 'Regular'], [1, 'Mal']], s.quality)) +
        f.area('note', 'Nota', s.note, 'Ej.: se durmió al pecho, ruido en la calle…'),
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('sleeps', rec.id, 'Sueño eliminado'); }),
      onSubmit: (d) => {
        const start = U.fromInputs(d.d0, d.t0);
        let end = U.fromInputs(d.d0, d.t1);
        if (end <= start) end += U.DAY;
        const data = { start, end, type: d.type, place: d.place, quality: +d.quality, note: d.note };
        rec ? Store.update('sleeps', rec.id, data) : Store.add('sleeps', data);
        UI.toast(`${d.type === 'nap' ? 'Siesta' : 'Sueño nocturno'} de ${U.dur((end - start) / U.MIN)} guardado`);
      }
    });
  };
  A['sleep-start'] = () => { Store.state.timers.sleep = { babyId: Store.state.activeBabyId, start: Date.now() }; Store.commit(); UI.toast('A dormir. Cronómetro en marcha'); };
  A['sleep-stop'] = () => {
    const t = S.activeSleep(); if (!t) return;
    const end = Date.now(), h = new Date(t.start).getHours();
    delete Store.state.timers.sleep;
    if (end - t.start < U.MIN) { Store.commit(); UI.toast('Cronómetro descartado (menos de 1 min)'); return; }
    const rec = Store.add('sleeps', { start: t.start, end, type: h >= 19 || h < 6 ? 'night' : 'nap', place: 'Cuna', quality: 3 });
    UI.toast(`Ha dormido ${U.dur((end - t.start) / U.MIN)}`, () => Store.remove('sleeps', rec.id));
  };
  A['sleep-cancel'] = () => { delete Store.state.timers.sleep; Store.commit(); };

  /* ======================= Tomas ======================= */
  F.feed = (rec, kind) => {
    const r = rec || { time: Date.now(), kind: kind || 'breast', durL: 10, durR: 8, ml: 120, milk: 'materna', lastSide: 'R' };
    const [d, t] = splitDT(r.time);
    const form = UI.sheet({
      title: rec ? 'Editar toma' : 'Registrar toma',
      body: f.chips('kind', 'Tipo', [['breast', 'Pecho'], ['bottle', 'Biberón']], r.kind) +
        f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) +
        `<div class="only-breast">${f.row(f.num('durL', 'Izquierdo', r.durL, 'min="0" max="120"', 'min'), f.num('durR', 'Derecho', r.durR, 'min="0" max="120"', 'min'))}
        ${f.chips('lastSide', 'Terminó en', [['L', 'Izquierdo'], ['R', 'Derecho']], r.lastSide || 'R')}</div>
        <div class="only-bottle">${f.row(f.num('ml', 'Cantidad', r.ml, 'min="0" max="400" step="5"', 'ml'), f.select('milk', 'Leche', [['materna', 'Materna'], ['formula', 'Fórmula'], ['mixta', 'Mixta']], r.milk))}</div>` +
        f.area('note', 'Nota', r.note),
      onMount: (form) => {
        const sync = () => { const k = form.querySelector('[name=kind]:checked').value; form.dataset.kind = k; };
        form.addEventListener('change', sync); sync();
      },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('feeds', rec.id, 'Toma eliminada'); }),
      onSubmit: (x) => {
        const data = { time: U.fromInputs(x.d, x.t), kind: x.kind, note: x.note };
        if (x.kind === 'breast') Object.assign(data, { durL: +x.durL || 0, durR: +x.durR || 0, lastSide: x.lastSide });
        else Object.assign(data, { ml: +x.ml || 0, milk: x.milk });
        rec ? Store.update('feeds', rec.id, data) : Store.add('feeds', data);
        UI.toast('Toma guardada');
      }
    });
    return form;
  };
  /* Cronómetro de pecho con cambio de lado y pausa. */
  A['breast-start'] = (el) => {
    const side = el.dataset.side || (S.lastBreastSide() === 'L' ? 'R' : 'L');
    Store.state.timers.breast = { babyId: Store.state.activeBabyId, start: Date.now(), side, running: true, since: Date.now(), accL: 0, accR: 0 };
    Store.commit(); UI.closeSheet();
  };
  const bank = (b) => { if (b.running) { b[b.side === 'L' ? 'accL' : 'accR'] += Date.now() - b.since; b.since = Date.now(); } };
  A['breast-side'] = (el) => {
    const b = S.activeBreast(); if (!b) return;
    bank(b); b.side = el.dataset.side; b.running = true; b.since = Date.now(); Store.commit();
  };
  A['breast-pause'] = () => { const b = S.activeBreast(); if (!b) return; bank(b); b.running = !b.running; b.since = Date.now(); Store.commit(); };
  A['breast-stop'] = () => {
    const b = S.activeBreast(); if (!b) return; bank(b);
    delete Store.state.timers.breast;
    const durL = Math.round(b.accL / U.MIN), durR = Math.round(b.accR / U.MIN);
    if (durL + durR === 0) { Store.commit(); UI.toast('Toma descartada (menos de 1 min)'); return; }
    const rec = Store.add('feeds', { time: b.start, kind: 'breast', durL, durR, lastSide: b.side });
    UI.toast(`Toma de ${durL + durR} min guardada`, () => Store.remove('feeds', rec.id));
  };
  A['breast-cancel'] = () => { delete Store.state.timers.breast; Store.commit(); };

  F.pump = (rec) => {
    const r = rec || { time: Date.now(), ml: 100, side: 'B' };
    const [d, t] = splitDT(r.time);
    UI.sheet({
      title: rec ? 'Editar extracción' : 'Registrar extracción',
      body: f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) + f.row(f.num('ml', 'Cantidad', r.ml, 'min="0" step="5"', 'ml'), f.select('side', 'Pecho', [['B', 'Ambos'], ['L', 'Izquierdo'], ['R', 'Derecho']], r.side)),
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('pumps', rec.id); }),
      onSubmit: (x) => { const data = { time: U.fromInputs(x.d, x.t), ml: +x.ml, side: x.side }; rec ? Store.update('pumps', rec.id, data) : Store.add('pumps', data); UI.toast('Extracción guardada'); }
    });
  };

  /* ======================= Pañales ======================= */
  F.diaper = (rec, kind) => {
    const r = rec || { time: Date.now(), kind: kind || 'wet', color: 'amarillo' };
    const [d, t] = splitDT(r.time);
    UI.sheet({
      title: rec ? 'Editar pañal' : 'Registrar pañal',
      body: f.chips('kind', 'Contenido', [['wet', 'Pipí'], ['dirty', 'Caca'], ['mixed', 'Pipí y caca']], r.kind) +
        f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) +
        `<div class="only-poo"><fieldset class="fld full"><legend>Color de la caca</legend><div class="chips">${N.DIAPER_COLORS.map((c) => `<label class="chip"><input type="radio" name="color" value="${c.id}" ${r.color === c.id ? 'checked' : ''}><span><i class="swatch" style="background:${c.hex}"></i>${c.name}</span></label>`).join('')}</div><p class="hint">Negro (pasados los primeros días), blanco o con sangre: consulta con tu pediatra.</p></fieldset></div>` +
        f.area('note', 'Nota', r.note),
      onMount: (form) => { const sync = () => { form.dataset.kind = form.querySelector('[name=kind]:checked').value; }; form.addEventListener('change', sync); sync(); },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('diapers', rec.id, 'Pañal eliminado'); }),
      onSubmit: (x) => {
        const data = { time: U.fromInputs(x.d, x.t), kind: x.kind, color: x.kind === 'wet' ? null : x.color || 'amarillo', note: x.note };
        rec ? Store.update('diapers', rec.id, data) : Store.add('diapers', data);
        UI.toast('Pañal guardado');
      }
    });
  };
  A['diaper-quick'] = (el) => {
    const rec = Store.add('diapers', { time: Date.now(), kind: el.dataset.kind, color: el.dataset.kind === 'wet' ? null : 'amarillo' });
    UI.closeSheet();
    UI.toast(`Pañal (${{ wet: 'pipí', dirty: 'caca', mixed: 'pipí y caca' }[el.dataset.kind]}) guardado`, () => Store.remove('diapers', rec.id));
  };

  /* ======================= Comidas BLW ======================= */
  F.meal = (rec, preset) => {
    const now = Date.now(), h = new Date(now).getHours();
    const r = rec || { time: now, mealType: h < 11 ? 'desayuno' : h < 16 ? 'comida' : h < 19 ? 'merienda' : 'cena', foods: preset ? [{ id: preset, amount: 1, liked: 0, reaction: 'none' }] : [], gag: false, choke: false };
    const sel = r.foods.map((x) => Object.assign({}, x));
    const stats = S.foodStats();
    const [d, t] = splitDT(r.time);
    const foodBtn = (fd) => {
      const on = sel.some((x) => x.id === fd.id), stt = stats[fd.id];
      return `<button type="button" class="food-pick ${on ? 'on' : ''}" data-food="${fd.id}" data-name="${U.esc(fd.name.toLowerCase())}">
        <span class="fe">${fd.emoji}</span><span>${fd.name}</span>${fd.a ? '<i class="dot-al" title="Alérgeno"></i>' : ''}${stt ? '<i class="tried" title="Ya lo ha probado">✓</i>' : ''}</button>`;
    };
    const selRow = (x) => {
      const fd = N.FOOD_BY_ID[x.id];
      return `<div class="sel-food" data-id="${x.id}">
        <div class="sel-food-h"><span class="fe">${fd.emoji}</span><b>${fd.name}</b>${fd.a ? UI.pill('Alérgeno', 'warn') : ''}<button type="button" class="icon-btn sm" data-unpick="${x.id}" aria-label="Quitar ${fd.name}">${icon('x')}</button></div>
        <div class="sel-food-c">
          <select name="amount_${x.id}" aria-label="Cantidad">${N.EAT_AMOUNT.map((l, i) => `<option value="${i}" ${x.amount === i ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <div class="likes" role="radiogroup" aria-label="¿Le gustó?">${[[1, '😋', 'Le gustó'], [0, '😐', 'Normal'], [-1, '😖', 'No le gustó']].map(([v, e, l]) => `<label title="${l}"><input type="radio" name="liked_${x.id}" value="${v}" ${x.liked === v ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div>
          <select name="reaction_${x.id}" aria-label="Reacción">${Object.entries(N.REACTIONS).map(([k, v]) => `<option value="${k}" ${x.reaction === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
        </div>
        ${fd.s6 ? `<p class="hint">${icon('info')} ${S.ageMonths() < 9 ? fd.s6 : fd.s9}${fd.r ? ' · <b>Preparar con cuidado: riesgo de atragantamiento</b>' : ''}</p>` : ''}
      </div>`;
    };
    UI.sheet({
      title: rec ? 'Editar comida' : 'Nueva comida',
      wide: true,
      body: f.chips('mealType', 'Comida', N.MEAL_TYPES.map((m) => [m.id, m.name]), r.mealType) +
        f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) +
        `<div class="fld full"><span>Alimentos</span><div id="sel-foods" class="sel-foods"></div>
          <input type="search" id="food-q" class="food-q" placeholder="Buscar alimento (${N.FOODS.length} en el catálogo)…" autocomplete="off">
          <div class="food-grid" id="food-grid">${N.FOODS.map(foodBtn).join('')}</div></div>` +
        `<fieldset class="fld full"><legend>Durante la comida</legend><div class="chips">
          <label class="chip"><input type="checkbox" name="gag" ${r.gag ? 'checked' : ''}><span>Hizo arcadas</span></label>
          <label class="chip"><input type="checkbox" name="choke" ${r.choke ? 'checked' : ''}><span>Atragantamiento</span></label></div>
          <p class="hint">Las arcadas son un reflejo protector y normales al empezar. El atragantamiento es silencioso: si ocurre, actúa y anótalo.</p></fieldset>` +
        f.area('note', 'Nota', r.note, 'Texturas, cómo lo cogió, si usó cuchara precargada…'),
      onMount: (form) => {
        const list = form.querySelector('#sel-foods');
        const paint = () => {
          // Conserva lo que ya se había elegido en los controles antes de repintar
          sel.forEach((x) => {
            const a = form.querySelector(`[name=amount_${x.id}]`), l = form.querySelector(`[name=liked_${x.id}]:checked`), re = form.querySelector(`[name=reaction_${x.id}]`);
            if (a) x.amount = +a.value; if (l) x.liked = +l.value; if (re) x.reaction = re.value;
          });
          list.innerHTML = sel.length ? sel.map(selRow).join('') : '<p class="hint">Elige uno o varios alimentos del catálogo.</p>';
          form.querySelectorAll('.food-pick').forEach((b) => b.classList.toggle('on', sel.some((x) => x.id === b.dataset.food)));
        };
        paint();
        form.addEventListener('click', (e) => {
          const p = e.target.closest('.food-pick'), u = e.target.closest('[data-unpick]');
          if (p) {
            const id = p.dataset.food, i = sel.findIndex((x) => x.id === id);
            if (i >= 0) sel.splice(i, 1); else sel.push({ id, amount: 1, liked: 0, reaction: 'none' });
            paint();
          }
          if (u) { sel.splice(sel.findIndex((x) => x.id === u.dataset.unpick), 1); paint(); }
        });
        form.querySelector('#food-q').addEventListener('input', (e) => {
          const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          form.querySelectorAll('.food-pick').forEach((b) => { b.hidden = q && !b.dataset.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q); });
        });
      },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('meals', rec.id, 'Comida eliminada'); }),
      onSubmit: (x, form) => {
        if (!sel.length) { UI.toast('Añade al menos un alimento'); return false; }
        const foods = sel.map((s) => ({
          id: s.id, amount: +(x['amount_' + s.id] ?? s.amount), liked: +(x['liked_' + s.id] ?? s.liked), reaction: x['reaction_' + s.id] || s.reaction
        }));
        const data = { time: U.fromInputs(x.d, x.t), mealType: x.mealType, foods, gag: !!x.gag, choke: !!x.choke, note: x.note };
        const firsts = foods.filter((fd) => !stats[fd.id]).map((fd) => N.FOOD_BY_ID[fd.id].name);
        rec ? Store.update('meals', rec.id, data) : Store.add('meals', data);
        UI.toast(firsts.length && !rec ? `Primera vez: ${firsts.join(', ')}` : 'Comida guardada');
        if (foods.some((fd) => fd.reaction === 'strong')) setTimeout(() => UI.toast('Reacción importante anotada. Si hay dificultad para respirar, llama al 112'), 2700);
      }
    });
  };

  /* ======================= Crecimiento ======================= */
  F.measure = (rec) => {
    const last = { weight: S.lastMeasure('weight'), length: S.lastMeasure('length'), head: S.lastMeasure('head') };
    const r = rec || { date: U.today() };
    const b = S.baby();
    UI.sheet({
      title: rec ? 'Editar medida' : 'Nueva medida',
      body: f.date('date', 'Fecha', r.date) +
        f.row(
          f.num('weight', 'Peso', r.weight, `step="0.01" min="1" max="30" placeholder="${last.weight ? U.num(last.weight.weight, 2) : ''}"`, 'kg'),
          f.num('length', 'Longitud', r.length, `step="0.1" min="30" max="120" placeholder="${last.length ? U.num(last.length.length, 1) : ''}"`, 'cm'),
          f.num('head', 'P. craneal', r.head, `step="0.1" min="25" max="60" placeholder="${last.head ? U.num(last.head.head, 1) : ''}"`, 'cm')) +
        '<div id="pc-preview" class="pc-preview"></div>' +
        f.area('note', 'Nota', r.note, 'Dónde se midió, con o sin ropa…'),
      onMount: (form) => {
        const prev = form.querySelector('#pc-preview');
        const upd = () => {
          const d = UI.formData(form); const age = U.age(b.birth, U.parseDay(d.date || U.today())).decimal;
          prev.innerHTML = ['weight', 'length', 'head'].map((k) => {
            const v = parseFloat(d[k]); if (!v) return '';
            const p = S.percentile(k, b.sex, age, v);
            return `<span>${N.METRICS[k].short}: <b>P${Math.round(p)}</b></span>`;
          }).join('');
        };
        form.addEventListener('input', upd); upd();
      },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('measures', rec.id, 'Medida eliminada'); }),
      onSubmit: (x) => {
        const val = (k) => (x[k] ? parseFloat(String(x[k]).replace(',', '.')) : null);
        const data = { date: x.date, weight: val('weight'), length: val('length'), head: val('head'), note: x.note };
        if (!data.weight && !data.length && !data.head) { UI.toast('Introduce al menos una medida'); return false; }
        rec ? Store.update('measures', rec.id, data) : Store.add('measures', data);
        UI.toast('Medida guardada');
      }
    });
  };

  /* ======================= Salud ======================= */
  F.appt = (rec, preset = {}) => {
    const r = rec || Object.assign({ date: U.dayKey(U.addDays(Date.now(), 7)), time: '10:00', type: 'revision', title: '', place: S.baby().center || '', doctor: S.baby().pediatrician || '', questions: [], done: false }, preset);
    UI.sheet({
      title: rec ? 'Editar cita' : 'Nueva cita',
      body: f.text('title', 'Motivo', r.title, 'required placeholder="Revisión 9 meses, vacuna, dermatología…"') +
        f.row(f.date('date', 'Día', r.date), f.time('time', 'Hora', r.time), f.select('type', 'Tipo', Object.entries(N.APPT_TYPES).map(([k, v]) => [k, v.name]), r.type)) +
        f.row(f.text('place', 'Lugar', r.place), f.text('doctor', 'Profesional', r.doctor)) +
        f.area('questions', 'Preguntas para la consulta (una por línea)', (r.questions || []).map((q) => q.text).join('\n'), '¿Cuándo introducir el huevo entero?') +
        `<label class="chip solo"><input type="checkbox" name="done" ${r.done ? 'checked' : ''}><span>Cita realizada</span></label>` +
        f.area('outcome', 'Qué nos dijeron', r.outcome, 'Indicaciones, próximas pruebas, dosis…'),
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('appointments', rec.id, 'Cita eliminada'); }),
      onSubmit: (x) => {
        if (!x.title.trim()) { UI.toast('Escribe el motivo de la cita'); return false; }
        const prevQ = Object.fromEntries((r.questions || []).map((q) => [q.text, q.done]));
        const questions = x.questions.split('\n').map((s) => s.trim()).filter(Boolean).map((text) => ({ text, done: !!prevQ[text] }));
        const data = { title: x.title.trim(), date: x.date, time: x.time, type: x.type, place: x.place, doctor: x.doctor, questions, done: !!x.done, outcome: x.outcome };
        rec ? Store.update('appointments', rec.id, data) : Store.add('appointments', data);
        UI.toast(rec ? 'Cita actualizada' : `Cita guardada para ${U.relDay(x.date)}`);
      }
    });
  };
  A['q-toggle'] = (el) => {
    const a = Store.get('appointments', el.dataset.id); if (!a) return;
    a.questions[+el.dataset.i].done = !a.questions[+el.dataset.i].done; Store.commit();
  };
  F.vaccine = (code) => {
    const v = N.VACCINES.find((x) => x.id === code); const g = S.vaccineMap()[code];
    UI.sheet({
      title: v.name,
      body: `<p class="hint">${v.detail || 'Dosis del calendario común.'}</p>` + f.row(f.date('date', 'Fecha de administración', g ? g.date : U.today()), f.text('lot', 'Lote (opcional)', g ? g.lot : '')) + f.area('note', 'Reacción u observaciones', g ? g.note : '', 'Fiebre, irritabilidad, bultito en la zona…'),
      submit: g ? 'Guardar' : 'Marcar como puesta',
      onDelete: g && (() => { UI.closeSheet(); UI.removeWithUndo('vaccines', g.id, 'Vacuna desmarcada'); }),
      onSubmit: (x) => { const data = { code, date: x.date, lot: x.lot, note: x.note }; g ? Store.update('vaccines', g.id, data) : Store.add('vaccines', data); UI.toast(`${v.name} registrada`); }
    });
  };
  F.med = (rec) => {
    const recent = [...new Set(Store.list('meds').map((m) => m.name))];
    const r = rec || { time: Date.now(), name: '', dose: '', unit: 'ml' };
    const [d, t] = splitDT(r.time);
    UI.sheet({
      title: rec ? 'Editar medicación' : 'Registrar medicación',
      body: `<label class="fld full"><span>Medicamento</span><input id="f-medname" name="name" list="med-list" value="${U.esc(r.name)}" required placeholder="Paracetamol, vitamina D…"><datalist id="med-list">${recent.map((n) => `<option value="${U.esc(n)}">`).join('')}</datalist></label>` +
        f.row(f.num('dose', 'Dosis', r.dose, 'step="0.1" min="0"'), f.select('unit', 'Unidad', [['ml', 'ml'], ['gotas', 'gotas'], ['mg', 'mg'], ['UI', 'UI'], ['sobre', 'sobre']], r.unit)) +
        f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) + f.text('reason', 'Motivo', r.reason, 'placeholder="Fiebre, suplemento…"') +
        '<p class="hint">Consulta siempre la dosis por peso con tu pediatra o farmacéutico.</p>',
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('meds', rec.id); }),
      onSubmit: (x) => {
        if (!x.name.trim()) { UI.toast('Escribe el nombre del medicamento'); return false; }
        const data = { time: U.fromInputs(x.d, x.t), name: x.name.trim(), dose: parseFloat(x.dose) || null, unit: x.unit, reason: x.reason };
        rec ? Store.update('meds', rec.id, data) : Store.add('meds', data); UI.toast('Medicación registrada');
      }
    });
  };
  F.temp = (rec) => {
    const r = rec || { time: Date.now(), value: 37.0, method: 'Axilar' };
    const [d, t] = splitDT(r.time);
    UI.sheet({
      title: rec ? 'Editar temperatura' : 'Registrar temperatura',
      body: f.row(f.num('value', 'Temperatura', r.value, 'step="0.1" min="34" max="43"', 'ºC'), f.select('method', 'Medición', [['Axilar', 'Axilar'], ['Rectal', 'Rectal'], ['Oído', 'Oído'], ['Frente', 'Frente']], r.method)) +
        f.row(f.date('d', 'Día', d), f.time('t', 'Hora', t)) +
        '<p class="hint">Fiebre: 38 ºC o más. En menores de 3 meses, cualquier fiebre es motivo de consulta urgente.</p>',
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('temps', rec.id); }),
      onSubmit: (x) => {
        const v = parseFloat(String(x.value).replace(',', '.'));
        const data = { time: U.fromInputs(x.d, x.t), value: v, method: x.method };
        rec ? Store.update('temps', rec.id, data) : Store.add('temps', data);
        UI.toast(v >= 38 ? `${U.num(v)} ºC: tiene fiebre` : `${U.num(v)} ºC guardado`);
      }
    });
  };

  /* ======================= Agenda, diario, hitos ======================= */
  F.event = (rec, date) => {
    const r = rec || { date: date || U.today(), time: '', title: '' };
    UI.sheet({
      title: rec ? 'Editar evento' : 'Nuevo evento',
      body: f.text('title', 'Qué', r.title, 'required placeholder="Visita de los abuelos, guardería…"') + f.row(f.date('date', 'Día', r.date), `<label class="fld"><span>Hora (opcional)</span><input id="f-evtime" name="time" type="time" value="${r.time || ''}"></label>`),
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('events', rec.id, 'Evento eliminado'); }),
      onSubmit: (x) => { if (!x.title.trim()) { UI.toast('Escribe un título'); return false; } const data = { title: x.title.trim(), date: x.date, time: x.time }; rec ? Store.update('events', rec.id, data) : Store.add('events', data); UI.toast('Evento guardado'); }
    });
  };
  /* Reduce la foto a 1000 px para que quepa en el almacenamiento local. */
  const shrink = (file) => new Promise((res, rej) => {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1000 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = rej; img.src = rd.result;
    };
    rd.onerror = rej; rd.readAsDataURL(file);
  });
  F.diary = (rec) => {
    const r = rec || { date: U.today(), mood: 'feliz', text: '', photo: null };
    let photo = r.photo;
    UI.sheet({
      title: rec ? 'Editar recuerdo' : 'Nuevo recuerdo',
      body: f.date('date', 'Día', r.date) + f.chips('mood', 'Cómo estaba', N.MOODS.map((m) => [m.id, `${m.emoji} ${m.name}`]), r.mood) +
        f.area('text', 'Qué pasó', r.text, 'Una primera vez, una frase, algo que no quieres olvidar…') +
        `<div class="fld full"><span>Foto</span><label class="photo-drop" id="photo-drop">${photo ? `<img src="${photo}" alt="">` : `${icon('camera')}<span>Añadir foto</span>`}<input type="file" id="f-photo" accept="image/*" hidden></label></div>`,
      onMount: (form) => {
        form.addEventListener('change', async (e) => {
          if (e.target.id !== 'f-photo') return;
          const file = e.target.files[0]; if (!file) return;
          try { photo = await shrink(file); form.querySelector('#photo-drop').innerHTML = `<img src="${photo}" alt=""><input type="file" id="f-photo" accept="image/*" hidden>`; }
          catch (err) { UI.toast('No se pudo leer la imagen'); }
        });
      },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('diary', rec.id, 'Recuerdo eliminado'); }),
      onSubmit: (x) => {
        if (!x.text.trim() && !photo) { UI.toast('Escribe algo o añade una foto'); return false; }
        const data = { date: x.date, mood: x.mood, text: x.text.trim(), photo };
        rec ? Store.update('diary', rec.id, data) : Store.add('diary', data);
        UI.toast(Store.persistent ? 'Recuerdo guardado' : 'Guardado en esta sesión (el navegador no permite almacenamiento)');
      }
    });
  };
  F.milestone = (id) => {
    const m = N.MILESTONES.find((x) => x.id === id); const map = Store.babyMap('milestones');
    UI.sheet({
      title: m.name, body: `<p class="hint">Suele aparecer entre los ${m.from} y los ${m.to} meses. Cada bebé tiene su ritmo.</p>` + f.date('date', '¿Cuándo?', map[id] || U.today()),
      submit: map[id] ? 'Guardar' : '¡Conseguido!',
      onDelete: map[id] && (() => { delete map[id]; Store.commit(); UI.closeSheet(); UI.toast('Hito desmarcado'); }),
      onSubmit: (x) => { map[id] = x.date; Store.commit(); UI.toast(`${m.name} ✓`); }
    });
  };
  F.tooth = (id) => {
    const all = [...N.TEETH.upper, ...N.TEETH.lower]; const tt = all.find((x) => x.id === id); const map = Store.babyMap('teeth');
    UI.sheet({
      title: tt.name, body: `<p class="hint">Diente ${tt.id} · erupción habitual: ${tt.m} meses.</p>` + f.date('date', '¿Cuándo salió?', map[id] || U.today()),
      submit: map[id] ? 'Guardar' : 'Ha salido',
      onDelete: map[id] && (() => { delete map[id]; Store.commit(); UI.closeSheet(); }),
      onSubmit: (x) => { map[id] = x.date; Store.commit(); UI.toast('Diente registrado'); }
    });
  };

  /* ======================= Bebés ======================= */
  F.baby = (rec) => {
    const r = rec || { name: '', sex: 'f', birth: U.today() };
    UI.sheet({
      title: rec ? `Perfil de ${U.esc(rec.name)}` : 'Añadir bebé',
      body: f.text('name', 'Nombre', r.name, 'required autocomplete="off"') +
        f.row(f.chips('sex', 'Sexo (para las curvas OMS)', [['f', 'Niña'], ['m', 'Niño']], r.sex), f.date('birth', 'Fecha de nacimiento', r.birth)) +
        f.row(f.num('birthWeight', 'Peso al nacer', r.birthWeight, 'step="0.01"', 'kg'), f.num('birthLength', 'Longitud', r.birthLength, 'step="0.1"', 'cm'), f.num('birthHead', 'P. craneal', r.birthHead, 'step="0.1"', 'cm')) +
        f.row(f.text('blood', 'Grupo sanguíneo', r.blood), f.text('allergies', 'Alergias conocidas', r.allergies)) +
        f.row(f.text('pediatrician', 'Pediatra', r.pediatrician), f.text('center', 'Centro de salud', r.center)) +
        f.text('healthCard', 'Nº tarjeta sanitaria', r.healthCard) + f.area('notes', 'Notas médicas', r.notes),
      onDelete: rec && Store.state.babies.length > 1 && (() => {
        UI.confirm(`¿Eliminar a ${U.esc(rec.name)}?`, 'Se borrarán todos sus registros de este dispositivo. No se puede deshacer.', 'Eliminar', () => {
          Store.state.babies = Store.state.babies.filter((b) => b.id !== rec.id);
          Store.COLLECTIONS.forEach((c) => { Store.state[c] = Store.state[c].filter((x) => x.babyId !== rec.id); });
          Store.state.activeBabyId = Store.state.babies[0].id; Store.commit();
        });
      }),
      onSubmit: (x) => {
        if (!x.name.trim()) { UI.toast('Escribe el nombre'); return false; }
        const n = (k) => (x[k] ? parseFloat(x[k]) : null);
        const data = { name: x.name.trim(), sex: x.sex, birth: x.birth, birthWeight: n('birthWeight'), birthLength: n('birthLength'), birthHead: n('birthHead'), blood: x.blood, allergies: x.allergies, pediatrician: x.pediatrician, center: x.center, healthCard: x.healthCard, notes: x.notes };
        if (rec) { Object.assign(rec, data); Store.commit(); UI.toast('Perfil actualizado'); return; }
        const b = Object.assign({ id: U.uid() }, data);
        Store.state.babies.push(b); Store.state.activeBabyId = b.id;
        if (data.birthWeight || data.birthLength || data.birthHead) Store.state.measures.push({ id: U.uid(), babyId: b.id, date: data.birth, weight: data.birthWeight, length: data.birthLength, head: data.birthHead, note: 'Al nacer' });
        Store.commit(); UI.go('hoy'); UI.toast(`Bienvenida/o, ${b.name}`);
      }
    });
  };
  A['switch-baby'] = () => {
    const cur = Store.state.activeBabyId;
    UI.sheet({
      title: 'Bebés', footer: false,
      body: `<div class="baby-list">${Store.state.babies.map((b) => `
        <button type="button" class="baby-row ${b.id === cur ? 'on' : ''}" data-act="pick-baby" data-id="${b.id}">
          <span class="avatar" style="--av:${b.sex === 'm' ? 'var(--c-sleep)' : 'var(--c-feed)'}">${U.esc(b.name[0])}</span>
          <span><b>${U.esc(b.name)}</b><small>${U.ageText(b.birth)}</small></span>${b.id === cur ? icon('check') : ''}</button>`).join('')}
        <button type="button" class="baby-row add" data-act="new-baby"><span class="avatar">+</span><span><b>Añadir otro bebé</b><small>Hermanos, gemelos…</small></span></button></div>
        ${S.baby() ? `<button type="button" class="btn ghost full" data-act="edit-baby">${icon('edit')}Editar perfil de ${U.esc(S.baby().name)}</button>` : ''}`
    });
  };
  A['pick-baby'] = (el) => { Store.state.activeBabyId = el.dataset.id; Store.commit(); UI.closeSheet(); };
  A['new-baby'] = () => F.baby();
  A['edit-baby'] = () => F.baby(S.baby());
  A.caregiver = () => {
    const cur = Store.state.settings.caregiver;
    const opts = ['Mamá', 'Papá', 'Abuela', 'Abuelo', 'Canguro'];
    UI.sheet({
      title: '¿Quién está registrando?',
      body: f.chips('who', 'Cuidador', (opts.includes(cur) ? opts : [...opts, cur]).map((o) => [o, o]), cur) + f.text('other', 'Otro nombre', '', 'placeholder="Tía Ana"') + '<p class="hint">Cada registro guarda quién lo hizo, útil cuando os turnáis por la noche.</p>',
      onSubmit: (x) => { Store.state.settings.caregiver = x.other.trim() || x.who; Store.commit(); }
    });
  };

  /* ======================= Registro rápido y menú ======================= */
  A['quick-add'] = () => {
    const s = S.activeSleep();
    const next = S.lastBreastSide() === 'L' ? 'R' : 'L';
    const tile = (act, ic, label, sub, cls, extra = '') => `<button type="button" class="qa ${cls}" data-act="${act}" ${extra}>${icon(ic)}<b>${label}</b><small>${sub}</small></button>`;
    UI.sheet({
      title: 'Registrar', footer: false, wide: true,
      body: `<div class="qa-grid">
        ${s ? tile('sleep-stop', 'sun', 'Se ha despertado', `Dormía desde ${U.time(s.start)}`, 'c-sleep') : tile('sleep-start', 'moon', 'A dormir', 'Inicia el cronómetro', 'c-sleep')}
        ${tile('form-sleep', 'bed', 'Sueño pasado', 'Siesta o noche', 'c-sleep')}
        ${tile('breast-start', 'breast', 'Pecho', `Empezar por el ${next === 'L' ? 'izquierdo' : 'derecho'}`, 'c-feed', `data-side="${next}"`)}
        ${tile('form-bottle', 'bottle', 'Biberón', 'Leche materna o fórmula', 'c-feed')}
        ${tile('form-meal', 'leaf', 'Comida BLW', 'Alimentos y reacciones', 'c-blw')}
        ${tile('form-diaper', 'diaper', 'Pañal', 'Pipí, caca y color', 'c-diaper')}
        ${tile('form-measure', 'ruler', 'Medida', 'Peso, talla, cabeza', 'c-growth')}
        ${tile('form-temp', 'thermo', 'Temperatura', 'Control de fiebre', 'c-health')}
        ${tile('form-med', 'pill', 'Medicación', 'Dosis y hora', 'c-health')}
        ${tile('form-appt', 'calendar', 'Cita médica', 'Con preguntas', 'c-growth')}
        ${tile('form-pump', 'pump', 'Extracción', 'Leche extraída', 'c-feed')}
        ${tile('form-diary', 'book', 'Recuerdo', 'Nota y foto', 'c-mile')}
      </div>
      <div class="qa-diapers"><span>Pañal en un toque</span>
        <button type="button" class="btn soft" data-act="diaper-quick" data-kind="wet">Pipí</button>
        <button type="button" class="btn soft" data-act="diaper-quick" data-kind="dirty">Caca</button>
        <button type="button" class="btn soft" data-act="diaper-quick" data-kind="mixed">Ambos</button></div>`
    });
  };
  A.more = () => {
    const cur = UI.current();
    UI.sheet({
      title: 'Todas las secciones', footer: false,
      body: `<nav class="more-grid">${UI.NAV.map((n) => `<a href="#${n.id}" class="more-link ${n.cls || ''} ${cur === n.id ? 'on' : ''}" data-act="close-sheet">${icon(n.icon)}<span>${n.name}</span></a>`).join('')}</nav>`
    });
  };

  /* Accesos genéricos a formularios: data-act="form-xxx" [data-id] */
  const forms = {
    sleep: (id) => F.sleep(id && Store.get('sleeps', id)),
    feed: (id) => F.feed(id && Store.get('feeds', id)),
    bottle: () => F.feed(null, 'bottle'),
    diaper: (id) => F.diaper(id && Store.get('diapers', id)),
    meal: (id, el) => F.meal(id && Store.get('meals', id), el.dataset.food),
    measure: (id) => F.measure(id && Store.get('measures', id)),
    appt: (id, el) => F.appt(id && Store.get('appointments', id), el.dataset.title ? { title: el.dataset.title, type: el.dataset.type || 'revision', date: el.dataset.date } : undefined),
    vaccine: (id, el) => F.vaccine(el.dataset.code),
    med: (id) => F.med(id && Store.get('meds', id)),
    temp: (id) => F.temp(id && Store.get('temps', id)),
    pump: (id) => F.pump(id && Store.get('pumps', id)),
    event: (id, el) => F.event(id && Store.get('events', id), el.dataset.date),
    diary: (id) => F.diary(id && Store.get('diary', id)),
    milestone: (id) => F.milestone(id),
    tooth: (id) => F.tooth(id)
  };
  Object.entries(forms).forEach(([k, fn]) => { A['form-' + k] = (el) => fn(el.dataset.id, el); });
  /* Edición desde la línea de tiempo */
  A.edit = (el) => {
    const map = { sleeps: 'sleep', feeds: 'feed', diapers: 'diaper', meals: 'meal', meds: 'med', temps: 'temp', pumps: 'pump', appointments: 'appt', events: 'event', diary: 'diary', measures: 'measure' };
    forms[map[el.dataset.col]](el.dataset.id, el);
  };

  A['close-sheet'] = () => UI.closeSheet();
  A['sheet-delete'] = () => UI._onDelete && UI._onDelete();
  A.undo = () => { if (UI._undo) { UI._undo(); UI._undo = null; document.getElementById('toast').hidden = true; } };
  A.seg = (el) => { UI.st.seg[el.dataset.seg] = el.dataset.val; UI.render(); };
  A.go = (el) => UI.go(el.dataset.to);
})(window.Nido = window.Nido || {});
