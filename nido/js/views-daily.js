/* ==========================================================================
   Nido · Vistas del día a día: Hoy, Sueño y Tomas
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, Charts, icon } = N;
  const V = N.views;
  const W = {}; // widgets compartidos
  N.W = W;

  /* ---------- Widgets ---------- */
  W.kpi = (label, value, sub = '', cls = '') => `<div class="kpi ${cls}"><span class="kpi-l">${label}</span><b class="kpi-v">${value}</b>${sub ? `<span class="kpi-s">${sub}</span>` : ''}</div>`;

  /* Tarjeta de estado en vivo: durmiendo, dando el pecho o despierto con predicción. */
  W.live = () => {
    const s = S.activeSleep(), b = S.activeBreast();
    if (b) {
      const other = b.side === 'L' ? 'R' : 'L';
      return `<section class="live live-feed">
        <div class="live-top"><span class="eyebrow">${icon('breast')} Dando el pecho · desde ${U.time(b.start)}</span>
          <button type="button" class="link" data-act="breast-cancel">Descartar</button></div>
        <div class="breast-sides">
          ${['L', 'R'].map((sd) => `<button type="button" class="side ${b.side === sd ? 'on' : ''} ${b.side === sd && b.running ? 'run' : ''}" data-act="breast-side" data-side="${sd}">
            <small>${sd === 'L' ? 'Izquierdo' : 'Derecho'}</small><b data-breast="${sd}">00:00</b></button>`).join('')}
        </div>
        <div class="live-actions">
          <button type="button" class="btn soft" data-act="breast-pause">${icon(b.running ? 'pause' : 'play')}${b.running ? 'Pausar' : 'Seguir'}</button>
          <button type="button" class="btn soft" data-act="breast-side" data-side="${other}">Cambiar a ${other === 'L' ? 'izquierdo' : 'derecho'}</button>
          <button type="button" class="btn primary" data-act="breast-stop">${icon('check')}Terminar toma</button>
        </div></section>`;
    }
    if (s || S.activeNightWake()) return W.liveSleep();
    if (S.activeRoutine()) return W.liveRoutine();
    const p = S.predict();
    if (!p) return `<section class="live"><div class="live-top"><span class="eyebrow">${icon('sun')} Despierta</span></div>
      <p class="muted">Registra un sueño para calcular las ventanas de vigilia.</p>
      <div class="live-actions"><button type="button" class="btn primary" data-act="sleep-down">${icon('bed')}A la cuna</button><button type="button" class="btn soft" data-act="sleep-start">${icon('moon')}Ya duerme</button></div></section>`;
    const over = p.awakeMin > p.windowRange[1];
    return `<section class="live">
      <div class="live-top"><span class="eyebrow">${icon('sun')} Despierta desde las ${U.time(p.awakeSince)}</span>${over ? UI.pill('Buen momento para dormir', 'warn') : p.progress > 0.8 ? UI.pill('Busca señales de sueño', 'soft') : ''}</div>
      ${W.dayArc(W.arcCenter(
        p.nextNap ? (p.nextNap < Date.now() + U.MIN ? `Siesta ${p.plan.next.idx + 1}` : `Siesta ${p.plan.next.idx + 1} en`) : 'A la cama en',
        p.nextNap && p.nextNap < Date.now() + U.MIN ? '<b class="live-clock sm">Ya toca</b>' : `<b class="live-clock sm" data-until="${p.nextNap || p.bedtime}">00:00</b>`,
        `${p.nextNap ? `~${U.time(p.nextNap)} · ` : `~${U.time(p.bedtime)} · `}despierta <span data-since="${p.awakeSince}"></span>`))}
      <div class="arc-foot"><span><b>${p.napsToday}</b>/${p.expectedNaps} siestas</span><span>ventana de ${U.dur(p.ww)}</span><span>a la cama ~<b>${U.time(p.bedtime)}</b></span><span>${p.learned ? 'ajustado a su ritmo' : 'según su edad'}</span></div>
      <div class="live-actions"><button type="button" class="btn primary" data-act="sleep-down">${icon('bed')}A la cuna</button>
        <button type="button" class="btn soft" data-act="sleep-start">${icon('moon')}Ya duerme</button>
        ${p.nextNap && p.plan.next.state === 'overdue' ? `<button type="button" class="btn soft" data-act="nap-skip">Saltar siesta</button>` : ''}</div>
      ${!p.nextNap && S.routineTotal() && p.bedtime - Date.now() < (S.routineTotal() + 45) * U.MIN ? `<div class="rt-hint">${icon('moon')}<span>Rutina de ${S.routineTotal()} min: empieza hacia las <b>${U.time(p.bedtime - S.routineTotal() * U.MIN)}</b></span><button type="button" class="btn soft sm" data-act="routine-start">Empezar rutina</button></div>` : ''}
    </section>`;
  };

  const kindMeta = {
    sleep: { ic: 'moon', cls: 'c-sleep' }, feed: { ic: 'bottle', cls: 'c-feed' }, diaper: { ic: 'diaper', cls: 'c-diaper' },
    meal: { ic: 'leaf', cls: 'c-blw' }, med: { ic: 'pill', cls: 'c-health' }, temp: { ic: 'thermo', cls: 'c-health' }, activity: { ic: 'ball', cls: 'c-mile' }
  };
  W.describe = (it) => {
    const r = it.rec;
    switch (it.kind) {
      case 'sleep': {
        const L = N.sleepLabels, lat = S.latency(r), np = (r.pauses || []).length, af = r.after || {};
        const extra = [lat != null ? `tardó ${U.dur(lat)}` : '', r.how ? L.how(r.how).toLowerCase() : '', np ? `${np} rato${np > 1 ? 's' : ''} despierta` : '',
          af.reason || af.soothe ? `tras despertar${af.reason ? ' (' + L.reason(af.reason).toLowerCase() + ')' : ''}${af.soothe ? ' · volvió con ' + L.soothe(af.soothe).toLowerCase() : ''}` : ''].filter(Boolean);
        return [`${r.type === 'nap' ? 'Siesta' : 'Noche'} · ${U.dur(S.sleepMin(r))}`, `${U.time(r.start)} – ${U.time(r.end)}${extra.length ? ' · ' + extra.join(' · ') : r.place ? ' · ' + r.place : ''}`];
      }
      case 'feed': return r.kind === 'breast'
        ? [`Pecho · ${(r.durL || 0) + (r.durR || 0)} min`, r.sideUnknown ? 'Lado sin registrar' : `Izq. ${r.durL || 0}′ · Dcho. ${r.durR || 0}′ · terminó en ${r.lastSide === 'L' ? 'izquierdo' : 'derecho'}`]
        : [`Biberón · ${r.ml} ml`, r.milk === 'formula' ? 'Fórmula' : r.milk === 'mixta' ? 'Mixta' : 'Leche materna'];
      case 'diaper': { const c = N.DIAPER_COLORS.find((x) => x.id === r.color); return [`Pañal · ${{ wet: 'pipí', dirty: 'caca', mixed: 'pipí y caca' }[r.kind]}`, c ? `<i class="swatch" style="background:${c.hex}"></i>${c.name}` : 'Mojado']; }
      case 'meal': return [`${(N.MEAL_TYPES.find((m) => m.id === r.mealType) || {}).name || 'Comida'} · ${r.foods.length} alimento${r.foods.length > 1 ? 's' : ''}${S.mealIron(r).iron ? ' <i class="iron-tag" title="Con hierro">hierro</i>' : ''}`, r.foods.map((f) => N.FOOD_BY_ID[f.id].emoji + ' ' + N.FOOD_BY_ID[f.id].name).join(', ')];
      case 'med': return [`${U.esc(r.name)}${r.dose ? ` · ${U.num(r.dose, r.dose % 1 ? 1 : 0)} ${r.unit}` : ''}`, U.esc(r.reason || 'Medicación')];
      case 'temp': return [`${U.num(r.value)} ºC`, `${r.method}${r.value >= 38 ? ' · fiebre' : ''}`];
      case 'activity': { const a = N.ACTIVITIES.find((x) => x.id === r.kind) || {}; return [`${a.emoji || ''} ${a.name || 'Actividad'}${r.dur ? ' · ' + U.dur(r.dur) : ''}`, U.esc(r.note || a.hint || '')]; }
    }
    return ['', ''];
  };
  W.timeline = (items, opts = {}) => {
    if (!items.length) return UI.empty('clock', 'Nada registrado todavía', 'Usa el botón + para anotar sueño, tomas, pañales o comidas.');
    return `<ol class="tl">${items.map((it) => {
      const [t, sub] = W.describe(it); const m = kindMeta[it.kind];
      const warn = (it.kind === 'meal' && it.rec.foods.some((f) => f.reaction && f.reaction !== 'none')) || (it.kind === 'temp' && it.rec.value >= 38);
      return `<li><button type="button" class="tl-item ${m.cls}" data-act="edit" data-col="${it.col}" data-id="${it.rec.id}">
        <time>${opts.date ? `<small>${U.date(it.t)}</small>` : ''}${U.time(it.t)}</time><span class="tl-ic">${icon(m.ic)}</span>
        <span class="tl-txt"><b>${t}${warn ? ' ' + UI.pill('Revisar', 'warn') : ''}</b><small>${sub}</small></span>
        ${opts.who && it.rec.by ? `<span class="tl-by">${U.esc(it.rec.by)}</span>` : ''}</button></li>`;
    }).join('')}</ol>`;
  };
  W.card = (title, body, opts = {}) => `<section class="card ${opts.cls || ''}">${title ? `<header class="card-h"><h2>${title}</h2>${opts.act || ''}</header>` : ''}${body}</section>`;

  /* Plan del día: lo que ya ha pasado y lo previsto, con las ventanas aprendidas. */
  W.plan = () => {
    const p = S.dayPlan(), r = p.rhythm, now = Date.now();
    const napName = (x) => `Siesta ${x.idx + 1}`;
    const adjTxt = (x) => (x.adj ? ` · ${x.adj < 0 ? 'adelantada' : 'retrasada'} ${U.dur(Math.abs(x.adj))} porque ${x.why}` : '') + ((x.tweaks || []).length ? ` · ${x.tweaks.join(', ')}` : '');
    const row = (x) => {
      let t, title, sub, act = '';
      if (x.kind === 'wake') { t = U.time(x.t); title = 'Despertar'; sub = x.state === 'done' ? 'registrado' : x.state === 'fixed' ? 'hora fijada por vosotros' : 'hora habitual'; }
      else if (x.kind === 'nap' && x.state === 'skipped') {
        t = U.time(x.start); title = 'Siesta saltada'; sub = 'el resto del día se ha recolocado';
        act = `<button type="button" class="link sm" data-act="nap-unskip" data-id="${x.id}">Deshacer</button>`;
      } else if (x.kind === 'nap') {
        const dur = U.dur((x.state === 'done' ? x.min : (x.end - x.start) / U.MIN));
        t = `${x.state === 'done' || x.state === 'now' ? '' : '~'}${U.time(x.start)}`;
        title = `${napName(x)} · ${x.state === 'done' ? dur : '~' + dur}`;
        sub = x.state === 'done' ? `${U.time(x.start)} – ${U.time(x.end)}`
          : x.state === 'now' ? 'durmiendo ahora'
          : x.state === 'overdue' ? 'ya toca: busca señales de sueño'
          : `entre ${U.time(x.from)} y ${U.time(x.to)} · tras ${U.dur(x.window)} despierta${adjTxt(x)}${x.short ? ' · corta para no retrasar la noche' : ''}`;
        if (x.state === 'planned' || x.state === 'overdue') act = `<button type="button" class="link sm" data-act="nap-skip">Saltar</button>`;
      } else {
        t = `${x.state === 'done' ? '' : '~'}${U.time(x.t)}`; title = 'A la cama';
        sub = x.state === 'done' ? 'ya está en la cama' : x.state === 'fixed' ? `hora fijada por vosotros${x.natural && Math.abs(x.natural - x.t) > 30 * U.MIN ? ` · por cómo va el día, lo natural sería ~${U.time(x.natural)}` : ''}` : x.state === 'adjusted' ? `ajustado a un horario razonable (${p.hard ? '18:00' : '18:30'}–21:00)` : `entre ${U.time(x.from)} y ${U.time(x.to)} · tras ${U.dur(x.window)} despierta${adjTxt(x)}`;
      }
      return `<li class="plan-it is-${x.state} k-${x.kind}"><time>${t}</time><i class="plan-dot" aria-hidden="true"></i><span><b>${title}</b><small>${sub}</small></span>${act}</li>`;
    };
    const ws = r.windows.map((w, i) => (i === r.expected ? `cama ${U.dur(w, true)}` : U.dur(w, true))).join(' · ');
    return W.card('Plan de hoy', `${W.planAlerts()}<ol class="plan">${p.items.map(row).join('')}</ol>
      <p class="plan-foot">${icon('spark')}<span>${r.expected} siestas · ventanas ${ws}. ${r.learned ? `Aprendido de sus últimos ${r.days} días; se ajusta según cómo vayan las siestas de hoy.` : 'Según su edad: se ajustará cuando haya unos días registrados.'}${r.transition ? ' En transición: ventanas del siguiente tramo de edad hasta que aprenda las nuevas.' : ''}</span></p>`, { cls: 'c-sleep', act: `<button type="button" class="link" data-act="plan-adjust">${icon('cog', 'sm')} Ajustar</button>` });
  };

  /* Sonidos para dormir con temporizador de apagado. */
  W.sounds = () => {
    const st = N.Sounds.state;
    return W.card('Sonidos para dormir', `<div class="snd-grid">${N.Sounds.list.map((s) => `<button type="button" class="snd ${st.key === s.id ? 'on' : ''}" data-act="sound" data-key="${s.id}" aria-pressed="${st.key === s.id}"><span class="snd-e" aria-hidden="true">${s.emoji}</span><b>${s.name}</b><small>${st.key === s.id ? 'sonando' : s.hint}</small></button>`).join('')}</div>
      <div class="snd-ctrl"><label class="snd-vol">${icon('sun', 'sm')}<span class="sr-only">Volumen</span><input type="range" id="snd-vol" min="0" max="100" value="${Math.round(st.volume * 100)}" aria-label="Volumen"></label>
        ${UI.seg('sndTimer', [[15, '15 min'], [30, '30 min'], [60, '1 h'], [0, 'Sin fin']], st.minutes)}</div>
      <p class="muted small">Se apaga suavemente al terminar. Pon el móvil lejos de la cuna y el volumen bajo (menos de 50 dB).</p>`, { cls: 'c-sleep' });
  };

  /* ======================= HOY ======================= */
  V.hoy = {
    render() {
      const b = S.baby(); const a = U.age(b.birth); const key = U.today();
      const h = new Date().getHours();
      const hello = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
      const sd = S.sleepDay(key);
      const feeds = S.onDay(S.feeds(), key), diapers = S.onDay(S.diapers(), key), meals = S.onDay(S.meals(), key);
      const lastFeed = S.feeds().pop(), lastDiaper = S.diapers().pop();
      const stats = S.foodStats();
      const newToday = new Set(); meals.forEach((m) => m.foods.forEach((f) => { if (U.dayKey(stats[f.id].first) === key) newToday.add(f.id); }));
      const nextSide = S.lastBreastSide() === 'L' ? 'derecho' : 'izquierdo';

      return `
      <header class="hello">
        <div><p class="eyebrow">${hello} · ${U.dateLong(Date.now())}</p>
        <h1>${U.esc(b.name)} tiene <span class="hl">${U.ageText(b.birth)}</span></h1>
        <p class="vsub">Semana ${a.weeks + 1} de vida · día ${a.totalDays + 1}${S.correctedText() ? ` · <b>edad corregida: ${S.correctedText()}</b>` : ''}</p></div>
        <button type="button" class="btn primary hide-sm" data-act="quick-add">${icon('plus')}Registrar</button>
      </header>
      <div class="grid-hoy">
        <div class="col-main">
          ${W.live()}
          ${new Date().getHours() < 13 ? W.night(S.nightOf(U.dayKey(U.addDays(Date.now(), -1))), 'Anoche') : ''}
          <div class="quick">
            <button type="button" class="q c-feed" data-act="breast-start" data-side="${nextSide === 'derecho' ? 'R' : 'L'}">${icon('breast')}<b>Pecho</b><small>sigue el ${nextSide}</small></button>
            <button type="button" class="q c-feed" data-act="form-bottle">${icon('bottle')}<b>Biberón</b><small>${lastFeed ? U.ago(lastFeed.time) : '—'}</small></button>
            <button type="button" class="q c-diaper" data-act="form-diaper">${icon('diaper')}<b>Pañal</b><small>${lastDiaper ? U.ago(lastDiaper.time) : '—'}</small></button>
            <button type="button" class="q c-blw" data-act="form-meal">${icon('leaf')}<b>Comida</b><small>${meals.length ? meals.length + ' hoy' : 'BLW'}</small></button>
          </div>
          <div class="kpis four">
            ${W.kpi(`${icon('moon')} Sueño hoy`, U.dur(sd.total), `${sd.naps} siesta${sd.naps === 1 ? '' : 's'} · ${U.dur(sd.day, true)} de día`, 'c-sleep')}
            ${W.kpi(`${icon('bottle')} Tomas`, feeds.length, lastFeed ? `última <span data-ago="${lastFeed.time}"></span>` : '—', 'c-feed')}
            ${W.kpi(`${icon('diaper')} Pañales`, diapers.length, `${diapers.filter((d) => d.kind !== 'dirty').length} pipí · ${diapers.filter((d) => d.kind !== 'wet').length} caca`, 'c-diaper')}
            ${W.kpi(`${icon('leaf')} BLW`, meals.reduce((n, m) => n + m.foods.length, 0), newToday.size ? `${newToday.size} nuevo${newToday.size > 1 ? 's' : ''} hoy` : `${Object.keys(stats).length} probados en total`, 'c-blw')}
          </div>
          ${W.card('Hoy, hora a hora', W.timeline(S.timeline(key), { who: true }), { act: `<a class="link" href="#sueno">Ver patrón</a>` })}
        </div>
        <aside class="col-side">
          ${W.plan()}
          ${W.tummy()}
          ${W.card('Su día en 24 horas', `<div class="clock-wrap">${Charts.dayClock(sd.blocks, feeds.filter((f) => f.kind !== 'solids').map((f) => f.time), Date.now())}
            <ul class="legend"><li><i class="lg-night"></i>Noche</li><li><i class="lg-nap"></i>Siesta</li><li><i class="lg-feed"></i>Toma</li></ul></div>`)}
          ${V.hoy.reminders()}
          ${V.hoy.idea()}
        </aside>
      </div>`;
    },
    reminders() {
      const out = [];
      const up = S.upcoming().filter((a) => U.parseDay(a.date) - Date.now() < 15 * U.DAY);
      up.forEach((a) => {
        const pend = (a.questions || []).filter((q) => !q.done).length;
        out.push(`<li class="rem c-growth"><button type="button" data-act="form-appt" data-id="${a.id}">${icon('calendar')}<span><b>${U.esc(a.title)}</b><small>${U.relDay(a.date)}${a.time ? ' a las ' + a.time : ''}${pend ? ` · ${pend} pregunta${pend > 1 ? 's' : ''} pendiente${pend > 1 ? 's' : ''}` : ''}</small></span></button></li>`);
      });
      const vaxAppt = S.upcoming().some((a) => a.type === 'vacuna');
      if (!vaxAppt) S.vaccinePlan().filter((v) => v.state === 'due' || v.state === 'late' || v.state === 'soon').slice(0, 2).forEach((v) =>
        out.push(`<li class="rem c-health"><button type="button" data-act="form-vaccine" data-code="${v.id}">${icon('syringe')}<span><b>${v.name}</b><small>${v.state === 'soon' ? 'prevista ' + U.relDay(v.due) : v.state === 'late' ? 'pendiente desde ' + U.date(v.due) : 'ya le corresponde'}</small></span></button></li>`));
      S.allergenStatus().filter((a) => a.state === 'maintain').forEach((a) =>
        out.push(`<li class="rem c-blw"><a href="#blw">${icon('leaf')}<span><b>Mantén el ${a.name.toLowerCase()} en su dieta</b><small>última vez hace ${a.daysSince} días</small></span></a></li>`));
      const vitD = Store.list('meds').some((m) => /vitamina d/i.test(m.name));
      if (vitD && !S.onDay(Store.list('meds'), U.today()).some((m) => /vitamina d/i.test(m.name)) && new Date().getHours() >= 9)
        out.push(`<li class="rem c-health"><button type="button" data-act="med-vitd">${icon('pill')}<span><b>Vitamina D de hoy</b><small>Toca para marcarla como dada</small></span></button></li>`);
      const fever = Store.list('temps').filter((t) => t.value >= 38 && Date.now() - t.time < U.DAY);
      if (fever.length) out.push(`<li class="rem crit"><a href="#salud">${icon('thermo')}<span><b>Fiebre en las últimas 24 h</b><small>${U.num(fever[fever.length - 1].value)} ºC ${U.ago(fever[fever.length - 1].time)}</small></span></a></li>`);
      return W.card('Pendiente', out.length ? `<ul class="rems">${out.join('')}</ul>` : '<p class="muted pad">Todo al día.</p>');
    },
    idea() {
      const age = S.ageMonths();
      if (age < 5.5) return W.card('Alimentación', `<p class="muted pad">La alimentación complementaria suele empezar hacia los 6 meses, cuando se sienta con apoyo y muestra interés por la comida.</p>`);
      // Las comidas de hoy según el plan semanal de BLW.
      const day = N.BlwPlan.current().days.find((d) => d.date === U.today());
      if (!day) return '';
      const logged = S.onDay(S.meals(), U.today());
      return W.card('Hoy en el plan de BLW', `<div class="idea">${day.meals.map((m, mi) => {
        const done = logged.find((x) => x.mealType === m.type);
        return `<div class="idea-meal ${done ? 'is-logged' : ''}"><div class="pmeal-h"><span>${N.MEAL_TYPES.find((t) => t.id === m.type).name}</span>${m.iron.iron ? `<i class="iron ${m.iron.heme ? 'heme' : ''}" title="Con hierro">${icon('drop')}</i>` : ''}
          ${done ? `<span class="pill good">Hecha</span>` : `<button type="button" class="link sm" data-act="plan-log" data-day="${day.date}" data-meal="${mi}">Registrar</button>`}</div>
          <p>${m.items.map((x) => `${N.FOOD_BY_ID[x.id].emoji} ${N.FOOD_BY_ID[x.id].name}${x.tag === 'new' ? ' <b class="txt-new">nuevo</b>' : x.tag === 'allergen' ? ' <b class="txt-warn">alérgeno</b>' : ''}`).join(', ')}</p></div>`;
      }).join('')}
      ${day.allergen ? `<p class="idea-al">${icon('info')} <span>Alérgeno de hoy: <b>${day.allergen.name}</b>. Ofrécelo por la mañana y observa 2 horas.</span></p>` : ''}</div>`, { act: '<button type="button" class="link" data-act="blw-plan">Ver semana</button>' });
    }
  };
  N.actions['night-detail'] = (el) => {
    UI.sheet({ title: `Noche del ${U.dateLong(el.dataset.key)}`, footer: false, body: W.night(S.nightOf(el.dataset.key), '') + '<p class="muted small">Toca un despertar para corregir su motivo o la hora.</p>' });
  };
  N.actions['blw-plan'] = () => { UI.st.seg.blw = 'plan'; UI.go('blw'); };
  N.actions['med-vitd'] = () => {
    const last = Store.list('meds').filter((m) => /vitamina d/i.test(m.name)).pop();
    Store.add('meds', { time: Date.now(), name: last.name, dose: last.dose, unit: last.unit, reason: last.reason });
    UI.toast('Vitamina D registrada');
  };

  /* ======================= SUEÑO ======================= */
  V.sueno = {
    render() {
      const range = UI.st.sleepRange;
      const days = []; for (let i = range - 1; i >= 0; i--) days.push(S.sleepDay(U.dayKey(U.addDays(Date.now(), -i))));
      const full = days.slice(0, -1); // días completos (sin hoy)
      const nights = full.map((d) => S.nightOf(d.key)).filter(Boolean);
      const norm = S.sleepNorm();
      const avgTotal = U.avg(full, (d) => d.total), avgDay = U.avg(full, (d) => d.day), avgNaps = U.avg(full, (d) => d.naps);
      const avgMinOfDay = (arr, f) => { const v = U.avg(arr, (x) => { const d = new Date(f(x)); let m = d.getHours() * 60 + d.getMinutes(); if (m < 12 * 60 && f === bedF) m += 1440; return m; }); return U.time(U.dayStart(Date.now()) + (v % 1440) * U.MIN); };
      const bedF = (n) => n.start, wakeF = (n) => n.end;
      const rows = []; for (let i = 13; i >= 0; i--) { const k = U.dayKey(U.addDays(Date.now(), -i)); const sd = S.sleepDay(k); rows.push({ key: k, blocks: sd.blocks, feeds: S.onDay(S.feeds(), k).map((f) => f.time) }); }
      const inRange = avgTotal / 60 >= norm.total[0] && avgTotal / 60 <= norm.total[1];
      const list = S.sleeps().slice(-40).reverse();
      const groups = {}; list.forEach((s) => { (groups[U.dayKey(s.end)] = groups[U.dayKey(s.end)] || []).push(s); });
      const recent = S.sleeps().filter((s) => s.start > Date.now() - 14 * U.DAY);
      const lat = recent.map(S.latency).filter((x) => x != null);

      return UI.head('Sueño', `Ventanas de vigilia y siestas para ${S.correctedText() ? S.correctedText() + ' de edad corregida' : U.ageText(S.baby().birth)}`, `<button type="button" class="btn soft" data-act="form-sleep">${icon('plus')}Añadir sueño</button>`) + `
      <div class="grid-2">
        <div class="stack">${W.live()}${W.plan()}${W.night(S.nightOf(U.dayKey(U.addDays(Date.now(), -1))), 'Anoche')}
          <div class="kpis three">
            ${W.kpi('Media diaria', U.dur(avgTotal), `${inRange ? UI.pill('En rango', 'good') : UI.pill('Fuera de rango', 'warn')} ${norm.total[0]}–${norm.total[1]} h`, 'c-sleep')}
            ${W.kpi('Noche', U.dur(U.avg(nights, (n) => n.total)), `${U.num(U.avg(nights, (n) => n.wakes), 1)} despertares · tramo más largo ${U.dur(U.avg(nights, (n) => n.longest))}`, 'c-sleep')}
            ${W.kpi('Siestas', U.num(avgNaps, 1) + '/día', `${U.dur(avgDay)} de día`, 'c-sleep')}
            ${W.kpi('Se acuesta', nights.length ? avgMinOfDay(nights, bedF) : '–', 'hora media', 'c-sleep')}
            ${W.kpi('Se despierta', nights.length ? avgMinOfDay(nights, wakeF) : '–', 'hora media', 'c-sleep')}
            ${W.kpi('Tarda en dormirse', lat.length ? U.dur(U.avg(lat)) : '–', lat.length ? `media de ${lat.length} veces (14 días)` : 'usa «A la cuna» para medirlo', 'c-sleep')}
          </div>
        </div>
        <div class="stack">
        ${W.card('Horas de sueño por día', `<div class="chart-top">${UI.seg('sleepRange', [[7, '7 días'], [14, '14 días'], [30, '30 días']], range)}
          <ul class="legend"><li><i class="lg-night"></i>Noche</li><li><i class="lg-nap"></i>Siestas</li><li><i class="lg-band"></i>Recomendado</li></ul></div>
          ${Charts.sleepBars(days, norm.total)}`)}
        <div id="sonidos">${W.sounds()}</div>
        </div>
      </div>
      ${W.card('Patrón de las últimas dos semanas', `<div class="scroll-x">${Charts.pattern(rows, { feeds: true })}</div><ul class="legend"><li><i class="lg-night"></i>Noche</li><li><i class="lg-nap"></i>Siesta</li><li><i class="lg-feed"></i>Toma</li></ul>`)}
      <div class="grid-2">${this.nights()}${this.habits(recent)}</div>
      <div class="grid-2">${W.routine()}${W.guide()}</div>
      ${W.trends()}
      ${W.card('Registro', Object.keys(groups).slice(0, 3).map((k) => `<h3 class="day-h">${U.relDay(k) === 'hoy' || U.relDay(k) === 'ayer' ? U.relDay(k) : U.dateLong(k)}</h3>` +
          W.timeline(groups[k].map((s) => ({ t: s.start, kind: 'sleep', rec: s, col: 'sleeps' })))).join(''))}
      `;
    },
    /* Tabla de las últimas noches. */
    nights() {
      const rows = []; for (let i = 1; i <= 7; i++) { const n = S.nightOf(U.dayKey(U.addDays(Date.now(), -i))); if (n) rows.push(n); }
      if (!rows.length) return W.card('Últimas noches', UI.empty('moon', 'Sin noches registradas', 'Usa «Despertar nocturno» y «Buenos días» en el cronómetro.'));
      return W.card('Últimas noches', `<div class="scroll-x"><table class="tbl nights"><thead><tr><th>Noche</th><th>Horario</th><th class="num">Dormida</th><th class="num">Despertares</th><th class="num">Despierta</th><th class="num">Tardó</th></tr></thead><tbody>
        ${rows.map((n) => { const d = new Date(U.parseDay(n.key)); return `<tr data-act="night-detail" data-key="${n.key}" tabindex="0"><td>${U.WEEKDAYS[d.getDay()]} ${d.getDate()}</td><td>${U.time(n.start)} → ${U.time(n.end)}</td><td class="num"><b>${U.dur(n.total, true)}</b></td><td class="num">${n.wakes}</td><td class="num">${n.wakes ? U.dur(n.awake, true) : '–'}</td><td class="num">${n.latency != null ? U.dur(n.latency, true) : '–'}</td></tr>`; }).join('')}
      </tbody></table></div><p class="muted small">Toca una noche para ver cada despertar.</p>`);
    },
    /* Cómo se duerme y por qué se despierta (14 días). */
    habits(recent) {
      const L = N.sleepLabels;
      const dist = (vals, list) => {
        const c = {}; vals.forEach((v) => { c[v] = (c[v] || 0) + 1; });
        const tot = vals.length;
        return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<li><span>${L.emo(list, id)} ${(list.find((x) => x.id === id) || {}).name || id}</span><span class="cat-track"><i style="width:${(n / tot) * 100}%;background:var(--c-sleep)"></i></span><b>${Math.round((n / tot) * 100)} %</b></li>`).join('');
      };
      const hows = recent.map((s) => s.how).filter(Boolean);
      const wakes = []; for (let i = 1; i <= 14; i++) { const n = S.nightOf(U.dayKey(U.addDays(Date.now(), -i))); if (n) wakes.push(...n.wakings); }
      const reasons = wakes.map((w) => w.reason).filter(Boolean), soothes = wakes.map((w) => w.soothe).filter(Boolean);
      const indep = hows.length ? hows.filter((h) => h === 'sola' || h === 'acompanada').length / hows.length : 0;
      return W.card('Cómo se duerme', hows.length || reasons.length ? `
        ${hows.length ? `<h3 class="day-h">Al dormirse (${hows.length} veces)</h3><ul class="cat-bars">${dist(hows, N.SLEEP_HOW)}</ul>` : ''}
        ${reasons.length ? `<h3 class="day-h">Por qué se despierta de noche</h3><ul class="cat-bars">${dist(reasons, N.WAKE_REASONS)}</ul>` : ''}
        ${soothes.length ? `<h3 class="day-h">Cómo vuelve a dormirse</h3><ul class="cat-bars">${dist(soothes, N.SOOTHE)}</ul>` : ''}
        ${hows.length >= 5 ? `<p class="note">${N.icon('info')}<span>${indep >= 0.5 ? 'Se duerme sola o solo acompañada en la mitad de las ocasiones o más.' : 'Casi siempre se duerme con ayuda (pecho, brazos, meciendo). Es normal a esta edad; si quieres que gane autonomía, prueba a dejarla en la cuna somnolienta pero despierta en la primera siesta, que suele ser la más fácil.'}</span></p>` : ''}`
        : UI.empty('moon', 'Aún sin datos', 'Al registrar con el cronómetro, anota cómo se durmió y por qué se despertó.'));
    }
  };
  N.actions.seg = ((orig) => (el) => {
    if (el.dataset.seg === 'sleepRange') { UI.st.sleepRange = +el.dataset.val; UI.render(); return; }
    if (el.dataset.seg === 'growthMetric') { UI.st.growthMetric = el.dataset.val; UI.render(); return; }
    if (el.dataset.seg === 'foodFilter') { UI.st.foodFilter = el.dataset.val; UI.render(); return; }
    if (el.dataset.seg === 'sndTimer') { N.Sounds.setTimer(+el.dataset.val); return; }
    orig(el);
  })(N.actions.seg);

  /* ======================= TOMAS Y PAÑALES ======================= */
  V.tomas = {
    render() {
      const tab = UI.st.seg.tomas || 'feeds';
      const head = UI.head('Tomas y pañales', 'Pecho, biberón, extracciones y pañales', `<button type="button" class="btn soft" data-act="${tab === 'diapers' ? 'form-diaper' : tab === 'pumps' ? 'form-pump' : 'form-feed'}">${icon('plus')}Añadir</button>`);
      return head + UI.seg('tomas', [['feeds', 'Tomas'], ['diapers', 'Pañales'], ['pumps', 'Extracciones']], tab) + (tab === 'diapers' ? this.diapers() : tab === 'pumps' ? this.pumps() : this.feeds());
    },
    last7(fn) { const out = []; for (let i = 6; i >= 0; i--) { const k = U.dayKey(U.addDays(Date.now(), -i)); out.push(fn(k, new Date(U.parseDay(k)))); } return out; },
    feeds() {
      const key = U.today(), all = S.feeds(), today = S.onDay(all, key);
      const bars = this.last7((k, d) => { const n = S.onDay(all, k).length; return { v: n, label: U.WEEKDAYS[d.getDay()][0].toUpperCase(), tip: `${U.dateLong(k)}|${n} tomas` }; });
      const minsToday = U.sum(today.filter((f) => f.kind === 'breast'), (f) => (f.durL || 0) + (f.durR || 0));
      const mlToday = U.sum(today.filter((f) => f.kind === 'bottle'), (f) => f.ml || 0);
      const gaps = []; const wk = all.filter((f) => f.time > Date.now() - 7 * U.DAY); for (let i = 1; i < wk.length; i++) gaps.push((wk[i].time - wk[i - 1].time) / U.MIN);
      const last = all[all.length - 1];
      const sided = wk.filter((f) => !f.sideUnknown), sideL = U.sum(sided, (f) => f.durL || 0), sideR = U.sum(sided, (f) => f.durR || 0);
      const next = S.lastBreastSide() === 'L' ? 'R' : 'L';
      const groups = {}; all.slice(-50).reverse().forEach((f) => { (groups[U.dayKey(f.time)] = groups[U.dayKey(f.time)] || []).push(f); });
      return `<div class="grid-2">
        <div class="stack">
          ${S.activeBreast() ? W.live() : `<section class="live live-feed-idle"><div class="live-top"><span class="eyebrow">${icon('breast')} ${last ? `Última toma <span data-ago="${last.time}"></span>` : 'Sin tomas'}</span></div>
            <p class="big-line">Toca el pecho con el que empiezas</p>
            <div class="breast-sides">${['L', 'R'].map((sd) => `<button type="button" class="side ${sd === next ? 'sug' : ''}" data-act="breast-start" data-side="${sd}"><small>${sd === 'L' ? 'Izquierdo' : 'Derecho'}</small><b>${icon('play')}</b>${sd === next ? '<em>toca este</em>' : ''}</button>`).join('')}</div>
            <div class="live-actions"><button type="button" class="btn soft" data-act="form-bottle">${icon('bottle')}Biberón</button><button type="button" class="btn soft" data-act="form-feed">${icon('edit')}Toma pasada</button></div></section>`}
          <div class="kpis three">
            ${W.kpi('Hoy', today.length + ' tomas', `${minsToday} min al pecho${mlToday ? ` · ${mlToday} ml` : ''}`, 'c-feed')}
            ${W.kpi('Cada', gaps.length ? U.dur(U.avg(gaps)) : '–', 'intervalo medio (7 días)', 'c-feed')}
            ${W.kpi('Lados', sideL + sideR ? `${Math.round((sideL / (sideL + sideR)) * 100)} / ${Math.round((sideR / (sideL + sideR)) * 100)}` : '–', 'izq. / dcho. (% del tiempo)', 'c-feed')}
          </div>
        </div>
        ${W.card('Tomas por día', Charts.miniBars(bars, 'm-feed'))}
      </div>
      ${W.card('Registro', Object.keys(groups).slice(0, 5).map((k) => `<h3 class="day-h">${U.relDay(k)}</h3>` + W.timeline(groups[k].map((f) => ({ t: f.time, kind: 'feed', rec: f, col: 'feeds' })), { who: true })).join(''))}`;
    },
    diapers() {
      const all = S.diapers(), today = S.onDay(all, U.today());
      const bars = this.last7((k, d) => { const n = S.onDay(all, k).length; return { v: n, label: U.WEEKDAYS[d.getDay()][0].toUpperCase(), tip: `${U.dateLong(k)}|${n} pañales` }; });
      const wet = today.filter((d) => d.kind !== 'dirty').length;
      const lastPoo = all.filter((d) => d.kind !== 'wet').pop();
      const bad = all.filter((d) => d.color && !N.DIAPER_COLORS.find((c) => c.id === d.color).ok && Date.now() - d.time < 3 * U.DAY);
      const groups = {}; all.slice(-40).reverse().forEach((f) => { (groups[U.dayKey(f.time)] = groups[U.dayKey(f.time)] || []).push(f); });
      return `<div class="grid-2"><div class="stack">
        <div class="quick three">
          ${[['wet', 'Pipí'], ['dirty', 'Caca'], ['mixed', 'Ambos']].map(([k, l]) => `<button type="button" class="q c-diaper" data-act="diaper-quick" data-kind="${k}">${icon('diaper')}<b>${l}</b><small>un toque</small></button>`).join('')}
        </div>
        <div class="kpis three">
          ${W.kpi('Hoy', today.length, `${wet} mojados`, 'c-diaper')}
          ${W.kpi('Última caca', lastPoo ? U.ago(lastPoo.time) : '–', lastPoo && lastPoo.color ? N.DIAPER_COLORS.find((c) => c.id === lastPoo.color).name : '', 'c-diaper')}
          ${W.kpi('Media', U.num(U.avg(bars, (b) => b.v), 1), 'pañales al día', 'c-diaper')}
        </div>
        ${bad.length ? `<p class="alert warn">${icon('alert')} Hay un color de caca que conviene comentar con tu pediatra.</p>` : `<p class="note">${icon('info')} Un bebé bien hidratado moja 5 o 6 pañales al día. Con la alimentación complementaria es normal que cambien el color y la textura.</p>`}
      </div>${W.card('Pañales por día', Charts.miniBars(bars, 'm-diaper'))}</div>
      ${W.card('Registro', Object.keys(groups).slice(0, 5).map((k) => `<h3 class="day-h">${U.relDay(k)}</h3>` + W.timeline(groups[k].map((f) => ({ t: f.time, kind: 'diaper', rec: f, col: 'diapers' })))).join(''))}`;
    },
    pumps() {
      const all = Store.list('pumps').sort((a, b) => b.time - a.time);
      const week = all.filter((p) => p.time > Date.now() - 7 * U.DAY);
      return `<div class="kpis three">${W.kpi('Esta semana', U.sum(week, (p) => p.ml) + ' ml', `${week.length} extracciones`, 'c-feed')}${W.kpi('Media', week.length ? Math.round(U.avg(week, (p) => p.ml)) + ' ml' : '–', 'por extracción', 'c-feed')}${W.kpi('Conservación', '4 días', 'en nevera · 6 meses en congelador', 'c-feed')}</div>
      ${W.card('Extracciones', all.length ? `<ul class="rows">${all.map((p) => `<li><button type="button" class="row" data-act="form-pump" data-id="${p.id}"><span>${U.date(p.time)} · ${U.time(p.time)}</span><b>${p.ml} ml</b><small>${{ B: 'Ambos', L: 'Izquierdo', R: 'Derecho' }[p.side]}</small></button></li>`).join('')}</ul>` : UI.empty('pump', 'Sin extracciones', 'Registra la leche extraída para saber cuánta tienes guardada.'))}`;
    }
  };
})(window.Nido = window.Nido || {});
