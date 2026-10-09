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
      pauses: pauses.length ? pauses : undefined, after: t.after || undefined
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
