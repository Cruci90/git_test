/* ==========================================================================
   Nido · Vistas de seguimiento: BLW, Crecimiento y Salud
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, Charts, W, icon } = N;
  const V = N.views;

  /* ======================= BLW ======================= */
  const STATUS = {
    liked: { name: 'Le gusta', tone: 'good' }, tried: { name: 'Probado', tone: 'soft' },
    disliked: { name: 'No le gusta', tone: 'muted' }, reaction: { name: 'Reacción', tone: 'warn' }
  };
  const AL_STATE = {
    pending: { name: 'Sin introducir', tone: 'muted' }, progress: { name: 'Introduciendo', tone: 'soft' },
    done: { name: 'Introducido', tone: 'good' }, maintain: { name: 'Mantener', tone: 'warn' }, reaction: { name: 'Reacción', tone: 'crit' }
  };

  V.blw = {
    render() {
      const b = S.baby();
      const stats = S.foodStats(); const tried = Object.keys(stats).length;
      const meals = S.meals();
      const start = meals.length ? meals[0].time : null;
      const blwDay = start ? Math.floor((U.dayStart(Date.now()) - U.dayStart(start)) / U.DAY) + 1 : 0;
      const als = S.allergenStatus(stats);
      const weekAgo = Date.now() - 7 * U.DAY;
      const colorsWeek = new Set(); meals.filter((m) => m.time > weekAgo).forEach((m) => m.foods.forEach((f) => colorsWeek.add(N.FOOD_BY_ID[f.id].col)));
      const byCat = Object.entries(N.FOOD_CATS).map(([id, c]) => { const all = N.FOODS.filter((f) => f.c === id); return { id, ...c, total: all.length, tried: all.filter((f) => stats[f.id]).length }; });
      const reactions = Object.entries(stats).filter(([, s]) => s.reaction !== 'none');
      const gags = meals.filter((m) => m.gag).length;

      return UI.head('BLW · Alimentación complementaria', start ? `Día ${blwDay} desde el primer bocado (${U.date(start)}) · ${meals.length} comidas registradas` : 'Empieza hacia los 6 meses, cuando se sienta con apoyo', `<button type="button" class="btn primary" data-act="form-meal">${icon('plus')}Nueva comida</button>`) + `
      <div class="grid-blw">
        ${W.card('', `<div class="hundred">
          <div class="ring-box">${Charts.ring(tried, 100, 150, 14, 'r-blw')}<div class="ring-c"><b>${tried}</b><span>de 100</span></div></div>
          <div><h2>Reto 100 alimentos antes del año</h2><p class="muted">${tried ? `Lleva ${tried} alimentos distintos. ${100 - tried > 0 ? `Faltan ${100 - tried}.` : '¡Reto conseguido!'}` : 'Cada alimento nuevo cuenta.'}</p>
          <ul class="cat-bars">${byCat.map((c) => `<li><span>${c.name}</span><span class="cat-track"><i style="width:${(c.tried / c.total) * 100}%;background:${c.color}"></i></span><b>${c.tried}/${c.total}</b></li>`).join('')}</ul></div></div>`, { cls: 'span-2' })}
        ${W.card('Arcoíris de la semana', `<div class="rainbow">${Object.entries(N.RAINBOW).map(([k, c]) => `<div class="rb ${colorsWeek.has(k) ? 'on' : ''}" data-tip="${c.name}|${colorsWeek.has(k) ? 'Comido esta semana' : 'Aún no esta semana'}"><i style="--rb:${c.hex}"></i><span>${c.name.split(' ')[0]}</span></div>`).join('')}</div>
          <p class="muted small">${colorsWeek.size}/7 colores en los últimos 7 días. La variedad de color es variedad de nutrientes.</p>
          <div class="mini-stats"><span><b>${gags}</b> comidas con arcadas</span><span><b>${meals.filter((m) => m.choke).length}</b> atragantamientos</span><span><b>${reactions.length}</b> alimentos con reacción</span></div>`)}
      </div>
      ${W.card('Alérgenos', `<p class="muted small pad-b">Introduce cada alérgeno solo, por la mañana y de uno en uno. Tras 3 exposiciones sin reacción se considera introducido; después mantenlo 1–2 veces por semana.</p>
        <div class="allergens">${als.map((a) => `<div class="al al-${a.state}">
          <span class="al-e">${a.emoji}</span><b>${a.name}</b>
          <span class="al-dots" aria-label="${a.exposures} de 3 exposiciones">${[0, 1, 2].map((i) => `<i class="${i < a.exposures ? 'on' : ''}"></i>`).join('')}</span>
          ${UI.pill(AL_STATE[a.state].name, AL_STATE[a.state].tone)}
          <small>${a.last ? `última: ${U.relDay(U.dayKey(a.last))}` : a.foods.map((f) => f.name).slice(0, 2).join(', ')}</small></div>`).join('')}</div>`)}
      ${this.catalog(stats)}
      <div class="grid-2">
        ${W.card('Últimas comidas', meals.length ? W.timeline(meals.slice(-8).reverse().map((m) => ({ t: m.time, kind: 'meal', rec: m, col: 'meals' })), { date: true }) : UI.empty('leaf', 'Aún no hay comidas', 'Registra la primera comida para empezar el seguimiento.'))}
        ${this.safety()}
      </div>`;
    },
    catalog(stats) {
      const fl = UI.st.foodFilter, q = UI.st.foodQuery.toLowerCase();
      let foods = N.FOODS.filter((f) => {
        const s = stats[f.id];
        if (fl === 'tried' && !s) return false;
        if (fl === 'pending' && s) return false;
        if (fl === 'liked' && !(s && s.status === 'liked')) return false;
        if (fl === 'allergen' && !f.a) return false;
        if (fl === 'reaction' && !(s && s.status === 'reaction')) return false;
        return !q || f.name.toLowerCase().includes(q);
      });
      return W.card('Catálogo de alimentos', `<div class="cat-tools">${UI.seg('foodFilter', [['all', 'Todos'], ['tried', 'Probados'], ['liked', 'Le gustan'], ['pending', 'Por probar'], ['allergen', 'Alérgenos'], ['reaction', 'Con reacción']], fl)}
        <input type="search" id="food-search" class="food-q" placeholder="Buscar…" value="${U.esc(UI.st.foodQuery)}" aria-label="Buscar alimento"></div>
        <div class="foods" id="foods">${foods.map((f) => {
          const s = stats[f.id];
          return `<button type="button" class="food ${s ? 'is-' + s.status : 'is-new'}" data-act="food-detail" data-id="${f.id}">
            <span class="fe">${f.emoji}</span><b>${f.name}</b>
            <small>${s ? `${s.tries}× · ${STATUS[s.status].name}` : 'Por probar'}</small>
            ${f.a ? '<i class="dot-al" title="Alérgeno"></i>' : ''}${f.r ? '<i class="dot-risk" title="Preparar con cuidado"></i>' : ''}</button>`;
        }).join('') || '<p class="muted pad">Ningún alimento coincide.</p>'}</div>
        <p class="legend-line"><span><i class="dot-al"></i>Alérgeno</span><span><i class="dot-risk"></i>Riesgo de atragantamiento si no se prepara bien</span></p>`);
    },
    safety() {
      return W.card('Seguridad en la mesa', `<dl class="guide">
        <div><dt>Postura</dt><dd>Siempre sentado y erguido (90°), nunca recostado, en el coche o caminando. Un adulto delante todo el tiempo.</dd></div>
        <div><dt>Arcada o atragantamiento</dt><dd>La arcada es ruidosa (tose, se pone roja, saca la lengua): déjale resolver. El atragantamiento es silencioso y no puede toser: actúa con las maniobras de desobstrucción y llama al 112.</dd></div>
        <div><dt>Evitar antes del año</dt><dd>Miel, sal y azúcar añadidos, leche de vaca como bebida, frutos secos enteros, pez espada, atún rojo, tiburón y lucio, bebida de arroz, algas, y acelgas o espinacas en grandes cantidades.</dd></div>
        <div><dt>Formas de riesgo</dt><dd>Redondas y duras (uvas, cherrys, arándanos enteros) o crudas y duras (manzana, zanahoria). Corta a lo largo o cocina hasta que se aplasten entre tus dedos.</dd></div>
        <div><dt>La leche sigue siendo lo principal</dt><dd>Hasta el año, la comida es para descubrir; la leche aporta la mayor parte de la energía.</dd></div></dl>`);
    },
    mount(root) {
      const inp = root.querySelector('#food-search');
      if (inp) inp.addEventListener('input', () => {
        UI.st.foodQuery = inp.value;
        const q = inp.value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        root.querySelectorAll('#foods .food').forEach((el) => { el.hidden = q && !N.FOOD_BY_ID[el.dataset.id].name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q); });
      });
    }
  };
  N.actions['food-detail'] = (el) => {
    const f = N.FOOD_BY_ID[el.dataset.id]; const s = S.foodStats()[f.id];
    const hist = S.meals().filter((m) => m.foods.some((x) => x.id === f.id)).reverse();
    const al = f.a && N.ALLERGENS.find((a) => a.id === f.a);
    UI.sheet({
      title: `${f.emoji} ${f.name}`, footer: false,
      body: `<div class="food-detail">
        <div class="tags">${UI.pill(N.FOOD_CATS[f.c].name, 'soft')}${al ? UI.pill('Alérgeno: ' + al.name, 'warn') : ''}${f.r ? UI.pill('Preparar con cuidado', 'crit') : ''}${s ? UI.pill(STATUS[s.status].name, STATUS[s.status].tone) : UI.pill('Por probar', 'muted')}</div>
        <dl class="guide"><div><dt>De 6 a 9 meses</dt><dd>${f.s6}</dd></div><div><dt>Desde 9 meses (pinza)</dt><dd>${f.s9}</dd></div>${f.note ? `<div><dt>Ojo</dt><dd>${f.note}</dd></div>` : ''}</dl>
        ${s ? `<div class="kpis three">${W.kpi('Veces', s.tries)}${W.kpi('Primera vez', U.date(s.first))}${W.kpi('Cuánto come', N.EAT_AMOUNT[Math.round(s.amountAvg)])}</div>
          <h3 class="day-h">Historial</h3><ul class="rows">${hist.map((m) => { const x = m.foods.find((y) => y.id === f.id); return `<li><button type="button" class="row" data-act="edit" data-col="meals" data-id="${m.id}"><span>${U.date(m.time)} · ${(N.MEAL_TYPES.find((t) => t.id === m.mealType) || {}).name}</span><b>${['😖', '😐', '😋'][x.liked + 1]} ${N.EAT_AMOUNT[x.amount]}</b>${x.reaction !== 'none' ? UI.pill(N.REACTIONS[x.reaction].name, 'warn') : '<small></small>'}</button></li>`; }).join('')}</ul>` : ''}
        <button type="button" class="btn primary full" data-act="form-meal" data-food="${f.id}">${icon('plus')}Registrar comida con ${f.name.toLowerCase()}</button></div>`
    });
  };

  /* ======================= CRECIMIENTO ======================= */
  V.crecimiento = {
    render() {
      const b = S.baby(); const metric = UI.st.growthMetric; const M = N.METRICS[metric];
      const pts = S.measures().filter((m) => m[metric] != null).map((m) => ({ date: m.date, v: m[metric], age: S.measureAge(m), id: m.id }));
      const nowAge = S.ageMonths();
      const maxAge = Math.min(24, Math.max(6, Math.ceil(nowAge + 2)));
      const last = pts[pts.length - 1], prev = pts[pts.length - 2];
      const summary = ['weight', 'length', 'head'].map((k) => {
        const l = S.lastMeasure(k); if (!l) return W.kpi(N.METRICS[k].label, '–');
        const p = S.percentile(k, b.sex, S.measureAge(l), l[k]);
        return `<button type="button" class="kpi c-growth ${k === metric ? 'sel' : ''}" data-act="seg" data-seg="growthMetric" data-val="${k}"><span class="kpi-l">${N.METRICS[k].label}</span><b class="kpi-v">${U.num(l[k], N.METRICS[k].digits)} <small>${N.METRICS[k].unit}</small></b><span class="kpi-s">Percentil ${Math.round(p)} · ${U.date(l.date)}</span></button>`;
      }).join('');
      let trend = '';
      if (last && prev) {
        const days = (U.parseDay(last.date) - U.parseDay(prev.date)) / U.DAY;
        const diff = last.v - prev.v;
        trend = metric === 'weight' ? `+${Math.round((diff * 1000) / Math.max(1, days))} g/día desde el ${U.date(prev.date)} (${U.num(diff * 1000, 0)} g en ${Math.round(days)} días)` : `${diff >= 0 ? '+' : ''}${U.num(diff, 1)} cm desde el ${U.date(prev.date)}`;
      }
      const rows = S.measures().slice().reverse();
      return UI.head('Crecimiento', `Curvas de la OMS para ${b.sex === 'm' ? 'niños' : 'niñas'} de 0 a 2 años${S.prematureDays() ? ' · por edad corregida' : ''}`, `<button type="button" class="btn primary" data-act="form-measure">${icon('plus')}Nueva medida</button>`) + `
      <div class="kpis three">${summary}</div>
      ${W.card(`${M.label} (${M.unit})`, `<div class="chart-top">${UI.seg('growthMetric', [['weight', 'Peso'], ['length', 'Longitud'], ['head', 'P. craneal']], metric)}
        <ul class="legend"><li><i class="lg-dot"></i>${U.esc(b.name)}</li><li><i class="lg-p50"></i>Mediana (P50)</li><li><i class="lg-pin"></i>P15–P85</li><li><i class="lg-pout"></i>P3–P97</li></ul></div>
        ${trend ? `<p class="trend">${icon('spark')} ${trend}</p>` : ''}
        ${Charts.growth(metric, b.sex, pts, { maxAge, now: nowAge })}
        <p class="muted small">Lo importante no es el percentil concreto sino que siga su propia curva. Consulta si cruza dos líneas de percentil hacia arriba o hacia abajo.</p>`)}
      ${W.card('Todas las medidas', `<div class="scroll-x"><table class="tbl"><thead><tr><th>Fecha</th><th>Edad</th><th class="num">Peso</th><th class="num">Longitud</th><th class="num">P. craneal</th><th>Nota</th></tr></thead><tbody>
        ${rows.map((m) => { const age = S.measureAge(m); const cell = (k) => m[k] != null ? `${U.num(m[k], N.METRICS[k].digits)} <small>P${Math.round(S.percentile(k, b.sex, age, m[k]))}</small>` : '–';
          return `<tr data-act="form-measure" data-id="${m.id}" tabindex="0"><td>${U.date(m.date, true)}</td><td>${U.ageShort(b.birth, U.parseDay(m.date))}</td><td class="num">${cell('weight')}</td><td class="num">${cell('length')}</td><td class="num">${cell('head')}</td><td class="note-cell">${U.esc(m.note || '')}</td></tr>`; }).join('')}
      </tbody></table></div>`)}`;
    }
  };

  /* ======================= SALUD ======================= */
  V.salud = {
    render() {
      const tab = UI.st.seg.salud || 'citas';
      const act = { citas: ['form-appt', 'Nueva cita'], vacunas: null, meds: ['form-med', 'Medicación'], ficha: ['edit-baby', 'Editar ficha'] }[tab];
      return UI.head('Salud', 'Citas, vacunas, medicación y ficha médica', `${tab === 'meds' ? `<button type="button" class="btn soft" data-act="form-temp">${icon('thermo')}Temperatura</button>` : ''}${act ? `<button type="button" class="btn primary" data-act="${act[0]}">${icon('plus')}${act[1]}</button>` : ''}`) +
        UI.seg('salud', [['citas', 'Citas'], ['vacunas', 'Vacunas'], ['meds', 'Medicación y fiebre'], ['ficha', 'Ficha']], tab) +
        this[tab]();
    },
    apptCard(a) {
      const T = N.APPT_TYPES[a.type] || N.APPT_TYPES.otro;
      const d = new Date(U.parseDay(a.date));
      return `<article class="appt ${a.done ? 'done' : ''}" style="--tc:${T.color}">
        <div class="appt-date"><b>${d.getDate()}</b><span>${U.MONTHS[d.getMonth()]}</span></div>
        <div class="appt-body">
          <header><h3>${U.esc(a.title)}</h3><button type="button" class="icon-btn sm" data-act="form-appt" data-id="${a.id}" aria-label="Editar cita">${icon('edit')}</button></header>
          <p class="muted small">${UI.pill(T.name, 'soft')} ${U.relDay(a.date)}${a.time ? ' · ' + a.time : ''}${a.place ? ' · ' + U.esc(a.place) : ''}${a.doctor ? ' · ' + U.esc(a.doctor) : ''}</p>
          ${(a.questions || []).length ? `<ul class="qs">${a.questions.map((q, i) => `<li><label><input type="checkbox" ${q.done ? 'checked' : ''} data-act="q-toggle" data-id="${a.id}" data-i="${i}"><span>${U.esc(q.text)}</span></label></li>`).join('')}</ul>` : ''}
          ${a.outcome ? `<p class="outcome">${icon('info')} ${U.esc(a.outcome)}</p>` : ''}
        </div></article>`;
    },
    citas() {
      const b = S.baby(); const up = S.upcoming(); const past = S.appointments().filter((a) => a.date < U.today() || a.done).reverse();
      const ageNow = S.chronoMonths(); // revisiones por edad cronológica
      const nextCheck = N.CHECKUPS.find((c) => c.m > ageNow);
      const scheduled = nextCheck && S.appointments().some((a) => a.title.toLowerCase().includes(nextCheck.name.toLowerCase().replace('revisión ', '')));
      const suggestDate = nextCheck && (() => { const d = new Date(U.parseDay(b.birth)); d.setMonth(d.getMonth() + Math.floor(nextCheck.m)); return U.dayKey(d.getTime()); })();
      return `<div class="grid-2"><div class="stack">
        <h2 class="sec-h">Próximas</h2>
        ${!scheduled && nextCheck ? `<div class="suggest">${icon('spark')}<span>Le toca la <b>${nextCheck.name.toLowerCase()}</b> hacia el ${U.date(suggestDate)}.</span><button type="button" class="btn soft sm" data-act="form-appt" data-title="${nextCheck.name}" data-date="${suggestDate}">Programar</button></div>` : ''}
        ${up.length ? up.map((a) => this.apptCard(a)).join('') : UI.empty('calendar', 'Sin citas próximas', 'Añade la próxima revisión y apunta las preguntas que quieras hacer.')}
      </div><div class="stack"><h2 class="sec-h">Historial</h2>${past.map((a) => this.apptCard(a)).join('') || '<p class="muted">Sin citas anteriores.</p>'}</div></div>`;
    },
    vacunas() {
      const plan = S.vaccinePlan();
      const groups = {}; plan.forEach((v) => { (groups[v.m] = groups[v.m] || []).push(v); });
      const lbl = (m) => (m === 0 ? 'Al nacer' : m < 24 ? `${m} meses` : `${m / 12} años`);
      const st = { done: ['Puesta', 'good'], late: ['Pendiente', 'crit'], due: ['Le corresponde', 'warn'], soon: ['Próxima', 'soft'], future: ['Prevista', 'muted'] };
      const done = plan.filter((v) => v.state === 'done').length;
      return `<div class="vax-head"><div class="ring-box sm">${Charts.ring(done, plan.length, 84, 9, 'r-health')}<div class="ring-c"><b>${done}</b><span>de ${plan.length}</span></div></div>
        <p class="muted small">Calendario común del Consejo Interterritorial (España, 2025). Orientativo: cada comunidad autónoma puede tener variaciones. Toca una vacuna para registrarla con fecha y lote.</p></div>
        <ol class="vax">${Object.entries(groups).map(([m, vs]) => `<li class="vax-g ${vs.every((v) => v.state === 'done') ? 'all' : ''}"><div class="vax-m"><b>${lbl(+m)}</b><small>${U.date(vs[0].due, true)}</small></div>
          <div class="vax-list">${vs.map((v) => `<button type="button" class="vx vx-${v.state}" data-act="form-vaccine" data-code="${v.id}">${icon(v.state === 'done' ? 'check' : 'syringe')}<span><b>${v.name}</b><small>${v.given ? `Puesta el ${U.date(v.given.date, true)}${v.given.lot ? ' · lote ' + U.esc(v.given.lot) : ''}` : v.detail || ''}</small></span>${UI.pill(st[v.state][0], st[v.state][1])}</button>`).join('')}</div></li>`).join('')}</ol>`;
    },
    meds() {
      const meds = Store.list('meds').sort((a, b) => b.time - a.time);
      const temps = Store.list('temps').sort((a, b) => b.time - a.time);
      const lastBy = {}; meds.forEach((m) => { if (!lastBy[m.name]) lastBy[m.name] = m; });
      return `<div class="grid-2">
        ${W.card('Última dosis de cada medicamento', Object.values(lastBy).length ? `<ul class="rows">${Object.values(lastBy).map((m) => `<li><button type="button" class="row" data-act="form-med" data-id="${m.id}"><span><b>${U.esc(m.name)}</b></span><b>${m.dose ? U.num(m.dose, m.dose % 1 ? 1 : 0) + ' ' + m.unit : ''}</b><small data-ago="${m.time}"></small></button></li>`).join('')}</ul>` : UI.empty('pill', 'Sin medicación', 'Registra dosis para saber cuándo tocó la última.'))}
        ${W.card('Temperatura', temps.length ? `<ul class="rows">${temps.slice(0, 12).map((t) => `<li><button type="button" class="row" data-act="form-temp" data-id="${t.id}"><span>${U.date(t.time)} · ${U.time(t.time)}</span><b class="${t.value >= 38 ? 'txt-crit' : ''}">${U.num(t.value)} ºC</b><small>${t.method}</small></button></li>`).join('')}</ul>` : UI.empty('thermo', 'Sin registros', 'Anota la temperatura si tiene fiebre para enseñarla en consulta.'))}
      </div>
      ${W.card('Historial de medicación', `<ul class="rows">${meds.slice(0, 20).map((m) => `<li><button type="button" class="row" data-act="form-med" data-id="${m.id}"><span>${U.date(m.time)} · ${U.time(m.time)}</span><b>${U.esc(m.name)}</b><small>${m.dose ? U.num(m.dose, m.dose % 1 ? 1 : 0) + ' ' + m.unit : ''} ${U.esc(m.reason || '')}</small></button></li>`).join('')}</ul>`)}`;
    },
    ficha() {
      const b = S.baby();
      const row = (k, v) => `<div><dt>${k}</dt><dd>${v ? U.esc(v) : '<span class="muted">—</span>'}</dd></div>`;
      return `<div class="grid-2">${W.card('Datos de ' + U.esc(b.name), `<dl class="facts">
          ${row('Nacimiento', `${U.dateLong(b.birth)} de ${new Date(U.parseDay(b.birth)).getFullYear()}${b.birthTime ? ', ' + b.birthTime : ''}`)}
          ${row('Gestación', b.gestWeeks ? `${b.gestWeeks}+${b.gestDays || 0} semanas${S.prematureDays(b) ? ` · prematuro, fecha prevista ${U.date(S.dueDate(b), true)}` : ''}` : '')}
          ${row('Al nacer', [b.birthWeight && U.num(b.birthWeight, 2) + ' kg', b.birthLength && U.num(b.birthLength, 1) + ' cm', b.birthHead && 'PC ' + U.num(b.birthHead, 1) + ' cm'].filter(Boolean).join(' · '))}
          ${row('Grupo sanguíneo', b.blood)}${row('Alergias conocidas', b.allergies || 'Ninguna conocida')}
          ${row('Pediatra', b.pediatrician)}${row('Centro de salud', b.center)}${row('Tarjeta sanitaria', b.healthCard)}${row('Notas', b.notes)}</dl>`)}
        ${W.card('Teléfonos de urgencia', `<ul class="phones">
          <li>${icon('phone')}<span><b>Emergencias</b><small>Atragantamiento, convulsión, dificultad para respirar</small></span><span class="tel">112</span></li>
          <li>${icon('phone')}<span><b>Información Toxicológica</b><small>Ingestión de productos o medicamentos (24 h)</small></span><span class="tel">91 562 04 20</span></li>
          <li>${icon('phone')}<span><b>Consejo sanitario de tu comunidad</b><small>Dudas que no pueden esperar a la consulta</small></span><span class="tel muted">Añádelo en la ficha</span></li></ul>
          <p class="muted small">Los números se muestran como texto para que puedas copiarlos o marcarlos.</p>`)}</div>`;
    }
  };
})(window.Nido = window.Nido || {});
