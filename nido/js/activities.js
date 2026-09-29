/* ==========================================================================
   Nido · Actividades
   Tiempo boca abajo con cronómetro y objetivo diario, baño, paseo, juego,
   cuento, masaje… Se ven en la línea de tiempo y en su propia sección.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, Charts, W, icon } = N;
  const A = N.actions;
  const byId = (id) => N.ACTIVITIES.find((a) => a.id === id) || N.ACTIVITIES[N.ACTIVITIES.length - 1];
  const { f } = UI;

  /* ---------- Formulario ---------- */
  N.Forms.activity = (rec, kind) => {
    const r = rec || { time: Date.now() - 15 * U.MIN, kind: kind || 'tummy', dur: 10 };
    UI.sheet({
      title: rec ? 'Editar actividad' : 'Registrar actividad',
      body: f.chips('kind', 'Actividad', N.ACTIVITIES.map((a) => [a.id, `${a.emoji} ${a.name}`]), r.kind) +
        f.row(f.date('d', 'Día', U.dateInput(r.time)), f.time('t', 'Hora', U.timeInput(r.time)), f.num('dur', 'Duración', r.dur, 'min="0" max="600"', 'min')) +
        f.area('note', 'Nota', r.note, 'Cómo estuvo, dónde, con quién…'),
      onDelete: rec && (() => { UI.closeSheet(); UI.removeWithUndo('activities', rec.id, 'Actividad eliminada'); }),
      onSubmit: (x) => {
        const data = { time: U.fromInputs(x.d, x.t), kind: x.kind, dur: +x.dur || 0, note: x.note };
        rec ? Store.update('activities', rec.id, data) : Store.add('activities', data);
        UI.toast(`${byId(x.kind).name} guardado`);
      }
    });
  };

  /* ---------- Cronómetro ---------- */
  A['activity-start'] = (el) => {
    const cur = S.activeActivity(); if (cur) A['activity-stop']();
    Store.state.timers.activity = { babyId: Store.state.activeBabyId, kind: el.dataset.kind || 'tummy', start: Date.now() };
    Store.commit(); UI.closeSheet();
  };
  A['activity-stop'] = () => {
    const t = S.activeActivity(); if (!t) return;
    delete Store.state.timers.activity;
    const dur = Math.round((Date.now() - t.start) / U.MIN);
    if (dur < 1) { Store.commit(); UI.toast('Descartado (menos de 1 min)'); return; }
    const rec = Store.add('activities', { time: t.start, kind: t.kind, dur });
    const goal = t.kind === 'tummy' ? ` · ${Math.round(S.activityMinutes('tummy'))}/${N.TUMMY_GOAL} min hoy` : '';
    UI.toast(`${byId(t.kind).name}: ${U.dur(dur)}${goal}`, () => Store.remove('activities', rec.id));
  };
  A['activity-cancel'] = () => { delete Store.state.timers.activity; Store.commit(); };
  A['form-activity'] = (el) => N.Forms.activity(el.dataset.id && Store.get('activities', el.dataset.id), el.dataset.kind);

  /* ---------- Widget: tiempo boca abajo de hoy ---------- */
  W.tummy = () => {
    const age = S.ageMonths();
    const crawling = (Store.state.milestones[Store.state.activeBabyId] || {}).gateo;
    if (age > 12 || crawling) return '';
    const min = S.activityMinutes('tummy'), t = S.activeActivity();
    const running = t && t.kind === 'tummy';
    const other = t && !running ? byId(t.kind) : null;
    return W.card('Boca abajo hoy', `<div class="tummy">
      <div class="ring-box sm">${Charts.ring(Math.min(min, N.TUMMY_GOAL), N.TUMMY_GOAL, 84, 9, 'r-mile')}<div class="ring-c"><b>${Math.round(min)}</b><span>de ${N.TUMMY_GOAL} min</span></div></div>
      <div class="tummy-c">
        ${running ? `<p class="tummy-live"><b data-since="${t.start}">00:00</b> en marcha</p><div class="btn-row"><button type="button" class="btn primary sm" data-act="activity-stop">${icon('check')}Terminar</button><button type="button" class="link" data-act="activity-cancel">Descartar</button></div>`
          : `<p class="muted small">${min >= N.TUMMY_GOAL ? 'Objetivo del día cumplido.' : 'En ratos cortos, varias veces al día, siempre despierta y vigilada.'}</p>
          ${other ? `<p class="small">${other.emoji} ${other.name} en marcha: <b data-since="${t.start}">00:00</b> <button type="button" class="link" data-act="activity-stop">Terminar</button></p>` : ''}
          <div class="btn-row"><button type="button" class="btn soft sm" data-act="activity-start" data-kind="tummy">${icon('play')}Empezar</button><button type="button" class="link" data-act="go" data-to="actividades">Otras actividades</button></div>`}
      </div></div>`, { cls: 'c-mile' });
  };

  /* ---------- Vista ---------- */
  N.views.actividades = {
    render() {
      const t = S.activeActivity();
      const days = []; for (let i = 6; i >= 0; i--) { const k = U.dayKey(U.addDays(Date.now(), -i)); const d = new Date(U.parseDay(k)); const v = Math.round(S.activityMinutes('tummy', k)); days.push({ v, label: U.WEEKDAYS[d.getDay()][0].toUpperCase(), tip: `${U.dateLong(k)}|${v} min boca abajo` }); }
      const list = S.activities().slice(-40).reverse();
      const groups = {}; list.forEach((a) => { (groups[U.dayKey(a.time)] = groups[U.dayKey(a.time)] || []).push(a); });
      const week = S.activities().filter((a) => a.time > Date.now() - 7 * U.DAY);
      const counts = N.ACTIVITIES.map((a) => ({ a, n: week.filter((x) => x.kind === a.id).length, min: U.sum(week.filter((x) => x.kind === a.id), (x) => x.dur || 0) })).filter((x) => x.n);
      return UI.head('Actividades', 'Boca abajo, baño, paseos, juego y rutinas', `<button type="button" class="btn primary" data-act="form-activity">${icon('plus')}Registrar</button>`) + `
      ${t ? `<section class="live"><div class="live-top"><span class="eyebrow">${byId(t.kind).emoji} ${byId(t.kind).name} · desde las ${U.time(t.start)}</span><button type="button" class="link" data-act="activity-cancel">Descartar</button></div>
        <b class="live-clock" data-since="${t.start}">00:00</b><div class="live-actions"><button type="button" class="btn primary" data-act="activity-stop">${icon('check')}Terminar</button></div></section>` : ''}
      <div class="grid-2">
        <div class="stack">${W.tummy()}
          ${W.card('Empezar ahora', `<div class="act-grid">${N.ACTIVITIES.filter((a) => a.id !== 'other').map((a) => `<button type="button" class="act" data-act="${a.timer ? 'activity-start' : 'form-activity'}" data-kind="${a.id}"><span class="fe">${a.emoji}</span><b>${a.name}</b><small>${a.timer ? 'cronometrar' : 'anotar'}</small></button>`).join('')}</div>`)}
        </div>
        <div class="stack">${W.card('Minutos boca abajo', Charts.miniBars(days, 'm-mile'))}
          ${W.card('Últimos 7 días', counts.length ? `<ul class="rows">${counts.map((c) => `<li><div class="row"><span>${c.a.emoji} ${c.a.name}</span><b>${c.n} ${c.n === 1 ? 'vez' : 'veces'}</b><small>${c.min ? U.dur(c.min) + ' en total' : ''}</small></div></li>`).join('')}</ul>` : '<p class="muted">Sin actividades esta semana.</p>')}
        </div>
      </div>
      ${W.card('Registro', Object.keys(groups).length ? Object.keys(groups).slice(0, 5).map((k) => `<h3 class="day-h">${U.relDay(k)}</h3>` + W.timeline(groups[k].map((a) => ({ t: a.time, kind: 'activity', rec: a, col: 'activities' })), { who: true })).join('') : UI.empty('ball', 'Sin actividades', 'Cronometra el tiempo boca abajo o anota el baño y los paseos.'))}`;
    }
  };
})(window.Nido = window.Nido || {});
