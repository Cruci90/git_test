/* ==========================================================================
   Nido · Registro de sueño
   Formulario completo y cronómetros:
     a la cuna → dormida (latencia) · cómo se durmió · pausas en la siesta ·
     despertares nocturnos con motivo y cómo volvió a dormirse · saltar siesta.
   El estado del cronómetro vive en Store.state.timers, así que se comparte
   con los demás cuidadores y sobrevive a cerrar la app.
     timers.sleep     = { babyId, phase: 'down'|'asleep', down?, start, type?, how?, pauses: [{a, b?}], after? }
     timers.nightWake = { babyId, start, reason?, soothe?, feed }
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const { f } = UI;
  const A = N.actions, F = N.Forms;
  const T = () => Store.state.timers;
  const name = (list, id) => (list.find((x) => x.id === id) || {}).name || '';
  const emo = (list, id) => (list.find((x) => x.id === id) || {}).emoji || '';
  N.sleepLabels = { how: (id) => name(N.SLEEP_HOW, id), reason: (id) => name(N.WAKE_REASONS, id), soothe: (id) => name(N.SOOTHE, id), emo };

  /* ---------- Formulario ---------- */
  const timeOrEmpty = (t) => (t ? U.timeInput(t) : '');
  F.sleep = (rec) => {
    const now = Date.now();
    const h = new Date(now).getHours();
    const s = rec || { start: now - 60 * U.MIN, end: now, type: h >= 19 || h < 7 ? 'night' : 'nap', place: 'Cuna', quality: 3 };
    const [d0, t0] = [U.dateInput(s.start), U.timeInput(s.start)];
    const pauseRow = (p, i) => `<div class="pause-row" data-i="${i}"><label class="fld"><span>Se despertó</span><input type="time" name="pa[]" value="${timeOrEmpty(p && p.a)}"></label><label class="fld"><span>Se volvió a dormir</span><input type="time" name="pb[]" value="${timeOrEmpty(p && p.b)}"></label><button type="button" class="icon-btn sm" data-x="del-pause" aria-label="Quitar">${icon('x')}</button></div>`;
    const af = s.after || {};
    UI.sheet({
      title: rec ? 'Editar sueño' : 'Registrar sueño',
      body: f.chips('type', 'Tipo', [['nap', 'Siesta'], ['night', 'Noche']], s.type) +
        f.row(f.date('d0', 'Día', d0),
          `<label class="fld"><span>A la cuna <small>(opcional)</small></span><input id="f-down" name="down" type="time" value="${timeOrEmpty(s.down)}"></label>`,
          f.time('t0', 'Se durmió', t0), f.time('t1', 'Se despertó', U.timeInput(s.end))) +
        f.select('how', 'Cómo se durmió', [['', 'Sin anotar'], ...N.SLEEP_HOW.map((x) => [x.id, `${x.emoji} ${x.name}`])], s.how || '') +
        `<div class="only-nap fld full"><span>Ratos despierta durante la siesta</span><div id="pauses">${(s.pauses || []).map(pauseRow).join('')}</div>
          <button type="button" class="btn soft sm" data-x="add-pause">${icon('plus')}Añadir rato despierta</button></div>` +
        `<div class="only-night">${f.row(
          f.select('after_reason', 'Si este tramo empezó tras un despertar: por qué', [['', 'No aplica'], ...N.WAKE_REASONS.map((x) => [x.id, `${x.emoji} ${x.name}`])], af.reason || ''),
          f.select('after_soothe', 'Cómo volvió a dormirse', [['', 'Sin anotar'], ...N.SOOTHE.map((x) => [x.id, `${x.emoji} ${x.name}`])], af.soothe || ''))}</div>` +
        f.row(f.select('place', 'Dónde', N.SLEEP_PLACES.map((p) => [p, p]), s.place), f.select('quality', 'Cómo durmió', [[3, 'Bien'], [2, 'Regular'], [1, 'Mal']], s.quality || 3)) +
        f.area('note', 'Nota', s.note, 'Ruido en la calle, se despertó llorando, dientes…'),
      onMount: (form) => {
        const sync = () => { form.dataset.stype = form.querySelector('[name=type]:checked').value; };
        form.addEventListener('change', sync); sync();
        form.addEventListener('click', (e) => {
          const x = e.target.closest('[data-x]'); if (!x) return;
          if (x.dataset.x === 'add-pause') { const box = form.querySelector('#pauses'); box.insertAdjacentHTML('beforeend', pauseRow(null, box.children.length)); }
          if (x.dataset.x === 'del-pause') x.closest('.pause-row').remove();
        });
      },
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('sleeps', rec.id, 'Sueño eliminado'); }),
      onSubmit: (d) => {
        const start = U.fromInputs(d.d0, d.t0);
        let end = U.fromInputs(d.d0, d.t1);
        if (end <= start) end += U.DAY;
        // Horas sin fecha: se colocan dentro del tramo (o justo antes, para "a la cuna").
        const within = (hm) => { let t = U.fromInputs(d.d0, hm); if (t < start) t += U.DAY; return t; };
        let down = null;
        if (d.down) { down = U.fromInputs(d.d0, d.down); if (down > start) down -= U.DAY; if (start - down > 3 * U.HOUR) down = null; }
        const pauses = [];
        (d.pa || []).forEach((a, i) => {
          const b = (d.pb || [])[i]; if (!a || !b) return;
          const pa = within(a); let pb = within(b); if (pb < pa) pb += U.DAY;
          if (pa > start && pb < end && pb > pa) pauses.push({ a: pa, b: pb });
        });
        const filled = (d.pa || []).filter((a, i) => a && (d.pb || [])[i]).length;
        if (d.type === 'nap' && pauses.length !== filled) {
          UI.toast('Algún rato despierta queda fuera de la siesta: revisa las horas'); return false;
        }
        const data = {
          start, end, type: d.type, place: d.place, quality: +d.quality, note: d.note, down, how: d.how || null,
          pauses: d.type === 'nap' && pauses.length ? pauses : undefined,
          after: d.type === 'night' && (d.after_reason || d.after_soothe) ? { reason: d.after_reason || null, soothe: d.after_soothe || null } : undefined
        };
        rec ? Store.update('sleeps', rec.id, data) : Store.add('sleeps', data);
        UI.toast(`${d.type === 'nap' ? 'Siesta' : 'Sueño nocturno'} de ${U.dur(S.sleepMin(data))} guardado`);
      }
    });
  };

  /* ---------- Cronómetro de sueño ---------- */
  const startTimer = (patch) => {
    const now = Date.now();
    T().sleep = Object.assign({ babyId: Store.state.activeBabyId, phase: 'asleep', start: now, pauses: [] }, patch);
    if (!T().sleep.type) T().sleep.type = S.timerType({ start: now });
    Store.commit();
  };
  /* A la cuna: empieza a contar lo que tarda en dormirse. */
  A['sleep-down'] = () => { const now = Date.now(); startTimer({ phase: 'down', down: now, start: now }); UI.closeSheet(); };
  /* Dormida: desde la cuna o directamente. */
  A['sleep-start'] = () => {
    const t = S.activeSleep();
    if (t && t.phase === 'down') { t.phase = 'asleep'; t.start = Date.now(); Store.commit(); UI.toast(`Se ha dormido en ${U.dur((t.start - t.down) / U.MIN)}`); return; }
    if (t) return;
    startTimer({}); UI.closeSheet(); UI.toast('A dormir. Cronómetro en marcha');
  };
  A['sleep-type'] = (el) => { const t = S.activeSleep(); if (t) { t.type = el.dataset.type; Store.commit(); } };
  A['sleep-how'] = (el) => { const t = S.activeSleep(); if (t) { t.how = t.how === el.dataset.how ? null : el.dataset.how; Store.commit(); } };
  A['sleep-pause'] = () => { const t = S.activeSleep(); if (t && !openPause(t)) { (t.pauses = t.pauses || []).push({ a: Date.now() }); Store.commit(); } };
  A['sleep-resume'] = () => { const t = S.activeSleep(); const p = t && openPause(t); if (p) { p.b = Date.now(); Store.commit(); } };
  const openPause = (t) => (t.pauses || []).find((p) => !p.b);

  /* Cierra el tramo en curso y lo guarda. Devuelve el registro (o null si era demasiado corto). */
  const closeSleep = (t, end) => {
    const op = openPause(t);
    if (op) { end = Math.min(end, op.a); t.pauses = t.pauses.filter((p) => p !== op); }
    if (t.phase === 'down') return null;
    if (end - t.start < U.MIN) return null;
    const pauses = (t.pauses || []).filter((p) => p.b && p.b > p.a && p.b <= end);
    return Store.add('sleeps', {
      start: t.start, end, type: S.timerType(t), place: 'Cuna', quality: 3,
      down: t.down && t.down < t.start ? t.down : null, how: t.how || null,
      pauses: pauses.length ? pauses : undefined, after: t.after || undefined, routine: t.routine || undefined
    });
  };
  A['sleep-stop'] = () => {
    const t = S.activeSleep(); if (!t) return;
    delete T().sleep;
    if (t.phase === 'down') { Store.commit(); UI.toast('No llegó a dormirse: no se guarda'); return; }
    const rec = closeSleep(t, Date.now());
    if (!rec) { Store.commit(); UI.toast('Cronómetro descartado (menos de 1 min)'); return; }
    UI.toast(`${rec.type === 'night' ? 'Buenos días. Ha dormido' : 'Ha dormido'} ${U.dur(S.sleepMin(rec))}`, () => Store.remove('sleeps', rec.id));
  };
  A['sleep-cancel'] = () => { delete T().sleep; Store.commit(); };

  /* ---------- Despertares nocturnos ---------- */
  A['night-wake'] = () => {
    const t = S.activeSleep(); if (!t) return;
    const now = Date.now();
    delete T().sleep;
    closeSleep(Object.assign({}, t, { type: 'night' }), now);
    T().nightWake = { babyId: Store.state.activeBabyId, start: now, reason: null, soothe: null, feed: true };
    Store.commit();
  };
  A['nw-reason'] = (el) => { const w = S.activeNightWake(); if (w) { w.reason = w.reason === el.dataset.v ? null : el.dataset.v; Store.commit(); } };
  A['nw-soothe'] = (el) => { const w = S.activeNightWake(); if (w) { w.soothe = w.soothe === el.dataset.v ? null : el.dataset.v; Store.commit(); } };
  A['nw-feed'] = () => { const w = S.activeNightWake(); if (w) { w.feed = !w.feed; Store.commit(); } };
  /* Vuelve a dormir: el nuevo tramo guarda por qué se despertó y cómo volvió. Si fue con pecho
     o biberón, se anota también la toma. */
  A['nw-sleep'] = () => {
    const w = S.activeNightWake(); if (!w) return;
    const now = Date.now();
    delete T().nightWake;
    if (w.feed && (w.soothe === 'pecho' || w.soothe === 'biberon')) {
      const min = Math.max(1, Math.round((now - w.start) / U.MIN));
      Store.state.feeds.push(Object.assign({ id: U.uid(), babyId: w.babyId, by: Store.state.settings.caregiver, time: w.start, note: 'Despertar nocturno' },
        w.soothe === 'pecho' ? { kind: 'breast', durL: min, durR: 0, sideUnknown: true } : { kind: 'bottle', ml: null, milk: 'materna' }));
    }
    startTimer({ type: 'night', after: { reason: w.reason, soothe: w.soothe } });
    UI.toast(`Despierta ${U.dur((now - w.start) / U.MIN)}. Sigue la noche`);
  };
  A['nw-up'] = () => { const w = S.activeNightWake(); if (!w) return; delete T().nightWake; Store.commit(); UI.toast('Buenos días'); };
  A['nw-cancel'] = () => { delete T().nightWake; Store.commit(); };

  /* ---------- Saltar una siesta ---------- */
  A['nap-skip'] = () => {
    const rec = Store.add('skips', { date: U.today(), time: Date.now() });
    UI.toast('Siesta saltada: el plan del día se ha recolocado', () => Store.remove('skips', rec.id));
  };
  A['nap-unskip'] = (el) => { Store.remove('skips', el.dataset.id); UI.toast('Siesta recuperada en el plan'); };

  /* ---------- Tarjetas en vivo ---------- */
  const chips = (list, sel, act) => `<div class="live-chips">${list.map((x) => `<button type="button" class="lchip ${sel === x.id ? 'on' : ''}" data-act="${act}" data-${act === 'sleep-how' ? 'how' : 'v'}="${x.id}" aria-pressed="${sel === x.id}">${x.emoji} ${x.name}</button>`).join('')}</div>`;

  N.W.liveSleep = () => {
    const w = S.activeNightWake();
    if (w) {
      const fed = w.soothe === 'pecho' || w.soothe === 'biberon';
      return `<section class="live live-sleep night-sky is-awake">
        <div class="live-top"><span class="eyebrow">${icon('sun')} Despierta de noche desde las ${U.time(w.start)}</span><button type="button" class="link" data-act="nw-cancel">Descartar</button></div>
        <b class="live-clock sm" data-since="${w.start}">00:00</b>
        <div class="live-q"><small>¿Por qué se ha despertado?</small>${chips(N.WAKE_REASONS, w.reason, 'nw-reason')}</div>
        <div class="live-q"><small>¿Cómo vuelve a dormirse?</small>${chips(N.SOOTHE, w.soothe, 'nw-soothe')}</div>
        ${fed ? `<label class="lcheck"><input type="checkbox" data-act="nw-feed" ${w.feed ? 'checked' : ''}><span>Anotar también como toma</span></label>` : ''}
        <div class="live-actions"><button type="button" class="btn primary" data-act="nw-sleep">${icon('moon')}Vuelve a dormir</button><button type="button" class="btn soft on-dark" data-act="nw-up">${icon('sun')}Se levanta ya</button></div>
      </section>`;
    }
    const t = S.activeSleep(); if (!t) return '';
    const type = S.timerType(t);
    const typeSeg = `<div class="seg seg-dark">${[['nap', 'Siesta'], ['night', 'Noche']].map(([v, l]) => `<button type="button" class="${type === v ? 'on' : ''}" data-act="sleep-type" data-type="${v}">${l}</button>`).join('')}</div>`;
    if (t.phase === 'down') {
      return `<section class="live live-sleep night-sky">
        <div class="live-top"><span class="eyebrow">${icon('bed')} En la cuna desde las ${U.time(t.down)}</span>${typeSeg}</div>
        <div><b class="live-clock" data-since="${t.down}">00:00</b><p class="live-sub">intentando dormirse${S.learnRhythm().latency ? ` · suele tardar ${U.dur(S.learnRhythm().latency)}` : ''}</p></div>
        <div class="live-q"><small>¿Cómo se está durmiendo?</small>${chips(N.SLEEP_HOW, t.how, 'sleep-how')}</div>
        <div class="live-actions"><button type="button" class="btn primary" data-act="sleep-start">${icon('moon')}Se ha dormido</button><button type="button" class="link" data-act="sleep-cancel">Descartar</button></div>
      </section>`;
    }
    const p = openPause(t);
    const lat = t.down && t.down < t.start ? `tardó ${U.dur((t.start - t.down) / U.MIN)} en dormirse` : '';
    const pausedMin = U.sum((t.pauses || []).filter((x) => x.b), (x) => x.b - x.a) / U.MIN;
    return `<section class="live live-sleep night-sky ${p ? 'is-awake' : ''}">
      <div class="live-top"><span class="eyebrow">${icon(p ? 'sun' : 'moon')} ${p ? `Despierta un momento desde las ${U.time(p.a)}` : `${type === 'nap' ? 'Siesta' : 'Durmiendo'} desde las ${U.time(t.start)}`}</span>${typeSeg}</div>
      <div><b class="live-clock" data-since="${p ? p.a : t.start}">00:00</b><p class="live-sub">${[lat, t.how ? `${emo(N.SLEEP_HOW, t.how)} ${name(N.SLEEP_HOW, t.how).toLowerCase()}` : '', pausedMin >= 1 ? `${U.dur(pausedMin)} despierta en pausas` : ''].filter(Boolean).join(' · ')}</p></div>
      ${!t.how && !p ? `<div class="live-q"><small>¿Cómo se durmió?</small>${chips(N.SLEEP_HOW, t.how, 'sleep-how')}</div>` : ''}
      <div class="live-actions">${type === 'nap'
        ? (p ? `<button type="button" class="btn primary" data-act="sleep-resume">${icon('moon')}Sigue durmiendo</button><button type="button" class="btn soft on-dark" data-act="sleep-stop">${icon('sun')}Terminar siesta</button>`
          : `<button type="button" class="btn primary" data-act="sleep-stop">${icon('sun')}Se ha despertado</button><button type="button" class="btn soft on-dark" data-act="sleep-pause">${icon('pause')}Pausa</button>`)
        : `<button type="button" class="btn primary" data-act="night-wake">${icon('sun')}Despertar nocturno</button><button type="button" class="btn soft on-dark" data-act="sleep-stop">${icon('sun')}Buenos días</button>`}
        <button type="button" class="link on-dark" data-act="sleep-cancel">Descartar</button></div>
    </section>`;
  };

  /* ---------- Resumen de una noche ---------- */
  N.W.night = (n, title) => {
    if (!n) return '';
    const span = n.end - (n.down || n.start);
    const pct = (t) => (((t - (n.down || n.start)) / span) * 100).toFixed(2);
    const bar = `<div class="nbar" aria-hidden="true">${n.down && n.latency ? `<i class="nb-lat" style="left:0;width:${pct(n.start)}%"></i>` : ''}${n.blocks.map((b) => `<i class="nb-sleep" style="left:${pct(b.start)}%;width:${(pct(b.end) - pct(b.start)).toFixed(2)}%"></i>`).join('')}</div>
      <div class="nbar-t"><span>${U.time(n.down || n.start)}</span><span>${U.time(n.end)}</span></div>`;
    return N.W.card(title, `<div class="night-sum">
        <div class="ns-main"><b>${U.dur(n.total)}</b><span>dormida · ${U.time(n.start)} → ${U.time(n.end)}</span></div>
        <div class="ns-pills">${UI.pill(`${n.wakes} despertar${n.wakes === 1 ? '' : 'es'}${n.wakes ? ` · ${U.dur(n.awake)}` : ''}`, n.wakes >= 3 ? 'warn' : 'soft')}
          ${n.latency != null ? UI.pill(`tardó ${U.dur(n.latency)} en dormirse`, n.latency > 30 ? 'warn' : 'muted') : ''}
          ${n.how ? UI.pill(`${emo(N.SLEEP_HOW, n.how)} ${name(N.SLEEP_HOW, n.how).toLowerCase()}`, 'muted') : ''}
          ${UI.pill(`tramo más largo ${U.dur(n.longest)}`, 'muted')}</div>
        ${bar}
        ${n.wakings.length ? `<ul class="wakes">${n.wakings.map((w) => `<li><button type="button" class="wk" data-act="edit" data-col="sleeps" data-id="${w.id}"><time>${U.time(w.a)}</time><span>${U.dur(w.min)} despierta</span><span class="wk-why">${w.reason ? `${emo(N.WAKE_REASONS, w.reason)} ${name(N.WAKE_REASONS, w.reason)}` : '<i>sin motivo</i>'}${w.soothe ? ` → ${emo(N.SOOTHE, w.soothe)} ${name(N.SOOTHE, w.soothe)}` : ''}</span></button></li>`).join('')}</ul>` : '<p class="muted small">Durmió del tirón.</p>'}
      </div>`, { cls: 'c-sleep' });
  };
})(window.Nido = window.Nido || {});

