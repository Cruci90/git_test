/* ==========================================================================
   Nido · Calendario, Hitos y dientes, Diario, Informe, Ajustes y Bienvenida
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, W, icon } = N;
  const V = N.views;
  const KIND = {
    appt: { name: 'Cita', cls: 'c-growth', ic: 'calendar' }, health: { name: 'Vacunación', cls: 'c-health', ic: 'syringe' },
    vaccine: { name: 'Vacuna prevista', cls: 'c-health', ic: 'syringe' }, event: { name: 'Evento', cls: 'c-sleep', ic: 'star' },
    milestone: { name: 'Hito', cls: 'c-mile', ic: 'star' }
  };

  /* ======================= CALENDARIO ======================= */
  V.calendario = {
    render() {
      const now = new Date();
      const cm = UI.st.calMonth || [now.getFullYear(), now.getMonth()];
      const sel = UI.st.calDay || U.today();
      const [y, m] = cm;
      const first = new Date(y, m, 1), startDow = (first.getDay() + 6) % 7; // lunes primero
      const daysIn = new Date(y, m + 1, 0).getDate();
      const agenda = S.agenda();
      const byDay = {}; agenda.forEach((a) => { (byDay[a.date] = byDay[a.date] || []).push(a); });
      const b = S.baby();
      const cells = [];
      for (let i = 0; i < startDow; i++) cells.push('<span class="cal-cell out"></span>');
      for (let d = 1; d <= daysIn; d++) {
        const k = U.dayKey(new Date(y, m, d).getTime()); const items = byDay[k] || [];
        const isBday = k.slice(8) === b.birth.slice(8) && k > b.birth;
        cells.push(`<button type="button" class="cal-cell ${k === U.today() ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-act="cal-day" data-day="${k}" aria-label="${U.dateLong(k)}${items.length ? ', ' + items.length + ' eventos' : ''}">
          <span class="cal-n">${d}</span>${isBday ? '<span class="cal-bday" title="Cumple meses">★</span>' : ''}
          <span class="cal-dots">${items.slice(0, 4).map((it) => `<i class="${KIND[it.kind].cls}"></i>`).join('')}</span></button>`);
      }
      const dayItems = byDay[sel] || [];
      const upcoming = agenda.filter((a) => a.date >= U.today() && a.date <= U.dayKey(U.addDays(Date.now(), 45)) && !a.done);
      const selAge = sel >= b.birth ? U.ageText(b.birth, U.parseDay(sel)) : '';
      return UI.head('Calendario', 'Citas, vacunas, hitos y eventos familiares', `<button type="button" class="btn soft" data-act="form-event" data-date="${sel}">${icon('plus')}Evento</button><button type="button" class="btn primary" data-act="form-appt">${icon('plus')}Cita</button>`) + `
      <div class="grid-cal">
        ${W.card('', `<div class="cal-head"><button type="button" class="icon-btn" data-act="cal-move" data-d="-1" aria-label="Mes anterior">${icon('left')}</button>
          <h2>${U.MONTHS_LONG[m]} ${y}</h2><button type="button" class="icon-btn" data-act="cal-move" data-d="1" aria-label="Mes siguiente">${icon('right')}</button></div>
          <div class="cal-grid">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<span class="cal-dow">${d}</span>`).join('')}${cells.join('')}</div>
          <ul class="legend">${Object.entries(KIND).filter(([k]) => k !== 'health').map(([, v]) => `<li><i class="lg-dot ${v.cls}"></i>${v.name}</li>`).join('')}<li><span class="lg-star">★</span> Cumple meses</li></ul>`)}
        <div class="stack">
          ${W.card(`${U.dateLong(sel)}`, `${selAge ? `<p class="muted small pad-b">${U.esc(b.name)} tenía ${selAge}</p>` : ''}${dayItems.length ? this.list(dayItems) : '<p class="muted">Nada este día.</p>'}`, { act: `<button type="button" class="link" data-act="form-event" data-date="${sel}">Añadir</button>` })}
          ${W.card('Próximas semanas', upcoming.length ? this.list(upcoming, true) : '<p class="muted">Nada previsto.</p>')}
        </div>
      </div>`;
    },
    list(items, withDate) {
      return `<ul class="agenda">${items.map((a) => {
        const K = KIND[a.kind];
        const attrs = a.ref ? `data-act="edit" data-col="${a.ref.col}" data-id="${a.ref.id}"` : a.kind === 'vaccine' ? 'data-act="go" data-to="salud"' : 'data-act="go" data-to="hitos"';
        return `<li><button type="button" class="ag ${K.cls}" ${attrs}>${withDate ? `<span class="ag-d"><b>${new Date(U.parseDay(a.date)).getDate()}</b>${U.MONTHS[new Date(U.parseDay(a.date)).getMonth()]}</span>` : ''}${icon(K.ic)}<span><b>${U.esc(a.title)}</b><small>${K.name}${a.time ? ' · ' + a.time : ''}${withDate ? ' · ' + U.relDay(a.date) : ''}</small></span></button></li>`;
      }).join('')}</ul>`;
    }
  };
  N.actions['cal-day'] = (el) => { UI.st.calDay = el.dataset.day; UI.render(); };
  N.actions['cal-move'] = (el) => {
    const now = new Date(); const [y, m] = UI.st.calMonth || [now.getFullYear(), now.getMonth()];
    const d = new Date(y, m + Number(el.dataset.d), 1); UI.st.calMonth = [d.getFullYear(), d.getMonth()]; UI.render();
  };

  /* ======================= HITOS Y DIENTES ======================= */
  V.hitos = {
    render() {
      const tab = UI.st.seg.hitos || 'hitos';
      return UI.head('Hitos y dientes', 'Cada bebé tiene su ritmo: los rangos son orientativos') + UI.seg('hitos', [['hitos', 'Hitos del desarrollo'], ['dientes', 'Dientes']], tab) + (tab === 'dientes' ? this.teeth() : this.milestones());
    },
    milestones() {
      const map = Store.babyMap('milestones'); const age = S.ageMonths(); const b = S.baby();
      const maxM = 24; const x = (m) => (U.clamp(m, 0, maxM) / maxM) * 100;
      const done = Object.keys(map).length;
      const groups = Object.entries(N.MILESTONE_AREAS).map(([area, A]) => {
        const ms = N.MILESTONES.filter((m) => m.area === area);
        return W.card(A.name, `<ul class="ms">${ms.map((m) => {
          const d = map[m.id]; const at = d ? S.ageMonths(U.parseDay(d)) : null;
          const state = d ? 'done' : age > m.to ? 'late' : age >= m.from ? 'now' : 'next';
          return `<li><button type="button" class="ms-row ms-${state}" data-act="form-milestone" data-id="${m.id}">
            <span class="ms-check">${d ? icon('check') : ''}</span>
            <span class="ms-txt"><b>${m.name}</b><small>${d ? `${U.date(d, true)} · con ${U.ageShort(b.birth, U.parseDay(d))}` : state === 'now' ? 'Es buen momento' : `${m.from}–${m.to} meses`}</small></span>
            <span class="ms-track" aria-hidden="true"><i class="ms-range" style="left:${x(m.from)}%;width:${x(m.to) - x(m.from)}%;--mc:${A.color}"></i>${d ? `<i class="ms-dot" style="left:${x(at)}%"></i>` : ''}<i class="ms-age" style="left:${x(age)}%"></i></span>
          </button></li>`;
        }).join('')}</ul>`);
      });
      return `<p class="muted small pad-b">${S.prematureDays() ? `Se comparan con su edad corregida (${S.correctedText()}). ` : ''}${done} hitos conseguidos. La barra muestra el rango habitual (0–24 meses); la línea vertical es la edad actual. Si ves que pasa el rango sin avances, coméntalo en la próxima revisión.</p><div class="grid-3">${groups.join('')}</div>`;
    },
    teeth() {
      const map = Store.babyMap('teeth'); const n = Object.keys(map).length;
      const arch = (teeth, upper) => {
        const W2 = 320, H2 = 150, cx = 160, rx = 130, ry = 110;
        return teeth.map((t, i) => {
          const a = Math.PI * (0.08 + (0.84 * i) / (teeth.length - 1));
          const px = cx - rx * Math.cos(a), py = upper ? H2 - ry * Math.sin(a) + 4 : ry * Math.sin(a) - 4 + 0;
          const big = /molar/.test(t.name), w = big ? 30 : 22, h = big ? 28 : 30;
          const on = !!map[t.id];
          return `<g class="tooth ${on ? 'on' : ''}" data-act="form-tooth" data-id="${t.id}" data-tip="${U.esc(`${t.name}|${on ? 'Salió el ' + U.date(map[t.id], true) : 'Habitual: ' + t.m + ' meses'}`)}" tabindex="0" role="button" aria-label="${t.name}">
            <rect x="${(px - w / 2).toFixed(1)}" y="${(py - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${big ? 9 : 10}" transform="rotate(${((a * 180) / Math.PI - 90) * (upper ? 1 : -1)} ${px.toFixed(1)} ${py.toFixed(1)})"/>
            <text x="${px.toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="middle">${t.id}</text></g>`;
        }).join('');
      };
      const list = [...N.TEETH.upper, ...N.TEETH.lower].filter((t) => map[t.id]).sort((a, b) => map[a.id].localeCompare(map[b.id]));
      return `<div class="grid-2">${W.card(`${n} de 20 dientes de leche`, `
        <div class="teeth"><svg viewBox="0 0 320 320" class="chart teeth-svg" role="group" aria-label="Arcadas dentales">
          <text class="ax" x="160" y="14" text-anchor="middle">Arcada superior</text>
          <g transform="translate(0 16)">${arch(N.TEETH.upper, true)}</g>
          <g transform="translate(0 170)">${arch(N.TEETH.lower, false)}</g>
          <text class="ax" x="160" y="316" text-anchor="middle">Arcada inferior</text></svg></div>
        <p class="muted small">Toca un diente para anotar cuándo salió. Numeración FDI, vista de frente.</p>`)}
        ${W.card('Cronología', (list.length ? `<ul class="rows">${list.map((t) => `<li><button type="button" class="row" data-act="form-tooth" data-id="${t.id}"><span>${U.date(map[t.id], true)}</span><b>${t.name}</b><small>con ${U.ageShort(S.baby().birth, U.parseDay(map[t.id]))}</small></button></li>`).join('')}</ul>` : UI.empty('tooth', 'Aún sin dientes', 'El primero suele asomar entre los 6 y los 10 meses.')) +
          `<dl class="guide pad-t"><div><dt>Higiene</dt><dd>Desde el primer diente, cepillado 2 veces al día con pasta de 1000 ppm de flúor en cantidad de un grano de arroz.</dd></div><div><dt>Alivio</dt><dd>Mordedores fríos (no congelados) y masaje en la encía con el dedo limpio.</dd></div></dl>`)}</div>`;
    }
  };

  /* ======================= DIARIO ======================= */
  V.diario = {
    render() {
      const b = S.baby();
      const items = Store.list('diary').sort((a, c) => c.date.localeCompare(a.date));
      return UI.head('Diario', 'Primeras veces y recuerdos', `<button type="button" class="btn primary" data-act="form-diary">${icon('plus')}Nuevo recuerdo</button>`) +
        (items.length ? `<div class="diary">${items.map((d) => {
          const mood = N.MOODS.find((x) => x.id === d.mood) || N.MOODS[0];
          const src = d.photo || (d.photoId && N.Media.src(d.photoId));
          return `<article class="entry ${d.photo || d.photoId ? 'has-photo' : ''}" data-act="form-diary" data-id="${d.id}" tabindex="0">
            ${src ? `<img src="${src}" alt="Foto del ${U.date(d.date, true)}">` : d.photoId ? `<img data-photo="${d.photoId}" alt="Foto del ${U.date(d.date, true)}">` : ''}
            <div class="entry-b"><header><span class="mood" title="${mood.name}">${mood.emoji}</span><span><b>${U.dateLong(d.date)}</b><small>${U.ageText(b.birth, U.parseDay(d.date))}</small></span></header>
            <p>${U.esc(d.text)}</p></div></article>`;
        }).join('')}</div>` : UI.empty('book', 'El diario está vacío', 'Guarda aquí las primeras veces, frases y fotos.', `<button type="button" class="btn primary" data-act="form-diary">Escribir el primero</button>`));
    }
  };

  /* ======================= INFORME PARA EL PEDIATRA ======================= */
  V.informe = {
    data() {
      const b = S.baby(); const out = {};
      out.meas = ['weight', 'length', 'head'].map((k) => { const l = S.lastMeasure(k); return l && { k, v: l[k], date: l.date, p: S.percentile(k, b.sex, S.measureAge(l), l[k]) }; }).filter(Boolean);
      const days = []; for (let i = 7; i >= 1; i--) days.push(S.sleepDay(U.dayKey(U.addDays(Date.now(), -i))));
      const nights = days.map((d) => S.nightOf(d.key)).filter(Boolean);
      out.sleep = { total: U.avg(days, (d) => d.total), naps: U.avg(days, (d) => d.naps), day: U.avg(days, (d) => d.day), wakes: U.avg(nights, (n) => n.wakes), longest: U.avg(nights, (n) => n.longest) };
      const f7 = S.feeds().filter((f) => f.time > Date.now() - 7 * U.DAY && f.time < U.dayStart(Date.now()));
      out.feeds = { perDay: f7.length / 7, breast: f7.filter((f) => f.kind === 'breast').length / 7, ml: U.sum(f7.filter((f) => f.kind === 'bottle'), (f) => f.ml) / 7 };
      const d7 = S.diapers().filter((f) => f.time > Date.now() - 7 * U.DAY && f.time < U.dayStart(Date.now()));
      out.diapers = { perDay: d7.length / 7, wet: d7.filter((d) => d.kind !== 'dirty').length / 7, dirty: d7.filter((d) => d.kind !== 'wet').length / 7 };
      const stats = S.foodStats();
      out.foods = Object.keys(stats).length;
      out.reactions = Object.entries(stats).filter(([, s]) => s.reaction !== 'none').map(([id, s]) => ({ name: N.FOOD_BY_ID[id].name, level: s.reaction, when: s.reactions[0].time }));
      out.allergens = S.allergenStatus(stats);
      out.vax = S.vaccinePlan();
      out.meds = Store.list('meds').filter((m) => m.time > Date.now() - 30 * U.DAY);
      out.fever = Store.list('temps').filter((t) => t.value >= 38 && t.time > Date.now() - 30 * U.DAY);
      const next = S.upcoming()[0]; out.next = next;
      out.questions = S.upcoming().flatMap((a) => (a.questions || []).filter((q) => !q.done).map((q) => q.text));
      out.milestones = Object.entries(Store.babyMap('milestones')).sort((a, c) => c[1].localeCompare(a[1])).slice(0, 5).map(([id, d]) => ({ name: N.MILESTONES.find((m) => m.id === id).name, date: d }));
      out.teeth = Object.keys(Store.babyMap('teeth')).length;
      return out;
    },
    text(d) {
      const b = S.baby(); const L = [];
      L.push(`INFORME DE ${b.name.toUpperCase()} · ${U.dateLong(Date.now())}`);
      L.push(`Edad: ${U.ageText(b.birth)} (nacimiento ${U.date(b.birth, true)})${S.prematureDays(b) ? ` · prematuro de ${b.gestWeeks}+${b.gestDays || 0} semanas · edad corregida ${S.correctedText()}` : ''}`);
      L.push('', 'CRECIMIENTO'); d.meas.forEach((m) => L.push(`- ${N.METRICS[m.k].label}: ${U.num(m.v, N.METRICS[m.k].digits)} ${N.METRICS[m.k].unit} (P${Math.round(m.p)}, ${U.date(m.date)})`));
      L.push('', 'SUEÑO (media 7 días)', `- Total ${U.dur(d.sleep.total)} · ${U.num(d.sleep.naps, 1)} siestas (${U.dur(d.sleep.day)}) · ${U.num(d.sleep.wakes, 1)} despertares/noche · tramo más largo ${U.dur(d.sleep.longest)}`);
      L.push('', 'ALIMENTACIÓN (media 7 días)', `- ${U.num(d.feeds.perDay, 1)} tomas/día (${U.num(d.feeds.breast, 1)} al pecho)${d.feeds.ml ? ` · ${Math.round(d.feeds.ml)} ml/día en biberón` : ''}`, `- BLW: ${d.foods} alimentos probados`);
      L.push(`- Alérgenos introducidos: ${d.allergens.filter((a) => a.state === 'done' || a.state === 'maintain').map((a) => a.name).join(', ') || 'ninguno'}`);
      L.push(`- En curso: ${d.allergens.filter((a) => a.state === 'progress').map((a) => `${a.name} (${a.exposures}/3)`).join(', ') || 'ninguno'}`);
      if (d.reactions.length) L.push(`- Reacciones: ${d.reactions.map((r) => `${r.name} (${N.REACTIONS[r.level].name.toLowerCase()}, ${U.date(r.when)})`).join('; ')}`);
      L.push('', 'PAÑALES (media 7 días)', `- ${U.num(d.diapers.perDay, 1)}/día · ${U.num(d.diapers.wet, 1)} mojados · ${U.num(d.diapers.dirty, 1)} con caca`);
      L.push('', 'VACUNAS', `- Puestas: ${d.vax.filter((v) => v.state === 'done').length}/${d.vax.length}`, `- Pendientes: ${d.vax.filter((v) => v.state === 'due' || v.state === 'late').map((v) => v.name).join(', ') || 'ninguna'}`);
      if (d.fever.length) L.push('', 'FIEBRE (30 días)', ...d.fever.map((t) => `- ${U.date(t.time)} ${U.time(t.time)}: ${U.num(t.value)} ºC`));
      if (d.questions.length) L.push('', 'PREGUNTAS', ...d.questions.map((q) => `- ${q}`));
      return L.join('\n');
    },
    render() {
      const b = S.baby(); const d = this.data();
      const alDone = d.allergens.filter((a) => a.state === 'done' || a.state === 'maintain');
      return UI.head('Informe para el pediatra', 'Resumen listo para llevar a consulta', `<button type="button" class="btn primary" data-act="copy-report">${icon('copy')}Copiar resumen</button>`) + `
      <article class="report">
        <header class="rep-h"><div>${UI.logo()}</div><div><h2>${U.esc(b.name)}</h2><p>${U.ageText(b.birth)}${S.correctedText() ? ` (corregida: ${S.correctedText()})` : ''} · nacida/o el ${U.date(b.birth, true)}${b.blood ? ' · ' + U.esc(b.blood) : ''}</p></div>
          <div class="rep-date"><small>Generado</small><b>${U.date(Date.now(), true)}</b>${d.next ? `<small>Próxima cita: ${U.date(d.next.date)}</small>` : ''}</div></header>
        <div class="rep-grid">
          <section><h3>${icon('ruler')} Crecimiento</h3><dl class="facts">${d.meas.map((m) => `<div><dt>${N.METRICS[m.k].label}</dt><dd><b>${U.num(m.v, N.METRICS[m.k].digits)} ${N.METRICS[m.k].unit}</b> · P${Math.round(m.p)} <small>(${U.date(m.date)})</small></dd></div>`).join('')}</dl></section>
          <section><h3>${icon('moon')} Sueño · media 7 días</h3><dl class="facts"><div><dt>Total</dt><dd><b>${U.dur(d.sleep.total)}</b></dd></div><div><dt>Siestas</dt><dd>${U.num(d.sleep.naps, 1)}/día · ${U.dur(d.sleep.day)}</dd></div><div><dt>Noche</dt><dd>${U.num(d.sleep.wakes, 1)} despertares · tramo más largo ${U.dur(d.sleep.longest)}</dd></div></dl></section>
          <section><h3>${icon('bottle')} Leche y pañales</h3><dl class="facts"><div><dt>Tomas</dt><dd><b>${U.num(d.feeds.perDay, 1)}/día</b>${d.feeds.ml ? ` · ${Math.round(d.feeds.ml)} ml/día biberón` : ''}</dd></div><div><dt>Pañales</dt><dd>${U.num(d.diapers.perDay, 1)}/día · ${U.num(d.diapers.dirty, 1)} con caca</dd></div></dl></section>
          <section><h3>${icon('leaf')} BLW</h3><dl class="facts"><div><dt>Alimentos</dt><dd><b>${d.foods}</b> probados</dd></div><div><dt>Alérgenos</dt><dd>${alDone.length ? alDone.map((a) => a.name).join(', ') : 'Ninguno completado'}</dd></div>
            <div><dt>En curso</dt><dd>${d.allergens.filter((a) => a.state === 'progress').map((a) => `${a.name} ${a.exposures}/3`).join(', ') || '—'}</dd></div>
            <div><dt>Reacciones</dt><dd>${d.reactions.length ? d.reactions.map((r) => `<span class="txt-warn">${r.name}</span> (${N.REACTIONS[r.level].name.toLowerCase()}, ${U.date(r.when)})`).join('; ') : 'Ninguna'}</dd></div></dl></section>
          <section><h3>${icon('syringe')} Vacunas</h3><dl class="facts"><div><dt>Puestas</dt><dd><b>${d.vax.filter((v) => v.state === 'done').length}</b> de ${d.vax.length}</dd></div><div><dt>Pendientes</dt><dd>${d.vax.filter((v) => v.state === 'due' || v.state === 'late').map((v) => v.name).join(', ') || 'Ninguna'}</dd></div>
            <div><dt>Fiebre (30 d)</dt><dd>${d.fever.length ? d.fever.map((t) => `${U.num(t.value)} ºC el ${U.date(t.time)}`).join(', ') : 'Sin episodios'}</dd></div></dl></section>
          <section><h3>${icon('star')} Desarrollo</h3><dl class="facts">${d.milestones.map((m) => `<div><dt>${U.date(m.date)}</dt><dd>${m.name}</dd></div>`).join('')}<div><dt>Dientes</dt><dd>${d.teeth}</dd></div></dl></section>
        </div>
        <section class="rep-q"><h3>${icon('list')} Preguntas para la consulta</h3>${d.questions.length ? `<ol>${d.questions.map((q) => `<li>${U.esc(q)}</li>`).join('')}</ol>` : '<p class="muted">Añade preguntas en la cita desde Salud.</p>'}</section>
      </article>
      <textarea id="report-text" class="sr-only" readonly aria-hidden="true" tabindex="-1">${U.esc(this.text(d))}</textarea>`;
    }
  };
  N.actions['copy-report'] = () => {
    const ta = document.getElementById('report-text');
    const fallback = () => { ta.classList.remove('sr-only'); ta.classList.add('report-plain'); ta.removeAttribute('aria-hidden'); ta.select(); UI.toast('Texto seleccionado: cópialo con Ctrl+C'); };
    try { navigator.clipboard.writeText(ta.value).then(() => UI.toast('Resumen copiado. Pégalo en un correo o mensaje'), fallback); } catch (e) { fallback(); }
  };

  /* ======================= AJUSTES ======================= */
  V.ajustes = {
    render() {
      const s = Store.state.settings;
      const bytes = (() => { try { return new Blob([JSON.stringify(Store.state)]).size; } catch (e) { return 0; } })();
      return UI.head('Ajustes', 'Preferencias, bebés y copia de seguridad') + `
      <div class="grid-2">
        ${W.card('Apariencia', `${UI.seg('theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Noche']], s.theme)}
          <p class="muted small">El modo noche reduce el brillo para las tomas de madrugada.</p>`)}
        ${W.card('Quién registra', `<p>Ahora mismo: <b>${U.esc(s.caregiver)}</b></p><button type="button" class="btn soft" data-act="caregiver">${icon('users')}Cambiar cuidador</button>`)}
        ${W.card('Bebés', `<div class="baby-list">${Store.state.babies.map((b) => `<button type="button" class="baby-row" data-act="pick-edit-baby" data-id="${b.id}"><span class="avatar" style="--av:${b.sex === 'm' ? 'var(--c-sleep)' : 'var(--c-feed)'}">${U.esc(b.name[0])}</span><span><b>${U.esc(b.name)}</b><small>${U.ageText(b.birth)}</small></span>${icon('edit')}</button>`).join('')}
          <button type="button" class="baby-row add" data-act="new-baby"><span class="avatar">+</span><span><b>Añadir bebé</b></span></button></div>`)}
        ${W.card('Tus datos', `<p class="muted small">Todo se guarda solo en este dispositivo: registros ${(bytes / 1024).toFixed(0)} KB<span id="storage-est"></span>. Nada sale de tu navegador. La copia incluye las fotos.${Store.persistent ? '' : ' <b class="txt-warn">Este navegador no permite guardar: los cambios se perderán al cerrar.</b>'}</p>
          <div class="btn-row"><button type="button" class="btn soft" data-act="export">${icon('download')}Exportar copia</button><button type="button" class="btn soft" data-act="import">${icon('upload')}Importar copia</button></div>
          <div class="btn-row"><button type="button" class="btn soft" data-act="load-demo">${icon('spark')}Cargar datos de ejemplo</button><button type="button" class="btn ghost danger" data-act="wipe">${icon('trash')}Borrar todo</button></div>`)}
        ${W.card('Fuentes', `<ul class="sources"><li>Curvas de crecimiento: OMS, Child Growth Standards (2006).</li><li>Calendario vacunal: Consejo Interterritorial del SNS, calendario común 2025.</li><li>Sueño: recomendaciones de la AASM y la AAP.</li><li>BLW y alérgenos: AEP y ESPGHAN.</li></ul><p class="muted small">Nido es una herramienta de registro. No sustituye el consejo de tu pediatra.</p>`)}
        ${W.card('Nido en tu móvil', this.install())}
      </div>`;
    },
    install() {
      const I = N.install;
      if (I.standalone()) return `<p>${UI.pill('Instalada', 'good')} Nido está en tu pantalla de inicio y funciona sin conexión.</p>`;
      if (I.framed()) return '<p class="muted small">Abre Nido en su propia pestaña (no dentro de otra página) para instalarla y usarla sin conexión.</p>';
      return `<p class="muted small">Instálala para abrirla como una app, a pantalla completa y sin conexión.${I.offline() ? ' Ya está preparada para funcionar sin internet.' : ''}</p>
        ${I.prompt ? `<div class="btn-row"><button type="button" class="btn primary" data-act="install">${icon('download')}Instalar Nido</button></div>` : ''}
        <dl class="guide pad-t"><div><dt>iPhone y iPad</dt><dd>En Safari, toca Compartir y después «Añadir a pantalla de inicio».</dd></div><div><dt>Android</dt><dd>En Chrome, menú ⋮ y «Instalar aplicación».</dd></div></dl>`;
    },
    mount(root) {
      N.Media.usage().then((e) => {
        const el = root.querySelector('#storage-est');
        if (e && e.usage != null && el) el.textContent = ` · total con fotos ${(e.usage / 1048576).toFixed(1)} MB de ${Math.round(e.quota / 1048576)} MB disponibles`;
      });
    }
  };
  N.actions.seg = ((orig) => (el) => {
    if (el.dataset.seg === 'theme') { Store.state.settings.theme = el.dataset.val; Store.commit(); UI.applyTheme(); return; }
    orig(el);
  })(N.actions.seg);
  N.actions['pick-edit-baby'] = (el) => { Store.state.activeBabyId = el.dataset.id; Store.commit(); N.Forms.baby(S.baby()); };
  N.actions['load-demo'] = () => UI.confirm('¿Cargar datos de ejemplo?', 'Se sustituirán los datos actuales por tres semanas de ejemplo de Lucía, 6 meses.', 'Cargar ejemplo', () => { N.seedDemo(); N.Media.gc(); UI.go('hoy'); UI.toast('Datos de ejemplo cargados'); });
  N.actions.wipe = () => UI.confirm('¿Borrar todos los datos?', 'Se eliminarán todos los bebés y registros de este dispositivo. Exporta antes una copia si quieres conservarlos.', 'Borrar todo', () => { Store.reset(); N.Media.clear(); UI.go('hoy'); });
  /* La copia incluye las fotos de IndexedDB para poder restaurarlo todo. */
  const backup = async () => Object.assign({}, Store.state, { media: await N.Media.exportAll().catch(() => ({})) });
  N.actions.export = async () => {
    const json = JSON.stringify(await backup());
    UI.sheet({
      title: 'Exportar copia', footer: false,
      body: `<p class="muted small">Guarda este texto en un lugar seguro o compártelo con tu pareja para importarlo en otro dispositivo.</p>
        <textarea id="f-export" class="code" rows="8" readonly>${U.esc(json)}</textarea>
        <div class="btn-row"><button type="button" class="btn primary" data-act="copy-export">${icon('copy')}Copiar</button>${window.self === window.top ? '' : '<!-- dentro de un marco las descargas están bloqueadas -->'}<button type="button" class="btn soft" data-act="download-export" ${window.self === window.top ? '' : 'hidden'}>${icon('download')}Descargar archivo</button></div>`
    });
  };
  N.actions['copy-export'] = () => { const ta = document.getElementById('f-export'); try { navigator.clipboard.writeText(ta.value).then(() => UI.toast('Copia copiada'), () => { ta.select(); UI.toast('Texto seleccionado: cópialo con Ctrl+C'); }); } catch (e) { ta.select(); } };
  N.actions['download-export'] = async () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(await backup())], { type: 'application/json' }));
    a.download = `nido-${U.today()}.json`; document.body.appendChild(a); a.click(); a.remove();
  };
  N.actions.import = () => {
    UI.sheet({
      title: 'Importar copia', submit: 'Importar',
      body: `<p class="muted small">Pega el texto de una copia o elige el archivo .json. Sustituirá los datos actuales.</p><textarea id="f-import" name="json" class="code" rows="7" placeholder='{"version":1,…}'></textarea><input type="file" id="f-importfile" accept="application/json,.json">`,
      onMount: (form) => form.querySelector('#f-importfile').addEventListener('change', (e) => { const r = new FileReader(); r.onload = () => { form.querySelector('#f-import').value = r.result; }; r.readAsText(e.target.files[0]); }),
      onSubmit: (x) => {
        let d;
        try { d = JSON.parse(x.json); if (!d.babies) throw new Error(); }
        catch (e) { UI.toast('El texto no es una copia válida de Nido'); return false; }
        const media = d.media || {}; delete d.media;
        N.Media.clear().then(() => N.Media.importAll(media)).then((ok) => {
          // Sin IndexedDB, las fotos vuelven a guardarse dentro de cada recuerdo.
          if (!ok) (d.diary || []).forEach((r) => { if (r.photoId && media[r.photoId]) { r.photo = media[r.photoId]; delete r.photoId; } });
          Store.replace(d); UI.go('hoy'); UI.toast('Copia importada');
        });
      }
    });
  };

  /* ======================= BIENVENIDA ======================= */
  V.bienvenida = {
    render() {
      return `<section class="welcome">${UI.logo()}<h1>Nido</h1><p class="lead">El cuaderno de tu bebé: sueño, tomas, BLW, crecimiento, salud y recuerdos, en un solo lugar y solo en tu dispositivo.</p>
        <div class="btn-row center"><button type="button" class="btn primary" data-act="new-baby">${icon('plus')}Añadir a mi bebé</button><button type="button" class="btn soft" data-act="load-demo-now">${icon('spark')}Ver la demo</button></div></section>`;
    }
  };
  N.actions['load-demo-now'] = () => { N.seedDemo(); UI.go('hoy'); };
})(window.Nido = window.Nido || {});