/* ==========================================================================
   Nido · Ajustes del plan de sueño
   Ajuste manual de ventanas, horas fijas, transición de siestas, días
   difíciles y cambio de hora. Todo se guarda en sleepPrefs del bebé.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const A = N.actions;
  const save = (patch) => { Object.assign(S.prefs(), patch); Store.commit(); };

  /* Avisos que se muestran encima del plan. */
  N.W.planAlerts = () => {
    const out = [], prefs = S.prefs(), today = U.today();
    const hard = S.hardDay(today);
    if (hard) {
      out.push(`<div class="palert is-hard"><span>${(N.HARD_DAYS.find((x) => x.id === hard.reason) || {}).emoji || '🌀'}</span><div><b>Día difícil: ${N.HARD_DAY_LABEL(hard.reason)}${hard.from < today ? ` (desde el ${U.date(hard.from)})` : ''}</b>
        <small>Ventanas un 15 % más cortas y la noche puede adelantarse a las 18:00. Estos días no se usan para aprender su ritmo.</small></div>
        <button type="button" class="btn soft sm" data-act="hard-end">Ya está mejor</button></div>`);
    }
    const dst = S.dstUpcoming();
    if (dst && !(prefs.dst && prefs.dst.date === dst.date && prefs.dst.dismissed)) {
      const back = dst.dir === 'back', when = U.dateLong(dst.date);
      const applied = prefs.dst && prefs.dst.date === dst.date && prefs.dst.mode === 'gradual';
      if (dst.days > 0) {
        out.push(`<div class="palert is-dst"><span>🕒</span><div><b>Cambio de hora el ${when} (${dst.days === 1 ? 'mañana' : `en ${dst.days} días`})</b>
          <small>${back ? 'A las 3:00 serán las 2:00: por el reloj, querrá despertarse una hora antes.' : 'A las 2:00 serán las 3:00: por el reloj, tendrá sueño una hora más tarde.'}
          ${applied ? 'Plan gradual activado: ' : 'Plan gradual: '}${dst.plan.map((p) => `${U.WEEKDAYS[new Date(U.parseDay(p.date)).getDay()]} ${p.shift > 0 ? '+' : '−'}${Math.abs(p.shift)}`).join(' · ')} min sobre su horario.</small></div>
          ${applied ? `<button type="button" class="link sm" data-act="dst-off">Quitar</button>` : `<div class="palert-act"><button type="button" class="btn primary sm" data-act="dst-on" data-date="${dst.date}">Hacerlo gradual</button><button type="button" class="link sm" data-act="dst-dismiss" data-date="${dst.date}">De golpe</button></div>`}</div>`);
      } else {
        out.push(`<div class="palert is-dst"><span>🕒</span><div><b>${dst.days === 0 ? 'Hoy' : `Hace ${-dst.days} días`} ha cambiado la hora</b>
          <small>Suele tardar entre 3 y 7 días en ajustarse. Mantén luz natural por la mañana, habitación a oscuras de noche y no adelantes${back ? ' el levantarse aunque se despierte antes' : ''}.</small></div>
          <button type="button" class="link sm" data-act="dst-dismiss" data-date="${dst.date}">Entendido</button></div>`);
      }
    }
    const tr = S.napTransition();
    if (prefs.targetNaps && S.learnRhythm().transition) {
      out.push(`<div class="palert is-tr"><span>🔁</span><div><b>Transición a ${prefs.targetNaps} siesta${prefs.targetNaps > 1 ? 's' : ''} en marcha${prefs.transitionFrom ? ` desde el ${U.date(prefs.transitionFrom)}` : ''}</b>
        <small>Ventanas más largas. Algunos días necesitará la siesta de antes: sáltate el plan y vuelve a él al día siguiente. Tras una noche corta, acuéstala hasta 30 min antes.</small></div>
        <button type="button" class="link sm" data-act="tr-cancel">Volver a ${prefs.targetNaps + 1}</button></div>`);
    } else if (tr && tr.ready && !prefs.targetNaps && prefs.trDismissed !== `${tr.from}:${today.slice(0, 7)}`) {
      out.push(`<div class="palert is-tr"><span>🔁</span><div><b>Puede estar lista para pasar de ${tr.from} a ${tr.to} siesta${tr.to > 1 ? 's' : ''}</b>
        <small>Lo habitual es entre los ${tr.age[0]} y ${tr.age[1]} meses. Señales: ${tr.signals.join('; ')}.</small></div>
        <div class="palert-act"><button type="button" class="btn primary sm" data-act="tr-start" data-n="${tr.to}">Empezar transición</button><button type="button" class="link sm" data-act="tr-dismiss" data-k="${tr.from}:${today.slice(0, 7)}">Aún no</button></div></div>`);
    }
    if (prefs.shift || prefs.wakeTarget || prefs.bedTarget) {
      const bits = [prefs.shift ? `ventanas ${prefs.shift > 0 ? '+' : '−'}${Math.abs(prefs.shift)} min` : '', prefs.wakeTarget ? `despertar ${prefs.wakeTarget}` : '', prefs.bedTarget ? `a la cama ${prefs.bedTarget}` : ''].filter(Boolean);
      out.push(`<p class="ptweaks">${icon('cog', 'sm')} Ajustes vuestros: ${bits.join(' · ')} <button type="button" class="link sm" data-act="plan-adjust">Cambiar</button></p>`);
    }
    return out.join('');
  };

  /* Hoja de ajustes del plan. */
  A['plan-adjust'] = () => {
    const p = S.prefs(), r = S.learnRhythm(), hard = S.hardDay(U.today());
    const shift = p.shift || 0;
    UI.sheet({
      title: 'Ajustar el plan de sueño', submit: 'Guardar',
      body: `<fieldset class="fld full"><legend>¿Qué tal le van las horas del plan?</legend>
          <div class="shift-pick">
            <button type="button" class="btn soft" data-x="shift" data-d="-10">Le entra el sueño antes<small>acortar ventanas 10 min</small></button>
            <output id="shift-out">${shift ? `${shift > 0 ? '+' : '−'}${Math.abs(shift)} min` : 'Sin ajuste'}</output>
            <button type="button" class="btn soft" data-x="shift" data-d="10">A esa hora aún no tiene sueño<small>alargar ventanas 10 min</small></button>
          </div><input type="hidden" name="shift" value="${shift}">
          <p class="hint">Se suma a lo que aprende de sus registros. Puedes repetirlo hasta ±45 min.</p></fieldset>` +
        UI.f.row(`<label class="fld"><span>Hora de despertar fija <small>(opcional)</small></span><input type="time" name="wakeTarget" value="${p.wakeTarget || ''}"></label>`,
          `<label class="fld"><span>Hora de dormir fija <small>(opcional)</small></span><input type="time" name="bedTarget" value="${p.bedTarget || ''}"></label>`) +
        '<p class="hint">Útil si la guardería o el trabajo marcan el horario. El plan reparte las siestas para llegar a esa hora.</p>' +
        UI.f.select('targetNaps', 'Siestas al día', [['', `Automático (ahora ${r.natural})`], ...[4, 3, 2, 1].map((n) => [n, `${n} siesta${n > 1 ? 's' : ''}`])], p.targetNaps || '') +
        `<fieldset class="fld full"><legend>¿Hoy es un día difícil?</legend><div class="chips">
          <label class="chip"><input type="radio" name="hard" value="" ${!hard ? 'checked' : ''}><span>No</span></label>
          ${N.HARD_DAYS.map((h) => `<label class="chip"><input type="radio" name="hard" value="${h.id}" ${hard && hard.reason === h.id ? 'checked' : ''}><span>${h.emoji} ${h.name}</span></label>`).join('')}</div>
          <p class="hint">Hace el plan más suave y no aprende de estos días. Sigue activo hasta que pulses «Ya está mejor».</p></fieldset>`,
      onMount: (form) => form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-x=shift]'); if (!b) return;
        const inp = form.querySelector('[name=shift]'), v = U.clamp(Number(inp.value) + Number(b.dataset.d), -45, 45);
        inp.value = v; form.querySelector('#shift-out').textContent = v ? `${v > 0 ? '+' : '−'}${Math.abs(v)} min` : 'Sin ajuste';
      }),
      onSubmit: (x) => {
        const patch = { shift: Number(x.shift) || 0, wakeTarget: x.wakeTarget || null, bedTarget: x.bedTarget || null };
        const tn = x.targetNaps ? Number(x.targetNaps) : null;
        if (tn !== (p.targetNaps || null)) Object.assign(patch, { targetNaps: tn, transitionFrom: tn ? U.today() : null });
        Object.assign(p, patch);
        setHard(x.hard || null, true);
        Store.commit(); UI.toast('Plan ajustado');
      }
    });
  };

  /* Abre o cierra el día difícil de hoy. Un día difícil sigue activo hasta que se cierra. */
  const setHard = (reason, silent) => {
    const p = S.prefs(), today = U.today(), list = (p.hard = p.hard || []);
    const cur = S.hardDay(today);
    if (cur && cur.reason === reason) return;
    if (cur) { if (cur.from === today) list.splice(list.indexOf(cur), 1); else cur.to = U.dayKey(U.addDays(U.parseDay(today), -1)); }
    if (reason) list.push({ from: today, to: null, reason });
    if (!silent) Store.commit();
  };
  A['hard-end'] = () => { setHard(null); UI.toast('Vuelve el plan normal'); };
  A['dst-on'] = (el) => save({ dst: { date: el.dataset.date, mode: 'gradual' } });
  A['dst-off'] = () => save({ dst: null });
  A['dst-dismiss'] = (el) => save({ dst: { date: el.dataset.date, mode: 'sudden', dismissed: true } });
  A['tr-start'] = (el) => { save({ targetNaps: Number(el.dataset.n), transitionFrom: U.today() }); UI.toast(`Plan con ${el.dataset.n} siestas`); };
  A['tr-cancel'] = () => save({ targetNaps: null, transitionFrom: null });
  A['tr-dismiss'] = (el) => save({ trDismissed: el.dataset.k });
})(window.Nido = window.Nido || {});

/* ==========================================================================
   Nido · Rutina de dormir
   Pasos con temporizador; al terminar se anotan las actividades (baño,
   masaje, cuento, música) y empieza «A la cuna», marcando el sueño como
   precedido de rutina para comparar cuánto tarda en dormirse.
     timers.routine = { babyId, start, step, stepStart, log: [{ id, a, b }] }
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const A = N.actions, T = () => Store.state.timers;

  A['routine-start'] = () => {
    if (!S.routine().length) { UI.toast('La rutina no tiene pasos: edítala primero'); return; }
    const now = Date.now();
    T().routine = { babyId: Store.state.activeBabyId, start: now, step: 0, stepStart: now, log: [] };
    Store.commit(); UI.closeSheet();
  };
  A['routine-next'] = () => {
    const r = S.activeRoutine(); if (!r) return;
    const steps = S.routine(), now = Date.now();
    r.log.push({ id: steps[r.step].id, a: r.stepStart, b: now });
    r.step++; r.stepStart = now;
    if (r.step >= steps.length) return A['routine-finish']();
    Store.commit();
  };
  /* Termina la rutina: anota actividades y deja a la bebé «en la cuna». */
  A['routine-finish'] = () => {
    const r = S.activeRoutine(); if (!r) return;
    const steps = S.routine(), now = Date.now();
    if (r.step < steps.length && !r.log.some((l) => l.id === steps[r.step].id)) r.log.push({ id: steps[r.step].id, a: r.stepStart, b: now });
    r.log.forEach((l) => {
      const st = steps.find((x) => x.id === l.id) || N.ROUTINE_STEPS.find((x) => x.id === l.id);
      const dur = Math.round((l.b - l.a) / U.MIN);
      if (st && st.act && dur >= 1) Store.state.activities.push({ id: U.uid(), babyId: r.babyId, by: Store.state.settings.caregiver, time: l.a, kind: st.act, dur, note: 'Rutina de dormir' });
    });
    delete T().routine;
    T().sleep = { babyId: r.babyId, phase: 'down', down: now, start: now, type: 'night', pauses: [], routine: true };
    Store.commit();
    UI.toast(now - r.start < U.MIN ? 'Rutina hecha. A la cuna' : `Rutina de ${U.dur((now - r.start) / U.MIN)}. A la cuna`);
  };
  A['routine-cancel'] = () => { delete T().routine; Store.commit(); };

  N.W.liveRoutine = () => {
    const r = S.activeRoutine(); if (!r) return '';
    const steps = S.routine(), cur = steps[r.step] || steps[steps.length - 1];
    const planned = U.sum(steps, (x) => x.min), endAt = r.stepStart + (cur.min || 0) * U.MIN;
    return `<section class="live live-sleep night-sky routine">
      <div class="live-top"><span class="eyebrow">${icon('moon')} Rutina de dormir · paso ${r.step + 1} de ${steps.length}</span><button type="button" class="link on-dark" data-act="routine-cancel">Descartar</button></div>
      <div class="rt-now"><span class="rt-e">${cur.emoji || '✨'}</span><div><b>${U.esc(cur.name)}</b><small>${cur.min} min previstos · quedan <span data-until="${endAt}"></span></small></div></div>
      <ol class="rt-steps">${steps.map((x, i) => `<li class="${i < r.step ? 'done' : i === r.step ? 'now' : ''}"><span>${x.emoji || '✨'}</span>${U.esc(x.name)}<em>${x.min}′</em></li>`).join('')}</ol>
      <p class="live-sub">Empezó a las ${U.time(r.start)} · ${planned} min en total</p>
      <div class="live-actions">${r.step < steps.length - 1 ? `<button type="button" class="btn primary" data-act="routine-next">${icon('check')}Siguiente: ${U.esc(steps[r.step + 1].name)}</button>` : ''}
        <button type="button" class="btn ${r.step < steps.length - 1 ? 'soft on-dark' : 'primary'}" data-act="routine-finish">${icon('bed')}Terminar y a la cuna</button></div>
    </section>`;
  };

  /* Tarjeta de la rutina en Sueño. */
  N.W.routine = () => {
    const steps = S.routine(), total = S.routineTotal();
    const plan = S.dayPlan(), bed = plan.items[plan.items.length - 1];
    const startAt = bed.t - total * U.MIN;
    const nights = S.sleeps().filter((s) => s.type === 'night' && s.start > Date.now() - 21 * U.DAY && s.down && S.latency(s) != null);
    const withR = nights.filter((s) => s.routine).map(S.latency), without = nights.filter((s) => !s.routine).map(S.latency);
    const insight = withR.length >= 3 && without.length >= 3
      ? `<p class="note">${icon('info')}<span>Con rutina tarda de media <b>${U.dur(U.avg(withR))}</b> en dormirse; sin ella, <b>${U.dur(U.avg(without))}</b>.</span></p>` : '';
    return N.W.card('Rutina de dormir', `
      ${steps.length ? `<ol class="rt-list">${steps.map((x) => `<li><span>${x.emoji || '✨'}</span>${U.esc(x.name)}<em>${x.min} min</em></li>`).join('')}</ol>
      <p class="muted small">${total} min en total.${bed.state !== 'done' ? ` Para estar en la cuna a las <b>${U.time(bed.t)}</b>, empieza hacia las <b>${U.time(startAt)}</b>.` : ''} Hacerla siempre en el mismo orden le ayuda a anticipar que llega la noche.</p>` : '<p class="muted">Sin pasos. Añade alguno para usar el temporizador.</p>'}
      ${insight}
      <div class="btn-row">${S.activeRoutine() ? '' : `<button type="button" class="btn primary" data-act="routine-start">${icon('play')}Empezar rutina</button>`}<button type="button" class="btn soft" data-act="routine-edit">${icon('edit')}Editar pasos</button></div>`, { cls: 'c-sleep' });
  };

  A['routine-edit'] = () => {
    const saved = S.prefs().routine;
    const rows = (saved || N.ROUTINE_STEPS.map((x) => ({ id: x.id, on: true, min: x.min }))).map((x) => Object.assign({}, N.ROUTINE_STEPS.find((d) => d.id === x.id) || {}, x));
    N.ROUTINE_STEPS.forEach((d) => { if (!rows.some((x) => x.id === d.id)) rows.push(Object.assign({}, d, { on: false })); });
    const row = (x) => `<div class="rt-edit"><label class="chip"><input type="checkbox" name="on_${x.id}" ${x.on !== false ? 'checked' : ''}><span>${x.emoji || '✨'} ${U.esc(x.name)}</span></label>
      <span class="unit-wrap"><input type="number" name="min_${x.id}" value="${x.min}" min="1" max="60" aria-label="Minutos de ${U.esc(x.name)}"><i>min</i></span></div>`;
    UI.sheet({
      title: 'Pasos de la rutina', submit: 'Guardar',
      body: `<p class="muted small">Marca los pasos que hacéis y cuánto suelen durar. El orden es el de la lista.</p>
        <div class="rt-edits">${rows.map(row).join('')}</div>
        ${UI.f.row(UI.f.text('custom', 'Añadir un paso propio', '', 'placeholder="Ej.: lavar los dientes"'), UI.f.num('custom_min', 'Minutos', 5, 'min="1" max="60"'))}`,
      onSubmit: (x) => {
        const out = rows.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, act: r.act, on: !!x['on_' + r.id], min: Math.max(1, Number(x['min_' + r.id]) || r.min) }));
        if ((x.custom || '').trim()) out.push({ id: 'c_' + U.uid(), name: x.custom.trim(), emoji: '✨', on: true, min: Math.max(1, Number(x.custom_min) || 5) });
        S.prefs().routine = out; Store.commit(); UI.toast('Rutina guardada');
      }
    });
  };
})(window.Nido = window.Nido || {});

/* ==========================================================================
   Nido · Tendencias de sueño por semanas
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, UI, Charts } = N;
  const clock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  const hours = (min) => `${U.num(min / 60, min % 60 ? 1 : 0)} h`;
  /* Métricas: valor, formato, paso del eje y si subir es bueno (+1), malo (−1) o neutro (0). */
  const METRICS = [
    { k: 'total', name: 'Sueño total al día', fmt: hours, axis: (v) => `${Math.round(v / 60)}h`, step: 60, good: 0 },
    { k: 'night', name: 'Sueño de noche', fmt: hours, axis: (v) => `${Math.round(v / 60)}h`, step: 60, good: 1 },
    { k: 'wakes', name: 'Despertares por noche', fmt: (v) => U.num(v, 1), axis: (v) => U.num(v, 0), step: 1, good: -1 },
    { k: 'longest', name: 'Tramo más largo', fmt: hours, axis: (v) => `${Math.round(v / 60)}h`, step: 60, good: 1 },
    { k: 'bed', name: 'Se acuesta', fmt: clock, axis: clock, step: 30, good: 0 },
    { k: 'wake', name: 'Se despierta', fmt: clock, axis: clock, step: 30, good: 0 },
    { k: 'latency', name: 'Tarda en dormirse', fmt: (v) => U.dur(v), axis: (v) => `${Math.round(v)}m`, step: 5, good: -1 },
    { k: 'naps', name: 'Siestas al día', fmt: (v) => U.num(v, 1), axis: (v) => U.num(v, 0), step: 1, good: 0 }
  ];

  N.W.trends = () => {
    const n = UI.st.trendWeeks || 8;
    const weeks = S.sleepWeeks(n);
    const label = (w) => { const d = new Date(U.parseDay(w.start)); return `${d.getDate()} ${U.MONTHS[d.getMonth()]}`; };
    // Comparación: últimos 7 días frente a los 7 anteriores.
    const today = U.dayStart(Date.now());
    const cur = S.sleepStats(U.addDays(today, -7), 7), prev = S.sleepStats(U.addDays(today, -14), 7);
    const delta = (m) => {
      const a = cur[m.k], b = prev[m.k]; if (a == null || b == null) return '<span class="delta same">–</span>';
      const d = a - b, small = m.k === 'wakes' || m.k === 'naps' ? Math.abs(d) < 0.3 : Math.abs(d) < 10;
      if (small) return '<span class="delta same">igual</span>';
      const txt = m.k === 'wakes' || m.k === 'naps' ? `${d > 0 ? '+' : '−'}${U.num(Math.abs(d), 1)}` : `${d > 0 ? '+' : '−'}${U.dur(Math.abs(d))}`;
      const tone = m.good === 0 ? 'same' : (d > 0) === (m.good > 0) ? 'good' : 'bad';
      return `<span class="delta ${tone}">${txt}</span>`;
    };
    const boxes = METRICS.map((m) => {
      const pts = weeks.map((w) => ({ label: label(w), v: w[m.k], tip: w[m.k] == null ? '' : `Semana del ${label(w)}|${m.name}: ${m.fmt(w[m.k])}|${w.days} días con datos` }));
      const last = [...weeks].reverse().find((w) => w[m.k] != null);
      return `<div class="trend-box"><h3>${m.name}<b>${last ? m.fmt(last[m.k]) : '–'}</b></h3>${Charts.trend(pts, { fmt: m.axis, step: m.step })}</div>`;
    }).join('');
    return N.W.card('Tendencias por semanas', `<div class="chart-top">${UI.seg('trendWeeks', [[4, '4 semanas'], [8, '8 semanas'], [12, '12 semanas']], n)}<span class="muted small">Media por día de cada semana (lunes a domingo)</span></div>
      <div class="trends">${boxes}</div>
      <h3 class="day-h pad-t">Últimos 7 días frente a los 7 anteriores</h3>
      <div class="scroll-x"><table class="wow"><thead><tr><th>Medida</th><th class="num">Últimos 7 días</th><th class="num">7 anteriores</th><th class="num">Cambio</th></tr></thead><tbody>
        ${METRICS.map((m) => `<tr><td>${m.name}</td><td class="num"><b>${cur[m.k] == null ? '–' : m.fmt(cur[m.k])}</b></td><td class="num">${prev[m.k] == null ? '–' : m.fmt(prev[m.k])}</td><td class="num">${delta(m)}</td></tr>`).join('')}
      </tbody></table></div>`, { cls: 'c-sleep' });
  };
  N.actions.seg = ((orig) => (el) => {
    if (el.dataset.seg === 'trendWeeks') { UI.st.trendWeeks = +el.dataset.val; UI.render(); return; }
    orig(el);
  })(N.actions.seg);
})(window.Nido = window.Nido || {});
